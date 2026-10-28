import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { EMPLOYMENT_TYPES, GENDERS, MARITALS } from '../../data/labels';
import { blankEmployee, hr } from '../../data/repositories';
import type { EmployeeInput, EmploymentType } from '../../data/types';
import { useToast } from '../../components/feedback';
import { useLabels } from './lookups';

const STEPS = [
  ['Thông tin cá nhân', 'Hồ sơ & giấy tờ'],
  ['Thông tin định danh', 'CCCD, hộ chiếu, thuế'],
  ['Thông tin công việc', 'Vị trí và đơn vị'],
  ['Học vấn', 'Trình độ và quá trình đào tạo'],
  ['Kinh nghiệm làm việc', 'Công ty trước đây'],
  ['Chứng chỉ', 'Gán chứng chỉ'],
  ['Thông tin ngân hàng', 'Tài khoản'],
  ['Thông tin BHXH', 'Bảo hiểm'],
  ['Liên hệ khẩn cấp', 'Người liên hệ'],
  ['Trường thông tin thêm', 'Trường tùy chỉnh'],
  ['Quyền thao tác', 'Tài khoản đăng nhập'],
  ['Ghi chú', 'Ghi chú nội bộ'],
];

const TYPE_HINT: Record<string, string> = {
  'Thử việc': 'Đang trong thời gian thử việc.',
  'Chính thức': 'Đã ký hợp đồng lao động chính thức.',
  'Thực tập': 'Sinh viên thực tập.',
  'Cộng tác viên': 'Hợp tác theo vụ việc.',
  'Học việc': 'Học nghề tại đơn vị.',
  'Thuê ngoài': 'Nhân sự của nhà cung cấp.',
  'Thời vụ': 'Làm theo mùa vụ.',
  'Part-time': 'Làm việc bán thời gian.',
};

export default function EmployeeWizard() {
  const nav = useNavigate();
  const toast = useToast();
  const { state } = useLabels();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EmployeeInput>(() => ({ ...blankEmployee(hr.getState()), nationality: 'VIỆT NAM', roleName: 'Nhân viên', appUsed: true, workCondition: 'Bình thường' }));
  const [error, setError] = useState('');
  const [trainings, setTrainings] = useState([{ school: '', major: '', from: '', to: '', note: '' }]);
  const [jobs, setJobs] = useState([{ title: '', company: '', from: '', to: '', note: '' }]);
  const [certs, setCerts] = useState([{ name: '', number: '', from: '', to: '', note: '' }]);
  const [contacts, setContacts] = useState([{ name: '', relation: '', phone: '', address: '' }]);
  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) { setForm(f => ({ ...f, [key]: value })); }
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function next() {
    if (step === 0 && form.fullName.trim().length < 2) { setError('Họ và tên là bắt buộc.'); return; }
    setError('');
    if (step < STEPS.length - 1) setStep(step + 1);
    else save();
  }
  function save() {
    const result = hr.saveEmployee({ ...form, note: [form.note, jobs.map(j => j.company).filter(Boolean).join('; '), contacts.map(c => c.name).filter(Boolean).join('; ')].filter(Boolean).join(' | ') });
    if (!result.ok) { setError(Object.values(result.errors)[0] || 'Không lưu được'); return; }
    certs.filter(c => c.name).forEach(c => hr.saveCertificate({ employeeId: result.value.id, name: c.name, issuer: '', number: c.number, issueDate: c.from, expiryDate: c.to, kind: 'Chuyên môn' }));
    toast('Đã tạo hồ sơ nhân viên');
    nav(`/m/nhan-su/thong-tin-nhan-su/${result.value.id}`);
  }

  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
      <aside>
        <div className="toolbar" style={{ paddingLeft: 0 }}><button className="btn-ghost" onClick={() => nav('/m/nhan-su/thong-tin-nhan-su')}>Quay lại</button></div>
        <p className="muted">NHÓM THÔNG TIN</p>
        <div style={{ height: 8, background: 'var(--bg)', borderRadius: 8, margin: '8px 0 12px' }}><div style={{ width: progress + '%', height: '100%', background: 'var(--blue-600)', borderRadius: 8 }} /></div>
        <small>Tiến độ hoàn thành {progress}%</small>
        {STEPS.map((item, i) => <button key={item[0]} className={'sub-item' + (i === step ? ' active' : '')} onClick={() => setStep(i)}>{i + 1}. {item[0]}<small style={{ display: 'block', fontWeight: 400 }}>{item[1]}</small></button>)}
      </aside>
      <form onSubmit={e => { e.preventDefault(); next(); }}>
        <div className="toolbar"><button type="button" className="btn-ghost" onClick={() => toast('Máy quét CCCD không được mô tả trong ghi chú.')}>Scan CCCD</button><div className="grow" /><button className="btn-primary" type="button" onClick={save}>Lưu</button></div>
        <h2>{STEPS[step][0]}</h2>
        {error && <div className="banner bad">{error}</div>}
        <div className="form-grid">
          {step === 0 && <>
            <Field label="Ảnh đại diện" className="span2"><button type="button" className="btn-ghost">PNG/JPG/JPEG ≤ 5MB</button></Field>
            <Field label="Họ và tên" required><TextInput value={form.fullName} onChange={e => set('fullName', e.target.value)} /></Field>
            <Field label="Họ và tên (Tiếng Anh)"><TextInput value={form.englishName || ''} onChange={e => set('englishName', e.target.value)} /></Field>
            <Field label="Giới tính"><Select value={form.gender} onChange={e => set('gender', e.target.value as EmployeeInput['gender'])}>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select></Field>
            <Field label="Ngày sinh"><TextInput type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></Field>
            <Field label="Quốc tịch"><TextInput value={form.nationality} onChange={e => set('nationality', e.target.value)} /></Field>
            <Field label="Dân tộc"><TextInput value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)} /></Field>
            <Field label="Tình trạng hôn nhân"><Select value={form.marital} onChange={e => set('marital', e.target.value as EmployeeInput['marital'])}>{MARITALS.map(m => <option key={m}>{m}</option>)}</Select></Field>
            <Field label="Số điện thoại"><TextInput value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="Email công ty"><TextInput value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Số điện thoại cơ quan"><TextInput value={form.officePhone || ''} onChange={e => set('officePhone', e.target.value)} /></Field>
            <Field label="Email cá nhân"><TextInput value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)} /></Field>
            <p className="section-title">Địa chỉ thường trú</p>
            <Field label="Tỉnh/Thành phố"><TextInput value={form.province || ''} onChange={e => set('province', e.target.value)} /></Field>
            <Field label="Phường/Xã"><TextInput value={form.ward || ''} onChange={e => set('ward', e.target.value)} /></Field>
            <Field label="Địa chỉ thường trú" className="span2"><TextInput value={form.address} onChange={e => set('address', e.target.value)} /></Field>
            <p className="section-title">Địa chỉ tạm trú</p>
            <button type="button" className="btn-ghost" onClick={() => set('tempAddress', form.address)}>Dùng địa chỉ thường trú</button>
            <Field label="Địa chỉ tạm trú" className="span2"><TextInput value={form.tempAddress || ''} onChange={e => set('tempAddress', e.target.value)} /></Field>
          </>}
          {step === 1 && <>
            <button type="button" className="btn-ghost span2" onClick={() => toast('Scan CCCD: thiết bị không có trong ghi chú.')}>Scan CCCD</button>
            <Field label="Số CCCD/CMND"><TextInput value={form.idNumber} onChange={e => set('idNumber', e.target.value)} /></Field>
            <Field label="Nơi cấp"><TextInput value={form.idIssuePlace} onChange={e => set('idIssuePlace', e.target.value)} /></Field>
            <Field label="Ngày cấp"><TextInput type="date" value={form.idIssueDate} onChange={e => set('idIssueDate', e.target.value)} /></Field>
            <Field label="Ảnh mặt trước"><button type="button" className="btn-ghost">Kéo thả ≤ 5MB</button></Field>
            <Field label="Ảnh mặt sau"><button type="button" className="btn-ghost">Kéo thả ≤ 5MB</button></Field>
            <Field label="Loại hộ chiếu"><TextInput placeholder="Phổ thông" /></Field>
            <Field label="Số hộ chiếu"><TextInput value={form.passportNumber || ''} onChange={e => set('passportNumber', e.target.value)} /></Field>
            <Field label="Mã số thuế cá nhân"><TextInput value={form.taxCode} onChange={e => set('taxCode', e.target.value)} /></Field>
          </>}
          {step === 2 && <>
            <Field label="Mã nhân viên"><TextInput value={form.code} placeholder="Gợi ý theo quy tắc mặc định" onChange={e => set('code', e.target.value)} /></Field>
            <Field label="Ngày đi làm"><TextInput type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
            <Field label="Vị trí công việc"><Select value={form.positionId} onChange={e => set('positionId', e.target.value)}><option value="">Chọn</option>{state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Vị trí kiêm nhiệm"><TextInput value={form.concurrentPosition || ''} onChange={e => set('concurrentPosition', e.target.value)} /></Field>
            <Field label="Vùng lương tối thiểu"><TextInput value={form.salaryRegion || ''} onChange={e => set('salaryRegion', e.target.value)} /></Field>
            <Field label="Chi nhánh làm việc"><Select value={form.branchId} onChange={e => set('branchId', e.target.value)}>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
            <Field label="Đơn vị"><Select value={form.unitId} onChange={e => set('unitId', e.target.value)}><option value="">Chọn</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
            <div className="span2">{EMPLOYMENT_TYPES.map(t => <button type="button" key={t} className={'feature' + (form.employmentType === t ? ' on' : '')} onClick={() => set('employmentType', t as EmploymentType)}><b>{t}</b><small>{TYPE_HINT[t]}</small></button>)}</div>
            <Field label="Quản lý trực tiếp"><Select value={form.managerId ?? ''} onChange={e => set('managerId', e.target.value || null)}><option value="">Lấy theo cơ cấu tổ chức</option>{state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
            <label className="chk"><input type="checkbox" checked={Boolean(form.noAttendance)} onChange={e => set('noAttendance', e.target.checked)} /> Không yêu cầu chấm công</label>
          </>}
          {step === 3 && <>
            <Field label="Trình độ học vấn cao nhất"><Select value={form.educationLevel || ''} onChange={e => set('educationLevel', e.target.value)}><option value="">Chọn</option><option>Phổ thông</option><option>Trung cấp</option><option>Cao đẳng</option><option>Đại học</option><option>Thạc sĩ</option></Select></Field>
            <Field label="Trường học"><TextInput value={form.school || ''} onChange={e => set('school', e.target.value)} /></Field>
            <Field label="Chuyên ngành"><TextInput value={form.major || ''} onChange={e => set('major', e.target.value)} /></Field>
            <Field label="Năm tốt nghiệp"><TextInput value={form.gradYear || ''} onChange={e => set('gradYear', e.target.value)} /></Field>
            {trainings.map((row, i) => <div key={i} className="mini-card span2"><h4>Quá trình đào tạo #{i + 1}</h4><div className="form-grid"><Field label="Trường học"><TextInput value={row.school} onChange={e => setTrainings(c => c.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} /></Field><Field label="Chuyên ngành"><TextInput value={row.major} onChange={e => setTrainings(c => c.map((x, j) => j === i ? { ...x, major: e.target.value } : x))} /></Field><Field label="Từ"><TextInput type="date" value={row.from} onChange={e => setTrainings(c => c.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} /></Field><Field label="Đến"><TextInput type="date" value={row.to} onChange={e => setTrainings(c => c.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} /></Field><Field label="Mô tả" className="span2"><TextInput value={row.note} onChange={e => setTrainings(c => c.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} /></Field></div></div>)}
            <button type="button" className="btn-ghost" onClick={() => setTrainings(c => [...c, { school: '', major: '', from: '', to: '', note: '' }])}>Thêm thông tin học vấn</button>
          </>}
          {step === 4 && <>
            {jobs.map((row, i) => <div key={i} className="mini-card span2"><h4>#{i + 1}</h4><div className="form-grid"><Field label="Vị trí làm việc"><TextInput value={row.title} onChange={e => setJobs(c => c.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} /></Field><Field label="Công ty"><TextInput value={row.company} onChange={e => setJobs(c => c.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} /></Field><Field label="Từ"><TextInput type="date" value={row.from} onChange={e => setJobs(c => c.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} /></Field><Field label="Đến"><TextInput type="date" value={row.to} onChange={e => setJobs(c => c.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} /></Field><Field label="Mô tả" className="span2"><TextInput value={row.note} onChange={e => setJobs(c => c.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} /></Field></div></div>)}
            <button type="button" className="btn-ghost" onClick={() => setJobs(c => [...c, { title: '', company: '', from: '', to: '', note: '' }])}>Thêm thông tin kinh nghiệm làm việc</button>
          </>}
          {step === 5 && <>
            {certs.map((row, i) => <div key={i} className="mini-card span2"><h4>Chứng chỉ #{i + 1}</h4><div className="form-grid"><Field label="Chứng chỉ"><TextInput value={row.name} onChange={e => setCerts(c => c.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field><Field label="Số hiệu chứng chỉ"><TextInput value={row.number} onChange={e => setCerts(c => c.map((x, j) => j === i ? { ...x, number: e.target.value } : x))} /></Field><Field label="Ngày bắt đầu hiệu lực"><TextInput type="date" value={row.from} onChange={e => setCerts(c => c.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} /></Field><Field label="Ngày hết hạn"><TextInput type="date" value={row.to} onChange={e => setCerts(c => c.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} /></Field><Field label="Ghi chú" className="span2"><TextInput value={row.note} onChange={e => setCerts(c => c.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} /></Field><Field label="Tải lên file"><button type="button" className="btn-ghost">pdf/ảnh/office ≤ 20MB</button></Field></div></div>)}
            <button type="button" className="btn-ghost" onClick={() => setCerts(c => [...c, { name: '', number: '', from: '', to: '', note: '' }])}>Gán chứng chỉ</button>
          </>}
          {step === 6 && <>
            <Field label="Số tài khoản"><TextInput value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} /></Field>
            <Field label="Ngân hàng"><TextInput value={form.bankName} onChange={e => set('bankName', e.target.value)} /></Field>
            <Field label="Chi nhánh"><TextInput value={form.bankBranch || ''} onChange={e => set('bankBranch', e.target.value)} /></Field>
          </>}
          {step === 7 && <>
            <Field label="Mã BHXH"><TextInput value={form.siNumber} onChange={e => set('siNumber', e.target.value)} /></Field>
            <Field label="Số thẻ BHYT"><TextInput value={form.hiNumber} onChange={e => set('hiNumber', e.target.value)} /></Field>
            <Field label="Thời gian đóng BHXH trước đây (tháng)"><TextInput value={form.siMonths || ''} onChange={e => set('siMonths', e.target.value)} /></Field>
            <Field label="Bệnh viện đăng ký KCB"><TextInput value={form.hospital} onChange={e => set('hospital', e.target.value)} /></Field>
            <Field label="Điều kiện làm việc"><TextInput value={form.workCondition || 'Bình thường'} onChange={e => set('workCondition', e.target.value)} /></Field>
            <Field label="Tỉnh/TP đăng ký khai sinh"><TextInput value={form.province || ''} onChange={e => set('province', e.target.value)} /></Field>
          </>}
          {step === 8 && <>
            {contacts.map((row, i) => <div key={i} className="mini-card span2"><h4>Người liên hệ #{i + 1}</h4><div className="form-grid"><Field label="Họ và tên"><TextInput value={row.name} onChange={e => setContacts(c => c.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field><Field label="Quan hệ"><TextInput value={row.relation} onChange={e => setContacts(c => c.map((x, j) => j === i ? { ...x, relation: e.target.value } : x))} /></Field><Field label="Số điện thoại"><TextInput value={row.phone} onChange={e => setContacts(c => c.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} /></Field><Field label="Địa chỉ tạm trú"><TextInput value={row.address} onChange={e => setContacts(c => c.map((x, j) => j === i ? { ...x, address: e.target.value } : x))} /></Field></div></div>)}
            <button type="button" className="btn-ghost" onClick={() => setContacts(c => [...c, { name: '', relation: '', phone: '', address: '' }])}>Thêm người liên hệ</button>
          </>}
          {step === 9 && <p className="span2">Chưa có trường thông tin tùy chỉnh. Thêm ở Cài đặt nhân sự → Cấu hình trường thông tin nhân sự.</p>}
          {step === 10 && <>
            <p className="span2 muted">Nhân viên dùng email hoặc số điện thoại này để đăng nhập (web và app).</p>
            <Field label="Email hoặc số điện thoại đăng nhập"><TextInput value={form.email || form.phone} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Quyền thao tác"><Select value={form.roleName || 'Nhân viên'} onChange={e => set('roleName', e.target.value)}><option>Nhân viên</option><option>Quản lý</option><option>Admin</option><option>Super Admin</option></Select></Field>
          </>}
          {step === 11 && <Field label="Ghi chú" className="span2"><TextArea rows={8} value={form.note} onChange={e => set('note', e.target.value)} /></Field>}
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</button>
          <button className="btn-primary" type="submit">{step === STEPS.length - 1 ? 'Lưu' : 'Tiếp tục'}</button>
        </div>
      </form>
    </div>
  );
}
