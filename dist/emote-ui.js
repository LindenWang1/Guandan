import {
  EMOTES,
  EMOTE_DURATION,
  EMOTE_COOLDOWN,
  validEmote,
} from "./emotes.js";

export function createEmotes({ send, onError }) {
  const host = document.createElement("div");
  host.className = "emote-control";
  host.innerHTML = `<button type="button" class="quiet" id="emote-toggle" aria-expanded="false" aria-controls="emote-wheel"><span aria-hidden="true">☺</span> <span>Emotes</span></button><div id="emote-wheel" class="emote-wheel" role="group" aria-label="Choose an Expression" hidden>${Object.entries(
    EMOTES,
  )
    .map(
      ([id, emote]) =>
        `<button type="button" data-emote="${id}"><span aria-hidden="true">${emote.emoji}</span><small>${emote.label}</small></button>`,
    )
    .join(
      "",
    )}<span class="emote-wheel-center" aria-hidden="true">✦</span></div>`;
  document.querySelector(".hand-tools").prepend(host);
  const toggle = host.querySelector("#emote-toggle");
  const wheel = host.querySelector("#emote-wheel");
  const seen = new Map(),
    timers = new Map();
  let cooldown = 0,
    cooldownTimer = null,
    pending = false,
    context = "";
  function close(restore = false) {
    wheel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restore) toggle.focus();
  }
  function show(seat, id, duration = EMOTE_DURATION) {
    if (!validEmote(id) || duration <= 0) return;
    const player = document.getElementById(`player-${seat}`);
    player.querySelector(".emote-bubble")?.remove();
    clearTimeout(timers.get(seat));
    const bubble = document.createElement("span");
    bubble.className = "emote-bubble";
    bubble.setAttribute("role", "status");
    bubble.innerHTML = `<span aria-hidden="true">${EMOTES[id].emoji}</span><small>${EMOTES[id].label}</small>`;
    player.append(bubble);
    timers.set(
      seat,
      setTimeout(() => bubble.remove(), duration),
    );
  }
  toggle.onclick = () => {
    if (!wheel.hidden) return close();
    wheel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    wheel.querySelector("button").focus();
  };
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !wheel.hidden) {
      event.stopPropagation();
      close(true);
    }
    if (
      !wheel.hidden &&
      [
        "ArrowRight",
        "ArrowDown",
        "ArrowLeft",
        "ArrowUp",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      const buttons = [...wheel.querySelectorAll("button")];
      const current = buttons.indexOf(document.activeElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (current +
                (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) +
                buttons.length) %
              buttons.length;
      buttons[next].focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!host.contains(event.target)) close();
  });
  host.addEventListener("focusout", (event) => {
    if (!host.contains(event.relatedTarget)) close();
  });
  wheel.addEventListener("click", async (event) => {
    const id = event.target.closest("[data-emote]")?.dataset.emote;
    if (!id) return;
    close(true);
    if (pending || Date.now() < cooldown)
      return onError("Wait a moment before sending another emote.");
    pending = true;
    toggle.disabled = true;
    try {
      const local = await send(id);
      if (local) show(0, id);
      cooldown = Date.now() + EMOTE_COOLDOWN;
      toggle.title = "Emotes are cooling down.";
    } catch (error) {
      onError(error.message);
    } finally {
      pending = false;
      clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(
        () => {
          toggle.disabled = false;
          toggle.removeAttribute("title");
        },
        Math.max(0, cooldown - Date.now()),
      );
    }
  });
  return {
    sync(room, practiceId) {
      const next = room
        ? `${room.code}:${room.seat}`
        : `practice:${practiceId || "new"}`;
      if (next !== context) {
        context = next;
        seen.clear();
        timers.forEach(clearTimeout);
        timers.clear();
        clearTimeout(cooldownTimer);
        toggle.disabled = false;
        toggle.removeAttribute("title");
        document.querySelectorAll(".emote-bubble").forEach((el) => el.remove());
        cooldown = 0;
        close();
      }
      room?.members.forEach((member, seat) => {
        const emote = member?.emote;
        if (!emote || seen.get(seat) === emote.eventId) return;
        seen.set(seat, emote.eventId);
        show(
          (seat - room.seat + 4) % 4,
          emote.id,
          Math.min(EMOTE_DURATION, emote.remainingMs),
        );
      });
    },
  };
}
