import { en } from './en.js';
import { getLanguage } from './language.js';

const patterns = [
  {
    re: /^Objetivo completado: (.+)$/s,
    apply: (title, depth) => `Objective complete: ${lookup(title, depth + 1)}`,
  },
  {
    re: /^Titus: Esa decisión no cumple el procedimiento\. ([\s\S]+)$/,
    apply: (how, depth) => `Titus: That choice does not follow the procedure. ${lookup(how, depth + 1)}`,
  },
  {
    re: /^Titus: ¡Excelente! El soporte vital está preparado\. Ahora iremos a comprobar la energía\. ([\s\S]+)$/,
    apply: (rest, depth) => `Titus: Excellent! Life support is ready. Next we will check the power. ${lookup(rest, depth + 1)}`,
  },
  {
    re: /^Titus: ([\s\S]+) Comencemos por soporte vital\.$/,
    apply: (body, depth) => `Titus: ${lookup(body, depth + 1)} Let us start with life support.`,
  },
  {
    re: /^Titus: Perfecto, capitán Alex\. ¡Aquí estamos! Este sistema nos ayuda a mantener condiciones adecuadas para respirar\. ([\s\S]+)$/,
    apply: (how, depth) => `Titus: All right, Captain Alex. Here we are! This system helps us keep the air safe to breathe. ${lookup(how, depth + 1)}`,
  },
  {
    re: /^Titus: Perfecto, capitán Alex\. Desde esta consola despega la nave\. ([\s\S]+)$/,
    apply: (how, depth) => `Titus: All right, Captain Alex. The ship lifts off from this console. ${lookup(how, depth + 1)}`,
  },
  {
    re: /^Titus: ([\s\S]+)$/,
    apply: (rest, depth) => {
      const translated = lookup(rest, depth + 1);
      return translated === rest ? null : `Titus: ${translated}`;
    },
  },
  {
    re: /^Perfecto, capitán Alex\. Ya llegamos a ([^.]+)\. ([\s\S]+)$/,
    apply: (place, how, depth) => `All right, Captain Alex. We have reached ${lookup(place, depth + 1)}. ${lookup(how, depth + 1)}`,
  },
  {
    re: /^Falta meter en la bolsa: (.+)\.$/,
    apply: (list, depth) => `Still missing from the bag: ${list.split(', ').map(item => lookup(item, depth + 1)).join(', ')}.`,
  },
  {
    re: /^(.+) también salió en el marco\. Espera a que la Tierra pase sola y pulsa Tomar foto\.$/,
    apply: (name, depth) => `${lookup(name, depth + 1)} is also in the frame. Wait until Earth passes alone and press Take photo.`,
  },
  {
    re: /^(.+) también salieron en el marco\. Espera a que la Tierra pase sola y pulsa Tomar foto\.$/,
    apply: (names, depth) => `${names.split(' y ').map(name => lookup(name, depth + 1)).join(' and ')} were also in the frame. Wait until Earth passes alone and press Take photo.`,
  },
  {
    re: /^En el marco: (.+)\.$/,
    apply: (names, depth) => `In the frame: ${names.split(', ').map(name => lookup(name, depth + 1)).join(', ')}.`,
  },
  {
    re: /^(.+) está estable\. Busca la lámpara roja\.$/,
    apply: (name, depth) => `${lookup(name, depth + 1)} is stable. Look for the red lamp.`,
  },
  {
    re: /^([\s\S]+) Fuente: (.+)\.$/,
    apply: (text, source, depth) => `${lookup(text, depth + 1)} Source: ${lookup(source, depth + 1)}.`,
  },
  {
    re: /^Paneles (al sol|en sombra) · baterías (conectadas|sueltas)$/,
    apply: (panels, batteries, depth) => `Panels ${lookup(panels, depth + 1)} · batteries ${lookup(batteries, depth + 1)}`,
  },
  {
    re: /^Flujo: (.+)$/,
    apply: (state, depth) => `Flow: ${lookup(state, depth + 1)}`,
  },
  {
    re: /^Proa (\d+)° · arco verde de 40° a 50°\. La línea «camino» no gira\.$/,
    apply: angle => `Nose ${angle}° · green arc from 40° to 50°. The “path” line does not turn.`,
  },
  {
    re: /^Ajuste fino (\d+)°$/,
    apply: angle => `Fine adjust ${angle}°`,
  },
  {
    re: /^Canal ficticio (\d+)$/,
    apply: channel => `Fictional channel ${channel}`,
  },
  {
    re: /^Horizonte (\d+)°\. Referencia 90°\.$/,
    apply: angle => `Horizon ${angle}°. Reference 90°.`,
  },
  {
    re: /^Velocidad de juego (\d+)$/,
    apply: speed => `Game speed ${speed}`,
  },
  {
    re: /^Orientación (\d+)°$/,
    apply: angle => `Orientation ${angle}°`,
  },
  {
    re: /^Referencia objetivo: (.+)° · trayectoria esquemática\.$/,
    apply: angle => `Target reference: ${angle}° · schematic trajectory.`,
  },
  {
    re: /^Total (\d+) \/ 60 unidades de juego\.$/,
    apply: total => `Total ${total} / 60 game units.`,
  },
  {
    re: /^Cuenta regresiva (\d+)$/,
    apply: count => `Countdown ${count}`,
  },
  {
    re: /^(\d+) datos consultados\.$/,
    apply: count => `${count} facts opened.`,
  },
  {
    re: /^Volumen guardado: (\d+) %\. Cámbialo en Configuración del menú principal\.$/,
    apply: volume => `Saved volume: ${volume}%. Change it in Settings on the main menu.`,
  },
  {
    re: /^Decisiones de este tramo: (.+)\.$/,
    apply: (list, depth) => `Choices this leg: ${list.split(' · ').map(item => lookup(item, depth + 1)).join(' · ')}.`,
  },
  {
    re: /^Refugio (listo|pendiente) · Ciencia (\d+) · Ciclo (\d+)$/,
    apply: (habitat, science, cycle, depth) => `Shelter ${lookup(habitat, depth + 1)} · Science ${science} · Cycle ${cycle}`,
  },
  {
    re: /^Actividades (\d+)\/3 · ciclos cerrados (\d+)\/3\. Cada botón explica su costo al usarlo y solo cuenta una vez por ciclo\.$/,
    apply: (activities, cycles) => `Activities ${activities}/3 · closed cycles ${cycles}/3. Each button states its cost when you use it and counts only once per cycle.`,
  },
  {
    re: /^E · (.+)$/,
    apply: (name, depth) => `E · ${lookup(name, depth + 1)}`,
  },
  {
    re: /^Analizar ([a-z]+)$/,
    apply: (id, depth) => `Analyze ${lookup(id, depth + 1)}`,
  },
  {
    re: /^Capitán Alex, vamos hacia (.+)\.$/,
    apply: (title, depth) => `Captain Alex, we are heading to ${lookup(title, depth + 1)}.`,
  },
  {
    re: /^(.+) · (en la bolsa)$/,
    apply: (note, suffix, depth) => `${lookup(note, depth + 1)} · ${lookup(suffix, depth + 1)}`,
  },
  {
    re: /^(.+) · (analizada|pendiente)$/,
    apply: (name, status, depth) => `${lookup(name, depth + 1)} · ${lookup(status, depth + 1)}`,
  },
];

function lookup(source, depth = 0) {
  if (getLanguage() !== 'en') return source;
  if (Object.prototype.hasOwnProperty.call(en, source)) return en[source];
  if (depth > 6) return source;
  for (const pattern of patterns) {
    const match = source.match(pattern.re);
    if (!match) continue;
    const result = pattern.apply(...match.slice(1), depth);
    if (result != null) return result;
  }
  return source;
}

export function t(text, vars) {
  const source = text == null ? '' : String(text);
  const template = lookup(source);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? '' : String(vars[key])));
}

const descriptionEs = 'Explora la nave de Lunaria con tu astronauta y Titus. Una cubierta espacial 2.5D preparada para futuras misiones educativas.';

export function applyDocumentLanguage() {
  if (typeof document === 'undefined') return;
  const lang = getLanguage();
  document.documentElement.lang = lang;
  document.title = t('Lunaria · Terminal espacial');
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t(descriptionEs));
}
