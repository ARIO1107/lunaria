import { useEffect, useRef, useState } from 'react';
import { PHOTO_ANSWER, frameStatus, photoMiss } from '../game/photoShot.js';
import { playSound } from '../audio/audioManager.js';
import { t } from '../i18n/translate.js';

const empty = { ok: false, reason: 'fuera', names: [] };

function motionReduced() {
  const flag = document.querySelector('[data-lunaria-reduced-motion="true"]');
  const system = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return Boolean(flag) || Boolean(system);
}

export default function PhotoBooth({ onAnswer }) {
  const canvasRef = useRef(null);
  const gradeRef = useRef(empty);
  const [grade, setGrade] = useState(empty);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [line, setLine] = useState('Los astros cruzan a distintas velocidades. Cuando la Tierra quede sola y entera en el marco, pulsa Tomar foto.');

  useEffect(() => {
    let dead = false;
    let handle = null;
    import('../view/photoSky.js').then(mod => {
      if (dead || !canvasRef.current) return;
      handle = mod.startPhotoSky(canvasRef.current, {
        reduced: motionReduced(),
        onReady: () => { if (!dead) setReady(true); },
        onGrade: next => {
          gradeRef.current = next;
          if (!dead) setGrade(next);
        },
        onFail: () => { if (!dead) setFailed(true); },
      });
      if (dead) handle.dispose();
    }).catch(() => { if (!dead) setFailed(true); });
    return () => {
      dead = true;
      handle?.dispose();
    };
  }, []);

  function shoot() {
    const shot = gradeRef.current;
    if (shot.ok) {
      onAnswer(PHOTO_ANSWER);
      return;
    }
    playSound('error');
    setLine(photoMiss(shot));
  }

  return <div className="tour">
    <p className="eclss-speech" role="status"><b>Titus. </b>{t(line)}</p>
    <div className="photo-sky" data-framed={grade.ok ? 'si' : 'no'}>
      {failed
        ? <p>{t('La ventana no pudo abrirse. Cierra la consola y vuelve a inspeccionar la mira.')}</p>
        : <canvas ref={canvasRef} aria-label={t('Ventana hacia los astros')} />}
      <div className="photo-reticle" aria-hidden="true" />
    </div>
    <p>{ready ? t(frameStatus(grade)) : t('Abriendo la ventana…')}</p>
    <button className="primary-button" type="button" disabled={!ready || failed} onClick={shoot}>{t('Tomar foto')}</button>
    <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noreferrer">{t('Mapas planetarios de la NASA')}</a>
  </div>;
}
