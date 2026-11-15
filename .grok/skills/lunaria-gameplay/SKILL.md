---
name: lunaria-gameplay
description: >
  Diseña consolas distintas por nivel en Lunaria sin cambiar las respuestas
  de la campaña. Úsala ante misiones, minijuegos, estaciones, niveles 3 a 6
  o cuando una tarea se sienta repetida. También ante /lunaria-gameplay.
when-to-use: >
  misión, consola, minijuego, nivel, tarea, jugabilidad, estación interactiva
---

# Jugabilidad de Lunaria

Cada tarea se juega con un control propio. El contrato de acierto sigue en `correct()` de `src/game/campaign.js` y en `kind` y `answer` de `src/data/levelDefinitions.js`. No cambies esos campos para que un botón nuevo encaje.

Los niveles 1 y 2 ya están aceptados. En `StationMission.jsx` salen antes del mapa `distinct`: soporte vital, lanzamiento, y las cinco consolas de `ShipTour` (`navigation`, `supplies`, `atmosphere`, `energy-tour`, `signal`). El nivel 6 deja `tasks` vacío y usa el panel de operaciones.

## Una consola nueva

1. Lee la tarea. El componente vive en `src/missions/DistinctMissions.jsx` y se registra por `task.id`.
2. Entrega el valor que ese `kind` ya espera: todas las etiquetas de un `checks`, `estable` en soporte vital, un ángulo a ±5, `A`/`B`/`C`, el canal `7`, `true` al recoger, o el texto exacto de una elección.
3. Si el acierto solo comprueba que las etiquetas pedidas están, rechaza lo que sobra en la interfaz, antes de `onAnswer`.
4. Una acción incorrecta muestra a Titus y no envía la respuesta. `howTo` nombra el control de verdad: lámpara, disyuntor, bandeja, orden, horizonte, frenado, mapa o esclusa. La frase la escribe `titus-voice`.
5. El fallo enseña el paso. No autocompletes la consola.
6. Pasa `tests/laterMissions.test.js` y el recorrido de campaña que completa los cinco niveles. Si tocas el nivel 2, corre también `tests/browser/level2.spec.js`.
