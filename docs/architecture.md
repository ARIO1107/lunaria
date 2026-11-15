# Arquitectura · Cubierta 2.5D

## Separación de responsabilidades

- `art/`: modelos 3D originales, materiales y exportaciones editables.
- `tools/assetStudio.js`: escena Three.js, iluminación, cámara y render de atlas.
- `scripts/bake-assets.mjs`: automatiza PNG, manifiesto y GLB usando Edge.
- `src/game/assets.js`: carga y caché de imágenes locales, con reintento.
- `src/game/world.js`: plano navegable, equipos, mobiliario y colisiones.
- `src/game/deckRenderer.js`: composición Canvas, proyección, orden de profundidad,
  sprites animados, zoom y fondo espacial ilustrado.
- `src/components/ShipCanvas.jsx`: entrada de teclado/táctil y seguimiento de Titus.
- `src/components/Game.jsx`: interfaz de exploración, galería, fichas y módulos futuros.
- `src/data/stationDescriptions.js`: fichas educativas y referencias científicas.
- `src/game/missionRegistry.js`: asociación explícita de estaciones con misiones.

## Coordenadas y dibujo

La navegación usa X/Y en el plano. Los modelos usan X/Z para ese mismo plano y Y
para la altura. El baker proyecta el origen y los ejes de la cámara ortográfica
en `manifest.json`; Canvas utiliza esa transformación exacta para colocar actores
sobre la cubierta, sin aproximar posiciones a ojo.

La cubierta se dibuja primero. Equipos, asientos y actores se ordenan por su Y
de navegación. Los anclajes de sprites son el punto del suelo, no el centro de
la imagen. La cámara sigue al astronauta cuando el encuadre no contiene todo el
mapa. Acercar la cámara sólo cambia el dibujo, nunca las colisiones.

## Incorporar una misión cuando el equipo la apruebe

```jsx
// Por ejemplo, en src/missions/register.js, importado una vez antes de renderizar.
import { missions } from '../game/missionRegistry.js';
import ApprovedPowerMission from './ApprovedPowerMission.jsx';

missions.register({
  id: 'approved-power-mission',
  stationId: 'breakers',
  title: 'El título acordado por el equipo',
  Component: ApprovedPowerMission,
});
```

La consola abre el componente dentro de un diálogo y pausa el movimiento de la
tripulación. El componente recibe `{ station, onClose }`. Puede gestionar su estado
y finalizar llamando a `onClose`. No hay un sistema de progresión, guardado o
condiciones de victoria prefijado: se diseñará con los niveles escritos.

IDs disponibles: `propulsion`, `coas`, `lander`, `breakers`, `oxygen`, `suit`, `eva`.
El registro rechaza IDs desconocidos, duplicados y estaciones ya ocupadas.
Sin módulo registrado, el equipo muestra su ficha educativa.

## Extender el escenario

Para agregar un equipo: definir geometría/colisión en `world.js`, modelo en
`art/ship.js`, descripción con fuente en `stationDescriptions.js`, y regenerar
assets. Compartir dimensiones entre collider y objeto. Los objetos decorativos
altos próximos a zonas transitables deben exportarse como props con profundidad.

Los GLB guardan modelos editables con sus piezas, no un rig esquelético. Las poses
de los personajes se calculan en `art/models.js`, y sus animaciones se exportan en
atlas. Es posible sustituir un modelo por un GLB externo respetando cámara y anclaje.

## Límites actuales

No hay niveles activos, progreso persistente ni datos en tiempo real. La nave es
conceptual. El fondo no es una fotografía NASA. El anterior prototipo de lanzamiento
permanece en sus archivos y pruebas, desconectado de la experiencia actual.
