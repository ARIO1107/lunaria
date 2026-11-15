---
name: lunaria-graphics
description: >
  Sube el aspecto de Lunaria en la cubierta, la cabina y la superficie sin
  cambiar de motor. Úsala ante luz, materiales, color, sombras, calidad
  gráfica o un pase visual. También ante /lunaria-graphics.
when-to-use: >
  gráficos, luz, materiales, sombras, color, calidad, look, pase visual
---

# Gráficos de Lunaria

Hay dos imágenes. La exploración es Canvas 2D horneado: cielo, salas y sprites. La cabina y las películas son Three.js. No unas las dos en un solo renderer. El escenario lo guarda `lunaria-scenes` y los personajes `lunaria-characters`.

## Cubierta y superficie

Un retoque de color, suelo o cielo se hace en `drawPad`, `drawSpace` y el CSS de exploración. Si el PNG de la nave debe cambiar, el origen es `art/ship.js` y el comando es `npm run assets:bake`.

## Cabina y película

La luz y los materiales nuevos se quedan en el chunk que ya importa Three.js. Antes de escribirlos, lee la nota que corresponda: `threejs-lighting`, `threejs-materials`, `threejs-textures` o `threejs-performance`. Esas notas enseñan a crear un renderer de ejemplo. En Lunaria no crees otro: engancha la luz al renderer que ya corre.

Titus en la cabina no puede quedar negro. Las sombras que lo aplastan se quedan apagadas en ese modelo. El ajuste de calidad `alto` puede costar más. `ajustado` baja el coste. El movimiento reducido quieta el adorno y deja el juego usable.

Mira la vista que cambiaste, en el navegador, antes de darla por buena. Si el cambio se publica, ciérralo con `lunaria-verify`.
