import { useMemo, useState } from 'react';
import { EMPLOYEES, plain } from '../data/employees';
const STATUSES = ['Tất cả', 'Đang làm việc', 'Tạm nghỉ', 'Đã nghỉ việc'];
const fmt = (d: string) => d.split('-').reverse().join('/');
const cls = (s: string) => s === 'Đang làm việc' ? 'ok' : s === 'Tạm nghỉ' ? 'warn' : 'bad';
export default function EmployeeList() {
  const [status, setStatus] = useState('Đang làm việc');
  const [q, setQ] = useState('');
  const [showF, setShowF] = useState(false);
  const [unit, setUnit] = useState(''); const [branch, setBranch] = useState('');
  const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const [toast, setToast] = useState('');
  const units = [...new Set(EMPLOYEES.map(e => e.unit))]; const branches = [...new Set(EMPLOYEES.map(e => e.branch))];
  const rows = useMemo(() => EMPLOYEES.filter(e =>
    (status === 'Tất cả' || e.status === status) && (!unit || e.unit === unit) && (!branch || e.branch === branch) &&
    (!q || plain([e.name, e.code, e.phone, e.email].join(' ')).includes(plain(q)))), [status, q, unit, branch]);
  const pages = Math.max(1, Math.ceil(rows.length / size)); const p = Math.min(page, pages);
  const view = rows.slice((p - 1) * size, p * size);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };
  return (
    <div className="card panel">
      <div className="toolbar">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <div className="in-search">🔍<input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Tìm theo tên, mã, SĐT, email" /></div>
        <button className={'btn-ghost' + (showF ? ' on' : '')} onClick={() => setShowF(!showF)}>⚲ Bộ lọc</button>
        <div className="grow" />
        <button className="btn-ghost" onClick={() => flash('Đã xuất ' + rows.length + ' nhân sự (demo)')}>⤓ Export</button>
        <button className="btn-ghost" onClick={() => flash('Import: chức năng demo')}>⤒ Import</button>
        <button className="btn-primary" onClick={() => flash('Mở form thêm nhân sự (demo)')}>+ Thêm mới</button>
      </div>
      {showF && <div className="filters">
        <select value={unit} onChange={e => { setUnit(e.target.value); setPage(1); }}><option value="">Tất cả đơn vị</option>{units.map(u => <option key={u}>{u}</option>)}</select>
        <select value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }}><option value="">Tất cả chi nhánh</option>{branches.map(u => <option key={u}>{u}</option>)}</select>
        <button className="link" onClick={() => { setUnit(''); setBranch(''); }}>Xóa bộ lọc</button>
      </div>}
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th><input type="checkbox" /></th><th>Nhân viên</th><th>Mã nhân viên</th><th>Vị trí công việc</th><th>Đơn vị</th><th>Chi nhánh</th><th>Số điện thoại</th><th>Email</th><th>Ngày đi làm</th><th>Trạng thái nhân sự</th><th>Loại hình nhân sự</th></tr></thead>
        <tbody>{view.map(e => <tr key={e.code}>
          <td><input type="checkbox" /></td>
          <td><div className="person"><div className="av sm">{e.name.split(' ').pop()![0]}</div><b>{e.name}</b></div></td>
          <td>{e.code}</td><td>{e.position}</td><td>{e.unit}</td><td>{e.branch}</td><td>{e.phone}</td><td>{e.email}</td><td>{fmt(e.start)}</td>
          <td><span className={'status ' + cls(e.status)}>{e.status}</span></td><td>{e.type}</td></tr>)}
          {!view.length && <tr><td colSpan={11} className="center muted" style={{ padding: 40 }}>Không có dữ liệu</td></tr>}
        </tbody></table></div>
      <div className="pager">
        <span className="muted">Tổng: <b>{rows.length}</b> nhân sự</span><div className="grow" />
        <select value={size} onChange={e => { setSize(+e.target.value); setPage(1); }}>{[5, 10, 20].map(n => <option key={n} value={n}>{n} / trang</option>)}</select>
        <button disabled={p === 1} onClick={() => setPage(p - 1)}>‹</button>
        {Array.from({ length: pages }, (_, i) => <button key={i} className={i + 1 === p ? 'on' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
        <button disabled={p === pages} onClick={() => setPage(p + 1)}>›</button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
