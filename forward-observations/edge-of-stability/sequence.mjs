export const CHAPTER_SECONDS = 20;
export const DURATION = 60;
export const LANDINGS = [0, 3.6, 7.6, 11.6, 15.6];

// Only the cue interpolates. The mathematical state changes at a landing.
export function frameAt(time, runs) {
  if (!Number.isFinite(time)) throw new RangeError('Time must be finite');
  const t = Math.max(0, Math.min(59.999, time));
  const chapter = Math.floor(t / 20);
  const local = t - chapter * 20;
  const run = runs[chapter];
  let step = 0;
  while (step < 4 && local >= 3.6 + step * 4 - 1e-8) step++;
  const cueStep = Math.min(4, Math.max(1, Math.floor((local - 2) / 4) + 1));
  const cueStart = 2 + (cueStep - 1) * 4;
  const progress = Math.max(0, Math.min(1, (local - cueStart) / 1.6));
  return { chapter, local, state: run.states[step], from: run.states[cueStep - 1], to: run.states[cueStep], progress, updating: local >= cueStart && progress < 1, run };
}

export function format(value) {
  const rounded = Math.abs(value) < 0.00005 ? 0 : value;
  return Number(rounded.toFixed(4)).toString().replace('-', '−');
}
