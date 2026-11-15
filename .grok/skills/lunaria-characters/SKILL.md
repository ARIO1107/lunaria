---
name: lunaria-characters
description: >
  Mantiene la identidad de Alex y de Titus al generar, retocar o montar
  personajes de Lunaria. Úsala ante modelado, sprites, GLB, turnaround,
  traje, visor, robot o color de Titus. También ante /lunaria-characters.
when-to-use: >
  Alex, Titus, personaje, modelo, sprite, traje blanco, visor, robot, GLB
---

# Personajes de Lunaria

La identidad manda sobre el concepto nuevo. Si una imagen de referencia discute con los modelos, ganan `art/` y los GLB ya exportados del astronauta y de Titus.

Antes de generar, lee `characters.md` de la skill `game-assets`. Si pides un GLB, lee también `3d.md` y parte de la imagen canónica, no de un personaje nuevo. Antes de montarlo en Three.js, lee `threejs-frame-conventions` y mide el frente del asset.

## Identidad

- Alex: traje blanco y visor dorado.
- Titus: robot pequeño, cabeza rectangular oscura, ojos luminosos. Sigue siendo ese robot en la cubierta, en la superficie y en las cinemáticas.
- El gris de la cabina se pinta solo en `paintCabinTitus` (`src/view/firstPersonBay.js`): carcasa `#9aa3a8`, cara `#8b9498`, ojos `#d8faff`. No cambies los materiales del robot en `src/cinematic/cast.js` ni reemplaces el modelo en `art/models.js`.

## Cómo producir una variante

1. Ancla el estilo y la paleta en el sprite o el render que ya usa el juego.
2. Pide un solo cambio, con la lista de lo que debe quedarse igual: cabeza, ojos, traje, visor, escala y fondo.
3. Lee la imagen resultante. Rechaza un robot blanco o redondo, un Titus negro dentro de la cabina, o un visor que haya dejado de ser dorado.
4. La cubierta y la superficie usan atlas horneados. Un pose nuevo pasa por `npm run assets:bake`. Los GLB no se copian a `public/`.
