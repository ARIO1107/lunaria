# Assets locales

`generated/` contiene spritesheets, retratos, cubierta y objetos PNG, junto con
`manifest.json`. Son renders de los modelos originales en `art/`.

Regenerar: `npm run assets:bake`. No editar manualmente el manifiesto ni cambiar
los anclajes sin regenerar los renders. La carga está en `src/game/assets.js`;
el dibujo, en `src/game/deckRenderer.js`.

Los GLB editables están en `art/exports/`, fuera del sitio publicado. No se
utilizan recursos visuales descargados de terceros. Si se añaden, documentar su
autor, URL y licencia aquí.
