import { useEffect, useState } from 'react';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { cabinAir, coasHint, coasReady, loadsAfterCut, signalBand, SUPPLIES, supplyProblem } from '../game/shipTour.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

function Speech({ children }) {
  return <p className="eclss-speech" role="status"><b>Titus. </b>{children}</p>;
}
function Source({ id }) {
  const description = stationDescriptions[id];
  if (!description) return null;
  return <a href={description.source} target="_blank" rel="noreferrer">Consultar referencia NASA</a>;
}

export function CoasSight({ onAnswer }) {
  const [angle, setAngle] = useState(0);
  const ready = coasReady(angle);
  const turn = delta => setAngle(value => Math.max(0, Math.min(180, value + delta)));
  return <div className="tour">
    <Speech>{coasHint(angle)}</Speech>
    <div className="tour-sight" aria-hidden="true">
      <svg viewBox="0 0 240 240">
        <circle cx="120" cy="120" r="92" className="tour-well" />
        <path d="M179 50 A92 92 0 0 1 190 61" className="tour-arc" />
        <line x1="120" y1="120" x2="185" y2="55" className="tour-path" />
        <text x="146" y="46">camino</text>
        <g transform={'rotate(' + angle + ' 120 120)'}>
          <polygon points="120,42 110,124 130,124" className="tour-nose" />
        </g>
        <circle cx="120" cy="120" r="5" className="tour-hub" />
      </svg>
      <p>Proa {angle}° · arco verde de 40° a 50°. La línea «camino» no gira.</p>
    </div>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => turn(-5)}>Girar a la izquierda</button>
      <button className="secondary-button" onClick={() => turn(5)}>Girar a la derecha</button>
    </div>
    <label>Ajuste fino {angle}°
      <input type="range" aria-label="Orientación" min="0" max="180" value={angle} onChange={event => setAngle(Number(event.target.value))} />
    </label>
    <button className="primary-button" disabled={!ready} onClick={() => onAnswer(angle)}>Fijar orientación</button>
    <Source id="coas" />
  </div>;
}

export function SupplyLocker({ onAnswer }) {
  const [packed, setPacked] = useState([]);
  const [speech, setSpeech] = useState('Abre la taquilla. En la bolsa solo entran agua y alimentos, el botiquín, y las herramientas con el equipo científico.');
  function toggle(label) {
    const next = packed.includes(label) ? packed.filter(item => item !== label) : [...packed, label];
    setPacked(next);
    setSpeech(supplyProblem(next) || 'La bolsa está completa. Ciérrala.');
  }
  function closeBag() {
    const problem = supplyProblem(packed);
    setSpeech(problem || 'Bolsa lista. Esos son los suministros de emergencia.');
    if (!problem) onAnswer(packed);
  }
  return <div className="tour">
    <Speech>{speech}</Speech>
    <ul className="tour-shelf">
      {SUPPLIES.map(item => <li key={item.id}>
        <button type="button" className="secondary-button" aria-pressed={packed.includes(item.label)} onClick={() => toggle(item.label)}>{item.label}</button>
        <span>{item.note}{packed.includes(item.label) ? ' · en la bolsa' : ''}</span>
      </li>)}
    </ul>
    <button className="primary-button" onClick={closeBag}>Cerrar la bolsa</button>
    <Source id="suit" />
  </div>;
}

export function CabinAir({ onAnswer }) {
  const [open, setOpen] = useState(false);
  const [looked, setLooked] = useState(false);
  const air = cabinAir(open);
  const speech = looked && !open
    ? 'Mirar la presión no recarga el aire. Abre la reserva de oxígeno.'
    : air.line;
  return <div className="tour">
    <Speech>{speech}</Speech>
    <div className="tour-gauges">
      <div className="eclss-gauge"><b>{air.pressure}</b><span>Presión</span></div>
      <div className={'eclss-gauge' + (open ? '' : ' tour-low')}><b>{air.oxygen}</b><span>Reserva O₂</span></div>
    </div>
    <p>Indicadores de juego. La presión puede mantenerse aunque la reserva baje.</p>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => setLooked(true)}>Mirar solo la presión</button>
      <button className="secondary-button" aria-pressed={open} onClick={() => setOpen(true)}>Abrir reserva de oxígeno</button>
    </div>
    <button className="primary-button" disabled={!air.ready} onClick={() => onAnswer('Reserva de oxígeno y composición del aire')}>Registrar lectura</button>
    <Source id="oxygen" />
  </div>;
}

export function BackupBoard({ onAnswer }) {
  const [backup, setBackup] = useState({ life: false, navigation: false, lights: false });
  const [cut, setCut] = useState(false);
  const result = cut ? loadsAfterCut(backup) : null;
  function toggle(key) {
    setCut(false);
    setBackup(current => ({ ...current, [key]: !current[key] }));
  }
  const loads = [
    ['life', 'Soporte vital', 'Respaldo de soporte vital'],
    ['navigation', 'Navegación', 'Respaldo de navegación'],
    ['lights', 'Iluminación decorativa', 'Respaldo de iluminación'],
  ];
  return <div className="tour">
    <Speech>{result ? result.line : 'Da respaldo al aire y a la navegación. La luz decorativa puede quedarse sin él. Luego corta el bus principal.'}</Speech>
    <ul className="tour-loads">
      {loads.map(([key, label, control]) => {
        const on = result ? result[key] : true;
        return <li key={key} data-on={on}>
          <span>{label}</span>
          <b>{on ? 'encendido' : 'apagado'}</b>
          <button type="button" className="secondary-button" aria-pressed={backup[key]} onClick={() => toggle(key)}>{control}</button>
        </li>;
      })}
    </ul>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => setCut(true)}>Cortar el bus principal</button>
      <button className="primary-button" disabled={!result?.holds} onClick={() => onAnswer('Los sistemas esenciales')}>Registrar sistemas esenciales</button>
    </div>
    <Source id="breakers" />
  </div>;
}

export function SignalRadio({ onAnswer }) {
  const reduced = useReducedMotion();
  const [channel, setChannel] = useState(1);
  const [waiting, setWaiting] = useState(false);
  const [heard, setHeard] = useState('');
  const band = signalBand(channel);
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = window.setTimeout(() => {
      setWaiting(false);
      setHeard(channel === 7
        ? 'Pulso regular. Origen desconocido. No explica el estado de la nave. Aviso aparte: el circuito de propulsión pide mantenimiento.'
        : 'Solo hay ruido. Prueba el canal 7.');
    }, reduced ? 200 : 2600);
    return () => window.clearTimeout(timer);
  }, [waiting, channel, reduced]);
  return <div className="tour">
    <Speech>{heard || (band === 'fuerte' ? 'Ese canal se oye limpio. Envía y espera la vuelta.' : 'Sigue buscando. El canal ficticio 7 es el que Titus marcó.')}</Speech>
    <label>Canal ficticio {channel}
      <input aria-label="Canal de señal" type="range" min="1" max="10" value={channel} disabled={waiting} onChange={event => { setChannel(Number(event.target.value)); setHeard(''); }} />
    </label>
    <div className="signal-bars" aria-label={band === 'fuerte' ? 'Señal fuerte' : 'Ruido'}>{band === 'fuerte' ? '▂ ▆ ▂ ▆ ▂ ▆' : band === 'débil' ? '▁ ▃ ▁ ▃ ▁ ▂' : '▁ ▂ ▁ ▁ ▂ ▁'}</div>
    <p>La espera imita el viaje de ida y vuelta de una señal: 2 × 384.400 km / 299.792 km/s ≈ 2,6 s. Es una aproximación con la distancia media.</p>
    <div className="eclss-controls">
      <button className="secondary-button" disabled={waiting} onClick={() => { setHeard(''); setWaiting(true); }}>{waiting ? 'Esperando respuesta…' : 'Enviar y esperar'}</button>
      <button className="primary-button" disabled={!heard.includes('Origen desconocido')} onClick={() => onAnswer(7)}>Anotar en la bitácora</button>
    </div>
    <Source id="propulsion" />
  </div>;
}
