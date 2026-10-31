import runs from './assets/decomposition-runs.mjs';
import { decompFrameAt, PAIR_SECONDS, PAIR_LANDINGS, PHASES } from './decomposition-sequence.mjs';
import { format } from './sequence.mjs';
import { setupControls } from './controls.mjs';
setupControls({ runs, frameAt:decompFrameAt, period:PAIR_SECONDS, landings:PAIR_LANDINGS, stepOf:f=>f.step, describe:f=>{
  const r=f.run, sample=f.step===0?r.plus:f.step===1?r.minus:r.mean;
  if(f.step===4) return `Average gradients: Δy = ${format(r.mean.updateY)}. Gradient at the mean position: Δy = +${format(r.center.updateY)}. ${r.mean.updateY<0?'Opposite directions.':'Different sizes.'}`;
  return f.step===3 ? `Average update: Δy = ${format(r.mean.updateY)}. ${r.mean.updateY<0?'Toward lower':'Toward higher'} x-curvature.` : `${PHASES[f.step]}: gradient = (${format(sample.alternating)}, ${format(sample.averageY)}).`;
}});
