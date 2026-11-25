import { label, rankName, wild } from "./engine.js";

export function createPlayedHistory({
  getGame,
  playerName,
  cardHTML,
  escape,
  showModal,
}) {
  let filter = "all",
    signature = "";
  function refresh() {
    const target = document.getElementById("played-history");
    if (!target || !document.getElementById("modal").open) return;
    const g = getGame(),
      events = g.playedCards || [];
    const next = JSON.stringify([g.round, events.length, filter]);
    if (next === signature) return;
    signature = next;
    const shown = events.filter(
      (e) => filter === "all" || e.player === Number(filter),
    );
    target.innerHTML = shown.length
      ? shown
          .slice()
          .reverse()
          .map(
            (e) =>
              `<section class="played-history-row"><div class="history-heading"><b ${e.player ? 'translate="no"' : ""}>${escape(playerName(e.player))}</b><span>${label(e.move)}</span></div><div class="history-cards">${e.move.cards.map((c) => cardHTML(c)).join("")}</div>${e.move.cards.some((c) => wild(c, g.level)) ? `<p class="muted"><span>Declared:</span> <span translate="no">${e.move.as.map((c) => escape(rankName(c.r) + c.s)).join(" · ")}</span></p>` : ""}</section>`,
          )
          .join("")
      : '<p class="history-empty">No cards played yet.</p>';
  }
  function open() {
    filter = "all";
    signature = "";
    showModal(
      "Played Cards",
      `<p>Cards played this hand, newest first.</p><div class="history-filters" aria-label="Filter played cards"><button data-history-filter="all" aria-pressed="true">Everyone</button>${[0, 1, 2, 3].map((p) => `<button data-history-filter="${p}" aria-pressed="false" ${p ? 'translate="no"' : ""}>${escape(playerName(p))}</button>`).join("")}</div><div id="played-history"></div>`,
    );
    refresh();
  }
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-history-filter]");
    if (!button) return;
    filter = button.dataset.historyFilter;
    document
      .querySelectorAll("[data-history-filter]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
    refresh();
  });
  return { open, refresh };
}
