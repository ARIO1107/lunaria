import { t } from '../i18n/translate.js';

export default function TitusDialogue({ mood = 'normal', children }) {
  const line = typeof children === 'string' ? t(children) : children;
  return <div className={`titus-radio ${mood}`}>
    <div className="titus-portrait" aria-hidden="true"><span>{mood === 'danger' ? '×_×' : mood === 'alert' ? '! !' : '^ ^'}</span><i /></div>
    <div><div className="radio-name">Titus <span>{t('Tu copiloto de misión')}</span></div><p role="status" aria-live="polite">{line}</p></div>
  </div>;
}
