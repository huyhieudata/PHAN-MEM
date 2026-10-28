import { monthCells, shiftOn } from '../attendance';
import type { Employee, HrState } from '../types';
import { evaluateFormula, formulaRefs } from './formula';
import type { PayrollComponent, PayrollLine, TableSettings } from './types';

const RATES: Record<string, number> = {
  BHXH_NLD_RATE: 8,
  BHYT_NLD_RATE: 1.5,
  BHTN_NLD_RATE: 1,
  BHXH_DN_RATE: 17.5,
  BHYT_DN_RATE: 3,
  BHTN_DN_RATE: 1,
  BH_TNLD_BNN_DN_RATE: 0.5,
  BH_TNLD_BNN_NLD_RATE: 0,
  GIAM_TRU_BAN_THAN: 11_000_000,
  GIAM_TRU_NGUOI_PHU_THUOC: 4_400_000,
};

export function periodRange(period: string) {
  const [year, month] = period.split('-').map(Number);
  const last = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    year, month,
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(last)}`,
    label: `01/${pad(month)}/${year} - ${pad(last)}/${pad(month)}/${year}`,
  };
}

export function payrollEmployees(state: HrState, scope: { period: string; unitIds: string[]; positionIds: string[]; employeeIds: string[] }, table: TableSettings): Employee[] {
  const { from, to } = periodRange(scope.period);
  return state.employees.filter(employee => {
    if (scope.unitIds.length && !scope.unitIds.includes(employee.unitId)) return false;
    if (scope.positionIds.length && !scope.positionIds.includes(employee.positionId)) return false;
    if (scope.employeeIds.length && !scope.employeeIds.includes(employee.id)) return false;
    const working = table.working && employee.status === 'Đang làm việc';
    const resigned = table.resignedInPeriod && employee.resignDate >= from && employee.resignDate <= to;
    const maternity = table.maternity && state.requests.some(request => request.employeeId === employee.id && request.type === 'nghi-thai-san' && request.status === 'Đã duyệt' && request.startDate <= to && request.endDate >= from);
    return working || resigned || maternity;
  });
}

export function computeLines(state: HrState, scope: { period: string; unitIds: string[]; positionIds: string[]; employeeIds: string[] }, components: PayrollComponent[], table: TableSettings): PayrollLine[] {
  return payrollEmployees(state, scope, table).map(employee => ({
    employeeId: employee.id,
    values: computeEmployee(state, employee, scope.period, components),
  }));
}

export function computeEmployee(state: HrState, employee: Employee, period: string, components: PayrollComponent[]): Record<string, string | number> {
  const inputs = buildInputs(state, employee, period);
  const values: Record<string, string | number> = { ...inputs };
  for (const component of components) {
    if (component.kind !== 'Nhập tay') continue;
    if (values[component.code] == null || values[component.code] === '') values[component.code] = component.format === 'Văn bản' || component.format === 'Ngày' ? component.value : Number(component.value) || 0;
  }
  const pending = components.filter(item => item.kind !== 'Nhập tay' && item.formula.trim());
  const left = [...pending];
  for (let pass = 0; pass < left.length + 2 && left.length; pass += 1) {
    let moved = false;
    for (let i = left.length - 1; i >= 0; i -= 1) {
      const refs = formulaRefs(left[i].formula);
      if (refs.every(code => values[code] != null)) {
        values[left[i].code] = safeEval(left[i].formula, values);
        left.splice(i, 1);
        moved = true;
      }
    }
    if (!moved) break;
  }
  left.forEach(item => { values[item.code] = safeEval(item.formula, values); });
  return values;
}

function safeEval(formula: string, values: Record<string, string | number>) {
  try {
    return evaluateFormula(formula, values);
  } catch {
    return 0;
  }
}

function buildInputs(state: HrState, employee: Employee, period: string): Record<string, string | number> {
  const { year, month, from, to, label } = periodRange(period);
  const cells = monthCells(state, employee.id, year, month);
  const contract = state.contracts.filter(item => item.employeeId === employee.id && item.status !== 'Thanh lý').sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const salary = contract?.salary ?? 0;
  const deps = state.dependents.filter(item => item.employeeId === employee.id && item.taxDependent).length;
  const requests = state.requests.filter(item => item.employeeId === employee.id && item.status === 'Đã duyệt' && item.startDate <= to && item.endDate >= from);
  const ot = requests.filter(item => item.type === 'lam-them-gio').reduce((sum, item) => sum + item.quantity, 0);
  const leave = requests.filter(item => item.type === 'nghi-phep').reduce((sum, item) => sum + item.quantity, 0);
  const unpaid = requests.filter(item => item.type === 'nghi-phep' && state.requestReasons.find(reason => reason.id === item.reasonId)?.pay === 'unpaid').reduce((sum, item) => sum + item.quantity, 0);
  const work = round1(cells.reduce((sum, cell) => sum + cell.work, 0));
  const hours = round1(cells.reduce((sum, cell) => sum + cell.hours, 0));
  const standard = state.standardWorkdays.find(item => item.scope === 'Toàn công ty')?.days || state.standardWorkdays[0]?.days || 0;
  const unit = state.units.find(item => item.id === employee.unitId);
  const position = state.positions.find(item => item.id === employee.positionId);
  const branch = state.branches.find(item => item.id === employee.branchId);
  let late = 0;
  let early = 0;
  cells.forEach(cell => {
    const shift = shiftOn(state, employee.id, cell.date);
    const punches = state.punches.filter(item => item.employeeId === employee.id && item.at.slice(0, 10) === cell.date).sort((a, b) => a.at.localeCompare(b.at));
    if (!shift || !punches.length) return;
    const start = clock(shift.start);
    const end = clock(shift.end);
    const inn = clock(punches[0].at.slice(11, 16));
    const out = clock(punches[punches.length - 1].at.slice(11, 16));
    late += Math.max(0, inn - start);
    if (punches.length > 1) early += Math.max(0, end - out);
  });
  const reward = state.rewards.filter(item => item.employeeId === employee.id && item.kind === 'reward' && item.date.startsWith(period)).reduce((sum, item) => sum + item.amount, 0);
  const discipline = state.rewards.filter(item => item.employeeId === employee.id && item.kind === 'discipline' && item.date.startsWith(period)).reduce((sum, item) => sum + item.amount, 0);
  const text: Record<string, string | number> = {
    EMPLOYEE_CODE: employee.code,
    FULL_NAME: employee.fullName,
    GENDER: employee.gender,
    PHONE: employee.phone,
    BIRTH_DAY: employee.dob,
    COMPANY_EMAIL: employee.email,
    PERSONAL_EMAIL: employee.personalEmail,
    ID_CARD: employee.idNumber,
    TAX_CODE: employee.taxCode,
    PERMANENT_ADDRESS: employee.address,
    CURRENT_ADDRESS: employee.tempAddress || employee.address,
    BANK_ACCOUNT_NUMBER: employee.bankAccount,
    BANK_NAME: employee.bankName,
    BANK_BRANCH: employee.bankBranch || '',
    POSITION_NAME: position?.name || '',
    POSITION_CODE: position?.code || '',
    GROUP_NAME: unit?.name || '',
    BRANCH_NAME: branch?.name || '',
    START_DATE_OF_WORK: employee.startDate,
    OFFICIAL_START_DATE_OF_WORK: employee.officialDate,
    EMPLOYMENT_STATUS: employee.status,
    EMPLOYMENT_CATEGORY: employee.employmentType,
    RESIGNATION_DATE: employee.resignDate,
    PAYROLL_INFO__KY_LUONG: period,
    PAYROLL_INFO__TU_NGAY: from,
    PAYROLL_INFO__DEN_NGAY: to,
    PAYROLL_INFO__SO_TAI_KHOAN: employee.bankAccount,
    PAYROLL_INFO__NGAN_HANG: employee.bankName,
    PAYROLL_INFO__CHI_NHANH: employee.bankBranch || '',
    PAYROLL_INFO__MA_SO_THUE: employee.taxCode,
    NUMBER_OF_DEPENDENT_PERSONS: deps,
    INSURANCE_RATE: salary,
    LUONG_CO_BAN_THANG: salary,
    INCOME__LUONG_CO_BAN: salary,
    STANDARD_WORKING_POINT: standard,
    REAL_WORKING_POINT: work,
    WORKING_POINT: work,
    WORKING_HOURS: hours,
    ACTUAL_WORKING_HOURS: hours,
    STANDARD_WORKING_HOURS: standard * 8,
    OT_HOURS: ot,
    OT_NORMAL_HOURS: ot,
    OT_NORMAL_HOURS_CURR: ot,
    LEAVE: leave,
    LEAVE_UNPAID: unpaid,
    PAID_LEAVE: Math.max(0, leave - unpaid),
    WORK_FROM_HOME: cells.filter(cell => cell.text.includes('WFH')).length,
    ON_BUSINESS: cells.filter(cell => cell.text.includes('CT')).length,
    HOLIDAY: cells.filter(cell => cell.kind === 'holiday').length,
    MINUTES_LATE: late,
    MINUTES_LEAVE_EARLY: early,
    LATE_TIMES: cells.filter(cell => cell.kind === 'late').length,
    REWARD: reward,
    DISCIPLINE: discipline,
    CURRENT_BALANCE: state.leaveBalances.find(item => item.employeeId === employee.id)?.entitled ?? 0,
    ...RATES,
  };
  text.PAYROLL_INFO__TEN_BANG = label;
  return text;
}

function clock(value: string) {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
