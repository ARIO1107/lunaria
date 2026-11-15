import { STATIONS } from './world.js';
import { SURFACE_OBJECTS } from './surfaceWorld.js';

const knownStation = id => STATIONS.some(station => station.id === id) || SURFACE_OBJECTS.some(station => station.id === id);

/** Register approved mission modules here when the team finishes writing them.
 * Each Component receives { station, onClose, onComplete }. The deck owns navigation only.
 * No historical or scientific requirements are inferred by this registry.
 */
export function createMissionRegistry() {
  const modules = new Map();
  return {
    register(module) {
      if (!module?.id || !module.title || typeof module.Component !== 'function') throw new Error('A mission needs id, title and Component.');
      if (!knownStation(module.stationId)) throw new Error(`Unknown station: ${module.stationId}`);
      if (modules.has(module.stationId) || [...modules.values()].some(m => m.id === module.id)) throw new Error('Duplicate mission or occupied station.');
      modules.set(module.stationId, module);
    },
    getForStation: stationId => modules.get(stationId) ?? null,
    list: () => [...modules.values()],
  };
}

export function registerCampaignStations(Component) {
  const stations = [
    ...STATIONS.map(station => ({ id: station.id, name: station.name })),
    ...SURFACE_OBJECTS.map(station => ({ id: station.id, name: station.name })),
  ];
  for (const station of stations) {
    if (!missions.getForStation(station.id)) {
      missions.register({ id: 'campaign-' + station.id, stationId: station.id, title: station.name, Component });
    }
  }
}

export const missions = createMissionRegistry();
