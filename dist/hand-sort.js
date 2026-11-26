// Hand arrangement: sort orders, rank stacks, bomb finders and Auto-Group.
// Display only. Nothing here changes the game's own copy of the hand.

import { moves, sorted, strength, wild, SUITS } from "./engine.js";

export const SORT_MODES = ["rank", "rank-desc", "suit", "bombs"];
export const SORT_LABELS = {
  rank: "Rank: Low to High",
  "rank-desc": "Rank: High to Low",
  suit: "Suit",
  bombs: "Bombs First",
};
export const validSort = (mode) => (SORT_MODES.includes(mode) ? mode : "rank");

const runRank = (i) => (i === 1 ? 14 : i);
const ids = (cards) => new Set(cards.map((c) => c.id));
const without = (pool, cards) => {
  const gone = ids(cards);
  return pool.filter((c) => !gone.has(c.id));
};

// Natural (no wild) straight flushes, highest first, that do not break a
// rank bomb below four cards. Cards are returned in run order.
function naturalStraightFlushes(pool) {
  const found = [];
  let rest = pool;
  for (let again = true; again; ) {
    again = false;
    for (let start = 10; start >= 1 && !again; start--)
      for (const s of SUITS) {
        const run = [];
        for (let i = 0; i < 5; i++) {
          const r = runRank(start + i),
            count = rest.filter((c) => c.r === r).length,
            card = rest.find((c) => c.r === r && c.s === s);
          if (!card || (count >= 4 && count - 1 < 4)) break;
          run.push(card);
        }
        if (run.length === 5) {
          found.push(run);
          rest = without(rest, run);
          again = true;
          break;
        }
      }
  }
  return found;
}

// Bomb cards first (rank bombs weakest to strongest, then natural straight
// flushes, then the four jokers), followed by everything else by rank.
function bombsFirst(cards, level) {
  let pool = cards.filter((c) => !wild(c, level));
  const front = [];
  const byRank = new Map();
  for (const c of pool) byRank.set(c.r, (byRank.get(c.r) || 0) + 1);
  const rankBombs = [...byRank]
    .filter(([r, n]) => r <= 14 && n >= 4)
    .sort(
      (a, b) => a[1] - b[1] || strength(a[0], level) - strength(b[0], level),
    )
    .map(([r]) => r);
  for (const r of rankBombs) {
    const set = sorted(
      pool.filter((c) => c.r === r),
      level,
    );
    front.push(...set);
    pool = without(pool, set);
  }
  for (const run of naturalStraightFlushes(pool)) {
    front.push(...run);
    pool = without(pool, run);
  }
  const jokers = pool.filter((c) => c.r >= 15);
  if (jokers.length === 4) front.push(...sorted(jokers, level));
  return [...front, ...sorted(without(cards, front), level)];
}

export function arrange(cards, level, mode = "rank") {
  if (mode === "rank-desc") return sorted(cards, level).reverse();
  if (mode === "suit") return sorted(cards, level, true);
  if (mode === "bombs") return bombsFirst(cards, level);
  return sorted(cards, level);
}

// Rank stacks for the stacked layout: neighbouring cards of the same rank
// share a column, so the columns follow the chosen sort order.
export function rankStacks(cards) {
  const stacks = [];
  for (const c of cards) {
    const last = stacks.at(-1);
    if (last && last[0].r === c.r) last.push(c);
    else stacks.push([c]);
  }
  return stacks;
}

// Every bomb in the hand, weakest first. A rank bomb is listed once, at its
// largest size, so a finder cycles through different bombs.
export function findBombs(hand, level, type = null) {
  const all = moves(hand, level).filter(
    (m) => m.bomb > 0 && (!type || m.type === type),
  );
  const largest = new Map();
  for (const m of all)
    if (/card bomb$/.test(m.type)) {
      const best = largest.get(m.ranks[0]);
      if (!best || m.cards.length > best.cards.length)
        largest.set(m.ranks[0], m);
    }
  return all
    .filter((m) => !/card bomb$/.test(m.type) || largest.get(m.ranks[0]) === m)
    .sort((a, b) => a.bomb - b.bomb || a.value - b.value);
}

// Fewest plays for the cards left after bombs: try up to four runs
// (straights, tubes, plates) and count the rest as singles, pairs and triples.
function bestRuns(counts) {
  const memo = new Map();
  const cost = () => {
    let plays = 0,
      triples = 0,
      pairs = 0;
    for (let r = 2; r <= 14; r++) {
      if (!counts[r]) continue;
      plays++;
      if (counts[r] === 3) triples++;
      if (counts[r] === 2) pairs++;
    }
    return plays - Math.min(triples, pairs);
  };
  const search = (depth) => {
    const key = counts.join(",") + "|" + depth;
    if (memo.has(key)) return memo.get(key);
    let best = { plays: cost(), runs: [] };
    if (depth < 4)
      for (const [len, k] of [
        [5, 1],
        [3, 2],
        [2, 3],
      ])
        for (let start = 1; start + len - 1 <= 14; start++) {
          let ok = true;
          for (let i = 0; i < len && ok; i++)
            ok = counts[runRank(start + i)] >= k;
          if (!ok) continue;
          for (let i = 0; i < len; i++) counts[runRank(start + i)] -= k;
          const next = search(depth + 1);
          for (let i = 0; i < len; i++) counts[runRank(start + i)] += k;
          if (next.plays + 1 < best.plays)
            best = {
              plays: next.plays + 1,
              runs: [[len, k, start], ...next.runs],
            };
        }
    memo.set(key, best);
    return best;
  };
  return search(0).runs;
}

// One-tap organizing: bombs (four jokers, natural straight flushes, rank
// bombs), the runs that leave the fewest plays, then triples. Wild cards,
// pairs and singles stay loose so you keep their flexibility.
export function autoGroup(hand, level) {
  let pool = hand.filter((c) => !wild(c, level));
  const out = [];
  const keep = (cards, type) => {
    const m = moves(cards, level, null, true).find(
      (m) => !type || m.type === type,
    );
    if (m) {
      out.push(m);
      pool = without(pool, cards);
    }
  };
  const runs = [],
    bombs = [];
  const jokers = pool.filter((c) => c.r >= 15);
  for (const run of naturalStraightFlushes(pool)) {
    pool = without(pool, run);
    bombs.push(run);
  }
  for (let r = 2; r <= 14; r++) {
    const set = pool.filter((c) => c.r === r);
    if (set.length >= 4) {
      pool = without(pool, set);
      bombs.unshift(set);
    }
  }
  const counts = Array(15).fill(0);
  for (const c of pool) if (c.r <= 14) counts[c.r]++;
  for (const [len, k, start] of bestRuns(counts)) {
    const cards = [];
    for (let i = 0; i < len; i++) {
      const r = runRank(start + i),
        picked = sorted(
          pool.filter((c) => c.r === r && !cards.includes(c)),
          level,
          true,
        ).slice(0, k);
      cards.push(...picked);
    }
    runs.push(cards);
    pool = without(pool, cards);
  }
  for (const cards of runs) keep(cards);
  for (let r = 2; r <= 14; r++) {
    const set = pool.filter((c) => c.r === r);
    if (set.length === 3) keep(set, "Triple");
  }
  for (const cards of bombs) keep(cards);
  if (jokers.length === 4) keep(jokers, "Four-joker bomb");
  return out;
}
