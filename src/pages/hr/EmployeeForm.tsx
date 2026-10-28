import { useState } from 'react';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/feedback';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES, GENDERS, MARITALS } from '../../data/labels';
import { blankEmployee, hr } from '../../data/repositories';
import type { Employee, EmployeeInput, FieldErrors } from '../../data/types';
import { useHr } from '../../hooks/useHr';

function strip(employee: Employee): EmployeeInput {
  const { id, ...rest } = employee;
  void id;
  return rest;
}

export function EmployeeForm({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  const state = useHr();
  const toast = useToast();
  const [form, setForm] = useState<EmployeeInput>(() => employee ? strip(employee) : blankEmployee(hr.getState()));
  const [errors, setErrors] = useState<FieldErrors>({});

  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveEmployee(form, employee?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast(employee ? 'Đã cập nhật hồ sơ' : 'Đã thêm nhân sự');
    onClose();
  }

  const managers = state.employees.filter(item => item.id !== employee?.id && item.status !== 'Đã nghỉ việc');

  return (
    <Modal title={employee ? 'Sửa hồ sơ nhân sự' : 'Thêm nhân sự'} onClose={onClose} wide>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <p className="section-title">Công việc</p>
          <Field label="Mã nhân viên" error={errors.code}><TextInput value={form.code} placeholder="Tự sinh nếu để trống" onChange={e => set('code', e.target.value)} /></Field>
          <Field label="Trạng thái" required error={errors.status}>
            <Select value={form.status} onChange={e => set('status', e.target.value as EmployeeInput['status'])}>{EMPLOYEE_STATUSES.map(s => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Loại hình" required>
            <Select value={form.employmentType} onChange={e => set('employmentType', e.target.value as EmployeeInput['employmentType'])}>{EMPLOYMENT_TYPES.map(s => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Chi nhánh" required error={errors.branchId}>
            <Select value={form.branchId} onChange={e => set('branchId', e.target.value)}><option value="">Chọn chi nhánh</option>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
          </Field>
          <Field label="Đơn vị" required error={errors.unitId}>
            <Select value={form.unitId} onChange={e => set('unitId', e.target.value)}><option value="">Chọn đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          </Field>
          <Field label="Vị trí công việc" required error={errors.positionId}>
            <Select value={form.positionId} onChange={e => set('positionId', e.target.value)}><option value="">Chọn vị trí</option>{state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          </Field>
          <Field label="Người quản lý" error={errors.managerId}>
            <Select value={form.managerId ?? ''} onChange={e => set('managerId', e.target.value || null)}><option value="">Không chọn</option>{managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}</Select>
          </Field>
          <Field label="Ngày vào làm" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
          <Field label="Ngày chính thức" error={errors.officialDate}><TextInput type="date" value={form.officialDate} onChange={e => set('officialDate', e.target.value)} /></Field>
          {form.status === 'Đã nghỉ việc' && <Field label="Ngày nghỉ việc" required error={errors.resignDate}><TextInput type="date" value={form.resignDate} onChange={e => set('resignDate', e.target.value)} /></Field>}

          <p className="section-title">Thông tin cá nhân</p>
          <Field label="Họ và tên" required error={errors.fullName}><TextInput value={form.fullName} onChange={e => set('fullName', e.target.value)} /></Field>
          <Field label="Giới tính">
            <Select value={form.gender} onChange={e => set('gender', e.target.value as EmployeeInput['gender'])}>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select>
          </Field>
          <Field label="Ngày sinh" error={errors.dob}><TextInput type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></Field>
          <Field label="Tình trạng hôn nhân">
            <Select value={form.marital} onChange={e => set('marital', e.target.value as EmployeeInput['marital'])}>{MARITALS.map(m => <option key={m}>{m}</option>)}</Select>
          </Field>
          <Field label="Quốc tịch"><TextInput value={form.nationality} onChange={e => set('nationality', e.target.value)} /></Field>
          <Field label="Dân tộc"><TextInput value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)} /></Field>
          <Field label="Tôn giáo"><TextInput value={form.religion} onChange={e => set('religion', e.target.value)} /></Field>
          <Field label="Số điện thoại" required error={errors.phone}><TextInput value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0900 000 000" /></Field>
          <Field label="Email công ty" required error={errors.email}><TextInput value={form.email} onChange={e => set('email', e.target.value)} placeholder="ten@vi-du.hrm.local" /></Field>
          <Field label="Email cá nhân" error={errors.personalEmail}><TextInput value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)} /></Field>
          <Field label="Địa chỉ hiện tại" className="span2"><TextInput value={form.address} onChange={e => set('address', e.target.value)} /></Field>
          <Field label="Quê quán" className="span2"><TextInput value={form.hometown} onChange={e => set('hometown', e.target.value)} /></Field>

          <p className="section-title">Giấy tờ và ngân hàng</p>
          <Field label="Số CCCD/CMND" error={errors.idNumber}><TextInput value={form.idNumber} onChange={e => set('idNumber', e.target.value)} /></Field>
          <Field label="Ngày cấp" error={errors.idIssueDate}><TextInput type="date" value={form.idIssueDate} onChange={e => set('idIssueDate', e.target.value)} /></Field>
          <Field label="Nơi cấp" className="span2"><TextInput value={form.idIssuePlace} onChange={e => set('idIssuePlace', e.target.value)} /></Field>
          <Field label="Ngân hàng"><TextInput value={form.bankName} onChange={e => set('bankName', e.target.value)} /></Field>
          <Field label="Số tài khoản"><TextInput value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} /></Field>
          <Field label="Mã số thuế"><TextInput value={form.taxCode} onChange={e => set('taxCode', e.target.value)} /></Field>

          <p className="section-title">Bảo hiểm xã hội</p>
          <Field label="Mã BHXH" error={errors.siNumber}><TextInput value={form.siNumber} onChange={e => set('siNumber', e.target.value)} /></Field>
          <Field label="Ngày tham gia" error={errors.siStart}><TextInput type="date" value={form.siStart} onChange={e => set('siStart', e.target.value)} /></Field>
          <Field label="Số BHYT"><TextInput value={form.hiNumber} onChange={e => set('hiNumber', e.target.value)} /></Field>
          <Field label="Nơi đăng ký KCB"><TextInput value={form.hospital} onChange={e => set('hospital', e.target.value)} /></Field>
          <Field label="Ghi chú" className="span2"><TextArea value={form.note} onChange={e => set('note', e.target.value)} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn-primary">Lưu hồ sơ</button>
        </div>
      </form>
    </Modal>
  );
}
