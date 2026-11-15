export default function TitusDialogue({ mood = 'normal', children }) {
  return <div className={`titus-radio ${mood}`}>
    <div className="titus-portrait" aria-hidden="true"><span>{mood === 'danger' ? '×_×' : mood === 'alert' ? '! !' : '^ ^'}</span><i /></div>
    <div><div className="radio-name">Titus <span>Tu copiloto de misión</span></div><p role="status" aria-live="polite">{children}</p></div>
  </div>;
}
