import { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={wide ? 'modal modal-wide' : 'modal'} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="modal-header"><h2 id="modal-title">{title}</h2><button className="quiet-button" onClick={onClose} aria-label="Cerrar panel">Cerrar <kbd>Esc</kbd></button></header>
    {children}
  </dialog>;
}
