# Lunaria · Cubierta de exploración

Entorno web 2.5D para un simulador de astronautas junior (7–12 años).
La beta recorre cinco niveles, del embarque al puesto lunar, y después abre
un modo de operaciones por turnos. Alex se mueve por la nave y por la superficie.
Titus explica los objetivos. Los números de recursos son unidades de juego.

## Ejecutar

Node.js 22.12+:

```sh
npm install
npm run dev
```

Abre `http://localhost:5173`. En PowerShell con scripts bloqueados usa `npm.cmd`.

El menú de terminal abre la aplicación. **Jugar** empieza la campaña con una
cinemática de embarque. **Continuar** recupera la campaña guardada en este navegador.
**Seleccionar misión** abre solo los niveles ya desbloqueados, o cualquiera si se marca
el modo demostración.
Usa ↑/↓, Enter y Escape, o selecciona las opciones con el puntero.
La configuración de volumen y animaciones se guarda localmente.

**Controles:** WASD/flechas para caminar, E/Espacio para inspeccionar un equipo,
botones +/− para acercar la cámara. En móvil hay controles bajo la nave.
«La tripulación» abre la galería de personajes.

## Qué incluye

- Nave ortográfica inclinada: tres salas, suelo modular, ventanas a la plataforma en el nivel 1 y al espacio después,
  consolas, equipos, asientos, tuberías, luces y paredes recortadas.
- Astronauta modelado con traje marfil/naranja, visor azul, mochila y guantes.
- Titus modelado en grafito, con pantalla facial, flotación y seguimiento.
- Sprites originales en ocho orientaciones, marcha y tres estados de Titus.
- Profundidad por posición: personajes y consolas se ocultan unos a otros.
- Colisiones, cámara con zoom, interacción y recuperación de fallos de carga.
- Fichas educativas con enlaces NASA. Los indicadores de la cinemática se nombran como indicadores de juego, no como telemetría NASA.
- Campaña jugable de cinco niveles y un modo de operaciones. El nivel 1 prepara el lanzamiento en tierra: soporte vital, energía, propulsión, autorización y el simulador de ascenso.

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

**Three.js entra solo en dos cinemáticas del nivel 1**, en un chunk aparte:
la apertura en la plataforma y el despegue tras superar el simulador de ascenso.
La exploración sigue en Canvas 2D. Los GLB de `art/exports` no se descargan
durante la partida. Las cinemáticas construyen el lanzador, la torre, a Alex
y a Titus con mallas propias y pueden cargar un GLB si se les pasa una ruta.
No hay voces grabadas: los diálogos van en subtítulos. La música es original,
generada en el navegador. En órbita, los motores no suenan: la música no
representa sonido en el vacío.

## Campaña

La partida jugable está en `src/components/CampaignScreen.jsx` y
`src/data/levelDefinitions.js`. Jugar, si no hay partida, reproduce la
cinemática de la plataforma y entra al nivel 1. Continuar no la repite.
Esc u «Omitir cinemática» también entran al nivel 1. Tras separar la primera
etapa en el simulador, otra cinemática resume el despegue hasta la órbita
terrestre. Omitirla, si el ascenso ya tuvo éxito, abre el resumen y permite
pasar al nivel 2. El diseño y las fuentes están en
[docs/game-design.md](docs/game-design.md) y
[docs/scientific-sources.md](docs/scientific-sources.md).

El registro de la cubierta sigue aceptando un módulo por estación. Ver
[docs/architecture.md](docs/architecture.md). Las cifras de
`src/data/nasaTelemetry.js` pertenecen al experimento de lanzamiento y no se
muestran como telemetría real.

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

Nave conceptual y fondo ilustrado, no una reconstrucción de Apolo. Los datos
científicos enlazan a NASA; los recursos, las tolerancias y el mapa son
parámetros del simulador. Claridad para niños no significa decisiones triviales.

[Dirección de arte](docs/art-direction.md) · [Arquitectura](docs/architecture.md)
