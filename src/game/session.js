import { languageFromSettings } from '../i18n/language.js';
import { canOccupy } from './world.js';

const saveKey = 'lunaria.exploration';
const settingsKey = 'lunaria.settings';

export const defaultPosition = { x: 480, y: 300 };
export const defaultZoom = 1.15;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    const json = JSON.stringify(value);
    if (localStorage.getItem(key) !== json) localStorage.setItem(key, json);
  } catch {
    // The current session remains playable when browser storage is unavailable.
  }
}

export function readProgress() {
  const data = read(saveKey);
  if (data?.version !== 1 || !Number.isFinite(data.position?.x) ||
      !Number.isFinite(data.position?.y) || !canOccupy(data.position.x, data.position.y)) return null;
  return {
    position: data.position,
    zoom: data.zoom >= .8 && data.zoom <= 1.75 ? Number(data.zoom) : defaultZoom,
    completed: Array.isArray(data.completed) ? data.completed.filter(id => typeof id === 'string') : [],
  };
}

export function saveProgress(progress) {
  write(saveKey, { version: 1, ...progress });
}

export function readSettings() {
  const data = read(settingsKey);
  return {
    volume: Number.isFinite(data?.volume) ? Math.max(0, Math.min(100, data.volume)) : 70,
    reducedMotion: data?.reducedMotion === true,
    soundEnabled: data?.soundEnabled !== false,
    graphics: data?.graphics === 'ajustado' ? 'ajustado' : 'alto',
    language: languageFromSettings(data),
  };
}

export function saveSettings(settings) {
  write(settingsKey, settings);
}

