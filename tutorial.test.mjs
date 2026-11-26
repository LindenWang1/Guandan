import test from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "./dist/tutorial.js";
import { translate } from "./dist/i18n.js";

const pick = (lesson, ...ids) =>
  ids.map((id) => {
    const card = lesson.hand.find((c) => c.id === id);
    assert.ok(card, `${lesson.title}: card ${id} is in the lesson hand`);
    return card;
  });
const answers = {
  "Play a Combination": [
    ["0-6-♠", "0-6-♥", "0-6-♣", "0-9-♦", "0-9-♠"],
    ["0-6-♠", "0-6-♥", "0-6-♣", "0-13-♣", "0-3-♥"],
  ],
  "Beat the Table": [
    ["0-10-♥", "0-10-♠"],
    ["0-8-♣", "0-8-♦"],
  ],
  Runs: [
    ["0-3-♠", "0-4-♥", "0-5-♣", "0-6-♦", "0-7-♠"],
    ["0-7-♠", "0-7-♥"],
  ],
  "Wild Cards": [
    ["0-8-♠", "0-9-♣", "0-10-♦", "0-11-♠", "0-7-♥"],
    ["0-8-♠", "0-9-♣", "0-10-♦", "0-11-♠", "0-13-♦"],
  ],
  Bombs: [
    ["0-5-♠", "0-5-♥", "0-5-♣", "0-5-♦"],
    ["0-13-♣", "0-13-♦"],
  ],
  Tribute: [["0-9-♣"], ["0-14-♠"]],
};

test("every lesson accepts its answer and rejects a wrong one", () => {
  for (const lesson of LESSONS.filter((l) => l.check)) {
    if (lesson.choices) {
      assert.equal(lesson.check([], 0, lesson.answer).ok, true);
      for (const wrong of lesson.choices.filter((c) => c !== lesson.answer))
        assert.equal(lesson.check([], 0, wrong).ok, false);
      continue;
    }
    const [right, wrong] = answers[lesson.title];
    assert.equal(
      lesson.check(pick(lesson, ...right), lesson.level).ok,
      true,
      lesson.title,
    );
    assert.equal(
      lesson.check(pick(lesson, ...wrong), lesson.level).ok,
      false,
      lesson.title,
    );
    assert.equal(lesson.check([], lesson.level).ok, false, "empty selection");
  }
});

test("returning a high card is refused even when it is not the tribute", () => {
  const lesson = LESSONS.find((l) => l.title === "Tribute");
  assert.equal(lesson.check(pick(lesson, "0-12-♥")).ok, false);
  assert.equal(lesson.check(pick(lesson, "0-3-♠", "0-6-♦")).ok, false);
});

test("lesson tables show real plays", () => {
  for (const lesson of LESSONS.filter((l) => l.table)) {
    const play = lesson.table();
    assert.ok(play && play.cards.length, lesson.title);
  }
});

test("all tutorial text has a Chinese translation", () => {
  const strings = LESSONS.flatMap((l) => [
    l.title,
    ...l.text,
    ...(l.task ? [l.task] : []),
  ]);
  for (const lesson of LESSONS.filter((l) => l.check && !l.choices)) {
    const [right, wrong] = answers[lesson.title];
    strings.push(
      lesson.check(pick(lesson, ...right), lesson.level).message,
      lesson.check(pick(lesson, ...wrong), lesson.level).message,
    );
  }
  const quiz = LESSONS.find((l) => l.choices);
  strings.push(
    quiz.check([], 0, "+3").message,
    quiz.check([], 0, "+1").message,
  );
  strings.push(
    "Back",
    "Next",
    "Check",
    "Skip Tutorial",
    "Learn to Play",
    "On the Table",
    "Try the Interactive Tutorial",
    "Tutorial · 3 of 9",
  );
  for (const s of strings)
    assert.match(translate(s), /[一-鿿]/, `untranslated: ${s}`);
});
