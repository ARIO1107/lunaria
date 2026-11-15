---
name: lunaria-cinematics
description: >
  Mejora las cinemáticas de Lunaria sin meter Three.js en la cubierta.
  Úsala ante la película de apertura, el despegue, cámaras, subtítulos,
  salto o FPS del filme. También ante /lunaria-cinematics.
when-to-use: >
  cinemática, película, apertura, despegue, subtítulo, cámara, omitir, FPS
---

# Cinemáticas de Lunaria

`CinematicPlayer.jsx` importa `src/cinematic/runtime.js` en un chunk aparte. El reparto, los sets, el guion y la música viven en `cast.js`, `models.js`, `sets.js`, `script.js` y `score.js`. La cubierta no entra en ese renderer. Lo vigila `lunaria-scenes`.

## Lo que ya está cerrado

- Menú, Jugar, película, nivel 1. Continuar no vuelve a pasar la película.
- La apertura dura unos 75 segundos, se puede omitir y no dice «384 400 km». La nave sigue en la plataforma.
- La película de despegue, de unos 60 segundos, empieza solo tras un ascenso logrado, en la fase `launchCinematic`. No hay un segundo lanzamiento jugable.
- Omitir para animación, audio y temporizadores, libera recursos y entra al nivel. En escritorio vale Escape. En el móvil hay un botón.
- No cambies los materiales del robot en `cast.js`. El gris de la cabina lo pinta `lunaria-characters`.

## Al tocar Three.js

Lunaria usa `three` 0.187 y `WebGLRenderer`. No pases la película a `WebGPURenderer` ni a React Three Fiber. Las notas de `threejs-fundamentals`, `threejs-lighting`, `threejs-materials`, `threejs-animation`, `threejs-loaders`, `threejs-textures` y `threejs-performance` describen la r186: comprueba que la clase exista en el paquete instalado antes de usarla. Léelas solo dentro de `src/cinematic`, de `src/view/firstPersonBay.js` o del horneado.

Un efecto nuevo se apaga en calidad ajustada y con movimiento reducido. Mide FPS en la apertura, con margen antes del final. El objetivo deseable es 60 y el suelo estable es 30. Libera geometrías, texturas y listeners al omitir o al terminar. El cierre visual se publica con `lunaria-verify`. El sonido de la película lo trata `lunaria-audio`.
