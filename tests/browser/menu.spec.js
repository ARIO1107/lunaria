import { test, expect } from '@playwright/test';

test('the terminal keeps its layout and supports keyboard navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const lunar = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/assets/menu/lunar.png'));
  await page.goto('/');
  expect((await lunar).ok()).toBe(true);
  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  await expect(menu.getByRole('button', { name: /^Continuar/ })).toBeDisabled();
  await expect(page.getByRole('img', { name: 'Lunaria', exact: true })).toBeVisible();
  await expect(page.locator('.terminal-logo-mark img')).toHaveJSProperty('naturalWidth', 1024);
  await page.keyboard.press('ArrowDown');
  const missions = menu.getByRole('button', { name: 'Seleccionar misión' });
  await expect(missions).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText('Bloqueado', { exact: true })).toHaveCount(5);
  await expect(page.getByRole('dialog').getByText('Disponible', { exact: true })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(missions).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await menu.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fin de la transmisión' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('preferences and exploration progress survive a reload', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Configuración' }).click();
  await page.getByRole('checkbox', { name: 'Reducir animaciones' }).check();
  const volume = page.getByRole('slider', { name: 'Volumen general' });
  await volume.focus();
  await page.keyboard.press('End');
  await expect(volume).toHaveValue('100');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await page.getByRole('button', { name: 'Omitir cinemática' }).click();
  await expect(page.locator('.asset-loading')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'Acercar cámara' }).click();
  await page.locator('canvas').focus();
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(2400);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('.map-toolbar')).toContainText('Cabina de mando');
  await page.getByRole('button', { name: 'Menú principal', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('checkbox', { name: 'Reducir animaciones' })).toBeChecked();
  await expect(page.getByRole('slider', { name: 'Volumen general' })).toHaveValue('100');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('.map-toolbar')).toContainText('Cabina de mando', { timeout: 30000 });
  await expect(page.locator('.zoom-controls')).toContainText('130 %');
});

