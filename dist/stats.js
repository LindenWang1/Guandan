// Practice-mode match record only. Online matches are social, not scored here.
// Storage is injected (see i18n.js's installLanguageToggle for the same pattern)
// so the pure logic below is testable without a browser, and so a blocked or
// full localStorage degrades to an in-memory session instead of throwing.

const DEFAULT = { matches: 0, wins: 0, streak: 0, bestStreak: 0 };

export function parseStats(raw) {
  try {
    const s = JSON.parse(raw);
    if (
      s &&
      typeof s === "object" &&
      Number.isInteger(s.matches) &&
      s.matches >= 0 &&
      Number.isInteger(s.wins) &&
      s.wins >= 0 &&
      s.wins <= s.matches &&
      Number.isInteger(s.streak) &&
      s.streak >= 0 &&
      s.streak <= s.wins &&
      Number.isInteger(s.bestStreak) &&
      s.bestStreak >= s.streak &&
      s.bestStreak <= s.wins
    )
      return s;
  } catch {}
  return { ...DEFAULT };
}

export function recordMatch(stats, won) {
  const matches = stats.matches + 1;
  const wins = stats.wins + (won ? 1 : 0);
  const streak = won ? stats.streak + 1 : 0;
  return {
    matches,
    wins,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

const KEY = "guandan-practice-stats";

export function practiceStats(storage) {
  let current;
  try {
    current = parseStats(storage?.getItem(KEY));
  } catch {
    current = { ...DEFAULT };
  }
  return {
    get() {
      return { ...current };
    },
    record(won) {
      current = recordMatch(current, won);
      try {
        storage?.setItem(KEY, JSON.stringify(current));
      } catch {
        /* Keep the in-memory result. */
      }
      return { ...current };
    },
  };
}
