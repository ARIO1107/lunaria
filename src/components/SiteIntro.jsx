import { useEffect } from 'react';
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

  return <main className="site-intro" aria-label="Introducción de Lunaria">
    <video className="site-intro-video" src={introUrl} autoPlay muted playsInline preload="auto"
      onEnded={onFinish} onError={onFinish} aria-hidden="true" disablePictureInPicture />
    <button className="site-intro-skip" type="button" onClick={onFinish}>Omitir intro</button>
  </main>;
}

