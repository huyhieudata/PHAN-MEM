import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/Person';
import { useConfirm, useToast } from '../../components/feedback';
import { DECISION_TYPES } from '../../data/labels';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import type { Decision, DecisionInput, FieldErrors } from '../../data/types';
import { fmtDate, includesPlain } from '../../data/text';
import { useLabels } from './lookups';

type Scope = 'all' | 'mine' | 'pending';

export default function DecisionsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [scope, setScope] = useState<Scope>('all');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);
  const [rejecting, setRejecting] = useState<Decision | null>(null);
  const [viewing, setViewing] = useState<Decision | null>(null);

  const rows = useMemo(() => state.decisions.filter(d => {
    if (scope === 'mine' && d.createdBy !== USER.name) return false;
    if (scope === 'pending' && d.status !== 'Chờ duyệt') return false;
    const emp = employee(d.employeeId);
    return includesPlain([d.code, d.title, d.type, emp?.fullName ?? '', d.createdBy].join(' '), q);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state.decisions, scope, q, employee]);

  async function approve(decision: Decision) {
    const yes = await ask({ title: 'Duyệt quyết định', message: `Duyệt "${decision.title}"?`, confirmLabel: 'Duyệt' });
    if (!yes) return;
    const result = hr.approveDecision(decision.id, 'Đồng ý', USER.name);
    if (!result.ok) toast(result.errors.form || 'Không duyệt được');
    else { toast('Đã duyệt quyết định'); setViewing(null); }
  }

  async function remove(decision: Decision) {
    const yes = await ask({ title: 'Xóa quyết định', message: `Xóa ${decision.code}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteDecision(decision.id);
    if (!result.ok) toast(result.errors.form || 'Không xóa được');
    else toast('Đã xóa quyết định');
  }

  const columns: Column<Decision>[] = [
    { id: 'code', header: 'Số', sort: d => d.code, cell: d => d.code },
    { id: 'title', header: 'Quyết định', sort: d => d.title, cell: d => <button className="link" onClick={() => setViewing(d)}>{d.title}</button> },
    { id: 'type', header: 'Loại', sort: d => d.type, cell: d => d.type },
    { id: 'emp', header: 'Nhân sự', sort: d => employee(d.employeeId)?.fullName ?? '', cell: d => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${d.employeeId}`)}>{employee(d.employeeId)?.fullName ?? '—'}</button> },
    { id: 'date', header: 'Hiệu lực', sort: d => d.effectiveDate, cell: d => fmtDate(d.effectiveDate) },
    { id: 'by', header: 'Người tạo', sort: d => d.createdBy, cell: d => d.createdBy },
    { id: 'st', header: 'Trạng thái', sort: d => d.status, cell: d => <StatusBadge value={d.status} /> },
    {
      id: 'act', header: '', cell: d => (
        <div className="row-actions">
          {d.status === 'Nháp' && <button className="btn-ghost btn-sm" onClick={() => setEditing(d)}>Sửa</button>}
          {d.status === 'Nháp' && <button className="btn-ghost btn-sm" onClick={() => { const r = hr.submitDecision(d.id); toast(r.ok ? 'Đã gửi duyệt' : r.errors.form); }}>Gửi duyệt</button>}
          {d.status === 'Chờ duyệt' && <button className="btn-primary btn-sm" onClick={() => void approve(d)}>Duyệt</button>}
          {d.status === 'Chờ duyệt' && <button className="btn-danger btn-sm" onClick={() => setRejecting(d)}>Từ chối</button>}
          {(d.status === 'Nháp' || d.status === 'Từ chối') && <button className="btn-ghost btn-sm" onClick={() => void remove(d)}>Xóa</button>}
        </div>
      ),
    },
  ];

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="seg">
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Tất cả</button>
          <button className={scope === 'mine' ? 'on' : ''} onClick={() => setScope('mine')}>Của tôi</button>
          <button className={scope === 'pending' ? 'on' : ''} onClick={() => setScope('pending')}>Cần duyệt</button>
        </div>
        <div className="in-search">🔍<input value={q} aria-label="Tìm quyết định" placeholder="Tìm số, tiêu đề, nhân sự" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <button className="btn-primary" onClick={() => setCreating(true)}>+ Tạo quyết định</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={`${scope}|${q}`} />
      {creating && <DecisionForm onClose={() => setCreating(false)} />}
      {editing && <DecisionForm record={editing} onClose={() => setEditing(null)} />}
      {rejecting && <RejectForm decision={rejecting} onClose={() => setRejecting(null)} />}
      {viewing && <DecisionView decision={viewing} onClose={() => setViewing(null)} onApprove={() => void approve(viewing)} onReject={() => { setRejecting(viewing); setViewing(null); }} />}
    </div>
  );
}

function DecisionForm({ record, onClose }: { record?: Decision; onClose: () => void }) {
  const state = useHrSafe();
  const toast = useToast();
  const [form, setForm] = useState<DecisionInput>({
    title: record?.title ?? '',
    type: record?.type ?? 'Bổ nhiệm',
    employeeId: record?.employeeId ?? '',
    content: record?.content ?? '',
    effectiveDate: record?.effectiveDate ?? '',
    submit: record ? record.status === 'Chờ duyệt' : true,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveDecision(form, record?.id, USER.name);
    if (!result.ok) { setErrors(result.errors); return; }
    toast(form.submit ? 'Đã gửi quyết định chờ duyệt' : 'Đã lưu nháp');
    onClose();
  }

  return (
    <Modal title={record ? 'Sửa quyết định' : 'Tạo quyết định'} onClose={onClose} wide>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Tiêu đề" required error={errors.title} className="span2"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Loại" required error={errors.type}>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DecisionInput['type'] })}>{DECISION_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Nhân sự" required error={errors.employeeId}>
            <Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Chọn nhân sự</option>
              {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName} · {emp.code}</option>)}
            </Select>
          </Field>
          <Field label="Ngày hiệu lực" required error={errors.effectiveDate}><TextInput type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} /></Field>
          <label className="chk"><input type="checkbox" checked={form.submit} onChange={e => setForm({ ...form, submit: e.target.checked })} /> Gửi duyệt ngay</label>
          <Field label="Nội dung" required error={errors.content} className="span2"><TextArea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" type="submit">Lưu</button>
        </div>
      </form>
    </Modal>
  );
}

function RejectForm({ decision, onClose }: { decision: Decision; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.rejectDecision(decision.id, note, USER.name);
    if (!result.ok) { setError(result.errors.note || result.errors.form || 'Không từ chối được'); return; }
    toast('Đã từ chối quyết định');
    onClose();
  }
  return (
    <Modal title="Từ chối quyết định" onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Lý do từ chối" required error={error}><TextArea value={note} onChange={e => setNote(e.target.value)} /></Field>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-danger" type="submit">Từ chối</button>
        </div>
      </form>
    </Modal>
  );
}

function DecisionView({ decision, onClose, onApprove, onReject }: { decision: Decision; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const { employee } = useLabels();
  return (
    <Modal title={decision.code} onClose={onClose}>
      <div className="body">
        <h2 className="view-title">{decision.title}</h2>
        <p><StatusBadge value={decision.status} /> · {decision.type} · hiệu lực {fmtDate(decision.effectiveDate)}</p>
        <p>Nhân sự: <b>{employee(decision.employeeId)?.fullName ?? '—'}</b></p>
        <p className="pre">{decision.content}</p>
        <p className="muted small">Tạo bởi {decision.createdBy}{decision.decidedBy ? ` · xử lý bởi ${decision.decidedBy}` : ''}</p>
        {decision.note && <p>Ghi chú duyệt: {decision.note}</p>}
        {decision.status === 'Chờ duyệt' && (
          <div className="form-actions">
            <button className="btn-danger" onClick={onReject}>Từ chối</button>
            <button className="btn-primary" onClick={onApprove}>Duyệt</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function useHrSafe() {
  return useLabels().state;
}
