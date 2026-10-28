import { personInitial } from './Person';
import { STATUS_LABEL } from '../data/timeoff';

export function Drawer({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <div className="drawer-back" onMouseDown={onClose}>
      <aside className={'drawer' + (wide ? '' : ' narrow')} role="dialog" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <header><b>{title}</b><button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button></header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>
  );
}

export function FilterPanel({ title, onClose, onClear, children }: { title: string; onClose: () => void; onClear: () => void; children: React.ReactNode }) {
  return (
    <div className="filter-back" onMouseDown={onClose}>
      <aside className="filter-panel" onMouseDown={e => e.stopPropagation()}>
        <header><b>{title}</b><button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button></header>
        <div className="body">{children}<button className="link" onClick={onClear}>Xóa bộ lọc</button></div>
      </aside>
    </div>
  );
}

export function Applicant({ name, unit, position, code, type }: { name: string; unit?: string; position?: string; code?: string; type?: string }) {
  return (
    <div className="person">
      <div className="av sm">{personInitial(name)}</div>
      <div>
        <b>{name}</b>
        <small>{[unit, position].filter(Boolean).join(' • ')}</small>
        <div>{code && <span className="chip">{code}</span>}{type && <span className="chip">{type}</span>}</div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const tone = status === 'Đã duyệt' ? 'ok' : status === 'Từ chối' ? 'bad' : status === 'Đã hủy' || status.startsWith('Hệ thống') ? 'muted' : 'wait';
  return <span className={'pill ' + tone}><i />{label}</span>;
}
