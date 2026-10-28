import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable, type Column } from '../../components/DataTable';
import { Drawer, FilterPanel } from '../../components/Drawer';
import { Field, Select, TextArea, TextInput } from '../../components/Fields';
import { useToast } from '../../components/feedback';
import { evalStore, useEval } from '../../data/eval/store';
import { gradeFor, totalPercent, weightSum } from '../../data/eval/score';
import type { Criterion, CriterionRef, CustomField, EvalForm, EvalPeriod, EvalStatus, FlowStep, GradeBand, ScoreKind } from '../../data/eval/types';
import { USER } from '../../data/session';
import { fmtDate, includesPlain, todayISO } from '../../data/text';
import { useLabels } from '../hr/lookups';

const GROUP_TONE: Record<string, string> = { 'gr-1': 'ok', 'gr-2': '', 'gr-3': 'bad' };

function WeightNote({ rows }: { rows: { weight: number; counted?: boolean }[] }) {
  const total = weightSum(rows);
  const gap = Math.round((100 - total) * 10) / 10;
  return <p>Tổng trọng số: {total}% / 100%. {gap === 0 ? 'Đủ 100%' : gap > 0 ? `Còn thiếu ${gap}%` : `Thừa ${-gap}%`}. Tỉ trọng = % đóng góp vào điểm tổng hợp.</p>;
}

export function EvalOverview() {
  const nav = useNavigate();
  const cards = [
    ['Sử dụng tiêu chí', 'Nhân viên', 'Áp dụng mẫu → Tạo phiếu đánh giá → Theo dõi kết quả', '/m/danh-gia/mau-danh-gia'],
    ['Tiêu chí và nhóm', 'Admin', 'Nhóm tiêu chí, tiêu chí, loại và thang điểm', '/m/danh-gia/tieu-chi'],
    ['Mẫu đánh giá', 'Admin', 'Cấu hình tiêu chí, đối tượng, trạng thái', '/m/danh-gia/mau-danh-gia'],
    ['Kỳ đánh giá', 'Admin/Quản lý', 'Tên, thời gian, mẫu, danh sách nhân viên', '/m/danh-gia/ky-tat-ca'],
    ['Phiếu đánh giá', 'Nhân viên/Quản lý', 'Của tôi, cần đánh giá, cần duyệt', '/m/danh-gia/phieu-cua-toi'],
    ['Theo dõi và kết quả', 'Quản lý/HR', 'Tiến độ, kết quả tổng hợp, tất cả phiếu', '/m/danh-gia/phieu-theo-doi'],
  ] as const;
  return <div className="feature-grid">{cards.map(([title, role, body, to]) => <article key={title} className="card"><span className="pill">{role}</span><h3>{title}</h3><p>{body}</p><button className="btn-primary" onClick={() => nav(to)}>Xem</button></article>)}</div>;
}

export function KpiList({ view }: { view: 'all' | 'setup' | 'approve' | 'watch' }) {
  const data = useEval();
  const titles = { all: 'Danh sách kỳ thiết lập KPI', setup: 'Cần thiết lập mục tiêu KPI', approve: 'Cần duyệt mục tiêu KPI', watch: 'Theo dõi thiết lập mục tiêu KPI' };
  const rows = data.kpiSetups.filter(row => view === 'all' || (view === 'setup' ? row.status === 'Đã phát hành' : view === 'approve' ? row.approve : true));
  const nav = useNavigate();
  return <div className="card panel"><h2>{titles[view]}</h2><div className="toolbar">{view === 'all' && <button className="btn-primary" onClick={() => nav('/m/danh-gia/kpi-tat-ca/tao')}>Thêm mới</button>}</div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Tên kỳ thiết lập KPI', cell: r => r.name }, { id: 'start', header: 'Ngày bắt đầu', cell: r => fmtDate(r.start) }, { id: 'due', header: 'Hạn hoàn thành', cell: r => fmtDate(r.due) }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'lock', header: 'Tiến độ khóa KPI', cell: r => r.employeeIds.length + ' người' }]} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" /></div>;
}

export function KpiCreate() {
  const data = useEval();
  const labels = useLabels();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [start, setStart] = useState(todayISO());
  const [due, setDue] = useState(todayISO());
  const [templateId, setTemplateId] = useState(data.templates[0]?.id || '');
  const [fileMode, setFileMode] = useState(false);
  const [approve, setApprove] = useState(true);
  const [ids, setIds] = useState<string[]>([]);
  const [pick, setPick] = useState('');
  function save(publish: boolean) {
    if (!name.trim()) { toast('Nhập tên kỳ.'); return; }
    evalStore.saveKpi({ name, start, due, templateId, selfFill: !fileMode, approve, employeeIds: ids }, publish);
    toast(publish ? 'Đã phát hành' : 'Đã lưu nháp');
    nav('/m/danh-gia/kpi-tat-ca');
  }
  return <div className="card pad-card"><h2>Tạo thiết lập KPI</h2>
    <div className="form-grid">
      <Field label="Tên kỳ thiết lập KPI" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Ngày bắt đầu áp dụng" required><TextInput type="date" value={start} onChange={e => setStart(e.target.value)} /></Field>
      <Field label="Hạn hoàn thành" required><TextInput type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
      <Field label="Mẫu đánh giá"><Select value={templateId} onChange={e => setTemplateId(e.target.value)}>{data.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
    </div>
    <h3>Các cấp thiết lập KPI</h3>
    <div className="seg"><button type="button" className={!fileMode ? 'on' : ''} onClick={() => setFileMode(false)}>Tự điền</button><button type="button" className={fileMode ? 'on' : ''} onClick={() => setFileMode(true)}>Nhập từ file</button></div>
    <p>Cấp 1 — Thiết lập KPI · Đối tượng: Nhân viên tự cài đặt · Hạn {fmtDate(due)}</p>
    <p>Cấp 2 · Quản lý trực tiếp · Hạn {fmtDate(due)}</p>
    <button className="btn-ghost" type="button" onClick={() => toast('Thêm cấp: vai trò cấp sau chưa có danh sách ngoài hai cấp đã nêu.')}>Thêm cấp thiết lập KPI</button>
    <h3>Các cấp duyệt KPI</h3>
    <label className="chk"><input type="checkbox" checked={approve} onChange={e => setApprove(e.target.checked)} /> Có bước duyệt</label>
    {approve && <p>Cấp 1 — Duyệt KPI · Quản lý trực tiếp duyệt · Người duyệt cố định</p>}
    <h3>Nhân viên tham gia kỳ thiết lập KPI ({ids.length} người)</h3>
    <div className="toolbar"><button className="btn-ghost" type="button" onClick={() => toast('Import người cài đặt: mẫu cột chưa có trong ghi chú.')}>Import người cài đặt & duyệt</button>
      <Select aria-label="Thêm nhân viên" value={pick} onChange={e => { setPick(e.target.value); if (e.target.value) setIds(cur => cur.includes(e.target.value) ? cur : [...cur, e.target.value]); }}><option value="">Thêm nhân viên</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></div>
    {!ids.length ? <p>Chưa có nhân viên tham gia</p> : <table className="tbl"><thead><tr><th>Nhân viên</th><th>Đơn vị</th><th>Vị trí</th><th>Quản lý trực tiếp</th></tr></thead><tbody>{ids.map(id => { const emp = labels.employee(id); return <tr key={id}><td>{emp?.fullName}</td><td>{labels.unit(emp?.unitId || '')}</td><td>{labels.position(emp?.positionId || '')}</td><td>{labels.employee(emp?.managerId || '')?.fullName || '—'}</td></tr>; })}</tbody></table>}
    <div className="form-actions"><button className="btn-ghost" onClick={() => nav(-1)}>Hủy</button><button className="btn-ghost" onClick={() => save(false)}>Lưu nháp</button><button className="btn-primary" onClick={() => save(true)}>Phát hành</button></div>
  </div>;
}

export function PeriodList({ view }: { view: 'all' | 'evaluate' | 'approve' | 'watch' }) {
  const data = useEval();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(false);
  const [cycle, setCycle] = useState('');
  const rows = data.periods.filter(row => includesPlain(row.name, view === 'all' ? q : '') && (!cycle || row.cycle === cycle) && (view === 'all' || row.status !== 'Nháp'));
  return <div className="card panel"><h2>{view === 'watch' ? 'Theo dõi kỳ đánh giá' : 'Kỳ đánh giá'}</h2>
    <div className="toolbar">{view === 'all' && <input className="control" placeholder="Tìm tên kỳ đánh giá..." aria-label="Tìm kỳ" value={q} onChange={e => setQ(e.target.value)} />}<button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc</button>{view === 'all' && <button className="btn-primary" onClick={() => nav('/m/danh-gia/ky-tat-ca/tao')}>Thêm mới</button>}</div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Tên kỳ đánh giá', cell: r => r.name }, { id: 'span', header: 'Kỳ đánh giá', cell: r => `${r.year} · ${r.span}` }, { id: 'due', header: 'Hạn đánh giá', cell: r => fmtDate(r.due) }, { id: 'tpl', header: 'Mẫu đánh giá', cell: r => data.templates.find(t => t.id === r.templateId)?.name || '—' }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'prog', header: 'Tiến độ', cell: r => { const forms = data.forms.filter(f => f.periodId === r.id); const done = forms.filter(f => f.status === 'Đã duyệt' || f.status === 'Chờ duyệt').length; return forms.length ? `${done}/${forms.length}` : '—'; } }, { id: 'act', header: 'Thao tác', cell: r => <button className="btn-ghost btn-sm" onClick={() => nav('/m/danh-gia/phieu-tat-ca')}>Phiếu</button> }]} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" filterKey={q + cycle} />
    {filter && <FilterPanel title="Bộ lọc" onClose={() => setFilter(false)} onClear={() => setCycle('')}><Field label="Loại kỳ"><Select value={cycle} onChange={e => setCycle(e.target.value)}><option value="">Tất cả loại kỳ</option><option>Theo tháng</option><option>Theo quý</option><option>Theo nửa năm</option><option>Theo năm</option></Select></Field><Field label="Tháng/Quý/Nửa năm"><Select disabled={!cycle}><option>{cycle || 'Chọn loại kỳ trước'}</option></Select></Field><Field label="Năm đánh giá"><TextInput defaultValue="2026" /></Field><Field label="Hạn đánh giá"><Select><option>Tất cả thời hạn</option><option>Quá hạn</option><option>Tuần này</option></Select></Field><p className="muted">Nhãn Quá hạn / Tuần này chưa được xác nhận trong ghi chú.</p></FilterPanel>}
  </div>;
}

const emptyStep = (): FlowStep => ({ role: 'Quản lý trực tiếp đánh giá', weight: 100, deadline: '', person: '' });

export function PeriodCreate() {
  const data = useEval();
  const labels = useLabels();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('Kỳ đánh giá nửa cuối năm 2026');
  const [due, setDue] = useState(todayISO());
  const [allowLate, setAllowLate] = useState(false);
  const [allowOverride, setAllowOverride] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [year, setYear] = useState('2026');
  const [cycle, setCycle] = useState('Theo nửa năm');
  const [span, setSpan] = useState('Nửa cuối năm');
  const [shared, setShared] = useState(true);
  const [templateId, setTemplateId] = useState(data.templates[0]?.id || '');
  const [resultMode, setResultMode] = useState('Có tính theo trọng số');
  const [kpiMode, setKpiMode] = useState('Không cho phép vượt 100%');
  const [steps, setSteps] = useState<FlowStep[]>([emptyStep()]);
  const [approvalOn, setApprovalOn] = useState(true);
  const [approvals, setApprovals] = useState<FlowStep[]>([{ role: 'Quản lý trực tiếp', weight: 0, deadline: '', person: '' }]);
  const [ids, setIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<CriterionRef[]>(data.templates[0]?.criteria || []);
  const [grades, setGrades] = useState<GradeBand[]>(data.templates[0]?.grades || evalStore.defaultGrades);
  const [fields, setFields] = useState<CustomField[]>([]);
  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = data.templates.find(item => item.id === id);
    if (!tpl) return;
    setCriteria(tpl.criteria);
    setGrades(tpl.grades);
    setSteps(tpl.evalSteps);
    setApprovals(tpl.approvalSteps);
    setResultMode(tpl.resultMode);
    setKpiMode(tpl.kpiMode);
  }
  function save(publish: boolean) {
    if (weightSum(criteria) !== 100 || weightSum(steps) !== 100) { toast('Trọng số tiêu chí và cấp đánh giá phải bằng 100%.'); return; }
    if (publish && !ids.length) { toast('Thêm nhân viên trước khi phát hành.'); return; }
    const id = evalStore.savePeriod({ name, due, year, cycle, span, templateId, resultMode, kpiMode, allowLate, allowOverride, allowEdit, sharedTemplate: shared, watchers: [USER.name], evalSteps: steps, approvalOn, approvalSteps: approvals, criteria, grades, fields, employeeIds: ids }, publish);
    toast(publish ? `Đã tạo ${ids.length} phiếu đánh giá` : 'Đã lưu nháp');
    nav(publish ? '/m/danh-gia/phieu-tat-ca' : '/m/danh-gia/ky-tat-ca');
    return id;
  }
  return <div className="card pad-card"><h2>Tạo kỳ đánh giá</h2>
    <h3>Thông tin chung</h3>
    <div className="form-grid">
      <Field label="Tên kỳ đánh giá" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Hạn đánh giá" required><TextInput type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
      <label className="chk"><input type="checkbox" checked={allowLate} onChange={e => setAllowLate(e.target.checked)} /> Cho phép đánh giá khi quá hạn</label>
      <label className="chk"><input type="checkbox" checked={allowOverride} onChange={e => setAllowOverride(e.target.checked)} /> Cho phép cấp duyệt ghi đè đánh giá</label>
      <label className="chk"><input type="checkbox" checked={allowEdit} onChange={e => setAllowEdit(e.target.checked)} /> Cho phép sửa kết quả sau khi gửi</label>
      <Field label="Năm"><TextInput value={year} onChange={e => setYear(e.target.value)} /></Field>
      <Field label="Loại kỳ"><Select value={cycle} onChange={e => setCycle(e.target.value)}><option>Theo tháng</option><option>Theo quý</option><option>Theo nửa năm</option><option>Theo năm</option></Select></Field>
      <Field label="Kỳ"><TextInput value={span} onChange={e => setSpan(e.target.value)} /></Field>
    </div>
    <p><span className="pill">MỚI</span> Cách áp dụng mẫu đánh giá *</p>
    <div className="feature-grid">
      <button type="button" className={'feature' + (shared ? ' on' : '')} onClick={() => setShared(true)}><b>① Dùng chung 1 mẫu cho toàn bộ kỳ</b><small>Tất cả nhân viên tham gia dùng chung 1 mẫu đánh giá, giống cách làm hiện tại.</small></button>
      <button type="button" className={'feature' + (!shared ? ' on' : '')} onClick={() => setShared(false)}><b>② Tự thiết lập KPI riêng cho từng nhân viên</b><small>Quản lý trực tiếp set KPI cho từng người. Người chưa có KPI sẽ dùng mẫu mặc định.</small></button>
    </div>
    <Field label="Mẫu đánh giá"><Select value={templateId} onChange={e => applyTemplate(e.target.value)}>{data.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
    <p className="muted">Nhân viên tham gia kỳ đánh giá sẽ được lấy theo mẫu đánh giá đã chọn.</p>
    <Field label="Người theo dõi"><TextInput defaultValue={USER.name} /></Field>
    <Field label="Cách tính kết quả tổng hợp"><Select value={resultMode} onChange={e => setResultMode(e.target.value)}><option>Có tính theo trọng số</option><option>Không tính theo trọng số</option></Select></Field>
    <Field label="Cách tính kết quả tiêu chí KPI"><Select value={kpiMode} onChange={e => setKpiMode(e.target.value)}><option>Không cho phép vượt 100%</option><option>Cho phép vượt 100%</option></Select></Field>
    <h3>Cài đặt quy trình đánh giá</h3>
    <p>Thứ tự đánh giá: Lần lượt</p>
    {steps.map((step, index) => <div key={index} className="mini-card"><b>Cấp {index + 1}</b><Field label="Đối tượng đánh giá"><TextInput value={step.role} onChange={e => setSteps(cur => cur.map((row, i) => i === index ? { ...row, role: e.target.value } : row))} /></Field><Field label="Tỉ trọng %"><TextInput type="number" value={step.weight} onChange={e => setSteps(cur => cur.map((row, i) => i === index ? { ...row, weight: Number(e.target.value) } : row))} /></Field></div>)}
    <WeightNote rows={steps} />
    <button className="btn-ghost" type="button" onClick={() => setSteps(cur => [...cur, { role: 'Cấp song song', weight: 0, deadline: '', person: '' }])}>Thêm cấp song song</button>
    <button className="btn-ghost" type="button" onClick={() => setSteps(cur => [...cur, { role: 'Quản lý cấp trên', weight: 0, deadline: '', person: '' }])}>Thêm cấp đánh giá</button>
    <h3>Quy trình duyệt kết quả</h3>
    <label className="chk"><input type="checkbox" checked={approvalOn} onChange={e => setApprovalOn(e.target.checked)} /> Bật quy trình duyệt</label>
    {approvalOn && approvals.map((step, index) => <p key={index}>Bước duyệt {index + 1}: {step.role} · {step.person || 'Người duyệt'}</p>)}
    <p>{approvals.length} bước duyệt · Duyệt lần lượt</p>
    <h3>Danh sách nhân viên tham gia kỳ đánh giá ({ids.length} người)</h3>
    <Select aria-label="Thêm nhân viên" value="" onChange={e => { if (e.target.value) setIds(cur => cur.includes(e.target.value) ? cur : [...cur, e.target.value]); }}><option value="">Thêm nhân viên</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select>
    {!ids.length ? <p>Chưa có nhân viên tham gia. Nhấn "Thêm nhân viên" để bắt đầu.</p> : <table className="tbl"><thead><tr><th></th><th>Nhân viên</th><th>Đơn vị</th><th>Chức vụ</th></tr></thead><tbody>{ids.map(id => { const emp = labels.employee(id); return <tr key={id}><td><input type="checkbox" checked readOnly aria-label={emp?.fullName} /></td><td>{emp?.fullName}</td><td>{labels.unit(emp?.unitId || '')}</td><td>{labels.position(emp?.positionId || '')}</td></tr>; })}</tbody></table>}
    <p>Hiển thị {ids.length} / {ids.length} nhân viên</p>
    <h3>Nội dung đánh giá</h3>
    <CriteriaTable criteria={criteria} catalog={data.criteria} onChange={setCriteria} />
    <h3>Kết quả tổng hợp</h3>
    <label className="chk"><input type="radio" defaultChecked name="grade" /> Tính theo tỷ lệ %</label>
    <label className="chk"><input type="radio" name="grade" /> Tính theo điểm thực tế đạt được</label>
    <table className="tbl"><thead><tr><th>Màu</th><th>Tên mức xếp loại</th><th>Từ %</th><th>Đến %</th></tr></thead><tbody>{grades.map((band, index) => <tr key={band.name}><td><input aria-label="Màu" type="color" value={band.color} onChange={e => setGrades(cur => cur.map((row, i) => i === index ? { ...row, color: e.target.value } : row))} /></td><td>{band.name}</td><td>{band.from}</td><td>{band.to}</td></tr>)}</tbody></table>
    <p>0–59 → Cần cải thiện · 60–79 → Đạt · 80–100 → Xuất sắc</p>
    <h3>Trường thông tin tùy chỉnh</h3>
    {fields.map((field, index) => <p key={index}>{field.name} · {field.type}</p>)}
    <button className="btn-ghost" type="button" onClick={() => setFields(cur => [...cur, { name: 'Nhận xét', type: 'Văn bản dài', required: false }])}>Thêm trường</button>
    <div className="form-actions"><button className="btn-ghost" onClick={() => nav(-1)}>Hủy</button><button className="btn-ghost" onClick={() => save(false)}>Lưu nháp</button><button className="btn-primary" onClick={() => save(true)}>Phát hành</button></div>
  </div>;
}

function CriteriaTable({ criteria, catalog, onChange }: { criteria: CriterionRef[]; catalog: Criterion[]; onChange: (rows: CriterionRef[]) => void }) {
  return <div>
    <table className="tbl"><thead><tr><th>#</th><th>Tiêu chí đánh giá</th><th>Mục tiêu cần đạt</th><th>Trọng số (%)</th><th>Tính vào tổng điểm</th></tr></thead><tbody>
      {criteria.map((row, index) => <tr key={row.criterionId + index}><td>{index + 1}</td><td><Select value={row.criterionId} onChange={e => onChange(criteria.map((item, i) => i === index ? { ...item, criterionId: e.target.value } : item))}><option value="">Chọn tiêu chí</option>{catalog.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td><TextInput value={row.target} onChange={e => onChange(criteria.map((item, i) => i === index ? { ...item, target: e.target.value } : item))} /></td><td><TextInput type="number" value={row.weight} onChange={e => onChange(criteria.map((item, i) => i === index ? { ...item, weight: Number(e.target.value) } : item))} /></td><td>{row.counted ? 'Có tính' : 'Không'}</td></tr>)}
    </tbody></table>
    <WeightNote rows={criteria} />
    <p>* Trọng số các tiêu chí được tính vào tổng điểm nên bằng 100%</p>
    <button className="btn-ghost" type="button" onClick={() => onChange([...criteria, { criterionId: catalog[0]?.id || '', target: '', weight: 0, counted: true }])}>Thêm tiêu chí</button>
  </div>;
}

export function FormList({ view }: { view: 'all' | 'mine' | 'evaluate' | 'approve' | 'manage' }) {
  const data = useEval();
  const labels = useLabels();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(false);
  const [status, setStatus] = useState('');
  const rows = data.forms.filter(form => {
    const name = labels.employee(form.employeeId)?.fullName || '';
    if (view === 'mine' && form.employeeId !== 'emp-17') return false;
    if (view === 'evaluate' && form.status !== 'Đang đánh giá') return false;
    if (view === 'approve' && form.status !== 'Chờ duyệt') return false;
    if (status && form.status !== status) return false;
    return includesPlain(name, q);
  });
  return <div className="card panel"><h2>Phiếu đánh giá</h2>
    <div className="toolbar"><input className="control" placeholder="Tìm kiếm theo tên nhân viên" aria-label="Tìm phiếu" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-ghost" onClick={() => setFilter(true)}>Bộ lọc nâng cao</button><button className="btn-primary" onClick={() => nav('/m/danh-gia/phieu-tat-ca/tao')}>Thêm mới</button></div>
    <DataTable rows={rows} columns={[{ id: 'emp', header: 'Nhân viên', cell: r => <button className="link" onClick={() => nav('/m/danh-gia/phieu-tat-ca/' + r.id)}>{labels.employee(r.employeeId)?.fullName}</button> }, { id: 'kind', header: 'Loại đánh giá', cell: r => r.kind }, { id: 'period', header: 'Kỳ đánh giá', cell: r => data.periods.find(p => p.id === r.periodId)?.name || '—' }, { id: 'due', header: 'Hạn đánh giá', cell: r => fmtDate(r.due) }, { id: 'at', header: 'Thời gian tạo', cell: r => fmtDate(r.createdAt.slice(0, 10)) }, { id: 'st', header: 'Trạng thái', cell: r => <span className={'pill ' + (r.status === 'Đã duyệt' ? 'ok' : r.status === 'Từ chối' ? 'bad' : '')}>{r.status}</span> }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => nav('/m/danh-gia/phieu-tat-ca/' + r.id)}>Chấm</button> }]} filterKey={q + status + view} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" />
    {filter && <FilterPanel title="Bộ lọc nâng cao" onClose={() => setFilter(false)} onClear={() => setStatus('')}><Field label="Trạng thái"><Select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option>Đang đánh giá</option><option>Chờ duyệt</option><option>Đã duyệt</option><option>Từ chối</option></Select></Field><Field label="Thời hạn đánh giá"><TextInput type="date" /></Field></FilterPanel>}
  </div>;
}

export function FormCreate() {
  const data = useEval();
  const labels = useLabels();
  const nav = useNavigate();
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [due, setDue] = useState(todayISO());
  function save() {
    const tpl = data.templates.find(item => item.id === templateId);
    if (!employeeId) { toast('Chọn nhân viên.'); return; }
    const periodId = evalStore.savePeriod({ name: 'Phiếu lẻ ' + (labels.employee(employeeId)?.fullName || ''), due, year: '2026', cycle: 'Theo năm', span: 'Cả năm', templateId, resultMode: tpl?.resultMode || 'Có tính theo trọng số', kpiMode: tpl?.kpiMode || 'Không cho phép vượt 100%', allowLate: false, allowOverride: false, allowEdit: false, sharedTemplate: true, watchers: [], evalSteps: tpl?.evalSteps || [], approvalOn: true, approvalSteps: tpl?.approvalSteps || [], criteria: tpl?.criteria || [], grades: tpl?.grades || evalStore.defaultGrades, fields: [], employeeIds: [employeeId] }, true);
    toast('Đã lưu phiếu đánh giá');
    nav('/m/danh-gia/phieu-tat-ca');
    return periodId;
  }
  return <div className="card pad-card"><h2>Tạo phiếu đánh giá</h2>
    <div className="form-grid">
      <Field label="Loại đánh giá" required><Select><option>Theo năm</option><option>Theo nửa năm</option></Select></Field>
      <Field label="Nhân viên cần đánh giá" required><Select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Tìm và chọn nhân viên</option>{labels.state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}</Select></Field>
      <Field label="Mẫu đánh giá"><Select value={templateId} onChange={e => setTemplateId(e.target.value)}><option value="">Chọn mẫu đánh giá (không bắt buộc)</option>{data.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Hạn đánh giá" required><TextInput type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
    </div>
    <p>Thứ tự: Đánh giá lần lượt · Cấp đánh giá 1 · Sử dụng phê duyệt kết quả · Duyệt lần lượt</p>
    <div className="form-actions"><button className="btn-ghost" onClick={() => nav(-1)}>Hủy bỏ</button><button className="btn-primary" onClick={save}>Lưu phiếu đánh giá</button></div>
  </div>;
}

export function FormFill() {
  const { recordId } = useParams();
  const data = useEval();
  const labels = useLabels();
  const toast = useToast();
  const form = data.forms.find(item => item.id === recordId);
  const period = data.periods.find(item => item.id === form?.periodId);
  if (!form || !period) return <div className="card empty"><b>Không có phiếu</b></div>;
  const criteria = period.criteria.map(row => data.criteria.find(item => item.id === row.criterionId)).filter((item): item is Criterion => Boolean(item));
  const filled = form.scores.filter(score => score.raw != null).length;
  const total = totalPercent(form, period.criteria, data.criteria, period.kpiMode);
  const grade = gradeFor(total, period.grades);
  function setRaw(criterionId: string, raw: number | null) {
    evalStore.saveForm({ ...form!, scores: form!.scores.map(score => score.criterionId === criterionId ? { ...score, raw } : score) });
  }
  function send(next: EvalStatus) {
    const steps = period!.approvalOn ? period!.approvalSteps.length : 0;
    const step = next === 'Chờ duyệt' ? 1 : form!.step;
    const status: EvalStatus = next === 'Đã duyệt' && step < steps ? 'Chờ duyệt' : next;
    evalStore.saveForm({ ...form!, status, step: status === 'Đã duyệt' ? steps : step });
    toast(status === 'Chờ duyệt' ? 'Đã gửi đánh giá' : status === 'Đã duyệt' ? 'Đã duyệt' : 'Đã từ chối');
  }
  return <div className="card pad-card">
    <div className="toolbar"><h2>Phiếu đánh giá – {labels.employee(form.employeeId)?.fullName}</h2><div className="grow" />{form.status === 'Đang đánh giá' && <><button className="btn-ghost" onClick={() => toast('Đã lưu nháp')}>Lưu nháp</button><button className="btn-primary" onClick={() => send('Chờ duyệt')}>Gửi đánh giá</button></>}{form.status === 'Chờ duyệt' && <><button className="btn-danger" onClick={() => send('Từ chối')}>Từ chối</button><button className="btn-primary" onClick={() => send('Đã duyệt')}>Duyệt</button></>}</div>
    <p>Chu kỳ {period.span} · Hạn đánh giá {fmtDate(form.due)} · Trạng thái {form.status}</p>
    <p>Tiến độ nhập điểm {filled} / {criteria.length} tiêu chí đã nhập</p>
    <table className="tbl"><thead><tr><th>Tên tiêu chí</th><th>Kết quả đánh giá</th><th>Tỉ trọng</th></tr></thead><tbody>
      {period.criteria.map(row => {
        const item = data.criteria.find(c => c.id === row.criterionId);
        const score = form.scores.find(s => s.criterionId === row.criterionId);
        return <tr key={row.criterionId}><td>{item?.name}<br /><span className={'pill ' + GROUP_TONE[item?.groupId || '']}>{data.groups.find(g => g.id === item?.groupId)?.name}</span></td><td>{item?.kind === 'Thang điểm' ? <Select aria-label={'Điểm ' + item.name} value={score?.raw ?? ''} onChange={e => setRaw(row.criterionId, e.target.value === '' ? null : Number(e.target.value))} disabled={form.status !== 'Đang đánh giá'}><option value="">Chưa chọn</option>{(item.levels.length ? item.levels : evalStore.defaultLevels).map(level => <option key={level.score} value={level.score}>{level.score} {level.name}</option>)}</Select> : <TextInput aria-label={'Điểm ' + item?.name} type="number" value={score?.raw ?? ''} disabled={form.status !== 'Đang đánh giá'} onChange={e => setRaw(row.criterionId, e.target.value === '' ? null : Number(e.target.value))} />}</td><td>{row.weight}%</td></tr>;
      })}
    </tbody></table>
    <h3>Tổng kết đánh giá</h3>
    <p>Điểm đánh giá <b>{total == null ? '— / 100%' : total + '% / 100%'}</b> {grade && <span className="pill" style={{ background: grade.color, color: '#fff' }}>{grade.name}</span>}</p>
    <Field label="Nhận xét chung (Tối đa 2000 ký tự)"><TextArea maxLength={2000} value={form.comment} onChange={e => evalStore.saveForm({ ...form, comment: e.target.value })} /></Field>
    <p>Đề xuất kết quả thử việc</p>
    {['Ký hợp đồng chính thức', 'Không ký hợp đồng mới', 'Tiếp tục thử việc'].map(item => <label key={item} className="chk"><input type="radio" name="proposal" checked={form.proposal === item} onChange={() => evalStore.saveForm({ ...form, proposal: item })} /> {item}</label>)}
    <p className="muted">Bước duyệt: {period.approvalSteps.map(step => step.role).join(' → ') || 'Không duyệt'}. Màn kết quả sau duyệt không có trong ghi chú.</p>
  </div>;
}

export function KpiBoard({ view }: { view: 'all' | 'mine' | 'team' }) {
  const data = useEval();
  const labels = useLabels();
  const rows = data.forms.filter(form => view === 'all' || (view === 'mine' ? form.employeeId === 'emp-17' : labels.employee(form.employeeId)?.managerId === 'emp-17')).map(form => ({ ...form, n: data.periods.find(p => p.id === form.periodId)?.criteria.length || 0 }));
  return <div className="card panel"><h2>{view === 'mine' ? 'KPI của tôi' : view === 'team' ? 'Nhân viên của tôi' : 'Tất cả'}</h2>
    <div className="toolbar"><Select aria-label="Trạng thái"><option>Tất cả trạng thái</option></Select><Select aria-label="Kỳ"><option>Tất cả kỳ thiết lập</option></Select></div>
    <DataTable rows={rows} columns={[{ id: 'emp', header: 'Nhân viên', cell: r => labels.employee(r.employeeId)?.fullName }, { id: 'period', header: 'Kỳ thiết lập', cell: r => data.periods.find(p => p.id === r.periodId)?.name }, { id: 'time', header: 'Thời gian áp dụng', cell: r => fmtDate(r.due) }, { id: 'n', header: 'Số tiêu chí', cell: r => r.n }, { id: 'st', header: 'Trạng thái', cell: r => r.status }, { id: 'act', header: 'Thao tác', cell: () => '—' }]} empty="Không có kết quả nào phù hợp với nội dung tìm kiếm" /></div>;
}

export function CriteriaPage() {
  const data = useEval();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [upload, setUpload] = useState(false);
  const rows = data.criteria.filter(item => includesPlain(item.name + item.code, q)).map(item => ({ ...item }));
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm kiếm theo tiêu chí..." aria-label="Tìm tiêu chí" value={q} onChange={e => setQ(e.target.value)} /><Select aria-label="Nhóm"><option>Nhóm tiêu chí</option>{data.groups.map(g => <option key={g.id}>{g.name}</option>)}</Select><Select aria-label="Loại"><option>Loại tiêu chí</option><option>Thang điểm</option><option>Điểm số</option><option>Tỉ lệ hoàn thành</option></Select><button className="btn-ghost" onClick={() => setUpload(true)}>Tải lên</button><button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>Thêm tiêu chí</button></div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Tên tiêu chí', cell: r => <span>{r.name}<br /><small className="mono">{r.code}</small></span> }, { id: 'group', header: 'Nhóm tiêu chí', cell: r => <span className={'pill ' + GROUP_TONE[r.groupId]}>{data.groups.find(g => g.id === r.groupId)?.name}</span> }, { id: 'kind', header: 'Loại', cell: r => <span className="pill wait">{r.kind}</span> }, { id: 'desc', header: 'Mô tả', cell: r => r.description || '—' }, { id: 'st', header: 'Trạng thái', cell: r => <input type="checkbox" checked={r.active} aria-label="Bật" onChange={e => evalStore.saveCriterion({ ...r, active: e.target.checked })} /> }, { id: 'act', header: 'Tác vụ', cell: r => <><button className="btn-ghost btn-sm" onClick={() => { setEditing(r); setOpen(true); }}>Chỉnh sửa</button><button className="btn-ghost btn-sm" onClick={() => evalStore.deleteCriterion(r.id)}>Xóa</button></> }]} filterKey={q} />
    {open && <CriterionModal initial={editing} groups={data.groups} onClose={() => setOpen(false)} />}
    {upload && <UploadWizard onClose={() => setUpload(false)} />}
  </div>;
}

function CriterionModal({ initial, groups, onClose }: { initial: Criterion | null; groups: { id: string; name: string }[]; onClose: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');
  const [groupId, setGroupId] = useState(initial?.groupId || groups[0]?.id || '');
  const [kind, setKind] = useState<ScoreKind>(initial?.kind || 'Thang điểm');
  const [description, setDescription] = useState(initial?.description || '');
  const [levels, setLevels] = useState(initial?.levels?.length ? initial.levels : evalStore.defaultLevels);
  return <div className="modal-back" onMouseDown={onClose}><form className="modal wide" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); evalStore.saveCriterion({ id: initial?.id || '', name, code, groupId, kind, description, active: initial?.active ?? true, levels: kind === 'Thang điểm' ? levels : [], formula: '' }); onClose(); }}><header><b>{initial ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí'}</b></header><div className="body">
    <h3>Thông tin cơ bản</h3>
    <div className="form-grid"><Field label="Tên tiêu chí" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Mã tiêu chí" required><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field><Field label="Nhóm tiêu chí"><Select value={groupId} onChange={e => setGroupId(e.target.value)}>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field><Field label="Mô tả" className="span2"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field></div>
    <h3>Cách chấm điểm</h3>
    {(['Thang điểm', 'Điểm số', 'Tỉ lệ hoàn thành'] as ScoreKind[]).map(item => <label key={item} className="chk"><input type="radio" checked={kind === item} onChange={() => setKind(item)} /> {item} — {item === 'Thang điểm' ? 'Chia thành các mức điểm có tên gọi' : item === 'Điểm số' ? 'Người chấm nhập trực tiếp giá trị số' : 'Dùng cho tiêu chí có mục tiêu cụ thể'}</label>)}
    {kind === 'Thang điểm' && <><p>Dùng khi tiêu chí được đánh giá theo mức độ, không có chỉ tiêu số cụ thể. Phù hợp với tiêu chí đánh giá năng lực, thái độ, hành vi.</p><table className="tbl"><thead><tr><th>#</th><th>Tên mức</th><th>Điểm</th><th>Mô tả mức</th><th></th></tr></thead><tbody>{levels.map((level, index) => <tr key={index}><td>{index + 1}</td><td><TextInput value={level.name} onChange={e => setLevels(cur => cur.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} /></td><td><TextInput type="number" value={level.score} onChange={e => setLevels(cur => cur.map((row, i) => i === index ? { ...row, score: Number(e.target.value) } : row))} /></td><td><TextInput value={level.note} onChange={e => setLevels(cur => cur.map((row, i) => i === index ? { ...row, note: e.target.value } : row))} /></td><td><button type="button" className="btn-ghost btn-sm" onClick={() => setLevels(cur => cur.filter((_, i) => i !== index))}>Xóa</button></td></tr>)}</tbody></table><button type="button" className="btn-ghost" onClick={() => setLevels(cur => [...cur, { name: 'Mức mới', score: cur.length + 1, note: '' }])}>Thêm mức</button><p>Mặc định 5 thang. Bạn có thể thêm, xoá hoặc đổi tên và điểm từng mức.</p></>}
  </div><div className="form-actions"><button type="button" className="btn-ghost" onClick={onClose}>Hủy</button><button className="btn-primary">Lưu tiêu chí</button></div></form></div>;
}

function UploadWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  return <div className="modal-back" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><header><b>Tải lên</b></header><div className="body"><p>1 Tải lên → 2 Xem trước → 3 Kết quả · đang ở bước {step}</p>{step === 1 && <p>Tải template. Kéo thả Định dạng hỗ trợ: XLSX, XLS (Tối đa 5MB). Cột file không được mô tả nên không nhập dữ liệu giả.</p>}{step === 2 && <p>Xem trước: chưa có dòng vì chưa có file mẫu.</p>}{step === 3 && <p>Kết quả: 0 dòng được thêm.</p>}</div><div className="form-actions"><button className="btn-ghost" onClick={onClose}>Hủy bỏ</button>{step < 3 && <button className="btn-primary" onClick={() => setStep(step + 1)}>Xem trước</button>}</div></div></div>;
}

export function GroupPage() {
  const data = useEval();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm theo mã hoặc tên nhóm..." aria-label="Tìm nhóm" /><button className="btn-primary" onClick={() => setOpen(true)}>Thêm mới</button></div>
    <DataTable rows={data.groups} columns={[{ id: 'code', header: 'Mã nhóm', cell: r => <span className="chip mono">{r.code}</span> }, { id: 'name', header: 'Tên nhóm tiêu chí', cell: r => r.name }, { id: 'desc', header: 'Mô tả', cell: r => r.description || '—' }, { id: 'act', header: 'Tác vụ', cell: r => <button className="btn-ghost btn-sm" onClick={() => evalStore.deleteGroup(r.id)}>Xóa</button> }]} />
    {open && <div className="modal-back" onMouseDown={() => setOpen(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); evalStore.saveGroup({ id: '', code, name, description }); setOpen(false); }}><header><b>Thêm nhóm tiêu chí</b></header><div className="body"><Field label="Tên nhóm tiêu chí" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Mã nhóm" required><TextInput value={code} onChange={e => setCode(e.target.value)} /></Field><Field label="Mô tả"><TextArea value={description} onChange={e => setDescription(e.target.value)} /></Field></div><div className="form-actions"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button><button className="btn-primary">Lưu</button></div></form></div>}
  </div>;
}

export function TemplateList() {
  const data = useEval();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const rows = data.templates.filter(item => includesPlain(item.name, q));
  return <div className="card panel"><div className="toolbar"><input className="control" placeholder="Tìm kiếm theo tên mẫu đánh giá" aria-label="Tìm mẫu" value={q} onChange={e => setQ(e.target.value)} /><Select aria-label="Trạng thái"><option>Trạng thái hoạt động</option></Select><Select aria-label="Đối tượng"><option>Đối tượng áp dụng</option></Select><button className="btn-primary" onClick={() => nav('/m/danh-gia/mau-danh-gia/tao')}>Thêm mới</button></div>
    <DataTable rows={rows} columns={[{ id: 'name', header: 'Tên mẫu đánh giá', cell: r => <button className="link" onClick={() => nav('/m/danh-gia/mau-danh-gia/' + r.id)}>{r.name}</button> }, { id: 'scope', header: 'Đối tượng áp dụng', cell: r => r.scopes.map(scope => <span key={scope} className="chip">{scope}</span>) }, { id: 'st', header: 'Trạng thái hoạt động', cell: r => <input type="checkbox" checked={r.active} aria-label="Hoạt động" onChange={e => evalStore.saveTemplate({ ...r, active: e.target.checked })} /> }, { id: 'act', header: 'Tác vụ', cell: r => <><button className="btn-ghost btn-sm" onClick={() => nav('/m/danh-gia/mau-danh-gia/' + r.id)}>Xem chi tiết</button><button className="btn-danger btn-sm" onClick={() => evalStore.deleteTemplate(r.id)}>Xóa</button></> }]} filterKey={q} />
  </div>;
}

export function TemplateEditor() {
  const data = useEval();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [preview, setPreview] = useState(false);
  const template = data.templates[0];
  return <div className="split"><form className="card pad-card" onSubmit={e => { e.preventDefault(); if (!template) return; evalStore.saveTemplate({ ...template, id: '', name, active }); toast('Đã lưu mẫu đánh giá'); nav('/m/danh-gia/mau-danh-gia'); }}>
    <h2>Thêm mới mẫu đánh giá</h2>
    <Field label="Tên mẫu đánh giá" required><TextInput value={name} onChange={e => setName(e.target.value)} /></Field>
    <label className="chk"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Đang hoạt động</label>
    <Field label="Đối tượng áp dụng"><Select><option>Toàn công ty</option><option>Đơn vị</option><option>Vị trí công việc</option><option>Nhân viên</option></Select></Field>
    <p>Cách tính {template?.resultMode}. KPI {template?.kpiMode}. Quy trình và nội dung lấy từ mẫu đang có khi lưu.</p>
    <div className="form-actions"><button type="button" className="btn-ghost" onClick={() => nav(-1)}>Hủy bỏ</button><button type="button" className="btn-ghost" onClick={() => setPreview(true)}>Xem trước</button><button className="btn-primary">Lưu mẫu đánh giá</button></div>
  </form>{preview && template && <Preview templateName={name || template.name} />}</div>;
}

export function TemplateDetail() {
  const { recordId } = useParams();
  const data = useEval();
  const template = data.templates.find(item => item.id === recordId) || data.templates[0];
  const [preview, setPreview] = useState(false);
  if (!template) return <div className="card empty"><b>Không có mẫu</b></div>;
  return <div className="split"><div className="card pad-card">
    <div className="toolbar"><h2>{template.name}</h2><span className="pill ok">Đang hoạt động</span><button className="btn-ghost" onClick={() => setPreview(v => !v)}>Xem trước</button></div>
    <h3>Thông tin cơ bản</h3>
    <p>Trạng thái Đang hoạt động · {template.resultMode} · {template.kpiMode}</p>
    <p>Người theo dõi: {template.watchers.join(', ')}</p>
    <p>Đối tượng: {template.scopes.join(', ')}</p>
    <h3>Cài đặt quy trình đánh giá</h3>
    <p>Đánh giá lần lượt. {template.evalSteps.map((step, i) => `Cấp ${i + 1} ${step.role}`).join('; ')}</p>
    <h3>Quy trình duyệt</h3>
    {template.approvalSteps.map((step, i) => <p key={i}>Bước {i + 1} {step.role} · {step.person || 'Không chỉ định'}</p>)}
    <p>{template.approvalSteps.length} bước duyệt · Thứ tự: Lần lượt</p>
    <h3>Nội dung phiếu</h3>
    <table className="tbl"><thead><tr><th>Tiêu chí</th><th>Trọng số</th></tr></thead><tbody>{template.criteria.map(row => <tr key={row.criterionId}><td>{data.criteria.find(c => c.id === row.criterionId)?.name}</td><td>{row.weight}%</td></tr>)}</tbody></table>
    <p>Tổng trọng số {weightSum(template.criteria)}% / 100%</p>
  </div>{preview && <Preview templateName={template.name} />}</div>;
}

function Preview({ templateName }: { templateName: string }) {
  const data = useEval();
  const template = data.templates.find(item => item.name === templateName) || data.templates[0];
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const criteria = template?.criteria || [];
  const filled = Object.values(scores).filter(value => value != null).length;
  const form = { scores: criteria.map(row => ({ criterionId: row.criterionId, raw: scores[row.criterionId] ?? null, note: '' })) };
  const total = template ? totalPercent(form, criteria, data.criteria, template.kpiMode) : null;
  const grade = template ? gradeFor(total, template.grades) : null;
  return <aside className="card pad-card"><h3>Phiếu đánh giá – [Tên nhân viên]</h3><div className="row-actions"><button className="btn-ghost">Lưu nháp</button><button className="btn-primary">Gửi đánh giá</button></div>
    <p>Chu kỳ — · Hạn đánh giá — · Trạng thái Đang đánh giá</p>
    <p>Tiến độ nhập điểm {filled} / {criteria.length} tiêu chí đã nhập</p>
    <table className="tbl"><thead><tr><th>Tên tiêu chí</th><th>Kết quả đánh giá</th><th>Tỉ trọng</th></tr></thead><tbody>{criteria.map(row => { const item = data.criteria.find(c => c.id === row.criterionId); return <tr key={row.criterionId}><td>{item?.name}</td><td><Select aria-label={item?.name} value={scores[row.criterionId] ?? ''} onChange={e => setScores({ ...scores, [row.criterionId]: e.target.value === '' ? null : Number(e.target.value) })}><option value="">Chưa chọn</option><option value="1">1 Kém</option><option value="2">2 Yếu</option><option value="3">3 Đạt</option><option value="4">4 Tốt</option><option value="5">5 XS</option></Select></td><td>{row.weight}%</td></tr>; })}</tbody></table>
    <h3>Tổng kết đánh giá</h3><p>Điểm đánh giá {total == null ? '— / 100%' : `${total}% / 100%`} {grade && <b> {grade.name}</b>}</p>
    <Field label="Nhận xét chung (Tối đa 2000 ký tự)"><TextArea maxLength={2000} /></Field>
    <p>Đề xuất kết quả thử việc *</p>
    {['Ký hợp đồng chính thức', 'Không ký hợp đồng mới', 'Tiếp tục thử việc'].map(item => <label key={item} className="chk"><input type="radio" name="pv" /> {item}</label>)}
  </aside>;
}

