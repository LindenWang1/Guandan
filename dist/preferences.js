import { browserStorage } from "./practice-session.js";
import { playCue } from "./audio.js";

// AI pace: milliseconds each practice AI waits before moving. Leading a new
// trick waits a little longer, so you can see who won the last one.
export const AI_PACES = [
  [1000, "Quick"],
  [1500, "Normal"],
  [2000, "Relaxed"],
  [3000, "Learning"],
];
export const DEFAULT_PACE = 2000;
// Paces saved by earlier versions keep their name: Quick, Relaxed (the old
// default) and Learning. Any other number moves to the nearest choice.
const LEGACY_PACES = { 450: 1000, 950: 2000, 1600: 3000 };
export function paceFrom(saved) {
  const n = Number(saved);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PACE;
  if (LEGACY_PACES[n]) return LEGACY_PACES[n];
  return AI_PACES.map(([ms]) => ms).reduce((best, ms) =>
    Math.abs(ms - n) < Math.abs(best - n) ? ms : best,
  );
}
export const leadDelay = (pace) => pace + 600;
export const paceSelect = (id, pace) =>
  `<select id="${id}">${AI_PACES.map(([ms, name]) => `<option value="${ms}" ${pace === ms ? "selected" : ""}>${name}</option>`).join("")}</select>`;

const allowed = {
  // Stored ids stay easy/normal/hard so older saved settings still load.
  difficulty: ["easy", "normal", "hard", "expert"],
  theme: ["jade", "midnight", "plum"],
  back: ["classic", "lattice", "stars"],
  sound: ["off", "on"],
  takeBack: ["off", "on"],
};
export function preferences(storage = browserStorage()) {
  const value = {
    difficulty: "normal",
    theme: "jade",
    back: "classic",
    sound: "off",
    takeBack: "off",
    volume: 50,
  };
  try {
    const saved = JSON.parse(storage?.getItem("guandan-preferences") || "{}");
    for (const key of Object.keys(value))
      if (
        key === "volume"
          ? Number.isFinite(saved[key]) && saved[key] >= 0 && saved[key] <= 100
          : allowed[key].includes(saved[key])
      )
        value[key] = saved[key];
  } catch {}
  return {
    value,
    set(key, next) {
      if (
        key === "volume"
          ? !Number.isFinite(next) || next < 0 || next > 100
          : !allowed[key]?.includes(next)
      )
        return;
      value[key] = next;
      try {
        storage?.setItem("guandan-preferences", JSON.stringify(value));
      } catch {}
    },
  };
}

export function soundEvent(previous, next) {
  if (!previous || previous.context !== next.context) return null;
  if (next.ended && !previous.ended && next.won) return "win";
  if (next.myTurn && (!previous.myTurn || next.plays !== previous.plays))
    return "turn";
  if (next.plays > previous.plays && next.bomb) return "bomb";
  if (next.plays > previous.plays) return "card";
  return null;
}

export function createPreferences({
  showModal,
  getGame,
  getRoom,
  isPaused = () => false,
  onChange = () => {},
  getPace = () => DEFAULT_PACE,
  setPace = () => {},
}) {
  const prefs = preferences();
  let audio,
    previous,
    lastSelection = 0;
  function apply() {
    document.documentElement.dataset.theme = prefs.value.theme;
    document.documentElement.dataset.back = prefs.value.back;
    const button = document.getElementById("sound-btn");
    if (button) {
      button.textContent =
        prefs.value.sound === "on" ? "Sound On" : "Sound Off";
      button.setAttribute("aria-pressed", String(prefs.value.sound === "on"));
    }
  }
  async function unlock() {
    if (prefs.value.sound !== "on") return;
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return false;
      audio ||= new Audio();
      if (audio.state === "suspended") await audio.resume();
      return audio.state === "running";
    } catch {
      return false;
    }
  }
  function play(kind) {
    if (
      prefs.value.sound !== "on" ||
      document.hidden ||
      audio?.state !== "running"
    )
      return;
    try {
      return playCue(audio, kind, prefs.value.volume);
    } catch {
      return false;
    }
  }
  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
  apply();
  const select = (key, title, labels) =>
    `<label for="pref-${key}">${title}</label><select id="pref-${key}" data-pref="${key}">${allowed[key].map((v, i) => `<option value="${v}" ${prefs.value[key] === v ? "selected" : ""}>${labels[i]}</option>`).join("")}</select>`;
  return {
    async toggleSound() {
      prefs.set("sound", prefs.value.sound === "on" ? "off" : "on");
      apply();
      if (prefs.value.sound === "on") {
        await unlock();
        play("turn");
      }
    },
    selection() {
      if (Date.now() - lastSelection < 55) return;
      lastSelection = Date.now();
      play("select");
    },
    get difficulty() {
      return prefs.value.difficulty;
    },
    get takeBack() {
      return prefs.value.takeBack === "on";
    },
    open() {
      showModal(
        "Table Settings",
        `<div class="settings-grid"><section><h3>Practice</h3>${select("difficulty", "AI Difficulty", ["Beginner", "Medium", "Hard", "Expert"])}<p class="muted">Beginner often plays a random legal move. Medium balances cards and teamwork. Hard also protects useful combinations. Expert plans its whole hand, tracks every card played, and saves bombs.</p><p class="muted">Applies to all three practice bots on their next turn.</p><label for="pref-pace">AI Pace</label>${paceSelect("pref-pace", getPace())}<p class="muted">How long each AI player waits before moving. A new trick starts after a slightly longer pause.</p>${select("takeBack", "Take Back Moves", ["Off", "On"])}<p class="muted">AI Practice only. Adds a Take Back button that returns the table to just before your last play or pass in this hand.</p></section><section><h3>Sound & Appearance</h3>${select("sound", "Sound Effects", ["Off", "On"])}<label for="sound-volume">Volume <output id="volume-label" for="sound-volume" translate="no">${prefs.value.volume}%</output></label><input id="sound-volume" type="range" min="0" max="100" step="5" value="${prefs.value.volume}"><button id="test-sound" type="button">Test Sound</button><p id="audio-status" class="muted" role="status">Short cues only. No background music.</p>${select("theme", "Table Theme", ["Jade", "Midnight", "Plum"])}${select("back", "Card Backs", ["Classic", "Lattice", "Stars"])}<div class="back-preview" aria-hidden="true"><i class="card-back"></i><i class="card-back"></i><i class="card-back"></i></div></section></div><p class="muted">Saved on this device. Your friends can choose their own look and sound.</p>`,
      );
      document.getElementById("pref-pace").onchange = (e) =>
        setPace(Number(e.target.value));
      const slider = document.getElementById("sound-volume"),
        test = document.getElementById("test-sound");
      const updateAudioControls = () => {
        test.disabled = prefs.value.sound !== "on" || prefs.value.volume === 0;
      };
      updateAudioControls();
      slider.oninput = () => {
        prefs.set("volume", Number(slider.value));
        document.getElementById("volume-label").textContent =
          `${prefs.value.volume}%`;
        updateAudioControls();
      };
      test.onclick = async () => {
        const ready = await unlock();
        const played = ready && play("turn");
        document.getElementById("audio-status").textContent = played
          ? "Playing a sample turn cue."
          : "Audio is unavailable. Check your browser or device sound settings.";
      };
      document.querySelectorAll("[data-pref]").forEach(
        (el) =>
          (el.onchange = async () => {
            prefs.set(el.dataset.pref, el.value);
            apply();
            onChange(el.dataset.pref);
            updateAudioControls();
            if (el.dataset.pref === "sound" && el.value === "on") {
              await unlock();
              play("turn");
            }
          }),
      );
    },
    observe() {
      const g = getGame(),
        room = getRoom();
      const next = {
        context: `${room?.code || g.practiceId || "practice"}:${g.round}`,
        plays: g.playedCards?.length || 0,
        ended: ["round-over", "game-over"].includes(g.phase),
        won: !room?.spectator && g.result?.winner === 0,
        bomb: !!g.playedCards?.at(-1)?.move.bomb,
        myTurn: !room?.spectator && g.phase === "playing" && g.turn === 0,
      };
      const event = soundEvent(previous, next);
      previous = next;
      if (event && !isPaused()) play(event);
    },
  };
}
