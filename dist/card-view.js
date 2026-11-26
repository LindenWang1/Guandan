// Card markup shared by the hand, the table centre, grouped cards and the
// played-card history. Pure: everything it needs is passed in.

import { rankName, wild } from "./engine.js";

export const isRedCard = (c) => c.s === "♥" || c.s === "♦" || c.r === 16;

export function cardHTML(
  c,
  {
    level,
    interactive = false,
    selected = false,
    unavailable = false,
    received = false,
  } = {},
) {
  const tag = interactive ? "button" : "div",
    isWild = wild(c, level),
    joker = c.r >= 15,
    face = joker ? "★" : rankName(c.r);
  const classes = [
    "card",
    isRedCard(c) && "red",
    isWild && "wild",
    joker && "joker",
    interactive && selected && "selected",
    interactive && unavailable && "unavailable",
    interactive && received && "tribute-received",
  ]
    .filter(Boolean)
    .join(" ");
  const attributes = interactive
    ? ` data-card="${c.id}" aria-label="${rankName(c.r)} ${c.s}${isWild ? ", wild" : ""}" aria-pressed="${selected}"`
    : "";
  return `<${tag} class="${classes}"${attributes}><span>${face}</span><span class="suit">${joker ? "JOKER" : c.s}</span><span class="large-suit" aria-hidden="true">${joker ? "♛" : c.s}</span><span class="card-corner" aria-hidden="true">${face}<small>${joker ? "" : c.s}</small></span></${tag}>`;
}
