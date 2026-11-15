import { useEffect, useRef, useState } from 'react';
import { cardAt, durationOf, fadeAt, lineAt } from './script.js';
import { t } from '../i18n/translate.js';
import './cinematic.css';

export default function CinematicPlayer({ sequence = 'opening', onComplete, reducedMotion = false, volume = 70, soundEnabled = true, quality = 'alto' }) {
  const canvasRef = useRef(null);
  const ended = useRef(false);
  const closing = useRef(false);
  const handle = useRef(null);
  const [ui, setUi] = useState({ ready: false, error: '', lost: false, line: null, card: null, fade: false, handoff: false });

  function complete() {
    if (ended.current) return;
    ended.current = true;
    onComplete();
  }

  function skip() {
    if (closing.current || ended.current) return;
    closing.current = true;
    handle.current?.fadeOut?.();
    setUi(previous => ({ ...previous, handoff: true }));
    window.setTimeout(() => setUi(previous => ({ ...previous, fade: true })), 40);
    window.setTimeout(() => {
      if (ended.current) return;
      if (handle.current) handle.current.finish();
      else complete();
    }, reducedMotion ? 560 : 880);
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
        sequence, quality, reducedMotion, volume: volume / 100, soundEnabled,
        initialTime: Number.isFinite(requested) && requested > 0 ? requested : 0,
        models: modelo ? { hull: modelo } : null,
        onFrame: frame => {
          if (dead) return;
          const line = lineAt(frame.time, sequence);
          const card = cardAt(frame.time, sequence);
          const fade = closing.current || fadeAt(frame.time, sequence);
          const handoff = closing.current || frame.time > durationOf(sequence) - 1.05;
          const lost = Boolean(frame.lost);
          setUi(previous => {
            const error = frame.loadError || previous.error;
            if (previous.ready && previous.line?.id === line?.id && previous.card?.title === card?.title && previous.lost === lost && previous.fade === fade && previous.handoff === handoff && previous.error === error) return previous;
            return { ready: true, error, lost, line, card, fade, handoff };
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
  }, [sequence, quality, reducedMotion, volume, soundEnabled]);

  const launchFilm = sequence === 'launch';
  return <div className="cinematic-root" data-cinematic-root data-sequence={sequence}>
    <canvas ref={canvasRef} aria-label={t(launchFilm ? 'Cinemática tridimensional del despegue' : 'Cinemática tridimensional de apertura')} />
    <div className={'cinematic-fade' + (ui.fade ? ' show' : '') + (ui.handoff ? ' handoff' : '')} />
    {!ui.ready && !ui.error && <p className="cinematic-loading" role="status">{t('Preparando la cinemática…')}</p>}
    {ui.error && <p className="cinematic-loading" role="alert">{t(ui.error)} {t(launchFilm ? 'Puedes ver el resumen de la misión.' : 'Puedes entrar directo a la nave.')}</p>}
    {ui.lost && <p className="cinematic-loading" role="alert">{t('El navegador perdió la imagen 3D.')}</p>}
    {ui.card && <div className="cinematic-title"><p>{t(ui.card.kicker)}</p><h1>{t(ui.card.title)}</h1>{ui.card.detail && <span>{t(ui.card.detail)}</span>}</div>}
    {ui.line && <p className="cinematic-subtitle" role="status"><strong>{ui.line.speaker}</strong> {t(ui.line.text)}</p>}
    <p className="cinematic-note">{t(launchFilm ? 'Música y efectos del juego. En el vacío real el motor no se oye.' : 'Música y efectos del juego, en la plataforma de lanzamiento.')}</p>
    <button className="secondary-button cinematic-skip" onClick={skip}>{t('Omitir cinemática')}</button>
    <span className="cinematic-hint">{t('Esc · Omitir')}</span>
  </div>;
}
