// Overlay registry: name -> class. ui.openOverlay('Trade', params). Add new overlays here.
import { EventDialog } from './EventDialog.js';
import { Trade } from './Trade.js';
import { Shipyard } from './Shipyard.js';
import { EndScreen } from './EndScreen.js';
import { CrewScreen } from './CrewScreen.js';
import { MissionLog } from './MissionLog.js';
import { Codex } from './Codex.js';
import { Help } from './Help.js';
import { Settings } from './Settings.js';
import { Pause } from './Pause.js';
export { Overlay } from './Overlay.js';
export const OVERLAYS = { EventDialog, Trade, Shipyard, CrewScreen, MissionLog, Codex, EndScreen, Settings, Help, Pause };
