// Interactive tutorial: nine short lessons that use real cards and the real
// rules engine. It runs in the dialog and never touches your saved game.

import { moves, beats, label, returnableCards, wild } from "./engine.js";

// "7♥" → a card; "b" suffix picks the second deck ("7♥b"); "BJ"/"SJ" jokers.
const c = (text) => {
  const second = text.endsWith("b"),
    t = second ? text.slice(0, -1) : text,
    d = second ? 1 : 0;
  if (t === "BJ" || t === "SJ")
    return {
      id: `${d}-${t === "BJ" ? 16 : 15}`,
      r: t === "BJ" ? 16 : 15,
      s: "★",
    };
  const s = t.slice(-1),
    r =
      { J: 11, Q: 12, K: 13, A: 14 }[t.slice(0, -1)] ?? Number(t.slice(0, -1));
  return { id: `${d}-${r}-${s}`, r, s };
};
const cards = (...texts) => texts.map(c);
// The play on the table for lessons that ask you to beat something.
const tablePlay = (level, ...texts) =>
  moves(cards(...texts), level, null, true).find((m) => !m.bomb) ||
  moves(cards(...texts), level, null, true)[0];

const exactMoves = (picked, level) =>
  picked.length ? moves(picked, level, null, true) : [];

export const LESSONS = [
  {
    title: "Your Table",
    text: [
      "Guandan is played by four people in two teams. Your partner sits opposite you; in AI Practice that is Jade.",
      "Each hand, everyone tries to play out all 27 cards. Your team wants to finish first, and ideally second too.",
    ],
  },
  {
    title: "Play a Combination",
    text: [
      "On your turn you play one combination: a single, a pair, a triple, a full house (a triple plus a pair), or a run.",
    ],
    task: "Select a full house, then press Check.",
    level: 2,
    hand: cards("6♠", "6♥", "6♣", "9♦", "9♠", "K♣", "3♥"),
    check(picked, level) {
      return exactMoves(picked, level).some((m) => m.type === "Full house")
        ? {
            ok: true,
            message: "That's a full house: three 6s with a pair of 9s.",
          }
        : {
            ok: false,
            message:
              "A full house is three cards of one rank plus a pair of another.",
          };
    },
  },
  {
    title: "Beat the Table",
    text: [
      "To follow, play the same kind of combination, higher. Otherwise pass. When three players pass in a row, the last player to play leads again.",
    ],
    task: "The table shows a pair of 9s. Select a pair that beats it.",
    level: 2,
    table: () => tablePlay(2, "9♣", "9♥"),
    hand: cards("4♣", "4♦", "10♥", "10♠", "8♣", "8♦", "J♣"),
    check(picked, level) {
      const previous = this.table();
      return exactMoves(picked, level).some(
        (m) => m.type === "Pair" && beats(m, previous),
      )
        ? { ok: true, message: "The pair of 10s beats the 9s." }
        : {
            ok: false,
            message: "You need two cards of the same rank, higher than 9.",
          };
    },
  },
  {
    title: "Runs",
    text: [
      "Runs use five or six cards in a row: a straight (5 ranks in a row), a tube (3 pairs in a row) or a plate (2 triples in a row). Aces can be low or high, but runs never wrap around.",
    ],
    task: "Select a straight.",
    level: 2,
    hand: cards("3♠", "4♥", "5♣", "6♦", "7♠", "7♥", "Q♣"),
    check(picked, level) {
      return exactMoves(picked, level).some((m) => m.type === "Straight")
        ? { ok: true, message: "3 to 7: a straight." }
        : {
            ok: false,
            message: "Pick five cards with ranks in a row, like 3-4-5-6-7.",
          };
    },
  },
  {
    title: "Wild Cards",
    text: [
      "Each hand is played at a level. This hand's level is 7. The two 7♥ in the deck are wild: each can stand in for any card except a joker.",
    ],
    task: "Use the wild 7♥ to complete a straight.",
    level: 7,
    hand: cards("8♠", "9♣", "10♦", "J♠", "7♥", "2♣", "K♦"),
    check(picked, level) {
      const usesWild = picked.some((x) => wild(x, level));
      return usesWild &&
        exactMoves(picked, level).some((m) => m.type === "Straight")
        ? { ok: true, message: "The wild 7♥ fills the gap, making a straight." }
        : { ok: false, message: "Choose 8, 9, 10 and J, plus the wild 7♥." };
    },
  },
  {
    title: "Bombs",
    text: [
      "A bomb beats any ordinary combination. From low to high: 4 of a kind, 5 of a kind, a straight flush, 6 to 10 of a kind, and finally all four jokers (天王炸).",
    ],
    task: "Nothing ordinary in this hand beats the straight on the table. Select a bomb.",
    level: 2,
    table: () => tablePlay(2, "10♣", "J♦", "Q♠", "K♥", "A♣"),
    hand: cards("5♠", "5♥", "5♣", "5♦", "K♣", "K♦", "3♠"),
    check(picked, level) {
      const previous = this.table();
      return exactMoves(picked, level).some(
        (m) => m.bomb > 0 && beats(m, previous),
      )
        ? {
            ok: true,
            message: "Four 5s make a bomb, which beats any straight.",
          }
        : {
            ok: false,
            message: "A bomb is four or more cards of the same rank.",
          };
    },
  },
  {
    title: "Tribute",
    text: [
      "From the second hand on, the losing team pays tribute: last place gives first place their highest card (both losers pay after a 1st–2nd finish). The winner then returns a card.",
    ],
    task: "You finished first, and Lotus paid you the A♠. Select a card to return: it must be 10 or lower.",
    level: 2,
    hand: cards("A♠", "Q♥", "9♣", "6♦", "3♠", "K♣"),
    received: "0-14-♠",
    check(picked) {
      if (picked.length !== 1)
        return { ok: false, message: "Return exactly one card." };
      return returnableCards(this.hand, this.received).some(
        (x) => x.id === picked[0].id,
      )
        ? {
            ok: true,
            message: "Good. Returning a low card keeps your strength.",
          }
        : {
            ok: false,
            message:
              "The return must be 10 or lower (and not the card you just received).",
          };
    },
  },
  {
    title: "Climbing Levels",
    text: [
      "Only the winning team climbs: 1st and 3rd climb 2 levels, 1st and 4th climb 1. Both teams start at 2, and the first team to win at Ace wins the match.",
    ],
    task: "You finish 1st and Jade, your partner, finishes 2nd. How many levels does your team climb?",
    choices: ["+1", "+2", "+3"],
    answer: "+3",
    check(_, __, choice) {
      return choice === this.answer
        ? {
            ok: true,
            message:
              "Right: a 1st–2nd finish climbs 3 levels (4 in the original variant, which you can pick under New Game).",
          }
        : {
            ok: false,
            message:
              "Finishing 1st and 2nd is the best result there is. Try a bigger number.",
          };
    },
  },
  {
    title: "Your Tools",
    text: [
      "Hint suggests a play; press it again for another. Sort and Stack by Rank arrange your hand. Organize holds Auto-Group, Find Bomb and Find Straight Flush. You can turn on Take Back in Settings to undo a move in practice.",
      "How to Play has the full rules whenever you need them. Ready for a real hand?",
    ],
  },
];

export function lessonLabel(m) {
  return m ? label(m) : "";
}

// Dialog controller. `cardHTML(card, level)` renders a card face.
export function createTutorial({
  showModal,
  closeModal,
  cardHTML,
  onFinish,
  // The last button deals a hand only when the table is empty.
  finishLabel = () => "Deal a Practice Hand ↗",
}) {
  let index = 0,
    picked = new Set(),
    choice = "",
    solved = false;
  const body = () => document.getElementById("modal-body");
  function render(message = "", ok = false) {
    const lesson = LESSONS[index],
      last = index === LESSONS.length - 1,
      interactive = !!lesson.check,
      table = lesson.table?.();
    showModal(
      `Tutorial · ${index + 1} of ${LESSONS.length}`,
      `<div class="tutorial" data-lesson="${index}"><h3>${lesson.title}</h3>${lesson.text.map((t) => `<p>${t}</p>`).join("")}${
        table
          ? `<div class="tutorial-table"><span>On the Table</span><strong>${lessonLabel(table)}</strong><div class="tutorial-cards">${table.cards.map((x) => cardHTML(x, lesson.level)).join("")}</div></div>`
          : ""
      }${lesson.task ? `<p class="tutorial-task">${lesson.task}</p>` : ""}${
        lesson.hand
          ? `<div class="tutorial-cards tutorial-hand">${lesson.hand
              .map(
                (x) =>
                  `<button type="button" class="tutorial-card${picked.has(x.id) ? " picked" : ""}${x.id === lesson.received ? " received" : ""}" data-tutorial-card="${x.id}" aria-pressed="${picked.has(x.id)}">${cardHTML(x, lesson.level)}</button>`,
              )
              .join("")}</div>`
          : ""
      }${
        lesson.choices
          ? `<div class="tutorial-choices">${lesson.choices.map((x) => `<button type="button" data-tutorial-choice="${x}" aria-pressed="${choice === x}">${x}</button>`).join("")}</div>`
          : ""
      }<p class="tutorial-feedback${ok ? " ok" : ""}" role="status">${message}</p><div class="tutorial-nav"><button type="button" data-tutorial="back" ${index ? "" : "disabled"}>Back</button><button type="button" data-tutorial="skip">Skip Tutorial</button>${interactive && !solved ? '<button type="button" class="gold-btn" data-tutorial="check">Check</button>' : ""}${last ? `<button type="button" class="gold-btn" data-tutorial="finish">${finishLabel()}</button>` : interactive && !solved ? "" : '<button type="button" class="gold-btn" data-tutorial="next">Next</button>'}</div></div>`,
    );
  }
  function go(next) {
    index = Math.max(0, Math.min(LESSONS.length - 1, next));
    picked = new Set();
    choice = "";
    solved = false;
    render();
  }
  function onClick(e) {
    if (!e.target.closest(".tutorial")) return;
    const lesson = LESSONS[index],
      cardButton = e.target.closest("[data-tutorial-card]"),
      choiceButton = e.target.closest("[data-tutorial-choice]"),
      action = e.target.closest("[data-tutorial]")?.dataset.tutorial;
    const focusKey = cardButton
      ? `[data-tutorial-card="${cardButton.dataset.tutorialCard}"]`
      : choiceButton
        ? `[data-tutorial-choice="${choiceButton.dataset.tutorialChoice}"]`
        : action
          ? `[data-tutorial="${action}"]`
          : null;
    if (cardButton && !solved) {
      const id = cardButton.dataset.tutorialCard;
      picked.has(id) ? picked.delete(id) : picked.add(id);
      render();
    } else if (choiceButton && !solved) {
      choice = choiceButton.dataset.tutorialChoice;
      render();
    } else if (action === "check") {
      const result = lesson.check(
        lesson.hand?.filter((x) => picked.has(x.id)) || [],
        lesson.level,
        choice,
      );
      solved = result.ok;
      render(result.message, result.ok);
    } else if (action === "next") go(index + 1);
    else if (action === "back") go(index - 1);
    else if (action === "skip" || action === "finish") {
      try {
        localStorage.setItem("guandan-tutorial", "done");
      } catch {}
      document.removeEventListener("click", onClick);
      closeModal();
      if (action === "finish") onFinish?.();
      return;
    }
    // Keep keyboard focus where it was (or on the way forward).
    const root = body();
    (
      (focusKey && root?.querySelector(focusKey)) ||
      root?.querySelector('[data-tutorial="next"], [data-tutorial="finish"]')
    )?.focus({ preventScroll: true });
  }
  return {
    open() {
      document.removeEventListener("click", onClick);
      document.addEventListener("click", onClick);
      go(0);
      body()?.querySelector("button")?.focus({ preventScroll: true });
    },
  };
}
