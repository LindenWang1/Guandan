# Version 3.5: Interactive Tutorial

- **Learn to Play.** A new button beside *Deal a Practice Hand* (and *Try the
  Interactive Tutorial* at the top of How to Play) opens nine short lessons:
  your table, combinations, beating the table, runs, wild cards, bombs,
  tribute, climbing levels, and the hand tools.
- **Hands-On.** Six lessons ask you to pick real cards, for example "select a
  pair that beats the 9s" or "use the wild 7♥ to complete a straight", and one
  asks how many levels a 1st–2nd finish climbs. Answers are checked by the
  same rules engine the game uses. A wrong answer gets a hint; a right one
  unlocks Next.
- **Safe to Try Anytime.** The tutorial runs in the dialog and never touches
  your saved practice game. Skip Tutorial closes it; the last lesson deals a
  practice hand when the table is empty.
- **English and Chinese.** Every lesson, hint and button is translated.
- New `dist/tutorial.js` (added to `assets.mjs`; the release check now counts
  29 assets) and `tutorial.test.mjs` with 4 tests (110 in total).
