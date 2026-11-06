import travel from './travel.js';
import diplomacy from './diplomacy.js';
import planets from './planets.js';
import phenomena from './phenomena.js';
import station_crew from './station_crew.js';
import scans from './scans.js';
import hazards from './hazards.js';
import { HOT_LANES, DISTRESS } from './lanes_distress.js';
import { applyFollowups } from './followups.js';

export const EVENTS = applyFollowups([...travel, ...diplomacy, ...planets, ...phenomena, ...station_crew, ...scans, ...hazards, ...HOT_LANES, ...DISTRESS]);
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export default EVENTS;
