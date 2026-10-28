import { useState } from 'react';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/feedback';
import { CONTRACT_STATUSES, CONTRACT_TYPES, RELATIONS } from '../../data/labels';
import { hr } from '../../data/repositories';
import type { Certificate, CertificateInput, Contract, ContractInput, Dependent, DependentInput, FieldErrors } from '../../data/types';
import { useHr } from '../../hooks/useHr';

function FormActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="form-actions">
      <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
      <button className="btn-primary" type="submit">Lưu</button>
    </div>
  );
}

export function ContractForm({ record, employeeId, onClose }: { record?: Contract; employeeId?: string; onClose: () => void }) {
  const state = useHr();
  const toast = useToast();
  const [form, setForm] = useState<ContractInput>(() => record
    ? { code: record.code, employeeId: record.employeeId, type: record.type, startDate: record.startDate, endDate: record.endDate, signedDate: record.signedDate, salary: record.salary, status: record.status, note: record.note }
    : { code: '', employeeId: employeeId ?? '', type: 'Xác định thời hạn', startDate: '', endDate: '', signedDate: '', salary: 0, status: 'Hiệu lực', note: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const locked = Boolean(employeeId) || Boolean(record);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveContract(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu hợp đồng');
    onClose();
  }

  return (
    <Modal title={record ? 'Sửa hợp đồng' : 'Thêm hợp đồng'} onClose={onClose}>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Nhân sự" required error={errors.employeeId} className="span2">
            <Select value={form.employeeId} disabled={locked} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Chọn nhân sự</option>
              {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName} · {emp.code}</option>)}
            </Select>
          </Field>
          <Field label="Mã hợp đồng" error={errors.code}><TextInput value={form.code} placeholder="Tự sinh nếu để trống" onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Loại hợp đồng" required error={errors.type}>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ContractInput['type'] })}>{CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Trạng thái lưu" required>
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ContractInput['status'] })}>{CONTRACT_STATUSES.map(t => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Lương thỏa thuận" required error={errors.salary}><TextInput type="number" min={0} value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} /></Field>
          <Field label="Ngày ký" error={errors.signedDate}><TextInput type="date" value={form.signedDate} onChange={e => setForm({ ...form, signedDate: e.target.value })} /></Field>
          <Field label="Ngày hiệu lực" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Ngày hết hạn" required={form.type !== 'Không xác định thời hạn'} error={errors.endDate}>
            <TextInput type="date" value={form.endDate} disabled={form.type === 'Không xác định thời hạn'} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="Ghi chú" className="span2"><TextArea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

export function DependentForm({ record, employeeId, onClose }: { record?: Dependent; employeeId?: string; onClose: () => void }) {
  const state = useHr();
  const toast = useToast();
  const [form, setForm] = useState<DependentInput>(() => record
    ? { employeeId: record.employeeId, name: record.name, relation: record.relation, dob: record.dob, idNumber: record.idNumber, taxDependent: record.taxDependent, fromDate: record.fromDate, toDate: record.toDate }
    : { employeeId: employeeId ?? '', name: '', relation: 'Con', dob: '', idNumber: '', taxDependent: true, fromDate: '', toDate: '' });
  const [errors, setErrors] = useState<FieldErrors>({});

  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveDependent(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu người phụ thuộc');
    onClose();
  }

  return (
    <Modal title={record ? 'Sửa người phụ thuộc' : 'Thêm người phụ thuộc'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Nhân sự" required error={errors.employeeId} className="span2">
            <Select value={form.employeeId} disabled={Boolean(employeeId) || Boolean(record)} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Chọn nhân sự</option>
              {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Họ tên" required error={errors.name}><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Quan hệ" required error={errors.relation}>
            <Select value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</Select>
          </Field>
          <Field label="Ngày sinh" error={errors.dob}><TextInput type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Số giấy tờ" error={errors.idNumber}><TextInput value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} /></Field>
          <Field label="Từ ngày" error={errors.fromDate}><TextInput type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} /></Field>
          <Field label="Đến ngày" error={errors.toDate}><TextInput type="date" value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} /></Field>
          <label className="chk span2"><input type="checkbox" checked={form.taxDependent} onChange={e => setForm({ ...form, taxDependent: e.target.checked })} /> Giảm trừ gia cảnh</label>
        </div>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

export function CertificateForm({ record, employeeId, onClose }: { record?: Certificate; employeeId?: string; onClose: () => void }) {
  const state = useHr();
  const toast = useToast();
  const [form, setForm] = useState<CertificateInput>(() => record
    ? { employeeId: record.employeeId, name: record.name, issuer: record.issuer, number: record.number, issueDate: record.issueDate, expiryDate: record.expiryDate, kind: record.kind }
    : { employeeId: employeeId ?? '', name: '', issuer: '', number: '', issueDate: '', expiryDate: '', kind: 'Chuyên môn' });
  const [errors, setErrors] = useState<FieldErrors>({});

  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveCertificate(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu chứng chỉ');
    onClose();
  }

  return (
    <Modal title={record ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Nhân sự" required error={errors.employeeId} className="span2">
            <Select value={form.employeeId} disabled={Boolean(employeeId) || Boolean(record)} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Chọn nhân sự</option>
              {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Tên chứng chỉ" required error={errors.name} className="span2"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Nơi cấp"><TextInput value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} /></Field>
          <Field label="Số hiệu"><TextInput value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></Field>
          <Field label="Loại"><TextInput value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} /></Field>
          <Field label="Ngày cấp" error={errors.issueDate}><TextInput type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></Field>
          <Field label="Ngày hết hạn" error={errors.expiryDate} className="span2"><TextInput type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></Field>
        </div>
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
