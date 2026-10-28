import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Donut } from '../../components/Charts';
import { DataTable, type Column } from '../../components/DataTable';
import { Drawer, FilterPanel } from '../../components/Drawer';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { useToast } from '../../components/feedback';
import { downloadText } from '../../data/csv';
import { LIST_TYPES, PAYROLL_TYPES, TAX_ROWS_V1, TAX_ROWS_V2, componentFrom } from '../../data/payroll/catalog';
import { periodRange } from '../../data/payroll/engine';
import { payrollStore, usePayroll } from '../../data/payroll/store';
import type { FormulaKind, PayrollComponent, PayrollDoc, PayrollType, ValueFormat } from '../../data/payroll/types';
import { USER } from '../../data/session';
import { fmtMoney, includesPlain, todayISO } from '../../data/text';
import { useHr } from '../../hooks/useHr';
import { useLabels } from '../hr/lookups';

let gatePassed = false;

export function PayrollGate({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(!gatePassed);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (!open) return <>{children}</>;
  return (
    <div className="modal-back">
      <form className="modal" role="dialog" aria-label="Bảo mật thông tin" onSubmit={e => { e.preventDefault(); if (!password.trim()) { setError('Nhập mật khẩu.'); return; } gatePassed = true; setPassword(''); setOpen(false); }}>
        <header><b>Bảo mật thông tin</b></header>
        <div className="body">
          <p>Nhập mật khẩu của bạn để tiếp tục</p>
          <Field label="Mật khẩu" required error={error}><TextInput type="password" placeholder="Nhập mật khẩu" value={password} onChange={ev => { setPassword(ev.target.value); setError(''); }} /></Field>
          <p className="muted">Mật khẩu không được lưu. Ô khác rỗng là đủ để vào.</p>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => nav('/select-apps')}>QUAY LẠI</button><button className="btn-primary">TIẾP TỤC</button></div>
      </form>
    </div>
  );
}

const PAGE_TYPE: Record<string, PayrollType> = {
  'bang-luong-chinh': 'Bảng lương chính',
  'bang-san-pham': 'Bảng sản phẩm',
  'bang-kpi': 'Bảng lương KPI',
  'khen-thuong-ky-luat': 'Bảng khen thưởng - kỷ luật',
  'dieu-chinh-thu-nhap': 'Bảng điều chỉnh thu nhập',
  'bang-luong-tam-ung': 'Bảng lương tạm ứng',
  'bang-luong-khac': 'Bảng lương khác',
};

export function PayrollOverview() {
  const nav = useNavigate();
  const blocks = [
    ['Cài đặt template', 'Admin', ['Dữ liệu chấm công', 'Chỉ số tính lương', 'Mẫu bảng lương', 'Thông tin thu nhập'], '/m/tinh-luong/mau-bang-luong'],
    ['Phân hệ chấm công', 'Admin', ['Bảng công mặc định', 'Tùy chỉnh', 'Tổng hợp'], '/m/cham-cong/bang-cong'],
    ['Bảng lương', 'Admin', ['Bảng lương chính', 'Bảng sản phẩm', 'Bảng KPI', 'Khen thưởng - kỷ luật', 'Điều chỉnh thu nhập', 'Tạm ứng', 'Bảng lương khác'], '/m/tinh-luong/bang-luong-chinh'],
    ['Phản hồi bảng lương', 'Nhân viên', ['Xem và xác nhận', 'Gửi phản hồi / khiếu nại'], '/m/tinh-luong/bang-luong-chinh'],
    ['Chi phí lương và hạch toán', 'Admin', ['Chi phí theo TTCP', 'Hạch toán', 'Phân bổ theo bộ phận'], '/m/tinh-luong/chi-phi-luong'],
    ['Báo cáo lương', 'Admin', ['Bảng lương tổng hợp', 'Chi phí theo bộ phận', 'Thu nhập nhân sự', 'Xuất kế toán'], '/m/tinh-luong/bao-cao-luong'],
  ] as const;
  return <div className="feature-grid">{blocks.map(([title, role, items, to]) => <article key={title} className="card"><span className="pill">{role}</span><h3>{title}</h3><p>{items.join('; ')}</p><button className="btn-primary" onClick={() => nav(to)}>Xem</button></article>)}</div>;
}

export function PayrollList({ type }: { type: PayrollType }) {
  const data = usePayroll();
  const labels = useLabels();
  const nav = useNavigate();
  const pageId = Object.entries(PAGE_TYPE).find(([, value]) => value === type)?.[0] || 'bang-luong-chinh';
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(false);
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState('');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const rows = data.payrolls.filter(row => row.type === type && includesPlain(row.name, q) && (!status || row.status === status) && (!period || row.period === period) && (!unitId || !row.unitIds.length || row.unitIds.includes(unitId)) && (!positionId || !row.positionIds.length || row.positionIds.includes(positionId)) && (!employeeId || !row.employeeIds.length || row.employeeIds.includes(employeeId) || row.lines.some(line => line.employeeId === employeeId)));
  const scope = (row: PayrollDoc) => [row.unitIds.map(id => labels.unit(id)), row.positionIds.map(id => labels.position(id)), row.employeeIds.map(id => labels.employee(id)?.fullName)].flat().filter(Boolean).join(', ') || 'Toàn công ty';
  return <div className="card panel">
    <div className="toolbar">
      <div className="in-search">🔍<input aria-label="Tìm bảng lương" placeholder="Nhập tên bảng lương" value={q} onChange={e => setQ(e.target.value)} /></div>
      <button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>
      <button className="btn-primary" onClick={() => nav(`/m/tinh-luong/${pageId}/tao`)}>Thêm mới</button>
    </div>
    <DataTable rows={rows} columns={[
      { id: 'c', header: '', cell: () => <input type="checkbox" aria-label="Chọn" /> },
      { id: 'name', header: 'Tên bảng lương', sort: r => r.name, cell: r => <button className="link" onClick={() => nav(`/m/tinh-luong/${pageId}/${r.id}`)}>{r.name}</button> },
      { id: 'period', header: 'Kỳ lương', sort: r => r.period, cell: r => r.period },
      { id: 'time', header: 'Thời gian tính công', cell: r => r.rangeLabel },
      { id: 'scope', header: 'Đối tượng áp dụng', cell: scope },
      { id: 'st', header: 'Trạng thái', cell: r => r.status },
      { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => nav(`/m/tinh-luong/${pageId}/${r.id}`)}>Xem</button> },
    ] as Column<PayrollDoc>[]} filterKey={q + status + period + type} empty="Không có dữ liệu" />
    {filter && <FilterPanel title="Bộ lọc" onClose={() => setFilter(false)} onClear={() => { setStatus(''); setPeriod(''); setUnitId(''); setPositionId(''); setEmployeeId(''); }}>
      <Field label="Trạng thái"><Select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option>Nháp</option><option>Đã khóa</option><option>Đã gửi phiếu</option></Select></Field>
      <Field label="Kỳ lương"><TextInput type="month" value={period} onChange={e => setPeriod(e.target.value)} /></Field>
      <Field label="Đơn vị áp dụng"><Select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả</option>{labels.state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
      <Field label="Vị trí áp dụng"><Select value={positionId} onChange={e => setPositionId(e.target.value)}><option value="">Tất cả</option>{labels.state.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      <Field label="Nhân viên áp dụng"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Tất cả</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
    </FilterPanel>}
  </div>;
}

export function CreatePayroll() {
  const { pageId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const data = usePayroll();
  const hr = useHr();
  const type = PAGE_TYPE[pageId || ''] || 'Bảng lương chính';
  const period0 = todayISO().slice(0, 7);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PayrollType>(type);
  const [period, setPeriod] = useState(period0);
  const [timeMode, setTimeMode] = useState<'month' | 'custom'>('month');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [feedbackTo, setFeedbackTo] = useState(USER.name);
  const [days, setDays] = useState(3);
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [pickTpl, setPickTpl] = useState(false);
  const [tpl, setTpl] = useState(data.templates[0]?.id || '');
  const [picker, setPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [q, setQ] = useState('');
  const range = periodRange(period);
  const feedbackDate = new Date();
  feedbackDate.setDate(feedbackDate.getDate() + Number(days || 0));
  function save() {
    if (name.trim().length < 2) { toast('Nhập tên bảng lương.'); return; }
    const id = payrollStore.savePayroll({ name: name.trim(), type: kind, period, timeMode, rangeLabel: range.label, unitIds: unitId ? [unitId] : [], positionIds: positionId ? [positionId] : [], employeeIds: employeeId ? [employeeId] : [], feedbackTo: feedbackTo.split(',').map(s => s.trim()).filter(Boolean), feedbackDays: Number(days) || 0, components, linkedId: '' });
    toast('Đã lưu bảng lương');
    nav(`/m/tinh-luong/${pageId}/${id}`);
  }
  const shown = components.filter(item => includesPlain(item.name + item.code, q));
  return <div className="card pad-card">
    <div className="toolbar"><button className="btn-ghost" onClick={() => nav(-1)}>Quay lại</button><div className="grow" /><button className="btn-ghost" onClick={() => nav(-1)}>Hủy bỏ</button><button className="btn-primary" onClick={save}>Lưu</button></div>
    <h3>Thông tin chung</h3>
    <button className="btn-ghost" onClick={() => setPickTpl(true)}>Sử dụng mẫu</button>
    <div className="form-grid">
      <Field label="Tên bảng lương" required><TextInput placeholder="Nhập tên bảng lương" value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Loại bảng lương" required><Select value={kind} onChange={e => setKind(e.target.value as PayrollType)}>{PAYROLL_TYPES.map(item => <option key={item}>{item}</option>)}</Select></Field>
      <Field label="Kỳ lương" required><TextInput type="month" value={period} onChange={e => setPeriod(e.target.value)} /></Field>
      <div><p>Thời gian tính công *</p><label className="chk"><input type="radio" checked={timeMode === 'month'} onChange={() => setTimeMode('month')} /> Theo tháng công</label><label className="chk"><input type="radio" checked={timeMode === 'custom'} onChange={() => setTimeMode('custom')} /> Tùy chỉnh</label><p>{range.label}</p></div>
    </div>
    <h3>Đối tượng áp dụng</h3>
    <p><a href="#/m/nhan-su/thong-tin-nhan-su">Xem danh sách nhân viên</a></p>
    <div className="form-grid">
      <Field label="Đơn vị áp dụng"><Select value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Lựa chọn</option>{hr.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
      <Field label="Vị trí áp dụng"><Select value={positionId} onChange={e => setPositionId(e.target.value)}><option value="">Lựa chọn</option>{hr.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      <Field label="Nhân viên áp dụng"><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Lựa chọn</option>{hr.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
    </div>
    <h3>Liên kết với bảng lương phụ</h3>
    <p>{data.payrolls.some(row => row.type !== kind) ? <Select aria-label="Bảng lương phụ"><option value="">Chọn bảng lương phụ</option>{data.payrolls.filter(row => row.type !== kind).map(row => <option key={row.id}>{row.name}</option>)}</Select> : 'Chưa có bảng lương phụ nào để liên kết'}</p>
    <h3>Phản hồi bảng lương</h3>
    <div className="form-grid">
      <Field label="Người nhận phản hồi phiếu lương"><TextInput value={feedbackTo} onChange={e => setFeedbackTo(e.target.value)} /></Field>
      <Field label="Thời hạn nhận phản hồi phiếu lương"><span>Sau <input className="control" style={{ width: 80 }} type="number" value={days} onChange={e => setDays(Number(e.target.value))} /> Ngày → {feedbackDate.toLocaleDateString('vi-VN')}</span></Field>
    </div>
    <h3>Thành phần lương</h3>
    <div className="toolbar"><input className="control" placeholder="Tìm kiếm" value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm thành phần" /><button className="btn-ghost" onClick={() => toast('Import thành phần: mẫu cột chưa có trong ghi chú.')}>Import</button><button className="btn-ghost">Export</button><button className="btn-ghost">Xuất Excel</button><button className="btn-primary" onClick={() => setPicker(true)}>Thêm mới thành phần</button></div>
    {!shown.length ? <div className="empty"><b>Chưa có thành phần nào</b><small>Thêm thành phần đầu tiên để bắt đầu</small></div> : <table className="tbl"><thead><tr><th>Tên thành phần</th><th>Mã thành phần</th><th>Giá trị</th><th>Định dạng</th><th>Loại công thức</th><th>Công thức</th><th>Hiển thị PL</th><th>Tác vụ</th></tr></thead><tbody>{shown.map(item => <tr key={item.code}><td>{item.name}</td><td>{item.code}</td><td>{item.value || '—'}</td><td>{item.format}</td><td>{item.kind}</td><td>{item.formula || '—'}</td><td><input type="checkbox" checked={item.showOnSlip} onChange={e => setComponents(cur => cur.map(row => row.code === item.code ? { ...row, showOnSlip: e.target.checked } : row))} aria-label={'Hiện ' + item.code} /></td><td><button className="btn-ghost btn-sm" onClick={() => setComponents(cur => cur.filter(row => row.code !== item.code))}>Xóa</button></td></tr>)}</tbody></table>}
    <h3>Mẫu export</h3>
    <p>Tùy biến cột và thứ tự khi xuất file</p>
    <button className="btn-ghost" onClick={() => setExportOpen(true)}>Tạo mẫu export</button>
    {!data.exports.length && <p>Chưa có mẫu export. Tạo mẫu để xuất theo nhu cầu kế toán, ngân hàng, BHXH…</p>}
    {data.exports.map(item => <p key={item.id}>{item.name}</p>)}
    {pickTpl && <div className="modal-back" onMouseDown={() => setPickTpl(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}><header><b>Mẫu bảng lương</b></header><div className="body"><Field label="Chọn mẫu bảng lương"><Select value={tpl} onChange={e => setTpl(e.target.value)}>{data.templates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field></div><div className="form-actions"><button className="btn-ghost" onClick={() => setPickTpl(false)}>Hủy bỏ</button><button className="btn-primary" onClick={() => { const found = data.templates.find(item => item.id === tpl); if (found) { setComponents(found.components); setKind(found.type); toast('Đã áp dụng mẫu'); } setPickTpl(false); }}>Chọn</button></div></div></div>}
    {picker && <IndicatorDrawer indicators={data.indicators} onClose={() => setPicker(false)} onAdd={code => { const found = data.indicators.find(item => item.code === code); if (!found || components.some(item => item.code === code)) return; setComponents(cur => [...cur, componentFrom(found)]); }} onCreate={() => setAdding(true)} />}
    {adding && <ComponentModal onClose={() => setAdding(false)} onSave={row => { payrollStore.saveIndicator({ ...row, description: row.description }); setComponents(cur => [...cur.filter(item => item.code !== row.code), { code: row.code, name: row.name, value: row.defaultValue, format: row.format, kind: row.kind, formula: row.formula, showOnSlip: true }]); if (!row.again) setAdding(false); }} />}
    {exportOpen && <ExportModal codes={components.map(item => item.code)} onClose={() => setExportOpen(false)} />}
  </div>;
}

function IndicatorDrawer({ indicators, onClose, onAdd, onCreate }: { indicators: { code: string; name: string }[]; onClose: () => void; onAdd: (code: string) => void; onCreate: () => void }) {
  const [q, setQ] = useState('');
  const rows = indicators.filter(item => includesPlain(item.code + ' ' + item.name, q));
  return <Drawer title="Chọn thành phần" onClose={onClose} wide><p>Chọn một chỉ số để thêm ngay vào danh sách thành phần lương</p><input className="control" placeholder="Tìm chỉ số" value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm chỉ số" /><button className="btn-primary" onClick={onCreate}>+ Thêm mới thành phần</button><p className="muted">{indicators.length} chỉ số</p><div style={{ maxHeight: 420, overflow: 'auto' }}>{rows.map(item => <div key={item.code} className="row-actions"><span><b>{item.code}</b> {item.name}</span><button className="btn-ghost btn-sm" onClick={() => onAdd(item.code)}>+</button></div>)}</div></Drawer>;
}

function ComponentModal({ onClose, onSave }: { onClose: () => void; onSave: (row: { code: string; name: string; format: ValueFormat; defaultValue: string; kind: FormulaKind; formula: string; description: string; again: boolean }) => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<ValueFormat>('Văn bản');
  const [value, setValue] = useState('');
  const [kind, setKind] = useState<FormulaKind>('Nhập tay');
  const [formula, setFormula] = useState('');
  const [description, setDescription] = useState('');
  const [again, setAgain] = useState(false);
  return <div className="modal-back" onMouseDown={onClose}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onSave({ code: code.trim(), name: name.trim(), format, defaultValue: value, kind, formula: kind === 'Nhập tay' ? '' : formula, description, again }); }}><header><b>Thêm mới thành phần</b></header><div className="body form-grid">
    <Field label="Tên thành phần" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label="Mã thành phần" required><TextInput value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></Field>
    <Field label="Định dạng" required><Select value={format} onChange={e => setFormat(e.target.value as ValueFormat)}><option>Văn bản</option><option>Số</option><option>Tiền tệ (VND)</option><option>Ngày</option></Select></Field>
    <p className="muted span2">Các lựa chọn ngoài Văn bản không hiện trong bản khảo sát. Số, Tiền tệ (VND) và Ngày là giả định, ghi ở câu hỏi còn mở.</p>
    <Field label="Giá trị mặc định" required><TextInput value={value} onChange={e => setValue(e.target.value)} /></Field>
    <Field label="Loại công thức"><Select value={kind} onChange={e => setKind(e.target.value as FormulaKind)}><option>Nhập tay</option><option>Công thức Excel</option><option>Ngôn ngữ Happy Time</option><option>Ngôn ngữ Expression</option></Select></Field>
    <Field label="Công thức" className="span2"><TextArea value={formula} disabled={kind === 'Nhập tay'} onChange={e => setFormula(e.target.value)} /></Field>
    <Field label="Mô tả" className="span2"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field>
    <label className="chk"><input type="checkbox" checked={again} onChange={e => setAgain(e.target.checked)} /> Tạo liên tiếp</label>
  </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary">Lưu</button></div></form></div>;
}

function ExportModal({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [group, setGroup] = useState('Nhóm 1');
  return <div className="modal-back" onMouseDown={onClose}><form className="modal wide" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); payrollStore.saveExport({ name, groups: [{ name: group, codes: picked }] }); onClose(); }}><header><b>Tạo mẫu export</b></header><div className="body"><Field label="Tên mẫu export" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><p>Chỉ số khả dụng ({codes.length} chỉ số)</p>{codes.map(code => <label key={code} className="chk"><input type="checkbox" checked={picked.includes(code)} onChange={e => setPicked(cur => e.target.checked ? [...cur, code] : cur.filter(item => item !== code))} />{code}</label>)}<p>Đã chọn — kéo để sắp xếp / chuyển nhóm ({picked.length})</p><Field label="Nhóm"><TextInput value={group} onChange={e => setGroup(e.target.value)} /></Field><button type="button" className="btn-ghost" onClick={() => setGroup('Nhóm ' + (group.length + 1))}>+ Thêm nhóm</button></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button type="button" className="btn-ghost" onClick={() => alert(picked.join(', ') || 'Chưa chọn cột')}>Xem trước</button><button className="btn-primary">Lưu mẫu export</button></div></form></div>;
}

export function PayrollDetail() {
  const { recordId, pageId } = useParams();
  const data = usePayroll();
  const labels = useLabels();
  const toast = useToast();
  const doc = data.payrolls.find(item => item.id === recordId);
  const [slip, setSlip] = useState<string | null>(null);
  if (!doc) return <div className="card empty"><b>Không có dữ liệu</b></div>;
  const columns = doc.components.filter(item => item.showOnSlip || ['THUC_NHAN', 'TONG_THU_NHAP', 'LUONG_CO_BAN_THANG', 'FULL_NAME'].includes(item.code));
  const money = (code: string, value: string | number) => {
    const format = doc.components.find(item => item.code === code)?.format;
    if (format === 'Văn bản' || format === 'Ngày' || typeof value === 'string' && Number.isNaN(Number(value))) return String(value ?? '');
    return format === 'Số' ? String(value) : fmtMoney(Number(value) || 0);
  };
  function csv() {
    const head = ['Nhân viên', ...doc!.components.map(item => item.name)];
    const body = doc!.lines.map(line => [labels.employee(line.employeeId)?.fullName || line.employeeId, ...doc!.components.map(item => line.values[item.code] ?? '')]);
    downloadText((doc!.name || 'bang-luong') + '.csv', [head, ...body].map(row => row.join(',')).join('\n'));
  }
  const person = doc.lines.find(line => line.employeeId === slip);
  return <div>
    <div className="banner">Màn chi tiết, phiếu lương và các nút Tính lại / Khóa / Gửi phiếu / Xuất excel không xuất hiện trong bản khảo sát vì bảng lương trống. Bố cục này chỉ để xem kết quả đã tính.</div>
    <div className="toolbar">
      <button className="btn-ghost" disabled={doc.status === 'Đã khóa'} onClick={() => { payrollStore.recalc(doc.id); toast('Đã tính lại'); }}>Tính lại</button>
      <button className="btn-ghost" onClick={() => { payrollStore.setStatus(doc.id, 'Đã khóa'); toast('Đã khóa bảng lương'); }}>Khóa</button>
      <button className="btn-primary" onClick={() => { payrollStore.setStatus(doc.id, 'Đã gửi phiếu'); toast('Đã gửi phiếu lương'); }}>Gửi phiếu lương</button>
      <button className="btn-ghost" onClick={csv}>Xuất excel</button>
      <span className="pill">{doc.status}</span>
    </div>
    <p>{doc.name} · {doc.period} · {doc.rangeLabel} · {doc.lines.length} nhân viên</p>
    <div className="table-wrap"><table className="tbl"><thead><tr><th>Nhân viên</th>{columns.map(col => <th key={col.code}>{col.name}</th>)}</tr></thead><tbody>
      {doc.lines.map(line => <tr key={line.employeeId}><td><button className="link" onClick={() => setSlip(line.employeeId)}>{labels.employee(line.employeeId)?.fullName}</button></td>{columns.map(col => <td key={col.code}>{money(col.code, line.values[col.code] ?? '')}</td>)}</tr>)}
      <tr><td><b>Tổng</b></td>{columns.map(col => <td key={col.code}>{col.format === 'Tiền tệ (VND)' || col.format === 'Số' ? money(col.code, doc.lines.reduce((sum, line) => sum + (Number(line.values[col.code]) || 0), 0)) : ''}</td>)}</tr>
    </tbody></table></div>
    {person && <Drawer title="Phiếu lương" onClose={() => setSlip(null)}><h3>{labels.employee(person.employeeId)?.fullName}</h3><p>{doc.name} · {doc.period}</p>{doc.components.filter(item => item.showOnSlip).map(item => <p key={item.code}><span className="muted">{item.name}</span><br /><b>{money(item.code, person.values[item.code] ?? '')}</b></p>)}<p className="muted">Mẫu phiếu và luồng nhân viên xác nhận / khiếu nại không có trong ghi chú.</p></Drawer>}
    <p className="muted">Quay lại danh sách <button className="link" onClick={() => location.hash = `#/m/tinh-luong/${pageId}`}>danh sách</button></p>
  </div>;
}

export function listPage(type: PayrollType) {
  return function Bound() { return <PayrollList type={type} />; };
}

export function CostPage() {
  const data = usePayroll();
  const labels = useLabels();
  const [q, setQ] = useState('');
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const rows = data.entries.filter(item => item.period === month && includesPlain(item.costCenter + (labels.employee(item.employeeId)?.fullName || ''), q));
  const sum = (source?: string) => rows.filter(item => !source || item.source === source).reduce((s, item) => s + item.amount, 0);
  return <div>
    <div className="kpis"><div className="kpi"><small>TỔNG CHI PHÍ</small><b>{fmtMoney(sum())}</b></div><div className="kpi"><small>TỪ BẢNG LƯƠNG</small><b>{fmtMoney(sum('Bảng lương'))}</b></div><div className="kpi"><small>NHẬP TAY + IMPORT</small><b>{fmtMoney(sum('Nhập tay') + sum('Import'))}</b></div><div className="kpi"><small>SỐ ENTRIES / CC</small><b>{rows.length}</b></div></div>
    <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm cost center, tên nhân viên, m…" value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm chi phí" /><TextInput type="month" aria-label="Tháng" value={month} onChange={e => setMonth(e.target.value)} /><button className="btn-ghost">Bộ lọc</button><button className="icon-btn" aria-label="Import Excel" title="Import Excel">⤓</button><button className="icon-btn" aria-label="Xuất Excel" title="Xuất Excel">↥</button><button className="icon-btn" aria-label="Export tổng hợp hoạch toán" title="Export tổng hợp hoạch toán">☰</button><button className="btn-primary" onClick={() => alert('Form Thêm chi phí không có trong ghi chú khảo sát.')}>+ Thêm chi phí</button></div>
      <DataTable rows={rows} columns={[{ id: 'c', header: '', cell: () => <input type="checkbox" aria-label="Chọn" /> }, { id: 'cc', header: 'Cost center', cell: r => r.costCenter }, { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName || '' }, { id: 'cat', header: 'Hạng mục', cell: r => r.category }, { id: 'g', header: 'Nhóm', cell: r => r.group }, { id: 'a', header: 'Số tiền', cell: r => fmtMoney(r.amount) }, { id: 's', header: 'Nguồn', cell: r => r.source }, { id: 'p', header: 'Bảng lương', cell: r => r.payrollName }, { id: 'n', header: 'Ghi chú', cell: r => r.note || '—' }]} empty="Không có dữ liệu" />
    </div>
  </div>;
}

export function AccountingPage() {
  const data = usePayroll();
  const periods = [...new Set(data.entries.map(item => item.period))];
  const centers = [...new Set(data.entries.map(item => item.costCenter))];
  const sum = (source?: CostSource) => data.entries.filter(item => !source || item.source === source).reduce((s, item) => s + item.amount, 0);
  return <div>
    <div className="toolbar"><Select aria-label="Nhóm hạng mục"><option>Chọn nhóm hạng mục</option>{[...new Set(data.entries.map(item => item.group))].map(g => <option key={g}>{g}</option>)}</Select><Select aria-label="Cost center"><option>Chọn cost center</option>{centers.map(c => <option key={c}>{c}</option>)}</Select><button className="btn-ghost">Xuất Excel</button></div>
    <div className="kpis"><div className="kpi"><small>Tổng chi phí kỳ</small><b>{fmtMoney(sum())}</b></div><div className="kpi"><small>Từ bảng lương</small><b>{fmtMoney(sum('Bảng lương'))}</b></div><div className="kpi"><small>Nhập tay</small><b>{fmtMoney(sum('Nhập tay'))}</b></div><div className="kpi"><small>Import Excel</small><b>{fmtMoney(sum('Import'))}</b></div></div>
    <table className="tbl"><thead><tr><th>Cost center</th>{(periods.length ? periods : [todayISO().slice(0, 7)]).map(p => <th key={p}>{p}</th>)}</tr></thead><tbody>{centers.length ? centers.map(center => <tr key={center}><td>{center}</td>{(periods.length ? periods : [todayISO().slice(0, 7)]).map(p => <td key={p}>{fmtMoney(data.entries.filter(item => item.costCenter === center && item.period === p).reduce((s, item) => s + item.amount, 0))}</td>)}</tr>) : <tr><td colSpan={2}>Không có dữ liệu</td></tr>}</tbody></table>
  </div>;
}
type CostSource = 'Bảng lương' | 'Nhập tay' | 'Import';

export function IncomeInfoPage() {
  const labels = useLabels();
  const [q, setQ] = useState('');
  const rows = labels.state.contracts.filter(item => includesPlain((labels.employee(item.employeeId)?.fullName || '') + item.code, q)).map(item => ({ ...item }));
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tên hoặc mã nhân viên" aria-label="Tìm thu nhập" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-ghost">Bộ lọc</button><button className="btn-ghost">Export</button><button className="btn-ghost">Import</button><button className="btn-primary" onClick={() => alert('Form thêm thông tin thu nhập không có trong ghi chú. Số liệu đang lấy từ hợp đồng nhân sự.')}>Thêm mới</button></div>
    <DataTable rows={rows} columns={[{ id: 'c', header: '', cell: () => <input type="checkbox" aria-label="Chọn" /> }, { id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName || '' }, { id: 'unit', header: 'Đơn vị', cell: r => labels.unit(labels.employee(r.employeeId)?.unitId || '') }, { id: 'from', header: 'Thời gian có hiệu lực', cell: r => r.startDate }, { id: 'to', header: 'Thời gian kết thúc hiệu lực', cell: r => r.endDate || '—' }, { id: 'info', header: 'Thông tin thu nhập', cell: r => 'Lương cơ bản ' + fmtMoney(r.salary) }, { id: 'act', header: 'Tác vụ', cell: () => '—' }]} filterKey={q} />
  </div>;
}

export function TaxTablePage() {
  return <table className="tbl"><thead><tr><th>BẬC THUẾ</th><th>THU NHẬP TÍNH THUẾ/NĂM (TRIỆU ĐỒNG)</th><th>THU NHẬP TÍNH THUẾ/THÁNG (TRIỆU ĐỒNG)</th><th>THUẾ SUẤT (%)</th></tr></thead><tbody>{TAX_ROWS_V2.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table>;
}

export function SalaryReport() {
  const data = usePayroll();
  const lines = data.payrolls.flatMap(item => item.lines);
  const total = (code: string) => lines.reduce((sum, line) => sum + (Number(line.values[code]) || 0), 0);
  const cards = [['TỔNG QUỸ LƯƠNG', total('TONG_THU_NHAP')], ['BHXH công ty đóng', total('BHXH_DN') + total('BHYT_DN') + total('BHTN_DN')], ['BHXH người lao động đóng', total('BHXH_NLD') + total('BHYT_NLD') + total('BHTN_NLD')], ['Công đoàn', total('CONG_DOAN_DN') + total('CONG_DOAN_NLD')], ['Thuế', total('KHAU_TRU_THUE')], ['Thực nhận', total('THUC_NHAN')], ['Tiền từ thiện', total('TIEN_TU_THIEN')], ['Tổng thu nhập', total('TONG_THU_NHAP')]] as const;
  const byCenter = new Map<string, number>();
  data.entries.forEach(item => byCenter.set(item.costCenter, (byCenter.get(item.costCenter) || 0) + item.amount));
  return <div>
    <div className="toolbar"><button className="btn-ghost">Bộ lọc</button></div>
    <div className="kpis">{cards.map(([label, value]) => <div key={label} className="kpi"><small>{label}</small><b>{(value / 1_000_000).toFixed(1)}tr đ</b></div>)}</div>
    {!lines.length ? <div className="card empty"><b>Không có dữ liệu nào</b></div> : <div className="report-grid">
      <section className="card"><h3>Cơ cấu chi phí (triệu đ)</h3><Donut items={cards.slice(1, 6).map(([label, value]) => ({ label, value: Math.round(value / 1_000_000) }))} /></section>
      <section className="card"><h3>Nguồn dữ liệu (triệu đ)</h3><BarChart items={[{ label: 'Bảng lương', value: Math.round(data.entries.filter(i => i.source === 'Bảng lương').reduce((s, i) => s + i.amount, 0) / 1_000_000) }, { label: 'Nhập tay', value: 0 }, { label: 'Import', value: 0 }]} /></section>
      <section className="card"><h3>Chi tiết theo Cost Center</h3><table className="tbl"><thead><tr><th>COST CENTER</th><th>KỲ NÀY</th><th>KỲ TRƯỚC</th><th>Δ%</th></tr></thead><tbody>{[...byCenter.entries()].map(([name, value]) => <tr key={name}><td>{name}</td><td>{fmtMoney(value)}</td><td>—</td><td>—</td></tr>)}{!byCenter.size && <tr><td colSpan={4}>Không có dữ liệu nào</td></tr>}</tbody></table></section>
      <section className="card"><h3>Top hạng mục chi phí</h3><table className="tbl"><thead><tr><th>HẠNG MỤC</th><th>SỐ TIỀN</th><th>% TỔNG</th></tr></thead><tbody><tr><td>THUC_NHAN</td><td>{fmtMoney(total('THUC_NHAN'))}</td><td>100%</td></tr></tbody></table></section>
    </div>}
  </div>;
}

export { LIST_TYPES };
