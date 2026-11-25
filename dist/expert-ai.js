// Expert Practice AI.
//
// Uses only information a real player has: its own hand, the public card
// counts, and every card already played this hand (g.playedCards). It never
// reads opponents' or its partner's card faces.
//
// 1. Plan. Split the hand into the fewest plays (straights, tubes, plates,
//    full houses, bombs...) and score that plan: fewer plays is better, bombs
//    and high "control" cards are worth keeping, wilds stay flexible.
// 2. Track. Cards not in this hand and not yet played are "unseen". A move no
//    unseen non-bomb combination can beat is a sure way to win the lead.
// 3. Choose. Every legal move (and passing) is scored as "plan of the cards
//    left after it" plus table context: help a partner who is almost out,
//    avoid feeding an opponent who is almost out, save bombs until needed.

import { deck, moves, strength, wild } from "./engine.js";

// Every tunable number in one place. A training/tuning script can pass its own
// object to chooseExpert(g, p, weights) and compare win rates in ai/arena.mjs.
export const DEFAULT_WEIGHTS = Object.freeze({
  play: 10, // cost of each play still needed to empty the hand
  bombKeep: 9, // value of holding a bomb in reserve
  control: 3, // value of a high single/pair/triple (A, level card, joker)
  spareWild: 4, // value of an unused wild card
  leadHeight: 0.6, // leading: prefer low cards
  leadBomb: 18, // leading with a bomb when no opponent is close to finishing
  leadBombDanger: 4, // ... and when one is
  leadLength: 0.8, // leading: prefer shedding long combinations
  leadBoss: 8, // leading a combination nobody can beat, near the end
  feedPartner: 14, // leading a shape a nearly-finished partner can follow
  feedOpponent: 16, // leading a shape a nearly-finished opponent can follow
  passBase: 3, // giving up the trick
  passDanger: 30, // ... when its owner is close to finishing
  passCritical: 12, // ... when an opponent has finished or holds 1-2 cards
  followHeight: 0.35, // following: prefer low cards
  followBomb: 22, // bombing an ordinary trick
  followBombDanger: 2, // bombing when an opponent is close to finishing
  followBombClose: 6, // bombing when we are close to finishing
  followBoss: 6, // following with a combination nobody can beat, near the end
});

// ---------- 1. hand planning ----------

function countsOf(cards, level) {
  const counts = Array(17).fill(0);
  let wilds = 0;
  for (const c of cards) {
    if (wild(c, level)) wilds++;
    else counts[c.r]++;
  }
  return { counts, wilds };
}

// Runs use natural order, A may be low (index 1) or high (14).
const runRank = (i) => (i === 1 ? 14 : i);

function leftoverScore(counts, wilds, level, runs, W) {
  let plays = runs,
    bombs = 0,
    controls = 0,
    singles = [],
    pairs = 0,
    triples = 0;
  for (let r = 2; r <= 14; r++) {
    const c = counts[r];
    if (!c) continue;
    const high = strength(r, level) >= 14;
    if (c >= 4) {
      bombs++;
      plays++;
    } else if (c === 3) {
      triples++;
      plays++;
      if (high) controls++;
    } else if (c === 2) {
      pairs++;
      plays++;
      if (high) controls++;
    } else {
      singles.push(r);
      plays++;
      if (high) controls++;
    }
  }
  // Jokers: four of them are the top bomb; otherwise same-colour pairs or singles.
  if (counts[15] === 2 && counts[16] === 2) {
    bombs += 2; // worth more than an ordinary bomb
    plays++;
  } else
    for (const r of [15, 16]) {
      if (!counts[r]) continue;
      plays++;
      controls += counts[r] === 2 ? 2 : 1;
    }
  // A triple carries a pair as a full house: one play instead of two.
  plays -= Math.min(triples, pairs);
  // Each wild turns a loose single into a pair (or tops up a run), saving a play.
  const used = Math.min(wilds, singles.length);
  plays -= used;
  const spareWilds = wilds - used;
  return (
    plays * W.play -
    bombs * W.bombKeep -
    controls * W.control -
    spareWilds * W.spareWild
  );
}

function planScore(cards, level, W = DEFAULT_WEIGHTS) {
  const { counts, wilds } = countsOf(cards, level);
  const memo = new Map();
  const search = (runs, depth) => {
    const key = counts.join(",") + "|" + runs;
    if (memo.has(key)) return memo.get(key);
    let best = leftoverScore(counts, wilds, level, runs, W);
    if (depth < 4) {
      // Try removing each run shape: [length, copies per rank].
      for (const [len, k] of [
        [5, 1],
        [3, 2],
        [2, 3],
      ]) {
        for (let start = 1; start + len - 1 <= 14; start++) {
          let ok = true;
          for (let i = 0; i < len && ok; i++) {
            const c = counts[runRank(start + i)];
            // Never break a bomb to make a run.
            ok = c >= k && c < 4;
          }
          if (!ok) continue;
          for (let i = 0; i < len; i++) counts[runRank(start + i)] -= k;
          best = Math.min(best, search(runs + 1, depth + 1));
          for (let i = 0; i < len; i++) counts[runRank(start + i)] += k;
        }
      }
    }
    memo.set(key, best);
    return best;
  };
  return search(0, 0);
}

// ---------- 2. card tracking ----------

export function unseenCards(g, p) {
  const known = new Set(g.hands[p].map((c) => c.id));
  for (const entry of g.playedCards || [])
    for (const c of entry.move.cards) known.add(c.id);
  return deck().filter((c) => !known.has(c.id));
}

// True when no unseen cards can form a non-bomb combination that beats m.
function isBoss(m, unseen, level) {
  if (m.bomb) return false;
  return !moves(unseen, level, m).some((x) => !x.bomb);
}

// ---------- 3. move choice ----------

const without = (hand, m) => {
  const used = new Set(m.cards.map((c) => c.id));
  return hand.filter((c) => !used.has(c.id));
};

export function chooseExpert(g, p, W = DEFAULT_WEIGHTS) {
  const hand = g.hands[p],
    level = g.level,
    trick = g.trick,
    options = moves(hand, level, trick?.move);
  if (!options.length) return null;
  const finish = options.find((m) => m.cards.length === hand.length);
  if (finish) return finish;

  const count = (i) => g.hands[i].length,
    partner = (p + 2) % 4,
    nextOpp = (p + 1) % 4,
    prevOpp = (p + 3) % 4,
    oppMin = Math.min(...[nextOpp, prevOpp].map((i) => count(i) || Infinity)),
    danger = oppMin <= 6;

  // Partner is winning the trick: let it stand.
  if (trick && trick.player % 2 === p % 2) return null;

  const unseen = unseenCards(g, p);
  const bossCache = new Map();
  const boss = (m) => {
    if (!bossCache.has(m.key)) bossCache.set(m.key, isBoss(m, unseen, level));
    return bossCache.get(m.key);
  };
  const scoreCache = new Map();
  const after = (m) => {
    const k = m.cards
      .map((c) => c.id)
      .sort()
      .join();
    if (!scoreCache.has(k))
      scoreCache.set(k, planScore(without(hand, m), level, W));
    return scoreCache.get(k);
  };

  // Pre-filter: only examine the most plan-friendly candidates in depth.
  let ranked = options
    .map((m) => ({ m, s: after(m) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, 24);

  const rest = (m) => hand.length - m.cards.length;
  const top = (m) => (m.bomb ? 20 : m.value);

  if (!trick) {
    // Leading.
    let best = null;
    for (const { m, s } of ranked) {
      let score = s + top(m) * W.leadHeight;
      if (m.bomb) score += danger ? W.leadBombDanger : W.leadBomb;
      // Shed long combinations early; they are hard to play later.
      score -= m.cards.length * W.leadLength;
      // A lead nobody can beat keeps control, most valuable near the end.
      if (boss(m) && rest(m) <= 12) score -= W.leadBoss;
      // Feed a partner who is nearly out with a small, matching shape.
      const pc = count(partner);
      if (pc > 0 && pc <= 2 && m.cards.length === pc && !m.bomb)
        score -= W.feedPartner - top(m) * 0.4;
      // Do not hand an almost-finished opponent an easy matching shape.
      for (const o of [nextOpp, prevOpp]) {
        const oc = count(o);
        if (oc > 0 && oc === m.cards.length && !boss(m))
          score += W.feedOpponent;
      }
      if (!best || score < best.score) best = { m, score };
    }
    return best.m;
  }

  // Following an opponent's combination: compare playing with passing.
  const leaderCards = count(trick.player);
  let passScore = planScore(hand, level, W) + W.passBase;
  if (leaderCards > 0 && leaderCards <= 6)
    passScore += W.passDanger - leaderCards * 3;
  if (leaderCards === 0 || oppMin <= 2) passScore += W.passCritical;
  // The opponent may be about to go out on this trick if nobody stops it.
  let best = { m: null, score: passScore };
  for (const { m, s } of ranked) {
    let score = s + top(m) * W.followHeight;
    if (m.bomb) {
      // Bombs are for stopping a near-finished opponent or closing out.
      score += danger
        ? W.followBombDanger
        : rest(m) <= 6
          ? W.followBombClose
          : W.followBomb;
      if (trick.move.bomb) score -= 2;
    }
    if (boss(m)) score -= rest(m) <= 10 ? W.followBoss : 2;
    if (score < best.score) best = { m, score };
  }
  return best.m;
}

// Which card to hand back after receiving tribute: the one whose loss hurts
// the hand plan least, preferring low cards.
export function chooseTributeReturn(hand, receivedId, level) {
  let best = null;
  for (const c of hand) {
    if (c.id === receivedId || wild(c, level)) continue;
    const rest = hand.filter((x) => x.id !== c.id);
    const score = planScore(rest, level) + strength(c.r, level) * 1.5;
    if (!best || score < best.score) best = { c, score };
  }
  return best?.c ?? hand.find((c) => c.id !== receivedId);
}

export const _test = { planScore, isBoss };
