export const CURVATURE_SECONDS=24;
export const CURVATURE_LANDINGS=[0,8,16];
export function curvatureFrameAt(time) {
  if (!Number.isFinite(time)) throw new RangeError('Time must be finite');
  const local=Math.max(0,Math.min(23.999,time));
  const smooth=t=>t*t*(3-2*t);
  const y=local<6?-1:local<8?-1+smooth((local-6)/2):local<14?0:local<16?smooth((local-14)/2):1;
  return {chapter:0,local,step:local<8?0:local<16?1:2,y};
}
