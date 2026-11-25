import { browserStorage, practiceSession } from "./practice-session.js";
import { createPlayedHistory } from "./played-history.js";
import { createHandGrouping } from "./hand-group-ui.js";
import { installLanguageToggle } from "./i18n.js";
import {
  Game,
  rankName,
  wild,
  sorted,
  moves,
  label,
  chooseAI,
  returnableCards,
} from "./engine.js";
import { OnlineRoom } from "./online.js";
import { createEmotes } from "./emote-ui.js";
import { playFeedback } from "./play-feedback.js";
import { showRules } from "./rules.js";
import { practiceStats } from "./stats.js";
import { createPreferences } from "./preferences.js";
import { SelectionHistory, selectionRange } from "./selection.js";
import { tableStatus } from "./table-status.js";
import { nextMatchScorebook } from "./scorebook.js";
import { createScoreboard } from "./scoreboard-ui.js";
import { timeoutMove } from "./turn-clock.js";
import { createTurnClock } from "./turn-clock-ui.js";
import { cardHTML, isRedCard } from "./card-view.js";
const $ = (id) => document.getElementById(id),
  escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const loadPref = (key, fallback) => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  savePref = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };
const stats = practiceStats(browserStorage()),
  session = practiceSession();
const recovered = session.load();
const selectionHistory = new SelectionHistory();
let visualSignature = "",
  selectionAnchor = null;
let paused = !!recovered;
let game = recovered || new Game(),
  mode = "practice",
  net = null,
  room = null,
  selected = new Set(),
  suitSort = loadPref("guandan-sort", "rank") === "suit",
  timer = null,
  hintIndex = 0,
  declared = "",
  speed = [450, 950, 1600].includes(Number(loadPref("guandan-speed", "950")))
    ? Number(loadPref("guandan-speed", "950"))
    : 950,
  busy = false,
  connected = true,
  toastTimer = null;
const playerName = (p) =>
  p === 0 && !room?.spectator
    ? "You"
    : game.names?.[p] || ["You", "River", "Jade", "Lotus"][p];
const canPlay = () =>
  !room?.spectator &&
  game.phase === "playing" &&
  game.turn === 0 &&
  !paused &&
  (!room || room.stage === "playing") &&
  !busy &&
  (mode === "practice" || connected);
const owesTribute = () =>
  !room?.spectator && game.phase === "tribute" && game.returns.length > 0;
// Cards the player may hand back during tribute (10 or lower when they have one).
const returnable = (id) =>
  returnableCards(game.hands[0], game.returns?.[0]?.received).some(
    (c) => c.id === id,
  );
const tributeReady = () => selected.size === 1 && returnable([...selected][0]);
const canDeal = () =>
  !room?.spectator &&
  (!room ||
    room.seat === room.host ||
    (room.autoPlayMinutes && room.members[room.host]?.bot));
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 6000);
}
function status(message) {
  if ($("status").textContent !== message) $("status").textContent = message;
}
let modalOpener = null;
function modal(title, html) {
  if (!$("modal").open) modalOpener = document.activeElement;
  clearTimeout(timer);
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = html;
  if (!$("modal").open) $("modal").showModal();
}
function closeModal() {
  $("modal").close();
  modalOpener?.focus({ preventScroll: true });
}
const cardsHTML = (c, interactive = false) =>
  cardHTML(c, {
    level: game.level,
    interactive,
    selected: interactive && selected.has(c.id),
    unavailable: interactive && owesTribute() && !returnable(c.id),
  });
function legalSelection() {
  if (!selected.size) return [];
  return moves(
    game.hands[0].filter((c) => selected.has(c.id)),
    game.level,
    game.trick?.move,
    true,
  );
}
function connection(ok, message) {
  connected = ok;
  $("connection-banner").hidden = !net?.credentials || ok;
  $("connection-banner").querySelector("span").textContent = net?.stopped
    ? "Room unavailable. Choose another table."
    : "Connection interrupted. Your seat is reserved.";
  $("retry-btn").disabled = !!net?.stopped;
  $("connection").textContent =
    mode === "online"
      ? ok
        ? `Room ${room?.code || net?.credentials?.code || ""} · Connected`
        : "Reconnecting… your seat is saved"
      : "You + 3 AI Players";
  $("connection").classList.toggle("warning", !ok);
  if (!ok && message) $("connection").title = message;
  else $("connection").title = "";
  renderActions();
}
function setOnline(data) {
  const changed =
    !room ||
    room.version !== data.room.version ||
    room.members.some(
      (m, i) =>
        m?.online !== data.room.members[i]?.online ||
        m?.bot !== data.room.members[i]?.bot,
    );
  room = data.room;
  room.clockReceivedAt = Date.now();
  mode = "online";
  paused = false;
  if (data.game) {
    const own = data.game.hand;
    game = {
      ...data.game,
      hands: data.game.counts.map((n, i) =>
        i === 0 ? own : Array(n).fill(null),
      ),
    };
  } else {
    game = new Game({ doubleUp: room.doubleUp });
    game.names = [0, 1, 2, 3].map(
      (i) => room.members[(room.seat + i) % 4]?.name || "Open Seat",
    );
  }
  selected = new Set(
    [...selected].filter((id) => game.hands[0].some((c) => c.id === id)),
  );
  if (changed) render();
  connection(true);
}
function newNetwork() {
  net?.stop();
  net = new OnlineRoom(setOnline, connection);
  return net;
}
const AI_LEVEL_NAMES = {
  easy: "Beginner",
  normal: "Medium",
  hard: "Hard",
  expert: "Expert",
};
const aiLevelName = (level) => AI_LEVEL_NAMES[level] || "Medium";
const cardCount = (n) => `${n} card${n === 1 ? "" : "s"}`;
let botLevel = null;
function renderLobby() {
  if (room.spectator) {
    $("lobby").innerHTML =
      `<div class="lobby-heading"><span class="eyebrow">SPECTATOR</span><h1>Waiting for the Players</h1><p>You can watch the table without taking a seat.</p></div><div class="lobby-teams">${room.members.map((m, i) => `<div class="lobby-seat"><b translate="no">${m ? escape(m.name) : "—"}</b><span>${i % 2 ? "Team B" : "Team A"}</span><small>${m?.ready ? "Ready to play" : "Getting ready"}</small></div>`).join("")}</div>`;
    return;
  }
  const seatHTML = (i) => {
    const m = room.members[i];
    const host = room.seat === room.host;
    const status = m?.ai
      ? `AI · ${aiLevelName(m.level)}`
      : m
        ? m.ready
          ? "Ready to play"
          : m.online
            ? "Getting ready"
            : "Away · seat reserved"
        : host
          ? "Invite a friend or add an AI"
          : "Invite a friend";
    const buttons = m
      ? m.ai && host
        ? `<button class="quiet" data-remove-bot="${i}">Remove AI</button>`
        : ""
      : `<button class="quiet" data-seat="${i}">Take Seat</button>${host ? `<button class="quiet" data-add-bot="${i}">Add AI</button>` : ""}`;
    return `<div class="lobby-seat ${i === room.seat ? "mine" : ""} ${m?.ai ? "ai-seat" : ""}"><div class="avatar" translate="no">${m ? (m.ai ? "🤖" : escape(m.name.slice(0, 1).toUpperCase())) : "+"}</div><div><b>${m ? `<span translate="no">${escape(m.name)}</span>` : "Open Seat"}${i === room.seat ? " · You" : ""}</b><small>${status}</small></div><div class="seat-buttons">${buttons}</div></div>`;
  };
  const allReady = room.members.every((m) => m?.ready);
  $("lobby").innerHTML =
    `<div class="lobby-heading"><span class="eyebrow">FOUR FRIENDS. TWO TEAMS.</span><h1>Your table is waiting.</h1><p>Share the code. Take a seat opposite your partner.</p><p class="muted">Short on players? The host can fill any open seat with an AI.</p></div><div class="invite"><span>ROOM CODE</span><strong>${room.code}</strong><button data-action="copy">Copy Invite Link</button></div><div class="lobby-teams"><div><h2>Team A <small>Seats 1 & 3</small></h2>${seatHTML(0)}${seatHTML(2)}</div><div><h2>Team B <small>Seats 2 & 4</small></h2>${seatHTML(1)}${seatHTML(3)}</div></div>${
      room.seat === room.host
        ? `<div class="bot-level"><label for="bot-level">AI Level for New Seats</label><select id="bot-level">${Object.entries(
            AI_LEVEL_NAMES,
          )
            .map(
              ([v, label]) =>
                `<option value="${v}" ${(botLevel || preferences.difficulty) === v ? "selected" : ""}>${label}</option>`,
            )
            .join("")}</select></div>`
        : ""
    }<div class="lobby-bottom"><p>${room.members.filter(Boolean).length}/4 players · Double-up +${room.doubleUp}<br><small>Rooms expire after 24 hours without a game action.</small></p><div class="actions"><button data-action="leave">Leave Room</button><button data-action="ready" ${busy ? "disabled" : ""}>${room.members[room.seat].ready ? "Not Ready" : "I’m Ready"}</button>${room.seat === room.host ? `<button class="gold-btn" data-action="start" ${!allReady || busy ? "disabled" : ""}>Start Match</button>` : '<span class="waiting-host">The host starts when everyone is ready.</span>'}</div></div>`;
  const levelPicker = $("bot-level");
  if (levelPicker) levelPicker.onchange = (e) => (botLevel = e.target.value);
}
function render() {
  scoreboard.observe();
  document.body.dataset.teamPerspective =
    room && !room.spectator && room.seat % 2 ? "b" : "a";
  turnClock.tick();
  selectionHistory.sync(
    `${mode}:${room?.code || game.practiceId || "practice"}:${game.round}`,
  );
  preferences.observe();
  document.body.classList.toggle("spectating", !!room?.spectator);
  emotes.sync(room, game.practiceId);
  $("mode-label").textContent = room?.spectator
    ? "SPECTATOR"
    : mode === "online"
      ? "ONLINE 2V2"
      : "AI PRACTICE";
  $("practice-mode").classList.toggle("chosen", mode === "practice");
  $("online-mode").classList.toggle("chosen", mode === "online");
  $("practice-mode").setAttribute("aria-pressed", String(mode === "practice"));
  $("online-mode").setAttribute("aria-pressed", String(mode === "online"));
  $("room-btn").hidden = mode !== "online";
  $("new-btn").textContent = room?.spectator
    ? "Stop Watching"
    : mode === "online"
      ? "Leave Room"
      : "New Game";
  const lobby = mode === "online" && room?.stage === "lobby";
  $("lobby").hidden = !lobby;
  $("board").hidden = lobby;
  if (lobby) {
    renderLobby();
    return;
  }
  $("our-level").textContent = rankName(game.levels[0]);
  $("their-level").textContent = rankName(game.levels[1]);
  flashLevels();
  $("our-names").innerHTML =
    `<span>${room?.spectator ? escape(playerName(0)) : "You"}</span> & <span translate="no">${escape(playerName(2))}</span>`;
  $("their-names").textContent = `${playerName(1)} & ${playerName(3)}`;
  $("round").textContent =
    `HAND ${String(Math.max(1, game.round)).padStart(2, "0")}`;
  $("level-label").textContent = `Playing Level ${rankName(game.level)}`;
  $("wild-label").textContent = `${rankName(game.level)}♥ is wild`;
  for (let p = 0; p < 4; p++) {
    const el = $(`player-${p}`),
      seatStatus = tableStatus(game, p),
      place = seatStatus.place;
    el.dataset.team = p % 2 ? "b" : "a";
    el.title = room?.spectator
      ? p % 2
        ? "Team B"
        : "Team A"
      : p % 2
        ? "Opponents"
        : "Your Team";
    el.classList.toggle("table-owner", seatStatus.owner);
    el.classList.toggle("has-passed", seatStatus.passed && place < 0);
    let badge = el.querySelector(".seat-status");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "seat-status";
      el.append(badge);
    }
    badge.textContent = seatStatus.label;
    badge.hidden = !seatStatus.label;
    el.classList.toggle("active", game.phase === "playing" && game.turn === p);
    // A soft pulse shows when an AI seat is choosing its move.
    const aiSeat =
      mode === "practice" ? p !== 0 : !!room?.members[(room.seat + p) % 4]?.bot;
    el.classList.toggle(
      "thinking",
      aiSeat && !paused && game.phase === "playing" && game.turn === p,
    );
    el.querySelector(".avatar").textContent = playerName(p)
      .slice(0, 1)
      .toUpperCase();
    el.querySelector("b").innerHTML =
      (p === 0 && !room?.spectator
        ? "You"
        : `<span translate="no">${escape(playerName(p))}</span>`) +
      (p === 2 && !room?.spectator
        ? '<span class="partner-tag">PARTNER</span>'
        : "");
    let back = el.querySelector(".seat-back");
    if (!back) {
      back = document.createElement("i");
      back.className = "card-back seat-back";
      back.setAttribute("aria-hidden", "true");
      el.append(back);
    }
    back.hidden =
      (p === 0 && !room?.spectator) ||
      game.phase === "ready" ||
      !(game.counts?.[p] ?? game.hands[p].length);
    const offline = room && !room.members[(room.seat + p) % 4]?.online;
    el.querySelector("small").textContent =
      place >= 0
        ? `${["1st", "2nd", "3rd", "4th"][place]} place`
        : game.phase === "ready"
          ? p === 0
            ? "Your seat"
            : "27 cards"
          : `${cardCount(game.counts?.[p] ?? game.hands[p].length)}${room?.members[(room.seat + p) % 4]?.bot ? " · AI" : offline ? " · Away" : ""}`;
    el.querySelector("small").classList.toggle("finish-place", place >= 0);
    // What this seat did in the current trick, so the whole trick can be read
    // at a glance rather than only the play on top.
    let seatPlay = el.querySelector(".seat-play");
    if (!seatPlay) {
      seatPlay = document.createElement("span");
      seatPlay.className = "seat-play";
      el.append(seatPlay);
    }
    const lastMove = game.phase === "playing" ? game.lastMoves?.[p] || "" : "";
    const showPlay = !!lastMove && lastMove !== "Finished" && !seatStatus.owner;
    if (seatPlay.textContent !== (showPlay ? lastMove : ""))
      seatPlay.textContent = showPlay ? lastMove : "";
    seatPlay.hidden = !showPlay;
    seatPlay.classList.toggle("is-pass", lastMove === "Pass");
    // Few cards left: a player close to going out deserves attention.
    const left = game.counts?.[p] ?? game.hands[p].length;
    const live = game.phase === "playing" && left > 0 && place < 0;
    el.classList.toggle("low-cards", live && left <= 6);
    el.classList.toggle("critical-cards", live && left <= 2);
    el.querySelector("small").dataset.place = place >= 0 ? place + 1 : "";
  }
  renderHand();
  $("hand-count").textContent =
    game.phase === "ready"
      ? "27 cards to begin"
      : cardCount(game.hands[0].length);
  $("sort-btn").disabled = game.phase === "ready";
  const center = $("table-center");
  document.querySelector(".table").dataset.phase = game.phase;
  if (room?.stage === "closed") {
    center.innerHTML =
      '<p class="played-by">ROOM CLOSED</p><p class="table-title">A player left the table.</p><p class="table-subtitle">Create another room to play again.</p><button class="gold-btn" data-action="another-room">Find a New Table</button>';
    status("This match has ended. You can start a new room or practice.");
  } else if (["round-over", "game-over"].includes(game.phase)) {
    const result = game.result;
    if (
      mode === "practice" &&
      game.phase === "game-over" &&
      !game.__statsRecorded
    ) {
      game.__statsRecorded = true;
      stats.record(result.winner === 0);
    }
    center.innerHTML = `<p class="played-by">${result.gameWon ? "MATCH COMPLETE" : "HAND COMPLETE"}</p><p class="table-title">${room?.spectator ? (result.winner === 0 ? "Team A wins." : "Team B wins.") : result.winner === 0 ? "Your team wins." : "Opponents win."}</p><p class="table-subtitle">${result.gameWon ? "The climb to Ace is complete." : `1st & ${result.partnerPlace === 2 ? "2nd" : result.partnerPlace === 3 ? "3rd" : "4th"} · Now on ${rankName(game.levels[result.winner])}`}</p>${levelSummary(result)}${canDeal() ? `<button id="next-btn" class="gold-btn">${result.gameWon ? "Play Again" : "Deal Next Hand"} ↗</button>` : '<p class="table-subtitle">Waiting for the host to deal.</p>'}`;
    $("last-action").textContent = result.order
      .map((p, i) => `${i + 1}. ${playerName(p)}`)
      .join(" · ");
    status(
      result.demotion
        ? "The failed Ace team returns to level 2."
        : `A ${result.partnerPlace === 2 ? "double-up" : `1–${result.partnerPlace}`} finish. ${result.gameWon ? "Match complete." : `Winning promotion: +${result.delta}.`}`,
    );
  } else if (game.phase === "tribute") {
    center.innerHTML = `<div class="watermark">进贡</div><p class="combo-name">A little give and take.</p><p class="table-subtitle">${owesTribute() ? "Select a card of 10 or lower to return." : "Waiting for tribute returns."}</p>`;
    status(
      owesTribute()
        ? `Return one card to ${playerName(game.returns[0].to)}.`
        : "Your hand is ready. Waiting for the other players to return tribute.",
    );
    $("last-action").textContent = "The highest tribute payer will lead.";
  } else if (game.phase === "playing") {
    if (game.trick) {
      const m = game.trick.move;
      center.innerHTML = `<p class="played-by played-owner" data-team="${game.trick.player % 2 ? "b" : "a"}"><span translate="no">${escape(playerName(game.trick.player))}</span><span>Played</span></p><div class="played-cards" data-count="${m.cards.length}">${m.cards.map((c) => cardsHTML(c)).join("")}</div><p class="combo-name ${m.bomb ? "bomb-label" : ""}">${label(m)}</p>`;
      const subs = m.cards.flatMap((c, i) =>
        wild(c, game.level)
          ? [`${rankName(c.r)}♥ → ${rankName(m.as[i].r)}${m.as[i].s}`]
          : [],
      );
      $("last-action").textContent = subs.length
        ? `Declared: ${subs.join(" · ")}`
        : "";
      if (!subs.length)
        $("last-action").innerHTML =
          `<span>${game.passes} / 3</span> <span>Passes</span>`;
    } else {
      center.innerHTML = `<div class="watermark">掼蛋</div><p class="table-title">${game.turn === 0 && !room?.spectator ? "The table is yours." : `${escape(playerName(game.turn))} has the lead.`}</p><p class="table-subtitle">A fresh trick. Any legal combination.</p>`;
      $("last-action").textContent =
        `Level Team: ${game.declarer === 0 ? "Your Team" : "Opponents"} · Level ${rankName(game.level)}`;
    }
    status(
      game.turn === 0
        ? game.trick
          ? game.trick.player === 2 && !room?.spectator
            ? "Your partner is winning this trick. Pass to let it stand, or play over it."
            : `Your turn. Beat the ${game.trick.move.type.toLowerCase()} or pass.`
          : "Your lead. Play any legal combination."
        : `${playerName(game.turn)} ${mode === "online" ? "is up." : "is thinking…"}`,
    );
  } else {
    center.innerHTML =
      '<div class="watermark">掼蛋</div><p class="table-title">A good hand. A better partnership.</p><p class="table-subtitle">Climb together from 2 to Ace.</p><button class="gold-btn" id="start-btn">Deal a Practice Hand ↗</button>';
    $("last-action").textContent = "108 Cards · 4 Players · 2 Teams";
    status("Play with an AI partner, or choose Online 2v2 to invite friends.");
  }
  $("status").classList.toggle("warning", canPlay() || owesTribute());
  $("pause-btn").hidden = mode !== "practice" || game.phase !== "playing";
  $("pause-btn").textContent = paused ? "Resume" : "Pause";
  $("pause-btn").setAttribute("aria-pressed", String(paused));
  $("practice-notice").hidden = mode !== "practice" || game.phase === "ready";
  $("practice-notice").textContent = paused
    ? "Practice paused. Resume when you are ready."
    : "Practice saved on this device.";
  if (paused) status("Practice paused. Resume when you are ready.");
  $("organize-btn").disabled = !game.hands[0].length || game.phase === "ready";
  const reminder = $("table-reminder");
  reminder.hidden = game.phase !== "playing";
  reminder.innerHTML = game.trick
    ? `<span>To Beat</span><strong>${label(game.trick.move)}</strong><span translate="no">${escape(playerName(game.trick.player))}</span>`
    : "<span>Your Next Play</span><strong>Any Legal Combination</strong>";
  const latestPlay = game.playedCards?.at(-1);
  if (!game.trick && latestPlay && game.phase === "playing") {
    reminder.innerHTML += `<span class="previous-trick"><span>Last Play</span>: <span translate="no">${escape(playerName(latestPlay.player))}</span> · <span>${label(latestPlay.move)}</span></span>`;
  }
  if (mode === "practice") {
    const saved = session.save(game);
    if (!paused && !saved)
      $("practice-notice").textContent = "Practice · Session Only";
  }
  if (room?.spectator) {
    status("Watching live · All hands are private.");
    $("hand-count").textContent = "Spectator";
  }
  document.querySelector(".team-score > span").firstChild.textContent =
    room?.spectator ? "Team A " : "Your Team ";
  document.querySelector(
    ".team-score.opponents > span",
  ).firstChild.textContent = room?.spectator ? "Team B " : "Opponents ";
  document.querySelector(".hand-heading h1").firstChild.textContent =
    room?.spectator ? "Live Table " : "Your Hand ";
  playedHistory.refresh();
  renderActions();
  const nextVisual = `${mode}:${room?.code || game.practiceId || "practice"}:${game.round}:${game.playedCards?.length || 0}`;
  if (visualSignature !== nextVisual) {
    const initial = !visualSignature;
    visualSignature = nextVisual;
    if (!initial && latestPlay) {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        $("table-center")
          .querySelectorAll(".played-cards .card")
          .forEach((card, i) =>
            card.animate(
              [
                { opacity: 0, transform: "translateY(10px) scale(.96)" },
                { opacity: 1, transform: "translateY(0) scale(1)" },
              ],
              { duration: 220, delay: Math.min(i, 5) * 22, easing: "ease-out" },
            ),
          );
    }
  }
}
// Both teams' levels after a hand, with the winners' promotion called out.
function levelSummary(result) {
  // Only the old Ace declarers can be demoted. Winners otherwise climb to at
  // least 3, so a winner on 2 means the winners themselves were demoted.
  const demoted = !result.demotion
    ? -1
    : game.levels[result.winner] === 2
      ? result.winner
      : 1 - result.winner;
  const team = (t) => {
    const name = room?.spectator
      ? t === 0
        ? "Team A"
        : "Team B"
      : t === 0
        ? "Your Team"
        : "Opponents";
    const won = result.winner === t;
    const change =
      demoted === t
        ? "Back to 2"
        : won
          ? result.gameWon
            ? "Match Won"
            : `+${result.delta}`
          : "";
    return `<div class="level-result ${won ? "won" : ""}" data-team="${t ? "b" : "a"}"><span>${name}</span><strong>${rankName(game.levels[t])}</strong>${change ? `<em>${change}</em>` : ""}</div>`;
  };
  return `<div class="level-results">${team(0)}${team(1)}</div>`;
}
// Briefly highlight a team level that just changed.
let shownLevels = null;
function flashLevels() {
  const now = `${game.levels[0]}:${game.levels[1]}`;
  if (shownLevels && shownLevels !== now) {
    const [a, b] = shownLevels.split(":").map(Number);
    [
      [$("our-level"), a !== game.levels[0]],
      [$("their-level"), b !== game.levels[1]],
    ].forEach(([el, changed]) => {
      if (!changed) return;
      el.classList.remove("level-changed");
      void el.offsetWidth;
      el.classList.add("level-changed");
    });
  }
  shownLevels = now;
}
function renderHand() {
  if (room?.spectator) {
    $("hand").innerHTML =
      '<div class="empty-hand">Spectating · All hands are private. Watch the table and Played Cards.</div>';
    return;
  }
  const active = document.activeElement;
  const focus = active?.dataset?.card;
  const groupFocus = active?.dataset?.pickGroup;
  const html =
    game.phase === "ready"
      ? '<div class="empty-hand">Your cards appear here after the deal.</div>'
      : grouping.renderHand() ||
        '<div class="empty-hand">You’re out. Cheer on your partner.</div>';
  if ($("hand").innerHTML !== html) $("hand").innerHTML = html;
  animateDeal();
  const selector = focus
    ? `[data-card="${CSS.escape(focus)}"]`
    : groupFocus
      ? `[data-pick-group="${CSS.escape(groupFocus)}"]`
      : null;
  if (selector)
    document.querySelector(selector)?.focus({ preventScroll: true });
}
// Cards fly into the hand once per new deal (skipped under reduced motion).
let dealtKey = null,
  dealTimer = null;
function animateDeal() {
  const key = `${mode}:${room?.code || ""}:${game.round}`;
  if (game.phase === "ready" || key === dealtKey) return;
  dealtKey = key;
  if (game.hands[0].length < 20) return; // joining mid-hand: no deal to show
  const hand = $("hand");
  hand
    .querySelectorAll(".card")
    .forEach((card, i) => card.style.setProperty("--deal-i", i));
  hand.classList.add("dealing");
  clearTimeout(dealTimer);
  dealTimer = setTimeout(() => hand.classList.remove("dealing"), 1800);
}
function renderSelection() {
  document.querySelectorAll("[data-card]").forEach((card) => {
    const chosen = selected.has(card.dataset.card);
    card.classList.toggle("selected", chosen);
    card.setAttribute("aria-pressed", String(chosen));
  });
  renderActions();
}
let declarationHTML = "",
  selectionPreviewHTML = "";
function renderActions() {
  grouping.refreshControls();
  const legal = legalSelection();
  if (!legal.some((m) => m.key === declared)) declared = legal[0]?.key || "";
  $("declaration").hidden = legal.length < 2 || owesTribute();
  const choices = legal
    .map(
      (m) =>
        `<option value="${m.key}" ${m.key === declared ? "selected" : ""}>${label(m)}${m.suit ? " " + m.suit : ""}${m.type === "Full house" ? " + " + rankName(m.ranks[3]) + " Pair" : ""}</option>`,
    )
    .join("");
  if (choices !== declarationHTML) {
    $("declaration").innerHTML = choices;
    declarationHTML = choices;
  }
  $("clear-btn").disabled = !selected.size || busy;
  $("undo-selection").disabled = !selectionHistory.stack.length || busy;
  $("hint-btn").disabled = !canPlay();
  $("pass-btn").disabled = !canPlay() || !game.trick;
  $("play-btn").disabled =
    busy ||
    (mode === "online" && !connected) ||
    room?.stage === "closed" ||
    (owesTribute() ? !tributeReady() : !canPlay() || !legal.length);
  $("play-btn").textContent = busy
    ? "Sending…"
    : owesTribute()
      ? "Return Card"
      : selected.size
        ? `Play ${selected.size} card${selected.size > 1 ? "s" : ""}`
        : "Play Cards";
  const feedback = playFeedback({
    phase: game.phase,
    paused,
    connected: mode !== "online" || connected,
    closed: room?.stage === "closed",
    busy,
    tribute: owesTribute(),
    turn: game.turn,
    remaining: game.hands[0].length,
  });
  $("turn-indicator").textContent = feedback.label;
  $("turn-indicator").dataset.state = feedback.state;
  $("selection-label").textContent = selected.size
    ? owesTribute()
      ? tributeReady()
        ? "Ready to return this card."
        : "Return a card of 10 or lower."
      : legal.length
        ? label(legal.find((m) => m.key === declared) || legal[0])
        : moves(
              game.hands[0].filter((c) => selected.has(c.id)),
              game.level,
              null,
              true,
            ).length
          ? "These cards cannot beat the table. Try Hint."
          : "Choose a valid combination."
    : feedback.help;
  const preview = $("selection-preview");
  preview.hidden = !selected.size || !!room?.spectator;
  preview.dataset.valid = String(
    owesTribute() ? tributeReady() : legal.length > 0,
  );
  const picked = game.hands[0].filter((c) => selected.has(c.id));
  const previewHTML = `<span class="preview-caption">Selected · Tap to Remove</span><div class="selection-chips">${picked.map((c) => `<button type="button" data-remove-card="${escape(c.id)}" ${busy ? "disabled" : ""} class="selection-chip ${isRedCard(c) ? "red" : ""}" aria-label="${escape(rankName(c.r) + " " + c.s)}"><span translate="no">${c.r >= 15 ? (c.r === 16 ? "★" : "☆") : rankName(c.r) + c.s}</span><span aria-hidden="true">×</span></button>`).join("")}</div>`;
  if (selectionPreviewHTML !== previewHTML) {
    selectionPreviewHTML = previewHTML;
    const focused = document.activeElement?.dataset?.removeCard;
    preview.innerHTML = previewHTML;
    if (focused)
      (
        preview.querySelector(`[data-remove-card="${CSS.escape(focused)}"]`) ||
        preview.querySelector("button") ||
        $("undo-selection")
      ).focus({ preventScroll: true });
  }
  document.querySelector(".action-bar").dataset.state = feedback.state;
}
function schedule() {
  clearTimeout(timer);
  if (
    mode === "practice" &&
    game.phase === "playing" &&
    game.turn !== 0 &&
    !$("modal").open &&
    !paused &&
    !document.hidden
  )
    timer = setTimeout(() => {
      const p = game.turn,
        m = chooseAI(game, p, preferences.difficulty);
      try {
        if (m)
          game.play(
            p,
            m.cards.map((c) => c.id),
            m.key,
          );
        else game.pass(p);
        render();
        schedule();
      } catch (e) {
        toast(e.message);
      }
    }, speed);
}
async function act(action, payload = {}) {
  if (room?.spectator) return;
  if (busy) return;
  busy = true;
  renderActions();
  try {
    if (mode === "online") await net.action(action, payload);
    else if (action === "play")
      game.play(0, payload.cardIds, payload.declaration);
    else if (action === "pass") game.pass(0);
    else if (action === "tribute") game.returnTribute(payload.cardId);
    else if (action === "start" || action === "next") {
      if (game.phase === "game-over") {
        const scorebook = nextMatchScorebook(game.scorebook);
        game = new Game({ doubleUp: game.doubleUp });
        game.scorebook = scorebook;
      }
      game.practiceId ??= crypto.randomUUID();
      game.deal();
    }
    selected.clear();
    selectionHistory.clear();
    declared = "";
    hintIndex = 0;
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
    render();
    schedule();
  }
}
function showOnline(joinCode = "") {
  if (mode === "online" && room) {
    showRoomDetails();
    return;
  }
  modal(
    "Bring Your Table Together",
    `<p>Four players, two teams. Create a room or enter a friend’s code. The host can fill open seats with AI.</p><form id="online-form"><label for="player-name">Your Name</label><input id="player-name" name="playerName" autocomplete="nickname" maxlength="18" placeholder="Name at the table" required><label for="join-code">Room Code <span>(to join a friend)</span></label><input id="join-code" name="roomCode" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${escape(joinCode)}" placeholder="8-character code"><p id="form-error" role="alert"></p><div class="form-actions"><button type="button" id="create-room" class="gold-btn">Create Room</button><button type="submit" id="join-room">Join Room</button></div><p class="muted">Your seat stays in this browser if you reload. A match starts when all four players are ready.</p></form>`,
  );
  const submit = async (join) => {
    const name = $("player-name").value.trim(),
      code = $("join-code").value.trim().toUpperCase();
    if (!name) {
      $("player-name").reportValidity();
      return;
    }
    if (join && !/^[A-Z2-9]{8}$/.test(code)) {
      $("form-error").textContent = "Enter the 8-character room code.";
      return;
    }
    $("create-room").disabled = $("join-room").disabled = true;
    $("form-error").textContent = "Connecting…";
    const n = newNetwork();
    try {
      join ? await n.join(code, name) : await n.create(name, game.doubleUp);
      closeModal();
      history.replaceState(null, "", `?room=${room.code}`);
      toast("Share your room code with three friends.");
    } catch (e) {
      $("form-error").textContent = e.message;
      $("create-room").disabled = $("join-room").disabled = false;
    }
  };
  $("online-form").onsubmit = (e) => {
    e.preventDefault();
    submit(true);
  };
  $("create-room").onclick = () => submit(false);
  $("player-name").focus();
}
function showRoomDetails() {
  if (room.spectator) {
    modal(
      "Spectator",
      '<p>You can watch the table without taking a seat.</p><p>All hands are private. Use Played Cards to review the action.</p><button data-action="stop-watching">Stop Watching</button>',
    );
    return;
  }
  modal(
    "Your Online Table",
    `<p>Room <b>${room.code}</b> · You are on <b>Team ${room.seat % 2 ? "B" : "A"}</b>.</p><p>Your partner is <b${room.members[(room.seat + 2) % 4] ? ' translate="no"' : ""}>${escape(room.members[(room.seat + 2) % 4]?.name || "the open seat opposite you")}</b>. ${room.stage === "lobby" ? "Choose an open seat in the lobby to change teams." : "Seats stay fixed for this match."}</p><p>Reloading reconnects to this seat. An absent player keeps their seat and takes control again when they reconnect.</p><button class="gold-btn" data-action="copy">Copy Invite Link</button><p class="muted">The room expires after 24 hours without a game action. Explicitly leaving during a match closes it for everyone.</p>`,
  );
  const settings = document.createElement("section");
  settings.className = "room-settings";
  settings.innerHTML = `<h3>Keep the Table Moving</h3><label for="absent-timeout">Auto-Play Absent Seats</label><select id="absent-timeout" ${room.seat !== room.host ? "disabled" : ""}>${[
    [0, "Off"],
    [1, "After 1 Minute"],
    [2, "After 2 Minutes"],
    [5, "After 5 Minutes"],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${room.autoPlayMinutes === v ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select><p class="muted">Only the host can change this. Bots act while another player has the room open. Reconnecting returns control immediately. If the host is away, another player can deal the next hand.</p><p id="room-setting-status" role="status"></p><h3>Invite a Spectator</h3><p>Share a read-only link. Spectators see plays and card counts, never private hands.</p><button data-action="copy-spectator">Copy Spectator Link</button>`;
  $("modal-body").append(settings);
  $("absent-timeout").onchange = async (e) => {
    e.target.disabled = true;
    try {
      await net.action("settings", { autoPlayMinutes: Number(e.target.value) });
      $("room-setting-status").textContent = "Room settings saved.";
    } catch (error) {
      toast(error.message);
      e.target.value = String(room.autoPlayMinutes);
    } finally {
      e.target.disabled = false;
    }
  };
}
function leaveConfirmation(toPractice = false) {
  if (room?.spectator) {
    resetPractice();
    return;
  }
  modal(
    "Leave this table?",
    `<p>${room?.stage === "lobby" ? "Your seat will become available." : "Leaving ends this online match for everyone. You can close the browser instead and return to your seat later."}</p><button id="confirm-leave" class="gold-btn">${toPractice ? "Leave & Practice" : "Leave Room"}</button>`,
  );
  $("confirm-leave").onclick = async () => {
    if (busy) return;
    busy = true;
    try {
      await net.action("leave");
      resetPractice();
      closeModal();
      if (!toPractice) showOnline();
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
      render();
    }
  };
}
function resetPractice() {
  paused = false;
  grouping.reset();
  net?.stop();
  net = null;
  room = null;
  mode = "practice";
  game = session.load() || new Game();
  paused = game.phase === "playing";
  selected.clear();
  history.replaceState(null, "", location.pathname);
  connection(true);
  render();
  schedule();
}
function newPractice() {
  const s = stats.get();
  modal(
    "A Fresh Climb",
    `<p>Start a new practice match with both teams on level 2.</p><p class="muted"><span>Matches</span>: ${s.matches} · <span>Wins</span>: ${s.wins}</p>${s.streak >= 2 ? `<p class="muted"><span>Current Win Streak</span>: ${s.streak}</p>` : ""}<label for="promotion-setting">Levels for a 1st–2nd Finish</label><select id="promotion-setting"><option value="3" ${game.doubleUp === 3 ? "selected" : ""}>+3 Levels</option><option value="4" ${game.doubleUp === 4 ? "selected" : ""}>+4 Levels (Original Variant)</option></select><button id="confirm-new" class="gold-btn">Deal a New Game</button>`,
  );
  $("confirm-new").onclick = () => {
    session.clear();
    paused = false;
    grouping.reset();
    game = new Game({ doubleUp: Number($("promotion-setting").value) });
    selected.clear();
    closeModal();
    act("start");
  };
}
async function copyInvite(spectator = false) {
  if (spectator && !room.spectatorKey) {
    try {
      await net.action("spectator-link");
    } catch (error) {
      toast(error.message);
      return;
    }
  }
  const url = new URL(location.href);
  url.hash = "";
  url.search = spectator
    ? `?watch=${room.code}&key=${room.spectatorKey}`
    : `?room=${room.code}`;
  try {
    await navigator.clipboard.writeText(url.href);
    toast(
      spectator
        ? "Spectator link copied."
        : "Invite link copied. Send it to three friends.",
    );
  } catch {
    modal(
      "Invite Your Friends",
      `<p>Copy this link:</p><input readonly value="${escape(url.href)}" aria-label="Room invite link"><p>Room code: <b>${room.code}</b></p>`,
    );
  }
}
document.addEventListener("click", (e) => {
  const remove = e.target.closest("[data-remove-card]");
  if (remove && !busy) {
    selectionHistory.remember(selected, declared);
    selected.delete(remove.dataset.removeCard);
    declared = "";
    preferences.selection();
    renderSelection();
    return;
  }
  const card = e.target.closest("[data-card]");
  if (card) {
    if (busy || !["playing", "tribute"].includes(game.phase)) return;
    const id = card.dataset.card;
    selectionHistory.remember(selected, declared);
    preferences.selection();
    if (e.shiftKey && selectionAnchor) {
      const cards = [
        ...card
          .closest("#hand, #grouped-cards")
          .querySelectorAll("[data-card]"),
      ].map((el) => el.dataset.card);
      selectionRange(cards, selectionAnchor, id).forEach((value) =>
        selected.add(value),
      );
    } else selected.has(id) ? selected.delete(id) : selected.add(id);
    selectionAnchor = id;
    declared = "";
    renderSelection();
    return;
  }
  if (e.target.closest("#start-btn")) act("start");
  if (e.target.closest("#next-btn")) act("next");
  const addBot = e.target.closest("[data-add-bot]");
  if (addBot)
    act("add-bot", {
      seat: Number(addBot.dataset.addBot),
      level: $("bot-level")?.value || botLevel || preferences.difficulty,
    });
  const removeBot = e.target.closest("[data-remove-bot]");
  if (removeBot)
    act("remove-bot", { seat: Number(removeBot.dataset.removeBot) });
  const seat = e.target.closest("[data-seat]");
  if (seat) act("seat", { seat: Number(seat.dataset.seat) });
  const a = e.target.closest("[data-action]")?.dataset.action;
  if (a === "ready") act("ready", { ready: !room.members[room.seat].ready });
  if (a === "start") act("start");
  if (a === "copy") copyInvite();
  if (a === "copy-spectator") copyInvite(true);
  if (a === "stop-watching") {
    closeModal();
    resetPractice();
  }
  if (a === "leave") leaveConfirmation();
  if (a === "another-room") {
    net?.forget();
    resetPractice();
    showOnline();
  }
});
$("play-btn").onclick = () =>
  owesTribute()
    ? act("tribute", { cardId: [...selected][0] })
    : act("play", { cardIds: [...selected], declaration: declared });
$("pass-btn").onclick = () => act("pass");
$("clear-btn").onclick = () => {
  selectionHistory.remember(selected, declared);
  selected.clear();
  declared = "";
  renderSelection();
};
$("undo-selection").onclick = () => {
  if (busy) return;
  const previous = selectionHistory.restore(game.hands[0]);
  if (!previous) return;
  selected = previous.ids;
  declared = previous.declaration;
  renderSelection();
};
$("sort-btn").onclick = () => {
  suitSort = !suitSort;
  savePref("guandan-sort", suitSort ? "suit" : "rank");
  renderSortLabel();
  renderHand();
  renderActions();
};
$("declaration").onchange = (e) => {
  declared = e.target.value;
  renderActions();
};
$("hint-btn").onclick = () => {
  const all = moves(game.hands[0], game.level, game.trick?.move),
    recommended = chooseAI(game, 0);
  if (!all.length) {
    toast("No legal response. Pass to continue.");
    return;
  }
  // When the advisor would pass (usually because the partner is winning the
  // trick), "Pass" is the first suggestion, followed by every legal play.
  const suggestPass = !!game.trick && !recommended;
  if (recommended)
    all.sort((a, b) =>
      a.key === recommended.key ? -1 : b.key === recommended.key ? 1 : 0,
    );
  const options = suggestPass ? [null, ...all] : all;
  const m = options[hintIndex++ % options.length];
  selectionHistory.remember(selected, declared);
  if (!m) {
    selected = new Set();
    declared = "";
    renderSelection();
    $("pass-btn").focus({ preventScroll: true });
    toast(
      game.trick.player === 2
        ? "Hint: Pass. Your partner is winning this trick."
        : "Hint: Pass. Save your cards for a better moment.",
    );
    return;
  }
  selected = new Set(m.cards.map((c) => c.id));
  declared = m.key;
  renderSelection();
  toast(
    `Hint: ${label(m)}.${game.trick?.player === 2 ? " Your partner is ahead; consider passing." : " Tap Hint again for another option."}`,
  );
};
$("rules-btn").onclick = () =>
  showRules({
    game,
    speed,
    setSpeed: (v) => {
      speed = v;
      savePref("guandan-speed", String(v));
    },
    showModal: modal,
    $,
  });
$("history-btn").onclick = () =>
  modal(
    "Around the Table",
    game.history.length
      ? game.history
          .slice(-120)
          .reverse()
          .map((s) => `<div class="history-row">${escape(s)}</div>`)
          .join("")
      : "<p>Your hand history begins after the deal.</p>",
  );
$("new-btn").onclick = () =>
  mode === "online" ? leaveConfirmation() : newPractice();
$("online-mode").onclick = () => showOnline();
$("practice-mode").onclick = () => {
  if (mode === "online") leaveConfirmation(true);
};
$("room-btn").onclick = showRoomDetails;
$("close-modal").onclick = closeModal;
$("modal").addEventListener("close", schedule);
document.addEventListener("keydown", (e) => {
  if (
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.repeat ||
    $("modal").open ||
    document.activeElement.isContentEditable ||
    ["SELECT", "INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  )
    return;
  if (
    e.key === "Enter" &&
    document.activeElement.tagName !== "BUTTON" &&
    !$("play-btn").disabled
  ) {
    e.preventDefault();
    $("play-btn").click();
  }
  if (e.key.toLowerCase() === "h" && !$("hint-btn").disabled)
    $("hint-btn").click();
  if (e.key.toLowerCase() === "p" && !$("pass-btn").disabled)
    $("pass-btn").click();
  if (e.key === "Escape") {
    $("clear-btn").click();
  }
});
const context = document.modelContext;
if (context?.registerTool) {
  for (const tool of [
    {
      name: "read_guandan_table",
      description:
        "Read your own hand and the public game state. Other players’ hands are never returned.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        mode,
        phase: game.phase,
        room: room ? { code: room.code, stage: room.stage } : null,
        turn: playerName(game.turn),
        level: game.level,
        hand: game.hands[0],
        counts: game.hands.map((h) => h.length),
        trick: game.trick,
      }),
    },
    {
      name: "play_guandan_cards",
      description:
        "Play selected card IDs on your turn, with an optional declaration key.",
      inputSchema: {
        type: "object",
        properties: {
          cardIds: { type: "array", items: { type: "string" } },
          declaration: { type: "string" },
        },
        required: ["cardIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        if (
          !input ||
          !Array.isArray(input.cardIds) ||
          !input.cardIds.every((id) => typeof id === "string")
        )
          throw Error("cardIds must be an array.");
        if (busy) throw Error("Wait for the current action.");
        if (!canPlay()) throw Error("It is not your turn.");
        await act("play", input);
        return {
          phase: game.phase,
          remaining: game.hands[0].length,
          turn: playerName(game.turn),
        };
      },
    },
  ])
    try {
      Promise.resolve(context.registerTool(tool)).catch(() => {});
    } catch {}
}
const emotes = createEmotes({
  send: async (id) => {
    if (room?.spectator) throw Error("Spectators can only watch.");
    if (mode !== "online") return true;
    if (busy || net?.pending)
      throw Error("Your previous action is still being confirmed.");
    if (!connected) throw Error("Reconnect before playing.");
    await net.action("emote", { emote: id });
    return false;
  },
  onError: toast,
});
const playedHistory = createPlayedHistory({
  getGame: () => game,
  playerName,
  cardHTML: cardsHTML,
  escape,
  showModal: modal,
});
$("played-btn").onclick = playedHistory.open;
$("hand")
  .closest(".hand-panel")
  .addEventListener("keydown", (event) => {
    if (
      !event.target.matches("[data-card]") ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const cards = [
        ...event.target
          .closest("#hand, #grouped-cards")
          .querySelectorAll("[data-card]"),
      ],
      index = cards.indexOf(event.target);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? cards.length - 1
          : Math.max(
              0,
              Math.min(
                cards.length - 1,
                index + (event.key === "ArrowRight" ? 1 : -1),
              ),
            );
    event.preventDefault();
    cards[next]?.focus({ preventScroll: true });
  });
$("pause-btn").onclick = () => {
  paused = !paused;
  render();
  schedule();
};
$("retry-btn").onclick = () => net?.reconnect();
$("recover-btn").onclick = () => {
  if (net?.stopped || !room) {
    net?.forget();
    resetPractice();
    showOnline();
  } else leaveConfirmation();
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearTimeout(timer);
  else schedule();
});
const grouping = createHandGrouping({
  getGame: () => game,
  getSelected: () => selected,
  setSelected: (ids, key) => {
    selectionHistory.remember(selected, declared);
    selected = ids;
    declared = key;
  },
  getContext: () =>
    `${mode}:${room?.code || game.practiceId || "new"}:${game.round}`,
  onChange: () => {
    renderHand();
    renderActions();
  },
  isBusy: () => busy,
  getSort: () => suitSort,
  cardHTML: cardsHTML,
  escape,
});
function renderSortLabel() {
  $("sort-btn").textContent = `Sort: ${suitSort ? "Suit" : "Rank"} ⇅`;
}
renderSortLabel();
const preferences = createPreferences({
  showModal: modal,
  getGame: () => game,
  getRoom: () => room,
  isPaused: () => paused,
});
$("sound-btn").onclick = () => preferences.toggleSound();
$("settings-btn").onclick = () => preferences.open();
const turnClock = createTurnClock({
  getGame: () => game,
  getRoom: () => room,
  isHeld: () => paused || document.hidden || $("modal").open,
  showModal: modal,
  send: (payload) => net.action("turn-clock", payload),
  expire: () => {
    if (busy) return;
    timeoutMove(game);
    selected.clear();
    selectionHistory.clear();
    declared = "";
    render();
    schedule();
  },
  onError: (e) => toast(e.message),
});
installLanguageToggle();
const scoreboard = createScoreboard({
  getGame: () => game,
  getRoom: () => room,
  playerName,
  escape,
  showModal: modal,
  closeModal,
  canDeal,
  playAgain: () => act("next"),
});
render();
const query = new URLSearchParams(location.search),
  invite = query.get("room")?.toUpperCase(),
  watchCode = query.get("watch")?.toUpperCase(),
  watchKey = query.get("key");
const saved = new OnlineRoom(
  () => {},
  () => {},
).saved();
if (watchCode) {
  if (/^[A-Z2-9]{8}$/.test(watchCode) && /^[a-f0-9]{64}$/.test(watchKey || ""))
    newNetwork()
      .watch(watchCode, watchKey)
      .catch((e) => {
        net.stop();
        toast(e.message);
        modal("Spectator", `<p>${escape(e.message)}</p>`);
      });
  else modal("Spectator", "<p>Spectator link is invalid or expired.</p>");
} else if (saved && (!invite || saved.code === invite)) {
  newNetwork()
    .resume()
    .then((ok) => {
      if (!ok && invite) showOnline(invite);
    })
    .catch((e) => {
      connection(false, e.message);
      toast(e.message);
      if (invite) showOnline(invite);
    });
} else if (invite) showOnline(invite);
