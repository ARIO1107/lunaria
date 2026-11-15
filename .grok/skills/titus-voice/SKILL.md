---
name: titus-voice
description: >
  Escribe y revisa la voz de Titus en Lunaria: globos de la vista cenital,
  guía al caminar y al llegar, y datos curiosos con fuente NASA. Úsala cuando
  el usuario pida diálogos, globos, datos del espacio, satélites o cuerpos
  celestes, o cuando Titus deba decirle a Alex a dónde ir. También ante
  /titus-voice.
when-to-use: >
  globo de Titus, vista cenital, diálogo, dato curioso, NASA, capitán Alex
---

# Voz de Titus

Titus es el atractivo del juego. Cada línea le dice a Alex, en español, a dónde ir y cómo actuar. Los datos científicos llevan fuente. Los números del simulador se nombran como indicadores de juego.

Lee `src/game/titusGuide.js` y `src/game/titusBubbles.js` antes de cambiar una frase. La consola concreta la define `lunaria-gameplay`. La posición del globo la define `lunaria-animation`.

## Dónde vive cada frase

- Al caminar, la tarjeta de Titus usa `titusBrief`. Al llegar, un guide `at-${task.id}` usa `titusAtStation` una sola vez.
- En vista cenital, con la fase `active` y sin modal de estación, el globo alterna: tick par, guía corta; tick impar, un dato. El intervalo es 6500 ms, u 8000 ms con movimiento reducido. Se reinicia al cambiar de tarea o de nivel.
- El nivel 6, sin tarea, usa el texto de operaciones: tres ciclos y tres actividades.
- Estas cadenas siguen en el mensaje de campaña, no solo en el globo: «Comencemos por soporte vital.» al saltar la cinemática; «condiciones adecuadas para respirar» al llegar a soporte vital; «El soporte vital está preparado. Ahora iremos a comprobar la energía.» al completar el aire.

## Cómo escribir

- Trata a Alex de «capitán Alex». Una frase dice el lugar. La siguiente, o `howTo`, nombra el control real de esa consola.
- Un fallo no resuelve la tarea. Repite el paso con `howTo`.
- Un dato nuevo entra en `skyFacts` o en `scienceFacts` con `sourceUrl` de una página NASA que hayas abierto y `sourceTitle`. No inventes distancias, tiempos ni procedimientos. El globo de un dato termina con `Fuente:` y ese título.
- Si una frase ya está en un test, conserva la subcadena. Comprueba `tests/titusGuide.test.js` y `tests/titusBubbles.test.js`.
