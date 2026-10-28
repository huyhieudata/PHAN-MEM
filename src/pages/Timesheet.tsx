import { useState } from 'react';
import { useHr } from '../hooks/useHr';
// deterministic pseudo-random so the grid is stable
const rnd = (a: number, b: number) => { const x = Math.sin(a * 97 + b * 13.7) * 10000; return x - Math.floor(x); };
const LEGEND: [string, string, string][] = [['X', 'Đủ công', 'ok'], ['T', 'Đi trễ', 'warn'], ['P', 'Nghỉ phép', 'info'], ['V', 'Vắng', 'bad'], ['', 'Ngày nghỉ', 'off']];
export default function Timesheet() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const dow = (d: number) => new Date(y, m - 1, d).getDay();
  const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const state = useHr();
  const [unit, setUnit] = useState('');
  const emps = state.employees.filter(e => e.status !== 'Đã nghỉ việc' && (!unit || e.unitId === unit));
  const cell = (code: string, d: number) => {
    if (dow(d) === 0) return 'off';
    if (y > now.getFullYear() || (y === now.getFullYear() && (m - 1 > now.getMonth() || (m - 1 === now.getMonth() && d > now.getDate())))) return 'future';
    const seed = code.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const r = rnd(seed + m * 31, d); return r < 0.06 ? 'bad' : r < 0.14 ? 'warn' : r < 0.2 ? 'info' : 'ok';
  };
  const sym = { ok: 'X', warn: 'T', info: 'P', bad: 'V', off: '', future: '' } as Record<string, string>;
  return (
    <div className="card panel">
      <div className="toolbar">
        <label className="muted">Kỳ công</label><input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} />
        <select aria-label="Đơn vị" value={unit} onChange={e => setUnit(e.target.value)}><option value="">Tất cả đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="grow" />
        <div className="legend">{LEGEND.map(([s, l, c]) => <span key={l}><i className={'ts ' + c}>{s}</i>{l}</span>)}</div>
        <button className="btn-ghost">⤓ Export</button><button className="btn-primary">Tổng hợp công</button>
      </div>
      <div className="table-wrap"><table className="tbl ts-tbl">
        <thead><tr><th className="sticky">Nhân viên</th>{Array.from({ length: days }, (_, i) => <th key={i} className={dow(i + 1) === 0 ? 'sun' : ''}>{i + 1}<small>{wd[dow(i + 1)]}</small></th>)}<th>Công</th></tr></thead>
        <tbody>{emps.map(e => {
          const cs = Array.from({ length: days }, (_, d) => cell(e.code, d + 1));
          const total = cs.filter(c => c === 'ok' || c === 'warn' || c === 'info').length;
          return <tr key={e.code}><td className="sticky"><b>{e.fullName}</b><small className="muted"> {e.code}</small></td>
            {cs.map((c, d) => <td key={d}><i className={'ts ' + c}>{sym[c]}</i></td>)}<td><b>{total}</b></td></tr>;
        })}</tbody></table></div>
    </div>
  );
}
