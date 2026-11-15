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
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
  const inspect = page.getByRole('button', { name: 'Inspect equipment' });
  await expect(inspect).toBeEnabled();
  await inspect.click();
}

test('level 2 consoles guide Alex from the sight to the signal', async ({ page }) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await openLevel(page, 'navigation');
  await expect(page.locator('.crew-card')).toContainText('COAS alignment sight');
  await expect(page.locator('.fp-bay canvas')).toHaveAttribute('data-vista', 'space');
  await page.getByLabel('Orientation').fill('45');
  await page.getByRole('button', { name: 'Lock orientation' }).click();
  await expect(page.locator('.crew-card')).toContainText('A7L suit');

  await openLevel(page, 'supplies');
  await page.getByRole('button', { name: 'Souvenir from Earth' }).click();
  await page.getByRole('button', { name: 'Close the bag' }).click();
  await expect(page.getByText(/does not go in the emergency bag/)).toBeVisible();
  await page.getByRole('button', { name: 'Souvenir from Earth' }).click();
  for (const name of ['Water and food', 'Med kit', 'Tools and science gear']) {
    await page.getByRole('button', { name }).click();
  }
  await page.getByRole('button', { name: 'Close the bag' }).click();
  await expect(page.locator('.crew-card')).toContainText('life-support monitor');

  await openLevel(page, 'atmosphere');
  await page.getByRole('button', { name: 'Look only at the pressure' }).click();
  await expect(page.getByText(/does not refill the air/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log the reading' })).toBeDisabled();
  await page.getByRole('button', { name: 'Open the oxygen reserve' }).click();
  await page.getByRole('button', { name: 'Log the reading' }).click();
  await expect(page.locator('.crew-card')).toContainText('power station');

  await openLevel(page, 'energy-tour');
  await page.getByRole('button', { name: 'Cut the main bus' }).click();
  await expect(page.getByText(/shut down/)).toBeVisible();
  await page.getByRole('button', { name: 'Life-support backup' }).click();
  await page.getByRole('button', { name: 'Navigation backup' }).click();
  await page.getByRole('button', { name: 'Cut the main bus' }).click();
  await expect(page.getByText(/turned off/)).toBeVisible();
  await page.getByRole('button', { name: 'Log essential systems' }).click();
  await expect(page.locator('.crew-card')).toContainText('fictional channel 7');

  await openLevel(page, 'signal');
  await page.getByLabel('Signal channel').fill('7');
  await page.getByRole('button', { name: 'Send and wait' }).click();
  await expect(page.getByText(/Unknown origin/)).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Write it in the log' }).click();
  await expect(page.locator('.crew-card')).toContainText('frame');

  await openLevel(page, 'photos');
  await expect(page.locator('.crew-card')).toContainText('COAS alignment sight');
  await expect(page.locator('.crew-card')).toContainText('Take photo');
  await expect(page.locator('.fp-bay canvas')).toHaveAttribute('data-vista', 'space');
  await expect(page.locator('.photo-sky canvas')).toHaveAttribute('data-ready', 'si', { timeout: 20000 });
  await page.screenshot({ path: 'test-results/photo-1440.png' });
  const shoot = page.locator('.beta-panel').getByRole('button', { name: 'Take photo' });
  if (await page.locator('.photo-sky').getAttribute('data-framed') !== 'si') {
    await shoot.click();
    await expect(page.locator('.eclss-speech')).toContainText(/not fully inside|also in the frame|were also in the frame/);
  }
  await expect(page.locator('.photo-sky')).toHaveAttribute('data-framed', 'si', { timeout: 20000 });
  await shoot.click();
  await expect(page.getByRole('heading', { name: 'Know your ship' })).toBeVisible();
  await expect(page.getByText(/fictional signal/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('the photo window stays usable on a narrow deck', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await openLevel(page, 'photos');
  const sky = page.locator('.photo-sky');
  await expect(sky.locator('canvas')).toHaveAttribute('data-ready', 'si', { timeout: 20000 });
  const shoot = page.locator('.beta-panel').getByRole('button', { name: 'Take photo' });
  await expect(shoot).toBeEnabled();
  const box = await sky.boundingBox();
  expect(box.height).toBeGreaterThan(140);
  await page.screenshot({ path: 'test-results/photo-760.png' });
  if (await sky.getAttribute('data-framed') !== 'si') {
    await shoot.click();
    await expect(page.locator('.eclss-speech')).toContainText(/not fully inside|also in the frame|were also in the frame/);
  }
  await expect(sky).toHaveAttribute('data-framed', 'si', { timeout: 20000 });
  await shoot.click();
  await expect(page.getByRole('heading', { name: 'Know your ship' })).toBeVisible();
});
