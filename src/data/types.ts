/** Mô hình dữ liệu nhân sự. Mọi màn hình chỉ đọc/ghi qua repository. */

export type Id = string;

export type EmployeeStatus = 'Đang làm việc' | 'Tạm nghỉ' | 'Đã nghỉ việc';
export type EmploymentType = 'Chính thức' | 'Thử việc' | 'Thực tập' | 'Thời vụ' | 'Cộng tác viên';
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
  | 'Điều chuyển'
  | 'Tăng lương'
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
  | 'di-muon-ve-som'
  | 'lam-them-gio'
  | 'cong-tac'
  | 'lam-viec-tai-nha'
  | 'bo-sung-cong'
  | 'doi-ca';

export type TimeRequestStatus = 'Nháp' | 'Chờ duyệt' | 'Đang duyệt' | 'Đã duyệt' | 'Từ chối' | 'Đã hủy';
export type BalanceState = 'none' | 'pending' | 'used';
export type ProcedureRole = 'Quản lý trực tiếp' | 'Trưởng phòng Nhân sự' | 'Giám đốc';

export interface WorkShift {
  id: Id;
  code: string;
  name: string;
  start: string;
  end: string;
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
  dailyHourCap: number;
  monthlyHourCap: number;
}

export interface RequestReason {
  id: Id;
  type: TimeRequestType;
  name: string;
  active: boolean;
}

export interface RequestProcedure {
  id: Id;
  type: TimeRequestType;
  name: string;
  steps: { order: number; role: ProcedureRole }[];
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
  submit: boolean;
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
}

export type FieldErrors = Record<string, string>;
export type Result<T = void> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export interface ImportResult {
  added: number;
  updated: number;
  errors: string[];
}
