import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
}
async function walk(page, key, duration) {
  await page.keyboard.down(key); await page.clock.runFor(duration); await page.keyboard.up(key);
}

test('exploration deck loads local 3D renders and stations do not launch unwritten levels', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await ready(page);
  await expect(page.getByText('Entorno de desarrollo · Misiones por definir')).toBeVisible();
  await page.locator('canvas').focus();
  await walk(page, 'd', 1600);
  await expect(page.locator('.map-toolbar > span').first()).toContainText('Cabina de mando');
  await walk(page, 'w', 460);
  await expect(page.locator('.station-card h3')).toHaveText('Propulsión');
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Panel de propulsión', exact: true })).toBeVisible();
  await expect(page.getByText('Punto de interacción preparado.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Encender motores' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Consultar referencia NASA/ })).toHaveAttribute('href', /nasa.gov/);
  await page.keyboard.press('Escape');
  await expect(page.locator('canvas')).toBeFocused();
  expect(errors).toEqual([]);
});

test('asset loading failure has a working retry', async ({ page }) => {
  let failed = false;
  await page.route('**/generated/titus.png', async route => {
    if (!failed) { failed = true; await route.abort(); } else await route.continue();
  });
  await page.goto('/');
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
    await page.getByRole('button', { name: 'Acercar cámara' }).click();
    await expect(page.locator('.zoom-controls span')).toHaveText('130 %');
    await page.getByRole('button', { name: 'Alejar cámara' }).click();
    await expect(page.locator('.zoom-controls span')).toHaveText('115 %');
  });
}

test('phone controls reach a console without a keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.clock.install(); await ready(page);
  for (const [name, duration] of [['Mover derecha', 1600], ['Mover arriba', 460]]) {
    const button = page.getByRole('button', { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    const rect = await button.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down(); await page.clock.runFor(duration); await page.mouse.up();
  }
  await page.locator('.touch-controls').getByRole('button', { name: 'Inspeccionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Panel de propulsión', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/station-mobile.png', fullPage: true });
});
