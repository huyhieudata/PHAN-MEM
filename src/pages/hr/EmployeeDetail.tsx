import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useConfirm, useToast } from '../../components/feedback';
import { Field, TextInput } from '../../components/Fields';
import { DataTable, type Column } from '../../components/DataTable';
import { personInitial, StatusBadge } from '../../components/Person';
import { contractPhase } from '../../data/derive';
import { hr } from '../../data/repositories';
import type { Certificate, Contract, Dependent, EmployeeInput } from '../../data/types';
import { fmtDate, fmtMoney } from '../../data/text';
import { CertificateForm, ContractForm, DependentForm } from './editors';
import { EmployeeForm } from './EmployeeForm';
import { useLabels } from './lookups';

const TABS = [
  ['ca-nhan', 'Thông tin cá nhân'],
  ['cong-viec', 'Công việc'],
  ['hop-dong', 'Hợp đồng'],
  ['gia-dinh', 'Gia đình & người phụ thuộc'],
  ['chung-chi', 'Chứng chỉ'],
  ['bhxh', 'BHXH'],
] as const;

export default function EmployeeDetail() {
  const { recordId } = useParams();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const ask = useConfirm();
  const { state, unit, branch, position, employee: findEmp } = useLabels();
  const employee = state.employees.find(e => e.id === recordId);
  const tab = TABS.some(item => item[0] === params.get('tab')) ? params.get('tab')! : 'ca-nhan';
  const [edit, setEdit] = useState(false);
  const [contract, setContract] = useState<Contract | 'new' | null>(null);
  const [dependent, setDependent] = useState<Dependent | 'new' | null>(null);
  const [certificate, setCertificate] = useState<Certificate | 'new' | null>(null);

  if (!employee) {
    return (
      <div className="card panel">
        <div className="empty"><b>Không tìm thấy nhân sự</b><button className="btn-ghost" onClick={() => nav('/m/nhan-su/thong-tin-nhan-su')}>Về danh sách</button></div>
      </div>
    );
  }

  const manager = findEmp(employee.managerId);
  const contracts = state.contracts.filter(c => c.employeeId === employee.id);
  const dependents = state.dependents.filter(d => d.employeeId === employee.id);
  const certificates = state.certificates.filter(c => c.employeeId === employee.id);

  async function remove() {
    const yes = await ask({ title: 'Xóa nhân sự', message: `Xóa hồ sơ ${employee!.fullName} và dữ liệu liên quan?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteEmployee(employee!.id);
    toast('Đã xóa nhân sự');
    nav('/m/nhan-su/thong-tin-nhan-su');
  }

  function saveInsurance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const { id, ...rest } = employee!;
    void id;
    const input: EmployeeInput = {
      ...rest,
      siNumber: String(data.get('siNumber') ?? ''),
      siStart: String(data.get('siStart') ?? ''),
      hiNumber: String(data.get('hiNumber') ?? ''),
      hospital: String(data.get('hospital') ?? ''),
    };
    const result = hr.saveEmployee(input, employee!.id);
    if (!result.ok) toast(Object.values(result.errors)[0] || 'Không lưu được');
    else toast('Đã lưu thông tin BHXH');
  }

  const contractCols: Column<Contract>[] = [
    { id: 'code', header: 'Mã', sort: c => c.code, cell: c => c.code },
    { id: 'type', header: 'Loại', sort: c => c.type, cell: c => c.type },
    { id: 'start', header: 'Hiệu lực', sort: c => c.startDate, cell: c => fmtDate(c.startDate) },
    { id: 'end', header: 'Hết hạn', sort: c => c.endDate, cell: c => c.endDate ? fmtDate(c.endDate) : '—' },
    { id: 'salary', header: 'Lương', sort: c => c.salary, cell: c => fmtMoney(c.salary) },
    { id: 'st', header: 'Trạng thái', sort: c => contractPhase(c).label, cell: c => <StatusBadge value={contractPhase(c).label} /> },
    { id: 'act', header: '', cell: c => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setContract(c)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => hr.deleteContract(c.id)}>Xóa</button></div> },
  ];
  const depCols: Column<Dependent>[] = [
    { id: 'name', header: 'Họ tên', sort: d => d.name, cell: d => d.name },
    { id: 'rel', header: 'Quan hệ', sort: d => d.relation, cell: d => d.relation },
    { id: 'dob', header: 'Ngày sinh', sort: d => d.dob, cell: d => fmtDate(d.dob) },
    { id: 'tax', header: 'Giảm trừ', cell: d => d.taxDependent ? 'Có' : 'Không' },
    { id: 'act', header: '', cell: d => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setDependent(d)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => hr.deleteDependent(d.id)}>Xóa</button></div> },
  ];
  const cerCols: Column<Certificate>[] = [
    { id: 'name', header: 'Chứng chỉ', sort: c => c.name, cell: c => c.name },
    { id: 'issuer', header: 'Nơi cấp', sort: c => c.issuer, cell: c => c.issuer || '—' },
    { id: 'no', header: 'Số hiệu', cell: c => c.number || '—' },
    { id: 'exp', header: 'Hết hạn', sort: c => c.expiryDate, cell: c => c.expiryDate ? fmtDate(c.expiryDate) : '—' },
    { id: 'act', header: '', cell: c => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setCertificate(c)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => hr.deleteCertificate(c.id)}>Xóa</button></div> },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><button className="link" onClick={() => nav('/m/nhan-su/thong-tin-nhan-su')}>Thông tin nhân sự</button> / <span>{employee.fullName}</span></div>
          <h1>Hồ sơ nhân sự</h1>
        </div>
        <div className="row-actions">
          <button className="btn-ghost" onClick={() => setEdit(true)}>Sửa hồ sơ</button>
          <button className="btn-danger" onClick={() => void remove()}>Xóa</button>
        </div>
      </div>
      <div className="card detail-hero">
        <div className="avatar-lg">{personInitial(employee.fullName)}</div>
        <div>
          <b className="hero-name">{employee.fullName}</b>
          <div className="hero-meta">
            <span>{employee.code}</span>
            <span>{position(employee.positionId)}</span>
            <span>{unit(employee.unitId)}</span>
            <span>{branch(employee.branchId)}</span>
            <StatusBadge value={employee.status} />
          </div>
        </div>
      </div>
      <div className="card panel detail-body">
        <div className="tabs-line">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setParams({ tab: id })}>{label}</button>
          ))}
        </div>
        {tab === 'ca-nhan' && (
          <dl className="dl">
            <dt>Giới tính</dt><dd>{employee.gender}</dd>
            <dt>Ngày sinh</dt><dd>{fmtDate(employee.dob)}</dd>
            <dt>Điện thoại</dt><dd>{employee.phone}</dd>
            <dt>Email công ty</dt><dd>{employee.email}</dd>
            <dt>Email cá nhân</dt><dd>{employee.personalEmail || '—'}</dd>
            <dt>CCCD/CMND</dt><dd>{employee.idNumber || '—'}{employee.idIssueDate ? ` · cấp ${fmtDate(employee.idIssueDate)}` : ''}{employee.idIssuePlace ? ` · ${employee.idIssuePlace}` : ''}</dd>
            <dt>Hôn nhân</dt><dd>{employee.marital}</dd>
            <dt>Quốc tịch / dân tộc</dt><dd>{employee.nationality} · {employee.ethnicity}</dd>
            <dt>Địa chỉ</dt><dd>{employee.address || '—'}</dd>
            <dt>Quê quán</dt><dd>{employee.hometown || '—'}</dd>
            <dt>Ngân hàng</dt><dd>{employee.bankName || '—'} · {employee.bankAccount || '—'}</dd>
            <dt>Mã số thuế</dt><dd>{employee.taxCode || '—'}</dd>
            <dt>Ghi chú</dt><dd>{employee.note || '—'}</dd>
          </dl>
        )}
        {tab === 'cong-viec' && (
          <dl className="dl">
            <dt>Đơn vị</dt><dd>{unit(employee.unitId)}</dd>
            <dt>Vị trí</dt><dd>{position(employee.positionId)}</dd>
            <dt>Chi nhánh</dt><dd>{branch(employee.branchId)}</dd>
            <dt>Quản lý trực tiếp</dt><dd>{manager?.fullName ?? '—'}</dd>
            <dt>Loại hình</dt><dd>{employee.employmentType}</dd>
            <dt>Ngày vào làm</dt><dd>{fmtDate(employee.startDate)}</dd>
            <dt>Ngày chính thức</dt><dd>{fmtDate(employee.officialDate)}</dd>
            <dt>Ngày nghỉ việc</dt><dd>{fmtDate(employee.resignDate)}</dd>
          </dl>
        )}
        {tab === 'hop-dong' && (
          <>
            <div className="toolbar"><div className="grow" /><button className="btn-primary" onClick={() => setContract('new')}>+ Thêm hợp đồng</button></div>
            <DataTable rows={contracts} columns={contractCols} empty="Chưa có hợp đồng" />
          </>
        )}
        {tab === 'gia-dinh' && (
          <>
            <div className="toolbar"><div className="grow" /><button className="btn-primary" onClick={() => setDependent('new')}>+ Thêm người phụ thuộc</button></div>
            <DataTable rows={dependents} columns={depCols} empty="Chưa có người phụ thuộc" />
          </>
        )}
        {tab === 'chung-chi' && (
          <>
            <div className="toolbar"><div className="grow" /><button className="btn-primary" onClick={() => setCertificate('new')}>+ Thêm chứng chỉ</button></div>
            <DataTable rows={certificates} columns={cerCols} empty="Chưa có chứng chỉ" />
          </>
        )}
        {tab === 'bhxh' && (
          <form className="form-grid pad" onSubmit={saveInsurance} key={employee.siNumber + employee.hospital}>
            <Field label="Mã số BHXH"><TextInput name="siNumber" defaultValue={employee.siNumber} /></Field>
            <Field label="Ngày tham gia"><TextInput name="siStart" type="date" defaultValue={employee.siStart} /></Field>
            <Field label="Số thẻ BHYT"><TextInput name="hiNumber" defaultValue={employee.hiNumber} /></Field>
            <Field label="Nơi đăng ký KCB"><TextInput name="hospital" defaultValue={employee.hospital} /></Field>
            <div className="form-actions span2"><button className="btn-primary" type="submit">Lưu BHXH</button></div>
          </form>
        )}
      </div>
      {edit && <EmployeeForm employee={employee} onClose={() => setEdit(false)} />}
      {contract && <ContractForm record={contract === 'new' ? undefined : contract} employeeId={employee.id} onClose={() => setContract(null)} />}
      {dependent && <DependentForm record={dependent === 'new' ? undefined : dependent} employeeId={employee.id} onClose={() => setDependent(null)} />}
      {certificate && <CertificateForm record={certificate === 'new' ? undefined : certificate} employeeId={employee.id} onClose={() => setCertificate(null)} />}
    </div>
  );
}
