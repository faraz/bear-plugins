import runs from './assets/runs.mjs';
import { frameAt, format, LANDINGS, CHAPTER_SECONDS } from './sequence.mjs';
import { setupControls } from './controls.mjs';
setupControls({runs, frameAt, period:CHAPTER_SECONDS, landings:LANDINGS, stepOf:f=>f.state.step, describe:f=>`Iteration ${f.state.step} · x = ${format(f.state.x)} · loss = ${format(f.state.loss)}`});
