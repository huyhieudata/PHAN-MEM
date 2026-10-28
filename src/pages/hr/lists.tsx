import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { useConfirm, useToast } from '../../components/feedback';
import { PersonCell, StatusBadge } from '../../components/Person';
import { hr } from '../../data/repositories';
import type { Certificate, Dependent, Employee } from '../../data/types';
import { fmtDate, includesPlain } from '../../data/text';
import { CertificateForm, DependentForm } from './editors';
import { useLabels } from './lookups';

export function DirectoryPage() {
  const nav = useNavigate();
  const { state, unit, position, branch } = useLabels();
  const [q, setQ] = useState('');
  const rows = useMemo(() => state.employees.filter(e => e.status !== 'Đã nghỉ việc' && includesPlain(
    [e.fullName, e.code, e.phone, e.email, unit(e.unitId), position(e.positionId)].join(' '), q,
  )), [state.employees, q, unit, position]);
  const columns: Column<Employee>[] = [
    { id: 'name', header: 'Nhân sự', sort: e => e.fullName, cell: e => <button className="person-btn" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}`)}><PersonCell name={e.fullName} sub={e.code} /></button> },
    { id: 'pos', header: 'Vị trí', sort: e => position(e.positionId), cell: e => position(e.positionId) },
    { id: 'unit', header: 'Đơn vị', sort: e => unit(e.unitId), cell: e => unit(e.unitId) },
    { id: 'branch', header: 'Chi nhánh', sort: e => branch(e.branchId), cell: e => branch(e.branchId) },
    { id: 'phone', header: 'Điện thoại', sort: e => e.phone, cell: e => e.phone },
    { id: 'email', header: 'Email', sort: e => e.email, cell: e => e.email },
  ];
  return (
    <div className="card panel">
      <div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm danh bạ" value={q} placeholder="Tìm tên, đơn vị, số điện thoại" onChange={e => setQ(e.target.value)} /></div></div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
    </div>
  );
}

export function FamilyPage() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dependent | null>(null);
  const rows = useMemo(() => state.dependents.filter(d => includesPlain([d.name, d.relation, employee(d.employeeId)?.fullName ?? ''].join(' '), q)), [state.dependents, q, employee]);
  const columns: Column<Dependent>[] = [
    { id: 'emp', header: 'Nhân sự', sort: d => employee(d.employeeId)?.fullName ?? '', cell: d => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${d.employeeId}?tab=gia-dinh`)}>{employee(d.employeeId)?.fullName ?? '—'}</button> },
    { id: 'name', header: 'Người phụ thuộc', sort: d => d.name, cell: d => d.name },
    { id: 'rel', header: 'Quan hệ', sort: d => d.relation, cell: d => d.relation },
    { id: 'dob', header: 'Ngày sinh', sort: d => d.dob, cell: d => fmtDate(d.dob) },
    { id: 'tax', header: 'Giảm trừ', cell: d => d.taxDependent ? 'Có' : 'Không' },
    { id: 'act', header: '', cell: d => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(d)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(d)}>Xóa</button></div> },
  ];
  async function remove(row: Dependent) {
    const yes = await ask({ title: 'Xóa người phụ thuộc', message: `Xóa ${row.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteDependent(row.id);
    toast('Đã xóa');
  }
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm người phụ thuộc" value={q} placeholder="Tìm tên, quan hệ" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm mới</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {open && <DependentForm onClose={() => setOpen(false)} />}
      {editing && <DependentForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function CertificatesPage() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const rows = useMemo(() => state.certificates.filter(c => includesPlain([c.name, c.issuer, employee(c.employeeId)?.fullName ?? ''].join(' '), q)), [state.certificates, q, employee]);
  const columns: Column<Certificate>[] = [
    { id: 'emp', header: 'Nhân sự', sort: c => employee(c.employeeId)?.fullName ?? '', cell: c => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${c.employeeId}?tab=chung-chi`)}>{employee(c.employeeId)?.fullName ?? '—'}</button> },
    { id: 'name', header: 'Chứng chỉ', sort: c => c.name, cell: c => c.name },
    { id: 'issuer', header: 'Nơi cấp', sort: c => c.issuer, cell: c => c.issuer || '—' },
    { id: 'exp', header: 'Hết hạn', sort: c => c.expiryDate, cell: c => c.expiryDate ? fmtDate(c.expiryDate) : '—' },
    { id: 'kind', header: 'Loại', sort: c => c.kind, cell: c => c.kind || '—' },
    { id: 'act', header: '', cell: c => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(c)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(c)}>Xóa</button></div> },
  ];
  async function remove(row: Certificate) {
    const yes = await ask({ title: 'Xóa chứng chỉ', message: `Xóa "${row.name}"?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteCertificate(row.id);
    toast('Đã xóa');
  }
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm chứng chỉ" value={q} placeholder="Tìm chứng chỉ, nhân sự" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm mới</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {open && <CertificateForm onClose={() => setOpen(false)} />}
      {editing && <CertificateForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function InsurancePage() {
  const nav = useNavigate();
  const { state, unit } = useLabels();
  const [q, setQ] = useState('');
  const rows = useMemo(() => state.employees.filter(e => includesPlain([e.fullName, e.code, e.siNumber, e.hiNumber, e.hospital].join(' '), q)), [state.employees, q]);
  const columns: Column<Employee>[] = [
    { id: 'name', header: 'Nhân sự', sort: e => e.fullName, cell: e => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${e.id}?tab=bhxh`)}>{e.fullName}</button> },
    { id: 'code', header: 'Mã NV', sort: e => e.code, cell: e => e.code },
    { id: 'unit', header: 'Đơn vị', sort: e => unit(e.unitId), cell: e => unit(e.unitId) },
    { id: 'si', header: 'Mã BHXH', sort: e => e.siNumber, cell: e => e.siNumber || '—' },
    { id: 'start', header: 'Tham gia', sort: e => e.siStart, cell: e => fmtDate(e.siStart) },
    { id: 'hi', header: 'Số BHYT', sort: e => e.hiNumber, cell: e => e.hiNumber || '—' },
    { id: 'hospital', header: 'Nơi KCB', sort: e => e.hospital, cell: e => e.hospital || '—' },
    { id: 'st', header: 'Trạng thái', sort: e => e.status, cell: e => <StatusBadge value={e.status} /> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm BHXH" value={q} placeholder="Tìm tên, mã BHXH" onChange={e => setQ(e.target.value)} /></div></div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
    </div>
  );
}

export function SettingsPage() {
  const ask = useConfirm();
  const toast = useToast();
  async function reset() {
    const yes = await ask({
      title: 'Khôi phục dữ liệu mẫu',
      message: 'Xóa toàn bộ dữ liệu nhân sự đang lưu trên trình duyệt này và nạp lại bộ mẫu?',
      confirmLabel: 'Khôi phục',
      danger: true,
    });
    if (!yes) return;
    hr.reset();
    toast('Đã khôi phục dữ liệu mẫu');
  }
  return (
    <div className="card pad-card">
      <h3>Dữ liệu trên trình duyệt</h3>
      <p>Hồ sơ, hợp đồng, cơ cấu và quyết định được lưu trong localStorage của trình duyệt, qua một repository dùng chung. Các phân hệ như chấm công đọc cùng danh sách nhân sự. Khi có API, chỉ cần thay lớp repository.</p>
      <button className="btn-danger" onClick={() => void reset()}>Khôi phục dữ liệu mẫu</button>
    </div>
  );
}
