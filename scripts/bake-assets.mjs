import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const destination = path.resolve('public/assets/generated');
await mkdir(destination, { recursive: true });
await mkdir(path.resolve('art/exports'), { recursive: true });
const server = await createServer({ server: { port: 5175, host: '127.0.0.1' } });
await server.listen();
let browser;
const writeImage = (name, data) => writeFile(path.join(destination, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', error => console.error(error));
  await page.goto(`${server.resolvedUrls.local[0]}tools/asset-studio.html`);
  await page.waitForFunction(() => Boolean(window.assetStudio), { timeout: 60000 });
  await page.evaluate(() => window.assetStudio.pause());
  const manifest = { version: 1, generator: 'art/models.js + art/ship.js', actors: {}, props: [] };
  for (const name of ['astronaut', 'titus']) {
    console.log(`Rendering ${name} sprite atlas…`);
    const result = await page.evaluate(name => window.assetStudio.atlas(name), name);
    await writeImage(name, result.image); manifest.actors[name] = { ...result.meta, file: `${name}.png` };
    await writeImage(`${name}-portrait`, await page.evaluate(name => window.assetStudio.portrait(name), name));
  }
  console.log('Rendering ship and depth-sorted equipment…');
  const ship = await page.evaluate(() => window.assetStudio.ship());
  await writeImage('deck', ship.image); manifest.deck = { ...ship.meta, file: 'deck.png' };
  for (const { image, ...prop } of ship.props) { await writeImage(`station-${prop.id}`, image); manifest.props.push({ ...prop, file: `station-${prop.id}.png` }); }
  await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
  for (const name of ['astronaut', 'titus', 'ship']) {
    console.log(`Exporting editable ${name}.glb…`);
    const data = await page.evaluate(name => window.assetStudio.glb(name), name);
    await writeFile(path.resolve(`art/exports/${name}.glb`), Buffer.from(data, 'base64'));
  }
  console.log(`Assets generated in ${destination}`);
} finally {
  await browser?.close(); await server.close();
}
