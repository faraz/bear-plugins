import {curvatureFrameAt,CURVATURE_SECONDS,CURVATURE_LANDINGS} from './curvature-sequence.mjs';
import {setupControls} from './controls.mjs';
setupControls({runs:[],frameAt:curvatureFrameAt,period:CURVATURE_SECONDS,landings:CURVATURE_LANDINGS,stepOf:f=>f.step,describe:f=>`Last stop: y = ${[-1,0,1][f.step]}; x-curvature = ${[1,2,3][f.step]}. Play scans between stops; Step selects the next one.`});
