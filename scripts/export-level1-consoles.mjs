import { mkdir, writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createLevel1Scene, level1Models } from '../art/level1Consoles.js';

// Three's browser exporter reads in-memory blobs via FileReader.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buffer => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};

const output = new URL('../art/exports/level1/', import.meta.url);
await mkdir(output, { recursive: true });
const exporter = new GLTFExporter();

for (const id of Object.keys(level1Models)) {
  const { scene } = createLevel1Scene(id);
  // glTF supports punctual lights. Preview fill lighting is supplied by the viewer.
  for (const light of scene.children.filter(node => node.isHemisphereLight)) scene.remove(light);
  const model = await exporter.parseAsync(scene, { binary: true });
  await writeFile(new URL(id + '.glb', output), Buffer.from(model));
  console.log(id + '.glb', Math.round(model.byteLength / 1024) + ' KiB');
}

