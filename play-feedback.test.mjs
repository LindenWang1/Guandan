import test from "node:test";
import assert from "node:assert/strict";
import { playFeedback } from "./dist/play-feedback.js";
import { translate } from "./dist/i18n.js";
const active = {
  phase: "playing",
  paused: false,
  connected: true,
  closed: false,
  busy: false,
  tribute: false,
  turn: 0,
  remaining: 27,
};
test("action feedback prioritizes connection, pending actions and pause over turn", () => {
  assert.equal(playFeedback(active).state, "turn");
  assert.equal(playFeedback({ ...active, paused: true }).state, "paused");
  assert.equal(
    playFeedback({ ...active, connected: false, paused: true }).label,
    "Reconnecting",
  );
  assert.equal(
    playFeedback({ ...active, closed: true, connected: false }).label,
    "Match Ended",
  );
  assert.equal(playFeedback({ ...active, busy: true }).label, "Sending…");
});
test("action feedback explains tribute, finished hands and waiting", () => {
  assert.equal(
    playFeedback({ ...active, phase: "tribute", tribute: true }).label,
    "Return Tribute",
  );
  assert.equal(
    playFeedback({ ...active, phase: "round-over" }).label,
    "Hand Complete",
  );
  assert.equal(playFeedback({ ...active, remaining: 0 }).label, "You’re Out");
  assert.equal(
    playFeedback({ ...active, turn: 2 }).label,
    "Waiting for Your Turn",
  );
  assert.equal(
    playFeedback({ ...active, phase: "ready" }).label,
    "Ready to play",
  );
});
test("every action state has English and Chinese feedback", () => {
  for (const overrides of [
    {},
    { closed: true },
    { connected: false },
    { busy: true },
    { phase: "ready" },
    { paused: true },
    { phase: "tribute", tribute: true },
    { phase: "round-over" },
    { remaining: 0 },
    { turn: 2 },
  ]) {
    const feedback = playFeedback({ ...active, ...overrides });
    for (const text of [feedback.label, feedback.help]) {
      assert.equal(translate(text, "en"), text);
      assert.notEqual(translate(text, "zh-CN"), text);
    }
  }
});
