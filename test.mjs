import test from "node:test";
import assert from "node:assert/strict";
import { Game, deck, moves, beats, chooseAI, wild } from "./dist/engine.js";
import { chooseTributeReturn } from "./dist/expert-ai.js";
let serial = 0;
const c = (r, s = "♠") => ({ id: String(serial++), r, s });
const cs = (r, n, s = "♠") => Array.from({ length: n }, () => c(r, s));
const has = (a, type, l = 7) =>
  moves(a, l, null, true).find((m) => m.type === type);
test("108 unique cards; 27 per player", () => {
  assert.equal(deck().length, 108);
  assert.equal(new Set(deck().map((c) => c.id)).size, 108);
  let g = new Game();
  g.deal();
  assert.deepEqual(
    g.hands.map((h) => h.length),
    [27, 27, 27, 27],
  );
});
test("level order, joker pair restrictions, wild singles and pairs", () => {
  assert(beats(has([c(7)], "Single"), has([c(14)], "Single")));
  assert(!has([c(15), c(16)], "Pair"));
  assert(has([c(15), c(15)], "Pair"));
  assert.deepEqual(
    moves([c(7, "♥")], 7, null, true).map((m) => m.ranks),
    [[7]],
  );
  assert.deepEqual(
    moves(cs(7, 2, "♥"), 7, null, true).map((m) => m.ranks),
    [[7, 7]],
  );
  assert(!has([c(15), c(7, "♥")], "Pair"));
});
test("ace low/high runs, no wraps, natural rank at level", () => {
  assert(has([c(14), c(2, "♥"), c(3), c(4), c(5)], "Straight"));
  assert(has([c(10), c(11, "♥"), c(12), c(13), c(14)], "Straight"));
  assert(!has([c(12), c(13, "♥"), c(14), c(2), c(3)], "Straight"));
  assert(has([c(5), c(6, "♥"), c(7), c(8), c(9)], "Straight"));
  assert(has([...cs(14, 2), ...cs(2, 2), ...cs(3, 2)], "Tube"));
  assert(has([...cs(14, 3), ...cs(2, 3)], "Plate"));
  assert(!has([c(11), c(12), c(13), c(14), c(15)], "Straight"));
});
test("straight flush classification and bomb hierarchy", () => {
  let four = has(cs(14, 4), "4-card bomb"),
    five = has(cs(2, 5), "5-card bomb"),
    flush = has(
      [2, 3, 4, 5, 6].map((r) => c(r)),
      "Straight flush",
    ),
    six = has(cs(2, 6), "6-card bomb"),
    jokers = has([c(15), c(15), c(16), c(16)], "Four-joker bomb");
  assert(beats(five, four));
  assert(beats(flush, five));
  assert(beats(six, flush));
  assert(beats(jokers, six));
  assert(
    !has(
      [2, 3, 4, 5, 6].map((r) => c(r)),
      "Straight",
    ),
  );
});
test("wildcards form independent ranks, full houses and ten-card bombs", () => {
  const a = [c(3), c(4, "♦"), c(5), c(7, "♥"), c(7, "♥")];
  assert(has(a, "Straight"));
  assert(has([...cs(9, 3), c(4), c(7, "♥")], "Full house"));
  assert(has([...cs(9, 8), ...cs(7, 2, "♥")], "10-card bomb"));
  assert(!has([...cs(15, 2), ...cs(7, 2, "♥")], "4-card bomb"));
});
test("three passes, finished-player lead transfer, invalid moves atomic", () => {
  let g = new Game();
  g.phase = "playing";
  g.hands = [[c(3)], [c(4)], [c(5), c(6)], [c(8)]];
  g.turn = 0;
  g.play(0, [g.hands[0][0].id]);
  g.pass(1);
  g.pass(2);
  g.pass(3);
  assert.equal(g.turn, 2);
  assert.equal(g.trick, null);
  assert.throws(() => g.pass(2));
  let before = JSON.stringify(g.hands);
  assert.throws(() => g.play(2, ["missing"]));
  assert.equal(JSON.stringify(g.hands), before);
});
test("winner alone promotes; +3/+2/+1 finishes", () => {
  for (const [order, delta] of [
    [[0, 2], 3],
    [[0, 1, 2], 2],
    [[0, 1, 3], 1],
  ]) {
    let g = new Game();
    g.order = order;
    g.endRound();
    assert.equal(g.levels[0], 2 + delta);
    assert.equal(g.levels[1], 2);
    assert.equal(g.declarer, 0);
  }
});
test("ace success, challengers climb normally, third failure resets", () => {
  let g = new Game();
  g.level = 14;
  g.levels = [14, 4];
  g.order = [0, 2];
  g.endRound();
  assert.equal(g.phase, "game-over");
  g = new Game();
  g.level = 14;
  g.levels = [14, 4];
  g.order = [1, 3];
  g.endRound();
  // Challengers climb normally from their own level (4 + 3), not straight to Ace.
  assert.equal(g.levels[1], 7);
  assert.equal(g.levels[0], 14);
  assert.equal(g.failures[0], 1);
  assert.equal(g.phase, "round-over");
  assert.equal(g.declarer, 1);
  g = new Game();
  g.level = 14;
  g.levels = [14, 4];
  g.failures[0] = 2;
  g.order = [0, 1, 3];
  g.endRound();
  assert.equal(g.levels[0], 2);
});
test("all-aces demotion checks the actual 1st-place finisher, not whoever ends the hand", () => {
  // Declarers (team 0) are on level Ace. Opponent (player 1) finishes 1st with a
  // non-ace single. Declarers (0,2) finish 2nd/3rd. Opponent's partner (player 3)
  // finishes LAST with a single ace. The official rule keys off the *first*-place
  // finisher's own final play, which was not aces, so this must NOT reset to level 2.
  let g = new Game();
  g.levels = [14, 5];
  g.declarer = 0;
  g.failures = [0, 0];
  g.phase = "playing";
  g.level = 14;
  g.hands = [[c(3)], [c(6)], [c(4)], [c(14)]];
  g.order = [];
  g.turn = 1;
  g.trick = null;
  g.passes = 0;
  g.play(1, [g.hands[1][0].id]); // player1 finishes 1st: single 6 (not ace)
  g.hands = [g.hands[0], [], g.hands[2], g.hands[3]];
  g.order = [1, 0, 2];
  g.turn = 3;
  g.trick = null;
  g.play(3, [g.hands[3][0].id]); // player3 finishes last: single ace
  assert.equal(g.result.partnerPlace, 4);
  assert.equal(g.result.demotion, false);
  assert.equal(g.levels[0], 14); // old declarers keep their Ace level, no reset to 2
  // Now the reverse: the actual 1st-place finisher's own final play IS all aces.
  g = new Game();
  g.levels = [14, 5];
  g.declarer = 0;
  g.failures = [0, 0];
  g.phase = "playing";
  g.level = 14;
  g.hands = [[c(3)], [c(14)], [c(4)], [c(6)]];
  g.order = [];
  g.turn = 1;
  g.trick = null;
  g.passes = 0;
  g.play(1, [g.hands[1][0].id]); // player1 finishes 1st: single ACE
  g.hands = [g.hands[0], [], g.hands[2], g.hands[3]];
  g.order = [1, 0, 2];
  g.turn = 3;
  g.trick = null;
  g.play(3, [g.hands[3][0].id]); // player3 finishes last: single 6 (not ace)
  assert.equal(g.result.demotion, true);
  assert.equal(g.levels[0], 2); // this time it IS a reset, because player1 (1st place) played all aces
});
test("tribute excludes wilds and returns chosen card, resistance works", () => {
  let g = new Game();
  g.round = 2;
  g.result = { order: [0, 2, 1, 3], partnerPlace: 2 };
  g.hands = [[c(3)], [c(16), c(2, "♥"), c(8)], [c(4)], [c(15), c(9)]];
  g.tribute();
  assert.equal(g.phase, "tribute");
  assert.equal(g.turn, 1);
  assert(g.hands[0].some((c) => c.r === 16));
  g.returnTribute(g.hands[0].find((c) => c.r === 3).id);
  assert.equal(g.phase, "playing");
  assert(g.hands[1].some((c) => c.r === 3));
  g = new Game();
  g.result = { order: [0, 2, 1, 3], partnerPlace: 2 };
  g.hands = [[c(3)], [c(16)], [c(4)], [c(16)]];
  const before = JSON.stringify(g.hands);
  g.tribute();
  assert.equal(JSON.stringify(g.hands), before);
  assert.equal(g.turn, 0);
});
test("30 seeded complete hands: legal AI moves, unique cards, no deadlocks", () => {
  let seed = 9823;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let g = new Game({ random });
  for (let hand = 0; hand < 30; hand++) {
    if (g.phase === "game-over") g = new Game({ random });
    g.deal();
    while (g.phase === "tribute") g.returnTribute(g.hands[0][0].id);
    assert.deepEqual(
      g.hands.map((h) => h.length),
      [27, 27, 27, 27],
    );
    assert.equal(new Set(g.hands.flat().map((c) => c.id)).size, 108);
    let turns = 0;
    while (g.phase === "playing" && turns++ < 600) {
      let p = g.turn,
        m = chooseAI(g, p);
      if (m)
        g.play(
          p,
          m.cards.map((c) => c.id),
          m.key,
        );
      else g.pass(p);
    }
    assert(turns < 600);
    assert.equal(g.result.order.length, 4);
    assert(g.result.partnerPlace >= 2);
  }
});

test("full-house wildcard declarations distinguish the chosen pair rank", () => {
  const cards = [...cs(9, 3), ...cs(7, 2, "♥")];
  const full = moves(cards, 7, null, true).filter(
    (m) => m.type === "Full house" && m.ranks[0] === 9,
  );
  assert(full.length > 1);
  assert.equal(new Set(full.map((m) => m.key)).size, full.length);
  const g = new Game();
  g.phase = "playing";
  g.level = 7;
  g.hands = [cards, [c(3)], [c(4)], [c(5)]];
  const chosen = full.find((m) => m.ranks[3] === 14);
  assert.equal(
    g.play(
      0,
      cards.map((c) => c.id),
      chosen.key,
    ).ranks[3],
    14,
  );
});
test("move search finds mixed-suit straight even when first cards form a flush", () => {
  const cards = [3, 4, 5, 6, 7].map((r) => c(r, "♠"));
  cards.push(c(5, "♦"));
  const options = moves(cards, 2);
  assert(options.some((m) => m.type === "Straight" && m.value === 7));
  assert(options.some((m) => m.type === "Straight flush" && m.value === 7));
});

test("challengers near Ace stop at Ace and must then win as declarers", () => {
  const g = new Game();
  g.level = 14;
  g.levels = [14, 12];
  g.order = [1, 3];
  g.endRound();
  assert.equal(g.levels[1], 14);
  assert.equal(g.phase, "round-over");
});
test("tribute returns must be 10 or lower unless the hand has none", () => {
  let n = 0;
  const c = (r, s = "♠") => ({ id: `t${n++}`, r, s });
  const g = new Game({ manualTribute: true });
  g.phase = "tribute";
  g.level = 2;
  g.hands = [[c(13), c(9), c(14)], [], [], []];
  g.returns = [{ from: 0, to: 1, received: g.hands[0][2].id }];
  assert.throws(() => g.returnTribute(g.hands[0][0].id, 0), /10 or lower/);
  g.returnTribute(g.hands[0][1].id, 0);
  assert.equal(g.phase, "playing");
  const h = new Game({ manualTribute: true });
  h.phase = "tribute";
  h.level = 2;
  h.hands = [[c(13), c(12), c(16)], [], [], []];
  h.returns = [{ from: 0, to: 1, received: h.hands[0][2].id }];
  h.returnTribute(h.hands[0][0].id, 0); // no low card: any card is allowed
  assert.equal(h.phase, "playing");
  // A low tribute card just received does not count as "having a low card".
  const k = new Game({ manualTribute: true });
  k.phase = "tribute";
  k.level = 2;
  k.hands = [[c(13), c(12), c(9)], [], [], []];
  k.returns = [{ from: 0, to: 1, received: k.hands[0][2].id }];
  assert.throws(() => k.returnTribute(k.hands[0][2].id, 0), /10 or lower/);
  k.returnTribute(k.hands[0][0].id, 0);
  assert.equal(k.phase, "playing");
});
test("AI tribute returns respect the 10-or-lower rule", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let x = seed;
    const random = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const g = new Game({ random });
    g.deal();
    g.result = { order: [1, 3, 0, 2], partnerPlace: 2 };
    g.phase = "round-over";
    const before = g.history.length;
    g.deal();
    for (const line of g.history.slice(before))
      if (/ returns /.test(line)) assert.match(line, / returns (\d+)/, line);
  }
  const low = chooseTributeReturn(
    [
      { id: "a", r: 14, s: "♠" },
      { id: "b", r: 13, s: "♠" },
      { id: "c", r: 8, s: "♣" },
    ],
    "a",
    2,
  );
  assert.equal(low.id, "c");
});
