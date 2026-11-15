import { STATIONS } from './world.js';

/** Register approved mission modules here when the team finishes writing them.
 * Each Component receives { station, onClose }. The deck owns navigation only.
 * No historical or scientific requirements are inferred by this registry.
 */
export function createMissionRegistry() {
  const modules = new Map();
  return {
    register(module) {
      if (!module?.id || !module.title || typeof module.Component !== 'function') throw new Error('A mission needs id, title and Component.');
      if (!STATIONS.some(s => s.id === module.stationId)) throw new Error(`Unknown station: ${module.stationId}`);
      if (modules.has(module.stationId) || [...modules.values()].some(m => m.id === module.id)) throw new Error('Duplicate mission or occupied station.');
      modules.set(module.stationId, module);
    },
    getForStation: stationId => modules.get(stationId) ?? null,
    list: () => [...modules.values()],
  };
}

export const missions = createMissionRegistry();
