export const PAIR_SECONDS = 32;
export const PAIR_LANDINGS = [0, 7.2, 13.2, 19.2, 26.4];
export const PHASES = ['Positive sample', 'Negative sample', 'Paired mean', 'Average update', 'Compare averaging order'];

export function decompFrameAt(time, runs) {
  if (!Number.isFinite(time)) throw new RangeError('Time must be finite');
  const t = Math.max(0, Math.min(63.999, time));
  const chapter = Math.floor(t / 32);
  const local = t - chapter * 32;
  const step = Math.min(4, Math.floor(local / 6));
  return { chapter, local, step, progress: Math.min(1, (local - step * 6) / 1.2), run: runs[chapter] };
}
