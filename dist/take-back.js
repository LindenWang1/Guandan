// Take Back (AI Practice only): return the table to just before your last
// play, pass or tribute return in the current hand. Each snapshot is a saved
// practice game, so restoring it goes through the same checks as reloading.

import { restorePractice } from "./practice-session.js";

export function createTakeBack(limit = 30) {
  let stack = [],
    context = "";
  const sync = (game) => {
    const next = `${game.practiceId || ""}:${game.round}`;
    if (next !== context) {
      context = next;
      stack = [];
    }
  };
  return {
    // Call just before one of your moves is applied.
    remember(game) {
      sync(game);
      stack.push(JSON.stringify({ version: 1, state: game }));
      if (stack.length > limit) stack.shift();
    },
    // The move failed (for example an illegal play): forget its snapshot.
    discard() {
      stack.pop();
    },
    available(game) {
      sync(game);
      return stack.length > 0 && ["playing", "tribute"].includes(game.phase);
    },
    restore(game) {
      if (!this.available(game)) return null;
      const restored = restorePractice(stack.pop());
      if (restored) restored.practiceId = game.practiceId;
      return restored;
    },
    clear() {
      stack = [];
    },
    get count() {
      return stack.length;
    },
  };
}
