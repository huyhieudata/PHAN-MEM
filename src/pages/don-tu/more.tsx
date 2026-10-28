import { useMemo, useState } from 'react';
import { BarChart } from '../../components/Charts';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { useConfirm, useToast } from '../../components/feedback';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import { leaveRemaining, otHoursInMonth, REQUEST_TYPES, requestLabel } from '../../data/timeoff';
import type { ApprovalDelegation, LeaveBalance, RequestReason, TimeRequestType } from '../../data/types';
import { fmtDate, includesPlain, todayISO } from '../../data/text';
import { useLabels } from '../hr/lookups';

export function DonTuOverview() {
  const { state, employee } = useLabels();
  const month = todayISO().slice(0, 7);
  const mine = state.requests.filter(r => r.createdBy === USER.name).length;
  const waiting = state.requests.filter(r => r.status === 'Chờ duyệt' || r.status === 'Đang duyệt').length;
  const mineApprove = state.requests.filter(r => r.steps.some(step => step.status === 'Chờ' && step.approverName === USER.name)).length;
  const ot = state.requests.filter(r => r.type === 'lam-them-gio' && r.status === 'Đã duyệt' && r.startDate.startsWith(month)).reduce((sum, r) => sum + r.quantity, 0);
  const cards = [['Đơn tôi tạo', mine], ['Đơn đang chảy', waiting], ['Chờ tôi ở bước duyệt', mineApprove], ['Giờ OT đã duyệt trong tháng', ot]] as const;
  const recent = [...state.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return (
    <div>
      <div className="kpis">{cards.map(([label, value]) => <div className="kpi" key={label}><small>{label}</small><b>{value}</b></div>)}</div>
      <section className="card">
        <h3>Đơn gần đây</h3>
        {recent.map(request => <div className="req" key={request.id}><span>{request.code} · {requestLabel(request.type)} · {employee(request.employeeId)?.fullName}</span><span className="muted">{request.status}</span></div>)}
      </section>
    </div>
  );
}

export function DonTuReports() {
  const { state, unit, employee } = useLabels();
  const month = todayISO().slice(0, 7);
  const byType = REQUEST_TYPES.map(item => ({ label: item.label, value: state.requests.filter(r => r.type === item.id && r.status !== 'Nháp' && r.status !== 'Đã hủy').length }));
  const otRows = state.employees.filter(e => e.status !== 'Đã nghỉ việc').map(emp => {
    const hours = otHoursInMonth(state, emp.id, month);
    return { id: emp.id, name: emp.fullName, unit: unit(emp.unitId), hours, over: hours > state.otPolicy.monthlyHourCap };
  }).filter(row => row.hours > 0);
  return (
    <div>
      <div className="report-grid">
        <section className="card"><h3>Đơn theo loại</h3><BarChart items={byType} /></section>
        <section className="card">
          <h3>Trần OT tháng {month}</h3>
          <p className="muted">Ngưỡng {state.otPolicy.monthlyHourCap} giờ. Hệ số ngày thường {state.otPolicy.weekdayRate}, cuối tuần {state.otPolicy.weekendRate}, lễ {state.otPolicy.holidayRate}.</p>
          {otRows.length === 0 && <p>Chưa có giờ OT trong tháng.</p>}
          {otRows.map(row => <div className="req" key={row.id}><span>{row.name}<small className="muted"> · {row.unit}</small></span><b style={{ color: row.over ? '#B91C1C' : undefined }}>{row.hours} giờ{row.over ? ' · vượt trần' : ''}</b></div>)}
        </section>
      </div>
      <p className="muted">Phép đã dùng được tính trên quỹ phép năm của từng người ở mục Danh sách phép. {employee(state.employees[0]?.id)?.fullName ? '' : ''}</p>
    </div>
  );
}

export function LeaveOverview() {
  const { state } = useLabels();
  const year = new Date().getFullYear();
  const rows = state.leaveBalances.filter(b => b.year === year && b.leaveTypeId === 'lt-nam');
  const entitled = rows.reduce((s, b) => s + b.entitled + b.carried, 0);
  const used = rows.reduce((s, b) => s + b.used, 0);
  const pending = rows.reduce((s, b) => s + b.pending, 0);
  const policy = state.leavePolicy;
  return (
    <div>
      <div className="kpis">
        <div className="kpi"><small>Tổng quỹ {year}</small><b>{entitled}</b></div>
        <div className="kpi"><small>Đã dùng</small><b>{used}</b></div>
        <div className="kpi"><small>Đang chờ duyệt</small><b>{pending}</b></div>
        <div className="kpi"><small>Còn lại</small><b>{Math.round((entitled - used - pending) * 10) / 10}</b></div>
      </div>
      <section className="card pad-card">
        <h3>{policy.name}</h3>
        <p>Mỗi người được {policy.annualDays} ngày phép năm. Chuyển tồn tối đa {policy.carryOverMax} ngày. Báo trước {policy.minNoticeDays} ngày. {policy.allowNegative ? 'Được ứng phép.' : 'Không được ứng phép âm.'}</p>
        <p className="muted">Phép năm trừ vào quỹ. Nghỉ ốm, cưới, tang và không lương không trừ phép năm.</p>
      </section>
    </div>
  );
}

export function LeaveListPage() {
  const { state, employee, unit } = useLabels();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<LeaveBalance | null>(null);
  const rows = useMemo(() => state.leaveBalances.filter(b => includesPlain(employee(b.employeeId)?.fullName ?? '', q)).map(b => ({ ...b, remain: leaveRemaining(b) })), [state.leaveBalances, q, employee]);
  const columns: Column<LeaveBalance & { remain: number }>[] = [
    { id: 'name', header: 'Nhân sự', sort: r => employee(r.employeeId)?.fullName ?? '', cell: r => employee(r.employeeId)?.fullName ?? '—' },
    { id: 'unit', header: 'Đơn vị', cell: r => unit(employee(r.employeeId)?.unitId) },
    { id: 'year', header: 'Năm', sort: r => r.year, cell: r => r.year },
    { id: 'entitled', header: 'Được hưởng', sort: r => r.entitled, cell: r => r.entitled },
    { id: 'carried', header: 'Tồn', sort: r => r.carried, cell: r => r.carried },
    { id: 'used', header: 'Đã dùng', sort: r => r.used, cell: r => r.used },
    { id: 'pending', header: 'Chờ duyệt', sort: r => r.pending, cell: r => r.pending },
    { id: 'remain', header: 'Còn lại', sort: r => r.remain, cell: r => r.remain },
    { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => setEditing(r)}>Sửa quỹ</button> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar"><div className="in-search">🔍<input aria-label="Tìm phép" value={q} placeholder="Tìm nhân sự" onChange={e => setQ(e.target.value)} /></div></div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {editing && <BalanceForm balance={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BalanceForm({ balance, onClose }: { balance: LeaveBalance; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(balance);
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveLeaveBalance({ ...form, entitled: Number(form.entitled), carried: Number(form.carried) });
    if (!result.ok) { toast(result.errors.form); return; }
    toast('Đã cập nhật quỹ phép');
    onClose();
  }
  return (
    <Modal title="Sửa quỹ phép" onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Được hưởng"><TextInput type="number" min={0} value={form.entitled} onChange={e => setForm({ ...form, entitled: Number(e.target.value) })} /></Field>
          <Field label="Tồn năm trước"><TextInput type="number" min={0} value={form.carried} onChange={e => setForm({ ...form, carried: Number(e.target.value) })} /></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
      </form>
    </Modal>
  );
}

export function DelegationPage() {
  const toast = useToast();
  const ask = useConfirm();
  const { state } = useLabels();
  const [open, setOpen] = useState(false);
  async function remove(row: ApprovalDelegation) {
    const yes = await ask({ title: 'Xóa ủy quyền', message: `Xóa ủy quyền của ${row.fromName}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteDelegation(row.id);
    toast('Đã xóa ủy quyền');
  }
  const columns: Column<ApprovalDelegation>[] = [
    { id: 'from', header: 'Người ủy quyền', sort: r => r.fromName, cell: r => r.fromName },
    { id: 'to', header: 'Người nhận', sort: r => r.toName, cell: r => r.toName },
    { id: 'range', header: 'Thời gian', sort: r => r.startDate, cell: r => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
    { id: 'types', header: 'Loại đơn', cell: r => r.types.length ? r.types.map(requestLabel).join(', ') : 'Mọi loại' },
    { id: 'st', header: 'Hiệu lực', cell: r => r.active ? 'Đang bật' : 'Tắt' },
    { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => void remove(r)}>Xóa</button> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar"><p className="muted">Khi ủy quyền còn hiệu lực, người nhận duyệt thay ở đúng bước của người ủy quyền.</p><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm ủy quyền</button></div>
      <DataTable rows={state.delegations} columns={columns} />
      {open && <DelegationForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function DelegationForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const names = [...new Set(useLabels().state.employees.map(e => e.fullName).concat(USER.name))];
  const [form, setForm] = useState<Omit<ApprovalDelegation, 'id'>>({ fromName: '', toName: USER.name, startDate: todayISO(), endDate: todayISO(), types: [], active: true });
  const [error, setError] = useState('');
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveDelegation(form);
    if (!result.ok) { setError(result.errors.form || result.errors.endDate || ''); return; }
    toast('Đã lưu ủy quyền');
    onClose();
  }
  return (
    <Modal title="Ủy quyền duyệt" onClose={onClose}>
      <form onSubmit={save}>
        {error && <div className="banner bad">{error}</div>}
        <div className="form-grid">
          <Field label="Người ủy quyền" required><Select value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })}><option value="">Chọn</option>{names.map(name => <option key={name}>{name}</option>)}</Select></Field>
          <Field label="Người nhận" required><Select value={form.toName} onChange={e => setForm({ ...form, toName: e.target.value })}>{names.map(name => <option key={name}>{name}</option>)}</Select></Field>
          <Field label="Từ ngày"><TextInput type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Đến ngày" error={error && !form.fromName ? '' : undefined}><TextInput type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
      </form>
    </Modal>
  );
}

export function DonTuSettings() {
  const { state } = useLabels();
  const toast = useToast();
  const ask = useConfirm();
  const [tab, setTab] = useState<'phep' | 'ot' | 'lydo' | 'quytrinh' | 'ca'>('phep');
  const [policy, setPolicy] = useState(state.leavePolicy);
  const [ot, setOt] = useState(state.otPolicy);
  const [reason, setReason] = useState<{ type: TimeRequestType; name: string }>({ type: 'nghi-phep', name: '' });
  async function removeReason(row: RequestReason) {
    const yes = await ask({ title: 'Xóa lý do', message: `Xóa "${row.name}"?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteReason(row.id);
    toast(result.ok ? 'Đã xóa lý do' : result.errors.form);
  }
  return (
    <div className="card panel">
      <div className="tabs-line">
        {([['phep', 'Chính sách phép'], ['ot', 'Chính sách OT'], ['lydo', 'Lý do'], ['quytrinh', 'Quy trình'], ['ca', 'Ca làm việc']] as const).map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'phep' && <form className="form-grid pad" onSubmit={e => { e.preventDefault(); const r = hr.saveLeavePolicy(policy); toast(r.ok ? 'Đã lưu chính sách phép' : r.errors.form); }}>
        <Field label="Tên"><TextInput value={policy.name} onChange={e => setPolicy({ ...policy, name: e.target.value })} /></Field>
        <Field label="Số ngày phép năm"><TextInput type="number" min={0} value={policy.annualDays} onChange={e => setPolicy({ ...policy, annualDays: Number(e.target.value) })} /></Field>
        <Field label="Tồn tối đa"><TextInput type="number" min={0} value={policy.carryOverMax} onChange={e => setPolicy({ ...policy, carryOverMax: Number(e.target.value) })} /></Field>
        <Field label="Báo trước (ngày)"><TextInput type="number" min={0} value={policy.minNoticeDays} onChange={e => setPolicy({ ...policy, minNoticeDays: Number(e.target.value) })} /></Field>
        <label className="chk span2"><input type="checkbox" checked={policy.allowNegative} onChange={e => setPolicy({ ...policy, allowNegative: e.target.checked })} /> Cho phép ứng phép</label>
        <div className="form-actions span2"><button className="btn-primary">Lưu chính sách</button></div>
      </form>}
      {tab === 'ot' && <form className="form-grid pad" onSubmit={e => { e.preventDefault(); const r = hr.saveOtPolicy(ot); toast(r.ok ? 'Đã lưu chính sách OT' : r.errors.form); }}>
        <Field label="Hệ số ngày thường"><TextInput type="number" step={0.1} value={ot.weekdayRate} onChange={e => setOt({ ...ot, weekdayRate: Number(e.target.value) })} /></Field>
        <Field label="Hệ số cuối tuần"><TextInput type="number" step={0.1} value={ot.weekendRate} onChange={e => setOt({ ...ot, weekendRate: Number(e.target.value) })} /></Field>
        <Field label="Hệ số ngày lễ"><TextInput type="number" step={0.1} value={ot.holidayRate} onChange={e => setOt({ ...ot, holidayRate: Number(e.target.value) })} /></Field>
        <Field label="Trần giờ / ngày"><TextInput type="number" min={1} value={ot.dailyHourCap} onChange={e => setOt({ ...ot, dailyHourCap: Number(e.target.value) })} /></Field>
        <Field label="Trần giờ / tháng"><TextInput type="number" min={1} value={ot.monthlyHourCap} onChange={e => setOt({ ...ot, monthlyHourCap: Number(e.target.value) })} /></Field>
        <div className="form-actions span2"><button className="btn-primary">Lưu OT</button></div>
      </form>}
      {tab === 'lydo' && <div>
        <form className="toolbar" onSubmit={e => { e.preventDefault(); const r = hr.saveReason({ ...reason, active: true }); if (!r.ok) { toast(r.errors.name); return; } setReason({ ...reason, name: '' }); toast('Đã thêm lý do'); }}>
          <Select aria-label="Loại lý do" value={reason.type} onChange={e => setReason({ ...reason, type: e.target.value as TimeRequestType })}>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
          <TextInput aria-label="Tên lý do" value={reason.name} placeholder="Tên lý do" onChange={e => setReason({ ...reason, name: e.target.value })} />
          <button className="btn-primary">Thêm</button>
        </form>
        <DataTable rows={state.requestReasons} columns={[
          { id: 'type', header: 'Loại', sort: r => requestLabel(r.type), cell: r => requestLabel(r.type) },
          { id: 'name', header: 'Lý do', sort: r => r.name, cell: r => r.name },
          { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => void removeReason(r)}>Xóa</button> },
        ]} />
      </div>}
      {tab === 'quytrinh' && <div className="pad">{state.requestProcedures.map(item => <ProcedureRow key={item.id} procedure={item} />)}</div>}
      {tab === 'ca' && <ShiftSettings />}
    </div>
  );
}

function ProcedureRow({ procedure }: { procedure: { id: string; type: TimeRequestType; name: string; steps: { order: number; role: 'Quản lý trực tiếp' | 'Trưởng phòng Nhân sự' | 'Giám đốc' }[] } }) {
  const toast = useToast();
  const [steps, setSteps] = useState(procedure.steps);
  const roles = ['Quản lý trực tiếp', 'Trưởng phòng Nhân sự', 'Giám đốc'] as const;
  return (
    <form className="form-grid" style={{ marginBottom: 16 }} onSubmit={e => { e.preventDefault(); const r = hr.saveProcedure({ ...procedure, steps: steps.map((step, index) => ({ ...step, order: index + 1 })) }); toast(r.ok ? 'Đã lưu quy trình ' + requestLabel(procedure.type) : r.errors.form); }}>
      <p className="section-title">{requestLabel(procedure.type)}</p>
      {steps.map((step, index) => <Field key={index} label={`Bước ${index + 1}`}><Select value={step.role} onChange={e => setSteps(current => current.map((item, i) => i === index ? { ...item, role: e.target.value as typeof step.role } : item))}>{roles.map(role => <option key={role}>{role}</option>)}</Select></Field>)}
      <div className="form-actions span2"><button className="btn-primary btn-sm">Lưu</button></div>
    </form>
  );
}

function ShiftSettings() {
  const { state } = useLabels();
  const toast = useToast();
  const [form, setForm] = useState({ code: '', name: '', start: '08:00', end: '17:00' });
  return (
    <div>
      <form className="toolbar" onSubmit={e => { e.preventDefault(); const r = hr.saveShift(form); if (!r.ok) { toast(r.errors.form); return; } setForm({ code: '', name: '', start: '08:00', end: '17:00' }); toast('Đã thêm ca'); }}>
        <TextInput aria-label="Mã ca" placeholder="Mã" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        <TextInput aria-label="Tên ca" placeholder="Tên ca" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <TextInput aria-label="Giờ vào" type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} />
        <TextInput aria-label="Giờ ra" type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} />
        <button className="btn-primary">Thêm ca</button>
      </form>
      <DataTable rows={state.shifts} columns={[
        { id: 'code', header: 'Mã', sort: r => r.code, cell: r => r.code },
        { id: 'name', header: 'Ca', sort: r => r.name, cell: r => r.name },
        { id: 'start', header: 'Bắt đầu', cell: r => r.start },
        { id: 'end', header: 'Kết thúc', cell: r => r.end },
      ]} />
    </div>
  );
}
