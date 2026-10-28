import type {
  BranchInput, CertificateInput, ContractInput, DecisionInput, DependentInput,
  EmployeeInput, FieldErrors, HeadcountInput, HrState, LevelInput, PositionInput,
  RewardInput, UnitInput,
} from './types';
import { digits, isEmail, isISODate, todayISO, yearsBetween } from './text';

function req(errors: FieldErrors, key: string, value: string, label: string) {
  if (!value.trim()) errors[key] = `Vui lòng nhập ${label}.`;
}

export function validateBranch(input: BranchInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  req(errors, 'code', input.code, 'mã chi nhánh');
  req(errors, 'name', input.name, 'tên chi nhánh');
  const code = input.code.trim().toLowerCase();
  if (code && state.branches.some(b => b.id !== id && b.code.toLowerCase() === code)) errors.code = 'Mã chi nhánh đã tồn tại.';
  return errors;
}

export function validateLevel(input: LevelInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  req(errors, 'name', input.name, 'tên cấp đơn vị');
  if (!Number.isInteger(input.rank) || input.rank < 1 || input.rank > 9) errors.rank = 'Cấp bậc là số nguyên từ 1 đến 9.';
  const name = input.name.trim().toLowerCase();
  if (name && state.levels.some(l => l.id !== id && l.name.trim().toLowerCase() === name)) errors.name = 'Tên cấp đơn vị đã tồn tại.';
  return errors;
}

export function validateUnit(input: UnitInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  req(errors, 'code', input.code, 'mã đơn vị');
  req(errors, 'name', input.name, 'tên đơn vị');
  if (!state.levels.some(l => l.id === input.levelId)) errors.levelId = 'Chọn cấp đơn vị.';
  if (!state.branches.some(b => b.id === input.branchId)) errors.branchId = 'Chọn chi nhánh.';
  if (input.parentId) {
    if (input.parentId === id) errors.parentId = 'Đơn vị không thể là cha của chính nó.';
    const parent = state.units.find(u => u.id === input.parentId);
    if (!parent) errors.parentId = 'Đơn vị cha không tồn tại.';
    else if (id && isDescendant(state, id, input.parentId)) errors.parentId = 'Không thể chọn đơn vị con làm đơn vị cha.';
    const level = state.levels.find(l => l.id === input.levelId);
    const parentLevel = parent ? state.levels.find(l => l.id === parent.levelId) : undefined;
    if (level && parentLevel && level.rank <= parentLevel.rank) errors.levelId = 'Cấp đơn vị phải thấp hơn đơn vị cha.';
  }
  const code = input.code.trim().toLowerCase();
  if (code && state.units.some(u => u.id !== id && u.code.toLowerCase() === code)) errors.code = 'Mã đơn vị đã tồn tại.';
  if (input.managerId && !state.employees.some(e => e.id === input.managerId)) errors.managerId = 'Người quản lý không tồn tại.';
  return errors;
}

function isDescendant(state: HrState, ancestorId: string, maybeChildId: string): boolean {
  let current = state.units.find(u => u.id === maybeChildId);
  const guard = new Set<string>();
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    if (guard.has(current.id)) return false;
    guard.add(current.id);
    current = state.units.find(u => u.id === current!.parentId);
  }
  return false;
}

export function validatePosition(input: PositionInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  req(errors, 'code', input.code, 'mã vị trí');
  req(errors, 'name', input.name, 'tên vị trí');
  const code = input.code.trim().toLowerCase();
  if (code && state.positions.some(p => p.id !== id && p.code.toLowerCase() === code)) errors.code = 'Mã vị trí đã tồn tại.';
  return errors;
}

export function validateEmployee(input: EmployeeInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  const today = todayISO();
  req(errors, 'fullName', input.fullName, 'họ và tên');
  if (input.fullName.trim() && input.fullName.trim().length < 2) errors.fullName = 'Họ và tên quá ngắn.';
  req(errors, 'phone', input.phone, 'số điện thoại');
  const phone = digits(input.phone);
  if (input.phone.trim() && !/^0\d{9,10}$/.test(phone)) errors.phone = 'Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số.';
  req(errors, 'email', input.email, 'email công ty');
  if (input.email.trim() && !isEmail(input.email)) errors.email = 'Email không đúng định dạng.';
  if (input.personalEmail.trim() && !isEmail(input.personalEmail)) errors.personalEmail = 'Email cá nhân không đúng định dạng.';
  if (input.idNumber.trim() && !/^\d{9}$|^\d{12}$/.test(digits(input.idNumber))) errors.idNumber = 'CCCD/CMND gồm 9 hoặc 12 chữ số.';
  if (input.dob) {
    if (!isISODate(input.dob)) errors.dob = 'Ngày sinh không hợp lệ.';
    else if (input.dob > today) errors.dob = 'Ngày sinh không được ở tương lai.';
    else if (yearsBetween(input.dob, today) < 16) errors.dob = 'Nhân sự phải từ 16 tuổi.';
  }
  if (input.idIssueDate && !isISODate(input.idIssueDate)) errors.idIssueDate = 'Ngày cấp không hợp lệ.';
  req(errors, 'startDate', input.startDate, 'ngày vào làm');
  if (input.startDate && !isISODate(input.startDate)) errors.startDate = 'Ngày vào làm không hợp lệ.';
  if (input.officialDate) {
    if (!isISODate(input.officialDate)) errors.officialDate = 'Ngày chính thức không hợp lệ.';
    else if (input.startDate && input.officialDate < input.startDate) errors.officialDate = 'Ngày chính thức không được trước ngày vào làm.';
  }
  if (input.status === 'Đã nghỉ việc') {
    if (!input.resignDate) errors.resignDate = 'Nhập ngày nghỉ việc.';
    else if (!isISODate(input.resignDate)) errors.resignDate = 'Ngày nghỉ việc không hợp lệ.';
    else if (input.startDate && input.resignDate < input.startDate) errors.resignDate = 'Ngày nghỉ việc không được trước ngày vào làm.';
  }
  if (!state.branches.some(b => b.id === input.branchId)) errors.branchId = 'Chọn chi nhánh.';
  if (!state.units.some(u => u.id === input.unitId)) errors.unitId = 'Chọn đơn vị.';
  if (!state.positions.some(p => p.id === input.positionId)) errors.positionId = 'Chọn vị trí công việc.';
  if (input.managerId && (input.managerId === id || !state.employees.some(e => e.id === input.managerId))) {
    errors.managerId = 'Người quản lý không hợp lệ.';
  }
  const email = input.email.trim().toLowerCase();
  if (email && state.employees.some(e => e.id !== id && e.email.toLowerCase() === email)) errors.email = 'Email đã được dùng.';
  const code = input.code.trim().toLowerCase();
  if (id && !code) errors.code = 'Mã nhân viên không được để trống.';
  if (code && state.employees.some(e => e.id !== id && e.code.toLowerCase() === code)) errors.code = 'Mã nhân viên đã tồn tại.';
  const idNo = digits(input.idNumber);
  if (idNo && state.employees.some(e => e.id !== id && digits(e.idNumber) === idNo)) errors.idNumber = 'Số CCCD đã tồn tại.';
  if (input.siNumber.trim() && !/^\d{6,15}$/.test(digits(input.siNumber))) errors.siNumber = 'Mã BHXH chỉ gồm chữ số.';
  if (input.siStart && !isISODate(input.siStart)) errors.siStart = 'Ngày tham gia BHXH không hợp lệ.';
  return errors;
}

export function validateContract(input: ContractInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.employees.some(e => e.id === input.employeeId)) errors.employeeId = 'Chọn nhân sự.';
  if (!input.type) errors.type = 'Chọn loại hợp đồng.';
  req(errors, 'startDate', input.startDate, 'ngày hiệu lực');
  if (input.startDate && !isISODate(input.startDate)) errors.startDate = 'Ngày hiệu lực không hợp lệ.';
  if (input.type !== 'Không xác định thời hạn' && !input.endDate) errors.endDate = 'Nhập ngày hết hạn.';
  if (input.endDate) {
    if (!isISODate(input.endDate)) errors.endDate = 'Ngày hết hạn không hợp lệ.';
    else if (input.startDate && input.endDate <= input.startDate) errors.endDate = 'Ngày hết hạn phải sau ngày hiệu lực.';
  }
  if (input.signedDate && !isISODate(input.signedDate)) errors.signedDate = 'Ngày ký không hợp lệ.';
  if (!Number.isFinite(input.salary) || input.salary < 0) errors.salary = 'Lương phải là số không âm.';
  const code = input.code.trim().toLowerCase();
  if (id && !code) errors.code = 'Mã hợp đồng không được để trống.';
  if (code && state.contracts.some(c => c.id !== id && c.code.toLowerCase() === code)) errors.code = 'Mã hợp đồng đã tồn tại.';
  return errors;
}

export function validateDependent(input: DependentInput, state: HrState): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.employees.some(e => e.id === input.employeeId)) errors.employeeId = 'Chọn nhân sự.';
  req(errors, 'name', input.name, 'họ tên');
  req(errors, 'relation', input.relation, 'mối quan hệ');
  if (input.dob && !isISODate(input.dob)) errors.dob = 'Ngày sinh không hợp lệ.';
  if (input.idNumber.trim() && !/^\d{9}$|^\d{12}$/.test(digits(input.idNumber))) errors.idNumber = 'Số giấy tờ gồm 9 hoặc 12 chữ số.';
  if (input.fromDate && !isISODate(input.fromDate)) errors.fromDate = 'Từ ngày không hợp lệ.';
  if (input.toDate && !isISODate(input.toDate)) errors.toDate = 'Đến ngày không hợp lệ.';
  if (input.fromDate && input.toDate && input.toDate < input.fromDate) errors.toDate = 'Đến ngày phải sau từ ngày.';
  return errors;
}

export function validateCertificate(input: CertificateInput, state: HrState): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.employees.some(e => e.id === input.employeeId)) errors.employeeId = 'Chọn nhân sự.';
  req(errors, 'name', input.name, 'tên chứng chỉ');
  if (input.issueDate && !isISODate(input.issueDate)) errors.issueDate = 'Ngày cấp không hợp lệ.';
  if (input.expiryDate && !isISODate(input.expiryDate)) errors.expiryDate = 'Ngày hết hạn không hợp lệ.';
  if (input.issueDate && input.expiryDate && input.expiryDate < input.issueDate) errors.expiryDate = 'Ngày hết hạn phải sau ngày cấp.';
  return errors;
}

export function validateHeadcount(input: HeadcountInput, state: HrState, id?: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.units.some(u => u.id === input.unitId)) errors.unitId = 'Chọn đơn vị.';
  if (!state.positions.some(p => p.id === input.positionId)) errors.positionId = 'Chọn vị trí.';
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) errors.year = 'Năm không hợp lệ.';
  if (!Number.isInteger(input.planned) || input.planned < 0) errors.planned = 'Định biên là số nguyên không âm.';
  if (state.headcounts.some(h => h.id !== id && h.unitId === input.unitId && h.positionId === input.positionId && h.year === input.year)) {
    errors.form = 'Đã có định biên cho đơn vị, vị trí và năm này.';
  }
  return errors;
}

export function validateDecision(input: DecisionInput, state: HrState): FieldErrors {
  const errors: FieldErrors = {};
  if (input.title.trim().length < 3) errors.title = 'Tiêu đề cần ít nhất 3 ký tự.';
  if (!input.type) errors.type = 'Chọn loại quyết định.';
  if (!state.employees.some(e => e.id === input.employeeId)) errors.employeeId = 'Chọn nhân sự.';
  if (input.content.trim().length < 5) errors.content = 'Nội dung cần ít nhất 5 ký tự.';
  if (!input.effectiveDate || !isISODate(input.effectiveDate)) errors.effectiveDate = 'Ngày hiệu lực không hợp lệ.';
  return errors;
}

export function validateReward(input: RewardInput, state: HrState): FieldErrors {
  const errors: FieldErrors = {};
  if (!state.employees.some(e => e.id === input.employeeId)) errors.employeeId = 'Chọn nhân sự.';
  req(errors, 'title', input.title, 'tiêu đề');
  req(errors, 'form', input.form, 'hình thức');
  if (!input.date || !isISODate(input.date)) errors.date = 'Ngày không hợp lệ.';
  if (input.reason.trim().length < 3) errors.reason = 'Nhập lý do.';
  if (!Number.isFinite(input.amount) || input.amount < 0) errors.amount = 'Số tiền không hợp lệ.';
  if (input.decisionId && !state.decisions.some(d => d.id === input.decisionId)) errors.decisionId = 'Quyết định không tồn tại.';
  return errors;
}

export function emptyErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
