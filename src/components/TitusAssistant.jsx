import { useState } from 'react';
import { scienceFacts, factsForLevel } from '../data/scienceFacts.js';
import { STATIONS } from '../game/world.js';
import { SURFACE_OBJECTS } from '../game/surfaceWorld.js';
import { stationDescriptions } from '../data/stationDescriptions.js';

export function ScienceFact({ fact }) {
  if (!fact) return null;
  return <article className="science-note"><h3>{fact.title}</h3><p>{fact.text}</p><small>{fact.classification}</small><p><a href={fact.sourceUrl} target="_blank" rel="noreferrer">Ver fuente NASA</a></p></article>;
}
export function ScienceLogbook({ discoveredFacts=[] }) {
  return <div className="source-content">
    <p>La expedición de Alex y Titus es ficticia. Los recursos y tolerancias son parámetros educativos.</p>
    <p>{discoveredFacts.length} datos consultados.</p>
    {scienceFacts.map(fact => <details key={fact.id}><summary>{fact.title}{discoveredFacts.includes(fact.id)?' · Consultado':''}</summary><ScienceFact fact={fact}/></details>)}
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
    const hints=['Observa el objetivo pendiente y los indicadores del equipo.',objective?.hint||'Busca '+destination+' y revisa qué requisito falta.', 'Acércate a '+destination+', pulsa E o Inspeccionar y completa «'+instruction+'».'];
    respond(hints[Math.min(count-1,2)]);
  }
  function curious() {
    const candidates=factsForLevel(level);
    const next=candidates.find(item=>!discoveredFacts.includes(item.id))||candidates[(candidates.indexOf(fact)+1)%candidates.length];
    setFact(next);setAnswer('');onDiscover?.(next.id);
  }
  return <section className="source-content" aria-label="Ayuda de Titus">
    <h3>Titus · {emergency?'Atención a los sistemas':'Tu copiloto científico'}</h3>
    <p>{nearby?'Estamos junto a '+station.name+'. '+nearby.text:instruction}</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      <button className="secondary-button" onClick={help}>¿Qué debo hacer ahora?</button>
      <button className="secondary-button" onClick={()=>respond('Busca '+destination+'. Usa WASD, flechas o los controles táctiles para acercarte.')}>¿Dónde está mi objetivo?</button>
      <button className="secondary-button" onClick={()=>respond(objective?.why||nearby?.fact||'Cada comprobación protege a la tripulación y conserva recursos para los siguientes pasos.')}>¿Por qué es importante?</button>
      <button className="secondary-button" onClick={curious}>Dame un dato curioso</button>
      <button className="secondary-button" onClick={()=>respond(instruction)}>Repetir instrucciones</button>
    </div>
    <p role="status">{answer}</p><ScienceFact fact={fact}/>
  </section>;
}
