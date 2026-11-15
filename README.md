# Lunaria · Cubierta de exploración

Entorno web 2.5D para un simulador de astronautas junior (7–12 años).
**Los niveles están por definir.** Esta entrega prepara la nave, el astronauta,
Titus y las interacciones para incorporar las misiones que escriba el equipo.

## Ejecutar

Node.js 22.12+:

```sh
npm install
npm run dev
```

Abre `http://localhost:5173`. En PowerShell con scripts bloqueados usa `npm.cmd`.

**Controles:** WASD/flechas para caminar, E/Espacio para inspeccionar un equipo,
botones +/− para acercar la cámara. En móvil hay controles bajo la nave.
«La tripulación» abre la galería de personajes.

## Qué incluye

- Nave ortográfica inclinada: tres salas, ventanas al espacio, suelo modular,
  consolas, equipos, asientos, tuberías, luces y paredes recortadas.
- Astronauta modelado con traje marfil/naranja, visor azul, mochila y guantes.
- Titus modelado en grafito, con pantalla facial, flotación y seguimiento.
- Sprites originales en ocho orientaciones, marcha y tres estados de Titus.
- Profundidad por posición: personajes y consolas se ocultan unos a otros.
- Colisiones, cámara con zoom, interacción y recuperación de fallos de carga.
- Fichas educativas con enlaces NASA, sin misiones activas ni telemetría ficticia.

## Modelos editables y pipeline

```text
art/
  models.js            # Modelos articulados de astronauta y Titus
  ship.js              # Geometría modular de cubierta y mobiliario
  palette.js           # Materiales
  exports/
    astronaut.glb      # Abrir/importar en Blender u otro editor 3D
    titus.glb
    ship.glb
public/assets/generated/
  astronaut.png        # Atlas: 8 direcciones × (reposo + 8 pasos)
  titus.png            # Atlas: 8 direcciones × 8 fotogramas × 3 estados
  *-portrait.png       # Retratos transparentes de 768×768
  deck.png             # Cubierta prerenderizada de 2240×1440
  station-*.png        # Equipos y asientos independientes
  manifest.json        # Encuadres, anclajes y proyección exacta
```

Los GLB contienen geometría, materiales y jerarquías editables; no incluyen un rig
esquelético ni clips de animación. La animación está definida por código en los
modelos y exportada a spritesheets. No hay modelos ni texturas descargados de terceros.

Para regenerar los PNG y GLB tras editar los modelos:

```sh
npm run assets:bake
```

Necesita Microsoft Edge instalado. El script inicia su propio servidor Vite y lo
cierra al terminar. El taller interactivo, con Vite iniciado, está en
`http://localhost:5173/tools/asset-studio.html`.

**Three.js se usa para fabricar el arte, no en el juego publicado.** El juego usa
React, Tailwind y Canvas 2D con imágenes locales (~2 MB en conjunto). Los GLB no
se copian al sitio publicado ni se descargan durante la partida.

## Preparado para las misiones

`src/game/missionRegistry.js` comienza vacío. Cada estación tiene ID estable;
un módulo futuro se registra con `id`, `stationId`, `title` y `Component`.
El componente recibe `{ station, onClose }`. Ver [docs/architecture.md](docs/architecture.md).

El experimento anterior de lanzamiento se conserva en `LaunchPanel.jsx`,
`launchSimulation.js` y sus pruebas, pero no está conectado al juego ni representa
un nivel aprobado. Las cifras propuestas anteriormente siguen identificadas por
su nivel de verificación en `src/data/nasaTelemetry.js`.

## Verificar y publicar

```sh
npm test
npm run build
npm run test:e2e
npm run preview
```

Las pruebas E2E usan Edge y el build de producción. Sirve `dist/` en cualquier
hosting estático; las rutas relativas admiten GitHub Pages en una subcarpeta.

## Ciencia

Nave conceptual y fondo ilustrado, no una reconstrucción de Apolo. Las futuras
misiones deberán distinguir datos históricos documentados, condiciones iniciales
y ajustes educativos. Claridad para niños no significa decisiones triviales.

[Dirección de arte](docs/art-direction.md) · [Arquitectura](docs/architecture.md)
