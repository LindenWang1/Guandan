// Passes belong to the current winning play, not stale lastMoves from earlier plays.

export function tableStatus(game, player) {
  const ended = ["round-over", "game-over"].includes(game.phase);
  const order = ended && game.result ? game.result.order : game.order;
  const place = order.indexOf(player);
  const owner = game.phase === "playing" && game.trick?.player === player;
  const active = game.phase === "playing" && game.turn === player;
  const passed =
    game.phase === "playing" &&
    !!game.trick &&
    Array.from(
      { length: game.passes },
      (_, i) => (game.trick.player + i + 1) % 4,
    ).includes(player);
  return {
    owner,
    active,
    passed,
    place,
    label: owner
      ? "Cards on Table"
      : place >= 0
        ? "Finished"
        : passed
          ? "Passed"
          : active
            ? "To Play"
            : "",
  };
}
