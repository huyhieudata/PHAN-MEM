import type { Employee, HrState, Punch, TimeRequest, WorkShift } from './types';
import { REQUEST_TYPES } from './timeoff';
import { todayISO } from './text';

export interface DayCell {
  date: string;
  work: number;
  hours: number;
  kind: 'ok' | 'late' | 'miss' | 'request' | 'holiday' | 'off' | 'both' | 'error' | 'empty';
  text: string;
  title: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function monthIso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function punchMinutes(at: string) {
  return minutes(at.slice(11, 16));
}

export function isHoliday(state: HrState, date: string) {
  return state.holidays.some(item => item.startDate <= date && item.endDate >= date);
}

export function coveringRequest(state: HrState, employeeId: string, date: string): TimeRequest | undefined {
  return state.requests.find(item => item.employeeId === employeeId && item.status === 'Đã duyệt' && item.startDate <= date && (item.endDate || item.startDate) >= date
    && ['nghi-phep', 'lam-viec-tai-nha', 'cong-tac', 'di-muon-ve-som', 'nghi-thai-san'].includes(item.type));
}

export function shiftOn(state: HrState, employeeId: string, date: string): WorkShift | undefined {
  const assignment = state.assignments.find(item => item.employeeId === employeeId && item.date === date);
  return assignment ? state.shifts.find(item => item.id === assignment.shiftId) : undefined;
}

export function dayCell(state: HrState, employeeId: string, date: string, today = todayISO()): DayCell {
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const holiday = isHoliday(state, date);
  const request = coveringRequest(state, employeeId, date);
  const shift = shiftOn(state, employeeId, date);
  const punches = state.punches.filter(item => item.employeeId === employeeId && item.at.slice(0, 10) === date).sort((a, b) => a.at.localeCompare(b.at));
  const empty: DayCell = { date, work: 0, hours: 0, kind: 'empty', text: '', title: '' };
  if (date > today && !request) return { ...empty, kind: dow === 0 ? 'off' : 'empty', text: dow === 0 ? '-' : '' };
  if (holiday) return { date, work: 0, hours: 0, kind: 'holiday', text: 'L', title: 'Nghỉ lễ' };
  if ((dow === 0 || dow === 6) && !shift && !request && !punches.length) return { date, work: 0, hours: 0, kind: 'off', text: '-', title: 'Ngày nghỉ' };
  let kind: DayCell['kind'] = 'miss';
  let work = 0;
  let hours = 0;
  let text = '0';
  let title = 'Không chấm công';
  if (punches.length >= 2 && shift) {
    const start = minutes(shift.start);
    const inn = punchMinutes(punches[0].at);
    const out = punchMinutes(punches[punches.length - 1].at);
    hours = Math.max(0, Math.round(((out - inn) / 60) * 10) / 10);
    const late = inn - start > 5;
    kind = late ? 'late' : 'ok';
    work = late ? 0.5 : 1;
    text = String(work);
    title = late ? 'Đi muộn / về sớm' : 'Chấm công đúng giờ';
  } else if (punches.length === 1) {
    kind = 'error';
    work = 0.5;
    hours = 4;
    text = '0.5';
    title = 'Quên check out';
  } else if (shift) {
    kind = 'miss';
    title = 'Không chấm công';
  }
  if (request) {
    const symbol = request.type === 'nghi-phep' ? 'P' : request.type === 'lam-viec-tai-nha' ? 'WFH' : request.type === 'cong-tac' ? 'CT' : request.type === 'di-muon-ve-som' ? 'M' : 'TS';
    if (punches.length) return { date, work, hours, kind: 'both', text: `${text}+${symbol}`, title: 'Vừa có đơn vừa có chấm công' };
    const paid = request.type !== 'nghi-phep';
    return { date, work: paid ? 1 : 0, hours: paid ? 8 : 0, kind: 'request', text: symbol, title: REQUEST_TYPES.find(item => item.id === request.type)?.label ?? 'Có đơn từ' };
  }
  return { date, work, hours, kind, text: shift || punches.length ? text : (dow === 0 ? '-' : ''), title };
}

export function monthCells(state: HrState, employeeId: string, year: number, month: number, today = todayISO()) {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => dayCell(state, employeeId, monthIso(year, month, index + 1), today));
}

export function buildAttendanceSeed(employees: Employee[], requests: TimeRequest[], now = new Date()): Pick<HrState, 'requestTypeSettings' | 'deadlineDays' | 'otApproveAfter' | 'otAdjustByRaw' | 'otThresholds' | 'leavePoliciesV2' | 'punches' | 'fraudAlerts' | 'assignments' | 'shiftPlans' | 'holidays' | 'timesheetTemplates' | 'standardWorkdays' | 'attendanceMethods' | 'workdayConfig' | 'openShiftEnabled' | 'faceProfiles' | 'proxyClocks'> {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = todayISO(now);
  const working = employees.filter(item => item.status !== 'Đã nghỉ việc');
  const assignments: HrState['assignments'] = [];
  const punches: Punch[] = [];
  const days = daysInMonth(year, month);
  working.forEach(emp => {
    for (let day = 1; day <= days; day++) {
      const date = monthIso(year, month, day);
      const dow = new Date(year, month - 1, day).getDay();
      if (dow === 0 || dow === 6) continue;
      assignments.push({ id: `as-${emp.id}-${date}`, employeeId: emp.id, date, shiftId: emp.id === 'emp-08' ? 'ca-sang' : 'ca-hc' });
      if (date > today) continue;
      const onLeave = requests.some(item => item.employeeId === emp.id && item.status === 'Đã duyệt' && item.type === 'nghi-phep' && item.startDate <= date && item.endDate >= date);
      if (onLeave) continue;
      if (emp.id === 'emp-13' && day % 6 === 0) continue;
      const late = emp.id === 'emp-04' && day % 4 === 0;
      const missOut = emp.id === 'emp-09' && day % 5 === 0;
      const code = emp.code.replace('NV', 'CC');
      punches.push({ id: `pu-${emp.id}-${date}-in`, employeeId: emp.id, at: `${date}T${late ? '08:52' : '08:28'}:00`, code, method: emp.branchId === 'br-dn' ? 'Vân tay' : 'GPS', machine: emp.branchId === 'br-dn' ? 'Máy kho ĐN' : 'Điện thoại', device: late ? 'Android demo' : 'iPhone demo', ip: '10.0.0.12', gps: emp.branchId === 'br-hcm' ? '10.77, 106.70' : '21.03, 105.85', branchId: emp.branchId, actor: 'Nhân sự' });
      if (!missOut) punches.push({ id: `pu-${emp.id}-${date}-out`, employeeId: emp.id, at: `${date}T17:31:00`, code, method: 'GPS', machine: 'Điện thoại', device: 'iPhone demo', ip: '10.0.0.12', gps: '21.03, 105.85', branchId: emp.branchId, actor: 'Nhân sự' });
    }
  });
  return {
    requestTypeSettings: REQUEST_TYPES.map(item => ({ type: item.id, description: `Đơn dùng cho ${item.label.toLowerCase()}.`, rule: item.id === 'lam-them-gio' ? 'Cần làm đơn trước ca tăng.' : 'Theo quy trình duyệt đang áp dụng.', enabled: true })),
    deadlineDays: 3,
    otApproveAfter: false,
    otAdjustByRaw: true,
    otThresholds: [{ id: 'otc-1', name: 'Cấu hình OT mặc định toàn công ty', effectiveDate: `${year}-01-01`, wholeWorkspace: true, scope: 'Toàn workspace', daily: 4, weekly: 12, monthly: 40, yearly: 200, warnDaily: 80, warnWeekly: 80, warnMonthly: 80, email: true, onExceed: true, recipients: ['Nhân viên', 'Quản lý trực tiếp'], extraRecipients: '', frequency: 'Hằng ngày', isDefault: true }],
    leavePoliciesV2: [{
      id: 'lpv2-1', name: 'Chính sách phép chuẩn 2026', month: `01/${year}`, scope: 'Toàn công ty', employmentTypes: ['Chính thức'],
      sources: [
        { kind: 'nam', active: true, days: 12, firstMonthAfter: 15, startFrom: 'official', accrualPoint: 'month-end', formula: 'monthly', expiry: 'this-year', reclaimMonth: '03', maxUse: 12 },
        { kind: 'sinh-nhat', active: true, days: 1, firstMonthAfter: 0, startFrom: 'start', accrualPoint: 'fixed', formula: 'full-year', expiry: 'this-year', reclaimMonth: '', maxUse: 1 },
        { kind: 'tham-nien', active: true, days: 1, firstMonthAfter: 0, startFrom: 'official', accrualPoint: 'fixed', formula: 'full-year', expiry: 'next-year', reclaimMonth: '03', maxUse: 3 },
        { kind: 'nghi-bu', active: false, days: 0, firstMonthAfter: 0, startFrom: 'start', accrualPoint: 'fixed', formula: 'monthly', expiry: 'this-year', reclaimMonth: '', maxUse: 0 },
      ],
    }],
    punches,
    fraudAlerts: [
      { id: 'fr-1', at: `${today}T08:40:00`, employeeId: 'emp-04', kind: 'Hai vị trí GPS cách xa trong cùng phút', level: 'Cao', detail: 'Lệch 18 km giữa hai lần chấm cách nhau 40 giây.', conclusion: 'Chờ xử lý' },
      { id: 'fr-2', at: `${today}T09:05:00`, employeeId: 'emp-16', kind: 'Khuôn mặt không khớp hồ sơ', level: 'Vừa', detail: 'Độ khớp 0.42, dưới ngưỡng 0.75.', conclusion: 'Chờ xử lý' },
      { id: 'fr-3', at: `${monthIso(year, month, Math.max(1, now.getDate() - 2))}T18:10:00`, employeeId: 'emp-06', kind: 'Chấm công ngoài vùng cho phép', level: 'Thấp', detail: 'Cách văn phòng mẫu 1.2 km.', conclusion: 'Hợp lệ' },
    ],
    assignments,
    shiftPlans: [{ id: 'sp-1', title: 'Phân ca hành chính tháng ' + month, scope: 'Toàn công ty', startDate: monthIso(year, month, 1), endDate: monthIso(year, month, days), createdAt: monthIso(year, month, 1) }],
    holidays: [
      { id: 'hd-1', name: 'Tết Dương lịch', startDate: `${year}-01-01`, endDate: `${year}-01-01`, scope: 'Toàn công ty' },
      { id: 'hd-2', name: 'Quốc khánh', startDate: `${year}-09-02`, endDate: `${year}-09-02`, scope: 'Toàn công ty' },
      { id: 'hd-3', name: 'Ngày thành lập demo', startDate: `${year}-10-20`, endDate: `${year}-10-20`, scope: 'Toàn công ty' },
    ],
    timesheetTemplates: [{ id: 'tt-1', name: 'Bảng công khối văn phòng', description: 'Công giờ hành chính, ký hiệu đơn P/WFH/CT.', active: true }],
    standardWorkdays: [
      { id: 'sw-1', scope: 'Toàn công ty', days: 22, createdAt: `${year}-01-02`, updatedAt: `${year}-01-02` },
      { id: 'sw-2', scope: 'Phòng Kinh doanh', days: 24, createdAt: `${year}-03-01`, updatedAt: `${year}-06-01` },
    ],
    attendanceMethods: [
      { id: 'am-1', name: 'Chấm công văn phòng', methods: 'Điện thoại GPS • Hình ảnh; Vân tay; Hanet Camera', scope: 'Khối văn phòng', byBranch: 'Theo chi nhánh', updatedAt: today },
      { id: 'am-2', name: 'Chấm công công trình', methods: 'Điện thoại giới hạn; Vân tay Tracker; Hanet Camera', scope: 'Ban Dự án', byBranch: 'Theo công trình', updatedAt: today },
    ],
    workdayConfig: { mode: 'last', fixedDay: 25, confirmFlow: true, reminder: true },
    openShiftEnabled: false,
    faceProfiles: working.slice(0, 4).map(emp => ({ id: `fc-${emp.id}`, employeeId: emp.id, updatedAt: today })),
    proxyClocks: [{ id: 'px-1', helperId: 'emp-02', employeeId: 'emp-09', note: 'Nhờ chuyên viên nhân sự chấm hộ khi quên điện thoại.' }],
  };
}
