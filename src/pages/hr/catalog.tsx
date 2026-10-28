import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Donut } from '../../components/Charts';
import { DataTable, type Column } from '../../components/DataTable';
import { Drawer, FilterPanel } from '../../components/Drawer';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { personInitial } from '../../components/Person';
import { useToast } from '../../components/feedback';
import { actualHeadcount } from '../../data/derive';
import { DECISION_TYPES } from '../../data/labels';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import type { DecisionType } from '../../data/types';
import { fmtDate, fmtMoney, includesPlain, todayISO } from '../../data/text';
import { useLabels } from './lookups';

function Gate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState('');
  if (ok) return <>{children}</>;
  return <form className="card pad-card" onSubmit={e => { e.preventDefault(); if (pw.trim()) setOk(true); }}><h3>Bảo mật thông tin</h3><p>Nhập lại mật khẩu. Bản demo chấp nhận mọi mật khẩu khác rỗng.</p><input className="control" type="password" aria-label="Mật khẩu" value={pw} onChange={e => setPw(e.target.value)} /><button className="btn-primary">Tiếp tục</button></form>;
}

export function ContractsPage() {
  const labels = useLabels();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(false);
  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', start: '', end: '', type: 'Xác định thời hạn', code: '', name: '', signed: '', signStatus: 'Chờ ký', note: '', bhxh: false });
  const rows = labels.state.contracts.filter(c => {
    const emp = labels.employee(c.employeeId);
    return includesPlain([c.code, emp?.fullName ?? '', emp?.code ?? ''].join(' '), q) && (!type || c.type === type);
  }).map((c, i) => ({ ...c, stt: i + 1 }));
  return <Gate><div className="card panel">
    <div className="toolbar">
      <div className="in-search">🔍<input aria-label="Tìm hợp đồng" placeholder="Mã hợp đồng, tên hợp đồng, tên nhân viên, mã nhân viên" value={q} onChange={e => setQ(e.target.value)} /></div>
      <button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>
      <button className="btn-ghost" onClick={() => toast('Import hợp đồng: mẫu cột chưa có trong ghi chú.')}>Import ▾</button>
      <button className="btn-ghost">Export ▾</button>
      <button className="btn-primary" onClick={() => setOpen(true)}>Thêm hợp đồng mới</button>
    </div>
    <DataTable rows={rows} columns={[
      { id: 'stt', header: 'STT', cell: r => r.stt },
      { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName ?? '—' },
      { id: 'code', header: 'Mã hợp đồng', sort: r => r.code, cell: r => r.code },
      { id: 'type', header: 'Loại hợp đồng', cell: r => r.type },
      { id: 'end', header: 'Ngày hết hạn', sort: r => r.endDate, cell: r => r.endDate ? fmtDate(r.endDate) : '—' },
      { id: 'sign', header: 'Trạng thái ký', cell: r => r.signedDate ? 'Đã ký' : 'Chưa ký' },
      { id: 'st', header: 'Trạng thái hiệu lực', cell: r => r.status },
      { id: 'a', header: 'Tạm hoãn từ', cell: () => '—' },
      { id: 'b', header: 'Tạm hoãn đến', cell: () => '—' },
      { id: 'act', header: 'Tác vụ', cell: () => <button className="btn-ghost btn-sm" title="Menu dòng chưa được khảo sát">⋯</button> },
    ]} filterKey={q + type} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" />
    {filter && <FilterPanel title="Tìm kiếm nâng cao" onClose={() => setFilter(false)} onClear={() => setType('')}>
      <Field label="Loại hợp đồng"><Select value={type} onChange={e => setType(e.target.value)}><option value="">Tất cả</option><option>Thử việc</option><option>Xác định thời hạn</option><option>Không xác định thời hạn</option></Select></Field>
      <Field label="Đối tượng áp dụng"><span className="muted">Đơn vị, vị trí</span></Field>
      <Field label="Ngày hết hạn"><TextInput type="date" /></Field>
      <Field label="Ngày tạo"><TextInput type="date" /></Field>
      <Field label="Trạng thái hợp đồng"><Select><option>Hiệu lực</option><option>Thanh lý</option></Select></Field>
      <Field label="Trạng thái ký"><Select><option>Đã ký</option><option>Chưa ký</option></Select></Field>
    </FilterPanel>}
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal wide" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveContract({ employeeId: form.employeeId, code: form.code, type: form.type as 'Xác định thời hạn', startDate: form.start, endDate: form.end, signedDate: form.signed, salary: 0, status: form.signStatus === 'Đã ký' ? 'Hiệu lực' : 'Chờ ký', note: form.name + (form.bhxh ? ' · đóng BHXH' : '') + ' ' + form.note }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } toast('Đã thêm hợp đồng'); setOpen(false); }}><header><b>Thêm thông tin hợp đồng</b></header>
      <div className="form-grid">
        <Field label="Nhân viên" required><Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">Chọn</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
        <Field label="Ngày bắt đầu" required><TextInput type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></Field>
        <Field label="Ngày kết thúc"><TextInput type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></Field>
        <Field label="Loại hợp đồng" required><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Xác định thời hạn</option><option>Không xác định thời hạn</option><option>Thử việc</option></Select></Field>
        <Field label="Số hợp đồng" required><TextInput placeholder="Số HĐ/Mã HĐ" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label="Tên hợp đồng" required><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Ngày ký" required><TextInput type="date" value={form.signed} onChange={e => setForm({ ...form, signed: e.target.value })} /></Field>
        <Field label="Trạng thái ký hợp đồng" required><Select value={form.signStatus} onChange={e => setForm({ ...form, signStatus: e.target.value })}><option>Chờ ký</option><option>Đã ký</option></Select></Field>
        <Field label="Ghi chú" className="span2"><TextArea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
        <label className="chk span2"><input type="checkbox" checked={form.bhxh} onChange={e => setForm({ ...form, bhxh: e.target.checked })} /> Sử dụng hợp đồng này để đóng BHXH</label>
      </div>
      <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy bỏ</button><button className="btn-primary">Tiếp tục</button></div>
    </form></div>}
  </div></Gate>;
}

export function HeadcountPage() {
  const { state, unit, position } = useLabels();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [compact, setCompact] = useState(false);
  const [q, setQ] = useState('');
  const rows = state.headcounts.filter(h => (!q || includesPlain(unit(h.unitId) + position(h.positionId), q)));
  const actual = (h: typeof rows[number]) => actualHeadcount(state, h.unitId, h.positionId);
  return (
    <div className="card panel">
      <div className="toolbar">
        <input className="control" placeholder="Chọn đơn vị, vị trí, nhân viên" value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm định biên" />
        <TextInput aria-label="Tháng" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <label className="chk"><input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} /> Xem rút gọn</label>
        <button className="btn-ghost">Quản lý định biên ▾</button>
      </div>
      <p className="hint">Chỉnh sửa thủ công và Import chưa có form trong ghi chú. Tháng đang xem: {month}.</p>
      <table className="tbl"><thead><tr><th>BỘ PHẬN</th><th>VỊ TRÍ</th>{!compact && <><th>ĐỊNH BIÊN</th><th>THỰC TẾ</th><th>DỰ KIẾN SẮP ĐI LÀM</th><th>DỰ KIẾN SẮP NGHỈ VIỆC</th><th>ĐỊA ĐIỂM LÀM VIỆC</th></>}</tr></thead>
        <tbody>{state.units.filter(u => !u.parentId).map(root => <tr key={root.id}><td><b>{root.name}</b></td><td></td>{!compact && <><td>{rows.filter(h => state.units.some(u => (u.id === root.id || u.parentId) && h.unitId)).reduce((s, h) => s + h.planned, 0)}</td><td>{state.employees.filter(e => e.status !== 'Đã nghỉ việc').length}</td><td>0</td><td>0</td><td></td></>}</tr>)}
        {rows.map(h => <tr key={h.id}><td>{unit(h.unitId)}</td><td>{position(h.positionId)}</td>{!compact && <><td>{h.planned}</td><td>{actual(h)}</td><td>0</td><td>{state.employees.filter(e => e.unitId === h.unitId && e.positionId === h.positionId && e.resignDate).length}</td><td>{state.branches.find(b => b.id === state.units.find(u => u.id === h.unitId)?.branchId)?.name}</td></>}</tr>)}
      </tbody></table>
    </div>
  );
}

export function FamilyPage() {
  const labels = useLabels();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', name: '', dob: '', gender: 'Nam', nationality: 'Việt Nam', idNumber: '', issueDate: '', issuePlace: '', relation: 'Con', dependent: true, household: false });
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost" onClick={() => toast('Import người phụ thuộc: mẫu cột chưa có trong ghi chú.')}>Import</button><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button></div>
    <DataTable rows={labels.state.dependents.map((d, i) => ({ ...d, stt: i + 1 }))} columns={[
      { id: 'stt', header: 'STT', cell: r => r.stt }, { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName ?? '' }, { id: 'name', header: 'Họ tên', cell: r => r.name }, { id: 'rel', header: 'Quan hệ', cell: r => r.relation }, { id: 'dob', header: 'Ngày sinh', cell: r => fmtDate(r.dob) }, { id: 'dep', header: 'Phụ thuộc', cell: r => r.taxDependent ? 'Có' : 'Không' }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteDependent(r.id)}>Xóa</button> },
    ]} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveDependent({ employeeId: form.employeeId, name: form.name, relation: form.relation, dob: form.dob, idNumber: form.idNumber, taxDependent: form.dependent, fromDate: '', toDate: '' }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } toast('Đã lưu'); setOpen(false); }}><header><b>Người phụ thuộc</b></header><div className="form-grid">
      <Field label="Nhân viên"><Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">Chọn</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
      <Field label="Họ tên thành viên"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Ngày sinh"><TextInput type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></Field>
      <Field label="Giới tính"><Select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Nam</option><option>Nữ</option></Select></Field>
      <Field label="Quốc tịch"><TextInput value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></Field>
      <Field label="CMND/CCCD"><TextInput value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} /></Field>
      <Field label="Ngày cấp"><TextInput type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></Field>
      <Field label="Nơi cấp"><TextInput value={form.issuePlace} onChange={e => setForm({ ...form, issuePlace: e.target.value })} /></Field>
      <Field label="Mối quan hệ với NLĐ"><TextInput value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} /></Field>
      <label className="chk"><input type="checkbox" checked={form.dependent} onChange={e => setForm({ ...form, dependent: e.target.checked })} /> Là người phụ thuộc của NLĐ</label>
      <label className="chk"><input type="checkbox" checked={form.household} onChange={e => setForm({ ...form, household: e.target.checked })} /> Nằm trong hộ khẩu</label>
    </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy bỏ</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

export function CertificatesPage() {
  const labels = useLabels();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', name: '', number: '', from: '', to: '', note: '' });
  const rows = labels.state.certificates.filter(c => includesPlain(labels.employee(c.employeeId)?.fullName ?? '', q));
  return <div className="card panel"><div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm chứng chỉ" placeholder="Tìm theo tên nhân viên" value={q} onChange={e => setQ(e.target.value)} /></div><button className="btn-ghost">Bộ lọc</button><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới ▾</button></div>
    <DataTable rows={rows} columns={[
      { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName ?? '' },
      { id: 'kind', header: 'Loại chứng chỉ', cell: r => r.name },
      { id: 'no', header: 'Số hiệu chứng chỉ', cell: r => r.number },
      { id: 'st', header: 'Trạng thái', cell: r => r.expiryDate && r.expiryDate < todayISO() ? 'Hết hạn' : 'Còn hạn' },
      { id: 'from', header: 'Ngày bắt đầu hiệu lực', cell: r => fmtDate(r.issueDate) },
      { id: 'to', header: 'Ngày hết hạn', cell: r => fmtDate(r.expiryDate) },
      { id: 'file', header: 'Đính kèm', cell: () => '—' },
      { id: 'created', header: 'Ngày tạo', cell: () => '—' },
      { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteCertificate(r.id)}>Xóa</button> },
    ]} filterKey={q} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveCertificate({ employeeId: form.employeeId, name: form.name, issuer: '', number: form.number, issueDate: form.from, expiryDate: form.to, kind: form.note || 'Chuyên môn' }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } setOpen(false); }}><header><b>Thêm chứng chỉ nhân viên</b></header><div className="form-grid">
      <Field label="Nhân viên"><Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">Chọn</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
      <Field label="Loại chứng chỉ"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Số hiệu"><TextInput value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></Field>
      <Field label="Ngày bắt đầu hiệu lực"><TextInput type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} /></Field>
      <Field label="Ngày hết hạn"><TextInput type="date" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} /></Field>
      <Field label="Ghi chú"><TextInput value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
      <Field label="Danh sách link"><button type="button" className="btn-ghost">Thêm link</button></Field>
      <Field label="Tải lên file"><button type="button" className="btn-ghost">≤ 20MB</button></Field>
    </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

export function DirectoryPage() {
  const labels = useLabels();
  const [q, setQ] = useState('');
  const people = labels.state.employees.filter(e => e.status !== 'Đã nghỉ việc' && includesPlain([e.fullName, e.phone, e.email, e.code].join(' '), q));
  return <div><div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm danh bạ" value={q} onChange={e => setQ(e.target.value)} placeholder="Tên, email, số điện thoại" /></div></div>
    <div className="feature-grid">{people.map(e => <article key={e.id} className="card"><div className="av">{personInitial(e.fullName)}</div><b>{e.fullName}</b><small>{labels.unit(e.unitId)} · {labels.position(e.positionId)}</small><div><span className="pill ok">{e.status}</span> <span className="chip">{e.employmentType}</span></div><p>{e.phone}</p><p>{e.email}</p><p>{e.code}</p><p>{fmtDate(e.dob)} · vào làm {fmtDate(e.startDate)}</p></article>)}</div></div>;
}

export function HrDelegationPage({ mode }: { mode: 'all' | 'mine' | 'received' }) {
  const { state } = useLabels();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ fromName: USER.name, toName: '', start: todayISO(), end: todayISO(), requests: true, proposals: false, decisions: false, note: '' });
  const rows = state.delegations.filter(d => (mode === 'mine' ? d.fromName === USER.name : mode === 'received' ? d.toName === USER.name : true) && (!who || d.toName === who) && (!status || (status === 'Hiệu lực' ? d.active : !d.active)));
  return <div className="card panel"><div className="toolbar">
    <Select aria-label="Đối tượng duyệt thay" value={who} onChange={e => setWho(e.target.value)}><option value="">Đối tượng duyệt thay</option>{[...new Set(state.delegations.map(d => d.toName))].map(n => <option key={n}>{n}</option>)}</Select>
    <Select aria-label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}><option value="">Trạng thái</option><option>Hiệu lực</option><option>Hết hiệu lực</option></Select>
    {mode !== 'received' && <button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button>}
  </div>
    <DataTable rows={rows.map(r => ({ ...r, code: r.id.slice(-6).toUpperCase() }))} columns={[
      { id: 'code', header: 'Mã ủy quyền', cell: r => r.code },
      { id: 'from', header: 'Người ủy quyền', cell: r => r.fromName },
      { id: 'to', header: 'Người được ủy quyền', cell: r => r.toName },
      { id: 'obj', header: 'Đối tượng duyệt thay', cell: r => r.types.length ? 'Đơn từ' : 'Đơn từ' },
      { id: 'when', header: 'Thời gian áp dụng', cell: r => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
      { id: 'st', header: 'Trạng thái', cell: r => r.active ? 'Hiệu lực' : 'Hết hiệu lực' },
    ]} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const r = hr.saveDelegation({ fromName: form.fromName, toName: form.toName, startDate: form.start, endDate: form.end, types: form.requests ? [] : [], active: true }); if (!r.ok) { toast(r.errors.form || r.errors.endDate); return; } toast('Đã lưu ủy quyền. ' + [form.requests && 'Đơn từ', form.proposals && 'Đề xuất', form.decisions && 'Quyết định nhân sự'].filter(Boolean).join(', ')); setOpen(false); }}><header><b>Thêm ủy quyền</b></header><div className="form-grid">
      <Field label="Người ủy quyền" required><TextInput value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} /></Field>
      <Field label="Người được ủy quyền" required><TextInput value={form.toName} onChange={e => setForm({ ...form, toName: e.target.value })} /></Field>
      <Field label="Ngày bắt đầu"><TextInput type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></Field>
      <Field label="Ngày kết thúc"><TextInput type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></Field>
      <label className="chk"><input type="checkbox" checked={form.requests} onChange={e => setForm({ ...form, requests: e.target.checked })} /> Đơn từ</label>
      <label className="chk"><input type="checkbox" checked={form.proposals} onChange={e => setForm({ ...form, proposals: e.target.checked })} /> Đề xuất</label>
      <label className="chk"><input type="checkbox" checked={form.decisions} onChange={e => setForm({ ...form, decisions: e.target.checked })} /> Quyết định nhân sự</label>
      <Field label="Ghi chú" className="span2"><TextArea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
    </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

export function InsuranceDeclarePage() {
  const rows = [{ id: 'hs-1', no: 'HS0001', name: 'Hồ sơ BHXH tháng mẫu', period: todayISO().slice(0, 7), date: todayISO(), status: 'Nháp', notice: '—' }];
  return <div className="card panel"><div className="toolbar"><Select aria-label="Trạng thái hồ sơ"><option>Trạng thái hồ sơ</option><option>Nháp</option><option>Đã nộp</option></Select><button className="btn-primary" onClick={() => alert('Form Lập hồ sơ chưa có trong ghi chú khảo sát.')}>Lập hồ sơ</button></div>
    <DataTable rows={rows} columns={[{ id: 'no', header: 'Số hồ sơ', cell: r => r.no }, { id: 'name', header: 'Tên hồ sơ', cell: r => r.name }, { id: 'period', header: 'Kỳ nộp', cell: r => r.period }, { id: 'date', header: 'Ngày nộp', cell: r => fmtDate(r.date) }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'notice', header: 'Thông báo tình trạng nộp', cell: r => r.notice }]} /></div>;
}

export function InsuranceInfoPage() {
  const labels = useLabels();
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost">Export</button><button className="btn-ghost">Import</button><button className="btn-primary">Thêm thông tin BHXH</button></div>
    <DataTable rows={labels.state.employees} columns={[
      { id: 'name', header: 'Nhân sự', cell: r => r.fullName }, { id: 'si', header: 'Mã BHXH', cell: r => r.siNumber }, { id: 'hi', header: 'Số thẻ BHYT', cell: r => r.hiNumber }, { id: 'kcb', header: 'KCB', cell: r => r.hospital }, { id: 'months', header: 'Tháng đóng trước', cell: r => r.siMonths || '—' }, { id: 'cond', header: 'Điều kiện làm việc', cell: r => r.workCondition || 'Bình thường' },
    ]} /></div>;
}

const DECISION_CARDS: { group: string; type: DecisionType; fields: string[] }[] = [
  { group: 'Vận hành & Phát triển', type: 'Bổ nhiệm', fields: ['Hình thức bổ nhiệm', 'Lý do bổ nhiệm', 'Vị trí mới', 'Vị trí kiêm nhiệm', 'Loại hình nhân sự'] },
  { group: 'Vận hành & Phát triển', type: 'Miễn nhiệm', fields: ['Vị trí được miễn nhiệm', 'Lý do miễn nhiệm', 'Người nhận bàn giao', 'Giữ nhân sự lại làm việc tiếp?', 'Vị trí sau miễn nhiệm'] },
  { group: 'Vận hành & Phát triển', type: 'Điều chuyển nội bộ', fields: ['Vị trí mới', 'Vị trí kiêm nhiệm mới', 'Chi nhánh làm việc', 'Lý do điều chuyển'] },
  { group: 'Vận hành & Phát triển', type: 'Điều chỉnh lương & phụ cấp', fields: ['Loại điều chỉnh', 'Lý do điều chỉnh'] },
  { group: 'Vận hành & Phát triển', type: 'Tạm hoãn HĐLĐ', fields: ['Lý do tạm hoãn', 'Người nhận bàn giao', 'Chi trả lương', 'Chế độ BHXH', 'Chi tiết lý do'] },
  { group: 'Xử lý vi phạm', type: 'Tạm đình chỉ công việc', fields: ['Thời gian từ', 'Thời gian đến', 'Lý do', 'Số ngày', 'Ngày phát sinh', 'Mức độ ảnh hưởng', 'Mô tả', 'Phương án chấm công', 'Tỷ lệ tạm ứng lương', 'Đóng BHXH', 'Truy cập hệ thống', 'Người nhận bàn giao'] },
  { group: 'Xử lý vi phạm', type: 'Sa thải', fields: ['Lý do sa thải', 'Chi tiết', 'Ngày phát sinh', 'Mức độ', 'Giá trị thiệt hại', 'Ngày họp', 'Địa điểm họp', 'Có mặt', 'Ngày làm việc cuối', 'Người nhận bàn giao'] },
  { group: 'Chấm dứt & Rời đi', type: 'Chấm dứt HĐLĐ', fields: ['Lý do chấm dứt', 'Ngày làm việc cuối cùng', 'Chi tiết lý do'] },
];

export function DecisionListPage({ view }: { view: 'all' | 'mine' | 'approve' | 'proxy' | 'watch' }) {
  const labels = useLabels();
  const [filter, setFilter] = useState(false);
  const [create, setCreate] = useState(false);
  const [qType, setQType] = useState('');
  const rows = labels.state.decisions.filter(d => {
    if (view === 'mine' && d.createdBy !== USER.name) return false;
    if (view === 'approve' && d.status !== 'Chờ duyệt') return false;
    if (view === 'watch' && d.createdBy === USER.name) return false;
    if (qType && d.type !== qType) return false;
    return true;
  });
  return <div className="card panel">
    <div className="toolbar"><button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>{view !== 'approve' && view !== 'watch' && <button className="btn-primary" onClick={() => setCreate(true)}>Thêm mới</button>}{view === 'proxy' && <span className="pill">Chi tiết quyết định</span>}</div>
    <DataTable rows={rows} columns={[
      { id: 'c', header: '', cell: () => <input type="checkbox" aria-label="Chọn" /> },
      { id: 'by', header: 'Người tạo', cell: r => r.createdBy },
      { id: 'code', header: 'Số quyết định', sort: r => r.code, cell: r => r.code },
      { id: 'type', header: 'Loại quyết định', cell: r => r.type },
      { id: 'emp', header: 'Đối tượng áp dụng', cell: r => labels.employee(r.employeeId)?.fullName ?? '—' },
      { id: 'st', header: 'Trạng thái', cell: r => r.status },
      { id: 'deadline', header: 'Hạn xử lý cấp duyệt', cell: () => '—' },
      { id: 'eff', header: 'Ngày hiệu lực', cell: r => fmtDate(r.effectiveDate) },
      { id: 'day', header: 'Ngày quyết định', cell: r => fmtDate(r.createdAt.slice(0, 10)) },
    ]} empty="Chưa có thông tin" filterKey={view + qType} />
    {filter && <FilterPanel title="Tìm kiếm nâng cao" onClose={() => setFilter(false)} onClear={() => setQType('')}><Field label="Loại quyết định"><Select value={qType} onChange={e => setQType(e.target.value)}><option value="">Tất cả</option>{DECISION_TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field><Field label="Đơn vị, vị trí"><span className="muted">Lọc theo hồ sơ nhân sự</span></Field><Field label="Ngày quyết định"><TextInput type="date" /></Field><Field label="Ngày hiệu lực"><TextInput type="date" /></Field></FilterPanel>}
    {create && <DecisionCreate onClose={() => setCreate(false)} />}
  </div>;
}

function DecisionCreate({ onClose }: { onClose: () => void }) {
  const labels = useLabels();
  const toast = useToast();
  const [type, setType] = useState<DecisionType | ''>('');
  const [employeeId, setEmployeeId] = useState('');
  const [day, setDay] = useState(todayISO());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState('');
  const [code, setCode] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [content, setContent] = useState('');
  const card = DECISION_CARDS.find(c => c.type === type);
  function send(submit: boolean) {
    if (!type || !employeeId) { toast('Chọn loại và người áp dụng.'); return; }
    const result = hr.saveDecision({ title: type, type, employeeId, content: content || Object.entries(fields).map(([k, v]) => k + ': ' + v).join('\n'), effectiveDate: from || day, submit, extras: { ...fields, code, to } }, undefined, USER.name);
    if (!result.ok) { toast(Object.values(result.errors)[0]); return; }
    toast(submit ? 'Đã gửi duyệt' : 'Đã lưu nháp');
    onClose();
  }
  return <Drawer title="Tạo quyết định mới" onClose={onClose} wide footer={<><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-ghost" onClick={() => send(false)}>Lưu nháp</button><button className="btn-primary" onClick={() => send(true)}>Gửi duyệt</button></>}>
    {!type ? <div>{['Vận hành & Phát triển', 'Xử lý vi phạm', 'Chấm dứt & Rời đi'].map(group => <div key={group}><h3>{group}</h3><div className="feature-grid">{DECISION_CARDS.filter(c => c.group === group).map(c => <button key={c.type} className="feature" onClick={() => setType(c.type)}><b>{c.type}</b></button>)}</div></div>)}</div> : <div className="form-grid">
      <button type="button" className="link" onClick={() => toast('Quy trình duyệt đang ở Cài đặt quyết định.')}>Xem quy trình duyệt</button>
      <Field label="Số quyết định"><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field>
      <Field label="Người áp dụng"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Chọn</option>{labels.state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
      <Field label="Ngày quyết định"><TextInput type="date" value={day} onChange={e => setDay(e.target.value)} /></Field>
      <Field label="Hiệu lực từ"><TextInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>
      <Field label="Hiệu lực đến"><TextInput type="date" value={to} onChange={e => setTo(e.target.value)} /></Field>
      <p className="muted span2">Bắt buộc nhập ngày bắt đầu. Để trống ngày kết thúc nếu hiệu lực không xác định thời hạn.</p>
      {card?.fields.map(name => <Field key={name} label={name}><TextInput value={fields[name] || ''} onChange={e => setFields({ ...fields, [name]: e.target.value })} /></Field>)}
      {type === 'Điều chỉnh lương & phụ cấp' && <p className="span2">Bảng thu nhập - phụ cấp hiện tại và mới sẽ hiện sau khi chọn người. Các khoản lấy từ hợp đồng: {fmtMoney(labels.state.contracts.find(c => c.employeeId === employeeId)?.salary || 0)}.</p>}
      <Field label="Nội dung" className="span2"><TextArea value={content} onChange={e => setContent(e.target.value)} /></Field>
      <Field label="Đính kèm" className="span2"><button type="button" className="btn-ghost">PDF, DOCX, XLSX, JPG, PNG ≤ 5MB</button></Field>
    </div>}
  </Drawer>;
}

export function RewardBatchPage({ kind }: { kind: 'reward' | 'discipline' }) {
  const labels = useLabels();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState(0);
  const rows = labels.state.rewards.filter(r => r.kind === kind);
  return <div className="card panel"><div className="toolbar"><span className="muted">{kind === 'discipline' ? 'Trạng thái thực hiện' : 'Tìm kiếm nâng cao'}</span><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button></div>
    <DataTable rows={rows} columns={kind === 'reward' ? [
      { id: 'code', header: 'Mã', cell: r => r.id.slice(-4) }, { id: 'name', header: 'Tên đợt khen thưởng', cell: r => r.title }, { id: 'date', header: 'Ngày quyết định', cell: r => fmtDate(r.date) }, { id: 'form', header: 'Hình thức', cell: r => r.form }, { id: 'list', header: 'Danh sách', cell: r => labels.employee(r.employeeId)?.fullName ?? '' }, { id: 'sum', header: 'Tổng khoản thưởng', cell: r => fmtMoney(r.amount) }, { id: 'st', header: 'Trạng thái thực hiện', cell: () => 'Đã ghi nhận' }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteReward(r.id)}>Xóa</button> },
    ] : [
      { id: 'name', header: 'Tên đợt kỷ luật', cell: r => r.title }, { id: 'date', header: 'Ngày quyết định', cell: r => fmtDate(r.date) }, { id: 'reason', header: 'Lý do kỷ luật', cell: r => r.reason }, { id: 'sum', header: 'Tổng khoản phạt', cell: r => fmtMoney(r.amount) }, { id: 'st', header: 'Trạng thái thực hiện', cell: () => 'Đã ghi nhận' }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => hr.deleteReward(r.id)}>Xóa</button> },
    ]} />
    {open && <Drawer title={kind === 'reward' ? 'Tạo đợt khen thưởng' : 'Tạo đợt kỷ luật'} onClose={() => setOpen(false)} footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary" onClick={() => { const r = hr.saveReward({ employeeId, kind, title: name, form: kind === 'reward' ? 'Chuyển khoản' : 'Khiển trách', date, amount, reason, decisionId: null }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } toast('Đã lưu'); setOpen(false); }}>Lưu</button></>}>
      <div className="form-grid">
        <Field label="Tên đợt"><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Ngày quyết định"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Nhân viên"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Chọn</option>{labels.state.employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</Select></Field>
        <Field label={kind === 'reward' ? 'Giá trị khen thưởng' : 'Giá trị kỷ luật'}><TextInput type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></Field>
        <Field label="Lý do" className="span2"><TextArea value={reason} onChange={e => setReason(e.target.value)} /></Field>
        <p className="muted span2">Hình thức Tiền mặt/Chuyển khoản · Trạng thái Chưa thực hiện · Đính kèm pdf,jpg,jpeg,png ≤ 5MB. Danh sách nhiều người: thêm từng dòng.</p>
      </div>
    </Drawer>}
  </div>;
}

export function HrReportPage() {
  const { state } = useLabels();
  const active = state.employees.filter(e => e.status !== 'Đã nghỉ việc');
  const month = todayISO().slice(0, 7);
  const by = (pick: (e: typeof active[number]) => string) => {
    const map = new Map<string, number>();
    active.forEach(e => map.set(pick(e), (map.get(pick(e)) ?? 0) + 1));
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  };
  return <div>
    <div className="kpis"><div className="kpi"><small>Tổng số nhân sự hoạt động</small><b>{active.length}</b></div><div className="kpi"><small>Tiếp nhận tháng này</small><b>{state.employees.filter(e => e.startDate.startsWith(month)).length}</b></div><div className="kpi"><small>Nghỉ việc tháng này</small><b>{state.employees.filter(e => e.resignDate.startsWith(month)).length}</b></div></div>
    <div className="report-grid">
      <section className="card"><h3>Trạng thái nhân sự</h3><Donut items={by(e => e.status)} /></section>
      <section className="card"><h3>Loại hình nhân sự</h3><Donut items={by(e => e.employmentType)} /></section>
      <section className="card"><h3>Biểu đồ về giới tính</h3><Donut items={by(e => e.gender)} /></section>
      <section className="card"><h3>Giới tính theo đơn vị</h3><BarChart items={by(e => e.unitId).slice(0, 6)} /></section>
      <section className="card"><h3>Biến động nhân sự theo thời gian</h3><p>Ngày / Tuần / Tháng / Năm. Tiếp nhận: {state.employees.filter(e => e.startDate.startsWith(String(new Date().getFullYear()))).length}. Nghỉ việc: {state.employees.filter(e => e.status === 'Đã nghỉ việc').length}.</p></section>
    </div>
  </div>;
}

export function ContractReportPage() {
  const { state } = useLabels();
  const month = todayISO().slice(0, 7);
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const soonIso = soon.toISOString().slice(0, 10);
  const expiredMonth = state.contracts.filter(c => c.endDate.startsWith(month)).length;
  const soonN = state.contracts.filter(c => c.endDate && c.endDate <= soonIso && c.endDate >= todayISO()).length;
  return <div>
    <div className="toolbar"><span>Thời gian hiệu lực</span><button className="btn-ghost">Bộ lọc</button></div>
    <div className="kpis"><div className="kpi"><small>Tổng số lượng HĐ</small><b>{state.contracts.length}</b></div><div className="kpi"><small>HĐ ký mới trong tháng</small><b>{state.contracts.filter(c => c.signedDate.startsWith(month)).length}</b></div><div className="kpi"><small>HĐ hết hạn trong tháng</small><b>{expiredMonth}</b></div><div className="kpi"><small>Hết hạn trong 30 ngày</small><b>{soonN}</b></div></div>
    <div className="report-grid"><section className="card"><h3>Phân loại hợp đồng</h3>{state.contracts.length ? <Donut items={[{ label: 'Có thời hạn', value: state.contracts.filter(c => c.endDate).length }, { label: 'Không thời hạn', value: state.contracts.filter(c => !c.endDate).length }]} /> : <p>Chưa có thông tin</p>}</section><section className="card"><h3>Số lượng hợp đồng ký mới</h3><p>Ngày / Tuần / Tháng / Năm · {state.contracts.filter(c => c.signedDate.startsWith(String(new Date().getFullYear()))).length} hợp đồng trong năm.</p></section></div>
  </div>;
}

export function HrSettingsPage() {
  const [tab, setTab] = useState('thu-nhap');
  const tabs = [['thu-nhap', 'Thông tin thu nhập'], ['truong', 'Trường tùy chỉnh'], ['khoa-hoc', 'Khóa học'], ['chung-chi', 'Chứng chỉ'], ['thong-bao', 'Thông báo'], ['nghi-viec', 'Lý do nghỉ việc'], ['bao-ve', 'Đối tượng được bảo vệ'], ['nhan-vien-bao-ve', 'Nhân viên được bảo vệ'], ['vai-tro', 'Quản lý vai trò']];
  return <div className="card panel"><div className="tabs-line">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}</div><SettingsBody tab={tab} /></div>;
}

const INCOMES = [
  ['Phụ cấp nhà ở', 'Phụ cấp', 'Tháng'], ['Phụ cấp đi lại', 'Phụ cấp', 'Tháng'], ['Phụ cấp điện thoại', 'Phụ cấp', 'Tháng'], ['Phụ cấp ăn trưa', 'Phụ cấp', 'Tháng'], ['Lương cơ bản', 'Lương', 'Tháng'],
];
const RESIGN = ['NLD_01 Cá nhân', 'NLD_02 Gia đình', 'NLD_03 Sức khỏe', 'NLD_04 Học tập', 'NLD_05 Thu nhập', 'NLD_06 Môi trường', 'NLD_07 Định hướng', 'NLD_08 Chuyển nơi ở', 'NLD_09 Không phù hợp', 'NLD_10 Hết hợp đồng', 'NLD_11 Thai sản', 'NLD_12 Nghỉ hưu', 'NLD_13 Lý do khác', 'NLD_14 Không nêu', 'CTY_01 Tái cơ cấu', 'CTY_02 Hết việc'];

function SettingsBody({ tab }: { tab: string }) {
  const toast = useToast();
  if (tab === 'thu-nhap') return <div><div className="toolbar"><Select aria-label="Loại thu nhập"><option>Chọn loại thu nhập</option><option>Lương</option><option>Phụ cấp</option></Select><button className="btn-primary" onClick={() => toast('Form thu nhập: Tên, Key Income/, Kiểu số, Loại Lương hoặc Phụ cấp, đơn vị tính, tỉ lệ thử việc, mô tả.')}>Thêm mới</button></div><table className="tbl"><thead><tr><th>STT</th><th>TÊN THU NHẬP</th><th>LOẠI</th><th>ĐƠN VỊ</th><th>MÔ TẢ</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody>{INCOMES.map((row, i) => <tr key={row[0]}><td>{i + 1}</td><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td></td><td><input type="checkbox" defaultChecked aria-label="Bật" /></td><td></td></tr>)}</tbody></table></div>;
  if (tab === 'truong') return <table className="tbl"><thead><tr><th>STT</th><th>TÊN TRƯỜNG</th><th>NHÓM</th><th>THỨ TỰ</th><th>MẶC ĐỊNH</th><th>KIỂU</th><th>TRẠNG THÁI</th><th>ONBOARD</th><th>BẮT BUỘC</th></tr></thead><tbody><tr><td colSpan={9}>Chưa có trường. Form gồm Tên, Nhóm, Thứ tự, Key Custom_field/, Kiểu chữ/số/ngày/tệp/danh sách, giá trị mặc định, trạng thái, onboard, bắt buộc.</td></tr></tbody></table>;
  if (tab === 'khoa-hoc') return <div><button className="btn-primary" onClick={() => toast('Form khóa học: Tên, Mã, Số giờ, Mô tả.')}>Thêm khóa học</button><table className="tbl"><thead><tr><th>TÊN</th><th>MÃ</th><th>SỐ GIỜ</th><th>MÔ TẢ</th><th>NGÀY TẠO</th><th>NGÀY SỬA</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={7}>Không có kết quả</td></tr></tbody></table></div>;
  if (tab === 'chung-chi') return <div><button className="btn-primary">Thêm chứng chỉ</button><table className="tbl"><thead><tr><th>TÊN</th><th>MÃ</th><th>ĐƠN VỊ CUNG CẤP</th><th>MÔ TẢ</th><th>NGÀY TẠO</th><th>NGÀY SỬA</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={7}>Không có kết quả</td></tr></tbody></table></div>;
  if (tab === 'thong-bao') return <div className="kpis">{['Theo loại hình nhân sự', 'Theo trạng thái nhân sự', 'Hết hạn chứng chỉ', 'Nhắc đóng / dừng đóng BHXH'].map(t => <div key={t} className="kpi"><span className="pill">Đang tắt</span><b>{t}</b></div>)}</div>;
  if (tab === 'nghi-viec') return <div><button className="btn-primary" onClick={() => toast('Form: Mã lý do, Lý do, Diễn giải, Trạng thái Đang hoạt động.')}>Thêm lý do nghỉ việc</button><table className="tbl"><thead><tr><th>MÃ</th><th>LÝ DO</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody>{RESIGN.map(r => { const [code, ...rest] = r.split(' '); return <tr key={code}><td>{code}</td><td>{rest.join(' ')}</td><td>Đang hoạt động</td><td></td></tr>; })}</tbody></table></div>;
  if (tab === 'bao-ve') return <table className="tbl"><thead><tr><th>TÊN LOẠI</th><th>CHÍNH SÁCH</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody>{[['NLĐ dưới 18 tuổi', 'Không phân ca đêm'], ['Phụ nữ nuôi con dưới 12 tháng', 'Không OT'], ['Phụ nữ mang thai từ 7 tháng', 'Không chấm dứt HĐLĐ']].map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>Đang áp dụng</td><td></td></tr>)}</tbody></table>;
  if (tab === 'nhan-vien-bao-ve') return <div><button className="btn-ghost">Bộ lọc</button><button className="btn-ghost">Import</button><button className="btn-primary">Thêm nhân viên</button><table className="tbl"><thead><tr><th>NHÂN VIÊN</th><th>LOẠI</th><th>THỜI GIAN</th><th>HIỆU LỰC</th><th>GHI CHÚ</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={6}>Không có kết quả</td></tr></tbody></table></div>;
  return <RoleMatrix />;
}

const PERMS = [
  ['Tổng quan', 1], ['Nhân sự', 8], ['Đơn từ', 6], ['Chấm công', 6], ['Bảng lương', 4], ['Đánh giá nhân sự', 3], ['Công việc', 2], ['Tài sản', 2], ['Đề xuất', 2], ['Tài liệu', 1], ['Ký số', 1], ['Truyền thông', 2], ['Hệ thống', 3], ['HappyGame', 1],
];

function RoleMatrix() {
  const roles = [['Quản lý', 'Quyền của quản lý'], ['Nhân viên', 'Quyền của nhân viên cơ bản'], ['Admin', 'Quyền admin của hệ thống'], ['Super Admin', 'Vai trò có toàn bộ quyền']];
  const [role, setRole] = useState('Nhân viên');
  const [picked, setPicked] = useState(3);
  return <div className="split"><div><table className="tbl"><thead><tr><th>STT</th><th>VAI TRÒ</th><th>MÔ TẢ</th><th></th></tr></thead><tbody>{roles.map((r, i) => <tr key={r[0]}><td>{i + 1}</td><td>{r[0]}</td><td>{r[1]}</td><td><button className="btn-ghost btn-sm" onClick={() => setRole(r[0])}>Sửa</button></td></tr>)}</tbody></table>
    <Field label="Vai trò"><TextInput value={role} onChange={e => setRole(e.target.value)} /></Field><Field label="Mô tả"><TextInput defaultValue="Mô tả vai trò" /></Field></div>
    <div><h3>Cấp quyền truy cập</h3><p>Đã chọn: {picked} / 231 quyền</p><input className="control" placeholder="Tìm theo mô tả quyền" aria-label="Tìm quyền" /><table className="tbl"><thead><tr><th>Tính năng</th><th>Phân quyền WORKSPACE</th><th>DEPARTMENT</th><th>USER</th></tr></thead><tbody><tr><td>Chọn nhanh</td><td><input type="checkbox" /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td></tr>{PERMS.map(([name, n]) => <tr key={name}><td>{name} ({n})</td><td><input type="checkbox" aria-label={name + ' workspace'} onChange={() => setPicked(p => p + 1)} /></td><td><input type="checkbox" aria-label={name + ' department'} /></td><td><input type="checkbox" aria-label={name + ' user'} /></td></tr>)}</tbody></table><p className="muted">Ma trận đủ 231 quyền và mã kiểu employee.profile.view không có danh sách đầy đủ trong ghi chú. Đang hiện nhóm tính năng và 3 phạm vi.</p></div></div>;
}

export function ContractSettingsPage() {
  const [tab, setTab] = useState('mau');
  return <div className="card panel"><div className="tabs-line">{[['mau', 'Mẫu hợp đồng'], ['loai', 'Loại hợp đồng'], ['tb', 'Thông báo hết hạn'], ['ma', 'Mã hợp đồng']].map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'mau' && <div><div className="seg"><button className="on">MẪU HỢP ĐỒNG</button><button>MẪU PHỤ LỤC</button></div><button className="btn-primary">Thêm mới</button><table className="tbl"><thead><tr><th>STT</th><th>MẪU</th><th>LOẠI</th><th>FILE</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={6}>Form thêm: tên mẫu, loại, file docx ≤ 5MB.</td></tr></tbody></table></div>}
    {tab === 'loai' && <table className="tbl"><thead><tr><th>STT</th><th>TÊN</th><th>MÃ</th><th>GHI CHÚ</th></tr></thead><tbody><tr><td>1</td><td>Xác định thời hạn</td><td>HDLD</td><td>Nhắc quản lý, nhân viên, nhân sự khác</td></tr></tbody></table>}
    {tab === 'tb' && <form className="pad"><label className="chk"><input type="checkbox" defaultChecked /> TRẠNG THÁI HOẠT ĐỘNG</label><p>Gửi thông báo về hợp đồng hết hạn trong vòng <input className="control" style={{ width: 80 }} defaultValue={30} /> ngày</p><p>Các ngày <input className="control" style={{ width: 60 }} defaultValue={15} /> trong tháng / Ngày cuối tháng</p><button className="btn-primary">Lưu</button></form>}
    {tab === 'ma' && <form className="pad"><label className="chk"><input type="checkbox" defaultChecked /> Bật sinh mã tự động</label><p>Ký tự phân cách / · Số bắt đầu 1</p><p>XEM TRƯỚC 2026/NV00123/HDLD1N</p><p>THÊM THAM SỐ: Mã nhân viên, Năm 4 số, Năm 2 số, Tháng, Mã loại HĐ, Mã đơn vị, Số thứ tự, Số thứ tự reset theo năm, Ký tự tùy chỉnh, / - .</p><p className="muted">Trùng số thì thêm hậu tố -02, -03.</p><button className="btn-primary">Lưu thay đổi</button></form>}
  </div>;
}

export function DecisionSettingsPage() {
  const [tab, setTab] = useState('ly-do');
  return <div className="card panel"><div className="tabs-line">{[['ly-do', 'Lý do'], ['hinh-thuc', 'Hình thức bổ nhiệm'], ['quy-trinh', 'Quy trình']].map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}</div>
    {tab === 'ly-do' && <table className="tbl"><thead><tr><th>TÊN LÝ DO</th><th>MÃ</th><th>LOẠI QUYẾT ĐỊNH</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>Bổ nhiệm vị trí mới</td><td>BN01</td><td>Bổ nhiệm</td><td></td></tr></tbody></table>}
    {tab === 'hinh-thuc' && <table className="tbl"><thead><tr><th>TÊN HÌNH THỨC</th><th>MÃ</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>Bổ nhiệm chính thức</td><td>HT01</td><td></td></tr></tbody></table>}
    {tab === 'quy-trinh' && <div className="pad"><table className="tbl"><thead><tr><th>TÊN</th><th>MÃ</th><th>LOẠI</th><th>TRẠNG THÁI</th><th>NGƯỜI THEO DÕI</th><th>NGƯỜI TẠO</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr></thead><tbody><tr><td>Quy trình chung</td><td>QDQT</td><td>Bổ nhiệm</td><td>Đang hoạt động</td><td>{USER.name}</td><td>Hệ thống</td><td>{fmtDate(todayISO())}</td><td></td></tr></tbody></table><p>START Bắt đầu → cấp duyệt → Đã duyệt</p></div>}
  </div>;
}

export function HrOverviewPage() {
  const nav = useNavigate();
  const cards = [
    ['Cài đặt hồ sơ nhân sự', 'Admin', 'Quản lý thông tin thu nhập; Cấu hình trường; Khóa học; Chứng chỉ; Vai trò', '/m/nhan-su/cai-dat-nhan-su', 'Cài đặt'],
    ['Tạo hồ sơ nhân sự', 'Quản lý', 'Tạo mới; Import; Đồng bộ từ SHiring', '/m/nhan-su/thong-tin-nhan-su/tao-moi', 'Tạo mới'],
    ['Quyết định', 'Quản lý', 'Bổ nhiệm; miễn nhiệm; điều chuyển; lương; tạm hoãn; đình chỉ; sa thải; chấm dứt; khen thưởng/kỷ luật', '/m/nhan-su/quyet-dinh', 'Xem quyết định'],
    ['Hợp đồng lao động', 'Admin/C&B', 'Hợp đồng điện tử; Thêm mới; Gia hạn; Ký số', '/m/nhan-su/hop-dong', 'Xem hợp đồng'],
    ['Báo cáo nhân sự', 'Quản lý', 'Trạng thái, loại hình, giới tính, đơn vị, biến động', '/m/nhan-su/bao-cao-nhan-su', 'Xem báo cáo'],
  ] as const;
  return <div className="feature-grid">{cards.map(([title, role, body, to, action]) => <article key={title} className="card"><span className="pill">{role}</span><h3>{title}</h3><p>{body}</p><button className="btn-primary" onClick={() => nav(to)}>{action}</button></article>)}</div>;
}

export function OnboardingSettings() {
  return <div className="card pad-card"><h3>Thông báo tiếp nhận nhân sự trên app</h3><h3>Email tiếp nhận nhân sự</h3><p className="muted">Biến {'{{employee_name}}'} {'{{workspace_name}}'} {'{{onboading_link}}'}</p><div className="form-grid"><Field label="Tên người gửi"><TextInput defaultValue="HRM Hub" /></Field><Field label="Email người gửi"><TextInput defaultValue="hr@vi-du.hrm.local" /></Field><Field label="Email CC"><TextInput /></Field><Field label="Tiêu đề" className="span2"><TextInput defaultValue="Chào mừng {{employee_name}}" /></Field><Field label="Nội dung" className="span2"><TextArea defaultValue="Xin chào {{employee_name}}, hoàn tất hồ sơ tại {{onboading_link}}" /></Field></div><button className="btn-primary">Lưu</button><h3>Checklist</h3><button className="btn-ghost">Thêm mới</button><table className="tbl"><thead><tr><th>STT</th><th>TÊN CHECKLIST</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>1</td><td>Tiếp nhận văn phòng</td><td>{fmtDate(todayISO())}</td><td>Đang dùng</td><td></td></tr></tbody></table></div>;
}
