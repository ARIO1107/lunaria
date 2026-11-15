import { useCallback, useEffect, useRef, useState } from 'react';
import ShipCanvas from './ShipCanvas.jsx';
import SurfaceCanvas from './SurfaceCanvas.jsx';
import Modal from './Modal.jsx';
import CrewGallery from './CrewGallery.jsx';
import CinematicPlayer from '../cinematic/CinematicPlayer.jsx';
import TitusAssistant, { ScienceFact, ScienceLogbook } from './TitusAssistant.jsx';
import StationMission from '../missions/StationMission.jsx';
import { roomAt, STATIONS } from '../game/world.js';
import { registerCampaignStations } from '../game/missionRegistry.js';
import { levelById, nextObjective } from '../data/levelDefinitions.js';
import { factsForLevel } from '../data/scienceFacts.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { operationsActions } from '../game/resourceEngine.js';
import { assetUrl } from '../game/assets.js';
import { version } from '../../package.json';
import { playSound, startGameBed, stopGameBed, suspendAudio } from '../audio/audioManager.js';
import { titusAtStation } from '../game/titusGuide.js';
import { bubbleSpeech } from '../game/titusBubbles.js';
import FirstPersonBay from '../view/FirstPersonBay.jsx';

registerCampaignStations(StationMission);

const sampleNames = { regolith: 'Regolito', basalt: 'Basalto', highland: 'Tierras altas' };

function Glyph({ name }) {
  const pen = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return <svg className="hud-glyph" viewBox="0 0 24 24" aria-hidden="true">
    {name === 'menu' && <path {...pen} d="M4 7h16M4 12h16M4 17h16" />}
    {name === 'pause' && <path {...pen} d="M8 5v14M16 5v14" />}
    {name === 'sound' && <path {...pen} d="M4 10h3.5L12 6v12l-4.5-4H4zM16 9.5a4 4 0 0 1 0 5" />}
    {name === 'muted' && <path {...pen} d="M4 10h3.5L12 6v12l-4.5-4H4zM16 10l4 4M20 10l-4 4" />}
    {name === 'book' && <path {...pen} d="M5 5.5h10.5A2.5 2.5 0 0 1 18 8v11H8.2A3.2 3.2 0 0 0 5 22.2zM5 5.5v14" />}
    {name === 'crew' && <><circle {...pen} cx="12" cy="8" r="3" /><path {...pen} d="M6.5 19c1.2-2.6 2.8-3.8 5.5-3.8s4.3 1.2 5.5 3.8" /></>}
  </svg>;
}

function Meter({ label, value, mark }) {
  const shown = Math.round(Number(value) || 0);
  const width = Math.max(0, Math.min(100, shown));
  return <div className="hud-meter">
    <span className="hud-meter-name"><i aria-hidden="true">{mark}</i>{label}</span>
    <strong>{shown} %</strong>
    <div className="hud-meter-track" role="meter" aria-label={label} aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}><i style={{ width: width + '%' }} /></div>
  </div>;
}

function Resources({ campaign }) {
  const { ship, lander, base } = campaign.resources;
  if (campaign.currentLevel >= 5) {
    return <div className="hud-meters" aria-label="Recursos de la estación, en unidades simuladas">
      <Meter mark="⚡" label="Energía" value={base.energy} />
      <Meter mark="O₂" label="Oxígeno" value={base.oxygen} />
      <Meter mark="💧" label="Agua" value={base.water} />
      <p className="hud-meter-note">Refugio {base.habitatOperational ? 'listo' : 'pendiente'} · Ciencia {base.science} · Ciclo {campaign.cycle}</p>
    </div>;
  }
  if (campaign.currentLevel === 4) {
    return <div className="hud-meters" aria-label="Recursos del descenso, en unidades simuladas">
      <Meter mark="⛽" label="Combustible del módulo" value={lander.fuel} />
      <Meter mark="⛽" label="Combustible de la nave" value={ship.fuel} />
      <p className="hud-meter-note">Zona {campaign.site}</p>
    </div>;
  }
  return <div className="hud-meters" aria-label="Recursos de la nave, en unidades simuladas">
    <Meter mark="⚡" label="Energía" value={ship.energy} />
    <Meter mark="O₂" label="Oxígeno" value={ship.oxygen} />
    <Meter mark="⛽" label="Combustible" value={ship.fuel} />
  </div>;
}

function deckLocation(campaign, onSurface) {
  if (onSurface) return 'Superficie lunar';
  if (campaign.currentLevel === 1) return 'Cubierta de la nave · En tierra (Base de lanzamiento)';
  return 'Cubierta de la nave · En el espacio';
}

function Story({ kicker, title, children, actions }) {
  return <main className="story-screen"><section className="story-card">
    <p className="story-kicker">{kicker}</p><h1>{title}</h1>{children}<div className="beta-actions">{actions}</div>
  </section></main>;
}

function Operations({ campaign, dispatch }) {
  const light = campaign.cycle % 2 !== 0;
  return <section className="station-card hud-panel hud-frame"><div className="section-heading"><h3>Turno de operaciones</h3><span>Ciclo {campaign.cycle}</span></div>
    <p>{light ? 'Hay iluminación en este turno. Los paneles pueden recargar.' : 'Turno de sombra. Los paneles no generan electricidad.'} Los números son unidades de juego, no mediciones de una misión.</p>
    <div className="op-grid">
      {Object.entries(operationsActions).map(([name, action]) => <button key={name} className="secondary-button" disabled={campaign.usedActions.includes(name)}
        onClick={() => dispatch({ type: 'operation', name })}>{action.title}</button>)}
      <button className="primary-button" onClick={() => dispatch({ type: 'operation', name: 'cycle' })}>Cerrar ciclo</button>
    </div>
    <p>Actividades {campaign.activities}/3 · ciclos cerrados {Math.max(0, campaign.cycle - 1)}/3. Cada botón explica su costo al usarlo y solo cuenta una vez por ciclo.</p>
  </section>;
}

export default function CampaignScreen({ campaign, dispatch, settings, onSettings, onExit }) {
  const level = levelById(campaign.currentLevel);
  const task = nextObjective(campaign);
  const onSurface = campaign.currentLevel > 4 || (campaign.currentLevel === 4 && campaign.completedObjectives.includes('landing'));
  const emergency = campaign.currentLevel === 3 && campaign.phase === 'active';
  const solarAlert = campaign.currentLevel === 6 && campaign.radiation && !campaign.sheltered;
  const shipPos = useRef(campaign.position);
  const surfacePos = useRef(campaign.surfacePosition);
  const zoomRef = useRef(campaign.zoom);
  const inputRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(campaign.zoom);
  const [room, setRoom] = useState(() => onSurface ? 'Puesto avanzado · Región polar ficticia' : roomAt(campaign.position));
  const [near, setNear] = useState(null);
  const [modal, setModal] = useState(null);
  const [bubbleTick, setBubbleTick] = useState(0);
  const [moment, setMoment] = useState('walk');
  const seenGoals = useRef(campaign.completedObjectives.length);
  const soundedGoals = useRef(campaign.completedObjectives.length);
  const heardSpeech = useRef('');
  const heardError = useRef(null);
  const heardSamples = useRef(campaign.collectedSamples.length);
  const errorsReady = useRef(false);
  const alarmed = useRef(false);
  const reportRoom = useCallback(name => setRoom(name), []);
  const targetStation = STATIONS.find(station => station.id === task?.stationId);
  const guidePoint = targetStation
    ? { x: targetStation.x + targetStation.w / 2, y: targetStation.y + targetStation.h / 2 }
    : null;

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => {
    const count = campaign.completedObjectives.length;
    if (count <= seenGoals.current) return undefined;
    const previous = seenGoals.current;
    seenGoals.current = count;
    if (count > soundedGoals.current) {
      soundedGoals.current = count;
      playSound('success');
    }
    setMoment('done');
    const timer = window.setTimeout(() => setMoment('walk'), 9000);
    return () => {
      window.clearTimeout(timer);
      // A cancelled run must be able to arm the fact again. Loading a save does not enter this branch.
      seenGoals.current = previous;
    };
  }, [campaign.completedObjectives.length]);
  useEffect(() => {
    if (campaign.phase === 'complete') playSound('levelComplete');
  }, [campaign.phase, campaign.currentLevel]);
  useEffect(() => {
    const quiet = campaign.phase !== 'active' || settings.soundEnabled === false || modal?.type === 'pause';
    if (quiet) stopGameBed();
    else startGameBed();
    return () => stopGameBed();
  }, [campaign.phase, settings.soundEnabled, modal?.type]);
  useEffect(() => {
    const error = campaign.flags?.lastError || null;
    if (errorsReady.current && error && error !== heardError.current) playSound('error');
    heardError.current = error;
    errorsReady.current = true;
  }, [campaign.flags?.lastError]);
  useEffect(() => {
    const count = campaign.collectedSamples.length;
    if (count > heardSamples.current) playSound('collect');
    heardSamples.current = count;
  }, [campaign.collectedSamples.length]);
  useEffect(() => {
    if (emergency && !alarmed.current) { alarmed.current = true; playSound('alarm'); }
  }, [emergency]);
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'position', position: shipPos.current, surfacePosition: surfacePos.current, zoom: zoomRef.current }), 1500);
    return () => window.clearInterval(timer);
  }, [dispatch]);
  useEffect(() => { setBubbleTick(0); }, [task?.id, campaign.currentLevel]);
  useEffect(() => {
    if (campaign.phase !== 'active') return undefined;
    const timer = window.setInterval(() => setBubbleTick(value => value + 1), settings.reducedMotion ? 8000 : 6500);
    return () => window.clearInterval(timer);
  }, [campaign.phase, settings.reducedMotion, task?.id, campaign.currentLevel]);
  const speech = campaign.phase === 'active' && !modal
    ? bubbleSpeech(campaign.currentLevel, task, moment === 'done' ? campaign.completedObjectives.length : bubbleTick, moment)
    : '';
  useEffect(() => {
    if (!speech || speech === heardSpeech.current) return;
    heardSpeech.current = speech;
    playSound('robot');
  }, [speech]);
  useEffect(() => {
    if (campaign.phase !== 'active' || !task || near?.id !== task.stationId) return;
    dispatch({ type: 'guide', id: 'at-' + task.id, message: titusAtStation(task) });
  }, [campaign.phase, task, near?.id, dispatch]);
  useEffect(() => {
    if (campaign.phase !== 'active' || modal) return;
    function onKey(event) {
      if (event.key === 'Escape' && !event.repeat && !event.defaultPrevented) setModal({ type: 'pause' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [campaign.phase, modal]);

  function leave() {
    dispatch({ type: 'position', position: shipPos.current, surfacePosition: surfacePos.current, zoom: zoomRef.current });
    onExit();
  }
  function close() {
    setModal(null);
    requestAnimationFrame(() => document.querySelector('.ship-canvas')?.focus());
  }
  function openStation(station) {
    playSound('open');
    inputRef.current = { x: 0, y: 0 };
    setModal({ type: 'station', station });
  }
  function changeZoom(delta) {
    playSound('click');
    setZoom(value => {
      const next = Math.min(1.75, Math.max(.8, +(value + delta).toFixed(2)));
      zoomRef.current = next;
      return next;
    });
  }
  const direction = (event, x, y) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputRef.current = { x, y }; };
  const release = () => { inputRef.current = { x: 0, y: 0 }; };

  if ((campaign.phase === 'cinematic' || campaign.phase === 'launchCinematic') && campaign.currentLevel === 1) {
    const launchFilm = campaign.phase === 'launchCinematic';
    return <CinematicPlayer sequence={launchFilm ? 'launch' : 'opening'} onComplete={() => dispatch({ type: launchFilm ? 'launchCinematicDone' : 'cinematicDone' })} reducedMotion={settings.reducedMotion}
      volume={settings.volume} soundEnabled={settings.soundEnabled !== false} quality={settings.graphics || 'alto'} />;
  }
  if (campaign.phase === 'briefing') {
    return <Story kicker={'Nivel ' + level.id} title={level.title} actions={<>
      <button className="primary-button" onClick={() => { playSound('open'); dispatch({ type: 'begin' }); }}>Comenzar misión</button>
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{level.subtitle}</p><p>{level.intro}</p>
      {campaign.flags.demo && <p className="demo-flag">Modo demostración: este salto no forma parte de la secuencia normal.</p>}
    </Story>;
  }
  if (campaign.phase === 'complete') {
    const fact = factsForLevel(level.id)[0];
    return <Story kicker="Misión completada" title={level.title} actions={<>
      {campaign.currentLevel < 6 && <button className="primary-button" onClick={() => dispatch({ type: 'advance' })}>Continuar al siguiente nivel</button>}
      {campaign.currentLevel === 6 && <button className="primary-button" onClick={() => dispatch({ type: 'continueOps' })}>Seguir explorando</button>}
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{level.summary}</p>
      <ScienceFact fact={fact} />
      {campaign.currentLevel === 6 && <p>Decisiones de este tramo: {campaign.decisions.slice(-6).join(' · ') || 'operaciones de la estación'}.</p>}
    </Story>;
  }
  if (campaign.phase === 'failed') {
    return <Story kicker="Intento interrumpido" title="Titus guarda el punto de control" actions={<>
      <button className="primary-button" onClick={() => dispatch({ type: 'retry' })}>Reintentar</button>
      <button className="secondary-button" onClick={leave}>Menú principal</button>
    </>}>
      <p>{campaign.message || 'Un recurso esencial se agotó. Volvemos al inicio de este nivel, sin repetir los anteriores.'}</p>
    </Story>;
  }

  const description = near ? stationDescriptions[near.id] : null;
  const missionTotal = level.tasks.length + (level.id === 6 ? 2 : 0);
  const missionDone = level.tasks.filter(item => campaign.completedObjectives.includes(item.id)).length
    + (level.id === 6 ? (campaign.cycle >= 4 ? 1 : 0) + (campaign.activities >= 3 ? 1 : 0) : 0);
  const missionPercent = missionTotal === 0 ? 0 : Math.round((missionDone / missionTotal) * 100);
  const soundOff = settings.soundEnabled === false;
  const guideLine = campaign.message || (task ? task.prompt : 'Explora con calma. Cada estación explica su función.');
  const guideBody = guideLine.replace(/^Titus:\s*/, '');
  return <div className={'app-shell exploration-shell hud-deck' + (emergency ? ' emergency-deck' : '')}>
    <header className="app-header hud-frame">
      <div className="brand">
        <svg className="hud-logo" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="20" cy="20" rx="16" ry="6.5" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-32 20 20)" />
          <circle cx="33.2" cy="13.2" r="2.1" fill="currentColor" />
        </svg>
        <h1>Lunaria</h1>
      </div>
      <p className="hud-level">Nivel {level.id}: {level.title}</p>
      <div className="deck-mode">{campaign.flags.demo && <span className="demo-flag">Demostración · </span>}{deckLocation(campaign, onSurface)}</div>
      <nav aria-label="Controles de la misión">
        <button className="quiet-button hud-nav" onClick={leave}><Glyph name="menu" />Menú<span className="hud-sr"> principal</span></button>
        <button className="quiet-button hud-nav" onClick={() => { playSound('close'); setModal({ type: 'pause' }); }}><Glyph name="pause" />Pausa</button>
        <button className="quiet-button hud-nav" onClick={() => onSettings({ ...settings, soundEnabled: soundOff })}><Glyph name={soundOff ? 'muted' : 'sound'} />{soundOff ? 'Activar sonido' : 'Silenciar'}</button>
        <button className="quiet-button hud-nav" onClick={() => setModal({ type: 'log' })}><Glyph name="book" />Bitácora</button>
        <button className="quiet-button hud-nav" onClick={() => setModal({ type: 'crew' })}><Glyph name="crew" />La tripulación</button>
      </nav>
    </header>
    {(emergency || solarAlert) && <p className="emergency-banner" role="alert">{emergency
      ? 'Emergencia eléctrica ficticia. Titus: la señal desconocida no explica esta avería. Repara, protege el aire y prepara el frenado orbital.'
      : 'Ejercicio de meteorología espacial. No es una dosis calculada. Suspende las salidas, pulsa Preparar refugio y después cierra el ciclo.'}</p>}
    <main className="hud-main">
      <div className="game-layout exploration-layout">
        <aside className="hud-mission" aria-label="Misión">
          <section className="hud-panel hud-frame hud-brief">
            <p className="hud-kicker"><i aria-hidden="true" />Misión {String(level.id).padStart(2, '0')}</p>
            <h2>{task ? task.title : level.title}</h2>
            <p className="hud-copy">{task ? task.prompt : 'Objetivos de este tramo completados.'}</p>
          </section>
          <section className="station-card hud-panel hud-frame">
            <h3>{description?.role || (near ? near.name : 'Objetivos')}</h3>
            <ul className="objective-list">
              {level.tasks.map(item => <li key={item.id} data-state={campaign.completedObjectives.includes(item.id) ? 'done' : item.id === task?.id ? 'current' : 'waiting'}>
                <input type="checkbox" readOnly checked={campaign.completedObjectives.includes(item.id)} aria-label={item.title} />
                <span>{item.title}</span>
              </li>)}
              {campaign.currentLevel === 6 && <>
                <li data-state={campaign.cycle >= 4 ? 'done' : 'current'}><input type="checkbox" readOnly checked={campaign.cycle >= 4} aria-label="Tres ciclos" /><span>Cerrar tres ciclos</span></li>
                <li data-state={campaign.activities >= 3 ? 'done' : 'current'}><input type="checkbox" readOnly checked={campaign.activities >= 3} aria-label="Tres actividades" /><span>Tres actividades científicas o de mantenimiento</span></li>
              </>}
            </ul>
            <div className="hud-progress">
              <div><span>Progreso de la misión</span><strong>{missionPercent} %</strong></div>
              <div className="hud-progress-track" role="progressbar" aria-valuenow={missionPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la misión"><i style={{ width: missionPercent + '%' }} /></div>
            </div>
            <button className="primary-button hud-inspect" disabled={!near} onClick={() => near && openStation(near)}>{near ? 'Inspeccionar equipo' : 'Acércate a un equipo'} <kbd>E</kbd></button>
          </section>
          {campaign.currentLevel === 6 && <Operations campaign={campaign} dispatch={dispatch} />}
          {campaign.collectedSamples.length > 0 && <section className="station-card hud-panel hud-frame"><h3>Muestras</h3><ul className="objective-list">{campaign.collectedSamples.map(sample => <li key={sample.id}><span>{sampleNames[sample.id] || sample.id} · {sample.analyzed ? 'analizada' : 'pendiente'}</span></li>)}</ul></section>}
        </aside>
        <section className="ship-section hud-frame" aria-label={onSurface ? 'Superficie lunar' : 'Exploración de la nave'}>
          <div className="map-toolbar"><span><i className="status-light" /> {room}</span><div className="zoom-controls"><button aria-label="Alejar cámara" disabled={zoom <= .8} onClick={() => changeZoom(-.15)}>−</button><span>{Math.round(zoom * 100)} %</span><button aria-label="Acercar cámara" disabled={zoom >= 1.75} onClick={() => changeZoom(.15)}>+</button></div></div>
          {onSurface
            ? <SurfaceCanvas positionRef={surfacePos} reducedMotion={settings.reducedMotion} paused={Boolean(modal)} onNear={setNear} onRoom={reportRoom} onInteract={openStation} inputRef={inputRef} zoom={zoom} titusMood={solarAlert ? 'danger' : 'normal'} speech={speech} />
            : <ShipCanvas positionRef={shipPos} reducedMotion={settings.reducedMotion} paused={Boolean(modal)} onNear={setNear} onRoom={reportRoom} onInteract={openStation} inputRef={inputRef} zoom={zoom} titusMood={emergency ? 'danger' : undefined} emergency={emergency} grounded={campaign.currentLevel === 1} guidePoint={guidePoint} speech={speech} />}
          <div className="touch-controls" aria-label="Controles táctiles de movimiento">
            {[['↑', 0, -1, 'arriba'], ['←', -1, 0, 'izquierda'], ['↓', 0, 1, 'abajo'], ['→', 1, 0, 'derecha']].map(([label, x, y, name]) => <button key={name} aria-label={'Mover ' + name} onPointerDown={event => direction(event, x, y)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>{label}</button>)}
            <button disabled={!near} onClick={() => near && openStation(near)}>Inspeccionar</button>
          </div>
        </section>
        <aside className="mission-sidebar exploration-sidebar">
          <section className="hud-panel hud-frame hud-status" aria-label={campaign.currentLevel >= 5 || onSurface ? 'Estado de la estación' : 'Estado de la nave'}>
            <h3>{campaign.currentLevel >= 5 || onSurface ? 'Estado de la estación' : 'Estado de la nave'}</h3>
            <Resources campaign={campaign} />
          </section>
          <section className="crew-card hud-panel hud-frame">
            <h3>Titus{solarAlert || emergency ? <span>Atención</span> : null}</h3>
            <button className="portrait-button" onClick={() => setModal({ type: 'titus' })} aria-label="Preguntar a Titus"><img src={assetUrl('astronaut-portrait.png')} alt="" /><img src={assetUrl('titus-portrait.png')} alt="" /></button>
            <p><b>Titus: </b>{guideBody}</p>
          </section>
        </aside>
      </div>
    </main>
    <footer className="hud-footer">
      <span>v{version}</span>
      <span className="hud-online"><i className="status-light" />{emergency || solarAlert ? 'Alerta de sistemas' : 'Sistemas en línea'}</span>
      <div className="map-footer">
        <span className="hud-key"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Moverse</span></span>
        <span className="hud-key"><kbd>Flechas</kbd><span>Moverse</span></span>
        <span className="hud-key"><kbd>E</kbd><span>Inspeccionar</span></span>
        <span className="hud-key"><kbd>Espacio</kbd><span>Inspeccionar</span></span>
      </div>
    </footer>
    {modal?.type === 'station' && <Modal title={modal.station.name} wide className="fp-dialog" onClose={close}>
      <FirstPersonBay stationId={modal.station.id} vista={onSurface ? 'surface' : campaign.currentLevel === 1 ? 'pad' : 'space'} reduced={settings.reducedMotion} quality={settings.graphics || 'alto'} caption={campaign.message} />
      <StationMission station={modal.station} state={campaign} dispatch={dispatch} onClose={close} />
    </Modal>}
    {modal?.type === 'titus' && <Modal title="Titus" onClose={close}><TitusAssistant level={campaign.currentLevel} objective={task} station={near} emergency={emergency || solarAlert} discoveredFacts={campaign.discoveredFacts} onDiscover={id => dispatch({ type: 'discover', id })} /></Modal>}
    {modal?.type === 'log' && <Modal title="Bitácora científica" onClose={close}><ScienceLogbook discoveredFacts={campaign.discoveredFacts} /></Modal>}
    {modal?.type === 'crew' && <Modal title="La tripulación de Lunaria" wide onClose={close}><CrewGallery /></Modal>}
    {modal?.type === 'pause' && <Modal title="Pausa" onClose={() => { suspendAudio(); close(); }}><div className="source-content">
      <p>El movimiento y los minijuegos están detenidos. Los recursos no cambian mientras lees.</p>
      <button className="secondary-button" onClick={() => onSettings({ ...settings, soundEnabled: settings.soundEnabled === false })}>{settings.soundEnabled === false ? 'Activar sonido' : 'Silenciar'}</button>
      <p>Volumen guardado: {settings.volume} %. Cámbialo en Configuración del menú principal.</p>
      <button className="primary-button" onClick={leave}>Guardar y salir al menú</button>
    </div></Modal>}
  </div>;
}

