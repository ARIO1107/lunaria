import assert from 'node:assert/strict';
import test from 'node:test';
import { languageFromSettings, setLanguage } from '../src/i18n/language.js';
import { t } from '../src/i18n/translate.js';
import { readSettings } from '../src/game/session.js';

test('english is the default and spanish stays the source text', () => {
  setLanguage('en');
  assert.equal(t('Jugar'), 'Play');
  assert.equal(t('Objetivo completado: Revisar soporte vital'), 'Objective complete: Check life support');
  setLanguage('nope');
  assert.equal(t('Jugar'), 'Play');
  setLanguage('es');
  assert.equal(t('Jugar'), 'Jugar');
  assert.equal(languageFromSettings(null), 'en');
  assert.equal(languageFromSettings({ language: 'es' }), 'es');
  assert.equal(languageFromSettings({ language: 'fr' }), 'en');
  setLanguage('en');
});

test('a saved game without a language stays in english', () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  assert.equal(readSettings().language, 'en');
  localStorage.setItem('lunaria.settings', JSON.stringify({ language: 'es', volume: 40 }));
  assert.equal(readSettings().language, 'es');
  localStorage.setItem('lunaria.settings', JSON.stringify({ language: 'fr' }));
  assert.equal(readSettings().language, 'en');
});
