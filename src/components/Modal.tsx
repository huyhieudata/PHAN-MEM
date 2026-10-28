import { useEffect } from 'react';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <header>
          <b>{title}</b>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </header>
        {children}
      </div>
    </div>
  );
}
