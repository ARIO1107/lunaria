import { assetUrl } from '../game/assets.js';
import { t } from '../i18n/translate.js';

const crew = [
  { name: 'El comandante', asset: 'astronaut', alt: 'Astronauta con traje marfil y visor azul', description: 'Explora la cubierta y aprende para qué sirve cada equipo de la nave.' },
  { name: 'Titus', asset: 'titus', alt: 'Robot gris grafito con ojos luminosos', description: 'Tu copiloto flotante. Te acompaña y te avisa cuando estás cerca de una consola.' },
];

export default function CrewGallery() {
  return <div className="crew-gallery">
    {crew.map(member => {
      const portrait = member.asset + '-portrait.png';
      return <article key={member.asset}>
        <div className="portrait-stage"><img src={assetUrl(portrait)} alt={t(member.alt)} /></div>
        <h3>{t(member.name)}</h3>
        <p>{t(member.description)}</p>
        <a href={assetUrl(portrait)} download={'lunaria-' + (member.asset === 'titus' ? 'titus' : 'astronauta') + '.png'}>{t('Descargar imagen PNG')}</a>
      </article>;
    })}
    <p className="gallery-note">{t('Los modelos editables GLB y el generador están en la carpeta art/ del proyecto.')}</p>
  </div>;
}

