import { HandGroups } from "./hand-groups.js";
import { label, rankName } from "./engine.js";
import { autoGroup, findBombs, rankStacks } from "./hand-sort.js";

export function createHandGrouping({
  getGame,
  getSelected,
  setSelected,
  getContext,
  onChange,
  isBusy,
  getSort,
  getLayout = () => "row",
  notify = () => {},
  cardHTML,
  escape,
}) {
  const hand = document.getElementById("hand"),
    bar = document.createElement("div");
  bar.className = "group-controls";
  bar.id = "group-controls";
  bar.hidden = true;
  let expanded = false;
  bar.innerHTML =
    '<div class="group-buttons quick-buttons"><button id="auto-group" type="button">Auto-Group</button><button id="find-bomb" type="button">Find Bomb</button><button id="find-flush" type="button">Find Straight Flush</button></div><div class="group-buttons"><button id="group-selected" type="button">Group Selected</button><button id="release-group" type="button">Release Group</button><button id="group-left" type="button">Move Group Left</button><button id="group-right" type="button">Move Group Right</button><button id="reset-groups" type="button">Reset Groups</button></div><label id="group-choice-label" hidden><span>Group As</span><select id="group-choice" aria-label="Group As"></select></label><small id="group-help">Select a valid combination to keep it together. Click a group name to select its cards.</small>';
  hand.before(bar);
  const tray = document.createElement("section");
  tray.id = "grouped-cards";
  tray.className = "grouped-area";
  tray.hidden = true;
  tray.setAttribute("aria-labelledby", "grouped-title");
  tray.innerHTML =
    '<div class="grouped-intro"><h3 id="grouped-title">Grouped Cards</h3><p>Saved for later. Select a group name when you want to play it.</p></div><div class="grouped-list"></div>';
  hand.after(tray);
  const groupList = tray.querySelector(".grouped-list");
  document.getElementById("organize-btn").onclick = () => {
    expanded = !expanded;
    document
      .getElementById("organize-btn")
      .setAttribute("aria-expanded", String(expanded));
    refreshControls();
  };
  const el = (id) => bar.querySelector("#" + id),
    groups = new HandGroups();
  let context = "",
    groupKey = "",
    finder = { signature: "", index: 0 };
  function sync() {
    const game = getGame(),
      next = getContext();
    if (next !== context) {
      groups.clear();
      context = next;
      groupKey = "";
      if (next)
        try {
          const saved = JSON.parse(
            localStorage.getItem("guandan-hand-groups") || "null",
          );
          if (saved?.context === context && Array.isArray(saved.groups))
            groups.groups = saved.groups;
        } catch {}
    }
    groups.sync(game.hands[0], game.level);
  }
  function persist() {
    if (context)
      try {
        localStorage.setItem(
          "guandan-hand-groups",
          JSON.stringify({ context, groups: groups.groups }),
        );
      } catch {}
  }
  function refreshControls() {
    sync();
    const game = getGame(),
      ids = getSelected(),
      options = groups.options(game.hands[0], ids, game.level),
      locked = isBusy() || !["playing", "tribute"].includes(game.phase),
      exact = groups.selected(ids),
      index = groups.groups.indexOf(exact);
    bar.hidden = !expanded || !game.hands[0].length || game.phase === "ready";
    tray.hidden = !groups.groups.length || game.phase === "ready";
    tray.querySelectorAll("[data-pick-group]").forEach((button) => {
      const chosen = exact?.id === button.dataset.pickGroup;
      button.setAttribute("aria-pressed", String(chosen));
      button.closest(".saved-group").classList.toggle("group-selected", chosen);
    });
    if (!options.some((m) => m.key === groupKey))
      groupKey = options[0]?.key || "";
    el("group-selected").disabled = locked || !options.length || !!exact;
    el("release-group").disabled =
      locked || !groups.groups.some((g) => g.ids.some((id) => ids.has(id)));
    el("group-left").disabled = locked || index <= 0;
    el("group-right").disabled =
      locked || index < 0 || index === groups.groups.length - 1;
    el("reset-groups").disabled = locked || !groups.groups.length;
    for (const id of ["auto-group", "find-bomb", "find-flush"])
      el(id).disabled = locked || !game.hands[0].length;
    el("group-choice-label").hidden = options.length < 2 || !!exact;
    el("group-choice").innerHTML = options
      .map(
        (m) =>
          `<option value="${escape(m.key)}" ${m.key === groupKey ? "selected" : ""}>${label(m)}${m.suit ? " " + m.suit : ""}${m.type === "Full house" ? " + " + rankName(m.ranks[3]) + " Pair" : ""}</option>`,
      )
      .join("");
    el("group-help").textContent =
      ids.size && !options.length
        ? "Select a valid combination to group."
        : "Select a valid combination to keep it together. Click a group name to select its cards.";
  }
  bar.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.id;
    if (!action || event.target.closest("button").disabled) return;
    const game = getGame(),
      ids = getSelected();
    if (action === "group-selected") {
      groups.add(game.hands[0], ids, game.level, groupKey);
      setSelected(new Set(), "");
    }
    if (action === "release-group") groups.release(ids);
    if (action === "group-left") groups.move(ids, -1);
    if (action === "group-right") groups.move(ids, 1);
    if (action === "reset-groups") groups.clear();
    if (action === "auto-group") {
      const found = autoGroup(game.hands[0], game.level);
      groups.replace(game.hands[0], found, game.level);
      setSelected(new Set(), "");
      notify(
        found.length
          ? `Auto-Group made ${found.length} group${found.length === 1 ? "" : "s"}. Wild cards, pairs and singles stay loose.`
          : "Auto-Group found nothing to group.",
      );
    }
    if (action === "find-bomb" || action === "find-flush") {
      const flush = action === "find-flush",
        list = findBombs(
          game.hands[0],
          game.level,
          flush ? "Straight flush" : null,
        ),
        signature = action + list.map((m) => m.key).join();
      if (signature !== finder.signature) finder = { signature, index: 0 };
      if (!list.length)
        notify(
          flush ? "No straight flush in your hand." : "No bombs in your hand.",
        );
      else {
        const i = finder.index++ % list.length,
          m = list[i];
        setSelected(new Set(m.cards.map((c) => c.id)), m.key);
        notify(
          `${flush ? "Straight Flush" : "Bomb"} ${i + 1} of ${list.length}: ${label(m)}${m.suit ? " " + m.suit : ""}. Tap again for the next one.`,
        );
      }
    }
    persist();
    onChange();
  });
  el("group-choice").addEventListener("change", (e) => {
    groupKey = e.target.value;
  });
  tray.addEventListener("click", (e) => {
    const target = e.target.closest("[data-pick-group]");
    if (!target || isBusy()) return;
    const g = groups.groups.find((g) => g.id === target.dataset.pickGroup);
    if (g) {
      setSelected(new Set(g.ids), g.key);
      groupKey = g.key;
      onChange();
    }
  });
  return {
    reset() {
      groups.clear();
      context = "";
      groupKey = "";
      tray.hidden = true;
      groupList.innerHTML = "";
    },
    refreshControls,
    renderHand() {
      sync();
      const game = getGame(),
        // Stacks group by rank, so Suit order stacks like Rank order.
        sort =
          getLayout() === "stacks" && getSort() === "suit" ? "rank" : getSort(),
        sections = groups.sections(game.hands[0], game.level, sort);
      tray.hidden = !groups.groups.length;
      const groupedHTML = sections
        .filter((s) => s.id)
        .map(
          (s) =>
            `<section class="hand-segment saved-group"><div class="group-heading"><button type="button" data-pick-group="${s.id}" aria-pressed="${groups.selected(getSelected())?.id === s.id}">${label(s.move)}${s.move.suit ? " " + s.move.suit : ""}</button></div><div class="group-cards">${s.cards.map((c) => cardHTML(c, true)).join("")}</div></section>`,
        )
        .join("");
      if (groupList.innerHTML !== groupedHTML)
        groupList.innerHTML = groupedHTML;
      const loose = sections.filter((s) => !s.id).flatMap((s) => s.cards);
      // Stacked layout: cards of the same rank share a column.
      return (
        (getLayout() === "stacks"
          ? rankStacks(loose)
              .map(
                (stack) =>
                  `<div class="rank-stack" data-depth="${Math.min(stack.length, 10)}">${stack.map((c) => cardHTML(c, true)).join("")}</div>`,
              )
              .join("")
          : loose.map((c) => cardHTML(c, true)).join("")) ||
        (groups.groups.length
          ? '<div class="empty-hand">All your cards are grouped below.</div>'
          : "")
      );
    },
  };
}
