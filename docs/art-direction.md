# Cubierta de exploración · Dirección aprobada

El trabajo actual se centra en assets y exploración. Los niveles se escribirán por
el equipo y se conectarán posteriormente. La antigua prueba de lanzamiento queda
archivada en sus módulos, fuera de la experiencia de exploración.

## Arte
- Cámara ortográfica cenital inclinada, techo retirado y paredes frontales bajas.
- Nave de tres salas con metal pintado, paneles modulares, ventanas, barandillas,
  conductos, armarios, asientos, compuertas y estaciones con volumen.
- Astronauta: marfil, bandas naranjas, visor azul oscuro, guantes y botas grafito,
  mochila y controles de pecho. Anatomía compacta y articulaciones animables.
- Titus: cabeza rectangular redondeada, pantalla oscura, dos ojos luminosos,
  cuerpo pequeño, carcasa grafito, flotación y propulsores.
- Fondos ilustrativos. En el nivel 1 las ventanas muestran la plataforma de lanzamiento. Desde el nivel 2, el fondo vuelve a ser el espacio. No se presentan como vistas reales de una misión ni como mediciones NASA.

## Producción reproducible
Modelos originales procedurales Three.js en `art/`, basados en las referencias
visuales aportadas, sin copiar texturas ni descargar modelos. Se prerenderizan
con cámara ortográfica y luces comunes mediante `npm run assets:bake`.
El navegador del jugador carga PNG locales en la exploración. Three.js entra solo en las dos cinemáticas del nivel 1.

Entregables: cubierta, objetos independientes con profundidad, spritesheets de
astronauta/Titus en ocho direcciones, marcha y flotación, retratos de presentación,
metadatos de proyección y archivo GLB por modelo para edición en Blender.

## Integración futura
Coordenadas y colisiones independientes de los gráficos. Cada consola tiene ID
estable y descripción; `src/game/missionRegistry.js` registra módulos externos.
La cubierta empieza sin misiones. La interacción muestra información del equipo
hasta que se registra un módulo para esa estación. Los datos científicos deben
tener fuente, unidades y distinción explícita respecto a ajustes educativos.
