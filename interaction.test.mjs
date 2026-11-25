import test from "node:test";
import assert from "node:assert/strict";
import { SelectionHistory, selectionRange } from "./dist/selection.js";
import { playCue, cueNotes } from "./dist/audio.js";
import { preferences, soundEvent } from "./dist/preferences.js";
import { translate } from "./dist/i18n.js";

test("selection undo restores declarations but never restores cards no longer in hand", () => {
  const h = new SelectionHistory();
  h.sync("practice:1");
  h.remember(new Set(["a", "b"]), "Pair/4");
  const restored = h.restore([{ id: "a" }]);
  assert.deepEqual([...restored.ids], ["a"]);
  assert.equal(restored.declaration, "Pair/4");
  assert.equal(h.restore([]), null);
  for (let i = 0; i < 30; i++) h.remember(new Set([String(i)]));
  assert.equal(h.stack.length, 20);
  h.sync("practice:1");
  assert.equal(h.stack.length, 20);
  h.sync("online:room:1");
  assert.equal(h.stack.length, 0);
  h.remember(new Set());
  h.clear();
  assert.equal(h.stack.length, 0);
});

test("range selection follows displayed order in either direction and handles missing anchors", () => {
  const ids = ["d", "b", "a", "c"];
  assert.deepEqual(selectionRange(ids, "b", "c"), ["b", "a", "c"]);
  assert.deepEqual(selectionRange(ids, "c", "b"), ["b", "a", "c"]);
  assert.deepEqual(selectionRange(ids, "missing", "a"), ["a"]);
  assert.deepEqual(selectionRange(ids, "a", "a"), ["a"]);
});

function fakeAudio() {
  const oscillators = [],
    gains = [];
  const parameter = () => ({
    events: [],
    setValueAtTime(v, t) {
      this.events.push([v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.events.push([v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.events.push([v, t]);
    },
  });
  return {
    state: "running",
    currentTime: 10,
    destination: {},
    oscillators,
    gains,
    createOscillator() {
      const o = {
        frequency: parameter(),
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
        start(t) {
          this.started = t;
        },
        stop(t) {
          this.stopped = t;
        },
      };
      oscillators.push(o);
      return o;
    },
    createGain() {
      const g = {
        gain: parameter(),
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
      };
      gains.push(g);
      return g;
    },
  };
}
test("audio cues are bounded, volume-scaled, and release audio nodes", () => {
  for (const kind of Object.keys(cueNotes)) {
    const a = fakeAudio();
    assert.equal(playCue(a, kind, 25), true);
    for (let i = 0; i < a.oscillators.length; i++) {
      const o = a.oscillators[i];
      assert.ok(o.stopped > o.started && o.stopped < 11);
      const peak = a.gains[i].gain.events[1][0];
      assert.ok(peak > 0 && peak <= 0.015);
      o.onended();
      assert.ok(o.disconnected && a.gains[i].disconnected);
    }
  }
  const a = fakeAudio();
  assert.equal(playCue(a, "turn", 0), false);
  assert.equal(playCue({ ...a, state: "suspended" }, "turn", 100), false);
  assert.equal(playCue(a, "unknown", 50), false);
  assert.equal(a.oscillators.length, 0);
});
test("volume preferences migrate old saves, reject malformed input, and bomb sounds deduplicate", () => {
  let saved;
  const p = preferences({
    getItem: () => '{"sound":"on","volume":500}',
    setItem: (_, v) => {
      saved = v;
    },
  });
  assert.equal(p.value.volume, 50);
  p.set("volume", 25);
  assert.equal(JSON.parse(saved).volume, 25);
  for (const v of [-1, 101, NaN, Infinity, "50"]) p.set("volume", v);
  assert.equal(p.value.volume, 25);
  const prev = { context: "room:1", plays: 2 };
  const next = { context: "room:1", plays: 3, bomb: true };
  assert.equal(soundEvent(prev, next), "bomb");
  assert.equal(soundEvent(next, next), null);
  assert.equal(soundEvent(prev, { ...next, myTurn: true }), "turn");
  for (const text of [
    "Volume",
    "Test Sound",
    "Selected · Tap to Remove",
    "Undo Selection",
    "Last Play",
    "Sound On",
    "Sound Off",
  ])
    assert.notEqual(translate(text, "zh-CN"), text);
});

import { tableStatus } from "./dist/table-status.js";
test("seat feedback distinguishes current owner, passes and next turn without stale passes", () => {
  const g = {
    phase: "playing",
    trick: { player: 3 },
    passes: 2,
    turn: 2,
    order: [],
    lastMoves: ["Pass", "Pass", "", ""],
  };
  assert.equal(tableStatus(g, 3).owner, true);
  assert.equal(tableStatus(g, 0).passed, true);
  assert.equal(tableStatus(g, 1).passed, true);
  assert.equal(tableStatus(g, 2).label, "To Play");
  g.trick = { player: 2 };
  g.passes = 0;
  g.turn = 3;
  assert.equal(tableStatus(g, 0).passed, false);
  assert.equal(tableStatus(g, 1).passed, false);
  g.trick = null;
  assert.equal(tableStatus(g, 2).owner, false);
  assert.equal(tableStatus(g, 1).passed, false);
});
test("finished player can own the table; all four placements show, last place is not Finished", () => {
  const g = {
    phase: "playing",
    trick: { player: 0 },
    passes: 1,
    turn: 2,
    order: [0],
  };
  assert.equal(tableStatus(g, 0).label, "Cards on Table");
  g.phase = "round-over";
  g.result = { order: [0, 3, 1, 2] };
  assert.equal(tableStatus(g, 2).place, 3);
  // Last place never emptied their hand, so they are placed but not "Finished".
  assert.equal(tableStatus(g, 2).label, "");
  assert.equal(tableStatus(g, 2).finished, false);
  assert.equal(tableStatus(g, 0).label, "Finished");
  assert.equal(tableStatus(g, 0).owner, false);
  assert.equal(tableStatus(g, 1).passed, false);
});
