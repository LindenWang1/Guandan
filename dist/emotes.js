export const EMOTES = Object.freeze({
  happy: { emoji: "😄", label: "Happy" },
  angry: { emoji: "😤", label: "Angry" },
  surprised: { emoji: "😮", label: "Surprised" },
  confused: { emoji: "🤔", label: "Confused" },
  applause: { emoji: "👏", label: "Nice Play" },
  thanks: { emoji: "🙏", label: "Thanks" },
  luck: { emoji: "🍀", label: "Good Luck" },
  oops: { emoji: "😅", label: "Oops" },
});
export const EMOTE_DURATION = 5000;
export const EMOTE_COOLDOWN = 3000;
export const validEmote = (id) => Object.hasOwn(EMOTES, id);
