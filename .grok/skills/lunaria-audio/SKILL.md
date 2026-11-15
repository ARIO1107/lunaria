---
name: lunaria-audio
description: >
  Mejora el sonido de Lunaria con el Web Audio que ya sintetiza el juego.
  Úsala ante música, efectos, volumen, silencio, cuenta atrás, despegue o
  ambiente de la cinemática. También ante /lunaria-audio.
when-to-use: >
  sonido, audio, música, efecto, volumen, silenciar, cuenta atrás, despegue
---

# Sonido de Lunaria

El juego no descarga clips ni usa una voz de pago. Los efectos salen de osciladores en `src/audio/audioManager.js`. La música de la película sale de `src/cinematic/score.js`. Titus sigue hablando por texto: la voz escrita es `titus-voice`.

## Contrato

- `unlockAudio` abre el contexto en el primer gesto. Sin eso el navegador deja el audio suspendido.
- `configureAudio` obedece `soundEnabled` y el volumen de 0 a 100. `playSound` no suena si el sonido está apagado, si el contexto no está en marcha, si la pestaña está oculta o si otro sonido empezó hace menos de 65 ms.
- `suspendAudio` corta los osciladores vivos. La pausa y el salto de la cinemática tienen que dejar el audio en silencio.
- Nombres de juego: `click`, `open`, `close`, `success`, `error`, `alarm`, `countdown`, `launch`, `landing`, `collect`, `levelComplete`.
- Cues de la película: `wake`, `console`, `ready`, `tick`, `ignite`, `triumph`. Ambientes: `pad`, `tension`, `ascent`, `triumph`.
- El contexto de la película se marca con `__lunariaCinematic`. No abras un segundo contexto para el mismo gesto.

## Un sonido nuevo

Añade el nombre al mapa que ya existe y llámalo en el evento que el jugador acaba de conseguir o fallar. Un acierto usa `success`. Un fallo usa `error`. Mantén el tono corto. El movimiento reducido no apaga el sonido. No importes Three.js desde el módulo de audio.
