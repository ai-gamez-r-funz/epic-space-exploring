// Overlay registry: name -> class. ui.openOverlay('Trade', params). Add new overlays here.
import { EventDialog } from './EventDialog.js';
import { Trade, Shipyard, CrewScreen, MissionLog, Codex, Help, Settings, Pause, EndScreen } from './Stubs.js';
export { Overlay } from './Overlay.js';
export const OVERLAYS = { EventDialog, Trade, Shipyard, CrewScreen, MissionLog, Codex, EndScreen, Settings, Help, Pause };
