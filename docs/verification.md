# Verificación · Cubierta y assets 2.5D

## Comprobaciones ejecutadas
- `npm.cmd run assets:bake`: PNG, manifiesto y tres GLB generados correctamente.
- `npm.cmd run build`: producción correcta; Three.js no forma parte del bundle del juego.
- `npm.cmd test`: 11 pruebas correctas (incluye 5 del experimento de lanzamiento archivado).
- `npm.cmd run test:e2e`: 7 pruebas correctas en Edge sobre el build de producción.
- `git diff --check`: sin errores de whitespace; Git avisa de normalización LF/CRLF.
- Inspector visual a 1440, 768 y 390 px: 0 errores, 1 aviso de alineación.
- Capturas finales de las tres resoluciones y galería de modelos revisadas.

## Recorridos de navegador
1. Carga del arte local, movimiento por teclado hasta Propulsión e inspección sin lanzar niveles.
2. Fallo de descarga del atlas de Titus y recuperación mediante Reintentar.
3. Galería con retratos renderizados y cierre por Escape.
4–6. Escritorio, tablet y móvil: sin overflow horizontal, zoom funcional.
7. Acceso a Propulsión e inspección usando controles de puntero, sin teclado.

Se corrigió el montaje del reloj virtual en las pruebas: debe instalarse antes de
que arranque el RAF de la página. Instalarlo después mezclaba tiempos nativos y
simulados y hacía fallar el recorrido automatizado. El test conserva comprobaciones
intermedias de sala y consola para identificar futuras regresiones.

## Revisión visual
- La cubierta ocupa la región principal; ventanas, consolas, personajes y sombras
  tienen volumen real prerenderizado. Cámara y actores usan una proyección compartida.
- La galería permite revisar los modelos a mayor escala. Se eliminó un reflejo
  geométrico que parecía una pieza flotante sobre el visor y se redondeó la cara de Titus.
- Los props tienen sombras separadas y orden de profundidad frente a los personajes.
- Se redujo la exposición del render y se añadieron asientos, barandillas, tuberías
  y fijaciones. Los equipos siguen siendo una base artística estilizada, no hardware
  Apolo reconstruido a escala.
- Los márgenes móviles son 16 px. Los controles táctiles están junto al mapa.
- No hay contadores de misión ni telemetría inventada; cada consola identifica su
  estado como punto de integración futuro.
- El aviso visual restante compara la tarjeta lateral con el mapa; debajo de esa
  tarjeta están la leyenda y otros contenidos que completan la columna. No se
  estira una tarjeta vacía para igualar artificialmente las alturas.

## Cinemática de apertura

Medición en Edge, headless, con Playwright sobre el build de producción:

- Gráficos Alto, cabina ya estabilizada, en la pasada completa más reciente: 60 FPS en cuatro muestras. Pasadas anteriores en este mismo Edge se quedaron en 30 FPS cuando el navegador presentaba a 30 Hz.
- Misma cabina, con el límite de refresco desactivado: 109, 212 y 387 FPS. El intervalo medio de `requestAnimationFrame` fue 4,9 ms. En este equipo la escena supera el objetivo de 60 FPS cuando el navegador no la recorta al refresco.
- Gráficos Ajustado y CPU emulada a 4×, en la pasada completa más reciente: 18 FPS en la ventana del salto y después 59, 60, 59 y 60. Pasadas anteriores, con el navegador a 30 Hz, se quedaron en 24–31. Esa emulación no es un equipo modesto. 30 FPS estables en hardware modesto siguen sin medirse en otro aparato.
- El contador cae al saltar el tiempo de la prueba. Esa caída no es la reproducción continua.
- Three.js va en un chunk propio (`runtime`, 609 kB, 155 kB gzip). El bundle de la cubierta no lo incluye. El aviso de Vite por superar 500 kB sigue presente.
- Una ruta de modelo que no existe deja el aviso en pantalla. La secuencia publicada usa mallas propias. Omitir entra en «Revisar soporte vital».
- A 1440, 768 y 390 px el lienzo conserva la proporción de la ventana. Ajustado usa relación de píxeles 1 y sombras apagadas.
- Si el navegador pierde el contexto WebGL, el tiempo de la escena se detiene y aparece el aviso. Al recuperarse, el aviso desaparece.
- El fundido entre exterior y cabina no se queda en negro. El plano del saludo muestra a Titus y a Alex.
- Three.js no se descarga en el menú. Entra en un chunk aparte al pulsar Jugar, y el bundle de la cubierta no contiene el renderizador WebGL.
- Esc cierra la cinemática, suelta el reproductor y deja el nivel 1 jugable. Continuar, con partida guardada, no vuelve a montarla.
- Jugar con una partida existente pide confirmación. Conservar la partida no la borra. Empezar de nuevo sí reproduce la cinemática, y al llegar al final entra en «Revisar soporte vital» con el reproductor ya liberado.
- Lista de la cinemática, comprobada en la misma pasada: partida nueva abre la escena; el casco, Alex, Titus y el visor están en la escena con mallas propias; a los 24 s Alex está sentado y mira a Titus, a los 52 s Titus señala y a los 74 s Alex ha caminado; cada subtítulo coincide con su frase, incluida la de 384 400 km; la cámara pasa de exterior a cabina; Esc detiene el audio, congela el contador de fotogramas de la cinemática y abre el nivel 1; Continuar no la repite. El recorrido de la cubierta, la galería, el móvil y el menú siguieron pasando en esa misma ejecución.

## Límites explícitos
Los GLB son geometría editable con jerarquías, sin rig esquelético ni clips. La
animación está programada y exportada a atlas. La escena y el fondo son conceptuales.
Quedan por diseñar los niveles, sus condiciones científicas, progresión y guardado.
