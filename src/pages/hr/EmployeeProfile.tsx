import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { personInitial } from '../../components/Person';
import { useToast } from '../../components/feedback';
import { hr } from '../../data/repositories';
import { REQUEST_TYPES } from '../../data/timeoff';
import { fmtDate, fmtMoney, todayISO, yearsBetween } from '../../data/text';
import { leaveRemaining } from '../../data/timeoff';
import { useLabels } from './lookups';

const TABS = ['Tổng quan', 'Thông tin nhân sự', 'Quyền thao tác', 'Trạng thái nhân sự', 'Quá trình công tác', 'Hợp đồng', 'Thông tin thu nhập', 'Thông tin hộ gia đình', 'Thông tin thai sản', 'Bảo hiểm', 'Tài liệu', 'Tiếp nhận', 'Tài sản', 'Khen thưởng', 'Kỷ luật', 'Đánh giá', 'Chữ ký', 'Các loại đơn từ', 'Chứng chỉ', 'Chế độ bảo vệ'];

export default function EmployeeProfile() {
  const { recordId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const labels = useLabels();
  const employee = labels.state.employees.find(e => e.id === recordId);
  const [tab, setTab] = useState(TABS[0]);
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [allowed, setAllowed] = useState<string[]>(REQUEST_TYPES.map(t => t.id));
  if (!employee) return <div className="card empty"><b>Không tìm thấy nhân sự</b></div>;
  const contracts = labels.state.contracts.filter(c => c.employeeId === employee.id);
  const deps = labels.state.dependents.filter(d => d.employeeId === employee.id);
  const certs = labels.state.certificates.filter(c => c.employeeId === employee.id);
  const rewards = labels.state.rewards.filter(r => r.employeeId === employee.id);
  const requests = labels.state.requests.filter(r => r.employeeId === employee.id);
  const balance = labels.state.leaveBalances.find(b => b.employeeId === employee.id);
  const remain = leaveRemaining(balance);
  const months = Math.max(0, (new Date().getFullYear() - Number(employee.startDate.slice(0, 4))) * 12);
  const leaveCards = [
    ['PHÉP NĂM', balance?.entitled ?? 0, balance?.used ?? 0],
    ['PHÉP NĂM TRƯỚC', balance?.carried ?? 0, 0],
    ['SINH NHẬT', 1, 0],
    ['THÂM NIÊN', yearsBetween(employee.startDate, todayISO()) >= 5 ? 1 : 0, 0],
    ['NGHỈ BÙ OT', 0, 0],
    ['NGHỈ BÙ OT NĂM TRƯỚC', 0, 0],
    ['TỔNG CÒN LẠI', remain + 1, balance?.used ?? 0],
  ] as const;

  return (
    <div>
      <div className="card detail-hero">
        <div className="avatar-lg">{personInitial(employee.fullName)}</div>
        <div style={{ flex: 1 }}>
          <b className="hero-name">{employee.fullName}</b>
          <div className="hero-meta">
            <span className="pill ok"><i />{employee.status}</span>
            <span className="chip">{employee.code}</span>
            <span className="chip">{employee.employmentType}</span>
            <span>{labels.unit(employee.unitId)}</span>
            <span>{labels.position(employee.positionId)}</span>
            <span>{employee.gender}</span>
            <span>{fmtDate(employee.dob)}</span>
            <span>{employee.educationLevel || '—'}</span>
            <span>{employee.email}</span>
            <span>{employee.phone}</span>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => toast('Đã ghi nhận gửi email onboarding')}>Gửi email onboarding</button>
        <button className="btn-danger" onClick={() => { const { id, ...rest } = employee; hr.saveEmployee({ ...rest, status: 'Đã nghỉ việc', resignDate: todayISO() }, id); toast('Đã chuyển Offboarding'); }}>Offboarding</button>
      </div>
      <div className="tabs-line" style={{ overflowX: 'auto' }}>{TABS.map(item => <button key={item} className={tab === item ? 'on' : ''} onClick={() => setTab(item)}>{item}{item === 'Tiếp nhận' ? ' (0/0)' : ''}</button>)}</div>
      <div className="card pad-card">
        {tab === 'Tổng quan' && <>
          <div className="kpis">
            <div className="kpi"><small>THÂM NIÊN</small><b>{months} tháng</b><small>Từ {fmtDate(employee.startDate)}</small></div>
            <div className="kpi"><small>NGÀY PHÉP CÒN LẠI</small><b>{remain} / {balance?.entitled ?? 0}</b><small>Đã dùng {balance?.used ?? 0} ngày</small></div>
            <div className="kpi"><small>TĂNG CA THÁNG {new Date().getMonth() + 1}</small><b>{requests.filter(r => r.type === 'lam-them-gio' && r.status === 'Đã duyệt').reduce((s, r) => s + r.quantity, 0)} h</b></div>
            <div className="kpi"><small>XẾP LOẠI ĐÁNH GIÁ</small><b>—</b><small>Chưa có dữ liệu</small></div>
          </div>
          <h3>Chính sách phép năm {new Date().getFullYear()}</h3>
          <div className="kpis">{leaveCards.map(([name, total, used]) => <div className="kpi" key={name}><small>{name}</small><b>{Math.max(0, total - used)}</b><small>Đã dùng {used} · Còn {Math.max(0, total - used)}</small></div>)}</div>
          <div className="split">
            <section className="card"><h3>Quá trình công tác</h3><p>{labels.position(employee.positionId)} · {labels.unit(employee.unitId)} từ {fmtDate(employee.startDate)}</p><button className="link" onClick={() => setTab('Quá trình công tác')}>Xem tất cả</button></section>
            <section className="card"><h3>Hợp đồng đã ký</h3>{contracts.map(c => <p key={c.id}>{c.code} · {c.type}<small className="muted"> THỜI GIAN THEO HỢP ĐỒNG {fmtDate(c.startDate)} – {c.endDate ? fmtDate(c.endDate) : 'không thời hạn'}</small></p>)}</section>
            <section className="card"><h3>Cấp bậc công việc</h3><p>CẤP 2 QUẢN LÝ CẤP CAO</p><p>CẤP 1 QUẢN LÝ TRỰC TIẾP</p><small className="muted">Nhãn cấp đang là mẫu vì khảo sát không nêu cách gán cấp cho từng vị trí.</small></section>
            <section className="card"><h3>Đơn từ gần đây</h3>{requests.slice(0, 4).map(r => <p key={r.id}>{r.code} · {r.status}</p>)}<p className="muted">TỔNG HỢP ĐƠN 6 THÁNG QUA: {requests.length} đơn</p></section>
            <section className="card"><h3>Tuân thủ giờ làm</h3><p>Đi muộn / Về sớm / Đúng giờ — xem Bảng công. VI PHẠM 6 THÁNG QUA chưa có công thức trong ghi chú.</p></section>
            <section className="card"><h3>Học vấn</h3><p>Trình độ {employee.educationLevel || '—'} · Trường {employee.school || '—'} · Chuyên ngành {employee.major || '—'}</p><p className="muted">LỊCH SỬ HỌC VẤN</p></section>
          </div>
          <p className="tag">TÍNH NĂNG ĐANG ĐƯỢC PHÁT TRIỂN – Dữ liệu hiển thị là dữ liệu mẫu</p>
          <div className="kpis">
            <div className="kpi"><small>Khen thưởng / Kỷ luật</small><b>{rewards.length}</b></div>
            <div className="kpi"><small>Quá trình đóng BHXH</small><b>{employee.siNumber || '—'}</b></div>
            <div className="kpi"><small>Biến động thu nhập — 2025</small><b>{fmtMoney(contracts[0]?.salary || 0)}</b></div>
            <div className="kpi"><small>Kết quả đánh giá</small><b>—</b></div>
            <div className="kpi"><small>Development Plan — H1/2025</small><b>—</b></div>
          </div>
          <div className="row-actions"><button className="btn-ghost" onClick={() => setTab('Chứng chỉ')}>Gán chứng chỉ +</button><button className="btn-ghost" onClick={() => toast('Gán khóa học: mở Quản lý khóa học trong cài đặt.')}>Gán khóa học +</button></div>
        </>}
        {tab === 'Thông tin nhân sự' && <div className="split">
          <section><h3>Thông tin cá nhân <button className="btn-ghost btn-sm" onClick={() => nav('/m/nhan-su/thong-tin-nhan-su/tao-moi')}>Chỉnh sửa</button> <button className="btn-ghost btn-sm">Gắn tài khoản đăng nhập</button></h3>
            <dl className="dl"><dt>Họ và tên</dt><dd>{employee.fullName}</dd><dt>Tiếng Anh</dt><dd>{employee.englishName || '—'}</dd><dt>Giới tính</dt><dd>{employee.gender}</dd><dt>Ngày sinh</dt><dd>{fmtDate(employee.dob)}</dd><dt>Quốc tịch</dt><dd>{employee.nationality}</dd><dt>Dân tộc</dt><dd>{employee.ethnicity}</dd><dt>SĐT</dt><dd>{employee.phone}</dd><dt>Email công ty</dt><dd>{employee.email}</dd><dt>SĐT cơ quan</dt><dd>{employee.officePhone || '—'}</dd><dt>Hôn nhân</dt><dd>{employee.marital}</dd><dt>Email cá nhân</dt><dd>{employee.personalEmail || '—'}</dd><dt>Trình độ</dt><dd>{employee.educationLevel || '—'}</dd><dt>Trường</dt><dd>{employee.school || '—'}</dd><dt>Chuyên ngành</dt><dd>{employee.major || '—'}</dd><dt>Năm tốt nghiệp</dt><dd>{employee.gradYear || '—'}</dd><dt>Thường trú</dt><dd>{employee.address}</dd><dt>Tạm trú</dt><dd>{employee.tempAddress || '—'}</dd></dl></section>
          <section><h3>Thông tin định danh</h3><dl className="dl"><dt>CCCD</dt><dd>{employee.idNumber}</dd><dt>Ngày cấp</dt><dd>{fmtDate(employee.idIssueDate)}</dd><dt>Nơi cấp</dt><dd>{employee.idIssuePlace}</dd><dt>Ảnh</dt><dd>Preview</dd><dt>Hộ chiếu</dt><dd>{employee.passportNumber || '—'}</dd><dt>MST</dt><dd>{employee.taxCode}</dd></dl>
            <h3>Thông tin công việc</h3><dl className="dl"><dt>Đơn vị</dt><dd>{labels.unit(employee.unitId)}</dd><dt>Quản lý trực tiếp</dt><dd>{labels.employee(employee.managerId)?.fullName || '—'}</dd><dt>Chi nhánh</dt><dd>{labels.branch(employee.branchId)}</dd><dt>Vị trí</dt><dd>{labels.position(employee.positionId)}</dd><dt>Kiêm nhiệm</dt><dd>{employee.concurrentPosition || '—'}</dd><dt>Vùng lương</dt><dd>{employee.salaryRegion || '—'}</dd><dt>Ngày đi làm</dt><dd>{fmtDate(employee.startDate)}</dd><dt>Ngày chính thức</dt><dd>{fmtDate(employee.officialDate)}</dd><dt>Ngày nghỉ việc</dt><dd>{fmtDate(employee.resignDate)}</dd><dt>Chấm công</dt><dd>{employee.noAttendance ? 'Không yêu cầu' : 'Yêu cầu'}</dd><dt>Sử dụng App</dt><dd>{employee.appUsed === false ? 'Chưa' : 'Đã sử dụng'}</dd><dt>Mã nhân viên</dt><dd>{employee.code}</dd><dt>Mã chấm công</dt><dd>{employee.code.replace('NV', 'CC')}</dd><dt>Tài khoản đăng nhập</dt><dd>{employee.email.replace(/(.{2}).+(@)/, '$1***$2')}</dd></dl></section>
        </div>}
        {tab === 'Quyền thao tác' && <p>Quyền thao tác <button className="btn-ghost btn-sm">Chỉnh sửa</button><b> {employee.roleName || 'Nhân viên'}</b></p>}
        {tab === 'Trạng thái nhân sự' && <table className="tbl"><thead><tr><th>STT</th><th>TRẠNG THÁI NHÂN SỰ</th><th>THỜI GIAN ÁP DỤNG</th><th>NGƯỜI THỰC HIỆN</th><th>NGÀY THỰC HIỆN</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>1</td><td>{employee.status}</td><td>{fmtDate(employee.startDate)} - Vô thời hạn</td><td>Hệ thống</td><td>{fmtDate(employee.startDate)}</td><td></td></tr></tbody></table>}
        {tab === 'Quá trình công tác' && <table className="tbl"><thead><tr><th>STT</th><th>THỜI GIAN CÓ HIỆU LỰC</th><th>VỊ TRÍ</th><th>KIÊM NHIỆM</th><th>ĐƠN VỊ</th><th>PHÁP NHÂN</th><th>PHÁP NHÂN KIÊM NHIỆM</th><th>LOẠI HÌNH</th><th>LÝ DO</th><th>QUYẾT ĐỊNH</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>1</td><td>{fmtDate(employee.startDate)}</td><td>{labels.position(employee.positionId)}</td><td>{employee.concurrentPosition || '—'}</td><td>{labels.unit(employee.unitId)}</td><td>{labels.branch(employee.branchId)}</td><td>—</td><td>{employee.employmentType}</td><td>Tiếp nhận</td><td>—</td><td></td></tr></tbody></table>}
        {tab === 'Hợp đồng' && <table className="tbl"><thead><tr><th>STT</th><th>NHÂN VIÊN</th><th>MÃ HỢP ĐỒNG</th><th>LOẠI</th><th>NGÀY HẾT HẠN</th><th>TRẠNG THÁI KÝ</th><th>HIỆU LỰC</th></tr></thead><tbody>{contracts.map((c, i) => <tr key={c.id}><td>{i + 1}</td><td>{employee.fullName}</td><td>{c.code}</td><td>{c.type}</td><td>{c.endDate ? fmtDate(c.endDate) : '—'}</td><td>{c.signedDate ? 'Đã ký' : 'Chưa ký'}</td><td>{c.status}</td></tr>)}</tbody></table>}
        {tab === 'Thông tin thu nhập' && (locked ? <PasswordGate password={password} setPassword={setPassword} onOk={() => { if (password.trim()) setLocked(false); else toast('Nhập mật khẩu bất kỳ.'); }} /> : <table className="tbl"><thead><tr><th>STT</th><th>THỜI GIAN CÓ HIỆU LỰC</th><th>LƯƠNG CƠ BẢN</th><th>PHỤ CẤP ĂN TRƯA</th><th>PHỤ CẤP ĐI LẠI</th><th>TÁC VỤ</th></tr></thead><tbody>{contracts.map((c, i) => <tr key={c.id}><td>{i + 1}</td><td>{fmtDate(c.startDate)}</td><td>{fmtMoney(c.salary)}</td><td>—</td><td>—</td><td></td></tr>)}</tbody></table>)}
        {tab === 'Thông tin hộ gia đình' && <>
          <p>Họ và tên chủ hộ — · SĐT — · Loại giấy tờ — · Mã số hộ — · Địa chỉ — <button className="btn-ghost btn-sm">Chỉnh sửa</button></p>
          <table className="tbl"><thead><tr><th>STT</th><th>MỐI QUAN HỆ VỚI NLĐ</th><th>HỌ TÊN</th><th>NGÀY SINH</th><th>CMND/CCCD</th><th>TÌNH TRẠNG PHỤ THUỘC</th><th>TÁC VỤ</th></tr></thead><tbody>{deps.map((d, i) => <tr key={d.id}><td>{i + 1}</td><td>{d.relation}</td><td>{d.name}</td><td>{fmtDate(d.dob)}</td><td>{d.idNumber}</td><td>{d.taxDependent ? 'Phụ thuộc' : 'Không'}</td><td></td></tr>)}{!deps.length && <tr><td colSpan={7}>Không có kết quả nào phù hợp với nội dung tìm kiếm</td></tr>}</tbody></table>
        </>}
        {tab === 'Thông tin thai sản' && <table className="tbl"><thead><tr><th>STT</th><th>NGÀY BẮT ĐẦU MANG THAI</th><th>NGÀY DỰ SINH</th><th>NGÀY SINH THỰC TẾ</th><th>SỐ LƯỢNG CON</th><th>TÌNH TRẠNG SINH</th><th>KHOẢNG THỜI GIAN NGHỈ</th><th>ĐƠN LIÊN QUAN</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={9}>Không có kết quả nào phù hợp với nội dung tìm kiếm</td></tr></tbody></table>}
        {tab === 'Bảo hiểm' && <>
          <h3>Thông tin BHXH <button className="btn-ghost btn-sm">Chỉnh sửa</button></h3>
          <dl className="dl"><dt>Mã BHXH</dt><dd>{employee.siNumber}</dd><dt>BHYT</dt><dd>{employee.hiNumber}</dd><dt>KCB</dt><dd>{employee.hospital}</dd><dt>Điều kiện</dt><dd>{employee.workCondition || 'Bình thường'}</dd></dl>
          <table className="tbl"><thead><tr><th>THỜI GIAN ĐÓNG</th><th>MỨC ĐÓNG</th><th>TỈ LỆ ĐÓNG</th><th>GHI CHÚ</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td>{fmtDate(employee.siStart)}</td><td>—</td><td>—</td><td>{employee.siMonths || ''}</td><td></td></tr></tbody></table>
        </>}
        {tab === 'Tài liệu' && <><div className="seg"><button className="on">Tài liệu chung</button><button>Tài liệu bảo mật</button></div><table className="tbl"><thead><tr><th>TÊN FILE</th></tr></thead><tbody><tr><td>Không có kết quả nào phù hợp với nội dung tìm kiếm</td></tr></tbody></table></>}
        {tab === 'Tiếp nhận' && <><p>Danh sách kiểm tra tiếp nhận <button className="btn-ghost btn-sm">Thêm danh sách kiểm tra theo mẫu</button> <button className="btn-ghost btn-sm">Thêm mới</button> <span className="pill">Chưa thông tin</span></p><h3>Lịch sử tương tác</h3><ul className="timeline"><li><i /><div>Gửi email onboarding</div></li><li><i /><div>Nộp form onboarding</div></li></ul></>}
        {tab === 'Tài sản' && <table className="tbl"><thead><tr><th>STT</th><th>MÃ TÀI SẢN</th><th>TÊN TÀI SẢN</th><th>LOẠI</th><th>VAI TRÒ</th><th>NGÀY CẤP PHÁT</th><th>MÃ PHIẾU</th><th>NGÀY THU HỒI</th><th>MÃ PHIẾU THU</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={10}>Không có kết quả nào phù hợp với nội dung tìm kiếm</td></tr></tbody></table>}
        {tab === 'Khen thưởng' && <table className="tbl"><thead><tr><th>STT</th><th>ĐỢT</th><th>NGÀY QUYẾT ĐỊNH</th><th>GIÁ TRỊ</th><th>HÌNH THỨC</th><th>GHI CHÚ</th><th>TÌNH TRẠNG</th></tr></thead><tbody>{rewards.filter(r => r.kind === 'reward').map((r, i) => <tr key={r.id}><td>{i + 1}</td><td>{r.title}</td><td>{fmtDate(r.date)}</td><td>{fmtMoney(r.amount)}</td><td>{r.form}</td><td>{r.reason}</td><td>Đã ghi nhận</td></tr>)}</tbody></table>}
        {tab === 'Kỷ luật' && <table className="tbl"><thead><tr><th>STT</th><th>ĐỢT</th><th>NGÀY</th><th>HÌNH THỨC</th><th>BỒI THƯỜNG</th><th>MÔ TẢ</th><th>TÌNH TRẠNG</th></tr></thead><tbody>{rewards.filter(r => r.kind === 'discipline').map((r, i) => <tr key={r.id}><td>{i + 1}</td><td>{r.title}</td><td>{fmtDate(r.date)}</td><td>{r.form}</td><td>{fmtMoney(r.amount)}</td><td>{r.reason}</td><td>Đã ghi nhận</td></tr>)}</tbody></table>}
        {tab === 'Đánh giá' && <table className="tbl"><thead><tr><th>STT</th><th>LOẠI</th><th>KỲ</th><th>TRẠNG THÁI</th><th>KẾT QUẢ</th><th>HẠN</th><th>NGÀY TẠO</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={8}>Không có kết quả nào phù hợp với nội dung tìm kiếm</td></tr></tbody></table>}
        {tab === 'Chữ ký' && <div className="split"><section><h3>Mẫu chữ ký</h3><table className="tbl"><thead><tr><th>HÌNH ẢNH</th><th>THÔNG TIN</th><th>NGÀY TẠO</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={4}>Chưa có</td></tr></tbody></table></section><section><h3>Chữ ký số</h3><table className="tbl"><thead><tr><th>TÊN</th><th>NHÀ CUNG CẤP</th><th>CHỨNG THƯ</th><th>HIỆU LỰC</th><th>TRẠNG THÁI</th></tr></thead><tbody><tr><td colSpan={5}>Chưa có</td></tr></tbody></table><h3>Chữ ký điện tử</h3><p>Email {employee.email} · CCCD {employee.idNumber} · SĐT {employee.phone}</p></section></div>}
        {tab === 'Các loại đơn từ' && <form onSubmit={e => { e.preventDefault(); toast('Đã lưu loại đơn được phép tạo'); }}><p>Chọn các loại đơn từ mà nhân viên này được phép tạo</p><button type="button" className="btn-ghost btn-sm" onClick={() => setAllowed(REQUEST_TYPES.map(t => t.id))}>Chọn tất cả</button><table className="tbl"><thead><tr><th>STT</th><th>TÊN LOẠI ĐƠN</th><th>MÔ TẢ</th><th>CHỌN</th></tr></thead><tbody>{REQUEST_TYPES.map((t, i) => <tr key={t.id}><td>{i + 1}</td><td>{t.label}</td><td>{t.unit}</td><td><input type="checkbox" checked={allowed.includes(t.id)} onChange={e => setAllowed(cur => e.target.checked ? [...cur, t.id] : cur.filter(x => x !== t.id))} /></td></tr>)}</tbody></table><button className="btn-primary">Lưu</button></form>}
        {tab === 'Chứng chỉ' && <table className="tbl"><thead><tr><th>STT</th><th>TÊN</th><th>MÃ</th><th>TÀI LIỆU</th><th>BẮT ĐẦU</th><th>HẾT HẠN</th><th>SỐ HIỆU</th><th>TRẠNG THÁI</th><th>ĐÍNH KÈM</th></tr></thead><tbody>{certs.map((c, i) => <tr key={c.id}><td>{i + 1}</td><td>{c.name}</td><td>{c.kind}</td><td>{c.issuer}</td><td>{fmtDate(c.issueDate)}</td><td>{fmtDate(c.expiryDate)}</td><td>{c.number}</td><td>{c.expiryDate && c.expiryDate < todayISO() ? 'Hết hạn' : 'Còn hạn'}</td><td>—</td></tr>)}</tbody></table>}
        {tab === 'Chế độ bảo vệ' && <><button className="btn-ghost">Thêm chế độ</button><table className="tbl"><thead><tr><th>LOẠI ĐỐI TƯỢNG</th><th>THỜI GIAN ÁP DỤNG</th><th>TRẠNG THÁI HIỆU LỰC</th><th>CHÍNH SÁCH BẢO VỆ</th><th>GHI CHÚ</th><th>TÁC VỤ</th></tr></thead><tbody><tr><td colSpan={6}>Chưa có chế độ bảo vệ</td></tr></tbody></table></>}
      </div>
    </div>
  );
}

function PasswordGate({ password, setPassword, onOk }: { password: string; setPassword: (v: string) => void; onOk: () => void }) {
  return <form onSubmit={e => { e.preventDefault(); onOk(); }}><h3>Bảo mật thông tin</h3><p>Nhập lại mật khẩu để xem thu nhập. Bản demo chấp nhận mọi mật khẩu khác rỗng.</p><input className="control" type="password" value={password} onChange={e => setPassword(e.target.value)} aria-label="Mật khẩu" /><button className="btn-primary">Tiếp tục</button></form>;
}
