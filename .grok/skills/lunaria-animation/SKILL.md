---
name: lunaria-animation
description: >
  Anima a Alex, a Titus y al globo de la vista cenital sin rehacer los
  modelos. Úsala ante caminar, idle, seguimiento, parpadeo, cola del globo
  o movimiento reducido. También ante /lunaria-animation.
when-to-use: >
  animación, caminar, idle, sprite, globo, seguimiento de Titus, movimiento reducido
---

# Animación de Lunaria

Alex y Titus se mueven con el atlas horneado. Un ciclo nuevo se hornea desde los personajes actuales. Léelos en `lunaria-characters` y, si generas una hoja, lee `animation.md` de `game-assets`. No sustituyas el modelo para conseguir un frame.

## Cubierta y superficie

- `drawActor` en `src/game/deckRenderer.js`: Alex usa el frame 0 en reposo y los frames 1 a 8 al caminar. Titus cicla sus frames. Con movimiento reducido, Titus se queda en el frame 0 y el cielo deja de desplazarse.
- En la nave, el ángulo de Titus apunta a `guidePoint` cuando la estación activa está en `STATIONS`. Si no, mira hacia Alex cuando está lejos.
- En la superficie, Titus sigue el rastro de Alex. La cámara comparte `surfaceSpot` con el globo.

## Globo

El globo es HTML sobre el canvas, dentro de `.deck-viewport`, con `pointer-events: none`. Cada frame, `speechBox` lo coloca a partir de `actorScreen` o `surfaceSpot`. No guardes esa posición en el estado de React. La caja queda fuera de Alex y de Titus; la cola apunta a Titus. El texto sigue visible al hacer zoom. El texto y el ritmo los decide `titus-voice`.

Comprueba en el navegador que, al caminar, cambia el frame de Alex y que el globo sigue a Titus al acercar la cámara.
