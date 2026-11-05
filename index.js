import travel from './travel.js';
import diplomacy from './diplomacy.js';
import planets from './planets.js';
import phenomena from './phenomena.js';
import station_crew from './station_crew.js';

export const EVENTS = [...travel, ...diplomacy, ...planets, ...phenomena, ...station_crew];
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export default EVENTS;
