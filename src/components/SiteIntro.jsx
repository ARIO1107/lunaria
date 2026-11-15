import { useEffect } from 'react';
import { t } from '../i18n/translate.js';
import './siteIntro.css';

const introUrl = import.meta.env.BASE_URL + 'assets/menu/intro.mp4';

export default function SiteIntro({ onFinish }) {
  useEffect(() => {
    const deadline = window.setTimeout(onFinish, 7500);
    const skip = event => {
      if (event.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', skip);
    return () => {
      window.clearTimeout(deadline);
      window.removeEventListener('keydown', skip);
    };
  }, [onFinish]);

  return <main className="site-intro" aria-label={t('Introducción de Lunaria')}>
    <video className="site-intro-video" src={introUrl} autoPlay muted playsInline preload="auto"
      onEnded={onFinish} onError={onFinish} aria-hidden="true" disablePictureInPicture />
    <button className="site-intro-skip" type="button" onClick={onFinish}>{t('Omitir intro')}</button>
  </main>;
}

