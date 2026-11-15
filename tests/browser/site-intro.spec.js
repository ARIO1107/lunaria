import { expect, test } from '@playwright/test';

const introMenu = page => page.getByRole('button', { name: 'Play', exact: true });

test('the actual logo video ends before the main menu opens', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('.site-intro-video');
  await expect(intro).toBeVisible();
  await expect(introMenu(page)).toHaveCount(0);
  await expect.poll(() => intro.evaluate(video => video.currentTime)).toBeGreaterThan(.05);
  await expect(intro).toHaveJSProperty('muted', true);
  await expect(introMenu(page)).toBeVisible({ timeout: 6800 });
  await expect(intro).toHaveCount(0);
});

test('reduced motion and unavailable video both allow entry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(introMenu(page)).toBeVisible();
  await expect(page.locator('.site-intro-video')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/assets/menu/intro.mp4', route => route.abort());
  await page.reload();
  await expect(introMenu(page)).toBeVisible();
});

test('the menu melody starts after interaction and stops on mute', async ({ page }) => {
  await page.addInitScript(() => {
    window.menuAudio = { starts: 0, stops: 0 };
    const { start, stop } = AudioBufferSourceNode.prototype;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.loop) window.menuAudio.starts += 1;
      return start.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      if (this.loop) window.menuAudio.stops += 1;
      return stop.apply(this, args);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect.poll(() => page.evaluate(() => window.menuAudio.starts)).toBe(1);
  await page.getByRole('checkbox', { name: /mute/i }).check();
  await expect.poll(() => page.evaluate(() => window.menuAudio.stops)).toBe(1);
});

