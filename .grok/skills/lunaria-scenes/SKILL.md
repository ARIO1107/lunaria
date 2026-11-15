---
name: lunaria-scenes
description: >
  Modela y revisa los escenarios de Lunaria: cubierta cenital, plataforma,
  cabina en primera persona y superficie lunar. Úsala ante escenario, nave,
  sala, estación, bake, colisión o vista cenital. También ante /lunaria-scenes.
when-to-use: >
  escenario, cubierta, nave, plataforma, superficie, sala, estación, bake, cenital
---

# Escenarios de Lunaria

La exploración se dibuja en Canvas 2D. Three.js hornea el arte y corre las cinemáticas. No pases la cubierta a una escena Three.js en vivo. La pantalla de juego es `CampaignScreen`. `FirstPersonBay` importa `src/view/firstPersonBay.js` de forma dinámica para que `WebGLRenderer` no entre en el bundle `index-*.js`.

Vista cenital es la cubierta o la superficie desde arriba. Abrir una estación pasa a primera persona. La vista es `pad` en el nivel 1, `space` en vuelo y `surface` en la Luna. En la preparación del nivel 1 la nave sigue en el suelo y el cielo es de día (`data-sky=pad`).

## Qué no se rompe

- Estaciones de la nave: `propulsion`, `coas`, `lander`, `breakers`, `oxygen`, `suit`, `eva`. Salas y colisión: `src/game/world.js`. El puente se llama Puente de mando.
- Objetos de superficie: `module`, `habitat`, `solar`, `life`, `storage`, `regolith`, `basalt`, `highland`, `lab`.
- El arte de la cubierta sale de `art/ship.js` con `npm run assets:bake` hacia `public/assets/generated`.

## Una estación nueva

Prefiere un juguete nuevo sobre una estación que ya existe. Lo decide `lunaria-gameplay`. Si hace falta un lugar caminable, añade el rectángulo en una sala ya existente, dibuja el marcador en el canvas y comprueba con `canOccupy` y `nearestStation` un punto al que se llega. Hornea solo cuando el PNG deba mostrar ese lugar. Los personajes los trata `lunaria-characters`.

Después de un cambio visible, mira la vista cenital en el navegador y camina hasta la estación tocada.
