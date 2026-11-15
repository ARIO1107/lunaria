import { useState } from 'react';
import { scienceFacts, factsForLevel } from '../data/scienceFacts.js';
import { STATIONS } from '../game/world.js';
import { SURFACE_OBJECTS } from '../game/surfaceWorld.js';
import { stationDescriptions } from '../data/stationDescriptions.js';
import { howTo } from '../game/titusGuide.js';
import { t } from '../i18n/translate.js';

export function ScienceFact({ fact }) {
  if (!fact) return null;
  return <article className="science-note"><h3>{t(fact.title)}</h3><p>{t(fact.text)}</p><small>{t(fact.classification)}</small><p><a href={fact.sourceUrl} target="_blank" rel="noreferrer">{t('Ver fuente NASA')}</a></p></article>;
}
export function ScienceLogbook({ discoveredFacts=[] }) {
  return <div className="source-content">
    <p>{t('La expedición de Alex y Titus es ficticia. Los recursos y tolerancias son parámetros educativos.')}</p>
    <p>{t('{count} datos consultados.', { count: discoveredFacts.length })}</p>
    {scienceFacts.map(fact => <details key={fact.id}><summary>{t(fact.title)}{discoveredFacts.includes(fact.id) ? t(' · Consultado') : ''}</summary><ScienceFact fact={fact}/></details>)}
  </div>;
}
export default function TitusAssistant({level=1,objective,station,emergency=false,discoveredFacts=[],onDiscover}) {
  const [hint,setHint]=useState({id:null,count:0});
  const [answer,setAnswer]=useState('');
  const [fact,setFact]=useState(null);
  const target=[...STATIONS, ...SURFACE_OBJECTS].find(item=>item.id===objective?.stationId);
  const destination=target?.name||objective?.stationId||'el objeto indicado en el mapa';
  const instruction=objective?.title||'Consulta tus objetivos y explora con calma.';
  const nearby=stationDescriptions[station?.id];
  function respond(text) { setAnswer(text); setFact(null); }
  function help() {
    const count=hint.id===objective?.id?hint.count+1:1;
    setHint({id:objective?.id,count});
    const place = t(destination);
    const hints=[
      objective ? howTo(objective) : 'Observa el objetivo pendiente.',
      t('Ve a {place} y pulsa E o Inspeccionar.', { place }),
      t('Acércate a {place} y completa «{task}».', { place, task: t(instruction) }),
    ];
    respond(hints[Math.min(count-1,2)]);
  }
  function curious() {
    const candidates=factsForLevel(level);
    const next=candidates.find(item=>!discoveredFacts.includes(item.id))||candidates[(candidates.indexOf(fact)+1)%candidates.length];
    setFact(next);setAnswer('');onDiscover?.(next.id);
  }
  const place = t(destination);
  return <section className="source-content" aria-label={t('Ayuda de Titus')}>
    <h3>Titus · {emergency ? t('Atención a los sistemas') : t('Tu copiloto científico')}</h3>
    <p>{nearby ? t('Estamos junto a {place}. {text}', { place: t(station.name), text: t(nearby.text) }) : t(instruction)}</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      <button className="secondary-button" onClick={help}>{t('¿Qué debo hacer ahora?')}</button>
      <button className="secondary-button" onClick={() => respond(t('Busca {place}. Usa WASD, flechas o los controles táctiles para acercarte.', { place }))}>{t('¿Dónde está mi objetivo?')}</button>
      <button className="secondary-button" onClick={() => respond(objective?.why || nearby?.fact || 'Cada comprobación protege a la tripulación y conserva recursos para los siguientes pasos.')}>{t('¿Por qué es importante?')}</button>
      <button className="secondary-button" onClick={curious}>{t('Dame un dato curioso')}</button>
      <button className="secondary-button" onClick={() => respond(instruction)}>{t('Repetir instrucciones')}</button>
    </div>
    <p role="status">{t(answer)}</p><ScienceFact fact={fact}/>
  </section>;
}
