import { sorted } from "./engine.js";
export const TURN_SECONDS = [0, 15, 30, 45, 60, 90, 120];
export const turnKey = (g) =>
  g?.phase === "playing"
    ? `${g.round}:${g.turn}:${g.playedCards?.length || 0}:${g.passes}`
    : "";
export function syncClock(clock, game, now = Date.now(), reset = false) {
  const key = turnKey(game);
  if (reset || clock.key !== key) {
    clock.key = key;
    clock.remaining = clock.seconds * 1000;
    clock.deadline =
      key && clock.seconds && !clock.paused ? now + clock.remaining : null;
  }
  if (!key || !clock.seconds) clock.deadline = null;
  return clock;
}
export function controlClock(clock, command, game, now = Date.now()) {
  syncClock(clock, game, now);
  if (command === "pause" && !clock.paused) {
    clock.remaining = Math.max(0, (clock.deadline ?? now) - now);
    clock.paused = true;
    clock.deadline = null;
  } else if (command === "resume" && clock.paused) {
    clock.paused = false;
    clock.deadline = clock.key && clock.seconds ? now + clock.remaining : null;
  } else if (command === "restart") syncClock(clock, game, now, true);
}
export function clockExpired(clock, game, now = Date.now()) {
  return (
    clock?.mode === "auto" &&
    !clock.paused &&
    !!clock.seconds &&
    clock.key === turnKey(game) &&
    !!clock.key &&
    clock.deadline != null &&
    now >= clock.deadline
  );
}
export function timeoutMove(game) {
  const p = game.turn;
  if (game.trick || !game.hands[p].length) game.pass(p);
  else game.play(p, [sorted(game.hands[p], game.level)[0].id]);
}
