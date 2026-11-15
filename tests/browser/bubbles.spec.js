import { test, expect } from '@playwright/test';
import { campaignAtLevel, campaignKey, campaignReducer } from '../../src/game/campaign.js';

async function continueSaved(page, state) {
  await page.goto('/');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignKey, value: state });
  await page.reload();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
}

test('level 3 uses fault lamps and the top-down bubble hides inside the station', async ({ page }) => {
  const state = { ...campaignReducer(campaignAtLevel(3), { type: 'begin' }), position: { x: 445, y: 120 } };
  await continueSaved(page, state);
  const bubble = page.locator('.titus-bubble');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText(/Capitán Alex/);
  await expect(bubble).toContainText(/lámpara roja/);
  await page.getByRole('button', { name: 'Inspeccionar equipo' }).click();
  await expect(bubble).toHaveCount(0);
  await page.getByRole('button', { name: 'Soporte vital' }).click();
  await expect(page.getByText(/está estable/)).toBeVisible();
  await page.getByRole('button', { name: 'Propulsión' }).click();
  await expect(page.getByRole('button', { name: 'Bajar disyuntor de propulsión' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.titus-bubble')).toContainText(/Capitán Alex/);
});

test('level 6 operations still show a Titus bubble on the surface', async ({ page }) => {
  const state = campaignReducer(campaignAtLevel(6), { type: 'begin' });
  await continueSaved(page, state);
  await expect(page.locator('.titus-bubble')).toBeVisible();
  await expect(page.locator('.titus-bubble')).toContainText(/Capitán Alex/);
  await expect(page.locator('.titus-bubble')).toContainText(/ciclos|actividades/);
  await expect(page.getByRole('region', { name: 'Superficie lunar' })).toBeVisible();
});
