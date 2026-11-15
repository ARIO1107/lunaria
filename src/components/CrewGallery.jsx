import { assetUrl } from '../game/assets.js';

const crew = [
  { name: 'El comandante', asset: 'astronaut', alt: 'Astronauta con traje marfil y visor azul', description: 'Explora la cubierta y aprende para qué sirve cada equipo de la nave.' },
  { name: 'Titus', asset: 'titus', alt: 'Robot gris grafito con ojos luminosos', description: 'Tu copiloto flotante. Te acompaña y te avisa cuando estás cerca de una consola.' },
];

export default function CrewGallery() {
  return <div className="crew-gallery">
    {crew.map(member => {
      const portrait = member.asset + '-portrait.png';
      return <article key={member.asset}>
        <div className="portrait-stage"><img src={assetUrl(portrait)} alt={member.alt} /></div>
        <h3>{member.name}</h3>
        <p>{member.description}</p>
        <a href={assetUrl(portrait)} download={'lunaria-' + (member.asset === 'titus' ? 'titus' : 'astronauta') + '.png'}>Descargar imagen PNG</a>
      </article>;
    })}
    <p className="gallery-note">Los modelos editables GLB y el generador están en la carpeta <code>art/</code> del proyecto.</p>
  </div>;
}

