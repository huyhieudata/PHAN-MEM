import { useMemo, useState } from 'react';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/Person';
import { useConfirm, useToast } from '../../components/feedback';
import { downloadText } from '../../data/csv';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import { canAct, countWeekdays, currentStep, hoursBetween, REQUEST_TYPES, requestLabel, requestUnit, requestsToCsv } from '../../data/timeoff';
import type { TimeRequest, TimeRequestInput, TimeRequestType } from '../../data/types';
import { fmtDate, includesPlain } from '../../data/text';
import { useLabels } from '../hr/lookups';

type View = 'all' | 'mine' | 'approve' | 'watch' | 'behalf' | 'manage';

const TITLES: Record<View, string> = {
  all: 'Mọi đơn trong công ty',
  mine: 'Đơn do tôi tạo',
  approve: 'Đơn đang chờ tôi duyệt',
  watch: 'Đơn tôi được theo dõi',
  behalf: 'Đơn tạo hộ cho người khác',
  manage: 'Quản lý toàn bộ đơn',
};

export default function RequestsPage({ view }: { view: View }) {
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TimeRequest | null>(null);

  const rows = useMemo(() => state.requests.filter(request => {
    if (view === 'mine' && request.createdBy !== USER.name) return false;
    if (view === 'approve' && !canAct(request, USER.name, state)) return false;
    if (view === 'watch' && !request.watchers.includes(USER.name)) return false;
    if (view === 'behalf' && !request.onBehalf) return false;
    if (type && request.type !== type) return false;
    if (status && request.status !== status) return false;
    const person = employee(request.employeeId);
    return includesPlain([request.code, requestLabel(request.type), person?.fullName ?? '', request.note, request.createdBy].join(' '), q);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state, view, q, type, status, employee]);

  async function cancel(request: TimeRequest) {
    const yes = await ask({ title: 'Hủy đơn', message: `Hủy đơn ${request.code}?`, confirmLabel: 'Hủy đơn', danger: true });
    if (!yes) return;
    const result = hr.cancelRequest(request.id, USER.name);
    toast(result.ok ? 'Đã hủy đơn' : result.errors.form);
    if (result.ok) setActive(null);
  }

  const columns: Column<TimeRequest>[] = [
    { id: 'code', header: 'Mã', sort: r => r.code, cell: r => <button className="link" onClick={() => setActive(r)}>{r.code}</button> },
    { id: 'type', header: 'Loại đơn', sort: r => requestLabel(r.type), cell: r => requestLabel(r.type) },
    { id: 'emp', header: 'Nhân sự', sort: r => employee(r.employeeId)?.fullName ?? '', cell: r => employee(r.employeeId)?.fullName ?? '—' },
    { id: 'when', header: 'Thời gian', sort: r => r.startDate, cell: r => `${fmtDate(r.startDate)}${r.endDate && r.endDate !== r.startDate ? ' – ' + fmtDate(r.endDate) : ''}` },
    { id: 'qty', header: 'Số lượng', sort: r => r.quantity, cell: r => `${r.quantity} ${requestUnit(r.type)}` },
    { id: 'step', header: 'Bước duyệt', cell: r => currentStep(r) ? `${currentStep(r)!.role}` : '—' },
    { id: 'by', header: 'Người tạo', sort: r => r.createdBy, cell: r => r.onBehalf ? `${r.createdBy} (hộ)` : r.createdBy },
    { id: 'st', header: 'Trạng thái', sort: r => r.status, cell: r => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm đơn" value={q} placeholder="Tìm mã, tên, nội dung" onChange={e => setQ(e.target.value)} /></div>
        <select aria-label="Loại đơn" value={type} onChange={e => setType(e.target.value)}><option value="">Mọi loại</option>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <select aria-label="Trạng thái đơn" value={status} onChange={e => setStatus(e.target.value)}><option value="">Mọi trạng thái</option>{['Nháp', 'Chờ duyệt', 'Đang duyệt', 'Đã duyệt', 'Từ chối', 'Đã hủy'].map(item => <option key={item}>{item}</option>)}</select>
        <div className="grow" />
        <span className="muted small">{TITLES[view]}</span>
        <button className="btn-ghost" onClick={() => downloadText('don-tu.csv', requestsToCsv(rows, state))}>⤓ Export</button>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Tạo đơn</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={`${view}|${q}|${type}|${status}`} empty="Không có đơn phù hợp" />
      {open && <RequestForm behalf={view === 'behalf'} onClose={() => setOpen(false)} />}
      {active && <RequestDetail request={state.requests.find(item => item.id === active.id) ?? active} onClose={() => setActive(null)} onCancel={() => void cancel(active)} />}
    </div>
  );
}

function blank(behalf: boolean): TimeRequestInput {
  return { type: 'nghi-phep', employeeId: '', onBehalf: behalf, reasonId: '', note: '', startDate: '', endDate: '', startTime: '', endTime: '', quantity: 1, leaveTypeId: 'lt-nam', shiftId: '', targetShiftId: '', watchers: [], submit: true };
}

function RequestForm({ behalf, onClose }: { behalf: boolean; onClose: () => void }) {
  const state = useLabels().state;
  const toast = useToast();
  const [form, setForm] = useState<TimeRequestInput>(() => blank(behalf));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reasons = state.requestReasons.filter(item => item.active && item.type === form.type);
  const dayType = requestUnit(form.type) === 'ngày';

  function patch(partial: Partial<TimeRequestInput>) {
    setForm(current => {
      const next = { ...current, ...partial };
      if (dayType && (partial.startDate || partial.endDate)) next.quantity = countWeekdays(next.startDate, next.endDate || next.startDate) || next.quantity;
      if (!dayType && (partial.startTime || partial.endTime)) next.quantity = hoursBetween(next.startTime, next.endTime) || next.quantity;
      if (partial.type) next.reasonId = '';
      return next;
    });
  }

  function save(submit: boolean) {
    const result = hr.saveRequest({ ...form, onBehalf: behalf || form.onBehalf, submit }, undefined, USER.name);
    if (!result.ok) { setErrors(result.errors); return; }
    toast(submit ? 'Đã gửi đơn' : 'Đã lưu nháp');
    onClose();
  }

  return (
    <Modal title={behalf ? 'Tạo hộ đơn' : 'Tạo đơn'} onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); save(true); }}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Loại đơn" required>
            <Select value={form.type} onChange={e => patch({ type: e.target.value as TimeRequestType })}>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
          </Field>
          <Field label="Nhân sự" required error={errors.employeeId}>
            <Select value={form.employeeId} onChange={e => patch({ employeeId: e.target.value })}><option value="">Chọn nhân sự</option>{state.employees.filter(e => e.status !== 'Đã nghỉ việc').map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select>
          </Field>
          {form.type === 'nghi-phep' && <Field label="Loại phép" required error={errors.leaveTypeId}><Select value={form.leaveTypeId} onChange={e => patch({ leaveTypeId: e.target.value })}>{state.leaveTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>}
          <Field label="Lý do" error={errors.reasonId}><Select value={form.reasonId} onChange={e => patch({ reasonId: e.target.value })}><option value="">Không chọn</option>{reasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label={dayType ? 'Từ ngày' : 'Ngày'} required error={errors.startDate}><TextInput type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value })} /></Field>
          {dayType && <Field label="Đến ngày" error={errors.endDate}><TextInput type="date" value={form.endDate} onChange={e => patch({ endDate: e.target.value })} /></Field>}
          {!dayType && <Field label="Từ giờ" error={errors.startTime}><TextInput type="time" value={form.startTime} onChange={e => patch({ startTime: e.target.value })} /></Field>}
          {!dayType && <Field label="Đến giờ"><TextInput type="time" value={form.endTime} onChange={e => patch({ endTime: e.target.value })} /></Field>}
          {form.type === 'doi-ca' && <Field label="Ca hiện tại" required error={errors.shiftId}><Select value={form.shiftId} onChange={e => patch({ shiftId: e.target.value })}><option value="">Chọn ca</option>{state.shifts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>}
          {form.type === 'doi-ca' && <Field label="Ca muốn đổi" required error={errors.targetShiftId}><Select value={form.targetShiftId} onChange={e => patch({ targetShiftId: e.target.value })}><option value="">Chọn ca</option>{state.shifts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>}
          <Field label={`Số lượng (${requestUnit(form.type)})`} required error={errors.quantity}><TextInput type="number" min={0} step={0.5} value={form.quantity} onChange={e => patch({ quantity: Number(e.target.value) })} /></Field>
          <Field label="Người theo dõi"><Select multiple value={form.watchers} onChange={e => patch({ watchers: [...e.target.selectedOptions].map(o => o.value) })}>{state.employees.map(emp => <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>)}</Select></Field>
          <Field label="Nội dung" required error={errors.note} className="span2"><TextArea value={form.note} onChange={e => patch({ note: e.target.value })} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Đóng</button>
          <button type="button" className="btn-ghost" onClick={() => save(false)}>Lưu nháp</button>
          <button className="btn-primary" type="submit">Gửi duyệt</button>
        </div>
      </form>
    </Modal>
  );
}

function RequestDetail({ request, onClose, onCancel }: { request: TimeRequest; onClose: () => void; onCancel: () => void }) {
  const toast = useToast();
  const { employee } = useLabels();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const actionable = canAct(request, USER.name, useLabels().state);
  function approve() {
    const result = hr.approveRequest(request.id, note, USER.name);
    if (!result.ok) { setError(result.errors.form || ''); return; }
    toast('Đã duyệt');
    onClose();
  }
  function reject() {
    const result = hr.rejectRequest(request.id, note, USER.name);
    if (!result.ok) { setError(result.errors.note || result.errors.form || ''); return; }
    toast('Đã từ chối');
    onClose();
  }
  return (
    <Modal title={request.code} onClose={onClose} wide>
      <div className="body">
        <p><b>{requestLabel(request.type)}</b> · {employee(request.employeeId)?.fullName} · <StatusBadge value={request.status} /></p>
        <p>{fmtDate(request.startDate)}{request.endDate !== request.startDate ? ` – ${fmtDate(request.endDate)}` : ''} · {request.quantity} {requestUnit(request.type)}{request.startTime ? ` · ${request.startTime}–${request.endTime}` : ''}</p>
        <p>{request.note}</p>
        <h3>Chuỗi duyệt</h3>
        <ul className="timeline">{request.steps.map(step => <li key={step.order}><i /><div><b>{step.role}</b> · {step.approverName} · {step.status}{step.note ? ` — ${step.note}` : ''}</div></li>)}</ul>
        <h3>Lịch sử</h3>
        <ul className="timeline">{request.history.map((event, index) => <li key={index}><i /><div><b>{event.action}</b> · {event.actor}{event.note ? ` — ${event.note}` : ''}</div></li>)}</ul>
        {actionable && <Field label="Ghi chú duyệt / lý do từ chối" error={error}><TextArea value={note} onChange={e => setNote(e.target.value)} /></Field>}
        <div className="form-actions">
          {request.status !== 'Đã duyệt' && request.status !== 'Từ chối' && request.status !== 'Đã hủy' && <button className="btn-ghost" onClick={onCancel}>Hủy đơn</button>}
          <div className="grow" />
          {actionable && <button className="btn-danger" onClick={reject}>Từ chối</button>}
          {actionable && <button className="btn-primary" onClick={approve}>Duyệt</button>}
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </Modal>
  );
}
