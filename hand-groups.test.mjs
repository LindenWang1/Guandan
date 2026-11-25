import test from "node:test";
import assert from "node:assert/strict";
import { HandGroups } from "./dist/hand-groups.js";
import { deck, moves } from "./dist/engine.js";
const cards = deck(),
  pick = (rank, n) => cards.filter((c) => c.r === rank).slice(0, n),
  ids = (hand) => hand.map((c) => c.id);
test("grouping is valid independently of the current table and never changes cards", () => {
  const hand = [...pick(3, 2), ...pick(8, 2)],
    before = JSON.stringify(hand),
    g = new HandGroups();
  const high = moves(pick(8, 2), 2, null, true).find((m) => m.type === "Pair");
  assert.equal(moves(pick(3, 2), 2, high, true).length, 0);
  g.add(hand, ids(pick(3, 2)), 2);
  assert.equal(g.groups.length, 1);
  assert.equal(JSON.stringify(hand), before);
  assert.deepEqual(
    new Set(g.sections(hand, 2).flatMap((s) => ids(s.cards))),
    new Set(ids(hand)),
  );
});
test("invalid combinations and missing cards cannot be grouped", () => {
  const hand = [...pick(3, 1), ...pick(4, 1)],
    g = new HandGroups();
  assert.throws(() => g.add(hand, ids(hand), 2), /valid combination/);
  assert.throws(() => g.add(hand, ["not-owned"], 2), /valid combination/);
  assert.equal(g.groups.length, 0);
});
test("wild declarations and natural-order straights retain their chosen interpretation", () => {
  const hand = [...pick(3, 2), cards.find((c) => c.r === 2 && c.s === "♥")],
    g = new HandGroups();
  const move = moves(hand, 2, null, true).find((m) => m.type === "Triple");
  g.add(hand, ids(hand), 2, move.key);
  assert.equal(g.sections(hand, 2)[0].move.type, "Triple");
  const straight = [14, 2, 3, 4, 5].map((r) =>
    cards.find((c) => c.r === r && c.s === (r === 14 ? "♣" : "♠")),
  );
  g.clear();
  g.add(straight, ids(straight), 7);
  assert.deepEqual(
    g.sections(straight, 7)[0].cards.map((c) => c.r),
    [14, 2, 3, 4, 5],
  );
});
test("overlapping regrouping dissolves the old group without duplicate or lost cards", () => {
  const hand = pick(8, 4),
    g = new HandGroups();
  g.add(hand, ids(hand.slice(0, 2)), 2);
  g.add(hand, ids(hand.slice(1, 4)), 2);
  assert.equal(g.groups.length, 1);
  const shown = g.sections(hand, 2).flatMap((s) => ids(s.cards));
  assert.equal(shown.length, 4);
  assert.equal(new Set(shown).size, 4);
});
test("group moves, release, reset, and partial plays preserve remaining cards", () => {
  const hand = [...pick(3, 2), ...pick(4, 2), ...pick(5, 2)],
    g = new HandGroups();
  for (const rank of [3, 4, 5]) g.add(hand, ids(pick(rank, 2)), 2);
  assert.equal(g.move(ids(pick(3, 2)), -1), false);
  assert.equal(g.move(ids(pick(3, 2)), 1), true);
  assert.deepEqual(
    g.groups.map((x) => x.ids[0]),
    [pick(4, 2)[0].id, pick(3, 2)[0].id, pick(5, 2)[0].id],
  );
  const remaining = hand.filter((c) => c.id !== pick(3, 2)[0].id);
  g.sync(remaining, 2);
  assert.equal(g.groups.length, 2);
  assert.equal(g.sections(remaining, 2).flatMap((s) => s.cards).length, 5);
  g.release(ids(pick(4, 2)));
  assert.equal(g.groups.length, 1);
  g.clear();
  assert.equal(g.groups.length, 0);
});
test("restored groups survive updates and reject malformed or stale stored data", () => {
  const hand = pick(3, 2),
    g = new HandGroups();
  g.add(hand, ids(hand), 2);
  const restored = new HandGroups(JSON.parse(JSON.stringify(g.groups)));
  restored.sync(hand, 2);
  assert.equal(restored.groups.length, 1);
  restored.sync(pick(4, 2), 2);
  assert.equal(restored.groups.length, 0);
  const invalid = new HandGroups([
    { id: 'bad"', ids: ids(hand), key: g.groups[0].key },
  ]);
  invalid.sync(hand, 2);
  assert.equal(invalid.groups.length, 0);
});
