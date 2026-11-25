// One priority order for the sticky action area's state and explanation.

export function playFeedback({
  phase,
  paused,
  connected,
  closed,
  busy,
  tribute,
  turn,
  remaining,
}) {
  if (closed)
    return {
      state: "waiting",
      label: "Match Ended",
      help: "Find a new table to play again.",
    };
  if (!connected)
    return {
      state: "waiting",
      label: "Reconnecting",
      help: "Your seat is saved. Reconnect to continue.",
    };
  if (busy)
    return {
      state: "waiting",
      label: "Sending…",
      help: "Confirming Your Action…",
    };
  if (phase === "ready")
    return {
      state: "waiting",
      label: "Ready to play",
      help: "Deal a hand to begin.",
    };
  if (paused)
    return {
      state: "paused",
      label: "Paused",
      help: "Resume when you are ready.",
    };
  if (tribute)
    return {
      state: "turn",
      label: "Return Tribute",
      help: "Select one card to return.",
    };
  if (phase !== "playing")
    return {
      state: "waiting",
      label: "Hand Complete",
      help: "Review the result above.",
    };
  if (!remaining)
    return {
      state: "waiting",
      label: "You’re Out",
      help: "Cheer on your partner.",
    };
  return turn === 0
    ? { state: "turn", label: "Your Turn", help: "Select cards to play." }
    : {
        state: "waiting",
        label: "Waiting for Your Turn",
        help: "You can organize your hand while you wait.",
      };
}
