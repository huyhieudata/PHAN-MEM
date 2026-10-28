import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { Drawer } from '../../components/Drawer';
import { Field, TextInput } from '../../components/Fields';
import { useToast } from '../../components/feedback';
import { hr } from '../../data/repositories';
import { fmtDate } from '../../data/text';
import { useLabels } from '../hr/lookups';

export function CompanyPage() {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: 'MACAS GROUP', hotline: '024 0000 0001', email: 'hr@vi-du.hrm.local', tax: '0000000000', desc: 'Công ty demo HRM Hub.', web: 'https://vi-du.hrm.local', fanpage: '', address: 'Số 1 Phố Mẫu, Quận Demo, Hà Nội' });
  return <div className="card pad-card"><div className="detail-hero"><div><b>{form.name}</b><div><span className="pill">10 - 24 Nhân viên</span></div></div><button className="btn-ghost" onClick={() => setEdit(!edit)}>CHỈNH SỬA</button></div>
    {edit ? <form className="form-grid" onSubmit={e => { e.preventDefault(); setEdit(false); }}>{Object.entries({ Hotline: 'hotline', Email: 'email', 'Mã số thuế': 'tax', 'Mô tả': 'desc', Website: 'web', Fanpage: 'fanpage', 'Trụ sở chính': 'address' }).map(([label, key]) => <Field key={key} label={label}><TextInput value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></Field>)}<button className="btn-primary">Lưu</button></form> : <dl className="dl"><dt>Hotline công ty</dt><dd>{form.hotline}</dd><dt>Email</dt><dd>{form.email}</dd><dt>Mã số thuế</dt><dd>{form.tax}</dd><dt>Mô tả</dt><dd>{form.desc}</dd><dt>Website</dt><dd>{form.web}</dd><dt>Fanpage</dt><dd>{form.fanpage || '—'}</dd><dt>Trụ sở chính</dt><dd>{form.address}</dd></dl>}
  </div>;
}

export function BranchAdminPage() {
  const { state } = useLabels();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '' });
  return <div className="card panel"><div className="toolbar"><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>THÊM CHI NHÁNH</button></div>
    <DataTable rows={state.branches.map((b, i) => ({ ...b, stt: i + 1, count: state.employees.filter(e => e.branchId === b.id).length }))} columns={[
      { id: 'stt', header: 'STT', cell: r => r.stt }, { id: 'code', header: 'Mã', cell: r => r.code }, { id: 'name', header: 'Tên chi nhánh', cell: r => r.name }, { id: 'addr', header: 'Địa chỉ', cell: r => r.address }, { id: 'phone', header: 'Hotline chi nhánh', cell: r => r.phone }, { id: 'n', header: 'Số nhân viên', cell: r => r.count }, { id: 'act', header: 'Tác vụ', cell: () => <button className="btn-ghost btn-sm">⋯</button> },
    ]} />
    {open && <Drawer title="THÊM CHI NHÁNH" onClose={() => setOpen(false)} footer={<button className="btn-primary" onClick={() => { const r = hr.saveBranch({ ...form, status: 'Hoạt động' }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } toast('Đã tạo chi nhánh'); setOpen(false); }}>Tạo mới</button>}>
      <Field label="Tên"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Mã"><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
      <Field label="Địa chỉ"><TextInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
      <Field label="Hotline"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
    </Drawer>}
  </div>;
}

export function OrgStructurePage() {
  const { state, level } = useLabels();
  const [tree, setTree] = useState(false);
  const [openAll, setOpenAll] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', levelId: state.levels[0]?.id ?? '', parentId: '', order: '1' });
  const toast = useToast();
  return <div className="card panel"><div className="toolbar">
    <button className="btn-ghost" onClick={() => setTree(v => !v)}>{tree ? 'Xem dạng bảng' : 'Xem dạng cây'}</button>
    <button className="btn-ghost" onClick={() => setOpenAll(v => !v)}>{openAll ? 'Thu gọn' : 'Mở rộng'}</button>
    <button className="btn-ghost" onClick={() => toast('Import cơ cấu: mẫu cột chưa có trong ghi chú.')}>Import</button>
    <button className="btn-primary" onClick={() => setAdding(true)}>Thêm mới</button>
  </div>
    {!tree ? <table className="tbl"><thead><tr><th>ĐƠN VỊ</th><th>SỐ THỨ TỰ</th><th>DANH MỤC</th><th>MÃ ĐƠN VỊ</th><th>ĐƠN VỊ CẤP TRÊN</th><th>HÀNH ĐỘNG</th></tr></thead><tbody>{state.units.map(u => <tr key={u.id}><td>{u.name}</td><td>1</td><td>{level(u.levelId)}</td><td>{u.code}</td><td>{state.units.find(p => p.id === u.parentId)?.name || '—'}</td><td><button className="btn-ghost btn-sm" onClick={() => hr.deleteUnit(u.id)}>Xóa</button></td></tr>)}</tbody></table>
      : <div>{openAll && <p>Có {state.units.length} đơn vị và {state.positions.length} vị trí</p>}{state.units.filter(u => !u.parentId).map(root => <OrgNode key={root.id} id={root.id} />)}</div>}
    {adding && <Drawer title="THÊM ĐƠN VỊ MỚI" onClose={() => setAdding(false)} footer={<><button className="btn-ghost" onClick={() => setAdding(false)}>Huỷ</button><button className="btn-primary" onClick={() => { const r = hr.saveUnit({ name: form.name, code: form.code, levelId: form.levelId, parentId: form.parentId || null, branchId: state.branches[0]?.id ?? '', managerId: null, status: 'Hoạt động' }); if (!r.ok) { toast(Object.values(r.errors)[0]); return; } toast('Đã thêm đơn vị'); setAdding(false); }}>THÊM</button></>}>
      <Field label="Đơn vị mới"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Mã đơn vị"><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
      <Field label="Cấp đơn vị"><select className="control" value={form.levelId} onChange={e => setForm({ ...form, levelId: e.target.value })}>{state.levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
      <Field label="Đơn vị cấp trên"><select className="control" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}><option value="">Không</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="Số thứ tự"><TextInput value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} /></Field>
      <div className="mini-card"><h4>Vị trí công việc</h4><p className="muted">Mã vị trí, số thứ tự, thời gian thử việc, là quản lý. Thêm vị trí sau khi có đơn vị, tại trang Vị trí công việc.</p></div>
    </Drawer>}
  </div>;
}

function OrgNode({ id }: { id: string }) {
  const { state } = useLabels();
  const unit = state.units.find(u => u.id === id);
  if (!unit) return null;
  const children = state.units.filter(u => u.parentId === id);
  const n = state.employees.filter(e => e.unitId === id && e.status !== 'Đã nghỉ việc').length;
  return <div className="tree-node" style={{ marginTop: 8 }}><b>{unit.name}</b> <span className="muted">{n} người</span>{children.map(c => <div key={c.id} className="tree-children"><OrgNode id={c.id} /></div>)}</div>;
}

export function LoginMethodPage() {
  const [picked, setPicked] = useState<string[]>(['Số điện thoại']);
  const toast = useToast();
  const cards = [['Số điện thoại', 'Đăng nhập bằng số điện thoại và mật khẩu'], ['Google', 'Đăng nhập bằng tài khoản Google'], ['Apple', 'Đăng nhập bằng Apple ID'], ['Microsoft', 'Đăng nhập bằng Microsoft']];
  return <div className="card pad-card"><div className="feature-grid">{cards.map(([title, body]) => <button key={title} className={'feature' + (picked.includes(title) ? ' on' : '')} onClick={() => setPicked(cur => cur.includes(title) ? cur.filter(x => x !== title) : [...cur, title])}><b>{title}</b><small>{body}</small></button>)}</div><button className="btn-primary" onClick={() => toast('Đã lưu hình thức đăng nhập')}>Lưu</button></div>;
}

export function AuditPage() {
  const rows = [
    { id: 'log-1', at: new Date().toISOString(), who: 'Dương Văn Hiệu', module: 'Nhân sự', kind: 'Hồ sơ', event: 'Xem danh sách', target: 'Nhân viên' },
  ];
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost">Bộ lọc</button><button className="btn-ghost">Xuất dữ liệu</button></div>
    <DataTable rows={rows} columns={[{ id: 'at', header: 'Thời gian', cell: r => r.at.replace('T', ' ').slice(0, 16) }, { id: 'who', header: 'Người thực hiện', cell: r => r.who }, { id: 'mod', header: 'Module', cell: r => r.module }, { id: 'kind', header: 'Loại đối tượng', cell: r => r.kind }, { id: 'ev', header: 'Sự kiện', cell: r => r.event }, { id: 'tg', header: 'Đối tượng', cell: r => r.target }]} />
    <p className="hint">Khảo sát không có dòng log thật. Bảng chỉ có một dòng minh họa cấu trúc cột.</p></div>;
}

export function PlanPage() {
  const { state } = useLabels();
  const used = state.employees.filter(e => e.status !== 'Đã nghỉ việc').length;
  return <div className="card pad-card"><button className="btn-primary">Nâng cấp gói</button><h2>Happy Starter <span className="pill ok">ĐANG HOẠT ĐỘNG</span></h2><p>Bắt đầu 01/01/2026 · Kết thúc 31/12/2026 · chu kỳ Hàng năm</p><p>Số lượng người dùng {used} / 30</p><div style={{ height: 8, background: 'var(--bg)', borderRadius: 8 }}><div style={{ width: `${Math.min(100, used / 30 * 100)}%`, height: '100%', background: 'var(--blue-600)' }} /></div><p>Đang dùng {used} · Còn trống {Math.max(0, 30 - used)} · Tài khoản super admin 1</p><h3>Lịch sử gói dịch vụ</h3><table className="tbl"><thead><tr><th>GÓI</th><th>BẮT ĐẦU</th><th>KẾT THÚC</th><th>TRẠNG THÁI</th></tr></thead><tbody><tr><td>Happy Starter</td><td>{fmtDate('2026-01-01')}</td><td>{fmtDate('2026-12-31')}</td><td><span className="pill ok">Đang dùng</span></td></tr></tbody></table></div>;
}

export function OpenApiPage() {
  const [rows, setRows] = useState([{ id: 'cl-1', name: 'Tích hợp demo', clientId: 'hrm_demo_0001', status: 'Hoạt động', last: '—', created: '2026-01-15' }]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return <div className="card panel"><div className="toolbar"><button className="btn-primary" onClick={() => setOpen(true)}>Tạo client mới</button></div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Tên client', cell: r => r.name }, { id: 'id', header: 'Client ID', cell: r => r.clientId }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'last', header: 'Lần dùng gần nhất', cell: r => r.last }, { id: 'c', header: 'Ngày tạo', cell: r => fmtDate(r.created) }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => setRows(cur => cur.filter(x => x.id !== r.id))}>Thu hồi</button> }]} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); setRows(cur => [...cur, { id: 'cl-' + Date.now(), name, clientId: 'hrm_' + Date.now(), status: 'Hoạt động', last: '—', created: new Date().toISOString().slice(0, 10) }]); setOpen(false); }}><header><b>Tạo client</b></header><div className="body"><Field label="Tên client"><TextInput value={name} onChange={ev => setName(ev.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy bỏ</button><button className="btn-primary">Xác nhận</button></div></form></div>}
  </div>;
}

export function Unsurveyed({ title }: { title: string }) {
  return <div className="card empty"><b>{title}</b><small>Trang này có trong menu khảo sát nhưng không được mô tả trường hay cột. Chưa dựng form để tránh suy đoán.</small></div>;
}
