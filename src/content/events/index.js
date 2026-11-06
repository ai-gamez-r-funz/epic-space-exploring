import travel from './travel.js';
import diplomacy from './diplomacy.js';
import planets from './planets.js';
import phenomena from './phenomena.js';
import station_crew from './station_crew.js';
import scans from './scans.js';
import hazards from './hazards.js';

export const EVENTS = [...travel, ...diplomacy, ...planets, ...phenomena, ...station_crew, ...scans, ...hazards];
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export default EVENTS;
