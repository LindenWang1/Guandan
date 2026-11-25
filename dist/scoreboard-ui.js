import { readScorebook } from "./scorebook.js";
export function createScoreboard({
  getGame,
  getRoom,
  playerName,
  escape,
  showModal,
  closeModal,
  canDeal,
  playAgain,
}) {
  const seen = new Set();
  let queued = false;
  const signed = (n) => (n > 0 ? `+${n}` : String(n));
  const teamName = (i) =>
    getRoom()?.spectator
      ? i
        ? "Team B"
        : "Team A"
      : i
        ? "Opponents"
        : "Your Team";
  function open(celebrate = false) {
    const game = getGame(),
      book = readScorebook(game.scorebook),
      finished = game.phase === "game-over";
    const winner = finished ? game.result.winner : null;
    if (finished)
      seen.add(
        `${getRoom()?.code || game.practiceId || "practice"}:${book.matchNumber}`,
      );
    const teamCards = [0, 1]
      .map(
        (i) =>
          `<section class="tally-team tally-team-${i} ${winner === i ? "tally-winner" : ""}"><div class="tally-heading"><h3>${teamName(i)}</h3>${winner === i ? '<span class="winner-seal">★ <span>Match Winners</span></span>' : ""}</div><p class="tally-names" translate="no">${escape(playerName(i))} &amp; ${escape(playerName(i + 2))}</p><div class="tally-points"><strong translate="no">${book.points[i]}</strong><span>Points Earned</span></div><dl><div><dt>Net Points</dt><dd translate="no">${signed(book.points[i] - book.points[1 - i])}</dd></div><div><dt>Hands Won</dt><dd translate="no">${book.handWins[i]}</dd></div><div><dt>Matches Won</dt><dd translate="no">${book.matchWins[i]}</dd></div></dl></section>`,
      )
      .join("");
    const rows = [0, 2, 1, 3]
      .map(
        (p) =>
          `<tr><th scope="row"><i class="tally-dot team-${p % 2}" aria-hidden="true"></i><span translate="no">${escape(playerName(p))}</span></th><td translate="no">${book.handWins[p % 2]}</td><td translate="no">${book.firsts[p]}</td><td translate="no">${book.matchWins[p % 2]}</td></tr>`,
      )
      .join("");
    showModal(
      finished ? "Final Scoreboard" : "Scoreboard",
      `<div class="scoreboard-wrap ${finished ? "match-complete" : ""}">${finished ? '<div class="victory-medallion" aria-hidden="true"><svg viewBox="0 0 80 100"><path d="M40 20C23 20 12 52 12 67c0 32 56 32 56 0C68 52 57 20 40 20Z"/><path d="m24 24-4-18 14 10 6-13 7 13L61 6l-5 18Z"/><path d="m28 56 8 7 17-20"/></svg></div><p class="scoreboard-kicker">THE CLIMB IS COMPLETE</p>' : '<p class="scoreboard-kicker">YOUR TABLE RECORD</p>'}<div class="tally-teams">${teamCards}</div><div class="tally-table-scroll" tabindex="0" role="region" aria-label="Player scoreboard"><table class="tally-table"><caption>Player Results</caption><thead><tr><th scope="col">Player</th><th scope="col">Hands Won</th><th scope="col">First Finishes</th><th scope="col">Matches Won</th></tr></thead><tbody>${rows}</tbody></table></div><p class="scoreboard-note">Both partners receive a hand win. First finishes count who emptied their hand first.</p><div class="scoring-key"><span>1–2 <b>+3</b></span><span>1–3 <b>+2</b></span><span>1–4 <b>+1</b></span></div><p class="scoreboard-note">Net points subtract the other team's earned points. Level promotion is unchanged.</p><p class="scoreboard-note">Table totals carry into Play Again. New Game or a new room starts a fresh record.</p><div class="form-actions"><button id="scoreboard-back">Back to Table</button>${finished && canDeal() ? '<button id="scoreboard-again" class="gold-btn">Play Again ↗</button>' : ""}</div></div>`,
    );
    document.getElementById("scoreboard-back").onclick = closeModal;
    const again = document.getElementById("scoreboard-again");
    if (again)
      again.onclick = () => {
        closeModal();
        playAgain();
      };
    if (
      celebrate &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !document.hidden
    ) {
      const layer = document.createElement("div");
      layer.className = "confetti-layer";
      layer.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 42; i++) {
        const bit = document.createElement("i");
        bit.style.cssText = `--x:${(i * 37) % 100}%;--drift:${((i * 43) % 160) - 80}px;--delay:${(i % 8) * 0.07}s;--spin:${(i % 2 ? 1 : -1) * (180 + i * 17)}deg;--confetti:${["#f5d99b", "#7ad8bf", "#efac9e", "#fff3cc"][i % 4]}`;
        layer.append(bit);
      }
      document.querySelector(".scoreboard-wrap").append(layer);
      setTimeout(() => layer.remove(), 4200);
    }
  }
  function observe() {
    const g = getGame(),
      room = getRoom();
    document.getElementById("scoreboard-btn").disabled =
      room?.stage === "lobby";
    if (
      g.phase !== "game-over" ||
      (room && room.stage !== "playing") ||
      document.getElementById("modal").open ||
      queued
    )
      return;
    const key = `${room?.code || g.practiceId || "practice"}:${readScorebook(g.scorebook).matchNumber}`;
    if (seen.has(key)) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (getGame() !== g || document.getElementById("modal").open) return;
      seen.add(key);
      open(true);
    });
  }
  document.getElementById("scoreboard-btn").onclick = () => open();
  document.getElementById("modal").addEventListener("close", observe);
  return { observe };
}
