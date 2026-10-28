import { useMemo, useState } from 'react';
import { Applicant, Drawer, FilterPanel, StatusPill } from '../../components/Drawer';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { useConfirm, useToast } from '../../components/feedback';
import { downloadText } from '../../data/csv';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import { canAct, countWeekdays, hoursBetween, REQUEST_TYPES, requestLabel, requestsToCsv, STATUS_FILTERS } from '../../data/timeoff';
import type { TimeRequest, TimeRequestInput, TimeRequestType } from '../../data/types';
import { fmtDate, includesPlain } from '../../data/text';
import { useLabels } from '../hr/lookups';

type View = 'all' | 'mine' | 'approve' | 'watch' | 'behalf' | 'manage';

const PICKER = REQUEST_TYPES.filter(item => item.picker);

export default function RequestsPage({ view }: { view: View }) {
  const toast = useToast();
  const ask = useConfirm();
  const labels = useLabels();
  const { state } = labels;
  const [q, setQ] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [branchRecord, setBranchRecord] = useState('');
  const [branchEmp, setBranchEmp] = useState('');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [applyFrom, setApplyFrom] = useState('');
  const [applyTo, setApplyTo] = useState('');
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<TimeRequest | null>(null);

  const rows = useMemo(() => state.requests.filter(request => {
    if (view === 'mine' && request.createdBy !== USER.name) return false;
    if (view === 'approve' && !canAct(request, USER.name, state)) return false;
    if (view === 'watch' && !request.watchers.includes(USER.name)) return false;
    if (view === 'behalf' && !request.onBehalf) return false;
    if (status && request.status !== status) return false;
    if (type && request.type !== type) return false;
    const person = state.employees.find(item => item.id === request.employeeId);
    if (branchEmp && person?.branchId !== branchEmp) return false;
    if (branchRecord && person?.branchId !== branchRecord) return false;
    if (unitId && person?.unitId !== unitId) return false;
    if (positionId && person?.positionId !== positionId) return false;
    const created = request.createdAt.slice(0, 10);
    if (createdFrom && created < createdFrom) return false;
    if (createdTo && created > createdTo) return false;
    if (applyFrom && request.endDate < applyFrom) return false;
    if (applyTo && request.startDate > applyTo) return false;
    return includesPlain([request.code, requestLabel(request.type), person?.fullName ?? '', person?.code ?? '', request.note].join(' '), q);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state, view, q, status, type, branchEmp, branchRecord, unitId, positionId, createdFrom, createdTo, applyFrom, applyTo]);

  const columns: Column<TimeRequest>[] = [
    { id: 'check', header: '', cell: () => <input type="checkbox" aria-label="Chọn đơn" /> },
    { id: 'code', header: 'Mã đơn', sort: r => r.code, cell: r => r.code },
    { id: 'type', header: 'Loại đơn', sort: r => requestLabel(r.type), cell: r => requestLabel(r.type) },
    { id: 'st', header: 'Trạng thái', sort: r => r.status, cell: r => <StatusPill status={r.status} /> },
    { id: 'deadline', header: 'Hạn xử lý cấp duyệt', cell: () => '—' },
    { id: 'emp', header: 'Người áp dụng đơn', sort: r => labels.employee(r.employeeId)?.fullName ?? '', cell: r => {
      const person = labels.employee(r.employeeId);
      return person ? <Applicant name={person.fullName} code={person.code} type={person.employmentType} unit={labels.unit(person.unitId)} position={labels.position(person.positionId)} /> : '—';
    } },
    { id: 'when', header: 'Thời gian áp dụng', sort: r => r.startDate, cell: r => `${fmtDate(r.startDate)}${r.endDate && r.endDate !== r.startDate ? ' – ' + fmtDate(r.endDate) : ''}${r.startTime ? ` ${r.startTime}–${r.endTime}` : ''}` },
    { id: 'reason', header: 'Chi tiết lý do', cell: r => r.note },
    { id: 'act', header: 'Tác vụ', cell: r => <button className="icon-btn" aria-label="Xem chi tiết đơn" onClick={() => setActive(r)}>👁</button> },
  ];

  const showCreate = view === 'all' || view === 'mine' || view === 'behalf' || view === 'watch';

  async function cancel(request: TimeRequest) {
    const yes = await ask({ title: 'Hủy đơn', message: `Hủy đơn ${request.code}?`, confirmLabel: 'Hủy đơn', danger: true });
    if (!yes) return;
    const result = hr.cancelRequest(request.id, USER.name);
    toast(result.ok ? 'Đã hủy đơn' : result.errors.form || 'Không hủy được');
    if (result.ok) setActive(null);
  }

  function clearFilters() {
    setStatus(''); setType(''); setBranchRecord(''); setBranchEmp(''); setUnitId(''); setPositionId('');
    setCreatedFrom(''); setCreatedTo(''); setApplyFrom(''); setApplyTo('');
  }

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm đơn" value={q} placeholder="Nhập nội dung bạn muốn tìm kiếm" onChange={e => setQ(e.target.value)} /></div>
        <button className="btn-ghost" onClick={() => setShowFilter(true)}>Bộ lọc</button>
        <div className="grow" />
        {showCreate && <button className="btn-primary" onClick={() => setCreating(true)}>+ Tạo đơn</button>}
        <button className="btn-ghost" onClick={() => downloadText('don-tu.csv', requestsToCsv(rows, state))}>Xuất báo cáo ▾</button>
        <button className="btn-ghost" aria-label="Thêm thao tác" title="Mục trong menu này chưa có trong ghi chú khảo sát">⋯</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={`${view}|${q}|${status}|${type}|${branchRecord}|${branchEmp}|${unitId}|${positionId}|${createdFrom}|${createdTo}|${applyFrom}|${applyTo}`} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" />
      {showFilter && (
        <FilterPanel title="Bộ lọc" onClose={() => setShowFilter(false)} onClear={clearFilters}>
          <div className="form-grid">
            <Field label="Trạng thái"><Select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
            <Field label="Loại đơn"><Select value={type} onChange={e => setType(e.target.value)}><option value="">Tất cả</option>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field>
            <Field label="Chi nhánh ghi nhận công trong đơn"><Select value={branchRecord} onChange={e => setBranchRecord(e.target.value)}><option value="">Tất cả</option>{state.branches.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Chi nhánh của nhân viên áp dụng đơn"><Select value={branchEmp} onChange={e => setBranchEmp(e.target.value)}><option value="">Tất cả</option>{state.branches.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Đơn vị"><Select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả</option>{state.units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Vị trí"><Select value={positionId} onChange={e => setPositionId(e.target.value)}><option value="">Tất cả</option>{state.positions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Thời gian tạo từ"><TextInput type="date" value={createdFrom} onChange={e => setCreatedFrom(e.target.value)} /></Field>
            <Field label="Thời gian tạo đến"><TextInput type="date" value={createdTo} onChange={e => setCreatedTo(e.target.value)} /></Field>
            <Field label="Thời gian áp dụng từ"><TextInput type="date" value={applyFrom} onChange={e => setApplyFrom(e.target.value)} /></Field>
            <Field label="Thời gian áp dụng đến"><TextInput type="date" value={applyTo} onChange={e => setApplyTo(e.target.value)} /></Field>
          </div>
        </FilterPanel>
      )}
      {creating && <CreateDrawer behalf={view === 'behalf'} onClose={() => setCreating(false)} />}
      {active && <DetailDrawer request={state.requests.find(item => item.id === active.id) ?? active} onClose={() => setActive(null)} onCancel={() => void cancel(active)} />}
    </div>
  );
}

function blank(type: TimeRequestType, behalf: boolean): TimeRequestInput {
  return { type, employeeId: '', onBehalf: behalf, reasonId: type === 'nghi-phep' ? 'rs-1' : '', note: '', startDate: '', endDate: '', startTime: '', endTime: '', quantity: 1, leaveTypeId: 'lt-nam', shiftId: '', targetShiftId: '', watchers: [USER.name], submit: true, project: '', caseType: 'Nghỉ sinh con', childCount: 1, swapMode: 'other' };
}

function CreateDrawer({ behalf, onClose }: { behalf: boolean; onClose: () => void }) {
  const state = useLabels().state;
  const toast = useToast();
  const [type, setType] = useState<TimeRequestType | ''>('');
  const [form, setForm] = useState<TimeRequestInput>(() => blank('nghi-phep', behalf));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [days, setDays] = useState<{ date: string; start: string; end: string }[]>([{ date: '', start: '', end: '' }]);
  const meta = REQUEST_TYPES.find(item => item.id === form.type);
  const reasons = state.requestReasons.filter(item => item.type === form.type && item.active);
  const balance = state.leaveBalances.find(item => item.employeeId === form.employeeId && item.leaveTypeId === 'lt-nam');
  const remain = balance ? balance.entitled + balance.carried - balance.used - balance.pending : 0;

  function patch(partial: Partial<TimeRequestInput>) {
    setForm(current => {
      const next = { ...current, ...partial };
      if (next.type === 'nghi-phep' || next.type === 'cong-tac') next.quantity = countWeekdays(next.startDate, next.endDate || next.startDate) || next.quantity;
      if ((next.type === 'lam-them-gio' || next.type === 'ra-ngoai') && next.startTime && next.endTime) next.quantity = hoursBetween(next.startTime, next.endTime) || next.quantity;
      return next;
    });
  }

  function save() {
    const first = days[0];
    const payload = { ...form, onBehalf: behalf || form.onBehalf, startDate: form.startDate || first?.date || '', startTime: form.startTime || first?.start || '', endTime: form.endTime || first?.end || '' };
    const result = hr.saveRequest(payload, undefined, USER.name);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã tạo đơn');
    onClose();
  }

  if (!type) {
    return (
      <Drawer title="Chọn loại đơn" onClose={onClose} footer={<button className="btn-ghost" onClick={onClose}>HỦY BỎ</button>}>
        <p>Vui lòng chọn loại đơn bạn muốn tạo</p>
        <div className="type-pick">
          {PICKER.map(item => (
            <button key={item.id} onClick={() => { setType(item.id); setForm(blank(item.id, behalf)); }}>
              <span className="pill">{item.label.slice(0, 1)}</span>{item.label}
            </button>
          ))}
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer title={meta?.label ?? 'Tạo đơn'} onClose={onClose} wide footer={<>
      <button className="btn-ghost" onClick={() => setType('')}>←</button>
      <button className="btn-ghost" onClick={onClose}>HỦY BỎ</button>
      <button className="btn-primary" onClick={save}>{form.type === 'doi-ca' ? 'Gửi đơn' : 'TẠO'}</button>
    </>}>
      {errors.form && <div className="banner bad">{errors.form}</div>}
      <div className="form-grid">
        <Field label="Nhân sự" required error={errors.employeeId} className="span2"><Select value={form.employeeId} onChange={e => patch({ employeeId: e.target.value })}><option value="">Chọn nhân sự</option>{state.employees.filter(e => e.status !== 'Đã nghỉ việc').map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
        {form.type === 'nghi-phep' && <p className="span2 muted">Hiện tại còn {form.employeeId ? remain : '—'} ngày nghỉ phép khả dụng</p>}
        {(form.type === 'nghi-phep' || form.type === 'cong-tac') && <>
          <Field label="Từ ngày" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value })} /></Field>
          <Field label="Đến ngày" error={errors.endDate}><TextInput type="date" value={form.endDate} onChange={e => patch({ endDate: e.target.value })} /></Field>
        </>}
        {form.type === 'nghi-phep' && <>
          <Field label="Lý do" required error={errors.reasonId}><Select value={form.reasonId} onChange={e => patch({ reasonId: e.target.value })}>{reasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Nguồn nghỉ" required><Select value={form.leaveTypeId} onChange={e => patch({ leaveTypeId: e.target.value })}>{state.leaveTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        </>}
        {(form.type === 'sua-cham-cong' || form.type === 'di-muon-ve-som') && <div className="span2">
          {days.map((day, index) => (
            <div className="mini-card" key={index}>
              <h4>Ngày công *</h4>
              <div className="form-grid">
                <Field label="Ngày" error={errors.startDate}><TextInput type="date" value={day.date} onChange={e => setDays(current => current.map((item, i) => i === index ? { ...item, date: e.target.value } : item))} /></Field>
                <Field label="Giờ vào" error={errors.startTime}><TextInput type="time" value={day.start} onChange={e => setDays(current => current.map((item, i) => i === index ? { ...item, start: e.target.value } : item))} /></Field>
                <Field label="Giờ ra"><TextInput type="time" value={day.end} onChange={e => setDays(current => current.map((item, i) => i === index ? { ...item, end: e.target.value } : item))} /></Field>
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setDays(current => [...current, { date: '', start: '', end: '' }])}>+ Thêm ngày công</button>
        </div>}
        {form.type === 'lam-them-gio' && <>
          <div className="banner span2">Quy định tạo đơn: {state.otPolicy.rules}</div>
          <Field label="Ngày làm thêm" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value })} /></Field>
          <Field label="Dự án"><TextInput value={form.project ?? ''} onChange={e => patch({ project: e.target.value })} /></Field>
          <Field label="Giờ bắt đầu" required error={errors.startTime}><TextInput type="time" value={form.startTime} onChange={e => patch({ startTime: e.target.value })} /></Field>
          <label className="chk"><input type="checkbox" checked={Boolean(form.prevDay)} onChange={e => patch({ prevDay: e.target.checked })} /> Hôm trước</label>
          <Field label="Giờ kết thúc"><TextInput type="time" value={form.endTime} onChange={e => patch({ endTime: e.target.value })} /></Field>
          <label className="chk"><input type="checkbox" checked={Boolean(form.nextDay)} onChange={e => patch({ nextDay: e.target.checked })} /> Hôm sau</label>
          <label className="chk span2"><input type="checkbox" checked={Boolean(form.breakMid)} onChange={e => patch({ breakMid: e.target.checked })} /> Nghỉ giữa giờ</label>
        </>}
        {form.type === 'lam-viec-tai-nha' && <Field label="Ngày công" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value, endDate: e.target.value })} /></Field>}
        {form.type === 'cong-tac' && <Field label="Lý do"><Select value={form.reasonId} onChange={e => patch({ reasonId: e.target.value })}><option value="">Không chọn</option>{reasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>}
        {form.type === 'ra-ngoai' && <>
          <Field label="Ngày ra ngoài" required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value })} /></Field>
          <Field label="Lý do" required error={errors.reasonId}><Select value={form.reasonId} onChange={e => patch({ reasonId: e.target.value })}>{reasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Giờ bắt đầu" error={errors.startTime}><TextInput type="time" value={form.startTime} onChange={e => patch({ startTime: e.target.value })} /></Field>
          <Field label="Giờ kết thúc"><TextInput type="time" value={form.endTime} onChange={e => patch({ endTime: e.target.value })} /></Field>
        </>}
        {form.type === 'doi-ca' && <>
          <Field label="Loại yêu cầu" className="span2">{(['other', 'self', 'drop'] as const).map(mode => <label key={mode} className="chk"><input type="radio" checked={form.swapMode === mode} onChange={() => patch({ swapMode: mode })} />{mode === 'other' ? 'Đổi ca với người khác' : mode === 'self' ? 'Đổi ca của bản thân' : 'Bỏ ca'}</label>)}</Field>
          <Field label="Nhân viên yêu cầu đổi ca"><TextInput readOnly value={state.employees.find(item => item.id === form.employeeId)?.fullName ?? ''} /></Field>
          {form.swapMode === 'other' && <Field label="Người đổi ca cùng" required error={errors.swapWithId}><Select value={form.swapWithId ?? ''} onChange={e => patch({ swapWithId: e.target.value })}><option value="">Chọn</option>{state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>}
          <Field label="Ca hiện tại" error={errors.shiftId}><Select value={form.shiftId} onChange={e => patch({ shiftId: e.target.value })}><option value="">Chọn ca</option>{state.shifts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Ca muốn đổi" error={errors.targetShiftId}><Select value={form.targetShiftId} onChange={e => patch({ targetShiftId: e.target.value })}><option value="">Chọn ca</option>{state.shifts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <p className="span2 muted">Các cặp ca hoán đổi — chưa có cặp ca nào. Bấm thêm để bắt đầu. Mỗi cặp dùng hai ca phía trên (ghi chú khảo sát không nêu cột của từng cặp).</p>
        </>}
        {form.type === 'nghi-thai-san' && <>
          <Field label="Trường hợp nghỉ thai sản" required><TextInput value={form.caseType ?? ''} onChange={e => patch({ caseType: e.target.value })} /></Field>
          <Field label="Ngày dự sinh"><TextInput type="date" value={form.dueDate ?? ''} onChange={e => patch({ dueDate: e.target.value })} /></Field>
          <Field label="Ngày sinh thực tế"><TextInput type="date" value={form.birthDate ?? ''} onChange={e => patch({ birthDate: e.target.value })} /></Field>
          <Field label="Số lượng con"><TextInput type="number" min={1} value={form.childCount ?? 1} onChange={e => patch({ childCount: Number(e.target.value) })} /></Field>
          <p className="span2 muted">Số ngày nghỉ theo luật: 6 tháng (lao động nữ sinh con được nghỉ trước và sau sinh 6 tháng; sinh đôi trở lên, từ con thứ 2 mỗi con nghỉ thêm 1 tháng).</p>
          <Field label="Từ ngày nghỉ" error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value })} /></Field>
          <Field label="Đến ngày nghỉ"><TextInput type="date" value={form.endDate} onChange={e => patch({ endDate: e.target.value })} /></Field>
        </>}
        <Field label="Chi tiết lý do" required error={errors.note} className="span2"><TextArea maxLength={500} value={form.note} onChange={e => patch({ note: e.target.value })} /></Field>
        <p className="muted span2">{form.note.length}/500</p>
        <Field label="Ảnh đính kèm" className="span2"><button type="button" className="btn-ghost">Tải lên</button><small className="muted"> Định dạng file không có trong ghi chú khảo sát.</small></Field>
        <Field label="Người theo dõi" className="span2"><Select multiple value={form.watchers} onChange={e => patch({ watchers: [...e.target.selectedOptions].map(option => option.value) })}>{[USER.name, ...state.employees.map(emp => emp.fullName)].map(name => <option key={name}>{name}</option>)}</Select></Field>
        <div className="mini-card span2"><h4>Cấp duyệt</h4><p className="muted">{form.type === 'lam-viec-tai-nha' ? 'Không có cấp duyệt nào' : 'Cấp 1 · Quản lý trực tiếp, sau đó Giám đốc theo quy trình chung.'}</p></div>
      </div>
    </Drawer>
  );
}

function DetailDrawer({ request, onClose, onCancel }: { request: TimeRequest; onClose: () => void; onCancel: () => void }) {
  const labels = useLabels();
  const person = labels.employee(request.employeeId);
  const shift = labels.state.shifts.find(item => item.id === request.shiftId);
  const toast = useToast();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const actionable = canAct(request, USER.name, labels.state);
  function approve() {
    const result = hr.approveRequest(request.id, note, USER.name);
    if (!result.ok) { setError(result.errors.form || ''); return; }
    toast('Đã phê duyệt');
    onClose();
  }
  function reject() {
    const result = hr.rejectRequest(request.id, note, USER.name);
    if (!result.ok) { setError(result.errors.note || result.errors.form || ''); return; }
    toast('Đã từ chối');
    onClose();
  }
  return (
    <Drawer title="Chi tiết đơn" onClose={onClose} wide footer={<>
      {request.status !== 'Đã duyệt' && request.status !== 'Từ chối' && request.status !== 'Đã hủy' && <button className="btn-danger" onClick={onCancel}>HỦY ĐƠN</button>}
      <div className="grow" />
      {actionable && <button className="btn-danger" onClick={reject}>Từ chối</button>}
      {actionable && <button className="btn-primary" onClick={approve}>Phê duyệt</button>}
    </>}>
      <div className="detail-grid">
        <div>
          <div className="mini-card"><h4>Nhân viên tạo đơn</h4>{person && <Applicant name={person.fullName} code={person.code} type={person.employmentType} unit={labels.unit(person.unitId)} position={labels.position(person.positionId)} />}</div>
          <div className="mini-card"><h4>Thời gian áp dụng thực tế</h4>
            {request.type === 'sua-cham-cong' ? <dl className="dl"><dt>Ngày công</dt><dd>{fmtDate(request.startDate)}</dd><dt>Ca</dt><dd>{shift?.name ?? '—'}</dd><dt>Thời gian làm việc của ca</dt><dd>{shift ? `${shift.start} – ${shift.end}` : '—'}</dd><dt>Giờ chấm công thực tế</dt><dd>—</dd><dt>Giờ chấm công chỉnh sửa</dt><dd>{request.startTime} – {request.endTime}</dd></dl> : <p>{fmtDate(request.startDate)}{request.endDate !== request.startDate ? ` – ${fmtDate(request.endDate)}` : ''} {request.startTime && `${request.startTime}–${request.endTime}`}</p>}
          </div>
          <div className="mini-card"><h4>Thông tin chung</h4><dl className="dl"><dt>Loại đơn</dt><dd>{requestLabel(request.type)}</dd><dt>Trạng thái đơn</dt><dd><StatusPill status={request.status} /></dd><dt>Mã đơn</dt><dd>{request.code}</dd><dt>Thời gian tạo đơn</dt><dd>{fmtDate(request.createdAt.slice(0, 10))}</dd></dl></div>
          <div className="mini-card"><h4>Chi tiết lý do</h4><p>{request.note}</p></div>
          <div className="mini-card"><h4>Người theo dõi</h4><p>{request.watchers.join(', ') || '—'}</p></div>
          <div className="mini-card"><h4>Cấp duyệt</h4>{request.steps.map(step => <p key={step.order}>Cấp {step.order} · {step.approverName} · {step.status}</p>)}{!request.steps.length && <p>Không có cấp duyệt nào</p>}</div>
          {error && <div className="banner bad">{error}</div>}
          {actionable && <Field label="Ghi chú"><TextArea value={note} onChange={e => setNote(e.target.value)} /></Field>}
        </div>
        <div className="mini-card"><h4>Lịch sử cập nhật đơn</h4><ul className="timeline">{request.history.map((event, index) => <li key={index}><i /><div><b>{event.actor} đã {event.action.toLowerCase()}</b><small className="muted">{event.at.replace('T', ' ').slice(0, 16)}{event.note ? ` · ${event.note}` : ''}</small></div></li>)}{request.steps.filter(step => step.status === 'Đã duyệt').map(step => <li key={step.order}><i /><div><b>{step.approverName} đã phê duyệt đơn (Cấp {step.order})</b><small className="muted">{step.actedAt.replace('T', ' ').slice(0, 16)}</small></div></li>)}</ul></div>
      </div>
    </Drawer>
  );
}
