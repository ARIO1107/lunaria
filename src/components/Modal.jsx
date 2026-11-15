import { useEffect, useRef } from 'react';
import { t } from '../i18n/translate.js';

export default function Modal({ title, children, onClose, wide = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={['modal', wide && 'modal-wide', className].filter(Boolean).join(' ')} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="modal-header"><h2 id="modal-title">{title}</h2><button className="quiet-button" onClick={onClose} aria-label={t('Cerrar panel')}>{t('Cerrar')} <kbd>Esc</kbd></button></header>
    {children}
  </dialog>;
}
