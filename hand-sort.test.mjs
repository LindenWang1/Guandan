import test from "node:test";
import assert from "node:assert/strict";
import { Game, wild, strength } from "./dist/engine.js";
import {
  arrange,
  rankStacks,
  findBombs,
  autoGroup,
  validSort,
} from "./dist/hand-sort.js";
import { HandGroups } from "./dist/hand-groups.js";
import { translate } from "./dist/i18n.js";

// Cards are written as rank + suit + deck copy, e.g. "7♠a".
const card = (text) => {
  const [, r, s, copy] = text.match(/^(10|[2-9JQKA]|SJ|BJ)([♠♥♣♦★])([ab])$/);
  const rank = { J: 11, Q: 12, K: 13, A: 14, SJ: 15, BJ: 16 }[r] ?? Number(r);
  return { id: `${r}${s}${copy}`, r: rank, s };
};
const hand = (...texts) => texts.map(card);
const names = (cards) => cards.map((c) => c.id);

test("sort modes reorder the hand without losing or adding cards", () => {
  const h = hand("K♠a", "3♥a", "3♦a", "A♣a", "7♥a", "BJ★a");
  for (const mode of ["rank", "rank-desc", "suit", "bombs"])
    assert.deepEqual(names(arrange(h, 5, mode)).sort(), names(h).sort(), mode);
  assert.deepEqual(names(arrange(h, 5, "rank")), [
    "3♥a",
    "3♦a",
    "7♥a",
    "K♠a",
    "A♣a",
    "BJ★a",
  ]);
  assert.deepEqual(
    names(arrange(h, 5, "rank-desc")),
    names(arrange(h, 5, "rank")).reverse(),
  );
  assert.equal(validSort("nonsense"), "rank");
});

test("Bombs First puts rank bombs, then straight flushes, then the rest", () => {
  const h = hand(
    "2♣a",
    "9♠a",
    "9♥a",
    "9♣a",
    "9♦a",
    "3♥a",
    "4♥a",
    "5♥a",
    "6♥a",
    "7♥a",
    "K♣a",
  );
  const order = names(arrange(h, 10, "bombs"));
  assert.deepEqual(
    order.slice(0, 4).sort(),
    ["9♠a", "9♥a", "9♣a", "9♦a"].sort(),
  );
  assert.deepEqual(order.slice(4, 9), ["3♥a", "4♥a", "5♥a", "6♥a", "7♥a"]);
  assert.deepEqual(order.slice(9), ["2♣a", "K♣a"]);
});

test("rank stacks follow the display order", () => {
  const stacks = rankStacks(arrange(hand("5♠a", "5♥a", "8♣a", "5♦a"), 2));
  assert.deepEqual(
    stacks.map((s) => s.length),
    [3, 1],
  );
});

test("the bomb finder lists each bomb once, weakest first", () => {
  const h = hand(
    "6♠a",
    "6♥a",
    "6♣a",
    "6♦a",
    "6♠b",
    "J♣a",
    "J♦a",
    "J♥a",
    "J♠a",
    "9♠a",
    "10♠a",
    "Q♠a",
    "K♠a",
  );
  const bombs = findBombs(h, 3);
  assert.deepEqual(
    bombs.map((m) => m.type),
    ["4-card bomb", "5-card bomb", "Straight flush"],
  );
  assert.equal(bombs[1].ranks[0], 6, "the 6s appear once, as five cards");
  const flushes = findBombs(h, 3, "Straight flush");
  assert.equal(flushes.length, 1);
  assert.equal(flushes[0].suit, "♠");
});

test("Auto-Group makes valid, separate groups and leaves wild cards loose", () => {
  for (let seed = 1; seed <= 60; seed++) {
    let s = seed;
    const g = new Game({
      random: () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296,
    });
    g.deal();
    for (const h of g.hands) {
      const groups = autoGroup(h, g.level),
        used = groups.flatMap((m) => names(m.cards));
      assert.equal(new Set(used).size, used.length, "no card in two groups");
      assert.ok(used.every((id) => h.some((c) => c.id === id)));
      assert.ok(!groups.some((m) => m.cards.some((c) => wild(c, g.level))));
      const book = new HandGroups();
      book.replace(h, groups, g.level);
      assert.equal(book.groups.length, groups.length, "every group is valid");
    }
  }
});

test("Auto-Group keeps bombs whole and builds runs from what is left", () => {
  const h = hand(
    "8♠a",
    "8♥a",
    "8♣a",
    "8♦a",
    "3♠a",
    "4♥a",
    "5♣a",
    "6♦a",
    "7♠a",
    "Q♣a",
    "Q♦a",
    "Q♠a",
    "2♥a",
  );
  const types = autoGroup(h, 10).map((m) => m.type);
  assert.deepEqual(types, ["Straight", "Triple", "4-card bomb"]);
});

test("sections accept a sort mode and still accept the old suit flag", () => {
  const h = hand("K♠a", "3♥a", "3♦a");
  const book = new HandGroups();
  assert.deepEqual(names(book.sections(h, 2, "rank-desc")[0].cards), [
    "K♠a",
    "3♦a",
    "3♥a",
  ]);
  assert.deepEqual(
    names(book.sections(h, 2, true)[0].cards),
    names(arrange(h, 2, "suit")),
  );
});

test("sorting and finder text has Chinese translations", () => {
  for (const text of [
    "Rank: High to Low",
    "Bombs First",
    "Stack by Rank",
    "Auto-Group",
    "Find Bomb",
    "Find Straight Flush",
    "No bombs in your hand.",
    "Auto-Group made 2 groups. Wild cards, pairs and singles stay loose.",
    "Bomb 1 of 2: 4-Card Bomb · 7. Tap again for the next one.",
    "Straight Flush 2 of 2: Straight Flush · 3–7 ♥. Tap again for the next one.",
  ])
    assert.match(translate(text), /[一-鿿]/, text);
  assert.ok(strength(14, 2) > strength(13, 2));
});
