// Short synthesized cues: no downloads, looping soundtrack, or background audio.

export const cueNotes = Object.freeze({
  select: [[620, 0, 0.045, 0.018]],
  card: [
    [220, 0, 0.07, 0.045],
    [160, 0.035, 0.08, 0.025],
  ],
  turn: [
    [659, 0, 0.16, 0.055],
    [880, 0.12, 0.22, 0.045],
  ],
  bomb: [
    [130, 0, 0.22, 0.06],
    [196, 0.07, 0.2, 0.04],
    [262, 0.14, 0.22, 0.035],
  ],
  win: [
    [523, 0, 0.22, 0.05],
    [659, 0.12, 0.22, 0.045],
    [784, 0.24, 0.3, 0.04],
  ],
});
export function playCue(audio, kind, volume = 50) {
  if (audio?.state !== "running" || !Number.isFinite(volume) || volume <= 0)
    return false;
  const notes = cueNotes[kind];
  if (!notes) return false;
  for (const [hz, delay, duration, level] of notes) {
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(hz, start);
    if (kind === "card")
      oscillator.frequency.exponentialRampToValueAtTime(
        hz * 0.55,
        start + duration,
      );
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(
      (level * Math.min(100, volume)) / 100,
      start + 0.009,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  return true;
}
