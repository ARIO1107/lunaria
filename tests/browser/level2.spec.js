import { test, expect } from '@playwright/test';
import { skipSiteIntro } from './siteIntro.js';
import { campaignAtLevel, campaignKey, campaignReducer } from '../../src/game/campaign.js';
import { levels } from '../../src/data/levelDefinitions.js';

const spots = {
  navigation: { x: 860, y: 169 },
  supplies: { x: 200, y: 400 },
  atmosphere: { x: 480, y: 360 },
  'energy-tour': { x: 445, y: 120 },
  signal: { x: 230, y: 170 },
  photos: { x: 860, y: 169 },
};

function readyFor(taskId) {
  let state = campaignReducer(campaignAtLevel(2), { type: 'begin' });
  for (const task of levels[1].tasks) {
    if (task.id === taskId) break;
    const value = task.answer;
    state = campaignReducer(state, { type: 'answer', id: task.id, stationId: task.stationId, value });
  }
  return { ...state, position: spots[taskId] };
}

async function openLevel(page, taskId) {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignKey, value: readyFor(taskId) });
  await page.reload();
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
  const inspect = page.getByRole('button', { name: 'Inspeccionar equipo' });
  await expect(inspect).toBeEnabled();
  await inspect.click();
}

test('level 2 consoles guide Alex from the sight to the signal', async ({ page }) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await openLevel(page, 'navigation');
  await expect(page.locator('.crew-card')).toContainText('Mira de alineación COAS');
  await expect(page.locator('.fp-bay canvas')).toHaveAttribute('data-vista', 'space');
  await page.getByLabel('Orientación').fill('45');
  await page.getByRole('button', { name: 'Fijar orientación' }).click();
  await expect(page.locator('.crew-card')).toContainText('traje A7L');

  await openLevel(page, 'supplies');
  await page.getByRole('button', { name: 'Recuerdo de la Tierra' }).click();
  await page.getByRole('button', { name: 'Cerrar la bolsa' }).click();
  await expect(page.getByText(/no va en la bolsa/)).toBeVisible();
  await page.getByRole('button', { name: 'Recuerdo de la Tierra' }).click();
  for (const name of ['Agua y alimentos', 'Botiquín', 'Herramientas y equipo científico']) {
    await page.getByRole('button', { name }).click();
  }
  await page.getByRole('button', { name: 'Cerrar la bolsa' }).click();
  await expect(page.locator('.crew-card')).toContainText('monitor de soporte vital');

  await openLevel(page, 'atmosphere');
  await page.getByRole('button', { name: 'Mirar solo la presión' }).click();
  await expect(page.getByText(/no recarga el aire/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar lectura' })).toBeDisabled();
  await page.getByRole('button', { name: 'Abrir reserva de oxígeno' }).click();
  await page.getByRole('button', { name: 'Registrar lectura' }).click();
  await expect(page.locator('.crew-card')).toContainText('estación de energía');

  await openLevel(page, 'energy-tour');
  await page.getByRole('button', { name: 'Cortar el bus principal' }).click();
  await expect(page.getByText(/se apagaron/)).toBeVisible();
  await page.getByRole('button', { name: 'Respaldo de soporte vital' }).click();
  await page.getByRole('button', { name: 'Respaldo de navegación' }).click();
  await page.getByRole('button', { name: 'Cortar el bus principal' }).click();
  await expect(page.getByText(/se apagó/)).toBeVisible();
  await page.getByRole('button', { name: 'Registrar sistemas esenciales' }).click();
  await expect(page.locator('.crew-card')).toContainText('canal ficticio 7');

  await openLevel(page, 'signal');
  await page.getByLabel('Canal de señal').fill('7');
  await page.getByRole('button', { name: 'Enviar y esperar' }).click();
  await expect(page.getByText(/Origen desconocido/)).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Anotar en la bitácora' }).click();
  await expect(page.locator('.crew-card')).toContainText('marco');

  await openLevel(page, 'photos');
  await expect(page.locator('.crew-card')).toContainText('Mira de alineación COAS');
  await expect(page.locator('.crew-card')).toContainText('Tomar foto');
  await expect(page.locator('.fp-bay canvas')).toHaveAttribute('data-vista', 'space');
  await expect(page.locator('.photo-sky canvas')).toHaveAttribute('data-ready', 'si', { timeout: 20000 });
  await page.screenshot({ path: 'test-results/photo-1440.png' });
  const shoot = page.locator('.beta-panel').getByRole('button', { name: 'Tomar foto' });
  if (await page.locator('.photo-sky').getAttribute('data-framed') !== 'si') {
    await shoot.click();
    await expect(page.locator('.eclss-speech')).toContainText(/no está entera|también salió|salieron/);
  }
  await expect(page.locator('.photo-sky')).toHaveAttribute('data-framed', 'si', { timeout: 20000 });
  await shoot.click();
  await expect(page.getByRole('heading', { name: 'Conoce tu nave' })).toBeVisible();
  await expect(page.getByText(/señal ficticia/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('the photo window stays usable on a narrow deck', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await openLevel(page, 'photos');
  const sky = page.locator('.photo-sky');
  await expect(sky.locator('canvas')).toHaveAttribute('data-ready', 'si', { timeout: 20000 });
  const shoot = page.locator('.beta-panel').getByRole('button', { name: 'Tomar foto' });
  await expect(shoot).toBeEnabled();
  const box = await sky.boundingBox();
  expect(box.height).toBeGreaterThan(140);
  await page.screenshot({ path: 'test-results/photo-760.png' });
  if (await sky.getAttribute('data-framed') !== 'si') {
    await shoot.click();
    await expect(page.locator('.eclss-speech')).toContainText(/no está entera|también salió|salieron/);
  }
  await expect(sky).toHaveAttribute('data-framed', 'si', { timeout: 20000 });
  await shoot.click();
  await expect(page.getByRole('heading', { name: 'Conoce tu nave' })).toBeVisible();
});
