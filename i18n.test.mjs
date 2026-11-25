import test from "node:test";
import assert from "node:assert/strict";
import { messages, translate } from "./dist/i18n.js";
import { templates, label } from "./dist/engine.js";
import { showRules } from "./dist/rules.js";

test("English copy is preserved exactly, including surrounding whitespace", () => {
  for (const source of Object.keys(messages))
    assert.equal(translate(` ${source} `, "en"), ` ${source} `);
  assert.equal(translate("Unknown message", "zh-CN"), "Unknown message");
});
test("every engine combination translates without changing its game data", () => {
  const options = templates(8),
    original = JSON.stringify(options);
  for (const move of options)
    assert.doesNotMatch(translate(label(move)), /[a-z]{2}/i);
  assert.equal(JSON.stringify(options), original);
});
test("dynamic messages preserve player names, room codes and card declarations", () => {
  assert.equal(
    translate("Room ABCDEFGH · Connected"),
    "房间 ABCDEFGH · 已连接",
  );
  assert.equal(translate("Clear is up."), "Clear 出牌。");
  assert.equal(translate("$& is up."), "$& 出牌。");
  assert.equal(translate("Return one card to Pass."), "向 Pass 还一张牌。");
  assert.equal(
    translate("0 wins in 0 matches played"),
    "练习战绩：0 局中 0 胜",
  );
  assert.equal(translate("1 win in 1 match played"), "练习战绩：1 局中 1 胜");
  assert.equal(
    translate("3 wins in 5 matches played"),
    "练习战绩：5 局中 3 胜",
  );
  assert.equal(translate("Current win streak: 4"), "当前连胜：4 局");
  assert.equal(
    translate("Hand 2 · Clear plays Full House · 8."),
    "第 2 局 · Clear 出 三带二 · 8。",
  );
  assert.equal(
    translate("Hand 3 · Pass pays Big Joker★ to Ready to play."),
    "第 3 局 · Pass 向 Ready to play 进贡 大王★。",
  );
  assert.equal(
    translate("Hand 4 · Team A wins 1–2. Now level A."),
    "第 4 局 · A 队以 1–2 获胜，升至 A。",
  );
  assert.equal(
    translate(
      "Hint: Straight flush · 10–A. Tap Hint again for another option.",
    ),
    "提示：同花顺 · 10–A。再次点击提示可查看其他选择。",
  );
  assert.equal(
    translate("Full House · 8 + Big Joker Pair"),
    "三带二 · 8 + 大王 对子",
  );
});
test("all rules text has a Chinese translation for both promotion variants", () => {
  for (const doubleUp of [3, 4]) {
    let html;
    showRules({
      game: { doubleUp },
      speed: 950,
      setSpeed() {},
      showModal: (_, body) => (html = body),
      $: () => ({}),
    });
    for (const fragment of html
      .split(/<[^>]*>/)
      .map((s) => s.replaceAll("&gt;", ">").trim())
      .filter((s) => /[a-z]{2}/i.test(s))) {
      assert.notEqual(
        translate(fragment),
        fragment,
        `Missing rules translation: ${fragment}`,
      );
    }
  }
});
