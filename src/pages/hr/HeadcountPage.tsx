import { useMemo, useState } from 'react';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/Person';
import { useConfirm, useToast } from '../../components/feedback';
import { actualHeadcount } from '../../data/derive';
import { hr } from '../../data/repositories';
import type { FieldErrors, HeadcountInput, HeadcountPlan } from '../../data/types';
import { includesPlain, todayISO } from '../../data/text';
import { useLabels } from './lookups';

interface Row extends HeadcountPlan {
  actual: number;
  gapLabel: string;
}

export default function HeadcountPage() {
  const toast = useToast();
  const ask = useConfirm();
  const { state, unit, position } = useLabels();
  const [year, setYear] = useState(Number(todayISO().slice(0, 4)));
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HeadcountPlan | null>(null);
  const years = [...new Set(state.headcounts.map(h => h.year))].sort();
  if (!years.includes(year)) years.push(year);

  const rows = useMemo(() => state.headcounts.filter(h => h.year === year).map<Row>(h => {
    const actual = actualHeadcount(state, h.unitId, h.positionId);
    const gap = actual - h.planned;
    const gapLabel = gap === 0 ? 'Đủ' : gap < 0 ? `Thiếu ${-gap}` : `Vượt ${gap}`;
    return { ...h, actual, gapLabel };
  }).filter(h => includesPlain([unit(h.unitId), position(h.positionId)].join(' '), q)), [state, year, q, unit, position]);

  const columns: Column<Row>[] = [
    { id: 'unit', header: 'Đơn vị', sort: r => unit(r.unitId), cell: r => unit(r.unitId) },
    { id: 'pos', header: 'Vị trí', sort: r => position(r.positionId), cell: r => position(r.positionId) },
    { id: 'plan', header: 'Định biên', sort: r => r.planned, cell: r => r.planned },
    { id: 'act', header: 'Thực tế', sort: r => r.actual, cell: r => r.actual },
    { id: 'gap', header: 'Chênh lệch', sort: r => r.actual - r.planned, cell: r => <StatusBadge value={r.gapLabel} /> },
    { id: 'note', header: 'Ghi chú', cell: r => r.note || '—' },
    {
      id: 'ops', header: '', cell: r => (
        <div className="row-actions">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(r)}>Sửa</button>
          <button className="btn-ghost btn-sm" onClick={() => void remove(r)}>Xóa</button>
        </div>
      ),
    },
  ];

  async function remove(row: HeadcountPlan) {
    const yes = await ask({ title: 'Xóa định biên', message: 'Xóa dòng định biên này?', confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    hr.deleteHeadcount(row.id);
    toast('Đã xóa định biên');
  }

  const missing = rows.reduce((sum, row) => sum + Math.max(0, row.planned - row.actual), 0);

  return (
    <div className="card panel">
      <div className="toolbar">
        <label className="muted">Năm</label>
        <select aria-label="Năm định biên" value={year} onChange={e => setYear(Number(e.target.value))}>{[...years].sort().map(y => <option key={y}>{y}</option>)}</select>
        <div className="in-search">🔍<input value={q} aria-label="Tìm định biên" placeholder="Tìm đơn vị, vị trí" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" />
        <span className="status warn">Thiếu {missing} định biên</span>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm định biên</button>
      </div>
      <p className="hint">Thực tế đếm người chưa nghỉ việc theo đúng đơn vị và vị trí. Năm trên định biên là năm kế hoạch.</p>
      <DataTable rows={rows} columns={columns} filterKey={`${year}|${q}`} />
      {open && <HeadcountForm year={year} onClose={() => setOpen(false)} />}
      {editing && <HeadcountForm record={editing} year={year} onClose={() => setEditing(null)} />}
    </div>
  );
}

function HeadcountForm({ record, year, onClose }: { record?: HeadcountPlan; year: number; onClose: () => void }) {
  const { state } = useLabels();
  const toast = useToast();
  const [form, setForm] = useState<HeadcountInput>({
    unitId: record?.unitId ?? '',
    positionId: record?.positionId ?? '',
    year: record?.year ?? year,
    planned: record?.planned ?? 1,
    note: record?.note ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveHeadcount(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu định biên');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa định biên' : 'Thêm định biên'} onClose={onClose}>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Đơn vị" required error={errors.unitId} className="span2">
            <Select value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })}><option value="">Chọn đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          </Field>
          <Field label="Vị trí" required error={errors.positionId} className="span2">
            <Select value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })}><option value="">Chọn vị trí</option>{state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          </Field>
          <Field label="Năm" required error={errors.year}><TextInput type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></Field>
          <Field label="Số lượng định biên" required error={errors.planned}><TextInput type="number" min={0} value={form.planned} onChange={e => setForm({ ...form, planned: Number(e.target.value) })} /></Field>
          <Field label="Ghi chú" className="span2"><TextArea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" type="submit">Lưu</button>
        </div>
      </form>
    </Modal>
  );
}
