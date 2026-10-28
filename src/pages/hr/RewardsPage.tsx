import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { useConfirm, useToast } from '../../components/feedback';
import { DISCIPLINE_FORMS, REWARD_FORMS } from '../../data/labels';
import { hr } from '../../data/repositories';
import type { FieldErrors, Reward, RewardInput, RewardKind } from '../../data/types';
import { fmtDate, fmtMoney, includesPlain } from '../../data/text';
import { useLabels } from './lookups';

export default function RewardsPage({ kind }: { kind: RewardKind }) {
  const nav = useNavigate();
  const toast = useToast();
  const ask = useConfirm();
  const { state, employee } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const title = kind === 'reward' ? 'khen thưởng' : 'kỷ luật';

  const rows = useMemo(() => state.rewards.filter(r => r.kind === kind && includesPlain([
    r.title, r.form, r.reason, employee(r.employeeId)?.fullName ?? '',
  ].join(' '), q)), [state.rewards, kind, q, employee]);

  async function remove(row: Reward) {
    const yes = await ask({ title: 'Xóa bản ghi', message: `Xóa "${row.title}"?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteReward(row.id);
    toast('Đã xóa');
  }

  const columns: Column<Reward>[] = [
    { id: 'date', header: 'Ngày', sort: r => r.date, cell: r => fmtDate(r.date) },
    { id: 'emp', header: 'Nhân sự', sort: r => employee(r.employeeId)?.fullName ?? '', cell: r => <button className="link" onClick={() => nav(`/m/nhan-su/thong-tin-nhan-su/${r.employeeId}`)}>{employee(r.employeeId)?.fullName ?? '—'}</button> },
    { id: 'title', header: 'Nội dung', sort: r => r.title, cell: r => r.title },
    { id: 'form', header: 'Hình thức', sort: r => r.form, cell: r => r.form },
    { id: 'amount', header: 'Số tiền', sort: r => r.amount, cell: r => r.amount ? fmtMoney(r.amount) : '—' },
    { id: 'reason', header: 'Lý do', cell: r => r.reason },
    { id: 'act', header: '', cell: r => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(r)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(r)}>Xóa</button></div> },
  ];

  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label={`Tìm ${title}`} value={q} placeholder="Tìm nhân sự, nội dung" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm {title}</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} empty={`Chưa có ${title}`} />
      {open && <RewardForm kind={kind} onClose={() => setOpen(false)} />}
      {editing && <RewardForm kind={kind} record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RewardForm({ kind, record, onClose }: { kind: RewardKind; record?: Reward; onClose: () => void }) {
  const { state } = useLabels();
  const toast = useToast();
  const forms = kind === 'reward' ? REWARD_FORMS : DISCIPLINE_FORMS;
  const [form, setForm] = useState<RewardInput>({
    employeeId: record?.employeeId ?? '',
    kind,
    title: record?.title ?? '',
    form: record?.form ?? forms[0],
    date: record?.date ?? '',
    amount: record?.amount ?? 0,
    reason: record?.reason ?? '',
    decisionId: record?.decisionId ?? null,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveReward({ ...form, kind }, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa bản ghi' : kind === 'reward' ? 'Thêm khen thưởng' : 'Thêm kỷ luật'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Nhân sự" required error={errors.employeeId} className="span2">
            <Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Chọn nhân sự</option>
              {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Tiêu đề" required error={errors.title}><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Hình thức" required error={errors.form}>
            <Select value={form.form} onChange={e => setForm({ ...form, form: e.target.value })}>{forms.map(item => <option key={item}>{item}</option>)}</Select>
          </Field>
          <Field label="Ngày" required error={errors.date}><TextInput type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Số tiền" error={errors.amount}><TextInput type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
          <Field label="Quyết định liên quan" className="span2">
            <Select value={form.decisionId ?? ''} onChange={e => setForm({ ...form, decisionId: e.target.value || null })}>
              <option value="">Không gắn</option>
              {state.decisions.map(d => <option key={d.id} value={d.id}>{d.code} · {d.title}</option>)}
            </Select>
          </Field>
          <Field label="Lý do" required error={errors.reason} className="span2"><TextArea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" type="submit">Lưu</button>
        </div>
      </form>
    </Modal>
  );
}
