# Version 3.2: One-Screen Table and Tribute Markers

## Your Hand Fits on One Screen

- **One Row of Cards.** On laptop and desktop screens (wider than 850px) your
  whole hand sits in a single row. Cards overlap only as much as they need to,
  and the rank and suit corner of every card always shows. Before, a 27-card
  hand wrapped onto two rows and the second row slid under the action bar.
- **Saved Groups Sit Beside Your Hand.** With Organize, grouped cards appear to
  the right of the loose cards in the same row, each labelled with its
  combination ("Pair · 5"). Before, they were listed below the hand, so you had
  to scroll to see both your cards and the table.
- **Compact Organize Tools.** The five group buttons and their help text share
  one line, and the shift-click tip hides while they are open.
- **Short Screens.** At 720 to 800px tall, spacing tightens so the table, a
  full hand, three saved groups and the action buttons still fit without
  scrolling (checked at 1280 × 720, 1366 × 768, 1440 × 900 and 1536 × 864).
- **No More Jumping Board.** The table stays anchored under the header. Before,
  it was centred vertically, so the whole board shifted whenever the hand area
  changed height (during tribute, after you finished, when opening Organize).
- Cards you may not choose (for example during tribute) are darkened instead of
  faded, so overlapping cards stay solid. Phones keep the previous layout.

## Tribute Markers

- **Who Paid What.** From the second hand on, a small tag beside each seat shows
  that hand's tribute: *Paid A♠ · Got Back 5♣* for a player who paid, *Got A♠ ·
  Returned 5♣* for a player who received, *No Tribute* for seats not involved,
  and *Resisted* when the losing side holds both Big Jokers. Tags face the
  table and stay up for the whole hand.
- **Your Received Card Stands Out.** While you choose a card to return, the
  tribute you just received is outlined in gold and slightly raised.
- Works in AI Practice and online rooms, in English and Chinese (进贡, 收贡, 还贡,
  收回, 无进贡, 抗贡). Tribute cards are public at a real table, so every seat
  sees the same tags.

## Code and Tests

- `engine.js` keeps `tributes`, a record of the current hand's tribute cards;
  the room server sends it to each seat from that seat's point of view, and a
  restored practice game keeps only well-formed records.
- `tribute-markers.test.mjs` adds 7 tests (92 in total): single, double,
  returned and resisted tribute, the online view, practice restore, the
  received-card outline and the Chinese labels.
