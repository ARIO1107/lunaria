import { useEffect, useRef, useState } from 'react';
import { version } from '../../package.json';
import { levels } from '../data/levelDefinitions.js';
import CrewGallery from './CrewGallery.jsx';
import Modal from './Modal.jsx';
import { playSound } from '../audio/audioManager.js';

const media = import.meta.env.BASE_URL + 'assets/menu/';
const lunarImage = new URL(media + 'lunar.png', document.baseURI).href;
const icons = {
  play: 'M7 4l14 8-14 8z',
  resume: 'M4 3h13l3 3v15H4z M8 3v6h8V3 M8 21v-8h8v8',
  missions: 'M8 5h13v3H8z M8 11h13v3H8z M8 17h13v3H8z M3 6h1m-1 6h1m-1 6h1',
  settings: 'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3m0-14-3 3m-8 8-3 3 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  crew: 'M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20v-2a6 6 0 0 1 12 0v2z M16 6a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5v1',
  credits: 'M7 3h10v6a5 5 0 0 1-10 0z M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4m-5 3v6m-5 1h10',
  exit: 'M10 3H4v18h6m-1-9h12m-5-5 5 5-5 5',
  orbit: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M19 5c3-1 5 0 3 3-3 5-11 10-17 12-5 2-5-1-1-5m16-13v4m-2-2h4',
};

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill={name === 'play' ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
}

function MissionDiagram() {
  return <svg className="terminal-diagram" viewBox="0 0 360 112" role="img" aria-label="Esquema de una nave modular con paneles solares">
    <defs>
      <pattern id="ship-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0v16" fill="none" stroke="currentColor" strokeOpacity=".14" /></pattern>
    </defs>
    <path fill="url(#ship-grid)" d="M0 0h360v112H0z" />
    <g fill="none" stroke="currentColor" strokeWidth="1.15" transform="rotate(-8 180 58)">
      <path d="M24 59l17-11h57l10 6h30l8-12 17-8h91l17 10 46 3 20 12-20 12h-46l-17 10h-91l-17-8-8-12h-30l-10 6H41z" />
      <path d="M24 59h313M41 48v19m48-19v19m10-18v17m11-12v7m19-7v7m34-27-7 11v25l7 11m6-47v47m75-47v47m10-47v47m17-37v27m14-25v25m23-23v23M174 43h66l7 5v20l-7 5h-66l-8-6V50z" />
      <path d="M177 48h28v7h-28zm35 0h22v7h-22zm-35 13h12m4 0h15m4 0h22M54 52h31m-31 11h31m211-12h16m-16 15h16" />
      <g id="solar-panels"><path d="M97 15h34v27H97zM97 73h34v27H97zM113 42v12m0 8v11M102 15v27m11-27v27m12-27v27M102 73v27m11-27v27m12-27v27M97 24h34m-34 9h34M97 82h34m-34 9h34" /></g>
      <use href="#solar-panels" x="164" />
      <path strokeOpacity=".4" strokeDasharray="3 4" d="M12 59h340M74 9h217M74 105h217" />
    </g>
  </svg>;
}

function Settings({ settings, onSettings }) {
  const [full, setFull] = useState(() => Boolean(document.fullscreenElement));
  const [message, setMessage] = useState('');
  useEffect(() => {
    function sync() { setFull(Boolean(document.fullscreenElement)); }
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setMessage('');
    } catch {
      setMessage('El navegador no pudo cambiar a pantalla completa.');
    }
  }

  return <div className="terminal-content">
    <label className="terminal-setting" htmlFor="master-volume">Volumen general <output>{settings.volume} %</output></label>
    <input id="master-volume" type="range" min="0" max="100" value={settings.volume}
      onChange={event => onSettings({ ...settings, volume: Number(event.target.value) })} />
    <p className="terminal-muted">Los efectos suenan después del primer clic. El volumen y el silencio se guardan en este navegador. La cinemática no incluye voces grabadas: los diálogos van en subtítulos.</p>
    <label className="terminal-setting" htmlFor="graphics-quality">Gráficos de la cinemática</label>
    <select id="graphics-quality" value={settings.graphics || 'alto'} onChange={event => onSettings({ ...settings, graphics: event.target.value })}>
      <option value="alto">Alto</option>
      <option value="ajustado">Ajustado</option>
    </select>
    <p className="terminal-muted">Música: todavía no se incluye una pista; esta opción se activará cuando exista.</p>
    <label className="terminal-setting"><span>Silenciar efectos</span>
      <input type="checkbox" checked={settings.soundEnabled === false}
        onChange={event => onSettings({ ...settings, soundEnabled: !event.target.checked })} />
    </label>
    <label className="terminal-setting"><span>Reducir animaciones</span>
      <input type="checkbox" checked={settings.reducedMotion}
        onChange={event => onSettings({ ...settings, reducedMotion: event.target.checked })} />
    </label>
    <button className="terminal-action" onClick={toggleFullscreen} disabled={!document.fullscreenEnabled}>
      {full ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
    </button>
    {message && <p role="status">{message}</p>}
    <h3>Controles</h3>
    <p>Menú: ↑ y ↓ para navegar, Enter para seleccionar, Escape para volver.</p>
    <p>Cubierta: WASD o flechas para moverte, E o Espacio para inspeccionar. En pantallas táctiles puedes usar los botones del mapa.</p>
  </div>;
}

const options = [
  ['play', 'Jugar'], ['resume', 'Continuar'], ['missions', 'Seleccionar misión'],
  ['settings', 'Configuración'], ['crew', 'La tripulación'], ['credits', 'Créditos'], ['exit', 'Salir'],
];

function LevelSelect({ progress, onStartLevel }) {
  const [demo, setDemo] = useState(false);
  const done = progress?.completedLevels ?? [];
  return <div className="terminal-content">
    <p>Los niveles se abren en orden. El modo demostración permite saltar para una prueba y queda marcado en la partida.</p>
    <label className="terminal-setting"><span>Modo demostración</span>
      <input type="checkbox" checked={demo} onChange={event => setDemo(event.target.checked)} />
    </label>
    <ul className="terminal-cards">
      {levels.map(level => {
        const unlocked = level.id === 1 || done.includes(level.id - 1);
        const complete = done.includes(level.id);
        const available = unlocked || demo;
        const status = complete ? 'completed' : unlocked ? 'available' : 'blocked';
        return <li key={level.id} data-status={status}>
          <h3>Nivel {level.id}: {level.title}</h3>
          <p>{complete ? 'Completada' : unlocked ? 'Disponible' : 'Bloqueado'}</p>
          {available && <button className="terminal-action" onClick={() => onStartLevel(level.id, demo && !unlocked)}>{complete ? 'Repetir nivel' : level.id === 6 ? 'Abrir operaciones' : 'Jugar este nivel'}</button>}
        </li>;
      })}
    </ul>
  </div>;
}

export default function MainMenu({ progress, settings, onSettings, onStart, onStartLevel }) {
  const [selected, setSelected] = useState(0);
  const [panel, setPanel] = useState(null);
  const buttons = useRef([]);
  const canResume = Boolean(progress);

  useEffect(() => {
    if (panel) return;
    function navigate(event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
          event.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (event.key === 'Enter' && (event.target === document.body || event.target === document.documentElement)) {
        event.preventDefault();
        buttons.current[selected]?.click();
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      let next = (selected + step + options.length) % options.length;
      if (next === 1 && !canResume) next += step;
      setSelected(next);
      buttons.current[next]?.focus();
    }
    window.addEventListener('keydown', navigate);
    return () => window.removeEventListener('keydown', navigate);
  }, [selected, panel, canResume]);

  function choose(id) {
    playSound('click');
    if (id === 'play') {
      if (progress) setPanel('overwrite');
      else onStart(false);
      return;
    }
    if (id === 'resume') onStart(true);
    else setPanel(id);
  }

  const close = () => { playSound('close'); setPanel(null); };
  const title = panel === 'overwrite' ? 'Nueva partida' : options.find(([id]) => id === panel)?.[1];

  return <main className="terminal-menu" style={{ '--lunar-image': 'url("' + lunarImage + '")' }}>
    <div className="terminal-frame" aria-hidden="true" />
    <span className="terminal-version">v{version}</span>
    <span className="terminal-status"><i aria-hidden="true" />Sistemas en línea</span>
    <div className="terminal-layout">
      <header className="terminal-header">
        <h1 className="terminal-logo" role="img" aria-label="Lunaria">
          <span className="visually-hidden">Lunaria</span>
          <span className="terminal-logo-mark"><img src={media + 'logo.jpg'} alt="" /></span>
          <span className="terminal-logo-word"><img src={media + 'logo.jpg'} alt="" /></span>
        </h1>
        <p className="terminal-tagline"><span>&gt; Tu aventura comienza más allá de la Tierra</span></p>
      </header>
      <nav className="terminal-nav" aria-label="Menú principal">
        {options.map(([id, label], index) => <button type="button" key={id}
          ref={element => { buttons.current[index] = element; }}
          className="terminal-option" data-selected={selected === index}
          aria-describedby={id === 'resume' && !canResume ? 'terminal-no-save' : undefined}
          disabled={id === 'resume' && !canResume}
          onFocus={() => setSelected(index)} onClick={event => { event.currentTarget.focus(); choose(id); }}>
          <Icon name={id} /><span>{label}</span>
          {id === 'resume' && !canResume && <small id="terminal-no-save">Sin partida</small>}
        </button>)}
      </nav>
      <aside className="terminal-mission" aria-labelledby="terminal-mission-title">
        <h2 id="terminal-mission-title"><span>&gt; MISIÓN</span></h2>
        <div className="terminal-mission-body">
          <p>Simulador de misiones espaciales para astronautas junior.</p>
          <p>Explora, aprende, gestiona recursos y completa desafíos más allá de la Tierra.</p>
          <MissionDiagram />
        </div>
      </aside>
    </div>
    <footer className="terminal-footer">
      <span className="terminal-event"><Icon name="orbit" /> NASA Space Apps Challenge 2026</span>
      <div className="terminal-keys">
        <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
        <span><kbd>Enter</kbd> Seleccionar</span>
        <span><kbd>Esc</kbd> Atrás</span>
      </div>
    </footer>
    {panel && <Modal title={title} onClose={close} wide={panel === 'crew' || panel === 'missions'} className="terminal-dialog">
      {panel === 'crew' && <CrewGallery />}
      {panel === 'settings' && <Settings settings={settings} onSettings={onSettings} />}
      {panel === 'missions' && <LevelSelect progress={progress} onStartLevel={onStartLevel} />}
      {panel === 'overwrite' && <div className="terminal-content">
        <h3>Hay una expedición guardada</h3>
        <p>Jugar de nuevo sustituye esa partida en este navegador. Continuar la conserva.</p>
        <button className="terminal-action" onClick={() => onStart(false)}>Empezar de nuevo</button>
        <button className="terminal-action" onClick={close}>Conservar la partida</button>
      </div>}
      {panel === 'credits' && <div className="terminal-content">
        <h3>Lunaria</h3>
        <p>Simulador educativo con arte original. Desarrollo registrado en el repositorio por el equipo de Lunaria, con contribuciones de José Ario Gutiérrez Blanco (ARIO1107).</p>
        <p>Las fichas de la cubierta enlazan a material educativo de NASA.</p>
        <a href="https://github.com/ARIO1107/lunaria" target="_blank" rel="noreferrer">Ver repositorio y contribuciones</a>
      </div>}
      {panel === 'exit' && <div className="terminal-content">
        <h3>Fin de la transmisión</h3>
        <p>Gracias por explorar con Lunaria. ¡Hasta la próxima, comandante!</p>
        <button className="terminal-action" onClick={close}>Volver al menú</button>
      </div>}
    </Modal>}
  </main>;
}

