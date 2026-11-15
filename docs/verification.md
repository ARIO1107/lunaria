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

## Límites explícitos
Los GLB son geometría editable con jerarquías, sin rig esquelético ni clips. La
animación está programada y exportada a atlas. La escena y el fondo son conceptuales.
Quedan por diseñar los niveles, sus condiciones científicas, progresión y guardado.
