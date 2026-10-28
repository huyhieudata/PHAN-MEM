/** Mô hình dữ liệu nhân sự. Mọi màn hình chỉ đọc/ghi qua repository. */

export type Id = string;

export type EmployeeStatus = 'Đang làm việc' | 'Tạm nghỉ' | 'Đã nghỉ việc';
export type EmploymentType = 'Chính thức' | 'Thử việc' | 'Thực tập' | 'Cộng tác viên' | 'Học việc' | 'Thuê ngoài' | 'Thời vụ' | 'Part-time';
export type Gender = 'Nam' | 'Nữ' | 'Khác';
export type Marital = 'Độc thân' | 'Đã kết hôn' | 'Ly hôn' | 'Khác';
export type RecordStatus = 'Hoạt động' | 'Ngừng';

export type ContractType =
  | 'Thử việc'
  | 'Xác định thời hạn'
  | 'Không xác định thời hạn'
  | 'Thực tập'
  | 'Cộng tác';
export type ContractStatus = 'Chờ ký' | 'Hiệu lực' | 'Thanh lý';

export type DecisionType =
  | 'Bổ nhiệm'
  | 'Miễn nhiệm'
  | 'Điều chuyển'
  | 'Điều chuyển nội bộ'
  | 'Tăng lương'
  | 'Điều chỉnh lương & phụ cấp'
  | 'Tạm hoãn HĐLĐ'
  | 'Tạm đình chỉ công việc'
  | 'Sa thải'
  | 'Chấm dứt HĐLĐ'
  | 'Khen thưởng'
  | 'Kỷ luật'
  | 'Nghỉ việc'
  | 'Khác';
export type DecisionStatus = 'Nháp' | 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
export type RewardKind = 'reward' | 'discipline';

export interface Branch {
  id: Id;
  code: string;
  name: string;
  address: string;
  phone: string;
  status: RecordStatus;
}

export interface OrgLevel {
  id: Id;
  name: string;
  rank: number;
}

export interface OrgUnit {
  id: Id;
  code: string;
  name: string;
  parentId: string | null;
  levelId: string;
  branchId: string;
  managerId: string | null;
  status: RecordStatus;
}

export interface Position {
  id: Id;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
}

export interface Employee {
  id: Id;
  code: string;
  fullName: string;
  gender: Gender;
  dob: string;
  phone: string;
  email: string;
  personalEmail: string;
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  nationality: string;
  ethnicity: string;
  religion: string;
  marital: Marital;
  address: string;
  hometown: string;
  bankName: string;
  bankAccount: string;
  taxCode: string;
  branchId: string;
  unitId: string;
  positionId: string;
  managerId: string | null;
  startDate: string;
  officialDate: string;
  resignDate: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  note: string;
  englishName?: string;
  officePhone?: string;
  province?: string;
  ward?: string;
  tempAddress?: string;
  educationLevel?: string;
  school?: string;
  major?: string;
  gradYear?: string;
  roleName?: string;
  appUsed?: boolean;
  noAttendance?: boolean;
  concurrentPosition?: string;
  salaryRegion?: string;
  bankBranch?: string;
  siMonths?: string;
  workCondition?: string;
  passportNumber?: string;
  siNumber: string;
  siStart: string;
  hiNumber: string;
  hospital: string;
}

export interface Contract {
  id: Id;
  code: string;
  employeeId: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  signedDate: string;
  salary: number;
  status: ContractStatus;
  note: string;
}

export interface Dependent {
  id: Id;
  employeeId: string;
  name: string;
  relation: string;
  dob: string;
  idNumber: string;
  taxDependent: boolean;
  fromDate: string;
  toDate: string;
}

export interface Certificate {
  id: Id;
  employeeId: string;
  name: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  kind: string;
}

export interface HeadcountPlan {
  id: Id;
  unitId: string;
  positionId: string;
  year: number;
  planned: number;
  note: string;
}

export interface Decision {
  id: Id;
  code: string;
  title: string;
  type: DecisionType;
  employeeId: string;
  content: string;
  effectiveDate: string;
  status: DecisionStatus;
  createdBy: string;
  createdAt: string;
  decidedBy: string;
  decidedAt: string;
  note: string;
  extras?: Record<string, string>;
}

export interface Reward {
  id: Id;
  employeeId: string;
  kind: RewardKind;
  title: string;
  form: string;
  date: string;
  amount: number;
  reason: string;
  decisionId: string | null;
}

export type TimeRequestType =
  | 'nghi-phep'
  | 'sua-cham-cong'
  | 'lam-them-gio'
  | 'lam-viec-tai-nha'
  | 'cong-tac'
  | 'ra-ngoai'
  | 'di-muon-ve-som'
  | 'doi-ca'
  | 'nghi-thai-san'
  | 'dang-ky-mang-thai'
  | 'di-lam-som-sau-sinh'
  | 'xin-nghi-viec';

export type TimeRequestStatus = 'Nháp' | 'Chờ duyệt' | 'Đang duyệt' | 'Đã duyệt' | 'Từ chối' | 'Đã hủy';
export type BalanceState = 'none' | 'pending' | 'used';
export type ProcedureRole = 'Quản lý trực tiếp' | 'Trưởng phòng Nhân sự' | 'Giám đốc';

export interface WorkShift {
  id: Id;
  code: string;
  name: string;
  start: string;
  end: string;
  kind: 'hanh-chinh' | 'don' | 'nang-cao';
  active: boolean;
  overnight: boolean;
}

export interface LeaveType {
  id: Id;
  name: string;
  paid: boolean;
  deduct: boolean;
}

export interface LeavePolicy {
  id: Id;
  name: string;
  annualDays: number;
  carryOverMax: number;
  minNoticeDays: number;
  allowNegative: boolean;
}

export interface OtPolicy {
  id: Id;
  name: string;
  weekdayRate: number;
  weekendRate: number;
  holidayRate: number;
  noShiftRate: number;
  dailyHourCap: number;
  monthlyHourCap: number;
  method: 'don' | 'ngay' | 'tuan';
  overnight: 'tao-don' | 'tung-ngay';
  scope: string;
  payMode: 'rate' | 'rate-day' | 'limit';
  payPercent: number;
  compPercent: number;
  maxOrdersPerMonth: number;
  leadDays: number;
  requirePhoto: boolean;
  noOverlapShift: boolean;
  rules: string;
}

export interface RequestReason {
  id: Id;
  code: string;
  type: TimeRequestType;
  name: string;
  active: boolean;
  maxDays: string;
  maxOrders: string;
  maxWork: string;
  requireAttachment: boolean;
  pay: 'use-leave' | 'paid-no-leave' | 'unpaid';
}

export interface RequestProcedure {
  id: Id;
  name: string;
  scope: string;
  types: TimeRequestType[];
  steps: { order: number; role: ProcedureRole; fromDays: number; toDays: string; skipSla: boolean; slaAmount: number; slaMode: 'all' | 'no-sun' | 'no-weekend' }[];
  followers: string[];
}

export interface RequestTypeSetting {
  type: TimeRequestType;
  description: string;
  rule: string;
  enabled: boolean;
}

export interface OtThreshold {
  id: Id;
  name: string;
  effectiveDate: string;
  wholeWorkspace: boolean;
  scope: string;
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  warnDaily: number;
  warnWeekly: number;
  warnMonthly: number;
  email: boolean;
  onExceed: boolean;
  recipients: string[];
  extraRecipients: string;
  frequency: string;
  isDefault: boolean;
}

export interface LeaveSource {
  kind: 'nam' | 'sinh-nhat' | 'tham-nien' | 'nghi-bu';
  active: boolean;
  days: number;
  firstMonthAfter: number;
  startFrom: 'official' | 'start';
  accrualPoint: 'fixed' | 'month-end';
  formula: 'monthly' | 'full-year' | 'split-12';
  expiry: 'this-year' | 'next-year';
  reclaimMonth: string;
  maxUse: number;
}

export interface LeavePolicyV2 {
  id: Id;
  name: string;
  month: string;
  scope: string;
  employmentTypes: string[];
  sources: LeaveSource[];
}

export interface ApprovalDelegation {
  id: Id;
  fromName: string;
  toName: string;
  startDate: string;
  endDate: string;
  types: TimeRequestType[];
  active: boolean;
}

export interface LeaveBalance {
  id: Id;
  employeeId: string;
  year: number;
  leaveTypeId: string;
  entitled: number;
  carried: number;
  used: number;
  pending: number;
}

export interface ApprovalStep {
  order: number;
  role: string;
  approverName: string;
  status: 'Chờ' | 'Đã duyệt' | 'Từ chối';
  note: string;
  actedAt: string;
}

export interface StatusEvent {
  at: string;
  actor: string;
  action: string;
  note: string;
}

export interface TimeRequest {
  id: Id;
  code: string;
  type: TimeRequestType;
  employeeId: string;
  createdBy: string;
  onBehalf: boolean;
  reasonId: string;
  note: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  quantity: number;
  leaveTypeId: string;
  shiftId: string;
  targetShiftId: string;
  project: string;
  prevDay: boolean;
  nextDay: boolean;
  breakMid: boolean;
  caseType: string;
  dueDate: string;
  birthDate: string;
  childCount: number;
  swapMode: 'other' | 'self' | 'drop';
  swapWithId: string;
  status: TimeRequestStatus;
  watchers: string[];
  steps: ApprovalStep[];
  history: StatusEvent[];
  balanceState: BalanceState;
  createdAt: string;
}

export interface TimeRequestInput {
  type: TimeRequestType;
  employeeId: string;
  onBehalf: boolean;
  reasonId: string;
  note: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  quantity: number;
  leaveTypeId: string;
  shiftId: string;
  targetShiftId: string;
  watchers: string[];
  project?: string;
  prevDay?: boolean;
  nextDay?: boolean;
  breakMid?: boolean;
  caseType?: string;
  dueDate?: string;
  birthDate?: string;
  childCount?: number;
  swapMode?: 'other' | 'self' | 'drop';
  swapWithId?: string;
  submit: boolean;
}

export type PunchMethod = 'GPS' | 'Vân tay' | 'Hình ảnh có vị trí' | 'Tracker' | 'Hanet Camera';

export interface Punch {
  id: Id;
  employeeId: string;
  at: string;
  code: string;
  method: PunchMethod;
  machine: string;
  device: string;
  ip: string;
  gps: string;
  branchId: string;
  actor: string;
}

export interface FraudAlert {
  id: Id;
  at: string;
  employeeId: string;
  kind: string;
  level: 'Cao' | 'Vừa' | 'Thấp';
  detail: string;
  conclusion: 'Chờ xử lý' | 'Hợp lệ' | 'Vi phạm' | 'Bỏ qua';
}

export interface ShiftAssignment {
  id: Id;
  employeeId: string;
  date: string;
  shiftId: string;
}

export interface ShiftPlan {
  id: Id;
  title: string;
  scope: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Holiday {
  id: Id;
  name: string;
  startDate: string;
  endDate: string;
  scope: string;
}

export interface TimesheetTemplate {
  id: Id;
  name: string;
  description: string;
  active: boolean;
}

export interface StandardWorkday {
  id: Id;
  scope: string;
  days: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceMethod {
  id: Id;
  name: string;
  methods: string;
  scope: string;
  byBranch: string;
  updatedAt: string;
}

export interface WorkdayConfig {
  mode: 'last' | 'fixed';
  fixedDay: number;
  confirmFlow: boolean;
  reminder: boolean;
}

export interface HrState {
  branches: Branch[];
  levels: OrgLevel[];
  units: OrgUnit[];
  positions: Position[];
  employees: Employee[];
  contracts: Contract[];
  dependents: Dependent[];
  certificates: Certificate[];
  headcounts: HeadcountPlan[];
  decisions: Decision[];
  rewards: Reward[];
  shifts: WorkShift[];
  leaveTypes: LeaveType[];
  leavePolicy: LeavePolicy;
  otPolicy: OtPolicy;
  requestReasons: RequestReason[];
  requestProcedures: RequestProcedure[];
  delegations: ApprovalDelegation[];
  leaveBalances: LeaveBalance[];
  requests: TimeRequest[];
  requestTypeSettings: RequestTypeSetting[];
  deadlineDays: number;
  otApproveAfter: boolean;
  otAdjustByRaw: boolean;
  otThresholds: OtThreshold[];
  leavePoliciesV2: LeavePolicyV2[];
  punches: Punch[];
  fraudAlerts: FraudAlert[];
  assignments: ShiftAssignment[];
  shiftPlans: ShiftPlan[];
  holidays: Holiday[];
  timesheetTemplates: TimesheetTemplate[];
  standardWorkdays: StandardWorkday[];
  attendanceMethods: AttendanceMethod[];
  workdayConfig: WorkdayConfig;
  openShiftEnabled: boolean;
  faceProfiles: { id: Id; employeeId: string; updatedAt: string }[];
  proxyClocks: { id: Id; helperId: string; employeeId: string; note: string }[];
}

export type EmployeeInput = Omit<Employee, 'id'>;
export type ContractInput = Omit<Contract, 'id'>;
export type DependentInput = Omit<Dependent, 'id'>;
export type CertificateInput = Omit<Certificate, 'id'>;
export type HeadcountInput = Omit<HeadcountPlan, 'id'>;
export type BranchInput = Omit<Branch, 'id'>;
export type LevelInput = Omit<OrgLevel, 'id'>;
export type UnitInput = Omit<OrgUnit, 'id'>;
export type PositionInput = Omit<Position, 'id'>;
export type RewardInput = Omit<Reward, 'id'>;

export interface DecisionInput {
  title: string;
  type: DecisionType;
  employeeId: string;
  content: string;
  effectiveDate: string;
  submit: boolean;
  extras?: Record<string, string>;
}

export type FieldErrors = Record<string, string>;
export type Result<T = void> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export interface ImportResult {
  added: number;
  updated: number;
  errors: string[];
}
