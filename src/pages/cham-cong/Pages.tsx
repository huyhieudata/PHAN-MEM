import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../components/Charts';
import { Applicant, Drawer, FilterPanel } from '../../components/Drawer';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextInput } from '../../components/Fields';
import { useToast } from '../../components/feedback';
import { dayCell, daysInMonth, monthCells, monthIso } from '../../data/attendance';
import { hr } from '../../data/repositories';
import type { FraudAlert, Holiday, PunchMethod, WorkShift } from '../../data/types';
import { fmtDate, includesPlain, todayISO } from '../../data/text';
import { useLabels } from '../hr/lookups';

const VIEWS = ['Bảng công tổng hợp', 'Bảng công số giờ làm việc', 'Bảng công Chi tiết', 'Bảng công tổng hợp (Bao gồm kí hiệu đơn từ)', 'Bảng công số giờ làm việc (Bao gồm kí hiệu đơn từ)'] as const;

export function AttendanceOverview() {
  const nav = useNavigate();
  const [zoom, setZoom] = useState(1);
  const cards = [
    ['Cài đặt ca làm việc', 'Admin', '/m/cham-cong/ca-lam-viec', ['Ca hành chính, ca đơn, ca nâng cao', 'Giờ check-in/out hợp lệ']],
    ['Phân ca', 'Quản lý', '/m/cham-cong/phan-ca', ['Phân ca thủ công', 'Phân ca bằng file Excel']],
    ['Lịch làm việc', 'Nhân sự', '/m/cham-cong/lich-lam-viec', ['Xem theo giờ hoặc mã ca']],
    ['Cài đặt chấm công', 'Admin', '/m/cham-cong/cai-dat-cham-cong', ['GPS, vân tay, camera']],
    ['Chấm công', 'Nhân sự', '/m/cham-cong/du-lieu-cham-cong', ['Dữ liệu thô', 'Cảnh báo gian lận']],
    ['Bảng công', 'Quản lý', '/m/cham-cong/bang-cong', ['5 kiểu xem', 'Ký hiệu đơn từ']],
    ['Báo cáo chấm công', 'Quản lý', '/m/cham-cong/bao-cao-cham-cong', ['Đi muộn về sớm', 'Số giờ thực tế/tiêu chuẩn', 'Làm thêm giờ', 'Sửa chấm công', 'Nghỉ phép', 'Thiếu dữ liệu']],
    ['Bảng lương', 'Quản lý', '/m/tinh-luong', ['Nhận công từ bảng công']],
  ] as const;
  return (
    <div>
      <div className="toolbar"><div className="grow" /><button className="btn-ghost" onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}>−</button><button className="btn-ghost" onClick={() => setZoom(1)}>100%</button><button className="btn-ghost" onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}>+</button></div>
      <div className="flow" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {cards.map(([title, role, to, bullets]) => (
          <article key={title} className={title === 'Bảng công' ? 'on' : ''}>
            <small className="pill">{role}</small>
            <h3>{title}</h3>
            <ul>{bullets.map(item => <li key={item}>{item}</li>)}</ul>
            <button className="link" onClick={() => nav(to)}>Mở</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function TimesheetPage() {
  const labels = useLabels();
  const { state } = labels;
  const now = new Date();
  const [tab, setTab] = useState<'default' | 'custom'>('default');
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [mode, setMode] = useState<(typeof VIEWS)[number]>(VIEWS[0]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [custom, setCustom] = useState(false);
  const [y, m] = month.split('-').map(Number);
  const days = daysInMonth(y, m);
  const people = state.employees.filter(emp => includesPlain([emp.fullName, emp.code].join(' '), q) && (!unitId || emp.unitId === unitId) && (!positionId || emp.positionId === positionId) && (!employeeId || emp.id === employeeId) && (!branchId || emp.branchId === branchId));
  const templates = state.timesheetTemplates.filter(item => item.active);
  return (
    <div className="card panel">
      <div className="tabs-line">
        <button className={tab === 'default' ? 'on' : ''} onClick={() => setTab('default')}>Bảng công mặc định</button>
        <button className={tab === 'custom' ? 'on' : ''} onClick={() => setTab('custom')}>Bảng công tùy chỉnh <span className="pill">MỚI</span></button>
      </div>
      {tab === 'custom' && !templates.length && <div className="empty"><b>Bạn chưa cài đặt mẫu bảng công tùy chỉnh</b><button className="btn-primary" onClick={() => setCustom(true)}>Thêm mới bảng công</button></div>}
      {(tab === 'default' || templates.length > 0) && <>
        <div className="toolbar">
          <div className="in-search">🔍<input aria-label="Tìm bảng công" placeholder="Tên, mã nhân viên" value={q} onChange={e => setQ(e.target.value)} /></div>
          <button className="btn-ghost" onClick={() => setRangeOpen(true)}>{m}/{y}</button>
          <button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>
          <span className="muted">Kiểu xem</span>
          <Select aria-label="Kiểu xem" value={mode} onChange={e => setMode(e.target.value as typeof mode)}>{VIEWS.map(item => <option key={item}>{item}</option>)}</Select>
          <button className="icon-btn" title="Tải lên dữ liệu" aria-label="Tải lên dữ liệu">⤒</button>
          <button className="icon-btn" title="Lịch sử cập nhật dữ liệu chấm công" aria-label="Lịch sử cập nhật">☰</button>
          <button className="icon-btn" aria-label="Làm mới" onClick={() => setQ('')}>↻</button>
          <button className="btn-ghost">Xuất</button>
        </div>
        <div className="legend-row">
          <span><i className="dot ok" />Chấm công đúng giờ</span>
          <span><i className="dot late" />Đi muộn / Về sớm / Quên Check out</span>
          <span><i className="dot miss" />Không chấm công</span>
          <span><i className="dot request" />Có đơn từ</span>
          <span><i className="dot holiday" />Nghỉ lễ</span>
          <span><i className="dot error" />Có lỗi</span>
          <span><i className="dot both" />Vừa có đơn xin nghỉ vừa có chấm công</span>
        </div>
        <div className="table-wrap"><table className="tbl ts-tbl">
          <thead><tr><th className="sticky">Nhân viên</th>{Array.from({ length: days }, (_, i) => {
            const date = new Date(y, m - 1, i + 1);
            const sun = date.getDay() === 0;
            const holiday = state.holidays.some(item => item.startDate <= monthIso(y, m, i + 1) && item.endDate >= monthIso(y, m, i + 1));
            const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
            return <th key={i} className={sun || holiday ? 'sun' : ''}>{wd} {String(i + 1).padStart(2, '0')}/{String(m).padStart(2, '0')}</th>;
          })}</tr></thead>
          <tbody>{people.map(emp => {
            const cells = monthCells(state, emp.id, y, m);
            return <tr key={emp.id}><td className="sticky"><Applicant name={emp.fullName} code={emp.code} type={emp.status === 'Đã nghỉ việc' ? 'Nghỉ việc' : emp.employmentType} unit={labels.unit(emp.unitId)} position={labels.position(emp.positionId)} /></td>
              {cells.map(cell => <td key={cell.date} title={cell.title}><span className={'cell-num'}><i className={'dot ' + (cell.kind === 'ok' ? 'ok' : cell.kind === 'late' ? 'late' : cell.kind === 'request' ? 'request' : cell.kind === 'holiday' ? 'holiday' : cell.kind === 'both' ? 'both' : cell.kind === 'error' ? 'error' : 'miss')} />{cellText(mode, cell)}</span></td>)}
            </tr>;
          })}</tbody>
        </table></div>
      </>}
      {rangeOpen && <RangeModal month={month} onClose={() => setRangeOpen(false)} onOk={value => { setMonth(value); setRangeOpen(false); }} />}
      {filter && <FilterPanel title="BỘ LỌC" onClose={() => setFilter(false)} onClear={() => { setUnitId(''); setPositionId(''); setEmployeeId(''); setBranchId(''); }}>
        <Field label="CHỌN ĐƠN VỊ"><Select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
        <Field label="VỊ TRÍ"><Select value={positionId} onChange={e => setPositionId(e.target.value)}><option value="">Tất cả</option>{state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="NHÂN VIÊN"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Tất cả</option>{state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
        <Field label="CHI NHÁNH CHẤM CÔNG"><Select value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Tất cả</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      </FilterPanel>}
      {custom && <TemplateModal onClose={() => setCustom(false)} />}
    </div>
  );
}

function cellText(mode: (typeof VIEWS)[number], cell: ReturnType<typeof dayCell>) {
  if (cell.kind === 'off') return '-';
  if (mode.startsWith('Bảng công số giờ')) return cell.kind === 'request' && mode.includes('kí hiệu') ? cell.text : cell.hours ? String(cell.hours) : cell.text;
  if (mode === 'Bảng công Chi tiết') return cell.title || cell.text;
  return cell.text;
}

function RangeModal({ month, onClose, onOk }: { month: string; onClose: () => void; onOk: (value: string) => void }) {
  const [kind, setKind] = useState<'month' | 'custom'>('month');
  const [value, setValue] = useState(month);
  return (
    <div className="modal-back" onMouseDown={onClose}><div className="modal" role="dialog" aria-label="Chọn khoảng thời gian" onMouseDown={e => e.stopPropagation()}>
      <header><b>Chọn khoảng thời gian</b></header>
      <div className="body">
        <label className="chk"><input type="radio" checked={kind === 'month'} onChange={() => setKind('month')} /> Theo tháng công</label>
        <label className="chk"><input type="radio" checked={kind === 'custom'} onChange={() => setKind('custom')} /> Tuỳ chỉnh</label>
        <Field label="Tháng"><TextInput type="month" value={value} onChange={e => setValue(e.target.value)} /></Field>
        <p className="muted">{kind === 'custom' ? 'Khoảng ngày tùy ý chưa có quy tắc trong ghi chú, đang chọn theo tháng.' : `Tháng ${value}`}</p>
        <div className="form-actions"><button className="btn-ghost" onClick={onClose}>HỦY BỎ</button><button className="btn-primary" onClick={() => onOk(value)}>XÁC NHẬN</button></div>
      </div>
    </div></div>
  );
}

function TemplateModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <div className="modal-back" onMouseDown={onClose}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveTemplate({ name, description, active: true }); if (!r.ok) { toast(r.errors.name); return; } toast('Đã thêm mẫu'); onClose(); }}>
      <header><b>Thêm mới bảng công</b></header>
      <div className="body"><Field label="Tên mẫu"><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Mô tả"><TextInput value={description} onChange={e => setDescription(e.target.value)} /></Field></div>
      <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
    </form></div>
  );
}

export function RawAttendancePage() {
  const labels = useLabels();
  const { state } = labels;
  const [tab, setTab] = useState<'raw' | 'fraud'>('raw');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState(todayISO().slice(0, 8) + '01');
  const [to, setTo] = useState(todayISO());
  const [filter, setFilter] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [method, setMethod] = useState('');
  const [machine, setMachine] = useState('');
  const [branchId, setBranchId] = useState('');
  const [adding, setAdding] = useState(false);
  const [level, setLevel] = useState('');
  const [kind, setKind] = useState('');
  const [conclusion, setConclusion] = useState('Chờ xử lý');
  const punches = state.punches.filter(p => {
    const day = p.at.slice(0, 10);
    const person = labels.employee(p.employeeId);
    return day >= from && day <= to && includesPlain([person?.fullName ?? '', person?.code ?? ''].join(' '), q) && (!employeeId || p.employeeId === employeeId) && (!method || p.method === method) && (!machine || p.machine === machine) && (!branchId || p.branchId === branchId);
  });
  const alerts = state.fraudAlerts.filter(a => includesPlain(labels.employee(a.employeeId)?.fullName ?? '', q) && (!level || a.level === level) && (!kind || a.kind === kind) && (!conclusion || a.conclusion === conclusion));
  const recent = state.fraudAlerts.filter(a => a.at.slice(0, 10) >= addDays(todayISO(), -30));
  return (
    <div className="card panel">
      <div className="tabs-line">
        <button className={tab === 'raw' ? 'on' : ''} onClick={() => setTab('raw')}>Dữ liệu chấm công</button>
        <button className={tab === 'fraud' ? 'on' : ''} onClick={() => setTab('fraud')}>Cảnh báo gian lận</button>
      </div>
      {tab === 'raw' && <>
        <div className="toolbar">
          <div className="in-search">🔍<input aria-label="Tìm chấm công" placeholder="Tìm theo tên, mã nhân viên" value={q} onChange={e => setQ(e.target.value)} /></div>
          <TextInput aria-label="Từ ngày" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <TextInput aria-label="Đến ngày" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>
          <button className="btn-ghost">Xuất Excel</button>
          <button className="btn-primary" onClick={() => setAdding(true)}>+ Thêm dữ liệu chấm công</button>
        </div>
        <DataTable rows={punches.map(p => ({ ...p }))} columns={punchColumns(labels)} filterKey={`${q}|${from}|${to}|${method}|${machine}|${branchId}|${employeeId}`} />
      </>}
      {tab === 'fraud' && <>
        <div className="kpis">
          <div className="kpi"><small>Tổng cảnh báo 30 ngày gần nhất</small><b>{recent.length}</b></div>
          <div className="kpi"><small>Mức cao – Cần xử lý trước</small><b>{recent.filter(a => a.level === 'Cao').length}</b></div>
          <div className="kpi"><small>Mức vừa – Rà theo lô</small><b>{recent.filter(a => a.level === 'Vừa').length}</b></div>
          <div className="kpi"><small>Chưa thẩm tra – Đang chờ HR kết luận</small><b>{recent.filter(a => a.conclusion === 'Chờ xử lý').length}</b></div>
        </div>
        <div className="banner">HR kết luận từng cảnh báo: Hợp lệ / Vi phạm / Bỏ qua.</div>
        <div className="toolbar">
          <div className="in-search">🔍<input aria-label="Tìm cảnh báo" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhân sự" /></div>
          <Select aria-label="Mức độ" value={level} onChange={e => setLevel(e.target.value)}><option value="">Mức độ</option><option>Cao</option><option>Vừa</option><option>Thấp</option></Select>
          <Select aria-label="Loại luật" value={kind} onChange={e => setKind(e.target.value)}><option value="">Loại luật</option>{[...new Set(state.fraudAlerts.map(a => a.kind))].map(item => <option key={item}>{item}</option>)}</Select>
          <Select aria-label="Trạng thái kết luận" value={conclusion} onChange={e => setConclusion(e.target.value)}><option value="">Tất cả</option><option>Chờ xử lý</option><option>Hợp lệ</option><option>Vi phạm</option><option>Bỏ qua</option></Select>
          <button className="btn-ghost">Xuất Excel</button>
        </div>
        <DataTable rows={alerts} columns={fraudColumns(labels)} filterKey={`${q}|${level}|${kind}|${conclusion}`} />
      </>}
      {filter && <FilterPanel title="Tìm kiếm nâng cao" onClose={() => setFilter(false)} onClear={() => { setEmployeeId(''); setMethod(''); setMachine(''); setBranchId(''); }}>
        <Field label="Nhân viên"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Tất cả</option>{state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
        <Field label="Hình thức chấm công"><Select value={method} onChange={e => setMethod(e.target.value)}><option value="">Tất cả</option>{['GPS', 'Vân tay', 'Hình ảnh có vị trí', 'Tracker', 'Hanet Camera'].map(item => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Máy chấm công"><Select value={machine} onChange={e => setMachine(e.target.value)}><option value="">Tất cả</option>{[...new Set(state.punches.map(p => p.machine))].map(item => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Chi nhánh"><Select value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Tất cả</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      </FilterPanel>}
      {adding && <AddPunch onClose={() => setAdding(false)} />}
    </div>
  );
}

function punchColumns(labels: ReturnType<typeof useLabels>): Column<HrStatePunch>[] {
  return [
    { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName ?? '—' },
    { id: 'at', header: 'Thời gian chấm công', sort: r => r.at, cell: r => r.at.replace('T', ' ').slice(0, 16) },
    { id: 'code', header: 'Mã chấm công', sort: r => r.code, cell: r => r.code },
    { id: 'method', header: 'Hình thức chấm công', cell: r => <span className="pill">{r.method}</span> },
    { id: 'machine', header: 'Máy chấm công', cell: r => r.machine },
    { id: 'device', header: 'Thiết bị chấm công', cell: r => r.device },
    { id: 'ip', header: 'IP chấm công', cell: r => r.ip },
    { id: 'gps', header: 'Định vị GPS', cell: r => r.gps },
    { id: 'img', header: 'Hình ảnh chấm công', cell: () => <span className="chip">Ảnh</span> },
    { id: 'actor', header: 'Tác nhân', cell: r => r.actor },
    { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deletePunch(r.id)}>⋯ Xóa</button> },
  ];
}
type HrStatePunch = ReturnType<typeof useLabels>['state']['punches'][number];

function fraudColumns(labels: ReturnType<typeof useLabels>): Column<FraudAlert>[] {
  return [
    { id: 'at', header: 'Thời gian', sort: r => r.at, cell: r => r.at.replace('T', ' ').slice(0, 16) },
    { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName ?? '—' },
    { id: 'kind', header: 'Loại bất thường', cell: r => r.kind },
    { id: 'level', header: 'Mức độ', cell: r => r.level },
    { id: 'detail', header: 'Chi tiết phân tích', cell: r => r.detail },
    { id: 'con', header: 'Kết luận', cell: r => r.conclusion },
    { id: 'act', header: 'Thao tác', cell: r => <Select aria-label="Kết luận" value={r.conclusion} onChange={e => hr.setFraudConclusion(r.id, e.target.value as FraudAlert['conclusion'])}><option>Chờ xử lý</option><option>Hợp lệ</option><option>Vi phạm</option><option>Bỏ qua</option></Select> },
  ];
}

function AddPunch({ onClose }: { onClose: () => void }) {
  const { state } = useLabels();
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('08:30');
  const [branchId, setBranchId] = useState(state.branches[0]?.id ?? '');
  function save() {
    const result = hr.savePunch({ employeeId, at: `${date}T${time}:00`, code: 'CC-TAY', method: 'GPS' as PunchMethod, machine: 'Nhập tay', device: 'Web', ip: '', gps: '', branchId, actor: 'HR' });
    if (!result.ok) { toast(result.errors.form); return; }
    toast('Đã thêm dữ liệu chấm công');
    onClose();
  }
  return (
    <Drawer title="Thêm dữ liệu chấm công" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary" onClick={save}>Lưu</button></>}>
      <div className="form-grid">
        <Field label="Nhân viên" required><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Chọn</option>{state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
        <Field label="Ngày chấm công" required><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Giờ chấm công" required><TextInput type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
        <Field label="Chi nhánh"><Select value={branchId} onChange={e => setBranchId(e.target.value)}>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      </div>
    </Drawer>
  );
}

export function SchedulePage() {
  const labels = useLabels();
  const { state } = labels;
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [codes, setCodes] = useState(false);
  const [q, setQ] = useState('');
  const [unitId, setUnitId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [manual, setManual] = useState(false);
  const [y, m] = month.split('-').map(Number);
  const days = daysInMonth(y, m);
  const people = state.employees.filter(e => e.status !== 'Đã nghỉ việc' && includesPlain([e.fullName, e.code].join(' '), q) && (!unitId || e.unitId === unitId) && (!branchId || e.branchId === branchId));
  return (
    <div className="card panel">
      <div className="toolbar">
        <span className="muted">Kiểu xem</span>
        <button className={'btn-ghost btn-sm' + (!codes ? ' on' : '')} onClick={() => setCodes(false)}>08:30 - 17:30</button>
        <button className={'btn-ghost btn-sm' + (codes ? ' on' : '')} onClick={() => setCodes(true)}>Xem theo mã ca</button>
        <button className="icon-btn" aria-label="Làm mới">↻</button>
        <button className="btn-ghost">Xuất Excel</button>
        <div className="grow" />
        <button className="btn-primary" onClick={() => setManual(true)}>Phân ca ▾</button>
      </div>
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm lịch" value={q} onChange={e => setQ(e.target.value)} placeholder="Tên, mã" /></div>
        <span className="pill">Đang hoạt động</span>
        <Select aria-label="Đơn vị, vị trí công việc" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Đơn vị, vị trí công việc</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <TextInput aria-label="Kì công" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <Select aria-label="Chi nhánh chấm công" value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Chi nhánh chấm công</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        <label className="chk"><input type="checkbox" /> Đối tượng được bảo vệ</label>
      </div>
      <div className="legend-row"><span className="shift-pill">Ca đêm</span></div>
      <div className="table-wrap"><table className="tbl ts-tbl"><thead><tr><th className="sticky">Áp dụng</th>{Array.from({ length: days }, (_, i) => <th key={i} className={new Date(y, m - 1, i + 1).getDay() === 0 ? 'sun' : ''}>{i + 1}</th>)}</tr></thead>
        <tbody>{people.slice(0, 10).map(emp => <tr key={emp.id}><td className="sticky">{emp.code} – {emp.fullName}<small className="muted"> {labels.position(emp.positionId)}</small></td>
          {Array.from({ length: days }, (_, i) => {
            const date = monthIso(y, m, i + 1);
            const shift = state.shifts.find(s => s.id === state.assignments.find(a => a.employeeId === emp.id && a.date === date)?.shiftId);
            return <td key={date}>{shift ? <span className="shift-pill">{codes ? shift.code : `${shift.start} - ${shift.end}`}</span> : ''}</td>;
          })}
        </tr>)}</tbody></table></div>
      <p className="hint">Hiển thị 1-{Math.min(10, people.length)} / {people.length} Bản ghi</p>
      {manual && <ManualAssign month={month} onClose={() => setManual(false)} />}
    </div>
  );
}

function ManualAssign({ month, onClose }: { month: string; onClose: () => void }) {
  const { state } = useLabels();
  const toast = useToast();
  const [title, setTitle] = useState('Phân ca thủ công');
  const [employeeId, setEmployeeId] = useState(state.employees[0]?.id ?? '');
  const [date, setDate] = useState(month + '-01');
  const [shiftId, setShiftId] = useState(state.shifts[0]?.id ?? '');
  const [excel, setExcel] = useState(false);
  return (
    <Drawer title="Phân ca" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Đóng</button><button className="btn-primary" onClick={() => { hr.saveShiftPlan({ title, scope: 'Nhân sự đã chọn', startDate: date, endDate: date }); hr.assignShift(employeeId, date, shiftId); toast('Đã phân ca'); onClose(); }}>Lưu</button></>}>
      <div className="seg"><button className={!excel ? 'on' : ''} onClick={() => setExcel(false)}>Phân ca thủ công</button><button className={excel ? 'on' : ''} onClick={() => setExcel(true)}>Phân ca bằng file Excel</button></div>
      {!excel ? <div className="form-grid">
        <Field label="Tiêu đề"><TextInput value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Nhân viên"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>{state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
        <Field label="Ngày"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Ca"><Select value={shiftId} onChange={e => setShiftId(e.target.value)}>{state.shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
      </div> : <p>Định dạng file Excel không có trong ghi chú khảo sát. Không nhập file cho đến khi có mẫu cột.</p>}
    </Drawer>
  );
}

export function ShiftDayPage() {
  const labels = useLabels();
  const { state } = labels;
  const [cursor, setCursor] = useState(todayISO());
  const [unitId, setUnitId] = useState('');
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('');
  const date = new Date(cursor);
  const label = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const people = state.employees.filter(e => e.status !== 'Đã nghỉ việc' && (!unitId || e.unitId === unitId));
  function statusOf(id: string) {
    const cell = dayCell(state, id, cursor);
    if (cell.kind === 'request' && cell.text === 'P') return 'Nghỉ phép';
    if (cell.text.includes('WFH')) return 'WFH';
    if (cell.kind === 'miss') return 'Nghỉ không phép';
    if (cell.kind === 'late') return 'Đi làm';
    if (cell.kind === 'ok') return 'Đi làm';
    return 'Chờ duyệt';
  }
  const counts = {
    work: people.filter(e => statusOf(e.id) === 'Đi làm').length,
    leave: people.filter(e => statusOf(e.id) === 'Nghỉ phép').length,
    wfh: people.filter(e => statusOf(e.id) === 'WFH').length,
    absent: people.filter(e => statusOf(e.id) === 'Nghỉ không phép').length,
    wait: people.filter(e => state.requests.some(r => r.employeeId === e.id && (r.status === 'Chờ duyệt' || r.status === 'Đang duyệt') && r.startDate <= cursor && r.endDate >= cursor)).length,
  };
  const unassigned = people.filter(e => !state.assignments.some(a => a.employeeId === e.id && a.date === cursor)).length;
  const days = daysInMonth(date.getFullYear(), date.getMonth() + 1);
  return (
    <div>
      <div className="toolbar card flat">
        <button className="btn-ghost" onClick={() => setCursor(addDays(cursor, -1))}>‹</button>
        <b>{label}</b>
        <button className="btn-ghost" onClick={() => setCursor(addDays(cursor, 1))}>›</button>
        <button className="btn-ghost" onClick={() => setCursor(todayISO())}>Hôm nay</button>
        <Select aria-label="Đơn vị" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <div className="grow" /><button className="btn-primary">Phân ca</button>
      </div>
      <div className="seg" style={{ margin: '8px 0' }}>{Array.from({ length: days }, (_, i) => {
        const iso = monthIso(date.getFullYear(), date.getMonth() + 1, i + 1);
        return <button key={iso} className={iso === cursor ? 'on' : ''} onClick={() => setCursor(iso)}>{i + 1}</button>;
      })}</div>
      <div className="kpis">
        <div className="kpi"><small>Tổng NV</small><b>{people.length}</b></div>
        <div className="kpi"><small>Đi làm</small><b>{counts.work}</b><small>{people.length ? Math.round(counts.work / people.length * 100) : 0}% tổng</small></div>
        <div className="kpi"><small>Nghỉ phép</small><b>{counts.leave}</b></div>
        <div className="kpi"><small>WFH</small><b>{counts.wfh}</b></div>
        <div className="kpi"><small>Nghỉ không phép</small><b style={{ color: '#B91C1C' }}>{counts.absent}</b></div>
        <div className="kpi"><small>Nghỉ không tính công</small><b>0</b></div>
        <div className="kpi"><small>Chờ duyệt</small><b>{counts.wait}</b></div>
      </div>
      {counts.absent > 0 && <div className="banner bad">{counts.absent} nhân sự — Nghỉ không phép trong ngày đang xem. Xuất chưa có mẫu cột.</div>}
      {unassigned > 0 && <div className="banner">{unassigned} nhân sự — Chưa được phân ca hôm nay.</div>}
      {state.shifts.filter(s => s.active).map(shift => {
        const assigned = people.filter(e => state.assignments.some(a => a.employeeId === e.id && a.date === cursor && a.shiftId === shift.id) && includesPlain([e.fullName, e.code].join(' '), q) && (!chip || statusOf(e.id) === chip || (chip === 'Đi muộn' && dayCell(state, e.id, cursor).kind === 'late')));
        return (
          <section className="card panel" key={shift.id}>
            <div className="toolbar"><b>{shift.name} {shift.start} – {shift.end}</b></div>
            <div className="toolbar">
              <div className="in-search">🔍<input aria-label="Tìm trong ca" placeholder="Tên hoặc mã nhân viên…" value={q} onChange={e => setQ(e.target.value)} /></div>
              {['Đi làm', 'Nghỉ phép', 'WFH', 'Nghỉ không phép', 'Nghỉ KTC', 'Chờ duyệt', 'Đi muộn', 'Về sớm'].map(item => <button key={item} className={'btn-ghost btn-sm' + (chip === item ? ' on' : '')} onClick={() => setChip(chip === item ? '' : item)}>{item}</button>)}
            </div>
            <DataTable rows={assigned.map(e => ({ ...e }))} columns={[
              { id: 'name', header: 'Nhân viên', cell: e => e.fullName },
              { id: 'pos', header: 'Đơn vị / vị trí', cell: e => `${labels.unit(e.unitId)} / ${labels.position(e.positionId)}` },
              { id: 'st', header: 'Trạng thái', cell: e => statusOf(e.id) },
              { id: 'late', header: 'Đi muộn', cell: e => dayCell(state, e.id, cursor).kind === 'late' ? <span style={{ color: '#B91C1C' }}>-2 phút</span> : '—' },
              { id: 'early', header: 'Về sớm', cell: () => '—' },
              { id: 'note', header: 'Ghi chú', cell: () => '' },
              { id: 'hours', header: 'Giờ làm', cell: e => dayCell(state, e.id, cursor).hours || '—' },
              { id: 'act', header: 'Thao tác', cell: e => <button className="btn-ghost btn-sm" onClick={() => hr.assignShift(e.id, cursor, state.shifts.find(s => s.id !== shift.id)?.id ?? shift.id)}>Đổi ca</button> },
            ]} empty="Không có nhân sự trong ca" />
          </section>
        );
      })}
    </div>
  );
}

export function WorkdaySettings() {
  const { state } = useLabels();
  const toast = useToast();
  const [form, setForm] = useState(state.workdayConfig);
  return (
    <form className="card pad-card" onSubmit={e => { e.preventDefault(); hr.saveWorkdayConfig(form); toast('Đã lưu thay đổi'); }}>
      <h3>Cài đặt ngày công</h3>
      <label className="chk"><input type="radio" checked={form.mode === 'last'} onChange={() => setForm({ ...form, mode: 'last' })} /> Ngày cuối cùng của tháng</label>
      <label className="chk"><input type="radio" checked={form.mode === 'fixed'} onChange={() => setForm({ ...form, mode: 'fixed' })} /> Người dùng tự chọn ngày cố định mỗi tháng</label>
      {form.mode === 'fixed' && <Field label="Ngày"><TextInput type="number" min={1} max={28} value={form.fixedDay} onChange={e => setForm({ ...form, fixedDay: Number(e.target.value) })} /></Field>}
      <label className="chk"><input type="checkbox" checked={form.confirmFlow} onChange={e => setForm({ ...form, confirmFlow: e.target.checked })} /> Cài đặt luồng xác nhận bảng công</label>
      <div className="mini-card"><h4>Cài đặt nhắc kiểm tra công</h4><label className="chk"><input type="checkbox" checked={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.checked })} /> Bật nhắc</label></div>
      <h3>Miễn chốt công giữa các ca liên tiếp</h3>
      <button type="button" className="btn-ghost">+ Thêm mới</button>
      <table className="tbl"><thead><tr><th>Đối tượng áp dụng</th><th>Thời gian giữa các ca liên tiếp không vượt quá</th><th>Trạng thái hoạt động</th><th>Thao tác</th></tr></thead><tbody><tr><td colSpan={4} className="muted">Chưa có dòng. Ngưỡng phút không có trong ghi chú nên chưa lưu luật mới.</td></tr></tbody></table>
      <div className="form-actions"><button type="button" className="btn-ghost">Hủy bỏ</button><button className="btn-primary">Lưu thay đổi</button></div>
    </form>
  );
}

export function StandardWorkdayPage() {
  const { state } = useLabels();
  const toast = useToast();
  const [scope, setScope] = useState('Toàn công ty');
  const [days, setDays] = useState(22);
  return (
    <div className="card panel">
      <div className="toolbar">
        <TextInput aria-label="Đối tượng áp dụng" value={scope} onChange={e => setScope(e.target.value)} />
        <TextInput aria-label="Số công chuẩn" type="number" value={days} onChange={e => setDays(Number(e.target.value))} />
        <button className="btn-primary" onClick={() => { const r = hr.saveStandardWorkday({ scope, days }); toast(r.ok ? 'Đã thêm' : r.errors.form); }}>+ Thêm mới</button>
      </div>
      <DataTable rows={state.standardWorkdays.map((row, i) => ({ ...row, stt: i + 1 }))} columns={[
        { id: 'stt', header: 'STT', cell: r => r.stt },
        { id: 'scope', header: 'Đối tượng áp dụng', cell: r => r.scope },
        { id: 'days', header: 'Số công chuẩn', sort: r => r.days, cell: r => r.days },
        { id: 'c', header: 'Ngày tạo', cell: r => fmtDate(r.createdAt) },
        { id: 'u', header: 'Ngày cập nhật', cell: r => fmtDate(r.updatedAt) },
      ]} />
    </div>
  );
}

export function TemplateListPage() {
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();
  const rows = state.timesheetTemplates.filter(t => includesPlain(t.name, q));
  return (
    <div className="card panel">
      <div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm mẫu" value={q} onChange={e => setQ(e.target.value)} /></div><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm mới</button></div>
      <DataTable rows={rows} columns={[
        { id: 'name', header: 'Tên mẫu bảng công', sort: r => r.name, cell: r => r.name },
        { id: 'desc', header: 'Mô tả', cell: r => r.description },
        { id: 'st', header: 'Trạng thái hoạt động', cell: r => <input type="checkbox" checked={r.active} aria-label="Bật mẫu" onChange={e => hr.saveTemplate({ ...r, active: e.target.checked }, r.id)} /> },
        { id: 'act', header: 'Tác vụ', cell: r => <button className="icon-btn" aria-label="Sửa" onClick={() => { setName(r.name); setDescription(r.description); setOpen(true); }}>✎</button> },
      ]} filterKey={q} />
      {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveTemplate({ name, description, active: true }); if (!r.ok) return toast(r.errors.name); toast('Đã lưu mẫu'); setOpen(false); }}><header><b>Mẫu bảng công</b></header><div className="body"><Field label="Tên"><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Mô tả"><TextInput value={description} onChange={e => setDescription(e.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
    </div>
  );
}

export function ShiftListPage() {
  const { state } = useLabels();
  const [tab, setTab] = useState<'list' | 'kind'>('list');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [adding, setAdding] = useState<WorkShift['kind'] | ''>('');
  const [pick, setPick] = useState(false);
  const rows = state.shifts.filter(s => includesPlain([s.name, s.code].join(' '), q) && (!kind || s.kind === kind));
  const kindLabel = { 'hanh-chinh': 'Ca hành chính', don: 'Ca đơn', 'nang-cao': 'Ca nâng cao' };
  return (
    <div className="card panel">
      <div className="tabs-line"><button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>DANH SÁCH CA LÀM VIỆC</button><button className={tab === 'kind' ? 'on' : ''} onClick={() => setTab('kind')}>DANH SÁCH LOẠI CA LÀM VIỆC</button></div>
      {tab === 'list' ? <>
        <div className="toolbar">
          <Select aria-label="Loại ca" value={kind} onChange={e => setKind(e.target.value)}><option value="">Loại ca làm việc</option><option value="hanh-chinh">Ca hành chính</option><option value="don">Ca đơn</option><option value="nang-cao">Ca nâng cao</option></Select>
          <div className="in-search">🔍<input aria-label="Tìm ca" placeholder="Nhập tên ca làm việc, mã…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <label className="chk"><input type="checkbox" /> Chấm công theo chi nhánh</label>
          <button className="btn-ghost" title="Form cài đặt công ăn không có trong ghi chú">Cài đặt công ăn</button>
          <button className="btn-primary" onClick={() => setPick(true)}>+ THÊM MỚI</button>
        </div>
        <DataTable rows={rows} columns={[
          { id: 'st', header: 'Trạng thái', cell: r => <input type="checkbox" checked={r.active} aria-label="Bật ca" onChange={e => hr.saveShift({ ...r, active: e.target.checked }, r.id)} /> },
          { id: 'code', header: 'Mã ca làm việc', sort: r => r.code, cell: r => r.code },
          { id: 'name', header: 'Tên ca làm việc', sort: r => r.name, cell: r => r.name },
          { id: 'hours', header: 'Giờ làm việc', cell: r => `${r.start}-${r.end}` },
          { id: 'kind', header: 'Loại ca', cell: r => kindLabel[r.kind] },
          { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => setAdding(r.kind)}>Sửa ca làm việc</button> },
        ]} filterKey={`${q}|${kind}`} />
      </> : <ul>{Object.values(kindLabel).map(item => <li key={item}>{item}</li>)}</ul>}
      {pick && <div className="modal-back" onMouseDown={() => setPick(false)}><div className="modal" role="dialog" aria-label="Thêm ca làm việc" onMouseDown={e => e.stopPropagation()}><header><b>Thêm ca làm việc</b></header><div className="body">
        {(['hanh-chinh', 'don', 'nang-cao'] as const).map(value => <label key={value} className="chk"><input type="radio" name="kind" onChange={() => { setAdding(value); setPick(false); }} /> {kindLabel[value]}</label>)}
        <div className="form-actions"><button className="btn-ghost" onClick={() => setPick(false)}>Hủy bỏ</button></div>
      </div></div></div>}
      {adding && <ShiftForm kind={adding} onClose={() => setAdding('')} />}
    </div>
  );
}

function ShiftForm({ kind, onClose }: { kind: WorkShift['kind']; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [start, setStart] = useState(kind === 'hanh-chinh' ? '08:00' : '08:30');
  const [end, setEnd] = useState(kind === 'hanh-chinh' ? '17:30' : '17:30');
  const [overnight, setOvernight] = useState(false);
  const [active, setActive] = useState(true);
  const [silent, setSilent] = useState(false);
  const [lateBlock, setLateBlock] = useState(false);
  const [meal, setMeal] = useState(false);
  const [night, setNight] = useState(false);
  const [autoOt, setAutoOt] = useState(false);
  return (
    <Drawer title={kind === 'hanh-chinh' ? 'Ca hành chính' : kind === 'don' ? 'Ca đơn' : 'Ca nâng cao'} onClose={onClose} wide footer={<><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary" onClick={() => { const r = hr.saveShift({ name, code, start, end, kind, active, overnight }); if (!r.ok) { toast(r.errors.form); return; } toast('Đã lưu ca'); onClose(); }}>Lưu</button></>}>
      <div className="form-grid">
        <label className="chk span2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Trạng thái hoạt động</label>
        <Field label="Phạm vi áp dụng" required><TextInput defaultValue="Toàn công ty" /></Field>
        <Field label="Tên ca" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Mã ca" required><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field>
        <label className="chk span2"><input type="checkbox" checked={silent} onChange={e => setSilent(e.target.checked)} /> Không gửi thông báo nhắc chấm công</label>
        {kind === 'don' && <label className="chk span2"><input type="checkbox" checked={overnight} onChange={e => setOvernight(e.target.checked)} /> Ca qua đêm</label>}
        {kind === 'hanh-chinh' ? <>
          <Field label="Giờ làm việc buổi sáng"><TextInput defaultValue="08:00–12:00" /></Field>
          <Field label="Giờ Check in buổi sáng hợp lệ"><TextInput defaultValue="07:00–09:00" /></Field>
          <Field label="Giờ Check out buổi sáng hợp lệ"><TextInput defaultValue="11:00–12:30" /></Field>
          <Field label="Giờ làm việc buổi chiều"><TextInput defaultValue="13:00–17:30" /></Field>
          <Field label="Check in chiều hợp lệ"><TextInput defaultValue="12:00–14:00" /></Field>
          <Field label="Check out chiều hợp lệ"><TextInput defaultValue="16:00–18:30" /></Field>
        </> : <>
          <Field label="Giờ làm việc"><TextInput value={`${start}–${end}`} onChange={e => { const [a, b] = e.target.value.split('–'); if (a && b) { setStart(a); setEnd(b); } }} /></Field>
          <Field label="Giờ Checkin hợp lệ"><TextInput defaultValue="07:00–09:00" /></Field>
          <Field label="Giờ Checkout hợp lệ"><TextInput defaultValue="16:00–18:30" /></Field>
        </>}
        <div className="mini-card span2"><h4>Thiết lập điều kiện nghỉ</h4><p>Nghỉ cả ca làm việc</p><span className="chip">1/2 ca</span><span className="chip">1/4 ca</span>{kind === 'don' && <p>Tùy chọn giờ nghỉ</p>}</div>
        {kind === 'nang-cao' && <div className="mini-card span2"><h4>Các mốc thời gian</h4><button type="button" className="btn-ghost">Thêm mốc thời gian</button><label className="chk"><input type="checkbox" checked={overnight} onChange={e => setOvernight(e.target.checked)} /> Ca qua đêm</label><label className="chk"><input type="checkbox" /> Cho phép Checkin từ ngày hôm trước</label><h4>Thông tin tính công</h4><p className="muted">Số công ghi nhận thực tế, số phút đi muộn, số phút về sớm, số giờ làm. Ngôn ngữ công thức không có trong ghi chú nên không chạy kiểm tra.</p><button type="button" className="btn-ghost">Thêm chỉ số</button><button type="button" className="btn-ghost">Kiểm tra</button></div>}
        <div className="mini-card span2"><h4>Cài đặt thêm</h4>
          <label className="chk"><input type="checkbox" checked={lateBlock} onChange={e => setLateBlock(e.target.checked)} /> Số phút đi muộn</label>
          <label className="chk"><input type="radio" name="late" /> Tính theo số phút</label>
          <label className="chk"><input type="radio" name="late" /> Tính theo block</label>
          <label className="chk"><input type="checkbox" /> Số phút về sớm</label>
          <label className="chk"><input type="checkbox" checked={meal} onChange={e => setMeal(e.target.checked)} /> Tính công ăn</label>
          <label className="chk"><input type="checkbox" checked={night} onChange={e => setNight(e.target.checked)} /> Tính công đêm</label>
          <label className="chk"><input type="checkbox" checked={autoOt} onChange={e => setAutoOt(e.target.checked)} /> Tự động tạo đơn tăng ca</label>
          <Field label="Số công ghi nhận"><TextInput defaultValue="1" /></Field>
          <Field label="Số công nếu quên Check out"><TextInput defaultValue="0" /></Field>
          <Field label="Số giờ làm việc tiêu chuẩn"><TextInput defaultValue="8" /></Field>
          <p className="muted">Các ô giờ chi tiết đang lưu cùng ca qua giờ bắt đầu/kết thúc. Công thức block chưa được mô tả nên không tính.</p>
        </div>
      </div>
    </Drawer>
  );
}

export function ShiftPlanPage({ kip }: { kip?: boolean }) {
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'person' | 'kip'>(kip ? 'kip' : 'person');
  const rows = state.shiftPlans.filter(p => includesPlain(p.title, q));
  return (
    <div className="card panel">
      <div className="tabs-line"><button className={tab === 'person' ? 'on' : ''} onClick={() => setTab('person')}>DANH SÁCH PHÂN CA THEO NHÂN SỰ</button><button className={tab === 'kip' ? 'on' : ''} onClick={() => setTab('kip')}>DANH SÁCH PHÂN CA THEO KÍP</button></div>
      {tab === 'kip' ? <div className="empty"><b>Chưa có cột cho phân ca theo kíp</b><small>Ghi chú chỉ nêu tên tab, không nêu cột.</small></div> : <>
        <div className="toolbar">
          <div className="in-search">🔍<input aria-label="Tiêu đề" placeholder="Tiêu đề" value={q} onChange={e => setQ(e.target.value)} /></div>
          <span className="muted">Đối tượng áp dụng</span><span className="muted">Ngày tạo</span>
          <button className="btn-ghost" title="Form đổi ca không có trong ghi chú">Cài đặt đổi ca</button>
          <button className="btn-primary" onClick={() => setOpen(true)}>THÊM MỚI ▾</button>
        </div>
        <DataTable rows={rows} columns={[
          { id: 'title', header: 'Tiêu đề', sort: r => r.title, cell: r => r.title },
          { id: 'scope', header: 'Đối tượng áp dụng', cell: r => r.scope },
          { id: 'when', header: 'Thời gian áp dụng', cell: r => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
          { id: 'created', header: 'Ngày tạo', sort: r => r.createdAt, cell: r => fmtDate(r.createdAt) },
        ]} filterKey={q} />
      </>}
      {open && <ManualAssign month={todayISO().slice(0, 7)} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function HolidayPage() {
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'list' | 'year'>('list');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Holiday, 'id'>>({ name: '', startDate: '', endDate: '', scope: 'Toàn công ty' });
  const toast = useToast();
  const rows = state.holidays.filter(h => includesPlain(h.name, q)).map((h, i) => ({ ...h, stt: i + 1 }));
  return (
    <div className="card panel">
      <div className="tabs-line"><button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>Lịch nghỉ lễ</button><button className={tab === 'year' ? 'on' : ''} onClick={() => setTab('year')}>Ngày lễ hàng năm</button></div>
      <div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm ngày lễ" value={q} onChange={e => setQ(e.target.value)} /></div><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm mới</button></div>
      <DataTable rows={rows} columns={[
        { id: 'stt', header: 'STT', cell: r => r.stt },
        { id: 'name', header: 'Tên ngày lễ', sort: r => r.name, cell: r => r.name },
        { id: 'when', header: 'Ngày nghỉ lễ', cell: r => `${fmtDate(r.startDate)}${r.endDate !== r.startDate ? ' – ' + fmtDate(r.endDate) : ''}` },
        { id: 'scope', header: 'Đối tượng áp dụng', cell: r => r.scope },
        { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteHoliday(r.id)}>Xóa</button> },
      ]} filterKey={q + tab} />
      {open && <Drawer title="Thêm mới lịch nghỉ lễ" onClose={() => setOpen(false)} footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>HỦY BỎ</button><button className="btn-primary" onClick={() => { const r = hr.saveHoliday(form); if (!r.ok) { toast(r.errors.form); return; } toast('Đã thêm ngày lễ'); setOpen(false); }}>THÊM MỚI</button></>}>
        <Field label="Tên ngày lễ"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Ngày nghỉ lễ"><TextInput type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: e.target.value })} /></Field>
        <Field label="Đối tượng áp dụng"><Select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}><option>Toàn công ty</option><option>Đơn vị</option><option>Vị trí công việc</option><option>Nhân viên</option></Select></Field>
      </Drawer>}
    </div>
  );
}

export function OpenShiftPage() {
  const { state } = useLabels();
  const nav = useNavigate();
  if (!state.openShiftEnabled) return <div className="card empty"><b>Ca mở hiện không khả dụng</b><small>Cài đặt tại Cấu hình lịch làm việc để có thể sử dụng Ca mở</small><button className="btn-primary" onClick={() => nav('/m/cham-cong/cau-hinh-lich-lam-viec')}>Cài đặt Ca mở</button></div>;
  return <div className="card pad-card"><h3>Ca mở</h3><p>Ca mở đang bật. Danh sách ca mở chưa có cột trong ghi chú.</p></div>;
}

export function ScheduleConfigPage() {
  const { state } = useLabels();
  const toast = useToast();
  return (
    <div className="card pad-card">
      <h3>Cấu hình lịch làm việc</h3>
      <label className="chk"><input type="checkbox" checked={state.openShiftEnabled} onChange={e => { hr.setOpenShift(e.target.checked); toast(e.target.checked ? 'Đã bật ca mở' : 'Đã tắt ca mở'); }} /> Cho phép ca mở</label>
      <p className="muted">Các mục cấu hình khác của trang này không có trong ghi chú khảo sát.</p>
    </div>
  );
}

export function AttendanceMethodPage() {
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [methods, setMethods] = useState('Điện thoại GPS');
  const [scope, setScope] = useState('Toàn công ty');
  const toast = useToast();
  const rows = state.attendanceMethods.filter(m => includesPlain(m.name, q)).map((m, i) => ({ ...m, stt: i + 1 }));
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm cài đặt" placeholder="Nhập tên cài đặt" value={q} onChange={e => setQ(e.target.value)} /></div>
        <span className="muted">Hình thức chấm công</span><span className="muted">Đối tượng áp dụng</span><span className="muted">Chấm công theo chi nhánh</span>
        <label className="chk"><input type="checkbox" /> Chấm công V2</label>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm mới</button>
      </div>
      <DataTable rows={rows} columns={[
        { id: 'stt', header: 'STT', cell: r => r.stt },
        { id: 'name', header: 'Tên cài đặt', sort: r => r.name, cell: r => r.name },
        { id: 'methods', header: 'Hình thức chấm công', cell: r => r.methods },
        { id: 'scope', header: 'Đối tượng áp dụng', cell: r => <span className="chip">{r.scope}</span> },
        { id: 'branch', header: 'Chấm công theo chi nhánh', cell: r => r.byBranch },
        { id: 'upd', header: 'Cập nhật lần cuối', cell: r => fmtDate(r.updatedAt) },
        { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteAttendanceMethod(r.id)}>Xóa</button> },
      ]} filterKey={q} />
      {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveAttendanceMethod({ name, methods, scope, byBranch: 'Theo chi nhánh' }); if (!r.ok) return toast(r.errors.name); toast('Đã thêm'); setOpen(false); }}><header><b>Thêm cài đặt chấm công</b></header><div className="body"><Field label="Tên"><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Hình thức"><TextInput value={methods} onChange={e => setMethods(e.target.value)} /></Field><Field label="Đối tượng"><TextInput value={scope} onChange={e => setScope(e.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
    </div>
  );
}

export function UnspecifiedPage({ title }: { title: string }) {
  return <div className="card empty"><div className="empty-ico">?</div><b>{title}</b><small>Ghi chú khảo sát có tên trang này nhưng không mô tả cột, bộ lọc hay form. Chưa dựng giao diện để tránh suy đoán.</small></div>;
}

export function AttendanceReports() {
  const { state, unit } = useLabels();
  const [grain, setGrain] = useState('Tháng');
  const late = state.employees.map(emp => ({ label: emp.fullName, value: state.punches.filter(p => p.employeeId === emp.id && p.at.slice(11, 16) > '08:35').length })).filter(i => i.value).slice(0, 6);
  const byUnit = state.units.slice(0, 6).map(u => ({ label: u.name, value: state.employees.filter(e => e.unitId === u.id && e.status !== 'Đã nghỉ việc').length }));
  const missing = state.employees.filter(e => e.status !== 'Đã nghỉ việc' && !state.punches.some(p => p.employeeId === e.id && p.at.startsWith(todayISO()))).length;
  return (
    <div>
      <div className="toolbar card flat"><span>Ngày làm việc</span><TextInput type="date" defaultValue={todayISO().slice(0, 8) + '01'} aria-label="Từ ngày" /><TextInput type="date" defaultValue={todayISO()} aria-label="Đến ngày" /><button className="btn-ghost">Bộ lọc</button><div className="seg">{['Ngày', 'Tuần', 'Tháng', 'Năm'].map(item => <button key={item} className={grain === item ? 'on' : ''} onClick={() => setGrain(item)}>{item}</button>)}</div><Select aria-label="Phòng ban"><option>Phòng ban</option>{state.units.map(u => <option key={u.id}>{u.name}</option>)}</Select></div>
      <div className="report-grid">
        <section className="card"><h3>Số giờ làm việc thực tế / Số giờ tiêu chuẩn</h3><BarChart items={byUnit} /></section>
        <section className="card"><h3>Báo cáo làm thêm giờ theo đơn vị</h3><BarChart items={state.units.slice(0, 5).map(u => ({ label: u.name, value: state.requests.filter(r => r.type === 'lam-them-gio' && r.status === 'Đã duyệt' && state.employees.find(e => e.id === r.employeeId)?.unitId === u.id).length }))} /></section>
        <section className="card"><h3>Tình trạng đi muộn</h3>{late.length ? <BarChart items={late} /> : <p>Chưa có thông tin</p>}</section>
        <section className="card"><h3>Tình trạng về sớm</h3><p>Chưa có thông tin</p></section>
        <section className="card"><h3>Báo cáo làm thêm giờ theo thời gian</h3><p>Đang xem theo {grain}. Biểu đồ đường chưa có thư viện; số đơn OT đã duyệt: {state.requests.filter(r => r.type === 'lam-them-gio' && r.status === 'Đã duyệt').length}.</p></section>
        <section className="card"><h3>Tình trạng sửa chấm công</h3><p>{state.requests.filter(r => r.type === 'sua-cham-cong').length} đơn sửa chấm công.</p></section>
        <section className="card"><h3>Báo cáo làm thêm giờ theo nhân sự</h3><BarChart items={late} /></section>
        <section className="card"><h3>Số lượng nhân viên nghỉ phép theo thời gian / theo đơn vị</h3><BarChart items={byUnit.map(u => ({ ...u, value: state.requests.filter(r => r.type === 'nghi-phep' && r.status === 'Đã duyệt' && unit(state.employees.find(e => e.id === r.employeeId)?.unitId) === u.label).length }))} /></section>
        <section className="card"><h3>Báo cáo đi muộn / về sớm</h3>{late.length ? <BarChart items={late} /> : <p>Chưa có thông tin</p>}</section>
        <section className="card"><h3>Số lượng nhân viên đi muộn, về sớm theo đơn vị / theo thời gian</h3><BarChart items={byUnit} /></section>
        <section className="card"><h3>Báo cáo nhân sự thiếu dữ liệu chấm công</h3><p>{missing} người không có bản ghi trong hôm nay.</p></section>
      </div>
    </div>
  );
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
