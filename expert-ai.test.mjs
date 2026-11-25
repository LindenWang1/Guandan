import test from "node:test";
import assert from "node:assert/strict";
import { Game, chooseAI, moves } from "./dist/engine.js";
import {
  chooseExpert,
  chooseTributeReturn,
  unseenCards,
  _test,
} from "./dist/expert-ai.js";
import { match, seeded } from "./ai/arena.mjs";

const card = (r, s = "♠", d = 0) => ({ id: `${d}-${r}-${s}`, r, s });

test("expert finishes legal hands from many deals", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const g = new Game({ random: seeded(seed) });
    g.deal();
    let steps = 0;
    while (g.phase === "playing" && steps++ < 2000) {
      const p = g.turn,
        m = chooseAI(g, p, "expert");
      if (m) {
        assert.ok(
          moves(g.hands[p], g.level, g.trick?.move).some(
            (x) => x.key === m.key,
          ),
        );
        g.play(
          p,
          m.cards.map((c) => c.id),
          m.key,
        );
      } else g.pass(p);
    }
    assert.equal(g.phase, "round-over");
  }
});

test("expert never reads other players' card faces", () => {
  const g = new Game({ random: seeded(7) });
  g.deal();
  for (let i = 0; i < 9; i++) {
    const p = g.turn,
      m = chooseExpert(g, p);
    const masked = {
      ...g,
      hands: g.hands.map((h, j) => (j === p ? h : Array(h.length).fill(null))),
    };
    assert.deepEqual(chooseExpert(masked, p)?.key, m?.key);
    if (m)
      g.play(
        p,
        m.cards.map((c) => c.id),
        m.key,
      );
    else g.pass(p);
  }
});

test("card tracking counts every unseen card exactly once", () => {
  const g = new Game({ random: seeded(3) });
  g.deal();
  const p = g.turn,
    m = chooseExpert(g, p);
  g.play(
    p,
    m.cards.map((c) => c.id),
    m.key,
  );
  const q = g.turn,
    unseen = unseenCards(g, q);
  assert.equal(unseen.length, 108 - g.hands[q].length - m.cards.length);
  assert.equal(new Set(unseen.map((c) => c.id)).size, unseen.length);
});

test("hand plan keeps bombs whole and values fewer plays", () => {
  const { planScore } = _test;
  const bomb = [card(9, "♠"), card(9, "♥"), card(9, "♣"), card(9, "♦")];
  const broken = [card(9, "♠"), card(9, "♥"), card(8, "♣"), card(8, "♦")];
  assert.ok(planScore(bomb, 2) < planScore(broken, 2));
  const straight = [3, 4, 5, 6, 7].map((r, i) =>
    card(r, ["♠", "♥", "♣"][i % 3]),
  );
  const scattered = [3, 5, 7, 9, 11].map((r) => card(r));
  assert.ok(planScore(straight, 2) < planScore(scattered, 2));
});

test("tribute return gives back a legal, low card", () => {
  const hand = [card(3), card(10), card(14), card(16, "★")];
  const back = chooseTributeReturn(hand, hand[3].id, 2);
  assert.notEqual(back.id, hand[3].id);
  assert.equal(back.r, 3);
});

test("ladder: expert beats hard on a fixed set of mirrored deals", () => {
  const r = match("expert", "hard", 40, 500);
  assert.ok(r.winRate > 0.55, `expert won only ${r.winRate}`);
});
