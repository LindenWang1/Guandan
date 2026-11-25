import {
  TURN_SECONDS,
  syncClock,
  controlClock,
  clockExpired,
} from "./turn-clock.js";
import { browserStorage } from "./practice-session.js";

export function createTurnClock({
  getGame,
  getRoom,
  isHeld,
  showModal,
  send,
  expire,
  onError,
}) {
  const storage = browserStorage();
  let saved;
  try {
    saved = JSON.parse(storage?.getItem("guandan-turn-clock") || "{}");
  } catch {}
  const local = {
    seconds: TURN_SECONDS.includes(saved?.seconds) ? saved.seconds : 0,
    mode: saved?.mode === "warn" ? "warn" : "auto",
    paused: false,
  };
  let previous = Date.now(),
    context = "",
    expiring = false,
    changing = false,
    previouslyHeld = isHeld();
  const button = document.getElementById("turn-clock-btn");
  const display = document.getElementById("turn-clock-value");
  const current = () => getRoom()?.turnClock || local;
  const allowed = () =>
    !getRoom() || (!getRoom().spectator && getRoom().seat === getRoom().host);
  function tick() {
    const now = Date.now(),
      room = getRoom(),
      game = getGame();
    const held = !room && isHeld();
    if (!room) {
      const next = `${game.practiceId || "new"}:${game.round}`;
      if (context !== next) {
        context = next;
        syncClock(local, game, now, true);
      } else if ((held || previouslyHeld) && local.deadline != null)
        local.deadline += now - previous;
      syncClock(local, game, now);
    }
    previous = now;
    previouslyHeld = held;
    const c = current();
    const deadline = room
      ? room.clockReceivedAt + ((c.deadline || 0) - room.serverNow)
      : c.deadline;
    const active = game.phase === "playing" && c.seconds;
    const ms = c.paused ? c.remaining : Math.max(0, (deadline || now) - now);
    const seconds = Math.ceil(ms / 1000);
    const label = !c.seconds
      ? "Off"
      : !active
        ? "Ready"
        : c.paused || held
          ? "Paused"
          : seconds <= 0
            ? "Time Up"
            : null;
    display.textContent =
      label ||
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    display.setAttribute("translate", label ? "yes" : "no");
    button.classList.toggle(
      "timer-urgent",
      !!active && !c.paused && !held && seconds <= 5,
    );
    if (!room && !held && !expiring && clockExpired(local, game, now)) {
      expiring = true;
      Promise.resolve()
        .then(expire)
        .catch(onError)
        .finally(() => {
          expiring = false;
        });
    }
  }
  async function change(payload) {
    if (!allowed() || changing) return;
    changing = true;
    document.querySelectorAll(".timer-settings button").forEach((b) => {
      b.disabled = true;
    });
    try {
      if (getRoom()) await send(payload);
      else {
        if (payload.command) controlClock(local, payload.command, getGame());
        else {
          Object.assign(local, payload, { paused: false });
          syncClock(local, getGame(), Date.now(), true);
        }
        try {
          storage?.setItem(
            "guandan-turn-clock",
            JSON.stringify({ seconds: local.seconds, mode: local.mode }),
          );
        } catch {}
      }
      open();
      tick();
    } catch (e) {
      onError(e);
      open();
    } finally {
      changing = false;
    }
  }
  function open() {
    const c = current(),
      disabled = allowed() ? "" : "disabled";
    showModal(
      "Turn Timer",
      `<div class="timer-settings"><label for="turn-duration">Time Per Turn</label><select id="turn-duration" ${disabled}>${TURN_SECONDS.map((s) => `<option value="${s}" ${s === c.seconds ? "selected" : ""}>${s ? `${s} s` : "Off"}</option>`).join("")}</select><label for="turn-expiry">When Time Runs Out</label><select id="turn-expiry" ${disabled}><option value="auto" ${c.mode === "auto" ? "selected" : ""}>Auto-Pass</option><option value="warn" ${c.mode === "warn" ? "selected" : ""}>Warn Only</option></select><p>Auto-pass skips your turn. On an empty table, the lowest single card is played instead.</p><p>Only the host controls the online timer. Practice pauses while a menu is open or the tab is hidden.</p><p>Changing the duration starts a fresh countdown. Online expiry is processed when a player checks the table.</p><div class="form-actions"><button id="timer-apply" class="gold-btn" ${disabled}>Apply Timer</button><button id="timer-pause" ${disabled || (!c.seconds ? "disabled" : "")}>${c.paused ? "Resume Timer" : "Pause Timer"}</button><button id="timer-restart" ${disabled || (!c.seconds ? "disabled" : "")}>Restart Turn</button></div><p>Pause Timer pauses the countdown only; players can still play.</p></div>`,
    );
    document.getElementById("timer-apply").onclick = () =>
      change({
        seconds: Number(document.getElementById("turn-duration").value),
        mode: document.getElementById("turn-expiry").value,
      });
    document.getElementById("timer-pause").onclick = () =>
      change({ command: current().paused ? "resume" : "pause" });
    document.getElementById("timer-restart").onclick = () =>
      change({ command: "restart" });
  }
  button.onclick = open;
  document.addEventListener("visibilitychange", tick);
  setInterval(tick, 250);
  return { tick };
}
