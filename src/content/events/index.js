import travel from './travel.js';
import diplomacy from './diplomacy.js';
import planets from './planets.js';
import phenomena from './phenomena.js';
import station_crew from './station_crew.js';
import scans from './scans.js';
import rival from './rival.js';
import setpiece from './setpiece.js';
import { deepen } from './deepen.js';
import hazards from './hazards.js';
import { HOT_LANES, DISTRESS } from './lanes_distress.js';
import { HOT_LANES_2 } from './hot_lanes2.js';
import { HOT_LANES_3 } from './hot_lanes3.js';
import { applyFollowups } from './followups.js';

export const EVENTS = applyFollowups(deepen([...travel, ...diplomacy, ...planets, ...phenomena, ...station_crew, ...scans, ...rival, ...setpiece, ...hazards, ...HOT_LANES, ...HOT_LANES_2, ...HOT_LANES_3, ...DISTRESS]));
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export default EVENTS;
