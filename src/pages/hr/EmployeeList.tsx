import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { useConfirm, useToast } from '../../components/feedback';
import { PersonCell, StatusBadge } from '../../components/Person';
import { downloadText } from '../../data/csv';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '../../data/labels';
import { hr } from '../../data/repositories';
import type { Employee } from '../../data/types';
import { fmtDate, includesPlain } from '../../data/text';
import { EmployeeForm } from './EmployeeForm';
import { useLabels } from './lookups';

export default function EmployeeList() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, unit, branch, position } = useLabels();
  const [status, setStatus] = useState('Đang làm việc');
  const [q, setQ] = useState('');
  const [showF, setShowF] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [kind, setKind] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [banner, setBanner] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => state.employees.filter(e => {
    if (status !== 'Tất cả' && e.status !== status) return false;
    if (unitId && e.unitId !== unitId) return false;
    if (branchId && e.branchId !== branchId) return false;
    if (kind && e.employmentType !== kind) return false;
    return includesPlain([e.fullName, e.code, e.phone, e.email, e.idNumber].join(' '), q);
  }).sort((a, b) => a.code.localeCompare(b.code)), [state.employees, status, unitId, branchId, kind, q]);

  const columns: Column<Employee>[] = [
    { id: 'name', header: 'Nhân viên', sort: e => e.fullName, cell: e => <button className="person-btn" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}`)}><PersonCell name={e.fullName} /></button> },
    { id: 'code', header: 'Mã nhân viên', sort: e => e.code, cell: e => e.code },
    { id: 'pos', header: 'Vị trí công việc', sort: e => position(e.positionId), cell: e => position(e.positionId) },
    { id: 'unit', header: 'Đơn vị', sort: e => unit(e.unitId), cell: e => unit(e.unitId) },
    { id: 'branch', header: 'Chi nhánh', sort: e => branch(e.branchId), cell: e => branch(e.branchId) },
    { id: 'phone', header: 'Số điện thoại', sort: e => e.phone, cell: e => e.phone },
    { id: 'email', header: 'Email', sort: e => e.email, cell: e => e.email },
    { id: 'start', header: 'Ngày đi làm', sort: e => e.startDate, cell: e => fmtDate(e.startDate) },
    { id: 'status', header: 'Trạng thái nhân sự', sort: e => e.status, cell: e => <StatusBadge value={e.status} /> },
    { id: 'type', header: 'Loại hình nhân sự', sort: e => e.employmentType, cell: e => e.employmentType },
    {
      id: 'act', header: '', cell: e => (
        <div className="row-actions">
          <button className="btn-ghost btn-sm" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}`)}>Xem</button>
          <button className="btn-ghost btn-sm" onClick={() => setEditing(e)}>Sửa</button>
          <button className="btn-ghost btn-sm" onClick={() => void remove(e)}>Xóa</button>
        </div>
      ),
    },
  ];

  async function remove(employee: Employee) {
    const yes = await ask({
      title: 'Xóa nhân sự',
      message: `Xóa ${employee.fullName} cùng hợp đồng, người phụ thuộc, chứng chỉ, khen thưởng và quyết định liên quan?`,
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (!yes) return;
    const result = hr.deleteEmployee(employee.id);
    if (!result.ok) toast(result.errors.form || 'Không xóa được');
    else toast('Đã xóa nhân sự');
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = hr.importEmployeesCsv(String(reader.result ?? ''));
      const summary = `Thêm ${result.added}, cập nhật ${result.updated}` + (result.errors.length ? `. Lỗi: ${result.errors.slice(0, 3).join(' ')}` : '.');
      setBanner(summary);
      toast(result.errors.length ? 'Import xong, có dòng lỗi' : 'Import thành công');
    };
    reader.readAsText(file, 'utf-8');
  }

  return (
    <div className="card panel">
      <div className="toolbar">
        <select aria-label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}>
          <option>Tất cả</option>
          {EMPLOYEE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="in-search">🔍<input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên, mã, SĐT, email" aria-label="Tìm nhân sự" /></div>
        <button className={'btn-ghost' + (showF ? ' on' : '')} onClick={() => setShowF(v => !v)}>⚲ Bộ lọc</button>
        <div className="grow" />
        <button className="btn-ghost" onClick={() => downloadText('nhan-su.csv', hr.exportEmployeesCsv(rows))}>⤓ Export</button>
        <button className="btn-ghost" onClick={() => downloadText('mau-nhan-su.csv', hr.employeeTemplate())}>Mẫu CSV</button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>⤒ Import</button>
        <input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onImport(file); }} />
        <button className="btn-primary" onClick={() => setCreating(true)}>+ Thêm mới</button>
      </div>
      {showF && (
        <div className="filters">
          <select aria-label="Đơn vị" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select aria-label="Chi nhánh" value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Tất cả chi nhánh</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select aria-label="Loại hình" value={kind} onChange={e => setKind(e.target.value)}><option value="">Tất cả loại hình</option>{EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <button className="link" onClick={() => { setUnitId(''); setBranchId(''); setKind(''); }}>Xóa bộ lọc</button>
        </div>
      )}
      {banner && <div className="banner">{banner}</div>}
      <DataTable rows={rows} columns={columns} filterKey={`${q}|${status}|${unitId}|${branchId}|${kind}`} />
      {creating && <EmployeeForm onClose={() => setCreating(false)} />}
      {editing && <EmployeeForm employee={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
