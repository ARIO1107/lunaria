import { useCallback, useRef, useState } from 'react';
import ShipCanvas from './ShipCanvas.jsx';
import Modal from './Modal.jsx';
import { missions } from '../game/missionRegistry.js';
import { assetUrl } from '../game/assets.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { NASA_SOURCES } from '../data/nasaTelemetry.js';

export default function Game() {
  const [near, setNear] = useState(null);
  const [room, setRoom] = useState('Sistemas y soporte vital');
  const [modal, setModal] = useState(null);
  const [zoom, setZoom] = useState(1.15);
  const inputRef = useRef({ x: 0, y: 0 });
  const interact = useCallback(station => {
    inputRef.current = { x: 0, y: 0 };
    setModal({ type: 'station', station });
  }, []);
  const close = () => {
    setModal(null);
    requestAnimationFrame(() => document.querySelector('.ship-canvas')?.focus());
  };
  const direction = (e, x, y) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); inputRef.current = { x, y }; };
  const release = () => { inputRef.current = { x: 0, y: 0 }; };
  const module = modal?.type === 'station' ? missions.getForStation(modal.station.id) : null;
  const Mission = module?.Component;
  const description = modal?.station ? stationDescriptions[modal.station.id] : null;
  const controls = <div className="touch-controls" aria-label="Controles táctiles de movimiento">
    {[['↑', 0, -1, 'arriba'], ['←', -1, 0, 'izquierda'], ['↓', 0, 1, 'abajo'], ['→', 1, 0, 'derecha']].map(([label, x, y, name]) => <button key={name} aria-label={`Mover ${name}`} onPointerDown={e => direction(e, x, y)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{label}</button>)}
    <button disabled={!near} onClick={() => near && interact(near)}>Inspeccionar</button>
  </div>;

  return <div className="app-shell exploration-shell">
    <header className="app-header">
      <div className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M29 5A16 16 0 1 0 35 28 15 15 0 0 1 29 5Z" fill="currentColor" /></svg><div><h1>Lunaria</h1><span>Junior astronaut program</span></div></div>
      <div className="deck-mode"><i className="status-light" /> Cubierta de exploración</div>
      <nav aria-label="Información del proyecto"><button className="quiet-button" onClick={() => setModal({ type: 'crew' })}>La tripulación</button><button className="secondary-button" onClick={() => setModal({ type: 'sources' })}>Bitácora</button></nav>
    </header>
    <main>
      <div className="deck-heading"><div><h2>Bienvenido a bordo.</h2><p>Un pequeño astronauta. Un gran universo por descubrir.</p></div><span className="development-note">Entorno de desarrollo · Misiones por definir</span></div>
      <div className="game-layout exploration-layout">
        <section className="ship-section" aria-label="Exploración de la nave">
          <div className="map-toolbar"><span><i className="status-light" /> {room}</span><div className="zoom-controls"><button aria-label="Alejar cámara" disabled={zoom <= .8} onClick={() => setZoom(z => Math.max(.8, +(z - .15).toFixed(2)))}>−</button><span>{Math.round(zoom * 100)} %</span><button aria-label="Acercar cámara" disabled={zoom >= 1.75} onClick={() => setZoom(z => Math.min(1.75, +(z + .15).toFixed(2)))}>+</button></div></div>
          <ShipCanvas paused={Boolean(modal)} onNear={setNear} onRoom={setRoom} onInteract={interact} inputRef={inputRef} zoom={zoom} />
          <div className="map-footer"><span><kbd>W A S D</kbd> / Flechas · Moverse</span><span><kbd>E</kbd> / Espacio · Inspeccionar</span></div>
          {controls}
        </section>
        <aside className="mission-sidebar exploration-sidebar">
          <section className="crew-card"><div className="section-heading"><h3>Tu tripulación</h3><span>A bordo</span></div>
            <button className="portrait-button" onClick={() => setModal({ type: 'crew' })} aria-label="Conocer al astronauta y a Titus"><img src={assetUrl('astronaut-portrait.png')} alt="Astronauta con traje marfil, visor azul y bandas naranjas" /><img src={assetUrl('titus-portrait.png')} alt="Titus, robot grafito con ojos luminosos" /></button>
            <strong>Comandante & Titus</strong><p>Explora a tu ritmo. Tu copiloto te acompaña.</p>
          </section>
          <section className="station-card"><div className="section-heading"><h3>{near ? stationDescriptions[near.id].role : 'Conoce tu nave'}</h3></div>
            <p>{near ? stationDescriptions[near.id].text : 'Recorre la esclusa, el módulo de sistemas y la cabina. Acércate a los equipos para descubrir su función.'}</p>
            <button className="primary-button w-full" disabled={!near} onClick={() => near && interact(near)}>{near ? 'Inspeccionar equipo' : 'Acércate a un equipo'} <kbd>E</kbd></button>
          </section>
          <div className="deck-key"><span><i /> Esclusa de aire</span><span><i /> Sistemas y soporte vital</span><span><i /> Cabina de mando</span></div>
        </aside>
      </div>
      <section className="crew-radio" aria-label="Radio de Titus"><img src={assetUrl('titus-portrait.png')} alt="" /><div><strong>Titus <span>Canal de tripulación</span></strong><p role="status">{near ? `Estamos junto a ${near.name.toLowerCase()}. Pulsa E y te cuento para qué sirve.` : '¡Aquí Titus! La nave es nuestra casa en el espacio. Explora sus tres módulos conmigo: cada equipo tiene una función y cada sistema está conectado con los demás.'}</p></div><span className="radio-bars" aria-hidden="true">▂ ▅ ▃ ▆ ▂</span></section>
      <footer className="app-footer"><span>Lunaria · Laboratorio de exploración</span><span>Arte 3D original prerenderizado · Escenario conceptual <button className="text-button" onClick={() => setModal({ type: 'sources' })}>Referencias</button></span></footer>
    </main>

    {modal?.type === 'crew' && <Modal title="La tripulación de Lunaria" wide onClose={close}><div className="crew-gallery">
      <article><div className="portrait-stage"><img src={assetUrl('astronaut-portrait.png')} alt="Modelo del astronauta, vista de tres cuartos" /></div><h3>El comandante</h3><p>Traje marfil, visor azul y mochila de soporte vital. Ocho orientaciones y un ciclo de marcha para explorar la cubierta.</p><a href={assetUrl('astronaut-portrait.png')} download="lunaria-astronauta.png">Descargar imagen PNG</a></article>
      <article><div className="portrait-stage"><img src={assetUrl('titus-portrait.png')} alt="Modelo de Titus con cabeza redondeada y pantalla facial" /></div><h3>Titus</h3><p>Un pequeño robot flotante. Su pantalla expresa atención y alerta; te sigue mientras descubres cómo funciona la nave.</p><a href={assetUrl('titus-portrait.png')} download="lunaria-titus.png">Descargar imagen PNG</a></article>
      <p className="gallery-note">Modelos originales inspirados en tus referencias. Los archivos editables GLB y el generador están en la carpeta <code>art/</code> del proyecto.</p>
    </div></Modal>}
    {modal?.type === 'station' && <Modal title={module?.title || modal.station.name} wide={Boolean(module)} onClose={close}>
      {Mission ? <Mission station={modal.station} onClose={close} /> : <div className="source-content station-details"><span className="station-id">Equipo / {modal.station.id}</span><h3>{description.role}</h3><p>{description.text}</p><div className="science-note"><strong>Una idea importante</strong><p>{description.fact}</p><a href={description.source} target="_blank" rel="noreferrer">Consultar referencia NASA ↗</a></div><p className="mission-placeholder">Punto de interacción preparado. La misión de este equipo se conectará cuando esté definida.</p><button className="secondary-button" onClick={close}>Seguir explorando</button></div>}
    </Modal>}
    {modal?.type === 'sources' && <Modal title="Bitácora de Lunaria" onClose={close}><div className="source-content"><h3>Primero, nuestra nave</h3><p>Estamos construyendo el escenario y la tripulación. Los niveles todavía están por escribir. Por ahora puedes caminar, conocer los equipos y explorar el interior.</p><h3>Diseño y ciencia</h3><p>La nave es conceptual: no reproduce la distribución ni las ventanas de una cápsula Apolo. Titus y el astronauta son personajes originales; el fondo es una ilustración del espacio.</p><p>Los futuros retos usarán problemas y datos documentados, explicados con claridad para niños de 7–12 años. Las simplificaciones de juego se identificarán como tales.</p><ul>{Object.values(NASA_SOURCES).map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></li>)}</ul><h3>Controles</h3><p>WASD o flechas: caminar. E o Espacio: inspeccionar un equipo cercano. Los botones + y − ajustan la cámara. En móvil tienes controles bajo la nave.</p></div></Modal>}
  </div>;
}
