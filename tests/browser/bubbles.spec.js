import { test, expect } from '@playwright/test';
import { skipSiteIntro } from './siteIntro.js';
import { campaignAtLevel, campaignKey, campaignReducer } from '../../src/game/campaign.js';

async function continueSaved(page, state) {
  await page.goto('/');
  await skipSiteIntro(page);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignKey, value: state });
  await page.reload();
  await skipSiteIntro(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
}

async function bubbleClearance(page) {
  await expect(page.locator('.titus-bubble')).toBeVisible();
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas.ship-canvas');
    const bubble = document.querySelector('.titus-bubble');
    const crew = JSON.parse(canvas.dataset.crew || 'null');
    const view = canvas.getBoundingClientRect();
    const rect = bubble.getBoundingClientRect();
    const speech = {
      left: rect.left - view.left,
      top: rect.top - view.top,
      right: rect.right - view.left,
      bottom: rect.bottom - view.top,
    };
    if (bubble.dataset.tail === 'above') speech.bottom += 8;
    else if (bubble.dataset.tail === 'below') speech.top -= 8;
    else if (bubble.dataset.tail === 'right') speech.left -= 8;
    else speech.right += 8;
    const body = actor => {
      const left = actor.x - actor.anchor.x * crew.scale;
      const top = actor.y - actor.anchor.y * crew.scale;
      return { left, top, right: left + actor.w * crew.scale, bottom: top + actor.h * crew.scale };
    };
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      alex: overlaps(speech, body(crew.alex)),
      titus: overlaps(speech, body(crew.titus)),
      tail: bubble.dataset.tail,
    };
  });
}

test('the habitat bubble stays off Alex and Titus', async ({ page }) => {
  const started = campaignReducer({ ...campaignAtLevel(1), phase: 'briefing' }, { type: 'begin' });
  await continueSaved(page, { ...started, position: { x: 480, y: 300 } });
  await expect(page.locator('.map-toolbar')).toContainText('Habitat');
  await expect(page.locator('.titus-bubble')).toContainText(/life support/);
  const wide = await bubbleClearance(page);
  expect(wide).toMatchObject({ alex: false, titus: false, tail: 'above' });
  await page.getByRole('button', { name: 'Zoom in' }).click();
  const zoomed = await bubbleClearance(page);
  expect(zoomed.alex).toBe(false);
  expect(zoomed.titus).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await bubbleClearance(page);
  expect(phone.alex).toBe(false);
  expect(phone.titus).toBe(false);
});

test('level 3 uses fault lamps and the top-down bubble hides inside the station', async ({ page }) => {
  const state = { ...campaignReducer(campaignAtLevel(3), { type: 'begin' }), position: { x: 445, y: 120 } };
  await continueSaved(page, state);
  const bubble = page.locator('.titus-bubble');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText(/Captain Alex/);
  await expect(bubble).toContainText(/red lamp/);
  await page.getByRole('button', { name: 'Inspect equipment' }).click();
  await expect(bubble).toHaveCount(0);
  await page.getByRole('button', { name: 'Life support' }).click();
  await expect(page.getByText(/is stable/)).toBeVisible();
  await page.getByRole('button', { name: 'Propulsion' }).click();
  await expect(page.getByRole('button', { name: 'Lower the propulsion breaker' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.titus-bubble')).toContainText(/Source:/);
  const clearance = await bubbleClearance(page);
  expect(clearance.alex).toBe(false);
  expect(clearance.titus).toBe(false);
});

test('level 6 operations still show a Titus bubble on the surface', async ({ page }) => {
  const state = campaignReducer(campaignAtLevel(6), { type: 'begin' });
  await continueSaved(page, state);
  await expect(page.locator('.titus-bubble')).toBeVisible();
  await expect(page.locator('.titus-bubble')).toContainText(/Captain Alex/);
  await expect(page.locator('.titus-bubble')).toContainText(/cycles|activities/);
  await expect(page.getByRole('region', { name: 'Lunar surface' })).toBeVisible();
  const clearance = await bubbleClearance(page);
  expect(clearance.alex).toBe(false);
  expect(clearance.titus).toBe(false);
});
