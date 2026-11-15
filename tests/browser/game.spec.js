import { test, expect } from '@playwright/test';
import { skipSiteIntro } from './siteIntro.js';
import { campaignKey, campaignReducer, createCampaign } from '../../src/game/campaign.js';
import { levels } from '../../src/data/levelDefinitions.js';

function levelOneReadyToFilm() {
  let state = campaignReducer(createCampaign(), { type: 'cinematicDone' });
  for (const task of levels[0].tasks) {
    if (task.kind === 'launch') state = campaignReducer(state, { type: 'flight', value: { ...state.flight, status: 'success' } });
    const value = task.answer ?? true;
    state = campaignReducer(state, { type: 'answer', id: task.id, stationId: task.stationId, value });
  }
  return state;
}

async function ready(page) {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
}
async function walk(page, key, duration) {
  await page.keyboard.down(key); await page.clock.runFor(duration); await page.keyboard.up(key);
}

test('the first mission opens the life-support checks on the deck', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  await expect(page.locator('.deck-mode')).toContainText('En tierra');
  await expect(page.locator('canvas.ship-canvas')).toHaveAttribute('data-sky', 'pad');
  await page.locator('canvas').focus();
  await walk(page, 'ArrowDown', 1400);
  await expect(page.locator('.station-card h3').first()).toHaveText('Soporte vital');
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Monitor de soporte vital', exact: true })).toBeVisible();
  const bay = page.locator('.fp-bay canvas');
  await expect(bay).toHaveAttribute('data-vista', 'pad');
  await expect(bay).toHaveAttribute('data-station', 'oxygen');
  await page.clock.runFor(150);
  await bay.screenshot({ path: 'test-results/fp-bay.png' });
  await expect(page.getByRole('checkbox', { name: 'Oxígeno disponible' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Encender motores' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Probar estabilidad' }).click();
  await expect(page.getByText(/ventilación está apagada/)).toBeVisible();
  await page.getByRole('button', { name: 'Activar ventilación' }).click();
  await page.getByRole('button', { name: 'Abrir suministro de oxígeno' }).click();
  await page.getByRole('button', { name: 'Activar eliminación de CO₂' }).click();
  await page.getByRole('button', { name: 'Probar estabilidad' }).click();
  await page.clock.runFor(1000);
  await expect(page.getByRole('button', { name: 'Preparar soporte vital' })).toBeEnabled();
  await page.getByRole('button', { name: 'Preparar soporte vital' }).click();
  await expect(page.getByRole('dialog').getByText(/comprobar la energía/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Consultar referencia NASA/ })).toHaveAttribute('href', /nasa.gov/);
  await page.keyboard.press('Escape');
  await expect(page.locator('canvas')).toBeFocused();
  expect(errors).toEqual([]);
});

test('asset loading failure has a working retry', async ({ page }) => {
  let allow = false;
  await page.route('**/generated/titus.png', route => allow ? route.continue() : route.abort());
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
  allow = true;
  await page.getByRole('button', { name: 'Reintentar carga' }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
});

test('crew gallery shows actual rendered models and can be closed by keyboard', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'La tripulación', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'La tripulación de Lunaria' })).toBeVisible();
  for (const img of await page.locator('.crew-gallery img').all()) {
    expect(await img.evaluate(el => el.complete && el.naturalWidth === 768)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/crew-models.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const width of [1440, 768, 390]) {
  test(`exploration layout and camera at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page);
    await expect(page.getByRole('heading', { name: 'Lunaria', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/deck-${width}.png`, fullPage: true });
    if (width === 1440) {
      await expect(page.locator('.titus-bubble')).toBeVisible();
      await expect(page.locator('.titus-bubble')).toContainText(/Capitán Alex/);
      await expect(page.locator('.titus-bubble')).toContainText(/soporte vital/);
    }
    await page.getByRole('button', { name: 'Acercar cámara' }).click();
    await expect(page.locator('.zoom-controls span')).toHaveText('130 %');
    await page.getByRole('button', { name: 'Alejar cámara' }).click();
    await expect(page.locator('.zoom-controls span')).toHaveText('115 %');
  });
}

test('the opening cinematic renders and can be skipped into level 1', async ({ page }) => {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  const shoot = async (time, name) => {
    await page.evaluate(value => window.__lunariaCinematic.seek(value), time);
    await page.waitForTimeout(700);
    const stamp = await canvas.evaluate(node => `${node.dataset.time} inside=${node.dataset.inside} cam=${node.dataset.cam} fps=${node.dataset.fps}`);
    const fade = await page.locator('.cinematic-fade').evaluate(node => getComputedStyle(node).opacity);
    console.log('SHOT', name, stamp, 'fade', fade);
    if (name === 'cabin' || name === 'moon' || name === 'console') expect(Number(fade)).toBeLessThan(0.05);
    await page.screenshot({ path: `test-results/cinematic-${name}.png` });
  };
  await shoot(2, 'earth');
  await shoot(8, 'hull');
  await shoot(16.4, 'nose');
  await shoot(28, 'cabin');
  await shoot(50, 'moon');
  // Sample while the 75 s film still has plenty of time left. A shot near
  // the end can finish the film during the screenshot, and seeking afterward
  // cannot bring the unmounted player back.
  await page.evaluate(value => window.__lunariaCinematic.seek(value), 30);
  const samples = [];
  for (let i = 0; i < 4; i += 1) {
    await page.waitForTimeout(600);
    samples.push(Number(await canvas.getAttribute('data-fps')));
  }
  const settled = [...samples].sort((a, b) => a - b);
  const median = settled[Math.floor(settled.length / 2)];
  console.log('FPS_ALTO_SETTLED', samples.join(','), 'median', median);
  expect(median).toBeGreaterThan(8);
  await shoot(71, 'console');
  const skip = page.getByRole('button', { name: 'Omitir cinemática' });
  if (await skip.count()) await skip.click();
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
});

test('skipping the opening fades through black into the deck', async ({ page }) => {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await expect(page.locator('[data-cinematic-root] canvas')).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect.poll(async () => Number(await page.locator('.cinematic-fade').evaluate(node => getComputedStyle(node).opacity)), { timeout: 2000 }).toBeGreaterThan(0.2);
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  await expect(page.locator('.scene-veil')).toHaveCount(0, { timeout: 4000 });
});

test('checklist: new game, models, subtitles, skip, audio and saved continue', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const contexts = [];
    for (const key of ['AudioContext', 'webkitAudioContext']) {
      const Native = window[key];
      if (!Native) continue;
      const Wrapped = function (...args) {
        const ctx = new Native(...args);
        contexts.push(ctx);
        return ctx;
      };
      Wrapped.prototype = Native.prototype;
      window[key] = Wrapped;
    }
    window.__audioContexts = contexts;
  });
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  await expect(canvas).toHaveAttribute('data-cast', 'Cinematic_Hull Cinematic_Alex Cinematic_Titus visor');
  expect(Number(await canvas.getAttribute('data-meshes'))).toBeGreaterThan(40);
  const scores = () => page.evaluate(() => window.__audioContexts.filter(ctx => ctx.__lunariaCinematic).map(ctx => ctx.state));
  const shot = async time => {
    await page.evaluate(value => window.__lunariaCinematic.seek(value), time);
    await expect.poll(async () => {
      const value = Number(await canvas.getAttribute('data-time'));
      return value >= time && value < time + 1;
    }).toBe(true);
    return canvas.evaluate(node => ({
      pose: node.dataset.pose.split(' ').map(Number),
      cam: node.dataset.cam,
      inside: node.dataset.inside,
    }));
  };

  const greet = await shot(24);
  await expect(page.locator('.cinematic-subtitle')).toContainText('¡Buenos días, comandante Alex! Hoy comienza nuestra aventura.');
  const walk = await shot(71);
  await expect(page.locator('.cinematic-subtitle')).toHaveCount(0);
  await expect(page.locator('.cinematic-title')).toContainText('MISIÓN 01 — EL LANZAMIENTO');
  const wide = await shot(8);
  await expect(page.locator('.cinematic-subtitle')).toHaveCount(0);
  await expect(page.locator('.cinematic-title')).toContainText('Capítulo 1 — El lanzamiento');
  await expect(canvas).toHaveAttribute('data-backdrop', 'pad');
  await expect(canvas).toHaveAttribute('data-sequence', 'opening');
  await canvas.screenshot({ path: 'test-results/opening-pad.png' });
  const distance = await shot(36);
  await expect(page.locator('.cinematic-subtitle')).toContainText('sistemas principales');
  expect(greet.pose[1]).toBeGreaterThan(1);
  expect(greet.pose[2]).toBeGreaterThan(0.4);
  expect(walk.pose[1]).toBeLessThan(0.2);
  expect(walk.pose[0]).toBeLessThan(greet.pose[0] - 0.5);
  expect(walk.pose[3]).not.toBe(greet.pose[3]);
  const point = await shot(44);
  expect(point.pose[5]).toBeLessThan(-1);
  await expect(page.locator('.cinematic-subtitle')).toContainText('soporte vital');
  expect(wide.inside).toBe('0');
  expect(distance.inside).toBe('1');
  expect(wide.cam).not.toBe(distance.cam);
  const alive = await scores();
  expect(alive).toHaveLength(1);
  expect(['running', 'suspended']).toContain(alive[0]);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  await expect(page.getByText('Comencemos por soporte vital.')).toBeVisible();
  await expect(page.locator('.deck-mode')).toContainText('En tierra');
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  await expect(page.locator('canvas.ship-canvas')).toHaveAttribute('data-sky', 'pad');
  await expect.poll(scores).toEqual(['closed']);
  await page.waitForTimeout(250);
  const frozen = await page.evaluate(() => window.__lunariaCinematicFrames);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__lunariaCinematicFrames)).toBe(frozen);
  expect(await page.evaluate(() => window.__lunariaCinematic)).toBeUndefined();

  await page.getByRole('button', { name: 'Menú principal', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the cinematic leaves the deck stable and a saved game does not replay it', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const bundles = [];
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (path.includes('/assets/') && path.endsWith('.js')) bundles.push(path);
  });
  await page.goto('/');
  await skipSiteIntro(page);
  expect(bundles.some(path => path.includes('runtime'))).toBe(false);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  expect(bundles.some(path => path.includes('runtime'))).toBe(true);
  const deck = bundles.find(path => /\/assets\/index-/.test(path));
  const deckText = await page.evaluate(async path => (await (await fetch(path)).text()), deck);
  expect(deckText.includes('WebGLRenderer')).toBe(false);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__lunariaCinematic)).toBeUndefined();

  await page.getByRole('button', { name: 'Menú principal', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();

  await page.getByRole('button', { name: 'Menú principal', exact: true }).click();
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hay una expedición guardada' })).toBeVisible();
  await page.getByRole('button', { name: 'Conservar la partida' }).click();
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();

  await page.getByRole('button', { name: 'Menú principal', exact: true }).click();
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  await page.evaluate(() => window.__lunariaCinematic.seek(99.9));
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
  await expect(page.locator('[data-cinematic-root]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__lunariaCinematic)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('the cinematic reports a missing model, follows the screen, and recovers WebGL', async ({ page }) => {
  await page.goto('/?modelo=/no-existe.glb');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('No se pudo cargar un modelo de la cinemática.', { timeout: 15000 });
  await page.waitForTimeout(500);
  await expect(alert).toContainText('No se pudo cargar un modelo de la cinemática.');

  for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => canvas.evaluate(node => Math.abs(node.width / node.height - node.clientWidth / node.clientHeight))).toBeLessThan(0.03);
  }

  const before = Number(await canvas.getAttribute('data-time'));
  await canvas.evaluate(node => {
    const gl = node.getContext('webgl2') || node.getContext('webgl');
    node.__loseExt = gl.getExtension('WEBGL_lose_context');
    node.__loseExt.loseContext();
  });
  await expect(page.getByText('El navegador perdió la imagen 3D.')).toBeVisible();
  await page.waitForTimeout(700);
  const during = Number(await canvas.getAttribute('data-time'));
  expect(during - before).toBeLessThan(0.3);
  await canvas.evaluate(node => node.__loseExt.restoreContext());
  await expect(page.getByText('El navegador perdió la imagen 3D.')).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-lost', '0');
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
});

test('adjusted graphics stay measurable under CPU load', async ({ page }) => {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Configuración' }).click();
  await page.locator('#graphics-quality').selectOption('ajustado');
  await page.getByRole('button', { name: 'Cerrar panel' }).click();
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  await expect(canvas).toHaveAttribute('data-quality', 'ajustado');
  await expect(canvas).toHaveAttribute('data-shadows', '0');
  await expect(canvas).toHaveAttribute('data-ratio', '1');
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(value => window.__lunariaCinematic.seek(value), 50);
  const samples = [];
  for (let i = 0; i < 5; i += 1) {
    await page.waitForTimeout(700);
    samples.push(Number(await canvas.getAttribute('data-fps')));
  }
  console.log('FPS_AJUSTADO_CPU4', samples.join(','));
  expect(samples.filter(value => value > 0).length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.getByRole('heading', { name: 'Revisar soporte vital' })).toBeVisible();
});

test('phone controls reach a console without a keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.clock.install(); await ready(page);
  for (const [name, duration] of [['Mover abajo', 900]]) {
    const button = page.getByRole('button', { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    const rect = await button.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down(); await page.clock.runFor(duration); await page.mouse.up();
  }
  await page.locator('.touch-controls').getByRole('button', { name: 'Inspeccionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Monitor de soporte vital', exact: true })).toBeVisible();
  await expect(page.locator('.fp-bay canvas')).toHaveAttribute('data-vista', 'pad');
  await page.clock.runFor(150);
  await page.screenshot({ path: 'test-results/station-mobile.png', fullPage: true });
});

test('the launch film plays only after ascent success and can be skipped to the summary', async ({ page }) => {
  const saved = levelOneReadyToFilm();
  expect(saved.phase).toBe('launchCinematic');
  expect(saved.completedLevels.includes(1)).toBe(false);
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignKey, value: saved });
  await page.goto('/');
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  const canvas = page.locator('[data-cinematic-root] canvas');
  await expect(canvas).toHaveAttribute('data-cinematic', 'ready', { timeout: 30000 });
  await expect(canvas).toHaveAttribute('data-sequence', 'launch');
  const seekTo = async time => {
    await page.evaluate(value => window.__lunariaCinematic.seek(value), time);
    await expect.poll(async () => {
      const value = Number(await canvas.getAttribute('data-time'));
      return value >= time && value < time + 1;
    }).toBe(true);
  };
  await seekTo(4);
  await expect(page.locator('.cinematic-subtitle')).toContainText('Iniciamos la secuencia de lanzamiento');
  await expect(page.locator('.cinematic-title h1')).toHaveText('9');
  await expect(canvas).toHaveAttribute('data-backdrop', 'pad');
  await seekTo(14);
  await expect(page.locator('.cinematic-subtitle')).toContainText('Encendido confirmado');
  await canvas.screenshot({ path: 'test-results/launch-ignition.png' });
  await seekTo(30);
  expect(Number(await canvas.getAttribute('data-altitude'))).toBeGreaterThan(10);
  await expect(canvas).toHaveAttribute('data-backdrop', 'ascent');
  await seekTo(50);
  await expect(page.locator('.cinematic-subtitle')).toContainText('Hemos completado nuestra primera misión');
  await expect(canvas).toHaveAttribute('data-backdrop', 'orbit');
  await expect(canvas).toHaveAttribute('data-altitude', '0.0');
  await canvas.screenshot({ path: 'test-results/launch-orbit.png' });
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.getByText('Misión completada')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'El lanzamiento' })).toBeVisible();
  await expect(page.getByText('órbita terrestre')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar al siguiente nivel' }).click();
  await expect(page.getByRole('heading', { name: 'Conoce tu nave' })).toBeVisible();
  await expect(page.getByText('Estamos en vuelo hacia la Luna')).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar misión' }).click();
  await expect(page.locator('canvas.ship-canvas')).toHaveAttribute('data-sky', 'space');
});
