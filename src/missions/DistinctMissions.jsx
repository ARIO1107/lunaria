import { useState } from 'react';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { airlockAdvance, burnReady, burnSpeed, repairAdvance, REPAIR_ORDER, shadowState } from '../game/laterMissions.js';
import { playSound } from '../audio/audioManager.js';
import { t } from '../i18n/translate.js';

function Speech({ children }) {
  return <p className="eclss-speech" role="status"><b>Titus. </b>{typeof children === 'string' ? t(children) : children}</p>;
}
function Source({ id }) {
  const description = stationDescriptions[id];
  if (!description) return null;
  return <a href={description.source} target="_blank" rel="noreferrer">{t('Consultar referencia NASA')}</a>;
}

export function FaultLamps({ onAnswer }) {
  const [line, setLine] = useState('Tres lámparas. Solo el circuito en rojo está averiado.');
  const lamps = [['Soporte vital', false], ['Navegación', false], ['Propulsión', true]];
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="tour-lamps">
      {lamps.map(([name, fault]) => <button key={name} className="secondary-button" data-fault={fault} onClick={() => fault ? onAnswer(name) : (playSound('error'), setLine(name + ' está estable. Busca la lámpara roja.'))}>{t(name)}</button>)}
    </div>
    <Source id="breakers" />
  </div>;
}

export function BreakerPull({ onAnswer }) {
  const [down, setDown] = useState(false);
  const [line, setLine] = useState('Baja el disyuntor de propulsión antes de acercarte a la pieza.');
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="eclss-controls">
      <button className="secondary-button" aria-pressed={down} onClick={() => { playSound('click'); setDown(true); setLine('Disyuntor abajo. La pieza ya no tiene corriente. Confirma el aislamiento.'); }}>{t('Bajar disyuntor de propulsión')}</button>
      <button className="secondary-button" onClick={() => { playSound('error'); setLine('No toques la pieza con corriente. Primero baja el disyuntor.'); }}>{t('Tocar la pieza ahora')}</button>
      <button className="primary-button" disabled={!down} onClick={() => onAnswer('Desconectar propulsión')}>{t('Confirmar aislamiento')}</button>
    </div>
    <Source id="breakers" />
  </div>;
}

export function PartsTray({ onAnswer }) {
  const [line, setLine] = useState('En la bandeja hay tres piezas. Solo el fusible compatible cierra el circuito.');
  const parts = [['Fusible compatible', true], ['Cinta sobre el fusible', false], ['Sensor óptico', false]];
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="tour-lamps">
      {parts.map(([name, ok]) => <button key={name} className="secondary-button" onClick={() => ok ? onAnswer(name) : (playSound('error'), setLine('Esa pieza no repara el circuito. Elige el fusible compatible.'))}>{t(name)}</button>)}
    </div>
    <Source id="suit" />
  </div>;
}

export function RepairSequence({ onAnswer }) {
  const [done, setDone] = useState([]);
  const [line, setLine] = useState('Haz los tres pasos en orden. No saltes ninguno.');
  function press(step) {
    const result = repairAdvance(done, step);
    setDone(result.done);
    if (!result.ready) playSound('error');
    setLine(result.line);
    if (result.ready) onAnswer(result.done);
  }
  return <div className="tour">
    <Speech>{line}</Speech>
    <ol className="tour-shelf">{REPAIR_ORDER.map(step => <li key={step}><button className="secondary-button" aria-pressed={done.includes(step)} onClick={() => press(step)}>{t(step)}</button></li>)}</ol>
    <Source id="breakers" />
  </div>;
}

export function HorizonLock({ onAnswer }) {
  const [angle, setAngle] = useState(40);
  const ready = Math.abs(angle - 90) <= 5;
  return <div className="tour">
    <Speech>{ready ? 'Horizonte estable. Fíjalo.' : 'Sube o baja el horizonte hasta dejarlo en 90°, con una tolerancia de 5°.'}</Speech>
    <div className="tour-horizon" aria-hidden="true"><i style={{ transform: 'translateY(' + (90 - angle) + 'px)' }} /></div>
    <p>{t('Horizonte {angle}°. Referencia 90°.', { angle })}</p>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => setAngle(value => Math.max(0, value - 5))}>{t('Bajar horizonte')}</button>
      <button className="secondary-button" onClick={() => setAngle(value => Math.min(180, value + 5))}>{t('Subir horizonte')}</button>
    </div>
    <label>{t(`Ajuste fino ${angle}°`)}<input aria-label={t('Horizonte')} type="range" min="0" max="180" value={angle} onChange={event => setAngle(Number(event.target.value))} /></label>
    <button className="primary-button" disabled={!ready} onClick={() => onAnswer(angle)}>{t('Fijar horizonte')}</button>
    <Source id="coas" />
  </div>;
}

export function OrbitBurn({ onAnswer }) {
  const [speed, setSpeed] = useState(100);
  const ready = burnReady(speed);
  return <div className="tour">
    <Speech>{ready ? 'La velocidad de juego ya permite la órbita. Confirma el frenado.' : speed > 46 ? 'Enciende el frenado para bajar la velocidad. Acelerar nos aleja de la órbita.' : 'Demasiado lento. Un impulso corto y vuelve a frenar con cuidado.'}</Speech>
    <p className="tour-speed">{t('Velocidad de juego {speed}', { speed })}</p>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => setSpeed(value => burnSpeed(value, false))}>{t('Encender frenado')}</button>
      <button className="secondary-button" onClick={() => setSpeed(value => burnSpeed(value, true))}>{t('Acelerar')}</button>
      <button className="primary-button" disabled={!ready} onClick={() => onAnswer('Encender para reducir la velocidad')}>{t('Confirmar órbita')}</button>
    </div>
    <Source id="propulsion" />
  </div>;
}

export function ZoneMap({ onAnswer }) {
  const zones = [
    ['A', 'Amplia y poco iluminada'],
    ['B', 'Más luz y menos sitio'],
    ['C', 'Terreno accidentado'],
  ];
  return <div className="tour">
    <Speech>Elige una zona del mapa ficticio. Cada una cambia la luz y el espacio del descenso.</Speech>
    <div className="tour-zones">
      {zones.map(([id, label]) => <button key={id} className="secondary-button" onClick={() => onAnswer(id)}><b>{t('Zona {id}', { id })}</b><span>{t(label)}</span></button>)}
    </div>
    <Source id="lander" />
  </div>;
}

function PackList({ intro, items, stationId, onAnswer }) {
  const [on, setOn] = useState([]);
  const ready = items.every(item => on.includes(item));
  return <div className="tour">
    <Speech>{ready ? 'Todo marcado. Puedes confirmar.' : intro}</Speech>
    <ul className="tour-shelf">{items.map(item => <li key={item}><button className="secondary-button" aria-pressed={on.includes(item)} onClick={() => setOn(list => list.includes(item) ? list.filter(entry => entry !== item) : [...list, item])}>{t(item)}</button></li>)}</ul>
    <button className="primary-button" disabled={!ready} onClick={() => onAnswer(items)}>{t('Confirmar preparación')}</button>
    <Source id={stationId} />
  </div>;
}

export function LanderPrep(props) {
  return <PackList {...props} stationId="lander" intro="Enciende los tres sistemas del módulo. Tiene depósitos propios." items={['Propulsión y combustible', 'Navegación y comunicaciones', 'Equipo de superficie']} />;
}
export function SuitLock(props) {
  return <PackList {...props} stationId="module" intro="Antes de salir: reserva, casco y esclusa. En ese orden da igual, pero los tres tienen que estar listos." items={['Reserva del traje', 'Casco sellado', 'Esclusa despresurizada']} />;
}
export function HabitatScan(props) {
  return <PackList {...props} stationId="habitat" intro="Recorre el hábitat: estructura, sensores y la carga que ya estaba aquí." items={['Estructura intacta', 'Sensores y presión', 'Inventario de carga']} />;
}
export function BaseAir(props) {
  return <PackList {...props} stationId="life" intro="Activa aire, oxígeno y temperatura. Al confirmar se gastan 10 de energía de juego." items={['Circulación de aire', 'Control de oxígeno y CO₂', 'Control térmico']} />;
}
export function RouteCheck(props) {
  return <PackList {...props} stationId="module" intro="Una salida corta: aire del traje, sellos y una ruta para volver." items={['Aire del traje', 'Sellos comprobados', 'Ruta de regreso']} />;
}

export function TextureLook({ onAnswer }) {
  const [line, setLine] = useState('Ves granos finos y trozos más gruesos. El color no dice de qué está hecho.');
  function pick(label, ok) {
    if (ok) onAnswer(label);
    else { playSound('error'); setLine('Con la vista no se conoce la composición ni se puede beber. Describe la textura y el lugar.'); }
  }
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="tour-rock" aria-hidden="true" />
    <div className="tour-lamps">
      <button className="secondary-button" onClick={() => pick('Conocer toda la composición por el color', false)}>{t('Leer la composición por el color')}</button>
      <button className="secondary-button" onClick={() => pick('Describir la textura y registrar el lugar', true)}>{t('Describir la textura y el lugar')}</button>
      <button className="secondary-button" onClick={() => pick('Afirmar que contiene agua potable', false)}>{t('Decir que es agua potable')}</button>
    </div>
    <Source id="regolith" />
  </div>;
}

export function AirlockReturn({ onAnswer }) {
  const [stage, setStage] = useState(0);
  const [line, setLine] = useState('Cierra la esclusa y, solo después, recupera la presión.');
  function act(action) {
    const result = airlockAdvance(stage, action);
    setStage(result.stage);
    if (!result.ready) playSound('error');
    setLine(result.line);
    if (result.ready) onAnswer('Cerrar esclusa y recuperar presión');
  }
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="eclss-controls">
      <button className="secondary-button" onClick={() => act('cerrar')}>{t('Cerrar esclusa')}</button>
      <button className="secondary-button" onClick={() => act('presion')}>{t('Recuperar presión')}</button>
      <button className="secondary-button" onClick={() => act('ambas')}>{t('Abrir las dos puertas')}</button>
    </div>
    <Source id="module" />
  </div>;
}

export function ShadowLink({ onAnswer }) {
  const [linked, setLinked] = useState(false);
  const [eclipse, setEclipse] = useState(false);
  const sky = shadowState(linked, eclipse);
  return <div className="tour">
    <Speech>{sky.line}</Speech>
    <p>{t(`Paneles ${sky.panels ? 'al sol' : 'en sombra'} · baterías ${sky.batteries ? 'conectadas' : 'sueltas'}`)}</p>
    <div className="eclss-controls">
      <button className="secondary-button" aria-pressed={linked} onClick={() => setLinked(value => !value)}>{t('Conectar paneles a baterías')}</button>
      <button className="secondary-button" aria-pressed={eclipse} onClick={() => setEclipse(true)}>{t('Simular sombra')}</button>
      <button className="primary-button" disabled={!sky.holds} onClick={() => onAnswer('Conectar paneles a baterías')}>{t('Registrar conexión')}</button>
    </div>
    <Source id="solar" />
  </div>;
}

export function WaterChoice({ onAnswer }) {
  const [line, setLine] = useState('Hay agua para beber y agua usada que el equipo puede recuperar. No se crea agua de la nada.');
  function pick(label, ok) {
    if (ok) onAnswer(label);
    else { playSound('error'); setLine('Eso no cuida a la tripulación. Primero el consumo humano y una recuperación controlada.'); }
  }
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="tour-lamps">
      <button className="secondary-button" onClick={() => pick('Toda el agua para experimentos', false)}>{t('Toda el agua para experimentos')}</button>
      <button className="secondary-button" onClick={() => pick('Consumo humano primero y recuperación controlada', true)}>{t('Personas primero y recuperación controlada')}</button>
      <button className="secondary-button" onClick={() => pick('Crear agua sin equipo', false)}>{t('Crear agua sin equipo')}</button>
    </div>
    <Source id="storage" />
  </div>;
}

export function TaggedSample({ onAnswer }) {
  return <div className="tour">
    <Speech>Esta bolsa ya tiene etiqueta de regolito. Recógela tal cual. No es una muestra real.</Speech>
    <button className="primary-button" onClick={() => onAnswer(true)}>{t('Tomar la bolsa etiquetada')}</button>
    <Source id="regolith" />
  </div>;
}

export function LabScope({ onAnswer }) {
  const [line, setLine] = useState('El visor muestra fragmentos de roca y polvo. Elige la clasificación que encaja.');
  function pick(label, ok) {
    if (ok) onAnswer(label);
    else { playSound('error'); setLine('El instrumento no convierte el polvo en agua ni en metal puro.'); }
  }
  return <div className="tour">
    <Speech>{line}</Speech>
    <div className="tour-lamps">
      <button className="secondary-button" onClick={() => pick('Regolito', true)}>{t('Regolito')}</button>
      <button className="secondary-button" onClick={() => pick('Agua potable', false)}>{t('Agua potable')}</button>
      <button className="secondary-button" onClick={() => pick('Metal puro', false)}>{t('Metal puro')}</button>
    </div>
    <Source id="lab" />
  </div>;
}
