import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { useToast } from '../../components/feedback';
import { COST_CATEGORIES, PAYROLL_TYPES, TAX_ROWS_V1, mainTemplateComponents } from '../../data/payroll/catalog';
import { payrollStore, usePayroll } from '../../data/payroll/store';
import type { FormulaKind, PayrollType, ValueFormat } from '../../data/payroll/types';
import { includesPlain } from '../../data/text';

export function V1Banner() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return <div className="banner">Thông báo chuyển đổi Module Lương: Module Lương V1 sẽ ngừng hỗ trợ và được thay thế bằng V2. Hạn cuối chuyển đổi: 31/10/2026
    <div className="row-actions"><button className="btn-primary" onClick={() => nav('/m/tinh-luong/overview')}>Dùng thử</button><button className="btn-ghost" onClick={() => setOpen(v => !v)}>Xem chi tiết</button></div>
    {open && <p>V2 gồm bảng lương chính, sản phẩm, KPI, khen thưởng, điều chỉnh, tạm ứng, bảng khác, chi phí và hạch toán.</p>}
  </div>;
}

export function TemplateList() {
  const data = usePayroll();
  const nav = useNavigate();
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost">Bộ lọc</button><button className="btn-primary" onClick={() => nav('/m/tinh-luong/mau-bang-luong/tao')}>Thêm mới</button></div>
    <DataTable rows={data.templates} columns={[{ id: 'name', header: 'Tên mẫu bảng lương', cell: r => r.name }, { id: 'code', header: 'Mã mẫu', cell: r => r.code }, { id: 'type', header: 'Loại bảng lương', cell: r => r.type }, { id: 'unit', header: 'Đơn vị áp dụng', cell: r => r.unitIds.join(', ') || 'Tất cả' }, { id: 'pos', header: 'Vị trí áp dụng', cell: r => r.positionIds.join(', ') || 'Tất cả' }, { id: 'emp', header: 'Nhân viên áp dụng', cell: r => r.employeeIds.join(', ') || 'Tất cả' }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => nav('/m/tinh-luong/mau-bang-luong/' + r.id)}>Sửa</button> }]} />
  </div>;
}

export function TemplateEdit() {
  const data = usePayroll();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<PayrollType>('Bảng lương chính');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState(mainTemplateComponents(data.indicators));
  return <form className="card pad-card" onSubmit={e => { e.preventDefault(); payrollStore.saveTemplate({ name, code, type, description, unitIds: [], positionIds: [], employeeIds: [], components }); toast('Đã lưu mẫu'); nav('/m/tinh-luong/mau-bang-luong'); }}>
    <h3>Thông tin chung</h3>
    <div className="form-grid">
      <Field label="Tên mẫu bảng lương"><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Phân loại"><Select value={type} onChange={e => setType(e.target.value as PayrollType)}>{PAYROLL_TYPES.map(item => <option key={item}>{item}</option>)}</Select></Field>
      <Field label="Mã mẫu"><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field>
      <Field label="Mô tả" className="span2"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field>
    </div>
    <h3>Đối tượng áp dụng</h3>
    <p><a href="#/m/nhan-su/thong-tin-nhan-su">Xem danh sách nhân viên</a></p>
    <p className="muted">Đơn vị, vị trí, nhân viên để trống nghĩa là áp dụng chung.</p>
    <h3>Thành phần lương</h3>
    <p>{components.length} thành phần trong mẫu.</p>
    <button type="button" className="btn-ghost" onClick={() => setComponents(mainTemplateComponents(data.indicators))}>Dùng bộ chỉ số tính lương chính</button>
    <h3>Mẫu export</h3>
    <p>Chưa có mẫu export. Tạo mẫu để xuất theo nhu cầu kế toán, ngân hàng, BHXH…</p>
    <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => nav(-1)}>Hủy bỏ</button><button className="btn-primary">Lưu</button></div>
  </form>;
}

export function IndicatorPage() {
  const data = usePayroll();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [open, setOpen] = useState(false);
  const rows = data.indicators.filter(item => includesPlain(item.code + item.name, q) && (!kind || item.kind === kind)).map(item => ({ ...item, id: item.code }));
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost">Bộ lọc</button><Select aria-label="Loại công thức" value={kind} onChange={e => setKind(e.target.value)}><option value="">Tất cả</option><option>Nhập tay</option><option>Công thức Excel</option></Select><input className="control" placeholder="Tìm mã, tên" aria-label="Tìm chỉ số" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-ghost" onClick={() => alert('Import chỉ số: mẫu cột chưa có trong ghi chú.')}>Import</button><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button></div>
    <DataTable rows={rows} columns={[{ id: 'code', header: 'Mã chỉ số', cell: r => r.code }, { id: 'name', header: 'Tên chỉ số', cell: r => r.name }, { id: 'kind', header: 'Loại công thức', cell: r => r.kind }, { id: 'f', header: 'Công thức', cell: r => r.formula || '—' }, { id: 'fmt', header: 'Định dạng', cell: r => r.format }, { id: 'def', header: 'Giá trị mặc định', cell: r => r.defaultValue || '—' }, { id: 'desc', header: 'Mô tả', cell: r => r.description || '—' }, { id: 'act', header: 'Tác vụ', cell: () => '—' }]} filterKey={q + kind} />
    {open && <NewIndicator onClose={() => setOpen(false)} />}
  </div>;
}

function NewIndicator({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<ValueFormat>('Văn bản');
  const [value, setValue] = useState('');
  const [kind, setKind] = useState<FormulaKind>('Nhập tay');
  const [formula, setFormula] = useState('');
  const [description, setDescription] = useState('');
  return <div className="modal-back" onMouseDown={onClose}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); payrollStore.saveIndicator({ code, name, format, defaultValue: value, kind, formula: kind === 'Nhập tay' ? '' : formula, description }); onClose(); }}><header><b>Thêm mới thành phần lương</b></header><div className="body form-grid">
    <Field label="Tên thành phần" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label="Mã thành phần" required><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field>
    <Field label="Định dạng"><Select value={format} onChange={e => setFormat(e.target.value as ValueFormat)}><option>Văn bản</option><option>Số</option><option>Tiền tệ (VND)</option><option>Ngày</option></Select></Field>
    <Field label="Giá trị mặc định"><TextInput value={value} onChange={e => setValue(e.target.value)} /></Field>
    <Field label="Loại công thức"><Select value={kind} onChange={e => setKind(e.target.value as FormulaKind)}><option>Nhập tay</option><option>Công thức Excel</option><option>Ngôn ngữ Happy Time</option><option>Ngôn ngữ Expression</option></Select></Field>
    <Field label="Công thức" className="span2"><TextArea disabled={kind === 'Nhập tay'} value={formula} onChange={e => setFormula(e.target.value)} /></Field>
    <Field label="Mô tả" className="span2"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field>
  </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary">Lưu</button></div></form></div>;
}

export function SimpleMaster({ kind }: { kind: 'product' | 'center' | 'assign' }) {
  const data = usePayroll();
  const toast = useToast();
  if (kind === 'product') return <div className="card panel"><div className="toolbar"><button className="btn-ghost" onClick={() => history.back()}>Quay lại</button><button className="btn-primary" onClick={() => toast('Form thêm sản phẩm không có trong ghi chú.')}>Thêm mới</button></div><DataTable rows={data.products} columns={[{ id: 'name', header: 'Tên sản phẩm', cell: r => r.name }, { id: 'code', header: 'Mã sản phẩm', cell: r => r.code }, { id: 'price', header: 'Giá sản phẩm', cell: r => r.price }, { id: 'act', header: 'Tác vụ', cell: () => '—' }]} empty="Không có dữ liệu" /></div>;
  if (kind === 'center') return <div className="card panel"><div className="toolbar"><button className="btn-primary" onClick={() => toast('Form thêm cost center không có trong ghi chú.')}>Thêm mới</button></div><DataTable rows={data.costCenters} columns={[{ id: 'name', header: 'Tên', cell: r => r.name }, { id: 'code', header: 'Mã', cell: r => r.code }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'act', header: 'Tác vụ', cell: () => '—' }]} /></div>;
  return <div className="card panel"><div className="toolbar"><button className="btn-ghost">Bộ lọc</button><button className="btn-primary" onClick={() => toast('Form phân bổ chi phí không có trong ghi chú.')}>Thêm mới</button></div><DataTable rows={data.assignments} columns={[{ id: 't', header: 'Đối tượng áp dụng', cell: r => r.target }, { id: 'c', header: 'Cost center', cell: r => r.costCenter }, { id: 'r', header: 'Tỉ lệ phân bổ', cell: r => r.rate + '%' }, { id: 'time', header: 'Thời gian hiệu lực', cell: r => r.from + ' – ' + (r.to || '') }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'act', header: 'Tác vụ', cell: () => '—' }]} empty="Không có dữ liệu" /></div>;
}

export function CategoryPage() {
  const [tab, setTab] = useState<'item' | 'group'>('item');
  const groups = [...new Set(COST_CATEGORIES.map(item => item.group))];
  return <div className="card panel">
    <div className="tabs-line"><button className={tab === 'item' ? 'on' : ''} onClick={() => setTab('item')}>Hạng mục</button><button className={tab === 'group' ? 'on' : ''} onClick={() => setTab('group')}>Nhóm hạng mục</button></div>
    <div className="toolbar"><Select aria-label="Nhóm hạng mục"><option>Chọn nhóm hạng mục</option>{groups.map(g => <option key={g}>{g}</option>)}</Select><Select aria-label="Trạng thái"><option>Chọn trạng thái</option><option>Hoạt động</option></Select><span className="muted">Kéo thả để sắp xếp</span><button className="btn-primary" onClick={() => alert('Form thêm hạng mục không có trong ghi chú.')}>Thêm hạng mục</button></div>
    {tab === 'item' ? <table className="tbl"><thead><tr><th>STT</th><th>NHÓM HẠNG MỤC</th><th>MÃ HẠNG MỤC</th><th>TÊN HẠNG MỤC</th><th>THÔNG TIN TÍNH LƯƠNG</th><th>THÔNG TIN TÍNH LƯƠNG KHẤU TRỪ</th><th>TRẠNG THÁI</th></tr></thead><tbody>{COST_CATEGORIES.map((row, i) => <tr key={row.code}><td>{i + 1}</td><td>{row.group}</td><td>{row.code}</td><td>{row.name}</td><td>{row.info}</td><td>--</td><td>Hoạt động</td></tr>)}</tbody></table> : <ul>{groups.map(g => <li key={g}>{g}</li>)}</ul>}
  </div>;
}

export function ReportTemplatePage() {
  const data = usePayroll();
  return <div className="card panel"><div className="toolbar"><button className="btn-primary" onClick={() => alert('Form thêm mẫu báo cáo hoạch toán không có trong ghi chú.')}>Thêm mẫu</button></div>
    <DataTable rows={data.reportTemplates} columns={[{ id: 'stt', header: 'STT', cell: () => 1 }, { id: 'name', header: 'Tên mẫu', cell: r => r.name }, { id: 'n', header: 'Số hạng mục', cell: r => r.count }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'act', header: 'Thao tác', cell: () => '—' }]} />
  </div>;
}

export function TableSettingsPage() {
  const data = usePayroll();
  const toast = useToast();
  const [form, setForm] = useState(data.table);
  return <form className="card pad-card" onSubmit={e => { e.preventDefault(); payrollStore.saveTable({ ...form, working: true }); toast('Đã lưu thay đổi'); }}>
    <h3>Người đưa vào bảng lương</h3>
    <p>Chọn các nhóm nhân sự sẽ được tự động đưa vào bảng lương của kỳ tính lương.</p>
    <label className="feature on"><input type="checkbox" checked disabled /> <b>Người đang làm việc</b><small>Nhân viên có trạng thái đang làm việc trong kỳ lương hiện tại</small><span className="tag">Bắt buộc</span></label>
    <label className="feature"><input type="checkbox" checked={form.resignedInPeriod} onChange={e => setForm({ ...form, resignedInPeriod: e.target.checked })} /> <b>Người nghỉ việc trong tháng lương đó</b><small>Nhân viên có ngày nghỉ việc rơi vào kỳ tính lương đang xử lý</small></label>
    <label className="feature"><input type="checkbox" checked={form.maternity} onChange={e => setForm({ ...form, maternity: e.target.checked })} /> <b>Nghỉ thai sản</b><small>Nhân viên đang trong thời gian nghỉ chế độ thai sản</small></label>
    <p className="muted">Thay đổi cài đặt này sẽ áp dụng cho các kỳ tính lương tiếp theo, không ảnh hưởng đến bảng lương đã chốt.</p>
    <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setForm(data.table)}>Hủy bỏ</button><button className="btn-primary">Lưu thay đổi</button></div>
  </form>;
}

export function V1MainList() {
  return <div><V1Banner /><div className="card panel"><div className="toolbar"><Select aria-label="Trạng thái"><option>Trạng thái</option></Select><Select aria-label="Đối tượng áp dụng"><option>Đối tượng áp dụng</option></Select><button className="btn-primary">THÊM MỚI</button></div>
    <table className="tbl"><thead><tr><th>TÊN BẢNG LƯƠNG</th><th>KỲ LƯƠNG</th><th>THỜI GIAN TÍNH LƯƠNG</th><th>ĐỐI TƯỢNG ÁP DỤNG</th><th>TIẾN HÀNH</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={7}>Không có dữ liệu</td></tr></tbody></table></div></div>;
}

export function V1Extra() {
  const [tab, setTab] = useState('BẢNG SẢN PHẨM');
  return <div><V1Banner /><div className="card panel"><div className="toolbar"><button className="btn-ghost" onClick={() => history.back()}>Quay lại</button></div><h2>Bảng sản phẩm</h2>
    <div className="tabs-line">{['BẢNG SẢN PHẨM', 'BẢNG DOANH SỐ', 'BẢNG KPI', 'BẢNG THU NHẬP & KHẤU TRỪ KHÁC'].map(item => <button key={item} className={tab === item ? 'on' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div className="toolbar"><Select aria-label="Trạng thái"><option>Trạng thái</option></Select><Select aria-label="Đối tượng"><option>Đối tượng áp dụng</option></Select><button className="btn-ghost">Quản lý sản phẩm</button><button className="btn-primary">Thêm mới</button></div>
    <table className="tbl"><thead><tr><th>STT</th><th>TÊN BẢNG SẢN PHẨM</th><th>KỲ LƯƠNG</th><th>ĐỐI TƯỢNG ÁP DỤNG</th><th>TRẠNG THÁI</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={6}>Không có dữ liệu</td></tr></tbody></table>
  </div></div>;
}

export function V1PayslipSettings() {
  const [tab, setTab] = useState('THÔNG TIN TÍNH LƯƠNG');
  return <div><V1Banner /><div className="card panel"><h2>Thông tin tính lương</h2>
    <div className="tabs-line">{['MẪU BẢNG LƯƠNG CHÍNH', 'MẪU BẢNG LƯƠNG PHỤ', 'THÔNG TIN TÍNH LƯƠNG'].map(item => <button key={item} className={tab === item ? 'on' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div className="toolbar"><Select aria-label="Phương thức tính"><option>Lựa chọn phương thức tính</option></Select><Select aria-label="Loại thông tin"><option>Lựa chọn loại thông tin tính</option></Select><button className="btn-primary">Thêm mới</button></div>
    <table className="tbl"><thead><tr><th>STT</th><th>TIÊU ĐỀ THÔNG TIN</th><th>MÔ TẢ</th><th>PHƯƠNG THỨC TÍNH</th><th>GIÁ TRỊ</th></tr></thead><tbody><tr><td colSpan={5}>Không có dữ liệu</td></tr></tbody></table>
  </div></div>;
}

export function V1General() {
  const data = usePayroll();
  const toast = useToast();
  const [form, setForm] = useState(data.v1);
  return <div><V1Banner /><form className="card pad-card" onSubmit={e => { e.preventDefault(); payrollStore.saveV1(form); toast('Đã lưu'); }}>
    <h3>Thời hạn hoàn chốt bảng lương</h3>
    <label className="chk"><input type="checkbox" checked={form.reopenOn} onChange={e => setForm({ ...form, reopenOn: e.target.checked })} /> Trạng thái hoạt động</label>
    <p>Kể từ thời điểm bảng lương được chốt, chỉ có thể hoàn chốt bảng lương trong vòng <input className="control" style={{ width: 80 }} type="number" value={form.reopenDays} onChange={e => setForm({ ...form, reopenDays: Number(e.target.value) })} /> Ngày</p>
    <h3>Thời hạn nhận phản hồi của bảng lương</h3>
    {(['Không thời hạn', 'Ngày cuối cùng của tháng', 'Tùy chọn ngày cố định mỗi tháng'] as const).map(item => <label key={item} className="chk"><input type="radio" checked={form.feedbackMode === item} onChange={() => setForm({ ...form, feedbackMode: item })} /> {item}</label>)}
    <Field label="Chọn nhân viên nhận phản hồi"><TextInput value={form.feedbackEmployee} onChange={e => setForm({ ...form, feedbackEmployee: e.target.value })} /></Field>
    <h3>Biểu thuế lũy tiến từng phần áp dụng đối với thuế thu nhập cá nhân</h3>
    <table className="tbl"><thead><tr><th>Thu nhập tính thuế/năm</th><th>Thu nhập tính thuế/tháng</th><th>%</th></tr></thead><tbody>{TAX_ROWS_V1.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table>
    <button className="btn-primary">Lưu</button>
  </form></div>;
}
