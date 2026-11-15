import { useEffect, useRef, useState } from 'react';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { createLifeSupport, lifeProblem, lifeReadout, LIFE_READY } from '../game/lifeSupport.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { playSound } from '../audio/audioManager.js';
import { t } from '../i18n/translate.js';

const INTRO = 'Observa el diagrama. ¿Qué sucede si el aire no circula?';

function Meter({ label, value, tone }) {
  return <div className={'eclss-meter eclss-meter-' + tone}>
    <span>{label}</span>
    <div><i style={{ width: Math.max(4, value) + '%' }} /></div>
    <b>{value}</b>
  </div>;
}

export default function LifeSupportConsole({ onAnswer }) {
  const reduced = useReducedMotion();
  const [rig, setRig] = useState(createLifeSupport);
  const [speech, setSpeech] = useState(INTRO);
  const [testing, setTesting] = useState(false);
  const rigRef = useRef(rig);
  const timer = useRef(0);
  rigRef.current = rig;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const readout = lifeReadout(rig);
  const description = stationDescriptions.oxygen;

  function toggle(key) {
    playSound('click');
    setTesting(false);
    setRig(current => ({ ...current, [key]: !current[key], stable: false }));
  }

  function testSystem() {
    const problem = lifeProblem(rig);
    if (problem) {
      playSound('error');
      setSpeech(problem.line);
      setRig(current => ({ ...current, stable: false }));
      return;
    }
    setTesting(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setTesting(false);
      const problem = lifeProblem(rigRef.current);
      if (problem) {
        setSpeech(problem.line);
        setRig(current => ({ ...current, stable: false }));
        return;
      }
      setSpeech('La prueba se mantiene. El aire circula, llega oxígeno y el CO₂ baja en el indicador de juego.');
      setRig(current => ({ ...current, stable: true }));
    }, reduced ? 200 : 900);
  }

  return <div className={'eclss' + (readout.circulating ? ' eclss-live' : '') + (reduced ? ' eclss-still' : '')}>
    <p className="eclss-speech" role="status"><b>Titus. </b>{t(speech)}</p>
    <div className="eclss-layout">
      <svg className="eclss-diagram" viewBox="0 0 360 280" role="img" aria-label={t('Diagrama de circulación del aire')}>
        <rect x="8" y="8" width="344" height="264" rx="16" className="eclss-board" />
        <g className={rig.valve && rig.fan ? 'eclss-pipe' : 'eclss-pipe eclss-pipe-off'}>
          <path d="M70 78 H150 V150 H250 V78 H300" />
          <path d="M180 150 V210 H90 V150" />
        </g>
        <g className="eclss-tank">
          <rect x="28" y="48" width="78" height="36" rx="16" />
          <rect x="28" y="96" width="78" height="36" rx="16" />
          <text x="67" y="72">O₂</text>
          <text x="67" y="120">O₂</text>
        </g>
        <g className={'eclss-part' + (rig.valve ? ' is-on' : '')} transform="translate(132 62)">
          <rect width="36" height="28" rx="6" />
          <text x="18" y="18">{t('Válvula')}</text>
        </g>
        <g className={'eclss-part' + (rig.fan ? ' is-on' : '')} transform="translate(210 128)">
          <circle cx="22" cy="22" r="20" />
          <text x="22" y="26">{t('Aire')}</text>
        </g>
        <g className={'eclss-part' + (rig.scrubber ? ' is-on' : '')} transform="translate(78 196)">
          <rect width="92" height="32" rx="6" />
          <text x="46" y="20">{t('Quitar CO₂')}</text>
        </g>
        <g className="eclss-cabin">
          <rect x="228" y="40" width="96" height="70" rx="8" />
          <text x="276" y="80">{t('Cabina')}</text>
        </g>
      </svg>
      <section className="eclss-screen" aria-label={t('Panel de diagnóstico')}>
        <div className="eclss-gauge">
          <b>{readout.supply}%</b>
          <span>{t('Suministro')}</span>
        </div>
        <ul>
          <li>{t('Presión de juego: estable')}</li>
          <li>{t('Capacidad de juego: depósitos a bordo')}</li>
          <li>{t('Flujo: ' + (rig.fan ? (rig.valve ? 'circulando' : 'solo recircula') : 'detenido'))}</li>
        </ul>
        <Meter label="O₂" value={readout.supply} tone="o2" />
        <Meter label="CO₂" value={readout.co2} tone="co2" />
        <p>{t('Indicadores de juego. No son una medición de una cabina real. Presión, cantidad de oxígeno y CO₂ son cosas distintas.')}</p>
      </section>
    </div>
    <div className="eclss-controls">
      <button type="button" className={rig.fan ? 'primary-button' : 'secondary-button'} onClick={() => toggle('fan')}>{rig.fan ? t('Ventilación activa') : t('Activar ventilación')}</button>
      <button type="button" className={rig.valve ? 'primary-button' : 'secondary-button'} onClick={() => toggle('valve')}>{rig.valve ? t('Suministro abierto') : t('Abrir suministro de oxígeno')}</button>
      <button type="button" className={rig.scrubber ? 'primary-button' : 'secondary-button'} onClick={() => toggle('scrubber')}>{rig.scrubber ? t('Eliminación de CO₂ activa') : t('Activar eliminación de CO₂')}</button>
      <button type="button" className="secondary-button" disabled={testing} onClick={testSystem}>{testing ? t('Probando estabilidad…') : t('Probar estabilidad')}</button>
      <button type="button" className="primary-button" disabled={!rig.stable || testing} onClick={() => onAnswer(LIFE_READY)}>{t('Preparar soporte vital')}</button>
    </div>
    {description && <a href={description.source} target="_blank" rel="noreferrer">{t('Consultar referencia NASA')}</a>}
  </div>;
}
