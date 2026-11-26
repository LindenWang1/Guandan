import test from "node:test";
import assert from "node:assert/strict";
import { Game, chooseAI } from "./dist/engine.js";
import { createTakeBack } from "./dist/take-back.js";
import {
  preferences,
  paceFrom,
  leadDelay,
  AI_PACES,
  DEFAULT_PACE,
} from "./dist/preferences.js";
import { showRules } from "./dist/rules.js";

const seeded = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
function practice(seed) {
  const g = new Game({ random: seeded(seed) });
  g.practiceId = "test-" + seed;
  g.deal();
  // Let the AI play until it is your turn.
  while (g.phase === "playing" && g.turn !== 0) {
    const m = chooseAI(g, g.turn);
    m
      ? g.play(
          g.turn,
          m.cards.map((c) => c.id),
          m.key,
        )
      : g.pass(g.turn);
  }
  return g;
}

test("take back returns the table to just before your move", () => {
  const g = practice(3),
    tb = createTakeBack(),
    handBefore = g.hands.map((h) => h.map((c) => c.id)),
    playsBefore = g.playedCards.length;
  assert.equal(tb.available(g), false, "nothing to take back yet");
  tb.remember(g);
  const m = chooseAI(g, 0);
  m
    ? g.play(
        0,
        m.cards.map((c) => c.id),
        m.key,
      )
    : g.pass(0);
  for (let i = 0; i < 3 && g.phase === "playing" && g.turn !== 0; i++) {
    const r = chooseAI(g, g.turn);
    r
      ? g.play(
          g.turn,
          r.cards.map((c) => c.id),
          r.key,
        )
      : g.pass(g.turn);
  }
  assert.equal(tb.available(g), true);
  const back = tb.restore(g);
  assert.deepEqual(
    back.hands.map((h) => h.map((c) => c.id)),
    handBefore,
  );
  assert.equal(back.playedCards.length, playsBefore);
  assert.equal(back.turn, 0);
  assert.equal(back.practiceId, g.practiceId);
  assert.equal(typeof back.play, "function", "a real Game comes back");
  assert.equal(tb.available(back), false, "each snapshot is used once");
});

test("snapshots belong to one hand and are cleared by a new deal", () => {
  const g = practice(5),
    tb = createTakeBack();
  tb.remember(g);
  g.round += 1;
  assert.equal(tb.available(g), false);
  assert.equal(tb.count, 0);
});

test("a failed move drops its snapshot, and finished hands cannot be undone", () => {
  const g = practice(7),
    tb = createTakeBack();
  tb.remember(g);
  tb.discard();
  assert.equal(tb.count, 0);
  tb.remember(g);
  g.phase = "round-over";
  assert.equal(tb.available(g), false);
});

test("the Take Back setting is off unless turned on", () => {
  const store = new Map(),
    storage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
    };
  const prefs = preferences(storage);
  assert.equal(prefs.value.takeBack, "off");
  prefs.set("takeBack", "maybe");
  assert.equal(prefs.value.takeBack, "off");
  prefs.set("takeBack", "on");
  assert.equal(preferences(storage).value.takeBack, "on");
});

test("AI pace: four choices, 2 seconds by default, old settings carried over", () => {
  assert.deepEqual(
    AI_PACES.map(([ms]) => ms),
    [1000, 1500, 2000, 3000],
  );
  assert.equal(DEFAULT_PACE, 2000);
  // Quick, Relaxed (the old default) and Learning from earlier versions.
  assert.deepEqual([450, 950, 1600].map(paceFrom), [1000, 2000, 3000]);
  assert.equal(paceFrom(1400), 1500, "other numbers move to the nearest");
  assert.equal(paceFrom("nonsense"), 2000);
  assert.equal(leadDelay(2000), 2600, "a new trick waits a little longer");
});

test("How to Play offers the same pace choices", () => {
  let html = "";
  showRules({
    game: { doubleUp: 3 },
    speed: 3000,
    setSpeed() {},
    showModal: (_, body) => (html = body),
    $: () => ({}),
  });
  for (const [ms, name] of AI_PACES)
    assert.match(html, new RegExp(`value="${ms}"[^>]*>${name}<`));
  assert.match(html, /value="3000" selected/);
});
