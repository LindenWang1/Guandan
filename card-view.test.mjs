import test from "node:test";
import assert from "node:assert/strict";
import { cardHTML, isRedCard } from "./dist/card-view.js";

test("card markup marks red suits, wilds, jokers and selection", () => {
  const heart = { id: "0-5-♥", r: 5, s: "♥" };
  assert.ok(isRedCard(heart));
  assert.ok(isRedCard({ id: "0-16", r: 16, s: "★" }));
  assert.ok(!isRedCard({ id: "0-15", r: 15, s: "★" }));
  const wildCard = cardHTML(heart, {
    level: 5,
    interactive: true,
    selected: true,
  });
  assert.match(wildCard, /^<button class="card red wild selected"/);
  assert.match(wildCard, /data-card="0-5-♥"/);
  assert.match(wildCard, /aria-label="5 ♥, wild"/);
  assert.match(wildCard, /aria-pressed="true"/);
  const joker = cardHTML({ id: "1-15", r: 15, s: "★" }, { level: 2 });
  assert.match(joker, /^<div class="card joker">/);
  assert.match(joker, /JOKER/);
  assert.doesNotMatch(joker, /data-card/);
});
test("selection and tribute dimming only apply to interactive cards", () => {
  const card = { id: "0-12-♠", r: 12, s: "♠" };
  const shown = cardHTML(card, { level: 2, selected: true, unavailable: true });
  assert.doesNotMatch(shown, /selected|unavailable/);
  const blocked = cardHTML(card, {
    level: 2,
    interactive: true,
    unavailable: true,
  });
  assert.match(blocked, /class="card unavailable"/);
});
