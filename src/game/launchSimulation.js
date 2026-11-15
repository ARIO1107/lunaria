import { GAME_TUNING as T, nasaTelemetry } from '../data/nasaTelemetry.js';

const H = nasaTelemetry.launch.verified;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const missionClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function createLaunch() {
  return { status: 'ready', time: 0, throttle: 1, heat: 0, pressure: 0, acceleration: 1,
    centerOff: false, cutoffTime: null, separationTime: null, impulse: 0, peakPressure: 0,
    maxQSafeTime: 0, reason: '' };
}

export function launchAction(state, action, value) {
  if (action === 'reset') return createLaunch();
  if (action === 'ignite' && state.status === 'ready') return { ...state, status: 'flying' };
  if (state.status !== 'flying') return state;
  if (action === 'throttle' && Number.isFinite(value)) return { ...state, throttle: clamp(value, 0.35, 1) };
  if (action === 'cutoff' && state.time >= H.centerEngineCutoffTimeS && !state.centerOff)
    return { ...state, centerOff: true, cutoffTime: state.time };
  if (action === 'separate' && state.centerOff && state.time >= H.separationTimeS) {
    if (state.impulse / state.time < T.minimumMeanThrottle)
      return { ...state, status: 'failed', reason: 'Faltó empuje durante el ascenso. Usa 100 % fuera de Max Q y 60 % durante la zona de presión.' };
    return { ...state, status: 'success', separationTime: state.time };
  }
  return state;
}

/** Pure deterministic simulation. dt is active wall-clock time, not mission time. */
export function stepLaunch(state, dt) {
  if (state.status !== 'flying' || dt <= 0 || !Number.isFinite(dt)) return state;
  const elapsed = Math.min(dt, 0.1) * T.missionTimeScale;
  const time = state.time + elapsed;
  const inMaxQ = time >= T.maxQStartS && time <= T.maxQEndS;
  // Normalised load, NOT a fabricated pressure in Pa. Historical peak is shown separately.
  const envelope = Math.exp(-(((time - H.maxQTimeS) / 23) ** 2));
  const pressure = envelope * state.throttle;
  let heat = state.heat;
  if (inMaxQ && state.throttle > T.maxQSafeThrottle) heat += elapsed * (state.throttle - T.maxQSafeThrottle) * 13;
  else heat -= elapsed * 0.5;
  if (time > H.centerEngineCutoffTimeS && !state.centerOff) heat += elapsed * 6;
  heat = clamp(heat, 0, 100);
  const next = { ...state, time, heat, pressure,
    acceleration: (1 + Math.min(time / H.centerEngineCutoffTimeS, 1) * 3) * state.throttle * (state.centerOff ? 0.8 : 1),
    impulse: state.impulse + state.throttle * elapsed,
    peakPressure: Math.max(state.peakPressure, pressure),
    maxQSafeTime: state.maxQSafeTime + (inMaxQ && state.throttle <= T.maxQSafeThrottle ? elapsed : 0),
  };
  if (heat >= 100) return { ...next, status: 'failed', reason: 'La carga fue demasiado alta. Reduce a 60 % durante Max Q y apaga el motor central cuando Titus lo indique.' };
  if (time > H.separationTimeS + T.separationGraceS)
    return { ...next, status: 'failed', reason: 'Se cerró la ventana de separación. Tras apagar el motor central, separa la etapa desde T+02:42.' };
  return next;
}

export function launchGuidance(s) {
  if (s.status === 'ready') return { mood: 'normal', text: '¡Comandante! Enciende los cinco motores. En Max Q baja la potencia a 60 %: menos empuje significa menos presión sobre el cohete.' };
  if (s.status === 'failed') return { mood: 'danger', text: s.reason };
  if (s.status === 'success') return { mood: 'normal', text: '¡Etapa separada! El simulador de la primera etapa termina aquí. Pulsa «Ver el despegue» para la película del ascenso hasta la órbita terrestre.' };
  if (s.heat > 70) return { mood: 'danger', text: s.centerOff || s.time < H.centerEngineCutoffTimeS ? '¡Carga crítica! Baja el acelerador a 60 % durante Max Q.' : '¡Apaga el motor central ahora! La carga sigue aumentando.' };
  if (s.time >= H.separationTimeS) return { mood: 'alert', text: '¡Ventana abierta! Pulsa SEPARAR ETAPA. Descartar la etapa vacía reduce el peso del vehículo.' };
  if (s.time >= H.centerEngineCutoffTimeS && !s.centerOff) return { mood: 'alert', text: 'T+02:15. ¡Apaga el motor central! Así reducimos la aceleración mientras el cohete pierde masa.' };
  if (s.centerOff) return { mood: 'normal', text: 'Cuatro motores activos. Prepárate para separar la etapa a T+02:42.' };
  if (s.time >= 55 && s.time <= T.maxQEndS) return { mood: 'alert', text: '¡Max Q! Lleva el acelerador a 60 %. El aire empuja con fuerza contra el cohete. Mantén baja la carga hasta T+01:45.' };
  return { mood: 'normal', text: s.time > T.maxQEndS ? '¡Max Q superado! Recupera el 100 % de potencia. Próxima tarea: apagar el motor central a T+02:15.' : 'Ascenso estable. Mantén 100 % de potencia. Te avisaré antes de entrar en la zona Max Q.' };
}
