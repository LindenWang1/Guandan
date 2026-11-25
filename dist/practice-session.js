import { Game, deck } from "./engine.js";
import { readScorebook } from "./scorebook.js";

const KEY = "guandan-practice-v3";
const validCards = new Map(deck().map((c) => [c.id, c]));
export function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

// Only local practice state is saved here. Online hands remain server-authoritative.
export function restorePractice(raw) {
  try {
    const { version, state } = JSON.parse(raw);
    if (
      version !== 1 ||
      !state ||
      !["playing", "tribute", "round-over", "game-over"].includes(state.phase)
    )
      return null;
    const seat = (n) => Number.isInteger(n) && n >= 0 && n < 4;
    const rank = (n) => Number.isInteger(n) && n >= 2 && n <= 14;
    if (
      !Array.isArray(state.names) ||
      state.names.length !== 4 ||
      !state.names.every((n) => typeof n === "string" && n.length <= 100)
    )
      return null;
    if (!Number.isInteger(state.passes) || state.passes < 0 || state.passes > 2)
      return null;
    if (!Array.isArray(state.finishMoves) || state.finishMoves.length !== 4)
      return null;
    if (
      !seat(state.turn) ||
      ![0, 1].includes(state.declarer) ||
      !rank(state.level) ||
      !Array.isArray(state.levels) ||
      state.levels.length !== 2 ||
      !state.levels.every(rank)
    )
      return null;
    if (
      !Number.isInteger(state.round) ||
      state.round < 1 ||
      ![3, 4].includes(state.doubleUp) ||
      !Array.isArray(state.hands) ||
      state.hands.length !== 4 ||
      !state.hands.every(Array.isArray)
    )
      return null;
    if (
      !Array.isArray(state.playedCards) ||
      !Array.isArray(state.order) ||
      !state.order.every(seat) ||
      new Set(state.order).size !== state.order.length ||
      !Array.isArray(state.returns) ||
      !Array.isArray(state.history) ||
      !state.history.every((s) => typeof s === "string")
    )
      return null;
    if (
      !Array.isArray(state.failures) ||
      state.failures.length !== 2 ||
      !state.failures.every((n) => Number.isInteger(n) && n >= 0 && n < 3) ||
      !Array.isArray(state.lastMoves) ||
      state.lastMoves.length !== 4
    )
      return null;
    const cards = [
      ...state.hands.flat(),
      ...state.playedCards.flatMap((e) => e.move.cards),
    ];
    if (
      cards.length !== 108 ||
      new Set(cards.map((c) => c.id)).size !== 108 ||
      !cards.every(
        (c) =>
          validCards.get(c.id)?.r === c.r && validCards.get(c.id)?.s === c.s,
      )
    )
      return null;
    if (
      state.playedCards.some(
        (e) =>
          !seat(e.player) ||
          !Array.isArray(e.move.as) ||
          e.move.cards.length !== e.move.as.length,
      )
    )
      return null;
    if (
      state.trick &&
      (!seat(state.trick.player) || !Array.isArray(state.trick.move?.cards))
    )
      return null;
    if (["round-over", "game-over"].includes(state.phase) && !state.result)
      return null;
    // Select known fields so stored JSON cannot replace Game methods.
    const g = new Game();
    for (const key of Object.keys(g))
      if (key !== "random" && Object.hasOwn(state, key)) g[key] = state[key];
    g.lastActualMove = state.lastActualMove || null;
    g.scorebook = readScorebook(state.scorebook);
    g.__statsRecorded = state.__statsRecorded === true;
    g.practiceId =
      typeof state.practiceId === "string"
        ? state.practiceId
        : String(Date.now());
    return g;
  } catch {
    return null;
  }
}
export function practiceSession(storage = browserStorage()) {
  let previous = "";
  return {
    load() {
      try {
        return restorePractice(storage?.getItem(KEY));
      } catch {
        return null;
      }
    },
    save(game) {
      if (game.phase === "ready") return;
      const raw = JSON.stringify({ version: 1, state: game });
      if (raw === previous) return true;
      try {
        if (!storage) return false;
        storage.setItem(KEY, raw);
        previous = raw;
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      previous = "";
      try {
        storage?.removeItem(KEY);
      } catch {}
    },
  };
}
