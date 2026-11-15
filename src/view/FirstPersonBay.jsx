import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/translate.js';

export default function FirstPersonBay({ stationId, vista, reduced = false, quality = 'alto', caption = '' }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let dead = false;
    let handle = null;
    setFailed(false);
    import('./firstPersonBay.js').then(mod => {
      if (dead || !canvasRef.current) return;
      handle = mod.startFirstPerson(canvasRef.current, { stationId, vista, reduced, quality });
    }).catch(() => { if (!dead) setFailed(true); });
    return () => {
      dead = true;
      handle?.dispose();
    };
  }, [stationId, vista, reduced, quality]);
  return <div className="fp-bay">
    {failed ? <p>{t('La vista de la cabina no pudo iniciarse. Puedes seguir la tarea en el panel.')}</p> : <canvas key={`${stationId}-${vista}-${quality}`} ref={canvasRef} aria-label={t('Vista en primera persona desde la consola de Alex')} />}
    {caption && <p className="fp-speech">{t(caption)}</p>}
  </div>;
}
