import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "./dist/engine.js";
import { publicView } from "./server/rooms.js";
import { restorePractice } from "./dist/practice-session.js";
import { cardHTML } from "./dist/card-view.js";
import { translate } from "./dist/i18n.js";

// A reproducible random source, so every run deals the same cards.
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
// Deals hand 2 after a finish order, so tribute happens.
function afterFinish(order, partnerPlace, seed, options = {}) {
  const g = new Game({ random: seeded(seed), ...options });
  g.round = 1;
  g.result = { order, partnerPlace, winner: order[0] % 2, gameWon: false };
  return g.deal();
}

test("single tribute records the payment and the return", () => {
  for (let seed = 1; seed < 40; seed++) {
    const g = afterFinish([1, 0, 3, 2], 3, seed);
    if (g.tributes.some((t) => t.kind === "resist")) continue;
    const [pay, back] = g.tributes;
    assert.equal(pay.kind, "pay");
    assert.equal(pay.from, 2, "last place pays");
    assert.equal(pay.to, 1, "first place receives");
    assert.equal(back.kind, "return");
    assert.equal(back.from, 1);
    assert.equal(back.to, 2);
    assert.ok(g.hands[2].some((c) => c.id === back.card.id));
    assert.ok(g.hands[1].some((c) => c.id === pay.card.id));
    return;
  }
  assert.fail("no seed produced an unresisted tribute");
});

test("a return chosen by a person is recorded too", () => {
  for (let seed = 1; seed < 40; seed++) {
    const g = afterFinish([0, 1, 2, 3], 3, seed);
    if (g.phase !== "tribute") continue;
    assert.deepEqual(
      g.tributes.map((t) => t.kind),
      ["pay"],
    );
    const { received } = g.returns[0];
    const low = g.hands[0].find((c) => c.id !== received && c.r <= 10);
    g.returnTribute(low.id, 0);
    assert.deepEqual(g.tributes[1], {
      kind: "return",
      from: 0,
      to: 3,
      card: low,
    });
    return;
  }
  assert.fail("no seed gave You a tribute to return");
});

test("resisted tribute marks both losers, and the next deal clears markers", () => {
  const g = new Game({ random: seeded(7) });
  g.round = 1;
  g.result = { order: [0, 2, 1, 3], partnerPlace: 2, winner: 0 };
  // Hand both Big Jokers to the losing side before tribute is settled.
  const realDeal = g.tribute.bind(g);
  g.tribute = () => {
    const jokers = g.hands.flat().filter((c) => c.r === 16);
    for (const j of jokers)
      g.hands = g.hands.map((h) => h.filter((c) => c.id !== j.id));
    g.hands[1].push(jokers[0]);
    g.hands[3].push(jokers[1]);
    realDeal();
  };
  g.deal();
  assert.deepEqual(g.tributes, [
    { kind: "resist", from: 1 },
    { kind: "resist", from: 3 },
  ]);
  g.result = null;
  g.phase = "round-over";
  g.deal();
  assert.deepEqual(g.tributes, []);
});

test("online players see tribute seats from their own point of view", () => {
  for (let seed = 1; seed < 40; seed++) {
    const g = afterFinish([1, 0, 3, 2], 3, seed, { manualTribute: true });
    if (g.phase !== "tribute") continue;
    const row = {
      code: "ABCDEFGH",
      version: 1,
      state: JSON.stringify({
        host: 0,
        stage: "playing",
        doubleUp: 3,
        members: [0, 1, 2, 3].map((i) => ({ name: `P${i}`, ready: true })),
        game: g,
      }),
      presence: "[0,0,0,0]",
    };
    // Seat 2 paid seat 1. Seen from seat 1, the payer sits opposite.
    const [pay] = publicView(row, 1).game.tributes;
    assert.equal(pay.from, 1);
    assert.equal(pay.to, 0);
    assert.equal(pay.card.id, g.tributes[0].card.id);
    return;
  }
  assert.fail("no seed produced a manual tribute");
});

test("restored practice keeps valid tribute records and drops forged ones", () => {
  for (let seed = 1; seed < 40; seed++) {
    const g = afterFinish([1, 0, 3, 2], 3, seed);
    if (!g.tributes.some((t) => t.kind === "pay")) continue;
    const { random, ...state } = g;
    const good = restorePractice(JSON.stringify({ version: 1, state }));
    assert.deepEqual(good.tributes, g.tributes);
    const forged = restorePractice(
      JSON.stringify({
        version: 1,
        state: {
          ...state,
          tributes: [
            { kind: "pay", from: 2, to: 1, card: { id: "x", r: "<b>" } },
            { kind: "steal", from: 0 },
          ],
        },
      }),
    );
    assert.deepEqual(forged.tributes, []);
    return;
  }
  assert.fail("no seed produced a tribute");
});

test("the received tribute card is outlined in your hand", () => {
  const card = { id: "h5a", r: 5, s: "♥" };
  assert.match(
    cardHTML(card, { level: 2, interactive: true, received: true }),
    /class="card red tribute-received"/,
  );
  assert.doesNotMatch(cardHTML(card, { level: 2 }), /tribute-received/);
});

test("tribute marker words have Chinese translations", () => {
  for (const word of [
    "Paid",
    "Got",
    "Returned",
    "Got Back",
    "No Tribute",
    "Resisted",
    "Big Joker",
    "Small Joker",
  ])
    assert.notEqual(translate(word), word, word);
});
