import test from "node:test";
import {
  emptyScorebook,
  readScorebook,
  recordScore,
  nextMatchScorebook,
  rotateScorebook,
} from "./dist/scorebook.js";
import { Game } from "./dist/engine.js";

test("scorebook counts partners, individual firsts and zero-sum net points once per hand", () => {
  let book = emptyScorebook();
  for (const [round, winner, partnerPlace, order] of [
    [1, 0, 2, [2, 0, 1, 3]],
    [2, 1, 3, [1, 0, 3, 2]],
    [3, 0, 4, [0, 1, 3, 2]],
  ]) {
    const result = { winner, partnerPlace, order, gameWon: round === 3 };
    book = recordScore(book, result, round);
    assert.deepEqual(recordScore(book, result, round), book);
  }
  assert.deepEqual(book.points, [4, 2]);
  assert.deepEqual(book.handWins, [2, 1]);
  assert.deepEqual(book.firsts, [1, 1, 1, 0]);
  assert.deepEqual(book.matchWins, [1, 0]);
  assert.equal(book.hands, 3);
  const rotated = rotateScorebook(book, 1);
  assert.deepEqual(rotated.points, [2, 4]);
  assert.deepEqual(rotated.firsts, [1, 1, 0, 1]);
  const next = recordScore(
    nextMatchScorebook(book),
    { winner: 1, partnerPlace: 2, order: [3, 1, 0, 2], gameWon: false },
    1,
  );
  assert.deepEqual(next.points, [4, 5]);
  assert.equal(next.matchNumber, 2);
  assert.deepEqual(readScorebook({ points: ["bad"] }), emptyScorebook());
});

test("engine records scoring independently from the optional four-level double-up", () => {
  const g = new Game({ doubleUp: 4 });
  g.round = 1;
  g.order = [0, 2];
  g.endRound();
  assert.equal(g.result.delta, 4);
  assert.deepEqual(g.scorebook.points, [3, 0]);
  assert.deepEqual(g.scorebook.handWins, [1, 0]);
});
import assert from "node:assert/strict";
import { parseStats, recordMatch, practiceStats } from "./dist/stats.js";

const ZERO = { matches: 0, wins: 0, streak: 0, bestStreak: 0 };

test("parseStats defaults on missing, malformed, or tampered data", () => {
  assert.deepEqual(parseStats(null), ZERO);
  assert.deepEqual(parseStats(undefined), ZERO);
  assert.deepEqual(parseStats("not json"), ZERO);
  assert.deepEqual(parseStats('{"matches":1}'), ZERO); // missing fields
  assert.deepEqual(
    parseStats('{"matches":1,"wins":5,"streak":0,"bestStreak":0}'),
    ZERO,
  ); // wins > matches
  assert.deepEqual(
    parseStats('{"matches":3,"wins":2,"streak":5,"bestStreak":5}'),
    ZERO,
  ); // streak > wins
  assert.deepEqual(
    parseStats('{"matches":3,"wins":2,"streak":1,"bestStreak":0}'),
    ZERO,
  ); // bestStreak < streak
  assert.deepEqual(
    parseStats('{"matches":-1,"wins":0,"streak":0,"bestStreak":0}'),
    ZERO,
  ); // negative
  assert.deepEqual(
    parseStats('{"matches":3,"wins":2,"streak":1,"bestStreak":2}'),
    { matches: 3, wins: 2, streak: 1, bestStreak: 2 },
  );
});

test("recordMatch tracks wins, resets streak on a loss, and keeps the best streak", () => {
  let s = ZERO;
  s = recordMatch(s, true);
  assert.deepEqual(s, { matches: 1, wins: 1, streak: 1, bestStreak: 1 });
  s = recordMatch(s, true);
  assert.deepEqual(s, { matches: 2, wins: 2, streak: 2, bestStreak: 2 });
  s = recordMatch(s, false);
  assert.deepEqual(s, { matches: 3, wins: 2, streak: 0, bestStreak: 2 });
  s = recordMatch(s, true);
  assert.deepEqual(s, { matches: 4, wins: 3, streak: 1, bestStreak: 2 });
  s = recordMatch(s, true);
  assert.deepEqual(s, { matches: 5, wins: 4, streak: 2, bestStreak: 2 });
  s = recordMatch(s, true);
  assert.deepEqual(s, { matches: 6, wins: 5, streak: 3, bestStreak: 3 }); // new best
});

test("practiceStats persists through an injected storage", () => {
  const backing = new Map();
  const storage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, v),
  };
  const stats = practiceStats(storage);
  assert.deepEqual(stats.get(), ZERO);
  assert.deepEqual(stats.record(true), {
    matches: 1,
    wins: 1,
    streak: 1,
    bestStreak: 1,
  });
  assert.deepEqual(stats.record(false), {
    matches: 2,
    wins: 1,
    streak: 0,
    bestStreak: 1,
  });
  // a fresh instance reading the same backing store sees the persisted value
  assert.deepEqual(practiceStats(storage).get(), {
    matches: 2,
    wins: 1,
    streak: 0,
    bestStreak: 1,
  });
});

test("a storage that throws (private browsing, quota) degrades to in-memory, never crashes", () => {
  const throwing = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  const stats = practiceStats(throwing);
  assert.deepEqual(stats.get(), ZERO);
  assert.deepEqual(stats.record(true), {
    matches: 1,
    wins: 1,
    streak: 1,
    bestStreak: 1,
  });
});
