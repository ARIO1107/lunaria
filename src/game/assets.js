const base = `${import.meta.env.BASE_URL}assets/generated/`;
export const assetUrl = file => `${base}${file}`;
let pending;

function image(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${file}`));
    img.src = assetUrl(file);
  });
}

/** A failed load is retryable; a loaded bundle is shared across canvas remounts. */
export function loadArt() {
  if (!pending) pending = (async () => {
    const response = await fetch(assetUrl('manifest.json'));
    if (!response.ok) throw new Error('No se encontró el manifiesto de assets.');
    const manifest = await response.json();
    if (manifest.version !== 1) throw new Error('Versión de assets no compatible.');
    const files = [manifest.deck.file, ...Object.values(manifest.actors).map(a => a.file), ...manifest.props.map(p => p.file)];
    const images = await Promise.all(files.map(image));
    return { manifest, images: Object.fromEntries(files.map((file, i) => [file, images[i]])) };
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
