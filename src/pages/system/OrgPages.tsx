import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/Person';
import { useConfirm, useToast } from '../../components/feedback';
import { hr } from '../../data/repositories';
import type { Branch, BranchInput, FieldErrors, LevelInput, OrgLevel, OrgUnit, Position, PositionInput, UnitInput } from '../../data/types';
import { includesPlain } from '../../data/text';
import { useLabels } from '../hr/lookups';

export function SystemOverview() {
  const nav = useNavigate();
  const { state } = useLabels();
  const cards = [
    ['Chi nhánh', state.branches.length, '/m/he-thong/he-thong-chi-nhanh'],
    ['Đơn vị', state.units.length, '/m/he-thong/don-vi'],
    ['Cấp đơn vị', state.levels.length, '/m/he-thong/cap-don-vi'],
    ['Vị trí công việc', state.positions.length, '/m/he-thong/vi-tri-cong-viec'],
  ] as const;
  return (
    <div>
      <div className="kpis">
        {cards.map(([label, value, to]) => (
          <button key={label} className="kpi" onClick={() => nav(to)}><small>{label}</small><b>{value}</b></button>
        ))}
      </div>
      <div className="card pad-card">
        <h3>Cơ cấu tổ chức</h3>
        <p>Cây đơn vị dùng chung với hồ sơ nhân sự: mỗi người gắn một chi nhánh, một đơn vị và một vị trí.</p>
        <button className="btn-primary" onClick={() => nav('/m/he-thong/co-cau-to-chuc')}>Mở sơ đồ</button>
      </div>
    </div>
  );
}

export function BranchesPage() {
  const toast = useToast();
  const ask = useConfirm();
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const rows = state.branches.filter(b => includesPlain([b.code, b.name, b.address, b.phone].join(' '), q));
  async function remove(row: Branch) {
    const yes = await ask({ title: 'Xóa chi nhánh', message: `Xóa ${row.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteBranch(row.id);
    toast(result.ok ? 'Đã xóa chi nhánh' : result.errors.form);
  }
  const columns: Column<Branch>[] = [
    { id: 'code', header: 'Mã', sort: b => b.code, cell: b => b.code },
    { id: 'name', header: 'Chi nhánh', sort: b => b.name, cell: b => b.name },
    { id: 'address', header: 'Địa chỉ', sort: b => b.address, cell: b => b.address },
    { id: 'phone', header: 'Điện thoại', sort: b => b.phone, cell: b => b.phone },
    { id: 'st', header: 'Trạng thái', sort: b => b.status, cell: b => <StatusBadge value={b.status} /> },
    { id: 'act', header: '', cell: b => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(b)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(b)}>Xóa</button></div> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm chi nhánh" value={q} placeholder="Tìm chi nhánh" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm chi nhánh</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {open && <BranchForm onClose={() => setOpen(false)} />}
      {editing && <BranchForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BranchForm({ record, onClose }: { record?: Branch; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<BranchInput>(record ?? { code: '', name: '', address: '', phone: '', status: 'Hoạt động' });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveBranch(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu chi nhánh');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa chi nhánh' : 'Thêm chi nhánh'} onClose={onClose}>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Mã" required error={errors.code}><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Tên" required error={errors.name}><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Địa chỉ" className="span2"><TextInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Điện thoại"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Trạng thái"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BranchInput['status'] })}><option>Hoạt động</option><option>Ngừng</option></Select></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
      </form>
    </Modal>
  );
}

export function LevelsPage() {
  const toast = useToast();
  const ask = useConfirm();
  const { state } = useLabels();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgLevel | null>(null);
  async function remove(row: OrgLevel) {
    const yes = await ask({ title: 'Xóa cấp đơn vị', message: `Xóa cấp "${row.name}"?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteLevel(row.id);
    toast(result.ok ? 'Đã xóa' : result.errors.form);
  }
  const columns: Column<OrgLevel>[] = [
    { id: 'rank', header: 'Bậc', sort: l => l.rank, cell: l => l.rank },
    { id: 'name', header: 'Cấp đơn vị', sort: l => l.name, cell: l => l.name },
    { id: 'act', header: '', cell: l => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(l)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(l)}>Xóa</button></div> },
  ];
  const rows = [...state.levels].sort((a, b) => a.rank - b.rank);
  return (
    <div className="card panel">
      <div className="toolbar"><p className="muted">Bậc 1 là cấp cao nhất. Đơn vị con phải có bậc lớn hơn đơn vị cha.</p><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm cấp</button></div>
      <DataTable rows={rows} columns={columns} />
      {open && <LevelForm onClose={() => setOpen(false)} />}
      {editing && <LevelForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function LevelForm({ record, onClose }: { record?: OrgLevel; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<LevelInput>(record ?? { name: '', rank: 3 });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveLevel(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu cấp đơn vị');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa cấp đơn vị' : 'Thêm cấp đơn vị'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Tên cấp" required error={errors.name}><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Bậc" required error={errors.rank}><TextInput type="number" min={1} max={9} value={form.rank} onChange={e => setForm({ ...form, rank: Number(e.target.value) })} /></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
      </form>
    </Modal>
  );
}

export function PositionsPage() {
  const toast = useToast();
  const ask = useConfirm();
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const rows = state.positions.filter(p => includesPlain([p.code, p.name, p.description].join(' '), q));
  async function remove(row: Position) {
    const yes = await ask({ title: 'Xóa vị trí', message: `Xóa vị trí ${row.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deletePosition(row.id);
    toast(result.ok ? 'Đã xóa vị trí' : result.errors.form);
  }
  const columns: Column<Position>[] = [
    { id: 'code', header: 'Mã', sort: p => p.code, cell: p => p.code },
    { id: 'name', header: 'Vị trí công việc', sort: p => p.name, cell: p => p.name },
    { id: 'desc', header: 'Mô tả', cell: p => p.description || '—' },
    { id: 'st', header: 'Trạng thái', sort: p => p.status, cell: p => <StatusBadge value={p.status} /> },
    { id: 'act', header: '', cell: p => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(p)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(p)}>Xóa</button></div> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm vị trí" value={q} placeholder="Tìm vị trí" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm vị trí</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {open && <PositionForm onClose={() => setOpen(false)} />}
      {editing && <PositionForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PositionForm({ record, onClose }: { record?: Position; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<PositionInput>(record ?? { code: '', name: '', description: '', status: 'Hoạt động' });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.savePosition(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu vị trí');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa vị trí' : 'Thêm vị trí'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Mã" required error={errors.code}><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Tên vị trí" required error={errors.name}><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mô tả" className="span2"><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Trạng thái"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PositionInput['status'] })}><option>Hoạt động</option><option>Ngừng</option></Select></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu</button></div>
      </form>
    </Modal>
  );
}

export function UnitsPage() {
  const { state, unit, branch, level, employee } = useLabels();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgUnit | null>(null);
  const toast = useToast();
  const ask = useConfirm();
  const rows = useMemo(() => state.units.filter(u => includesPlain([u.code, u.name, branch(u.branchId)].join(' '), q)), [state.units, q, branch]);
  async function remove(row: OrgUnit) {
    const yes = await ask({ title: 'Xóa đơn vị', message: `Xóa ${row.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteUnit(row.id);
    toast(result.ok ? 'Đã xóa đơn vị' : result.errors.form);
  }
  const columns: Column<OrgUnit>[] = [
    { id: 'code', header: 'Mã', sort: u => u.code, cell: u => u.code },
    { id: 'name', header: 'Đơn vị', sort: u => u.name, cell: u => u.name },
    { id: 'parent', header: 'Đơn vị cha', sort: u => unit(u.parentId), cell: u => unit(u.parentId) },
    { id: 'level', header: 'Cấp', sort: u => level(u.levelId), cell: u => level(u.levelId) },
    { id: 'branch', header: 'Chi nhánh', sort: u => branch(u.branchId), cell: u => branch(u.branchId) },
    { id: 'mgr', header: 'Quản lý', sort: u => employee(u.managerId)?.fullName ?? '', cell: u => employee(u.managerId)?.fullName ?? '—' },
    { id: 'st', header: 'Trạng thái', sort: u => u.status, cell: u => <StatusBadge value={u.status} /> },
    { id: 'act', header: '', cell: u => <div className="row-actions"><button className="btn-ghost btn-sm" onClick={() => setEditing(u)}>Sửa</button><button className="btn-ghost btn-sm" onClick={() => void remove(u)}>Xóa</button></div> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm đơn vị" value={q} placeholder="Tìm đơn vị" onChange={e => setQ(e.target.value)} /></div>
        <div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm đơn vị</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={q} />
      {open && <UnitForm onClose={() => setOpen(false)} />}
      {editing && <UnitForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function OrgTreePage() {
  const { state } = useLabels();
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);
  const [editing, setEditing] = useState<OrgUnit | null>(null);
  const roots = state.units.filter(u => !u.parentId);
  return (
    <div className="card pad-card">
      <div className="toolbar flat">
        <div className="grow" />
        <button className="btn-primary" onClick={() => setCreating({ parentId: null })}>+ Thêm đơn vị gốc</button>
      </div>
      <div className="tree">
        {roots.map(unit => <TreeNode key={unit.id} unit={unit} onAdd={parentId => setCreating({ parentId })} onEdit={setEditing} />)}
      </div>
      {creating && <UnitForm parentId={creating.parentId} onClose={() => setCreating(null)} />}
      {editing && <UnitForm record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TreeNode({ unit, onAdd, onEdit }: { unit: OrgUnit; onAdd: (parentId: string) => void; onEdit: (unit: OrgUnit) => void }) {
  const { state, branch, level, employee } = useLabels();
  const toast = useToast();
  const ask = useConfirm();
  const children = state.units.filter(u => u.parentId === unit.id).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const count = state.employees.filter(e => e.unitId === unit.id && e.status !== 'Đã nghỉ việc').length;
  async function remove() {
    const yes = await ask({ title: 'Xóa đơn vị', message: `Xóa ${unit.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteUnit(unit.id);
    toast(result.ok ? 'Đã xóa đơn vị' : result.errors.form);
  }
  return (
    <div>
      <div className="tree-node">
        <div className="tree-row">
          <div>
            <b>{unit.name}</b>
            <div className="muted small">{unit.code} · {level(unit.levelId)} · {branch(unit.branchId)} · {employee(unit.managerId)?.fullName ?? 'Chưa có quản lý'} · {count} người</div>
          </div>
          <div className="row-actions">
            <button className="btn-ghost btn-sm" onClick={() => onAdd(unit.id)}>Thêm đơn vị con</button>
            <button className="btn-ghost btn-sm" onClick={() => onEdit(unit)}>Sửa</button>
            <button className="btn-ghost btn-sm" onClick={() => void remove()}>Xóa</button>
          </div>
        </div>
      </div>
      {children.length > 0 && <div className="tree-children">{children.map(child => <TreeNode key={child.id} unit={child} onAdd={onAdd} onEdit={onEdit} />)}</div>}
    </div>
  );
}

export function UnitForm({ record, parentId, onClose }: { record?: OrgUnit; parentId?: string | null; onClose: () => void }) {
  const { state } = useLabels();
  const toast = useToast();
  const ask = useConfirm();
  const [form, setForm] = useState<UnitInput>(() => record
    ? { code: record.code, name: record.name, parentId: record.parentId, levelId: record.levelId, branchId: record.branchId, managerId: record.managerId, status: record.status }
    : { code: '', name: '', parentId: parentId ?? null, levelId: state.levels[0]?.id ?? '', branchId: state.branches[0]?.id ?? '', managerId: null, status: 'Hoạt động' });
  const [errors, setErrors] = useState<FieldErrors>({});
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = hr.saveUnit(form, record?.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã lưu đơn vị');
    onClose();
  }
  async function remove() {
    if (!record) return;
    const yes = await ask({ title: 'Xóa đơn vị', message: `Xóa ${record.name}?`, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteUnit(record.id);
    if (!result.ok) { setErrors(result.errors); return; }
    toast('Đã xóa đơn vị');
    onClose();
  }
  return (
    <Modal title={record ? 'Sửa đơn vị' : 'Thêm đơn vị'} onClose={onClose}>
      <form onSubmit={save}>
        {errors.form && <div className="banner bad">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Mã" required error={errors.code}><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Tên đơn vị" required error={errors.name}><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Đơn vị cha" error={errors.parentId} className="span2">
            <Select value={form.parentId ?? ''} onChange={e => setForm({ ...form, parentId: e.target.value || null })}>
              <option value="">Không có (gốc)</option>
              {state.units.filter(u => u.id !== record?.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Cấp đơn vị" required error={errors.levelId}>
            <Select value={form.levelId} onChange={e => setForm({ ...form, levelId: e.target.value })}>{state.levels.map(l => <option key={l.id} value={l.id}>{l.rank}. {l.name}</option>)}</Select>
          </Field>
          <Field label="Chi nhánh" required error={errors.branchId}>
            <Select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>{state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
          </Field>
          <Field label="Quản lý" error={errors.managerId} className="span2">
            <Select value={form.managerId ?? ''} onChange={e => setForm({ ...form, managerId: e.target.value || null })}>
              <option value="">Chưa chọn</option>
              {state.employees.filter(e => e.status !== 'Đã nghỉ việc').map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as UnitInput['status'] })}><option>Hoạt động</option><option>Ngừng</option></Select>
          </Field>
        </div>
        <div className="form-actions">
          {record && <button type="button" className="btn-danger" onClick={() => void remove()}>Xóa</button>}
          <div className="grow" />
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary">Lưu</button>
        </div>
      </form>
    </Modal>
  );
}
