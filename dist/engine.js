import { emptyScorebook, recordScore } from "./scorebook.js";
import { chooseExpert } from "./expert-ai.js";
export const SUITS = ["♠", "♥", "♣", "♦"];
export const names = ["You", "River", "Jade", "Lotus"];
export const rankName = (r) =>
  ({ 11: "J", 12: "Q", 13: "K", 14: "A", 15: "Small Joker", 16: "Big Joker" })[
    r
  ] || String(r);
export const wild = (c, l) => c.r === l && c.s === "♥";
export const strength = (r, l) => (r >= 15 ? r + 2 : r === l ? 16 : r);
// Standard tribute rule: the card handed back must be a 10 or lower. A hand
// with no such card may return any card.
export const RETURN_MAX = 10;
export function returnableCards(hand, receivedId = null) {
  const others = hand.filter((c) => c.id !== receivedId);
  const low = others.filter((c) => c.r <= RETURN_MAX);
  return low.length ? low : others.length ? others : hand;
}
export function deck() {
  let a = [];
  for (let d = 0; d < 2; d++) {
    for (let r = 2; r <= 14; r++)
      for (const s of SUITS) a.push({ id: `${d}-${r}-${s}`, r, s });
    for (let r = 15; r <= 16; r++) a.push({ id: `${d}-${r}`, r, s: "★" });
  }
  return a;
}
export function shuffled(random = Math.random) {
  let a = deck();
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function sorted(cards, l, suit = false) {
  return [...cards].sort(
    (a, b) =>
      (suit ? SUITS.indexOf(a.s) - SUITS.indexOf(b.s) : 0) ||
      strength(a.r, l) - strength(b.r, l) ||
      SUITS.indexOf(a.s) - SUITS.indexOf(b.s) ||
      a.id.localeCompare(b.id),
  );
}
const templateCache = new Map();
export function templates(l) {
  if (templateCache.has(l)) return templateCache.get(l);
  const t = [];
  const add = (type, ranks, value, bomb = 0, suit = null) =>
    t.push({ type, ranks, value, bomb, suit });
  for (let r = 2; r <= 16; r++) {
    add("Single", [r], strength(r, l));
    add("Pair", [r, r], strength(r, l));
    if (r <= 14) {
      add("Triple", [r, r, r], strength(r, l));
      for (let p = 2; p <= 16; p++)
        if (p !== r) add("Full house", [r, r, r, p, p], strength(r, l));
      for (let n = 4; n <= 10; n++)
        add(
          `${n}-card bomb`,
          Array(n).fill(r),
          strength(r, l),
          n < 6 ? n : n + 1,
        );
    }
  }
  for (const [type, n, k] of [
    ["Straight", 5, 1],
    ["Tube", 3, 2],
    ["Plate", 2, 3],
  ]) {
    for (let start = 1; start <= 15 - n; start++) {
      const ranks = Array.from({ length: n }, (_, i) =>
        start + i === 1 ? 14 : start + i,
      ).flatMap((r) => Array(k).fill(r));
      const top = start + n - 1;
      add(type, ranks, top);
      if (type === "Straight")
        for (const s of SUITS) add("Straight flush", ranks, top, 6, s);
    }
  }
  add("Four-joker bomb", [15, 15, 16, 16], 99, 12);
  templateCache.set(l, t);
  return t;
}
function fill(hand, t, l) {
  if (t.ranks.length > hand.length) return null;
  const w = hand.filter((c) => wild(c, l)),
    natural = hand.filter((c) => !wild(c, l));
  let used = new Set(),
    cards = [],
    as = [];
  for (const r of t.ranks) {
    let c = natural.find(
      (c) => c.r === r && (!t.suit || c.s === t.suit) && !used.has(c.id),
    );
    if (!c) {
      if (r >= 15) return null;
      c = w.find((c) => !used.has(c.id));
    }
    if (!c) return null;
    used.add(c.id);
    cards.push(c);
    as.push({ r, s: t.suit || c.s });
  }
  if (t.type === "Single" && wild(cards[0], l) && t.ranks[0] !== l) return null;
  if (t.type === "Pair" && cards.every((c) => wild(c, l)) && t.ranks[0] !== l)
    return null;
  if (t.type === "Straight" && new Set(as.map((c) => c.s)).size === 1) {
    const wi = cards.findIndex((c) => wild(c, l));
    if (wi >= 0) as[wi].s = SUITS.find((s) => s !== as[0].s);
    else {
      // A hand may contain both a flush and a mixed-suit straight of the same ranks.
      const alternate = natural.find(
        (c) => t.ranks.includes(c.r) && c.s !== as[0].s && !used.has(c.id),
      );
      if (!alternate) return null;
      const index = t.ranks.indexOf(alternate.r);
      cards[index] = alternate;
      as[index] = { r: alternate.r, s: alternate.s };
    }
  }
  return {
    ...t,
    cards,
    as,
    key: `${t.type}/${t.value}/${t.suit || ""}${t.type === "Full house" ? "/" + t.ranks[3] : ""}`,
  };
}
export function beats(a, b) {
  if (!b) return true;
  if (a.bomb || b.bomb)
    return (
      a.bomb > b.bomb || (a.bomb === b.bomb && a.bomb > 0 && a.value > b.value)
    );
  return a.type === b.type && a.value > b.value;
}
export function moves(hand, l, previous = null, exact = false) {
  return templates(l)
    .filter(
      (t) =>
        t.ranks.length <= hand.length &&
        (!exact || t.ranks.length === hand.length) &&
        beats(t, previous),
    )
    .map((t) => fill(hand, t, l))
    .filter((m) => m && beats(m, previous));
}
export function label(m) {
  if (!m) return "";
  // Display names in Title Case; m.type itself stays the internal id.
  const name = m.type.replace(
    /(^|[\s-])([a-z])/g,
    (_, gap, c) => gap + c.toUpperCase(),
  );
  return `${name}${m.type === "Four-joker bomb" ? "" : ` · ${rankName(m.ranks[0])}${["Straight", "Straight flush", "Tube", "Plate"].includes(m.type) ? "–" + rankName(m.value) : ""}`}`;
}
export function chooseAI(g, p, difficulty = "normal", random = Math.random) {
  const hand = g.hands[p],
    options = moves(hand, g.level, g.trick?.move);
  if (!options.length) return null;
  const finish = options.find((m) => m.cards.length === hand.length);
  if (finish) return finish;
  if (difficulty === "expert") return chooseExpert(g, p);
  if (g.trick && g.trick.player % 2 === p % 2) return null;
  if (difficulty === "easy" && random() < 0.6)
    return options[
      Math.min(options.length - 1, Math.floor(random() * options.length))
    ];
  const threat = g.hands.some(
    (h, i) => i % 2 !== p % 2 && h.length > 0 && h.length <= 5,
  );
  let best = options[0],
    bestScore = score(best);
  for (const candidate of options.slice(1)) {
    const candidateScore = score(candidate);
    if (candidateScore < bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }
  return best;
  function score(m) {
    const wildCost = m.cards.filter((c) => wild(c, g.level)).length * 5;
    // Hard uses only this player's cards and public counts, never opponents' faces.
    let shapeCost = 0;
    if (difficulty === "hard") {
      const used = new Set(m.cards.map((c) => c.id));
      const before = new Map(),
        after = new Map();
      for (const c of hand) {
        before.set(c.r, (before.get(c.r) || 0) + 1);
        if (!used.has(c.id)) after.set(c.r, (after.get(c.r) || 0) + 1);
      }
      for (const [r, count] of after) {
        if (count === 1 && r < 15) shapeCost += 3;
        if (before.get(r) >= 4 && count < 4) shapeCost += 16;
        else if (before.get(r) >= 2 && count === 1) shapeCost += 4;
      }
    }
    return (
      shapeCost +
      (m.bomb ? (threat ? 22 : 85) : 0) +
      m.value * 0.65 -
      m.cards.length * (g.trick ? 1 : 5) +
      wildCost
    );
  }
}
export class Game {
  constructor({
    doubleUp = 3,
    random = Math.random,
    manualTribute = false,
    playerNames = names,
  } = {}) {
    this.manualTribute = manualTribute;
    this.names = [...playerNames];
    this.doubleUp = doubleUp;
    this.random = random;
    this.levels = [2, 2];
    this.failures = [0, 0];
    this.declarer = 0;
    this.round = 0;
    this.history = [];
    this.playedCards = [];
    this.phase = "ready";
    this.hands = [[], [], [], []];
    this.level = 2;
    this.turn = 0;
    this.order = [];
    this.trick = null;
    this.passes = 0;
    this.lastMoves = ["", "", "", ""];
    this.result = null;
    this.scorebook = emptyScorebook();
    this.returns = [];
    this.finishMoves = [null, null, null, null];
  }
  log(message) {
    if (this.history.length >= 500) this.history.shift();
    this.history.push(`Hand ${this.round} · ${message}`);
  }
  deal() {
    if (!["ready", "round-over"].includes(this.phase))
      throw Error("Finish this hand first.");
    this.round++;
    this.level = this.levels[this.declarer];
    this.hands = [[], [], [], []];
    const cards = shuffled(this.random);
    const drawFirst = this.result?.order[3] ?? Math.floor(this.random() * 4);
    cards.forEach((c, i) => this.hands[(drawFirst + i) % 4].push(c));
    this.order = [];
    this.trick = null;
    this.passes = 0;
    this.lastMoves = ["", "", "", ""];
    this.lastActualMove = null;
    this.playedCards = [];
    this.finishMoves = [null, null, null, null];
    this.returns = [];
    this.phase = "playing";
    this.turn = this.result?.order[0] ?? Math.floor(this.random() * 4);
    this.log(
      `Playing ${rankName(this.level)}. ${rankName(this.level)}♥ is wild.`,
    );
    if (this.result) this.tribute();
    this.hands = this.hands.map((h) => sorted(h, this.level));
    return this;
  }
  tribute() {
    const order = this.result.order;
    let losers = this.result.partnerPlace === 2 ? order.slice(2) : [order[3]];
    let reds = losers.reduce(
      (n, p) => n + this.hands[p].filter((c) => c.r === 16).length,
      0,
    );
    if (reds === 2) {
      this.log("Tribute resisted: losing side holds both Big Jokers.");
      this.turn = order[0];
      return;
    }
    const tributes = losers
      .map((p) => ({
        p,
        card: [...this.hands[p]]
          .filter((c) => !wild(c, this.level))
          .sort(
            (a, b) => strength(b.r, this.level) - strength(a.r, this.level),
          )[0],
      }))
      .sort(
        (a, b) =>
          strength(b.card.r, this.level) - strength(a.card.r, this.level) ||
          ((a.p - order[0] + 4) % 4) - ((b.p - order[0] + 4) % 4),
      );
    this.turn = tributes[0].p;
    tributes.forEach((t, i) => {
      let receiver = order[i];
      this.hands[t.p] = this.hands[t.p].filter((c) => c.id !== t.card.id);
      this.hands[receiver].push(t.card);
      this.log(
        `${this.names[t.p]} pays ${rankName(t.card.r)}${t.card.s} to ${this.names[receiver]}.`,
      );
      if (receiver === 0 || this.manualTribute)
        this.returns.push({ from: receiver, to: t.p, received: t.card.id });
      else {
        let back = sorted(
          returnableCards(this.hands[receiver], t.card.id),
          this.level,
        )[0];
        this.hands[receiver] = this.hands[receiver].filter(
          (c) => c.id !== back.id,
        );
        this.hands[t.p].push(back);
        this.log(
          `${this.names[receiver]} returns ${rankName(back.r)}${back.s} to ${this.names[t.p]}.`,
        );
      }
    });
    if (this.returns.length) this.phase = "tribute";
  }
  returnTribute(id, p = 0) {
    if (this.phase !== "tribute") throw Error("No tribute to return.");
    const ix = this.returns.findIndex((x) => (x.from ?? 0) === p);
    if (ix < 0) throw Error("You have no tribute to return.");
    const c = this.hands[p].find((c) => c.id === id);
    if (!c) throw Error("Select one card from your hand.");
    // Same rule the AI uses: a low card other than the tribute just received.
    const received = this.returns[ix].received;
    if (!returnableCards(this.hands[p], received).some((x) => x.id === id))
      throw Error("Return a card of 10 or lower.");
    const [item] = this.returns.splice(ix, 1);
    this.hands[p] = this.hands[p].filter((c) => c.id !== id);
    this.hands[item.to].push(c);
    this.log(
      `${this.names[p]} returns ${rankName(c.r)}${c.s} to ${this.names[item.to]}.`,
    );
    if (!this.returns.length) this.phase = "playing";
  }
  play(p, ids, key) {
    if (this.phase !== "playing" || this.turn !== p || !this.hands[p].length)
      throw Error("It is not your turn.");
    if (new Set(ids).size !== ids.length)
      throw Error("A card cannot be used twice.");
    const cards = ids.map((id) => this.hands[p].find((c) => c.id === id));
    if (!ids.length || cards.some((c) => !c))
      throw Error("Choose cards from your hand.");
    const legal = moves(cards, this.level, this.trick?.move, true);
    let move = key ? legal.find((m) => m.key === key) : legal[0];
    if (!move) throw Error("That combination cannot beat the table.");
    this.hands[p] = this.hands[p].filter((c) => !ids.includes(c.id));
    this.trick = { player: p, move };
    this.lastActualMove = { player: p, move };
    this.playedCards.push({ player: p, move });
    this.passes = 0;
    this.lastMoves[p] = label(move);
    this.log(`${this.names[p]} plays ${label(move)}.`);
    if (!this.hands[p].length) {
      this.finishMoves[p] = move;
      this.order.push(p);
      this.log(
        `${this.names[p]} finishes ${this.order.length}${["", "st", "nd", "rd", "th"][this.order.length]}.`,
      );
      if (this.order.some((i) => this.order.includes((i + 2) % 4))) {
        this.endRound();
        return move;
      }
    }
    this.turn = (p + 1) % 4;
    this.skipFinished();
    return move;
  }
  pass(p) {
    if (this.phase !== "playing" || this.turn !== p)
      throw Error("It is not your turn.");
    if (!this.trick)
      throw Error("Lead a combination; you cannot pass on an empty table.");
    this.doPass(p);
    this.skipFinished();
  }
  doPass(p) {
    this.lastMoves[p] = this.hands[p].length ? "Pass" : "Finished";
    this.passes++;
    if (this.passes === 3) {
      const leader = this.trick.player;
      this.turn = this.hands[leader].length ? leader : (leader + 2) % 4;
      this.trick = null;
      this.passes = 0;
      this.lastMoves = ["", "", "", ""];
      this.log(`${this.names[this.turn]} leads the next trick.`);
    } else this.turn = (p + 1) % 4;
  }
  skipFinished() {
    let guard = 0;
    while (
      this.phase === "playing" &&
      !this.hands[this.turn].length &&
      guard++ < 8
    ) {
      if (!this.trick) {
        this.turn = (this.turn + 2) % 4;
        break;
      }
      this.doPass(this.turn);
    }
  }
  endRound() {
    const order = [
        ...this.order,
        ...[0, 1, 2, 3].filter((p) => !this.order.includes(p)),
      ],
      winner = order[0] % 2,
      partnerPlace = order.indexOf((order[0] + 2) % 4) + 1,
      delta = partnerPlace === 2 ? this.doubleUp : partnerPlace === 3 ? 2 : 1;
    const oldLevel = this.level,
      oldDeclarer = this.declarer;
    let gameWon =
      winner === oldDeclarer && oldLevel === 14 && partnerPlace <= 3;
    let demotion = false;
    if (oldLevel === 14 && !gameWon) {
      this.failures[oldDeclarer]++;
      const allAces =
        winner !== oldDeclarer &&
        this.finishMoves[order[0]]?.as.every((c) => c.r === 14);
      if (this.failures[oldDeclarer] >= 3 || allAces) {
        this.levels[oldDeclarer] = 2;
        this.failures[oldDeclarer] = 0;
        demotion = true;
      }
    }
    if (!gameWon) {
      // Winners always climb from their own level; a demoted Ace team that
      // still won the hand stays on 2 rather than climbing straight back.
      if (winner !== oldDeclarer || !demotion)
        this.levels[winner] = Math.min(14, this.levels[winner] + delta);
      this.declarer = winner;
    }
    this.result = { order, winner, partnerPlace, delta, gameWon, demotion };
    this.scorebook = recordScore(this.scorebook, this.result, this.round);
    this.phase = gameWon ? "game-over" : "round-over";
    this.log(
      `${this.manualTribute ? (winner === 0 ? "Team A" : "Team B") : winner === 0 ? "Your team" : "Opponents"} wins 1–${partnerPlace}${gameWon ? " and wins the game!" : `. Now level ${rankName(this.levels[winner])}.`}`,
    );
    if (demotion) this.log("Failed Ace team returns to level 2.");
  }
}
