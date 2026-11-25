export const emptyScorebook = () => ({
  matchNumber: 1,
  hands: 0,
  points: [0, 0],
  handWins: [0, 0],
  matchWins: [0, 0],
  firsts: [0, 0, 0, 0],
  lastRound: null,
});
export function readScorebook(value) {
  const valid = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000;
  if (
    !value ||
    !valid(value.matchNumber) ||
    !value.matchNumber ||
    !valid(value.hands) ||
    !["points", "handWins", "matchWins", "firsts"].every(
      (k) =>
        Array.isArray(value[k]) &&
        value[k].length === (k === "firsts" ? 4 : 2) &&
        value[k].every(valid),
    ) ||
    value.handWins[0] + value.handWins[1] !== value.hands ||
    value.firsts.reduce((a, b) => a + b, 0) !== value.hands ||
    value.points.some(
      (p, i) => p < value.handWins[i] || p > value.handWins[i] * 3,
    ) ||
    value.matchWins.some((m, i) => m > value.handWins[i]) ||
    !(
      value.lastRound === null ||
      (typeof value.lastRound === "string" && /^\d+:\d+$/.test(value.lastRound))
    )
  )
    return emptyScorebook();
  return {
    matchNumber: value.matchNumber,
    hands: value.hands,
    points: [...value.points],
    handWins: [...value.handWins],
    matchWins: [...value.matchWins],
    firsts: [...value.firsts],
    lastRound: value.lastRound,
  };
}
export function recordScore(book, result, round) {
  const next = readScorebook(book),
    key = `${next.matchNumber}:${round}`;
  if (next.lastRound === key) return next;
  const points =
    result.partnerPlace === 2 ? 3 : result.partnerPlace === 3 ? 2 : 1;
  next.hands++;
  next.points[result.winner] += points;
  next.handWins[result.winner]++;
  next.firsts[result.order[0]]++;
  if (result.gameWon) next.matchWins[result.winner]++;
  next.lastRound = key;
  return next;
}
export function nextMatchScorebook(book) {
  const next = readScorebook(book);
  next.matchNumber++;
  next.lastRound = null;
  return next;
}
export function rotateScorebook(book, seat) {
  const next = readScorebook(book);
  if (seat % 2)
    for (const key of ["points", "handWins", "matchWins"]) next[key].reverse();
  next.firsts = [0, 1, 2, 3].map((i) => next.firsts[(i + seat) % 4]);
  return next;
}
