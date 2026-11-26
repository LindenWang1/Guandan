# Version 3.4: Take Back and AI Pace

## A Calmer AI Pace

- **Two Seconds by Default.** Practice AI players now wait 2 seconds before
  each move (it was 0.95), and 0.6 seconds more before leading a new trick, so
  you can see who won the last one before the table moves on.
- **Four Choices, in Settings.** Settings → Practice → AI Pace: *Quick*
  (1 s), *Normal* (1.5 s), *Relaxed* (2 s, the default) and *Learning* (3 s).
  The same choice is still at the bottom of How to Play. A pace saved by an
  earlier version keeps its name (Quick, Relaxed or Learning).
- **Online AI Seats Too.** AI seats in online rooms now move every 1.5 seconds
  (was 0.8), and wait 2.1 seconds before leading a new trick. They stay a
  little quicker than practice because real people are waiting on them.

## Take Back (悔牌), Off by Default

- Turn it on in Settings → Practice → Take Back Moves. A *Take Back ↶* button
  then appears with the hand tools. Each press returns the table to just
  before your last play, pass or tribute return in the current hand,
  including undoing the AI moves that followed, and it is your turn again.
- **Practice Only.** The button never appears in online rooms, and it stays
  off for anyone who has not chosen it, so practice keeps its challenge.
- **Within One Hand.** Snapshots last until the hand ends. Once a hand is
  complete (and its result recorded), it cannot be taken back. After a take
  back the AI may answer differently, because its choices are not fixed in
  advance.
- **Safe Restore.** Each snapshot is a saved practice game, restored with the
  same checks used when you reload the page.

## Code and Tests

- New `dist/take-back.js` (added to `assets.mjs`; the release check now counts
  28 assets). The pace choices live in `preferences.js` and are shared by
  Settings and How to Play.
- `practice-options.test.mjs` adds 6 tests for Take Back and AI pace (106 in
  total).
