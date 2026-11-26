# Version 3.3: Sorting Options and Auto-Group

## Sort Your Hand Your Way

- **Sort Menu.** The Sort button is now a menu with four orders: *Rank: Low to
  High* (the default), *Rank: High to Low* (big cards on the left, as many
  Chinese apps show them), *Suit*, and *Bombs First*, which pulls rank bombs,
  natural straight flushes and the four jokers to the front.
- **Stack by Rank (竖排理牌).** Cards of the same rank stack in one column, with
  each card's corner showing. Columns follow the chosen sort order, so Bombs
  First with stacks puts your bombs on the left. Deep stacks tighten so a big
  bomb does not make the hand much taller. On phones, stacks fit a full hand
  in two rows instead of five.
- **Readable Stacks.** Each stacked card shows its rank and suit side by side
  in its visible strip ("7♥"), wild cards are tinted gold, and selected cards
  glow in place instead of lifting over the card above. Suit order stacks by
  rank, since a stack holds one rank.
- Both choices are saved on your device.

## Table

- **No Scrollbar in the Middle of the Table.** On shorter screens (about 770px
  tall or less) a six-card play, its name and the pass count did not fit, so
  the centre showed a scrollbar. Played cards there now shrink slightly to fit.

## Organize: Auto-Group and Bomb Finders

- **Auto-Group (一键理牌).** One tap groups your hand: the four jokers, natural
  straight flushes and rank bombs first, then the straights, tubes and plates
  that leave you the fewest plays, then triples. Wild cards, pairs and singles
  stay loose so you keep their flexibility. It replaces any groups you had;
  Release Group and Reset Groups still work as before.
- **Find Bomb / Find Straight Flush.** Each tap selects the next bomb (or
  straight flush) in your hand, weakest first, and says which one it is
  ("Bomb 2 of 3: 4-Card Bomb · 7"). Rank bombs are listed once, at their
  largest size. Straight flushes that need a wild card are included.

## Code and Tests

- New `dist/hand-sort.js` holds the sort orders, rank stacks, finders and
  Auto-Group; `hand-groups.js` uses it for the loose cards. It is added to the
  site's file list (`assets.mjs`), so the release check now counts 27 assets.
- `hand-sort.test.mjs` adds 8 tests (100 in total).
