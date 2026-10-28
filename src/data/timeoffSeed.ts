import { USER } from './session';
import type { Employee, HrState, TimeRequest } from './types';
import { addDaysISO, todayISO } from './text';
import { buildSteps } from './timeoff';

type Slice = Pick<HrState, 'shifts' | 'leaveTypes' | 'leavePolicy' | 'otPolicy' | 'requestReasons' | 'requestProcedures' | 'delegations' | 'leaveBalances' | 'requests'>;

export function buildTimeoffSeed(employees: Employee[], now = new Date()): Slice {
  const today = todayISO(now);
  const year = now.getFullYear();
  const shifts = [
    { id: 'ca-hc', code: 'HCS-NT', name: 'CA HÀNH CHÍNH NGÀY THƯỜNG', start: '08:30', end: '17:30', kind: 'hanh-chinh' as const, active: true, overnight: false },
    { id: 'ca-t7', code: 'HC-T7', name: 'CA HÀNH CHÍNH NGÀY THỨ 7', start: '08:30', end: '16:00', kind: 'hanh-chinh' as const, active: true, overnight: false },
    { id: 'ca-sang', code: 'S', name: 'Ca sáng', start: '06:00', end: '14:00', kind: 'don' as const, active: true, overnight: false },
    { id: 'ca-chieu', code: 'C', name: 'Ca chiều', start: '14:00', end: '22:00', kind: 'don' as const, active: true, overnight: false },
    { id: 'ca-dem', code: 'D', name: 'Ca đêm', start: '22:00', end: '06:00', kind: 'nang-cao' as const, active: true, overnight: true },
  ];
  const leaveTypes = [
    { id: 'lt-nam', name: 'Phép năm', paid: true, deduct: true },
    { id: 'lt-kl', name: 'Nghỉ không lương', paid: false, deduct: false },
    { id: 'lt-om', name: 'Nghỉ ốm', paid: true, deduct: false },
    { id: 'lt-cuoi', name: 'Nghỉ cưới', paid: true, deduct: false },
    { id: 'lt-tang', name: 'Nghỉ tang', paid: true, deduct: false },
  ];
  const leavePolicy = { id: 'lp-1', name: 'Phép năm chuẩn', annualDays: 12, carryOverMax: 3, minNoticeDays: 0, allowNegative: false };
  const otPolicy = { id: 'ot-1', name: 'Chính sách OT toàn công ty', weekdayRate: 150, weekendRate: 200, holidayRate: 300, noShiftRate: 200, dailyHourCap: 4, monthlyHourCap: 40, method: 'don' as const, overnight: 'tao-don' as const, scope: 'Toàn công ty', payMode: 'rate' as const, payPercent: 100, compPercent: 0, maxOrdersPerMonth: 30, leadDays: 0, requirePhoto: false, noOverlapShift: true, rules: 'Cần làm đơn trước khi tăng ca. Không tạo đơn trùng ca làm việc.' };
  const reasonRows: [string, string, TimeRequest['type'], string][] = [
    ['rs-1', 'PN', 'nghi-phep', 'Nghỉ phép năm'],
    ['rs-2', 'OCT', 'nghi-phep', 'Nghỉ ốm có chứng từ'],
    ['rs-coo', 'COO', 'nghi-phep', 'Nghỉ chăm con ốm'],
    ['rs-ckh', 'CKH', 'nghi-phep', 'Nghỉ con kết hôn'],
    ['rs-kh', 'KH', 'nghi-phep', 'Nghỉ kết hôn'],
    ['rs-nt', 'NT', 'nghi-phep', 'Nghỉ tang'],
    ['rs-sts', 'STS', 'nghi-phep', 'Nghỉ sau thai sản'],
    ['rs-ts', 'TS', 'nghi-phep', 'Nghỉ thai sản'],
    ['rs-kl', 'KL', 'nghi-phep', 'Nghỉ không lương'],
    ['rs-5', 'OT1', 'lam-them-gio', 'Hoàn thành dự án'],
    ['rs-6', 'OT2', 'lam-them-gio', 'Trực vận hành'],
    ['rs-3', 'DM', 'di-muon-ve-som', 'Đưa người nhà đi khám'],
    ['rs-7', 'CT', 'cong-tac', 'Gặp khách hàng'],
    ['rs-9', 'WFH', 'lam-viec-tai-nha', 'Làm việc tập trung'],
    ['rs-11', 'SC', 'sua-cham-cong', 'Quên chấm công'],
    ['rs-13', 'DC', 'doi-ca', 'Đổi ca hỗ trợ đồng nghiệp'],
    ['rs-rn', 'RN', 'ra-ngoai', 'Việc cá nhân ngoài văn phòng'],
  ];
  const reasons = reasonRows.map(([id, code, type, name]) => ({ id, code, type, name, active: true, maxDays: 'Không giới hạn', maxOrders: 'Không giới hạn', maxWork: 'Không giới hạn', requireAttachment: false, pay: 'use-leave' as const }));
  const allTypes = ['nghi-phep', 'sua-cham-cong', 'lam-them-gio', 'lam-viec-tai-nha', 'cong-tac', 'ra-ngoai', 'di-muon-ve-som', 'doi-ca', 'nghi-thai-san', 'dang-ky-mang-thai', 'di-lam-som-sau-sinh', 'xin-nghi-viec'] as TimeRequest['type'][];
  const step = (order: number, role: 'Quản lý trực tiếp' | 'Trưởng phòng Nhân sự' | 'Giám đốc') => ({ order, role, fromDays: 0, toDays: 'Không giới hạn', skipSla: false, slaAmount: 2, slaMode: 'no-weekend' as const });
  const requestProcedures = [
    { id: 'qt-chung', name: 'Quy trình duyệt đơn chung', scope: 'Toàn công ty', types: allTypes.filter(t => t !== 'lam-viec-tai-nha'), steps: [step(1, 'Quản lý trực tiếp'), step(2, 'Giám đốc')], followers: ['HCNS', USER.name] },
    { id: 'qt-hcns', name: 'Quy trình HCNS', scope: 'Phòng Nhân sự', types: ['nghi-phep'] as TimeRequest['type'][], steps: [step(1, 'Trưởng phòng Nhân sự')], followers: [USER.name] },
  ];
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
  const partial = { employees, positions: [] as HrState['positions'], requestProcedures } as HrState;
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
    project: '',
    prevDay: false,
    nextDay: false,
    breakMid: false,
    caseType: '',
    dueDate: '',
    birthDate: '',
    childCount: 1,
    swapMode: 'self' as const,
    swapWithId: '',
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
    base({ id: 'rq-07', code: 'DT0007', type: 'sua-cham-cong', employeeId: 'emp-08', status: 'Từ chối', startDate: addDaysISO(today, -4), quantity: 1, startTime: '08:30', endTime: '17:30', reasonId: 'rs-11', note: 'Quên chấm công ngày hôm trước.', steps: buildSteps(employees.find(e => e.id === 'emp-08')!, partial, 'sua-cham-cong').map((s, i) => i === 0 ? { ...s, status: 'Từ chối' as const, note: 'Thiếu ảnh chấm công', actedAt: addDaysISO(today, -3) } : s) }),
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
