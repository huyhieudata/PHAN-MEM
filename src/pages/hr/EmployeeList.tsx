import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterPanel } from '../../components/Drawer';
import { Field, Select, TextInput } from '../../components/Fields';
import { personInitial } from '../../components/Person';
import { useConfirm, useToast } from '../../components/feedback';
import { downloadText } from '../../data/csv';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES, GENDERS } from '../../data/labels';
import { hr } from '../../data/repositories';
import type { Employee } from '../../data/types';
import { fmtDate, includesPlain, todayISO, yearsBetween } from '../../data/text';
import { useLabels } from './lookups';

const COLS = [
  ['name', 'Nhân viên'], ['code', 'Mã nhân viên'], ['pos', 'Vị trí công việc'], ['sub', 'Vị trí kiêm nhiệm'],
  ['unit', 'Đơn vị'], ['branch', 'Chi nhánh'], ['phone', 'Số điện thoại'], ['email', 'Email'],
  ['start', 'Ngày đi làm'], ['official', 'Ngày chính thức'], ['tenure', 'Thâm niên'], ['status', 'Trạng thái nhân sự'],
  ['type', 'Loại hình nhân sự'], ['role', 'Vai trò'], ['edu', 'Trình độ học vấn'], ['app', 'Sử dụng App'],
] as const;

const IMPORTS = ['Cập nhật thông tin nhân sự', 'Cập nhật trạng thái nhân sự', 'Cập nhật quá trình công tác', 'Cập nhật thông tin thu nhập', 'Cập nhật người phụ thuộc', 'Cập nhật thông tin thai sản', 'Cập nhật thông tin bảo hiểm'];

function tenureLabel(start: string) {
  if (!start) return '—';
  const today = todayISO();
  const years = yearsBetween(start, today);
  const [y1, m1, d1] = start.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - years * 12;
  let days = d2 - d1;
  if (days < 0) { months -= 1; days += 30; }
  if (months < 0) months = 0;
  return `${years ? years + ' năm ' : ''}${months} tháng ${Math.max(0, days)} ngày`;
}

export default function EmployeeList() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const labels = useLabels();
  const { state } = labels;
  const [q, setQ] = useState('');
  const [active, setActive] = useState('Đang làm việc');
  const [filter, setFilter] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [visible, setVisible] = useState<string[]>(COLS.map(c => c[0]));
  const [role, setRole] = useState('');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [kind, setKind] = useState('');
  const [edu, setEdu] = useState('');
  const [gender, setGender] = useState('');
  const [startFrom, setStartFrom] = useState('');
  const [startTo, setStartTo] = useState('');
  const [official, setOfficial] = useState('');
  const [resign, setResign] = useState('');
  const [app, setApp] = useState('');
  const [missing, setMissing] = useState('');
  const [contractSt, setContractSt] = useState('');
  const [branchId, setBranchId] = useState('');

  const rows = useMemo(() => state.employees.filter(e => {
    const working = e.status !== 'Đã nghỉ việc';
    if (active === 'Đang làm việc' && !working) return false;
    if (active === 'Đã nghỉ việc' && working) return false;
    if (role && (e.roleName || (e.positionId === 'pos-gd' ? 'Super Admin' : e.managerId ? 'Nhân viên' : 'Quản lý')) !== role) return false;
    if (unitId && e.unitId !== unitId) return false;
    if (positionId && e.positionId !== positionId) return false;
    if (kind && e.employmentType !== kind) return false;
    if (edu && (e.educationLevel || '') !== edu) return false;
    if (gender && e.gender !== gender) return false;
    if (startFrom && e.startDate < startFrom) return false;
    if (startTo && e.startDate > startTo) return false;
    if (official && e.officialDate !== official) return false;
    if (resign && e.resignDate !== resign) return false;
    if (app === 'used' && e.appUsed === false) return false;
    if (app === 'no' && e.appUsed !== false) return false;
    if (missing === 'email' && e.email) return false;
    if (missing === 'phone' && e.phone) return false;
    if (branchId && e.branchId !== branchId) return false;
    if (contractSt) {
      const has = state.contracts.some(c => c.employeeId === e.id && c.status === contractSt);
      if (!has) return false;
    }
    return includesPlain([e.fullName, e.email, e.phone, e.code].join(' '), q);
  }).sort((a, b) => a.code.localeCompare(b.code)), [state, q, active, role, unitId, positionId, kind, edu, gender, startFrom, startTo, official, resign, app, missing, contractSt, branchId]);

  function roleOf(e: Employee) {
    return e.roleName || (e.id === 'emp-17' ? 'Super Admin' : e.positionId.startsWith('pos-tp') || e.positionId === 'pos-gd' ? 'Quản lý' : 'Nhân viên');
  }

  const all: Column<Employee>[] = [
    { id: 'check', header: '', cell: () => <input type="checkbox" aria-label="Chọn dòng" /> },
    { id: 'name', header: 'Nhân viên', sort: e => e.fullName, cell: e => <button className="person-btn" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}`)}><span className="av sm">{personInitial(e.fullName)}</span> <b>{e.fullName}</b></button> },
    { id: 'code', header: 'Mã nhân viên', sort: e => e.code, cell: e => e.code },
    { id: 'pos', header: 'Vị trí công việc', sort: e => labels.position(e.positionId), cell: e => labels.position(e.positionId) },
    { id: 'sub', header: 'Vị trí kiêm nhiệm', cell: e => e.concurrentPosition || '—' },
    { id: 'unit', header: 'Đơn vị', sort: e => labels.unit(e.unitId), cell: e => labels.unit(e.unitId) },
    { id: 'branch', header: 'Chi nhánh', sort: e => labels.branch(e.branchId), cell: e => labels.branch(e.branchId) },
    { id: 'phone', header: 'Số điện thoại', sort: e => e.phone, cell: e => e.phone },
    { id: 'email', header: 'Email', sort: e => e.email, cell: e => e.email },
    { id: 'start', header: 'Ngày đi làm', sort: e => e.startDate, cell: e => fmtDate(e.startDate) },
    { id: 'official', header: 'Ngày chính thức', sort: e => e.officialDate, cell: e => fmtDate(e.officialDate) },
    { id: 'tenure', header: 'Thâm niên', sort: e => e.startDate, cell: e => tenureLabel(e.startDate) },
    { id: 'status', header: 'Trạng thái nhân sự', sort: e => e.status, cell: e => <span className={'pill ' + (e.status === 'Đang làm việc' ? 'ok' : e.status === 'Đã nghỉ việc' ? 'bad' : 'wait')}><i />{e.status}</span> },
    { id: 'type', header: 'Loại hình nhân sự', cell: e => <span className="chip">{e.employmentType}</span> },
    { id: 'role', header: 'Vai trò', cell: e => roleOf(e) },
    { id: 'edu', header: 'Trình độ học vấn', cell: e => e.educationLevel || '—' },
    { id: 'app', header: 'Sử dụng App', cell: e => <button className="btn-ghost btn-sm" disabled>{e.appUsed === false ? 'Chưa sử dụng' : 'Đã sử dụng'}</button> },
    { id: 'menu', header: '', cell: e => (
      <div style={{ position: 'relative' }}>
        <button className="btn-ghost btn-sm" aria-label="Thao tác dòng" onClick={() => setMenu(menu === e.id ? null : e.id)}>⋯</button>
        {menu === e.id && <div className="tb-results" style={{ right: 0, left: 'auto', width: 240 }}>
          <button onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}`)}>Xem chi tiết nhân viên</button>
          <button onClick={() => toast('Đã ghi nhận gửi email mời Onboarding cho ' + e.fullName)}>Gửi email mời Onboarding</button>
          <button onClick={() => { navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/m/nhan-su/thong-tin-nhan-su/${e.id}`); toast('Đã sao chép link onboarding'); }}>Sao chép link onboarding</button>
          <button onClick={() => toast('Thêm vào chi nhánh: chọn chi nhánh ở bộ lọc rồi lưu trên hồ sơ.')}>Thêm vào chi nhánh</button>
          <button onClick={() => void remove(e)}>Xóa</button>
        </div>}
      </div>
    ) },
  ];

  async function remove(employee: Employee) {
    const yes = await ask({ title: 'Xóa nhân sự', message: `Xóa ${employee.fullName}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteEmployee(employee.id);
    toast('Đã xóa nhân sự');
    setMenu(null);
  }

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm nhân sự" placeholder="Tên, email, số điện thoại…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Select aria-label="Trạng thái" value={active} onChange={e => setActive(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="Đang làm việc">Đang hoạt động</option>
          <option value="Đã nghỉ việc">Không hoạt động</option>
        </Select>
        <button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>
        <button className="icon-btn" aria-label="Cấu hình cột" onClick={() => setColsOpen(v => !v)}>☰</button>
        <button className="btn-ghost" onClick={() => downloadText('nhan-su.csv', hr.exportEmployeesCsv(rows))}>Export</button>
        <div style={{ position: 'relative' }}>
          <button className="btn-ghost" onClick={() => setImportOpen(v => !v)}>Import ▾</button>
          {importOpen && <div className="tb-results">{IMPORTS.map(item => <button key={item} onClick={() => { setImportOpen(false); toast(item === IMPORTS[0] ? 'Dùng tệp mẫu nhân sự hiện có. Cột của các kiểu import khác chưa có trong ghi chú.' : item + ': mẫu cột chưa có trong ghi chú khảo sát.'); }}>{item}</button>)}</div>}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn-primary" onClick={() => setAddOpen(v => !v)}>Thêm mới ▾</button>
          {addOpen && <div className="tb-results"><button onClick={() => nav('/m/nhan-su/thong-tin-nhan-su/tao-moi')}>Thêm mới nhân viên</button><button onClick={() => { setAddOpen(false); document.getElementById('emp-import')?.click(); }}>Import</button></div>}
          <input id="emp-import" hidden type="file" accept=".csv" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; const reader = new FileReader(); reader.onload = () => { const res = hr.importEmployeesCsv(String(reader.result || '')); toast(`Thêm ${res.added}, cập nhật ${res.updated}`); }; reader.readAsText(file); }} />
        </div>
      </div>
      {colsOpen && <div className="filters">{COLS.map(([id, label]) => <label key={id} className="chk"><input type="checkbox" checked={visible.includes(id)} onChange={e => setVisible(cur => e.target.checked ? [...cur, id] : cur.filter(x => x !== id))} />{label}</label>)}</div>}
      <DataTable rows={rows} columns={all.filter(c => c.id === 'check' || c.id === 'menu' || visible.includes(c.id))} filterKey={q + active + unitId + kind} />
      {filter && <FilterPanel title="Bộ lọc" onClose={() => setFilter(false)} onClear={() => { setRole(''); setUnitId(''); setPositionId(''); setKind(''); setEdu(''); setGender(''); setStartFrom(''); setStartTo(''); setOfficial(''); setResign(''); setApp(''); setMissing(''); setContractSt(''); setBranchId(''); }}>
        <div className="form-grid">
          <Field label="Trạng thái nhân sự"><Select value={active} onChange={e => setActive(e.target.value)}><option value="">Tất cả</option>{EMPLOYEE_STATUSES.map(s => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Vai trò"><Select value={role} onChange={e => setRole(e.target.value)}><option value="">Tất cả</option><option>Nhân viên</option><option>Quản lý</option><option>Super Admin</option></Select></Field>
          <Field label="Đơn vị"><Select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
          <Field label="Vị trí công việc"><Select value={positionId} onChange={e => setPositionId(e.target.value)}><option value="">Tất cả</option>{state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Loại hình nhân sự"><Select value={kind} onChange={e => setKind(e.target.value)}><option value="">Tất cả</option>{EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Trình độ học vấn"><Select value={edu} onChange={e => setEdu(e.target.value)}><option value="">Tất cả</option><option>Đại học</option><option>Cao đẳng</option><option>Trung cấp</option><option>Phổ thông</option></Select></Field>
          <Field label="Giới tính"><Select value={gender} onChange={e => setGender(e.target.value)}><option value="">Tất cả</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="Ngày bắt đầu đi làm từ"><TextInput type="date" value={startFrom} onChange={e => setStartFrom(e.target.value)} /></Field>
          <Field label="Ngày bắt đầu đi làm đến"><TextInput type="date" value={startTo} onChange={e => setStartTo(e.target.value)} /></Field>
          <Field label="Ngày chính thức"><TextInput type="date" value={official} onChange={e => setOfficial(e.target.value)} /></Field>
          <Field label="Ngày nghỉ việc"><TextInput type="date" value={resign} onChange={e => setResign(e.target.value)} /></Field>
          <Field label="Sử dụng App"><Select value={app} onChange={e => setApp(e.target.value)}><option value="">Tất cả</option><option value="used">Đã sử dụng</option><option value="no">Chưa sử dụng</option></Select></Field>
          <Field label="Các trường bị thiếu"><Select value={missing} onChange={e => setMissing(e.target.value)}><option value="">Không lọc</option><option value="email">Thiếu email</option><option value="phone">Thiếu số điện thoại</option></Select></Field>
          <Field label="Trạng thái hợp đồng"><Select value={contractSt} onChange={e => setContractSt(e.target.value)}><option value="">Tất cả</option><option>Hiệu lực</option><option>Chờ ký</option><option>Thanh lý</option></Select></Field>
          <Field label="Chi nhánh làm việc"><Select value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Tất cả</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        </div>
      </FilterPanel>}
    </div>
  );
}
