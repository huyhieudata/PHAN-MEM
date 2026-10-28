import { useMemo, useState } from 'react';
// useMemo is used by the reason list.
import { useNavigate } from 'react-router-dom';
import { BarChart, Donut } from '../../components/Charts';
import { DataTable, type Column } from '../../components/DataTable';
import { Drawer } from '../../components/Drawer';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { useConfirm, useToast } from '../../components/feedback';
import { hr } from '../../data/repositories';
import { USER } from '../../data/session';
import { leaveRemaining, REQUEST_TYPES, requestLabel } from '../../data/timeoff';
import type { ApprovalDelegation, LeavePolicyV2, OtThreshold, RequestReason, TimeRequestType } from '../../data/types';
import { fmtDate, includesPlain, todayISO, yearsBetween } from '../../data/text';
import { useLabels } from '../hr/lookups';

export function DonTuOverview() {
  const nav = useNavigate();
  const { state } = useLabels();
  const month = todayISO().slice(0, 7);
  const cards = [
    ['Đơn đang xử lý', state.requests.filter(r => r.status === 'Chờ duyệt' || r.status === 'Đang duyệt').length, '/m/don-tu/can-duyet'],
    ['Đã phê duyệt trong tháng', state.requests.filter(r => r.status === 'Đã duyệt' && r.createdAt.startsWith(month)).length, '/m/don-tu/bao-cao-don-tu'],
    ['Đơn của tôi', state.requests.filter(r => r.createdBy === USER.name).length, '/m/don-tu/cua-toi'],
    ['Cấu hình OT', state.otThresholds.length, '/m/don-tu/cau-hinh-nguong-ot'],
  ] as const;
  return (
    <div>
      <div className="kpis">{cards.map(([label, value, to]) => <button key={label} className="kpi" onClick={() => nav(to)}><small>{label}</small><b>{value}</b></button>)}</div>
      <section className="card pad-card"><h3>Luồng đơn từ</h3><p>Tạo đơn → cấp duyệt theo quy trình → phê duyệt hoặc từ chối. Đơn nghỉ phép trừ quỹ khi gửi và ghi nhận đã dùng khi duyệt xong.</p></section>
    </div>
  );
}

export function RequestReportPage() {
  const { state } = useLabels();
  const month = todayISO().slice(0, 7);
  const rows = state.requests.filter(r => r.status !== 'Nháp');
  const inMonth = rows.filter(r => r.createdAt.startsWith(month));
  const byType = REQUEST_TYPES.map(item => ({ label: item.label.replace('Đơn ', ''), value: rows.filter(r => r.type === item.id).length })).filter(item => item.value);
  const byStatus = ['Chờ duyệt', 'Đang duyệt', 'Đã duyệt', 'Từ chối', 'Đã hủy'].map(status => ({ label: status, value: rows.filter(r => r.status === status).length }));
  return (
    <div>
      <div className="kpis">
        <div className="kpi"><small>Tổng số yêu cầu</small><b>{rows.length}</b></div>
        <div className="kpi"><small>Tổng số đơn từ trong tháng</small><b>{inMonth.length}</b></div>
        <div className="kpi"><small>Đã phê duyệt trong tháng</small><b>{inMonth.filter(r => r.status === 'Đã duyệt').length}</b></div>
      </div>
      <div className="report-grid">
        <section className="card"><h3>Các loại đơn từ</h3>{byType.length ? <Donut items={byType} /> : <p>Chưa có thông tin</p>}</section>
        <section className="card"><h3>Đơn từ theo trạng thái</h3><Donut items={byStatus} /></section>
        <section className="card"><h3>Đơn nghỉ phép theo lý do</h3><BarChart items={state.requestReasons.filter(r => r.type === 'nghi-phep').map(reason => ({ label: reason.name, value: rows.filter(r => r.reasonId === reason.id).length }))} /></section>
        <section className="card"><h3>Đơn từ theo nhân sự</h3><BarChart items={state.employees.slice(0, 8).map(emp => ({ label: emp.fullName, value: rows.filter(r => r.employeeId === emp.id).length })).filter(item => item.value)} /></section>
      </div>
    </div>
  );
}

export function OtReportPage() {
  const { state } = useLabels();
  const year = new Date().getFullYear();
  const [q, setQ] = useState('');
  const [unitId, setUnitId] = useState('');
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const rows = state.employees.filter(emp => (!q || includesPlain([emp.fullName, emp.code, emp.email].join(' '), q)) && (!unitId || emp.unitId === unitId));
  function hours(empId: string, month: number, night: boolean, kind: 'weekday' | 'weekend' | 'holiday') {
    return state.requests.filter(r => r.employeeId === empId && r.type === 'lam-them-gio' && r.status === 'Đã duyệt' && r.startDate.startsWith(`${year}-${String(month).padStart(2, '0')}`)).filter(r => {
      const dow = new Date(r.startDate).getDay();
      const isNight = (r.startTime || '') >= '18:00';
      const holiday = state.holidays.some(item => item.startDate <= r.startDate && item.endDate >= r.startDate);
      const bucket = holiday ? 'holiday' : dow === 0 || dow === 6 ? 'weekend' : 'weekday';
      return isNight === night && bucket === kind;
    }).reduce((sum, r) => sum + r.quantity, 0);
  }
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm OT" placeholder="Mã, email, tên nhân viên" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Select aria-label="Đơn vị" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Tất cả đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <span className="muted">{year}</span>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead>
          <tr><th rowSpan={2}>Nhân viên</th>{months.map(m => <th key={m} colSpan={7} className="group-head">Tháng {m}</th>)}<th rowSpan={2}>Tổng số giờ</th></tr>
          <tr>{months.map(m => ['NT ngày', 'NT đêm', 'Nghỉ ngày', 'Nghỉ đêm', 'Lễ ngày', 'Lễ đêm', 'Tổng'].map(label => <th key={m + label}>{label}</th>))}</tr>
        </thead>
        <tbody>{rows.map(emp => {
          const cells = months.flatMap(m => {
            const vals = [hours(emp.id, m, false, 'weekday'), hours(emp.id, m, true, 'weekday'), hours(emp.id, m, false, 'weekend'), hours(emp.id, m, true, 'weekend'), hours(emp.id, m, false, 'holiday'), hours(emp.id, m, true, 'holiday')];
            const total = vals.reduce((s, n) => s + n, 0);
            return [...vals, total];
          });
          const grand = cells.filter((_, i) => i % 7 === 6).reduce((s, n) => s + n, 0);
          return <tr key={emp.id}><td>{emp.fullName}</td>{cells.map((n, i) => <td key={i}>{n || ''}</td>)}<td><b>{grand}</b></td></tr>;
        })}</tbody>
      </table></div>
    </div>
  );
}

export function OtThresholdReport() {
  const { state, unit } = useLabels();
  const month = todayISO().slice(0, 7);
  const cap = state.otThresholds.find(item => item.isDefault)?.monthly ?? state.otPolicy.monthlyHourCap;
  const rows = state.employees.map(emp => {
    const hours = state.requests.filter(r => r.employeeId === emp.id && r.type === 'lam-them-gio' && r.status === 'Đã duyệt' && r.startDate.startsWith(month)).reduce((s, r) => s + r.quantity, 0);
    return { id: emp.id, name: emp.fullName, unit: unit(emp.unitId), hours, over: hours > cap };
  }).filter(row => row.hours > 0);
  return (
    <div className="card pad-card">
      <h3>Báo cáo ngưỡng OT</h3>
      <p className="muted">Trần tháng đang áp dụng: {cap} giờ. Nhân sự vượt trần được đánh dấu.</p>
      {rows.length === 0 && <p>Chưa có thông tin</p>}
      {rows.map(row => <div className="req" key={row.id}><span>{row.name} · {row.unit}</span><b style={{ color: row.over ? '#B91C1C' : undefined }}>{row.hours} giờ{row.over ? ' · vượt trần' : ''}</b></div>)}
    </div>
  );
}

export function LeaveManagePage() {
  const { state, employee, unit } = useLabels();
  const [qStatus, setQStatus] = useState('Đang làm việc');
  const [year, setYear] = useState(new Date().getFullYear());
  const rows = state.leaveBalances.filter(b => b.year === year && (!qStatus || employee(b.employeeId)?.status === qStatus));
  return (
    <div className="card panel">
      <div className="toolbar">
        <Select aria-label="Trạng thái" value={qStatus} onChange={e => setQStatus(e.target.value)}><option value="">Tất cả</option><option>Đang làm việc</option><option>Tạm nghỉ</option><option>Đã nghỉ việc</option></Select>
        <button className="btn-ghost">Bộ lọc</button>
        <button className="btn-ghost">Cập nhật</button>
        <button className="btn-ghost">Import</button>
        <button className="btn-ghost">Export</button>
        <Select aria-label="Năm" value={year} onChange={e => setYear(Number(e.target.value))}><option>{year}</option></Select>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead>
          <tr><th rowSpan={2}>Nhân viên</th><th rowSpan={2}>Số phép đến hiện tại</th><th colSpan={3} className="group-head">Số phép đã dùng</th><th colSpan={3} className="group-head">Số phép còn lại</th><th rowSpan={2}>Số phép cả năm (Dự kiến)</th><th rowSpan={2}>Tác vụ</th></tr>
          <tr><th>Tổng</th><th>Theo đơn</th><th>Không theo đơn</th><th>Tổng</th><th>Còn lại</th><th>Hết hạn</th></tr>
        </thead>
        <tbody>{rows.map(row => {
          const person = employee(row.employeeId);
          const now = row.entitled + row.carried;
          const remain = leaveRemaining(row);
          return <tr key={row.id}><td>{person?.fullName}<small className="muted"> · {unit(person?.unitId)}</small></td><td>{now}</td><td>{row.used}</td><td>{row.used}</td><td>0</td><td>{remain}</td><td>{remain}</td><td>0</td><td>{now}</td><td><button className="icon-btn" aria-label="Xem">👁</button></td></tr>;
        })}</tbody>
      </table></div>
    </div>
  );
}

export function LeaveListPage() {
  const { state, employee, unit } = useLabels();
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState('Đang làm việc');
  const [kind, setKind] = useState('');
  const rows = state.employees.filter(emp => (!unitId || emp.unitId === unitId) && (!status || emp.status === status) && (!kind || emp.employmentType === kind));
  const groups = ['Tổng phép (ngày)', 'Phép năm (ngày)', 'Phép năm trước (ngày)', 'Sinh nhật (ngày)', 'Thâm niên (ngày)', 'Nghỉ bù OT (giờ)', 'Nghỉ bù OT năm trước (giờ)'];
  return (
    <div className="card panel">
      <div className="toolbar">
        <button className="btn-ghost">Import</button><button className="btn-ghost">Export</button>
        <Select aria-label="Đơn vị" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">Đơn vị</option>{state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select aria-label="Trạng thái nhân sự" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option>Đang làm việc</option><option>Tạm nghỉ</option></Select>
        <Select aria-label="Loại hình nhân sự" value={kind} onChange={e => setKind(e.target.value)}><option value="">Loại hình nhân sự</option><option>Chính thức</option><option>Thử việc</option><option>Thực tập</option></Select>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead>
          <tr><th rowSpan={2}>Nhân viên</th><th rowSpan={2}>Đơn vị</th>{groups.map(g => <th key={g} colSpan={4} className="group-head">{g}</th>)}</tr>
          <tr>{groups.map(g => ['Tổng', 'Đã dùng', 'Hết hạn', 'Còn lại'].map(c => <th key={g + c}>{c}</th>))}</tr>
        </thead>
        <tbody>{rows.map(emp => {
          const bal = state.leaveBalances.find(b => b.employeeId === emp.id && b.leaveTypeId === 'lt-nam');
          const annual = bal?.entitled ?? 0;
          const prev = bal?.carried ?? 0;
          const used = bal?.used ?? 0;
          const birthday = 1;
          const seniority = Math.max(0, yearsBetween(emp.startDate, todayISO()) >= 5 ? 1 : 0);
          const nums = [annual + prev + birthday + seniority, annual, prev, birthday, seniority, 0, 0];
          return <tr key={emp.id}><td>{emp.fullName}</td><td>{unit(emp.unitId)}</td>{nums.flatMap((n, i) => {
            const spent = i === 1 ? used : 0;
            return [n, spent, 0, Math.max(0, n - spent)].map((value, j) => <td key={i + '-' + j}>{value}</td>);
          })}</tr>;
        })}</tbody>
      </table></div>
    </div>
  );
}

export function LeavePolicyPage() {
  const { state } = useLabels();
  const [tab, setTab] = useState<'policy' | 'source' | 'custom'>('policy');
  const [editing, setEditing] = useState<LeavePolicyV2 | null>(null);
  return (
    <div className="card panel">
      <div className="tabs-line">
        <button className={tab === 'policy' ? 'on' : ''} onClick={() => setTab('policy')}>CHÍNH SÁCH NGHỈ PHÉP</button>
        <button className={tab === 'source' ? 'on' : ''} onClick={() => setTab('source')}>DANH SÁCH NGUỒN PHÉP</button>
        <button className={tab === 'custom' ? 'on' : ''} onClick={() => setTab('custom')}>NGUỒN PHÉP TÙY CHỈNH</button>
      </div>
      {tab === 'policy' && <>
        <div className="toolbar"><span className="muted">Đối tượng áp dụng · Loại hình nhân sự</span><div className="grow" /><button className="btn-primary" onClick={() => setEditing({ id: '', name: '', month: '', scope: 'Toàn công ty', employmentTypes: ['Chính thức'], sources: state.leavePoliciesV2[0]?.sources ?? [] })}>Thêm mới</button></div>
        <DataTable rows={state.leavePoliciesV2} columns={[
          { id: 'name', header: 'Tên chính sách', sort: r => r.name, cell: r => r.name },
          { id: 'month', header: 'Tháng áp dụng', sort: r => r.month, cell: r => r.month },
          { id: 'scope', header: 'Đối tượng', cell: r => r.scope },
          { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => setEditing(r)}>Sửa</button> },
        ]} />
      </>}
      {tab !== 'policy' && <div className="empty"><b>{tab === 'source' ? 'Phép năm, Sinh nhật, Thâm niên, Nghỉ bù tăng ca' : 'Chưa có nguồn phép tùy chỉnh'}</b><small>Ghi chú khảo sát không liệt kê cột của hai tab này.</small></div>}
      {editing && <PolicyEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PolicyEditor({ initial, onClose }: { initial: LeavePolicyV2; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const labels = { nam: 'Phép năm', 'sinh-nhat': 'Sinh nhật', 'tham-nien': 'Thâm niên', 'nghi-bu': 'Nghỉ bù tăng ca' } as const;
  return (
    <Drawer title={form.id ? 'Sửa chính sách nghỉ phép' : 'Thêm chính sách nghỉ phép'} onClose={onClose} wide footer={<><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary" onClick={() => { const r = hr.saveLeavePolicyV2({ ...form, id: form.id || 'lpv2-' + Date.now() }); toast(r.ok ? 'Đã lưu chính sách' : r.errors.form); if (r.ok) onClose(); }}>Lưu</button></>}>
      <div className="form-grid">
        <p className="section-title">Thông tin chung</p>
        <Field label="Tên chính sách" required><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Tháng áp dụng" required><TextInput placeholder="mm/yyyy" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} /></Field>
        <p className="section-title">Phạm vi áp dụng</p>
        <Field label="Đối tượng áp dụng" required><TextInput value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} /></Field>
        <Field label="Loại hình nhân sự" required><TextInput value={form.employmentTypes.join(', ')} onChange={e => setForm({ ...form, employmentTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></Field>
        <p className="section-title">Nguồn phép</p>
        {form.sources.map((source, index) => (
          <div className="mini-card span2" key={source.kind}>
            <h4>{labels[source.kind]}</h4>
            <label className="chk"><input type="checkbox" checked={source.active} onChange={e => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, active: e.target.checked } : item) })} /> Trạng thái hoạt động</label>
            {source.kind === 'nam' && <div className="form-grid">
              <Field label="Số ngày công nghỉ phép hàng năm"><TextInput type="number" value={source.days} onChange={e => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, days: Number(e.target.value) } : item) })} /></Field>
              <Field label="Điều kiện cộng phép tháng đầu tiên"><TextInput type="number" value={source.firstMonthAfter} onChange={e => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, firstMonthAfter: Number(e.target.value) } : item) })} /></Field>
              <Field label="Ngày bắt đầu tính phép">{(['official', 'start'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={source.startFrom === value} onChange={() => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, startFrom: value } : item) })} />{value === 'official' ? 'Ngày lên chính thức' : 'Ngày bắt đầu đi làm'}</label>)}</Field>
              <Field label="Thời điểm cộng phép"><label className="chk"><input type="radio" checked={source.accrualPoint === 'month-end'} onChange={() => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, accrualPoint: 'month-end' } : item) })} /> Cộng phép vào ngày cố định của tháng / Cuối tháng</label></Field>
              <Field label="Công thức tính phép" className="span2">{(['monthly', 'full-year', 'split-12'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={source.formula === value} onChange={() => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, formula: value } : item) })} />{value === 'monthly' ? 'Tích lũy theo tháng' : value === 'full-year' ? 'Cộng đủ hàng năm' : 'Chia đều 12 tháng trong năm'}</label>)}</Field>
              <Field label="Hạn sử dụng">{(['this-year', 'next-year'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={source.expiry === value} onChange={() => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, expiry: value } : item) })} />{value === 'this-year' ? 'Trong năm' : 'Trong năm sau'}</label>)}</Field>
              <Field label="Số phép tối đa có thể sử dụng"><TextInput type="number" value={source.maxUse} onChange={e => setForm({ ...form, sources: form.sources.map((item, i) => i === index ? { ...item, maxUse: Number(e.target.value) } : item) })} /></Field>
            </div>}
          </div>
        ))}
      </div>
    </Drawer>
  );
}

export function RequestSetupPage() {
  const { state } = useLabels();
  const toast = useToast();
  const [tab, setTab] = useState<'list' | 'close' | 'ot'>('list');
  const [days, setDays] = useState(state.deadlineDays);
  const [after, setAfter] = useState(state.otApproveAfter);
  const [adjust, setAdjust] = useState(state.otAdjustByRaw);
  return (
    <div className="card panel">
      <div className="tabs-line">
        <button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>DANH SÁCH CÁC LOẠI ĐƠN</button>
        <button className={tab === 'close' ? 'on' : ''} onClick={() => setTab('close')}>THIẾT LẬP HẠN CHỐT ĐƠN</button>
        <button className={tab === 'ot' ? 'on' : ''} onClick={() => setTab('ot')}>THIẾT LẬP HẠN CHỐT ĐƠN OT</button>
      </div>
      {tab === 'list' && <>
        <p className="hint">Có {state.requestTypeSettings.length} loại đơn trong danh sách</p>
        <DataTable rows={state.requestTypeSettings.map((item, index) => ({ ...item, id: item.type, stt: index + 1 }))} columns={[
          { id: 'stt', header: 'STT', cell: r => r.stt },
          { id: 'name', header: 'Tên loại đơn', cell: r => requestLabel(r.type) },
          { id: 'desc', header: 'Mô tả', cell: r => r.description },
          { id: 'rule', header: 'Quy định tạo đơn', cell: r => r.rule },
          { id: 'st', header: 'Trạng thái', cell: r => <input type="checkbox" checked={r.enabled} aria-label="Bật loại đơn" onChange={e => hr.saveRequestTypeSetting({ ...r, enabled: e.target.checked })} /> },
          { id: 'act', header: 'Tác vụ', cell: r => <button className="icon-btn" aria-label="Sửa" onClick={() => { const rule = window.prompt('Quy định tạo đơn', r.rule); if (rule != null) { hr.saveRequestTypeSetting({ ...r, rule }); toast('Đã lưu'); } }}>✎</button> },
        ]} />
      </>}
      {tab === 'close' && <form className="pad" onSubmit={e => { e.preventDefault(); hr.saveDeadline(days, after, adjust); toast('Đã lưu hạn chốt đơn'); }}>
        <div className="banner">Hạn chốt đơn vào {days} ngày sau ngày chốt công</div>
        <Field label="Số ngày kể từ ngày chốt công"><TextInput type="number" min={0} value={days} onChange={e => setDays(Number(e.target.value))} /></Field>
        <button className="btn-primary">LƯU</button>
      </form>}
      {tab === 'ot' && <form className="pad" onSubmit={e => { e.preventDefault(); hr.saveDeadline(days, after, adjust); toast('Đã lưu hạn chốt OT'); }}>
        <label className="chk"><input type="checkbox" checked={after} onChange={e => setAfter(e.target.checked)} /> Chỉ cho phép duyệt đơn sau ngày đăng ký tăng ca thực tế</label>
        <label className="chk"><input type="checkbox" checked={adjust} onChange={e => setAdjust(e.target.checked)} /> Điều chỉnh giờ OT theo dữ liệu chấm công thực tế</label>
        <button className="btn-primary">LƯU</button>
      </form>}
    </div>
  );
}

export function OtPolicyPage() {
  const { state } = useLabels();
  const toast = useToast();
  const [form, setForm] = useState(state.otPolicy);
  return (
    <form className="card pad-card form-grid" onSubmit={e => { e.preventDefault(); const r = hr.saveOtPolicy(form); toast(r.ok ? 'Đã lưu chính sách OT' : r.errors.form); }}>
      <h3 className="span2">Chính sách OT</h3>
      <Field label="Phương thức tính công/giờ làm thêm" className="span2">{(['don', 'ngay', 'tuan'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={form.method === value} onChange={() => setForm({ ...form, method: value })} />{value === 'don' ? 'Tính công bằng đơn làm thêm giờ' : value === 'ngay' ? 'Tính giờ theo ngày' : 'Tính giờ theo tuần'}</label>)}</Field>
      <Field label="Phương thức tính giờ làm thêm qua đêm" className="span2">{(['tao-don', 'tung-ngay'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={form.overnight === value} onChange={() => setForm({ ...form, overnight: value })} />{value === 'tao-don' ? 'Tính giờ vào ngày tạo đơn' : 'Tính giờ cho từng ngày'}</label>)}</Field>
      <Field label="Đối tượng áp dụng" required className="span2"><TextInput value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} /></Field>
      <Field label="Nghỉ lễ %"><TextInput type="number" value={form.holidayRate} onChange={e => setForm({ ...form, holidayRate: Number(e.target.value) })} /></Field>
      <Field label="Ngày không có ca %"><TextInput type="number" value={form.noShiftRate} onChange={e => setForm({ ...form, noShiftRate: Number(e.target.value) })} /></Field>
      <Field label="Ngày cuối tuần %"><TextInput type="number" value={form.weekendRate} onChange={e => setForm({ ...form, weekendRate: Number(e.target.value) })} /></Field>
      <Field label="Ngày thường %"><TextInput type="number" value={form.weekdayRate} onChange={e => setForm({ ...form, weekdayRate: Number(e.target.value) })} /></Field>
      <Field label="Hình thức thanh toán" className="span2">{(['rate', 'rate-day', 'limit'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={form.payMode === value} onChange={() => setForm({ ...form, payMode: value })} />{value === 'rate' ? 'Trả lương theo tỉ lệ' : value === 'rate-day' ? 'Theo tỉ lệ và theo ngày' : 'Theo giới hạn'}</label>)}</Field>
      <Field label="Trả lương tăng ca %"><TextInput type="number" value={form.payPercent} onChange={e => setForm({ ...form, payPercent: Number(e.target.value) })} /></Field>
      <Field label="Nghỉ bù tăng ca %"><TextInput type="number" value={form.compPercent} onChange={e => setForm({ ...form, compPercent: Number(e.target.value) })} /></Field>
      <Field label="Tối đa số đơn / tháng"><TextInput type="number" value={form.maxOrdersPerMonth} onChange={e => setForm({ ...form, maxOrdersPerMonth: Number(e.target.value) })} /></Field>
      <Field label="Tối đa số giờ / ngày"><TextInput type="number" value={form.dailyHourCap} onChange={e => setForm({ ...form, dailyHourCap: Number(e.target.value) })} /></Field>
      <Field label="Trần giờ / tháng"><TextInput type="number" value={form.monthlyHourCap} onChange={e => setForm({ ...form, monthlyHourCap: Number(e.target.value) })} /></Field>
      <label className="chk"><input type="checkbox" checked={form.requirePhoto} onChange={e => setForm({ ...form, requirePhoto: e.target.checked })} /> Bắt buộc upload ảnh đính kèm</label>
      <label className="chk"><input type="checkbox" checked={form.noOverlapShift} onChange={e => setForm({ ...form, noOverlapShift: e.target.checked })} /> Không cho phép tạo đơn OT trùng với ca làm việc</label>
      <Field label="Quy định tạo đơn" className="span2"><TextArea value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} /></Field>
      <div className="form-actions span2"><button className="btn-primary">Lưu</button></div>
    </form>
  );
}

export function OtThresholdPage() {
  const { state } = useLabels();
  const [open, setOpen] = useState<Omit<OtThreshold, 'id'> | null>(null);
  return (
    <div>
      <div className="toolbar card flat"><div className="grow" /><button className="btn-primary" onClick={() => setOpen({ name: '', effectiveDate: todayISO(), wholeWorkspace: true, scope: 'Toàn workspace', daily: 4, weekly: 12, monthly: 40, yearly: 200, warnDaily: 80, warnWeekly: 80, warnMonthly: 80, email: true, onExceed: true, recipients: ['Nhân viên liên quan', 'Quản lý trực tiếp'], extraRecipients: '', frequency: 'Hằng ngày', isDefault: false })}>+ THÊM CẤU HÌNH</button></div>
      {state.otThresholds.map(item => <article className="card" key={item.id}><h3>{item.name} {item.isDefault && <span className="pill">MẶC ĐỊNH</span>}</h3><p>Đối tượng áp dụng: {item.scope}</p><p>Trần giờ OT: Ngày {item.daily}h, Tuần {item.weekly}h, Tháng {item.monthly}h, Năm {item.yearly}h</p><p>Cảnh báo sớm: {item.warnDaily}% / {item.warnWeekly}% / {item.warnMonthly}%</p><p>Email {item.email ? 'Bật' : 'Tắt'} · Vượt trần {item.onExceed ? 'Bật' : 'Tắt'} · {item.frequency}</p><p>Người nhận: {item.recipients.join(', ')}</p><button className="btn-ghost btn-sm" onClick={() => setOpen(item)}>Chỉnh sửa</button></article>)}
      {open && <ThresholdDrawer initial={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ThresholdDrawer({ initial, onClose }: { initial: Omit<OtThreshold, 'id'> & { id?: string }; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  return (
    <Drawer title={form.id ? 'Sửa cấu hình' : 'Thêm cấu hình'} onClose={onClose} wide footer={<><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary" onClick={() => { const { id, ...rest } = form; const r = hr.saveOtThreshold(rest, id); toast(r.ok ? 'Đã lưu cấu hình' : r.errors.name); if (r.ok) onClose(); }}>Lưu</button></>}>
      <div className="form-grid">
        <p className="section-title">Thông tin chung</p>
        <Field label="Tên cấu hình" required><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Ngày áp dụng hiệu lực" required><TextInput type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} /></Field>
        <p className="section-title">Đối tượng áp dụng</p>
        <label className="chk span2"><input type="checkbox" checked={form.wholeWorkspace} onChange={e => setForm({ ...form, wholeWorkspace: e.target.checked, scope: e.target.checked ? 'Toàn workspace' : form.scope })} /> Áp dụng toàn workspace</label>
        <p className="section-title">Ngưỡng OT</p>
        <Field label="Trần giờ/ngày"><TextInput type="number" value={form.daily} onChange={e => setForm({ ...form, daily: Number(e.target.value) })} /></Field>
        <Field label="Trần giờ/tuần"><TextInput type="number" value={form.weekly} onChange={e => setForm({ ...form, weekly: Number(e.target.value) })} /></Field>
        <Field label="Trần giờ/tháng"><TextInput type="number" value={form.monthly} onChange={e => setForm({ ...form, monthly: Number(e.target.value) })} /></Field>
        <Field label="Trần giờ/năm"><TextInput type="number" value={form.yearly} onChange={e => setForm({ ...form, yearly: Number(e.target.value) })} /></Field>
        <p className="section-title">Cảnh báo và thông báo</p>
        <label className="chk"><input type="checkbox" checked={form.email} onChange={e => setForm({ ...form, email: e.target.checked })} /> Email</label>
        <label className="chk"><input type="checkbox" checked={form.onExceed} onChange={e => setForm({ ...form, onExceed: e.target.checked })} /> Cảnh báo khi vượt trần</label>
        <Field label="Tuần %"><TextInput type="number" value={form.warnWeekly} onChange={e => setForm({ ...form, warnWeekly: Number(e.target.value) })} /></Field>
        <Field label="Tháng %"><TextInput type="number" value={form.warnMonthly} onChange={e => setForm({ ...form, warnMonthly: Number(e.target.value) })} /></Field>
        <Field label="Năm %"><TextInput type="number" value={form.warnDaily} onChange={e => setForm({ ...form, warnDaily: Number(e.target.value) })} /></Field>
        <Field label="Người nhận bổ sung"><TextInput value={form.extraRecipients} onChange={e => setForm({ ...form, extraRecipients: e.target.value })} /></Field>
        <Field label="Tần suất"><Select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option>Hằng ngày</option><option>Hằng tuần</option></Select></Field>
      </div>
    </Drawer>
  );
}

export function ReasonPage() {
  const { state } = useLabels();
  const toast = useToast();
  const ask = useConfirm();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [active, setActive] = useState('');
  const [editing, setEditing] = useState<Partial<RequestReason> | null>(null);
  const rows = useMemo(() => state.requestReasons.filter(r => includesPlain([r.code, r.name].join(' '), q) && (!type || r.type === type) && (!active || String(r.active) === active)), [state.requestReasons, q, type, active]);
  async function remove(row: RequestReason) {
    const yes = await ask({ title: 'Xóa lý do', message: row.name, confirmLabel: 'Xóa', danger: true });
    if (!yes) return;
    const result = hr.deleteReason(row.id);
    toast(result.ok ? 'Đã xóa' : result.errors.form);
  }
  const columns: Column<RequestReason>[] = [
    { id: 'code', header: 'Mã lý do', sort: r => r.code, cell: r => r.code },
    { id: 'name', header: 'Tên lý do', sort: r => r.name, cell: r => r.name },
    { id: 'type', header: 'Loại đơn', sort: r => requestLabel(r.type), cell: r => requestLabel(r.type) },
    { id: 'days', header: 'Số ngày tối đa', cell: r => r.maxDays },
    { id: 'orders', header: 'Số đơn tối đa', cell: r => r.maxOrders },
    { id: 'work', header: 'Số công tối đa', cell: r => r.maxWork },
    { id: 'st', header: 'Trạng thái hoạt động', cell: r => <input type="checkbox" checked={r.active} aria-label="Trạng thái" onChange={e => hr.saveReason({ ...r, active: e.target.checked }, r.id)} /> },
    { id: 'act', header: 'Tác vụ', cell: r => <div className="row-actions"><button className="icon-btn" aria-label="Sửa" onClick={() => setEditing(r)}>✎</button><button className="icon-btn" aria-label="Thông tin" onClick={() => setEditing(r)}>ℹ</button><button className="icon-btn" onClick={() => void remove(r)}>✕</button></div> },
  ];
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm lý do" placeholder="Nhập mã lý do, tên lý do" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Select aria-label="Loại đơn" value={type} onChange={e => setType(e.target.value)}><option value="">Loại đơn</option>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
        <Select aria-label="Trạng thái hoạt động" value={active} onChange={e => setActive(e.target.value)}><option value="">Trạng thái hoạt động</option><option value="true">Đang bật</option><option value="false">Đang tắt</option></Select>
        <div className="grow" /><button className="btn-primary" onClick={() => setEditing({ code: '', name: '', type: 'nghi-phep', active: true, maxDays: 'Không giới hạn', maxOrders: 'Không giới hạn', maxWork: 'Không giới hạn', requireAttachment: false, pay: 'use-leave' })}>+ Thêm mới</button>
      </div>
      <DataTable rows={rows} columns={columns} filterKey={`${q}|${type}|${active}`} />
      {editing && <ReasonModal initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ReasonModal({ initial, onClose }: { initial: Partial<RequestReason>; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ code: '', name: '', type: 'nghi-phep' as TimeRequestType, active: true, maxDays: 'Không giới hạn', maxOrders: 'Không giới hạn', maxWork: 'Không giới hạn', requireAttachment: false, pay: 'use-leave' as const, ...initial });
  return (
    <div className="modal-back" onMouseDown={onClose}><div className="modal wide" onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Lý do">
      <header><b>{form.id ? 'Chi tiết lý do' : 'Thêm mới lý do'}</b><button className="icon-btn" onClick={onClose}>✕</button></header>
      <form onSubmit={e => { e.preventDefault(); const r = hr.saveReason(form, form.id); if (!r.ok) { toast(r.errors.name || r.errors.form); return; } toast('Đã lưu lý do'); onClose(); }}>
        <div className="form-grid">
          <label className="chk span2"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Trạng thái hoạt động</label>
          <Field label="Mã lý do" required><TextInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Tên lý do" required><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Loại đơn" required><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TimeRequestType })}>{REQUEST_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field>
          <label className="chk"><input type="checkbox" checked={form.requireAttachment} onChange={e => setForm({ ...form, requireAttachment: e.target.checked })} /> Bắt buộc upload ảnh đính kèm</label>
          <Field label="Thông tin tính công" className="span2">{(['use-leave', 'paid-no-leave', 'unpaid'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={form.pay === value} onChange={() => setForm({ ...form, pay: value })} />{value === 'unpaid' ? 'Không tính công' : value === 'use-leave' ? 'Có tính công · Nghỉ có lương dùng phép' : 'Có tính công · Nghỉ có lương không dùng phép'}</label>)}</Field>
          <Field label="Số ngày tối đa"><TextInput value={form.maxDays} onChange={e => setForm({ ...form, maxDays: e.target.value })} /></Field>
          <Field label="Số công tối đa"><TextInput value={form.maxWork} onChange={e => setForm({ ...form, maxWork: e.target.value })} /></Field>
          <Field label="Số đơn tối đa"><TextInput value={form.maxOrders} onChange={e => setForm({ ...form, maxOrders: e.target.value })} /></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy bỏ</button><button className="btn-primary">Lưu</button></div>
      </form>
    </div></div>
  );
}

export function ProcedurePage() {
  const { state } = useLabels();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const rows = state.requestProcedures.filter(item => includesPlain(item.name, q)).map((item, index) => ({ ...item, stt: index + 1 }));
  return (
    <div className="card panel">
      <div className="toolbar">
        <div className="in-search">🔍<input aria-label="Tìm quy trình" placeholder="Nhập tên quy trình" value={q} onChange={e => setQ(e.target.value)} /></div>
        <span className="muted">Đối tượng áp dụng</span><span className="muted">Danh sách các loại đơn</span>
        <button className="btn-ghost">XEM TRƯỚC QUY TRÌNH</button>
        <div className="grow" /><button className="btn-primary" onClick={() => setCreating(true)}>+ Thêm quy trình</button>
      </div>
      <DataTable rows={rows} columns={[
        { id: 'stt', header: 'STT', cell: r => r.stt },
        { id: 'name', header: 'Tên quy trình', sort: r => r.name, cell: r => r.name },
        { id: 'scope', header: 'Bộ phận được áp dụng', cell: r => r.scope },
        { id: 'steps', header: 'Các cấp duyệt', cell: r => r.steps.map(step => step.role).join(' → ') },
        { id: 'types', header: 'Loại đơn áp dụng', cell: r => r.types.slice(0, 3).map(type => <span key={type} className="chip">{requestLabel(type)}</span>) },
        { id: 'watch', header: 'Người theo dõi', cell: r => r.followers.join(', ') },
        { id: 'more', header: '', cell: () => <button className="btn-ghost btn-sm" title="Menu ⋯ chưa được mô tả trong ghi chú">⋯</button> },
      ]} filterKey={q} />
      {creating && <ProcedureCreate onClose={() => setCreating(false)} />}
    </div>
  );
}

function ProcedureCreate({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [scope, setScope] = useState('Toàn công ty');
  const [skip, setSkip] = useState(false);
  const [sla, setSla] = useState(2);
  const [mode, setMode] = useState<'all' | 'no-sun' | 'no-weekend'>('no-weekend');
  const [types, setTypes] = useState<TimeRequestType[]>(['nghi-phep']);
  function save() {
    const result = hr.saveProcedure({
      id: 'qt-' + Date.now(), name, scope, types, followers: [USER.name],
      steps: [{ order: 1, role: 'Quản lý trực tiếp', fromDays: 0, toDays: 'Không giới hạn', skipSla: skip, slaAmount: sla, slaMode: mode }],
    });
    toast(result.ok ? 'Đã thêm quy trình' : result.errors.form);
    if (result.ok) onClose();
  }
  return (
    <Drawer title="Thêm quy trình" onClose={onClose} wide footer={<><button className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary" onClick={save}>Lưu</button></>}>
      <div className="form-grid">
        <Field label="Tên quy trình" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Áp dụng cho" required><Select value={scope} onChange={e => setScope(e.target.value)}><option>Toàn công ty</option><option>Đơn vị</option><option>Vị trí công việc</option><option>Nhân viên</option></Select></Field>
        <div className="mini-card span2"><h4>1. Cấp duyệt</h4>
          <label className="chk"><input type="checkbox" defaultChecked /> Quản lý trực tiếp</label>
          <p>Cấp duyệt cho đơn có thời gian áp dụng từ 0 ngày đến không giới hạn.</p>
          <p className="section-title">Bỏ qua cấp duyệt khi quá SLA</p>
          <label className="chk"><input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} /> Bỏ qua khi quá SLA</label>
          <Field label="Thời gian SLA"><TextInput type="number" value={sla} onChange={e => setSla(Number(e.target.value))} /></Field>
          {(['all', 'no-sun', 'no-weekend'] as const).map(value => <label key={value} className="chk"><input type="radio" checked={mode === value} onChange={() => setMode(value)} />{value === 'all' ? 'Tất cả ngày trong tuần' : value === 'no-sun' ? 'Trừ Chủ nhật' : 'Trừ Thứ 7 và Chủ nhật'}</label>)}
        </div>
        <Field label="Loại đơn áp dụng" className="span2">{REQUEST_TYPES.map(item => <label key={item.id} className="chk"><input type="checkbox" checked={types.includes(item.id)} onChange={e => setTypes(current => e.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />{item.label}</label>)}</Field>
      </div>
    </Drawer>
  );
}

export function DelegationPage() {
  const { state } = useLabels();
  const toast = useToast();
  const ask = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<ApprovalDelegation, 'id'>>({ fromName: '', toName: USER.name, startDate: todayISO(), endDate: todayISO(), types: [], active: true });
  const names = [...new Set(state.employees.map(e => e.fullName).concat(USER.name))];
  return (
    <div className="card panel">
      <div className="toolbar"><div className="grow" /><button className="btn-primary" onClick={() => setOpen(true)}>+ Thêm ủy quyền</button></div>
      <DataTable rows={state.delegations} columns={[
        { id: 'from', header: 'Người ủy quyền', sort: r => r.fromName, cell: r => r.fromName },
        { id: 'to', header: 'Người nhận', sort: r => r.toName, cell: r => r.toName },
        { id: 'when', header: 'Thời gian', cell: r => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
        { id: 'types', header: 'Loại đơn', cell: r => r.types.length ? r.types.map(requestLabel).join(', ') : 'Mọi loại' },
        { id: 'act', header: '', cell: r => <button className="btn-ghost btn-sm" onClick={() => void (async () => { const yes = await ask({ title: 'Xóa ủy quyền', message: r.fromName, confirmLabel: 'Xóa', danger: true }); if (yes) { hr.deleteDelegation(r.id); toast('Đã xóa'); } })()}>Xóa</button> },
      ]} />
      {open && <Drawer title="Ủy quyền duyệt" onClose={() => setOpen(false)} footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary" onClick={() => { const r = hr.saveDelegation(form); if (!r.ok) { toast(r.errors.form || r.errors.endDate); return; } toast('Đã lưu'); setOpen(false); }}>Lưu</button></>}>
        <div className="form-grid">
          <Field label="Người ủy quyền"><Select value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })}><option value="">Chọn</option>{names.map(name => <option key={name}>{name}</option>)}</Select></Field>
          <Field label="Người nhận"><Select value={form.toName} onChange={e => setForm({ ...form, toName: e.target.value })}>{names.map(name => <option key={name}>{name}</option>)}</Select></Field>
          <Field label="Từ ngày"><TextInput type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Đến ngày"><TextInput type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
      </Drawer>}
    </div>
  );
}
