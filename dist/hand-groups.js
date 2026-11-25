import { moves, sorted } from "./engine.js";

// Private display state only. Never reorder or otherwise mutate the game's hand.
export class HandGroups {
  constructor(groups = []) {
    this.groups = groups;
    this.nextId = 1;
  }
  clear() {
    this.groups = [];
  }
  sync(hand, level) {
    const owned = new Map(hand.map((c) => [c.id, c])),
      used = new Set();
    this.groups = this.groups.filter((g) => {
      if (
        !g ||
        !/^g\d+$/.test(g.id) ||
        !Array.isArray(g.ids) ||
        !g.ids.length ||
        g.ids.some((id) => !owned.has(id) || used.has(id)) ||
        new Set(g.ids).size !== g.ids.length
      )
        return false;
      const options = moves(
          g.ids.map((id) => owned.get(id)),
          level,
          null,
          true,
        ),
        move = options.find((m) => m.key === g.key);
      if (!move) return false;
      g.ids = move.cards.map((c) => c.id);
      g.ids.forEach((id) => used.add(id));
      return true;
    });
  }
  options(hand, ids, level) {
    const chosen = new Set(ids),
      cards = hand.filter((c) => chosen.has(c.id));
    return cards.length === chosen.size ? moves(cards, level, null, true) : [];
  }
  add(hand, ids, level, key) {
    const options = this.options(hand, ids, level),
      move = key ? options.find((m) => m.key === key) : options[0];
    if (!move) throw Error("Select a valid combination to group.");
    const chosen = new Set(move.cards.map((c) => c.id));
    this.groups = this.groups.filter(
      (g) => !g.ids.some((id) => chosen.has(id)),
    );
    let id;
    do {
      id = "g" + this.nextId++;
    } while (this.groups.some((g) => g.id === id));
    const group = { id, ids: move.cards.map((c) => c.id), key: move.key };
    this.groups.push(group);
    return group;
  }
  selected(ids) {
    const selected = new Set(ids);
    return this.groups.find(
      (g) =>
        g.ids.length === selected.size && g.ids.every((id) => selected.has(id)),
    );
  }
  release(ids) {
    const selected = new Set(ids);
    this.groups = this.groups.filter(
      (g) => !g.ids.some((id) => selected.has(id)),
    );
  }
  move(ids, direction) {
    const group = this.selected(ids),
      index = this.groups.indexOf(group),
      next = index + direction;
    if (index < 0 || next < 0 || next >= this.groups.length) return false;
    [this.groups[index], this.groups[next]] = [
      this.groups[next],
      this.groups[index],
    ];
    return true;
  }
  sections(hand, level, suit = false) {
    this.sync(hand, level);
    const byId = new Map(hand.map((c) => [c.id, c])),
      used = new Set(this.groups.flatMap((g) => g.ids));
    const sections = this.groups.map((g) => ({
      ...g,
      cards: g.ids.map((id) => byId.get(id)),
      move: moves(
        g.ids.map((id) => byId.get(id)),
        level,
        null,
        true,
      ).find((m) => m.key === g.key),
    }));
    const loose = sorted(
      hand.filter((c) => !used.has(c.id)),
      level,
      suit,
    );
    return [...(loose.length ? [{ id: null, cards: loose }] : []), ...sections];
  }
}
