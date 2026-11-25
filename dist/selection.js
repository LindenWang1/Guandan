// Undo only changes the local selection, never a submitted play or saved group.
export function selectionRange(ids, anchor, target) {
  const a = ids.indexOf(anchor),
    b = ids.indexOf(target);
  return a < 0 || b < 0
    ? [target]
    : ids.slice(Math.min(a, b), Math.max(a, b) + 1);
}
export class SelectionHistory {
  constructor() {
    this.stack = [];
    this.context = "";
  }
  sync(context) {
    if (context !== this.context) {
      this.context = context;
      this.clear();
    }
  }
  clear() {
    this.stack = [];
  }
  remember(ids, declaration = "") {
    this.stack.push({ ids: [...ids], declaration });
    if (this.stack.length > 20) this.stack.shift();
  }
  restore(hand) {
    const previous = this.stack.pop();
    if (!previous) return null;
    const available = new Set(hand.map((c) => c.id));
    return {
      ids: new Set(previous.ids.filter((id) => available.has(id))),
      declaration: previous.declaration,
    };
  }
}
