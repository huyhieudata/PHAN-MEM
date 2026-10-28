import { USER } from './session';
import type {
  ApprovalDelegation, ApprovalStep, Employee, FieldErrors, HrState, LeaveBalance,
  LeaveType, ProcedureRole, TimeRequest, TimeRequestInput, TimeRequestType,
} from './types';
import { addDaysISO, isISODate, todayISO } from './text';
import { toCsv } from './csv';

export const REQUEST_TYPES: { id: TimeRequestType; label: string; unit: 'ngày' | 'giờ' }[] = [
  { id: 'nghi-phep', label: 'Nghỉ phép', unit: 'ngày' },
  { id: 'di-muon-ve-som', label: 'Đi muộn / về sớm', unit: 'giờ' },
  { id: 'lam-them-gio', label: 'Làm thêm giờ', unit: 'giờ' },
  { id: 'cong-tac', label: 'Công tác', unit: 'ngày' },
  { id: 'lam-viec-tai-nha', label: 'Làm việc tại nhà', unit: 'ngày' },
  { id: 'bo-sung-cong', label: 'Bổ sung công', unit: 'ngày' },
  { id: 'doi-ca', label: 'Đổi ca', unit: 'ngày' },
];

export function requestLabel(type: TimeRequestType): string {
  return REQUEST_TYPES.find(item => item.id === type)?.label ?? type;
}

export function requestUnit(type: TimeRequestType): 'ngày' | 'giờ' {
  return REQUEST_TYPES.find(item => item.id === type)?.unit ?? 'ngày';
}

export function countWeekdays(start: string, end: string): number {
  if (!isISODate(start) || !isISODate(end) || end < start) return 0;
  let count = 0;
  let cursor = start;
  while (cursor <= end && count < 366) {
    const [y, m, d] = cursor.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor = addDaysISO(cursor, 1);
  }
  return count;
}

export function hoursBetween(start: string, end: string): number {
  const parse = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
  };
  const diff = parse(end) - parse(start);
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.round((diff / 60) * 10) / 10;
}

export function leaveRemaining(balance: LeaveBalance | undefined): number {
  if (!balance) return 0;
  return round1(balance.entitled + balance.carried - balance.used - balance.pending);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function findBalance(state: HrState, employeeId: string, leaveTypeId: string, year: number): LeaveBalance | undefined {
  return state.leaveBalances.find(b => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId && b.year === year);
}

export function deductsBalance(state: HrState, input: Pick<TimeRequestInput, 'type' | 'leaveTypeId'>): LeaveType | undefined {
  if (input.type !== 'nghi-phep') return undefined;
  const type = state.leaveTypes.find(item => item.id === input.leaveTypeId);
  return type?.deduct ? type : undefined;
}

export function resolveApprover(role: ProcedureRole | string, employee: Employee, state: HrState): string {
  if (role === 'Giám đốc') return USER.name;
  if (role === 'Trưởng phòng Nhân sự') {
    return state.employees.find(e => e.positionId === 'pos-tpns' && e.status !== 'Đã nghỉ việc')?.fullName ?? USER.name;
  }
  return state.employees.find(e => e.id === employee.managerId)?.fullName ?? USER.name;
}

export function buildSteps(employee: Employee, state: HrState, type: TimeRequestType): ApprovalStep[] {
  const procedure = state.requestProcedures.find(item => item.type === type);
  const roles = procedure?.steps?.length ? procedure.steps : [
    { order: 1, role: 'Quản lý trực tiếp' as const },
    { order: 2, role: 'Giám đốc' as const },
  ];
  return [...roles].sort((a, b) => a.order - b.order).map(step => ({
    order: step.order,
    role: step.role,
    approverName: resolveApprover(step.role, employee, state),
    status: 'Chờ' as const,
    note: '',
    actedAt: '',
  }));
}

export function currentStep(request: TimeRequest): ApprovalStep | undefined {
  return request.steps.find(step => step.status === 'Chờ');
}

export function delegationCovers(delegation: ApprovalDelegation, fromName: string, actor: string, type: TimeRequestType, today: string): boolean {
  return delegation.active && delegation.fromName === fromName && delegation.toName === actor
    && delegation.startDate <= today && delegation.endDate >= today
    && (delegation.types.length === 0 || delegation.types.includes(type));
}

export function canAct(request: TimeRequest, actor: string, state: HrState, today = todayISO()): boolean {
  if (request.status !== 'Chờ duyệt' && request.status !== 'Đang duyệt') return false;
  const step = currentStep(request);
  if (!step) return false;
  if (step.approverName === actor) return true;
  return state.delegations.some(item => delegationCovers(item, step.approverName, actor, request.type, today));
}

export function otHoursInMonth(state: HrState, employeeId: string, month: string, exceptId?: string): number {
  return round1(state.requests.filter(request => request.id !== exceptId && request.employeeId === employeeId && request.type === 'lam-them-gio'
    && (request.status === 'Đã duyệt' || request.status === 'Chờ duyệt' || request.status === 'Đang duyệt')
    && request.startDate.startsWith(month)).reduce((sum, request) => sum + request.quantity, 0));
}

export function validateTimeRequest(input: TimeRequestInput, state: HrState, exceptId?: string): FieldErrors {
  const errors: FieldErrors = {};
  const employee = state.employees.find(item => item.id === input.employeeId);
  if (!employee) errors.employeeId = 'Chọn nhân sự.';
  if (!input.startDate || !isISODate(input.startDate)) errors.startDate = 'Ngày bắt đầu không hợp lệ.';
  if (input.endDate && !isISODate(input.endDate)) errors.endDate = 'Ngày kết thúc không hợp lệ.';
  if (input.startDate && input.endDate && input.endDate < input.startDate) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) errors.quantity = 'Số lượng phải lớn hơn 0.';
  if (input.type === 'nghi-phep' && !state.leaveTypes.some(item => item.id === input.leaveTypeId)) errors.leaveTypeId = 'Chọn loại phép.';
  if (input.type === 'doi-ca') {
    if (!state.shifts.some(item => item.id === input.shiftId)) errors.shiftId = 'Chọn ca hiện tại.';
    if (!state.shifts.some(item => item.id === input.targetShiftId)) errors.targetShiftId = 'Chọn ca muốn đổi.';
    if (input.shiftId && input.shiftId === input.targetShiftId) errors.targetShiftId = 'Ca mới phải khác ca hiện tại.';
  }
  if ((input.type === 'lam-them-gio' || input.type === 'di-muon-ve-som' || input.type === 'bo-sung-cong') && (!input.startTime || !input.endTime)) {
    errors.startTime = 'Nhập giờ bắt đầu và giờ kết thúc.';
  }
  if (input.type === 'nghi-phep' && input.startDate && state.leavePolicy.minNoticeDays > 0) {
    const min = addDaysISO(todayISO(), state.leavePolicy.minNoticeDays);
    if (input.startDate < min) errors.startDate = `Cần báo trước ít nhất ${state.leavePolicy.minNoticeDays} ngày.`;
  }
  const reason = state.requestReasons.find(item => item.id === input.reasonId);
  if (input.reasonId && (!reason || !reason.active || reason.type !== input.type)) errors.reasonId = 'Lý do không thuộc loại đơn này.';
  if (input.note.trim().length < 3) errors.note = 'Nhập nội dung đơn (ít nhất 3 ký tự).';
  if (input.type === 'lam-them-gio' && input.quantity > state.otPolicy.dailyHourCap) {
    errors.quantity = `Giờ OT trong ngày không được quá ${state.otPolicy.dailyHourCap}.`;
  }
  if (input.submit && input.type === 'lam-them-gio' && employee && input.startDate) {
    const used = otHoursInMonth(state, employee.id, input.startDate.slice(0, 7), exceptId) + input.quantity;
    if (used > state.otPolicy.monthlyHourCap) errors.quantity = `Vượt trần OT tháng (${state.otPolicy.monthlyHourCap} giờ).`;
  }
  if (input.submit && employee && deductsBalance(state, input)) {
    const year = Number(input.startDate.slice(0, 4)) || new Date().getFullYear();
    const balance = findBalance(state, employee.id, input.leaveTypeId, year);
    const remain = leaveRemaining(balance);
    if (!state.leavePolicy.allowNegative && input.quantity > remain) {
      errors.quantity = `Không đủ phép. Còn ${remain} ngày.`;
    }
  }
  return errors;
}

export function requestsToCsv(rows: TimeRequest[], state: HrState): string {
  return toCsv(
    ['Mã đơn', 'Loại', 'Nhân sự', 'Mã nhân viên', 'Từ ngày', 'Đến ngày', 'Số lượng', 'Đơn vị', 'Trạng thái', 'Người tạo'],
    rows.map(request => {
      const employee = state.employees.find(item => item.id === request.employeeId);
      return [request.code, requestLabel(request.type), employee?.fullName ?? '', employee?.code ?? '', request.startDate, request.endDate || request.startDate, String(request.quantity), requestUnit(request.type), request.status, request.createdBy];
    }),
  );
}

export function emptyTimeoff(): Pick<HrState, 'shifts' | 'leaveTypes' | 'leavePolicy' | 'otPolicy' | 'requestReasons' | 'requestProcedures' | 'delegations' | 'leaveBalances' | 'requests'> {
  return {
    shifts: [],
    leaveTypes: [],
    leavePolicy: { id: 'lp-1', name: 'Phép năm chuẩn', annualDays: 12, carryOverMax: 3, minNoticeDays: 0, allowNegative: false },
    otPolicy: { id: 'ot-1', name: 'OT chuẩn', weekdayRate: 1.5, weekendRate: 2, holidayRate: 3, dailyHourCap: 4, monthlyHourCap: 40 },
    requestReasons: [],
    requestProcedures: [],
    delegations: [],
    leaveBalances: [],
    requests: [],
  };
}
