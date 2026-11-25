// AI Arena: plays many hands between two AI levels and reports win rates.
// This is the measuring stick for tuning or training better AIs.
//
//   node ai/arena.mjs expert hard 400        # Team A = expert, Team B = hard, 400 hands
//
// Seats 0 and 2 are Team A, seats 1 and 3 Team B. Every deal is replayed with the
// teams swapped, so neither side benefits from luckier cards.

import { Game, chooseAI } from "../dist/engine.js";
import { pathToFileURL } from "node:url";

export function seeded(seed) {
  // mulberry32: small, fast, reproducible
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plays one hand. levels[team] is an AI level name ("easy" ... "expert") or a
// function (game, seat) => move | null, so a tuned or trained AI can be tested
// without changing the game. Returns the hand result.
export function playHand(seed, levels, aiRandom = seeded(seed ^ 0x9e3779b9)) {
  const g = new Game({ random: seeded(seed), manualTribute: true });
  g.deal();
  let steps = 0;
  while (g.phase === "playing" && steps++ < 2000) {
    const p = g.turn,
      ai = levels[p % 2],
      m = typeof ai === "function" ? ai(g, p) : chooseAI(g, p, ai, aiRandom);
    if (m)
      g.play(
        p,
        m.cards.map((c) => c.id),
        m.key,
      );
    else g.pass(p);
  }
  if (g.phase !== "round-over")
    throw Error("Hand did not finish: seed " + seed);
  return g.result;
}

export function match(a, b, hands = 200, seed = 1) {
  let wins = 0,
    points = 0,
    total = 0;
  for (let i = 0; i < hands; i++) {
    for (const swap of [false, true]) {
      const levels = swap ? [b, a] : [a, b];
      const r = playHand(seed + i, levels);
      const aTeam = swap ? 1 : 0;
      const won = r.winner === aTeam;
      wins += won;
      points += (won ? 1 : -1) * r.delta;
      total++;
    }
  }
  return {
    a: String(a.name || a),
    b: String(b.name || b),
    hands: total,
    winRate: wins / total,
    pointsPerHand: points / total,
  };
}

// pathToFileURL handles Windows drive letters and backslashes.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [a = "expert", b = "hard", n = "200"] = process.argv.slice(2);
  const t = Date.now();
  const r = match(a, b, Number(n));
  console.log(
    `${a} vs ${b}: ${r.hands} hands, ${a} wins ${(r.winRate * 100).toFixed(1)}%, ` +
      `net levels/hand ${r.pointsPerHand >= 0 ? "+" : ""}${r.pointsPerHand.toFixed(2)} ` +
      `(${((Date.now() - t) / r.hands).toFixed(0)} ms/hand)`,
  );
}
