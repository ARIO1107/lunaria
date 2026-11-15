import { useEffect, useRef, useState } from 'react';
import { cardAt, lineAt } from './script.js';
import './cinematic.css';

export default function CinematicPlayer({ onComplete, reducedMotion = false, volume = 70, soundEnabled = true, quality = 'alto' }) {
  const canvasRef = useRef(null);
  const ended = useRef(false);
  const handle = useRef(null);
  const [ui, setUi] = useState({ ready: false, error: '', lost: false, line: null, card: null, fade: false });

  function complete() {
    if (ended.current) return;
    ended.current = true;
    onComplete();
  }

  function skip() {
    if (handle.current) handle.current.finish();
    else complete();
  }

  useEffect(() => {
    let dead = false;
    function onKey(event) {
      if (event.key !== 'Escape' || event.repeat) return;
      event.preventDefault();
      skip();
    }
    window.addEventListener('keydown', onKey);
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get('cine'));
    const modelo = params.get('modelo');
    import('./runtime.js').then(mod => {
      if (dead || ended.current || !canvasRef.current) return;
      handle.current = mod.startCinematic(canvasRef.current, {
        quality, reducedMotion, volume: volume / 100, soundEnabled,
        initialTime: Number.isFinite(requested) && requested > 0 ? requested : 0,
        models: modelo ? { hull: modelo } : null,
        onFrame: frame => {
          if (dead) return;
          const line = lineAt(frame.time);
          const card = cardAt(frame.time);
          const fade = (frame.time > 16.8 && frame.time < 21.2) || (frame.time > 88.2 && frame.time < 91.4);
          const lost = Boolean(frame.lost);
          setUi(previous => {
            const error = frame.loadError || previous.error;
            if (previous.ready && previous.line?.id === line?.id && previous.card?.title === card?.title && previous.lost === lost && previous.fade === fade && previous.error === error) return previous;
            return { ready: true, error, lost, line, card, fade };
          });
        },
        onComplete: complete,
      });
      window.__lunariaCinematic = handle.current;
    }).catch(error => { if (!dead) setUi(previous => ({ ...previous, error: error.message || 'No se pudo crear la imagen 3D.' })); });
    return () => {
      dead = true;
      window.removeEventListener('keydown', onKey);
      handle.current?.dispose();
      if (window.__lunariaCinematic === handle.current) delete window.__lunariaCinematic;
    };
  }, [quality, reducedMotion, volume, soundEnabled]);

  return <div className="cinematic-root" data-cinematic-root>
    <canvas ref={canvasRef} aria-label="Cinemática tridimensional de apertura" />
    <div className={ui.fade ? 'cinematic-fade show' : 'cinematic-fade'} />
    {!ui.ready && !ui.error && <p className="cinematic-loading" role="status">Preparando la cinemática…</p>}
    {ui.error && <p className="cinematic-loading" role="alert">{ui.error} Puedes entrar directo a la nave.</p>}
    {ui.lost && <p className="cinematic-loading" role="alert">El navegador perdió la imagen 3D.</p>}
    {ui.card && <div className="cinematic-title"><p>{ui.card.kicker}</p><h1>{ui.card.title}</h1>{ui.card.detail && <span>{ui.card.detail}</span>}</div>}
    {ui.line && <p className="cinematic-subtitle" role="status"><strong>{ui.line.speaker}</strong> {ui.line.text}</p>}
    <p className="cinematic-note">La música es de la película. En el vacío no hay sonido.</p>
    <button className="secondary-button cinematic-skip" onClick={skip}>Omitir cinemática</button>
    <span className="cinematic-hint">Esc · Omitir</span>
  </div>;
}
