import { USER } from './session';
import type { Employee, HrState, TimeRequest } from './types';
import { addDaysISO, todayISO } from './text';
import { buildSteps } from './timeoff';

type Slice = Pick<HrState, 'shifts' | 'leaveTypes' | 'leavePolicy' | 'otPolicy' | 'requestReasons' | 'requestProcedures' | 'delegations' | 'leaveBalances' | 'requests'>;

export function buildTimeoffSeed(employees: Employee[], now = new Date()): Slice {
  const today = todayISO(now);
  const year = now.getFullYear();
  const shifts = [
    { id: 'ca-hc', code: 'HC', name: 'Hành chính', start: '08:00', end: '17:30' },
    { id: 'ca-sang', code: 'S', name: 'Ca sáng', start: '06:00', end: '14:00' },
    { id: 'ca-chieu', code: 'C', name: 'Ca chiều', start: '14:00', end: '22:00' },
  ];
  const leaveTypes = [
    { id: 'lt-nam', name: 'Phép năm', paid: true, deduct: true },
    { id: 'lt-kl', name: 'Nghỉ không lương', paid: false, deduct: false },
    { id: 'lt-om', name: 'Nghỉ ốm', paid: true, deduct: false },
    { id: 'lt-cuoi', name: 'Nghỉ cưới', paid: true, deduct: false },
    { id: 'lt-tang', name: 'Nghỉ tang', paid: true, deduct: false },
  ];
  const leavePolicy = { id: 'lp-1', name: 'Phép năm chuẩn', annualDays: 12, carryOverMax: 3, minNoticeDays: 0, allowNegative: false };
  const otPolicy = { id: 'ot-1', name: 'OT chuẩn', weekdayRate: 1.5, weekendRate: 2, holidayRate: 3, dailyHourCap: 4, monthlyHourCap: 40 };
  const reasons = [
    ['nghi-phep', 'Việc gia đình'], ['nghi-phep', 'Khám sức khỏe'],
    ['di-muon-ve-som', 'Đưa con đi học'], ['di-muon-ve-som', 'Việc cá nhân'],
    ['lam-them-gio', 'Hoàn thành dự án'], ['lam-them-gio', 'Trực vận hành'],
    ['cong-tac', 'Gặp khách hàng'], ['cong-tac', 'Đào tạo'],
    ['lam-viec-tai-nha', 'Làm việc tập trung'], ['lam-viec-tai-nha', 'Nhà có việc'],
    ['bo-sung-cong', 'Quên chấm công'], ['bo-sung-cong', 'Máy chấm lỗi'],
    ['doi-ca', 'Đổi ca cá nhân'], ['doi-ca', 'Hỗ trợ đồng nghiệp'],
  ].map(([type, name], index) => ({ id: `rs-${index + 1}`, type: type as TimeRequest['type'], name, active: true }));
  const requestProcedures = (['nghi-phep', 'di-muon-ve-som', 'lam-them-gio', 'cong-tac', 'lam-viec-tai-nha', 'bo-sung-cong', 'doi-ca'] as TimeRequest['type'][]).map(type => ({
    id: `qt-${type}`,
    type,
    name: `Quy trình ${type}`,
    steps: [
      { order: 1, role: 'Quản lý trực tiếp' as const },
      { order: 2, role: 'Giám đốc' as const },
    ],
  }));
  const leaveBalances = employees.filter(e => e.status !== 'Đã nghỉ việc').map(e => ({
    id: `lb-${e.id}`,
    employeeId: e.id,
    year,
    leaveTypeId: 'lt-nam',
    entitled: 12,
    carried: e.id === 'emp-01' ? 1 : 0,
    used: e.id === 'emp-01' ? 2 : e.id === 'emp-05' ? 1 : 0,
    pending: e.id === 'emp-01' ? 1 : 0,
  }));
  const partial: HrState = {
    branches: [], levels: [], units: [], positions: [], employees, contracts: [], dependents: [], certificates: [],
    headcounts: [], decisions: [], rewards: [], shifts, leaveTypes, leavePolicy, otPolicy,
    requestReasons: reasons, requestProcedures, delegations: [], leaveBalances, requests: [],
  };
  const stepPair = (employeeId: string, firstDone: boolean) => {
    const employee = employees.find(item => item.id === employeeId)!;
    const steps = buildSteps(employee, partial, 'nghi-phep');
    if (firstDone && steps[0]) {
      steps[0] = { ...steps[0], status: 'Đã duyệt', note: 'Đồng ý', actedAt: addDaysISO(today, -2) + 'T08:00:00.000Z' };
    }
    return steps;
  };
  const base = (patch: Partial<TimeRequest> & Pick<TimeRequest, 'id' | 'code' | 'type' | 'employeeId' | 'status'>): TimeRequest => ({
    createdBy: employees.find(e => e.id === patch.employeeId)?.fullName ?? '',
    onBehalf: false,
    reasonId: '',
    note: '',
    startDate: today,
    endDate: today,
    startTime: '',
    endTime: '',
    quantity: 1,
    leaveTypeId: '',
    shiftId: '',
    targetShiftId: '',
    watchers: [],
    steps: [],
    history: [{ at: addDaysISO(today, -3) + 'T08:00:00.000Z', actor: 'Hệ thống', action: 'Tạo đơn mẫu', note: '' }],
    balanceState: 'none',
    createdAt: addDaysISO(today, -3) + 'T08:00:00.000Z',
    ...patch,
  });
  const requests: TimeRequest[] = [
    base({ id: 'rq-01', code: 'DT0001', type: 'nghi-phep', employeeId: 'emp-01', status: 'Đã duyệt', startDate: addDaysISO(today, -20), endDate: addDaysISO(today, -19), quantity: 2, leaveTypeId: 'lt-nam', reasonId: 'rs-1', note: 'Việc gia đình đã được duyệt.', steps: stepPair('emp-01', true).map(s => ({ ...s, status: 'Đã duyệt', actedAt: addDaysISO(today, -21) })), balanceState: 'used' }),
    base({ id: 'rq-02', code: 'DT0002', type: 'nghi-phep', employeeId: 'emp-01', status: 'Đang duyệt', startDate: addDaysISO(today, 5), endDate: addDaysISO(today, 5), quantity: 1, leaveTypeId: 'lt-nam', reasonId: 'rs-2', note: 'Khám sức khỏe định kỳ.', steps: stepPair('emp-01', true), balanceState: 'pending' }),
    base({ id: 'rq-03', code: 'DT0003', type: 'lam-them-gio', employeeId: 'emp-06', status: 'Chờ duyệt', startDate: today, quantity: 3, startTime: '18:00', endTime: '21:00', reasonId: 'rs-5', note: 'Hoàn thành bản phát hành demo.', steps: buildSteps(employees.find(e => e.id === 'emp-06')!, partial, 'lam-them-gio') }),
    base({ id: 'rq-04', code: 'DT0004', type: 'lam-viec-tai-nha', employeeId: 'emp-04', createdBy: USER.name, onBehalf: true, status: 'Chờ duyệt', startDate: addDaysISO(today, 1), endDate: addDaysISO(today, 2), quantity: 2, reasonId: 'rs-9', note: 'Tạo hộ cho nhân sự thử việc.', steps: buildSteps(employees.find(e => e.id === 'emp-04')!, partial, 'lam-viec-tai-nha') }),
    base({ id: 'rq-05', code: 'DT0005', type: 'di-muon-ve-som', employeeId: 'emp-09', status: 'Chờ duyệt', startDate: addDaysISO(today, 1), quantity: 1, startTime: '08:00', endTime: '09:00', reasonId: 'rs-3', note: 'Đưa người nhà đi khám.', watchers: [USER.name], steps: buildSteps(employees.find(e => e.id === 'emp-09')!, partial, 'di-muon-ve-som') }),
    base({ id: 'rq-06', code: 'DT0006', type: 'doi-ca', employeeId: 'emp-16', status: 'Đã duyệt', startDate: addDaysISO(today, -1), quantity: 1, shiftId: 'ca-hc', targetShiftId: 'ca-chieu', reasonId: 'rs-13', note: 'Đổi ca hỗ trợ đồng nghiệp.', steps: buildSteps(employees.find(e => e.id === 'emp-16')!, partial, 'doi-ca').map(s => ({ ...s, status: 'Đã duyệt' as const, actedAt: addDaysISO(today, -2) })) }),
    base({ id: 'rq-07', code: 'DT0007', type: 'bo-sung-cong', employeeId: 'emp-08', status: 'Từ chối', startDate: addDaysISO(today, -4), quantity: 1, startTime: '08:00', endTime: '17:30', reasonId: 'rs-11', note: 'Quên chấm công ngày hôm trước.', steps: buildSteps(employees.find(e => e.id === 'emp-08')!, partial, 'bo-sung-cong').map((s, i) => i === 0 ? { ...s, status: 'Từ chối' as const, note: 'Thiếu ảnh chấm công', actedAt: addDaysISO(today, -3) } : s) }),
    base({ id: 'rq-08', code: 'DT0008', type: 'cong-tac', employeeId: 'emp-11', status: 'Chờ duyệt', startDate: addDaysISO(today, 3), endDate: addDaysISO(today, 4), quantity: 2, reasonId: 'rs-7', note: 'Công tác đào tạo tại chi nhánh mẫu.', steps: buildSteps(employees.find(e => e.id === 'emp-11')!, partial, 'cong-tac') }),
    base({ id: 'rq-09', code: 'DT0009', type: 'lam-them-gio', employeeId: 'emp-02', status: 'Đã duyệt', startDate: addDaysISO(today, -6), quantity: 2, startTime: '18:00', endTime: '20:00', reasonId: 'rs-6', note: 'Trực vận hành cuối tuần.', steps: buildSteps(employees.find(e => e.id === 'emp-02')!, partial, 'lam-them-gio').map(s => ({ ...s, status: 'Đã duyệt' as const })) }),
    base({ id: 'rq-10', code: 'DT0010', type: 'nghi-phep', employeeId: 'emp-03', status: 'Nháp', startDate: addDaysISO(today, 8), endDate: addDaysISO(today, 8), quantity: 1, leaveTypeId: 'lt-nam', reasonId: 'rs-1', note: 'Nháp chưa gửi.', steps: [] }),
  ];
  const delegations = [{
    id: 'uq-1', fromName: 'Hà Minh Khôi', toName: USER.name, startDate: addDaysISO(today, -10), endDate: addDaysISO(today, 30),
    types: [] as TimeRequest['type'][], active: true,
  }];
  return { shifts, leaveTypes, leavePolicy, otPolicy, requestReasons: reasons, requestProcedures, delegations, leaveBalances, requests };
}
