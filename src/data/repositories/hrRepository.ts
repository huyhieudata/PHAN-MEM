import { employeeTemplateCsv, employeesToCsv, parseCsv } from '../csv';
import { buildSeed } from '../seed';
import { USER } from '../session';
import { buildSteps, canAct, deductsBalance, findBalance, round1, validateTimeRequest } from '../timeoff';
import type {
  ApprovalDelegation, AttendanceMethod, BranchInput, CertificateInput, ContractInput, Decision, DecisionInput, DependentInput,
  Employee, EmployeeInput, FieldErrors, FraudAlert, HeadcountInput, Holiday, HrState, ImportResult, LeaveBalance, LeavePolicy, LeavePolicyV2, LevelInput,
  OtPolicy, OtThreshold, PositionInput, Punch, RequestProcedure, RequestReason, RequestTypeSetting, Result, RewardInput, StandardWorkday, TimeRequest, TimeRequestInput, TimesheetTemplate, UnitInput,
  WorkdayConfig, WorkShift,
} from '../types';
import { plain } from '../text';
import {
  emptyErrors, validateBranch, validateCertificate, validateContract, validateDecision,
  validateDependent, validateEmployee, validateHeadcount, validateLevel, validatePosition, validateReward, validateUnit,
} from '../validate';

export const STORAGE_KEY = 'hrmhub.hr.v1';

export interface HrRepository {
  getState(): HrState;
  subscribe(listener: () => void): () => void;
  reset(): void;
  saveBranch(input: BranchInput, id?: string): Result<{ id: string }>;
  deleteBranch(id: string): Result;
  saveLevel(input: LevelInput, id?: string): Result<{ id: string }>;
  deleteLevel(id: string): Result;
  saveUnit(input: UnitInput, id?: string): Result<{ id: string }>;
  deleteUnit(id: string): Result;
  savePosition(input: PositionInput, id?: string): Result<{ id: string }>;
  deletePosition(id: string): Result;
  saveEmployee(input: EmployeeInput, id?: string): Result<Employee>;
  deleteEmployee(id: string): Result;
  saveContract(input: ContractInput, id?: string): Result<{ id: string }>;
  deleteContract(id: string): Result;
  saveDependent(input: DependentInput, id?: string): Result<{ id: string }>;
  deleteDependent(id: string): Result;
  saveCertificate(input: CertificateInput, id?: string): Result<{ id: string }>;
  deleteCertificate(id: string): Result;
  saveHeadcount(input: HeadcountInput, id?: string): Result<{ id: string }>;
  deleteHeadcount(id: string): Result;
  saveDecision(input: DecisionInput, id?: string, actor?: string): Result<Decision>;
  submitDecision(id: string): Result<Decision>;
  approveDecision(id: string, note: string, actor: string): Result<Decision>;
  rejectDecision(id: string, note: string, actor: string): Result<Decision>;
  deleteDecision(id: string): Result;
  saveReward(input: RewardInput, id?: string): Result<{ id: string }>;
  deleteReward(id: string): Result;
  importEmployeesCsv(text: string): ImportResult;
  exportEmployeesCsv(rows?: Employee[]): string;
  employeeTemplate(): string;
  saveRequest(input: TimeRequestInput, id?: string, actor?: string): Result<TimeRequest>;
  approveRequest(id: string, note: string, actor: string): Result<TimeRequest>;
  rejectRequest(id: string, note: string, actor: string): Result<TimeRequest>;
  cancelRequest(id: string, actor: string): Result<TimeRequest>;
  saveDelegation(input: Omit<ApprovalDelegation, 'id'>, id?: string): Result<{ id: string }>;
  deleteDelegation(id: string): Result;
  saveReason(input: Omit<RequestReason, 'id'>, id?: string): Result<{ id: string }>;
  deleteReason(id: string): Result;
  saveProcedure(input: RequestProcedure): Result<RequestProcedure>;
  saveLeavePolicy(input: LeavePolicy): Result<LeavePolicy>;
  saveOtPolicy(input: OtPolicy): Result<OtPolicy>;
  saveLeaveBalance(input: LeaveBalance): Result<LeaveBalance>;
  saveShift(input: Omit<WorkShift, 'id'>, id?: string): Result<{ id: string }>;
  savePunch(input: Omit<Punch, 'id'>): Result<Punch>;
  deletePunch(id: string): Result;
  setFraudConclusion(id: string, conclusion: FraudAlert['conclusion']): Result;
  saveHoliday(input: Omit<Holiday, 'id'>, id?: string): Result<{ id: string }>;
  deleteHoliday(id: string): Result;
  saveTemplate(input: Omit<TimesheetTemplate, 'id'>, id?: string): Result<{ id: string }>;
  saveStandardWorkday(input: Omit<StandardWorkday, 'id' | 'createdAt' | 'updatedAt'>): Result<{ id: string }>;
  saveAttendanceMethod(input: Omit<AttendanceMethod, 'id' | 'updatedAt'>, id?: string): Result<{ id: string }>;
  deleteAttendanceMethod(id: string): Result;
  saveWorkdayConfig(input: WorkdayConfig): Result;
  setOpenShift(enabled: boolean): Result;
  saveOtThreshold(input: Omit<OtThreshold, 'id'>, id?: string): Result<{ id: string }>;
  saveLeavePolicyV2(input: LeavePolicyV2): Result;
  saveRequestTypeSetting(input: RequestTypeSetting): Result;
  saveDeadline(days: number, otApproveAfter: boolean, otAdjustByRaw: boolean): Result;
  assignShift(employeeId: string, date: string, shiftId: string): Result;
  saveShiftPlan(input: { title: string; scope: string; startDate: string; endDate: string }): Result<{ id: string }>;
}

type MemStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

function nextCode(codes: string[], prefix: string): string {
  const max = codes.reduce((m, code) => {
    const n = parseInt(code.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return prefix + String(max + 1).padStart(4, '0');
}

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
function fail(errors: FieldErrors): Result<never> {
  return { ok: false, errors };
}

function trimEmployee(input: EmployeeInput): EmployeeInput {
  return {
    ...input,
    code: input.code.trim(),
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    personalEmail: input.personalEmail.trim(),
    idNumber: input.idNumber.trim(),
    address: input.address.trim(),
    hometown: input.hometown.trim(),
    note: input.note.trim(),
    siNumber: input.siNumber.trim(),
    hiNumber: input.hiNumber.trim(),
    hospital: input.hospital.trim(),
    bankName: input.bankName.trim(),
    bankAccount: input.bankAccount.trim(),
    taxCode: input.taxCode.trim(),
    managerId: input.managerId || null,
    resignDate: input.status === 'Đã nghỉ việc' ? input.resignDate : '',
  };
}

export function createHrRepository(storage: MemStorage | null = defaultStorage()): HrRepository {
  let state = read(storage);
  const listeners = new Set<() => void>();

  function persist() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* bộ nhớ trình duyệt đầy hoặc bị chặn */ }
  }
  function commit(recipe: (draft: HrState) => void) {
    const draft = structuredClone(state);
    recipe(draft);
    state = draft;
    persist();
    listeners.forEach(l => l());
  }
  function check(errors: FieldErrors): Result<never> | null {
    return emptyErrors(errors) ? null : fail(errors);
  }

  const api: HrRepository = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = buildSeed();
      persist();
      listeners.forEach(l => l());
    },
    saveBranch(input, id) {
      const next = { ...input, code: input.code.trim(), name: input.name.trim(), address: input.address.trim(), phone: input.phone.trim() };
      const bad = check(validateBranch(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('br');
      commit(d => {
        if (id) d.branches = d.branches.map(b => b.id === id ? { ...next, id } : b);
        else d.branches.push({ ...next, id: saved });
      });
      return ok({ id: saved });
    },
    deleteBranch(id) {
      if (state.units.some(u => u.branchId === id) || state.employees.some(e => e.branchId === id)) {
        return fail({ form: 'Không xóa được vì còn đơn vị hoặc nhân sự thuộc chi nhánh này.' });
      }
      commit(d => { d.branches = d.branches.filter(b => b.id !== id); });
      return ok(undefined);
    },
    saveLevel(input, id) {
      const next = { ...input, name: input.name.trim(), rank: Number(input.rank) };
      const bad = check(validateLevel(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('lv');
      commit(d => {
        if (id) d.levels = d.levels.map(l => l.id === id ? { ...next, id } : l);
        else d.levels.push({ ...next, id: saved });
      });
      return ok({ id: saved });
    },
    deleteLevel(id) {
      if (state.units.some(u => u.levelId === id)) return fail({ form: 'Không xóa được vì còn đơn vị đang dùng cấp này.' });
      commit(d => { d.levels = d.levels.filter(l => l.id !== id); });
      return ok(undefined);
    },
    saveUnit(input, id) {
      const next = {
        ...input,
        code: input.code.trim(),
        name: input.name.trim(),
        parentId: input.parentId || null,
        managerId: input.managerId || null,
      };
      const bad = check(validateUnit(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('un');
      commit(d => {
        if (id) d.units = d.units.map(u => u.id === id ? { ...next, id } : u);
        else d.units.push({ ...next, id: saved });
      });
      return ok({ id: saved });
    },
    deleteUnit(id) {
      if (state.units.some(u => u.parentId === id)) return fail({ form: 'Không xóa được vì còn đơn vị con.' });
      if (state.employees.some(e => e.unitId === id)) return fail({ form: 'Không xóa được vì còn nhân sự trong đơn vị.' });
      if (state.headcounts.some(h => h.unitId === id)) return fail({ form: 'Không xóa được vì còn định biên của đơn vị.' });
      commit(d => { d.units = d.units.filter(u => u.id !== id); });
      return ok(undefined);
    },
    savePosition(input, id) {
      const next = { ...input, code: input.code.trim(), name: input.name.trim(), description: input.description.trim() };
      const bad = check(validatePosition(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('pos');
      commit(d => {
        if (id) d.positions = d.positions.map(p => p.id === id ? { ...next, id } : p);
        else d.positions.push({ ...next, id: saved });
      });
      return ok({ id: saved });
    },
    deletePosition(id) {
      if (state.employees.some(e => e.positionId === id)) return fail({ form: 'Không xóa được vì còn nhân sự giữ vị trí này.' });
      if (state.headcounts.some(h => h.positionId === id)) return fail({ form: 'Không xóa được vì còn định biên của vị trí này.' });
      commit(d => { d.positions = d.positions.filter(p => p.id !== id); });
      return ok(undefined);
    },
    saveEmployee(input, id) {
      const next = trimEmployee(input);
      if (!next.code) next.code = nextCode(state.employees.map(e => e.code), 'NV');
      const bad = check(validateEmployee(next, state, id));
      if (bad) return bad;
      const savedId = id ?? uid('emp');
      const employee: Employee = { ...next, id: savedId };
      commit(d => {
        if (id) d.employees = d.employees.map(e => e.id === id ? employee : e);
        else d.employees.push(employee);
      });
      return ok(employee);
    },
    deleteEmployee(id) {
      if (!state.employees.some(e => e.id === id)) return fail({ form: 'Không tìm thấy nhân sự.' });
      commit(d => {
        d.employees = d.employees.filter(e => e.id !== id);
        d.contracts = d.contracts.filter(c => c.employeeId !== id);
        d.dependents = d.dependents.filter(x => x.employeeId !== id);
        d.certificates = d.certificates.filter(x => x.employeeId !== id);
        d.rewards = d.rewards.filter(x => x.employeeId !== id);
        d.decisions = d.decisions.filter(x => x.employeeId !== id);
        d.requests = (d.requests ?? []).filter(x => x.employeeId !== id);
        d.leaveBalances = (d.leaveBalances ?? []).filter(x => x.employeeId !== id);
        d.punches = (d.punches ?? []).filter(x => x.employeeId !== id);
        d.assignments = (d.assignments ?? []).filter(x => x.employeeId !== id);
        for (const unit of d.units) if (unit.managerId === id) unit.managerId = null;
        for (const emp of d.employees) if (emp.managerId === id) emp.managerId = null;
      });
      return ok(undefined);
    },
    saveContract(input, id) {
      const next = { ...input, code: input.code.trim(), note: input.note.trim(), endDate: input.type === 'Không xác định thời hạn' ? '' : input.endDate, salary: Number(input.salary) };
      if (!next.code) next.code = nextCode(state.contracts.map(c => c.code), 'HD');
      const bad = check(validateContract(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('hd');
      commit(d => {
        const row = { ...next, id: saved };
        if (id) d.contracts = d.contracts.map(c => c.id === id ? row : c);
        else d.contracts.push(row);
      });
      return ok({ id: saved });
    },
    deleteContract(id) {
      commit(d => { d.contracts = d.contracts.filter(c => c.id !== id); });
      return ok(undefined);
    },
    saveDependent(input, id) {
      const next = { ...input, name: input.name.trim(), relation: input.relation.trim(), idNumber: input.idNumber.trim() };
      const bad = check(validateDependent(next, state));
      if (bad) return bad;
      const saved = id ?? uid('dep');
      commit(d => {
        const row = { ...next, id: saved };
        if (id) d.dependents = d.dependents.map(x => x.id === id ? row : x);
        else d.dependents.push(row);
      });
      return ok({ id: saved });
    },
    deleteDependent(id) {
      commit(d => { d.dependents = d.dependents.filter(x => x.id !== id); });
      return ok(undefined);
    },
    saveCertificate(input, id) {
      const next = { ...input, name: input.name.trim(), issuer: input.issuer.trim(), number: input.number.trim(), kind: input.kind.trim() };
      const bad = check(validateCertificate(next, state));
      if (bad) return bad;
      const saved = id ?? uid('cer');
      commit(d => {
        const row = { ...next, id: saved };
        if (id) d.certificates = d.certificates.map(x => x.id === id ? row : x);
        else d.certificates.push(row);
      });
      return ok({ id: saved });
    },
    deleteCertificate(id) {
      commit(d => { d.certificates = d.certificates.filter(x => x.id !== id); });
      return ok(undefined);
    },
    saveHeadcount(input, id) {
      const next = { ...input, year: Number(input.year), planned: Number(input.planned), note: input.note.trim() };
      const bad = check(validateHeadcount(next, state, id));
      if (bad) return bad;
      const saved = id ?? uid('hc');
      commit(d => {
        const row = { ...next, id: saved };
        if (id) d.headcounts = d.headcounts.map(h => h.id === id ? row : h);
        else d.headcounts.push(row);
      });
      return ok({ id: saved });
    },
    deleteHeadcount(id) {
      commit(d => { d.headcounts = d.headcounts.filter(h => h.id !== id); });
      return ok(undefined);
    },
    saveDecision(input, id, actor = 'Dương Văn Hiệu') {
      const bad = check(validateDecision(input, state));
      if (bad) return bad;
      if (id) {
        const current = state.decisions.find(d => d.id === id);
        if (!current) return fail({ form: 'Không tìm thấy quyết định.' });
        if (current.status !== 'Nháp') return fail({ form: 'Chỉ sửa được quyết định nháp.' });
        let updated!: Decision;
        commit(d => {
          d.decisions = d.decisions.map(item => {
            if (item.id !== id) return item;
            updated = {
              ...item,
              title: input.title.trim(),
              type: input.type,
              employeeId: input.employeeId,
              content: input.content.trim(),
              effectiveDate: input.effectiveDate,
              status: input.submit ? 'Chờ duyệt' : 'Nháp',
              extras: input.extras,
            };
            return updated;
          });
        });
        return ok(updated);
      }
      const created: Decision = {
        id: uid('qd'),
        code: nextCode(state.decisions.map(d => d.code), 'QD'),
        title: input.title.trim(),
        type: input.type,
        employeeId: input.employeeId,
        content: input.content.trim(),
        effectiveDate: input.effectiveDate,
        status: input.submit ? 'Chờ duyệt' : 'Nháp',
        createdBy: actor,
        createdAt: new Date().toISOString(),
        decidedBy: '',
        decidedAt: '',
        note: '',
        extras: input.extras,
      };
      commit(d => { d.decisions.push(created); });
      return ok(created);
    },
    submitDecision(id) {
      const current = state.decisions.find(d => d.id === id);
      if (!current) return fail({ form: 'Không tìm thấy quyết định.' });
      if (current.status !== 'Nháp') return fail({ form: 'Chỉ gửi duyệt được quyết định nháp.' });
      let updated!: Decision;
      commit(d => {
        d.decisions = d.decisions.map(item => {
          if (item.id !== id) return item;
          updated = { ...item, status: 'Chờ duyệt' };
          return updated;
        });
      });
      return ok(updated);
    },
    approveDecision(id, note, actor) {
      return decide(id, 'Đã duyệt', note, actor);
    },
    rejectDecision(id, note, actor) {
      if (!note.trim()) return fail({ note: 'Nhập lý do từ chối.' });
      return decide(id, 'Từ chối', note, actor);
    },
    deleteDecision(id) {
      const current = state.decisions.find(d => d.id === id);
      if (!current) return fail({ form: 'Không tìm thấy quyết định.' });
      if (current.status === 'Đã duyệt' || current.status === 'Chờ duyệt') {
        return fail({ form: 'Chỉ xóa được quyết định nháp hoặc đã từ chối.' });
      }
      commit(d => { d.decisions = d.decisions.filter(item => item.id !== id); });
      return ok(undefined);
    },
    saveReward(input, id) {
      const next = { ...input, title: input.title.trim(), form: input.form.trim(), reason: input.reason.trim(), amount: Number(input.amount) || 0, decisionId: input.decisionId || null };
      const bad = check(validateReward(next, state));
      if (bad) return bad;
      const saved = id ?? uid('rw');
      commit(d => {
        const row = { ...next, id: saved };
        if (id) d.rewards = d.rewards.map(r => r.id === id ? row : r);
        else d.rewards.push(row);
      });
      return ok({ id: saved });
    },
    deleteReward(id) {
      commit(d => { d.rewards = d.rewards.filter(r => r.id !== id); });
      return ok(undefined);
    },
    importEmployeesCsv(text) {
      return importEmployees(text);
    },
    exportEmployeesCsv(rows) {
      return employeesToCsv(rows ?? state.employees, state);
    },
    employeeTemplate() {
      return employeeTemplateCsv();
    },
    saveRequest(input, id, actor = USER.name) {
      const errors = validateTimeRequest(input, state, id);
      if (!emptyErrors(errors)) return fail(errors);
      const employee = state.employees.find(item => item.id === input.employeeId)!;
      const existing = id ? state.requests.find(item => item.id === id) : undefined;
      if (id && !existing) return fail({ form: 'Không tìm thấy đơn.' });
      if (existing && existing.status !== 'Nháp') return fail({ form: 'Chỉ sửa được đơn nháp.' });
      let saved!: TimeRequest;
      commit(draft => {
        const row: TimeRequest = {
          id: id ?? uid('rq'),
          code: existing?.code || nextCode(draft.requests.map(item => item.code), 'DT'),
          type: input.type,
          employeeId: input.employeeId,
          createdBy: existing?.createdBy || actor,
          onBehalf: input.onBehalf,
          reasonId: input.reasonId,
          note: input.note.trim(),
          startDate: input.startDate,
          endDate: input.endDate || input.startDate,
          startTime: input.startTime,
          endTime: input.endTime,
          quantity: Number(input.quantity),
          leaveTypeId: input.type === 'nghi-phep' ? input.leaveTypeId : '',
          shiftId: input.shiftId,
          targetShiftId: input.targetShiftId,
          project: input.project ?? '',
          prevDay: Boolean(input.prevDay),
          nextDay: Boolean(input.nextDay),
          breakMid: Boolean(input.breakMid),
          caseType: input.caseType ?? '',
          dueDate: input.dueDate ?? '',
          birthDate: input.birthDate ?? '',
          childCount: input.childCount ?? 1,
          swapMode: input.swapMode ?? 'self',
          swapWithId: input.swapWithId ?? '',
          status: input.submit ? 'Chờ duyệt' : 'Nháp',
          watchers: input.watchers,
          steps: input.submit ? buildSteps(employee, draft, input.type) : [],
          history: [...(existing?.history ?? []), { at: new Date().toISOString(), actor, action: input.submit ? 'Gửi duyệt' : 'Lưu nháp', note: input.note.trim() }],
          balanceState: 'none',
          createdAt: existing?.createdAt || new Date().toISOString(),
        };
        if (input.submit && deductsBalance(draft, input)) {
          adjustBalance(draft, row.employeeId, row.leaveTypeId, Number(row.startDate.slice(0, 4)), { pending: row.quantity });
          row.balanceState = 'pending';
        }
        if (id) draft.requests = draft.requests.map(item => item.id === id ? row : item);
        else draft.requests.push(row);
        saved = row;
      });
      return ok(saved);
    },
    approveRequest(id, note, actor) {
      const current = state.requests.find(item => item.id === id);
      if (!current) return fail({ form: 'Không tìm thấy đơn.' });
      if (!canAct(current, actor, state)) return fail({ form: 'Bạn không ở bước duyệt hiện tại.' });
      let saved!: TimeRequest;
      commit(draft => {
        const request = draft.requests.find(item => item.id === id)!;
        const step = request.steps.find(item => item.status === 'Chờ')!;
        const via = step.approverName === actor ? '' : ` theo ủy quyền của ${step.approverName}`;
        step.status = 'Đã duyệt';
        step.note = note.trim();
        step.actedAt = new Date().toISOString();
        const more = request.steps.some(item => item.status === 'Chờ');
        request.status = more ? 'Đang duyệt' : 'Đã duyệt';
        if (!more && request.balanceState === 'pending') {
          adjustBalance(draft, request.employeeId, request.leaveTypeId, Number(request.startDate.slice(0, 4)), { pending: -request.quantity, used: request.quantity });
          request.balanceState = 'used';
        }
        request.history.push({ at: step.actedAt, actor, action: `Duyệt${via}`, note: note.trim() });
        saved = request;
      });
      return ok(saved);
    },
    rejectRequest(id, note, actor) {
      if (!note.trim()) return fail({ note: 'Nhập lý do từ chối.' });
      const current = state.requests.find(item => item.id === id);
      if (!current) return fail({ form: 'Không tìm thấy đơn.' });
      if (!canAct(current, actor, state)) return fail({ form: 'Bạn không ở bước duyệt hiện tại.' });
      let saved!: TimeRequest;
      commit(draft => {
        const request = draft.requests.find(item => item.id === id)!;
        const step = request.steps.find(item => item.status === 'Chờ')!;
        step.status = 'Từ chối';
        step.note = note.trim();
        step.actedAt = new Date().toISOString();
        request.status = 'Từ chối';
        if (request.balanceState === 'pending') {
          adjustBalance(draft, request.employeeId, request.leaveTypeId, Number(request.startDate.slice(0, 4)), { pending: -request.quantity });
          request.balanceState = 'none';
        }
        request.history.push({ at: step.actedAt, actor, action: 'Từ chối', note: note.trim() });
        saved = request;
      });
      return ok(saved);
    },
    cancelRequest(id, actor) {
      const current = state.requests.find(item => item.id === id);
      if (!current) return fail({ form: 'Không tìm thấy đơn.' });
      if (current.status === 'Đã duyệt' || current.status === 'Từ chối' || current.status === 'Đã hủy') {
        return fail({ form: 'Không hủy được đơn đã kết thúc.' });
      }
      if (current.createdBy !== actor && actor !== USER.name) return fail({ form: 'Chỉ người tạo hoặc quản trị mới hủy được đơn.' });
      let saved!: TimeRequest;
      commit(draft => {
        const request = draft.requests.find(item => item.id === id)!;
        if (request.balanceState === 'pending') {
          adjustBalance(draft, request.employeeId, request.leaveTypeId, Number(request.startDate.slice(0, 4)), { pending: -request.quantity });
          request.balanceState = 'none';
        }
        request.status = 'Đã hủy';
        request.history.push({ at: new Date().toISOString(), actor, action: 'Hủy đơn', note: '' });
        saved = request;
      });
      return ok(saved);
    },
    saveDelegation(input, id) {
      const errors: FieldErrors = {};
      if (!input.fromName.trim() || !input.toName.trim()) errors.form = 'Nhập người ủy quyền và người được ủy quyền.';
      if (input.fromName.trim() === input.toName.trim()) errors.form = 'Không ủy quyền cho chính mình.';
      if (!input.startDate || !input.endDate || input.endDate < input.startDate) errors.endDate = 'Khoảng ngày không hợp lệ.';
      if (Object.keys(errors).length) return fail(errors);
      const saved = id ?? uid('uq');
      commit(draft => {
        const row = { ...input, fromName: input.fromName.trim(), toName: input.toName.trim(), id: saved };
        if (id) draft.delegations = draft.delegations.map(item => item.id === id ? row : item);
        else draft.delegations.push(row);
      });
      return ok({ id: saved });
    },
    deleteDelegation(id) {
      commit(draft => { draft.delegations = draft.delegations.filter(item => item.id !== id); });
      return ok(undefined);
    },
    saveReason(input, id) {
      if (!input.name.trim()) return fail({ name: 'Nhập lý do.' });
      const saved = id ?? uid('rs');
      commit(draft => {
        const row = { ...input, name: input.name.trim(), id: saved };
        if (id) draft.requestReasons = draft.requestReasons.map(item => item.id === id ? row : item);
        else draft.requestReasons.push(row);
      });
      return ok({ id: saved });
    },
    deleteReason(id) {
      if (state.requests.some(item => item.reasonId === id)) return fail({ form: 'Lý do đang được dùng trong đơn.' });
      commit(draft => { draft.requestReasons = draft.requestReasons.filter(item => item.id !== id); });
      return ok(undefined);
    },
    saveProcedure(input) {
      if (!input.steps.length) return fail({ form: 'Quy trình cần ít nhất một bước.' });
      commit(draft => {
        const index = draft.requestProcedures.findIndex(item => item.id === input.id);
        if (index >= 0) draft.requestProcedures[index] = input;
        else draft.requestProcedures.push(input);
      });
      return ok(input);
    },
    saveLeavePolicy(input) {
      if (input.annualDays < 0 || input.carryOverMax < 0 || input.minNoticeDays < 0) return fail({ form: 'Các số ngày không được âm.' });
      commit(draft => { draft.leavePolicy = input; });
      return ok(input);
    },
    saveOtPolicy(input) {
      if (input.dailyHourCap <= 0 || input.monthlyHourCap <= 0) return fail({ form: 'Trần giờ OT phải lớn hơn 0.' });
      commit(draft => { draft.otPolicy = input; });
      return ok(input);
    },
    saveLeaveBalance(input) {
      if (input.entitled < 0 || input.carried < 0) return fail({ form: 'Quỹ phép không được âm.' });
      commit(draft => {
        draft.leaveBalances = draft.leaveBalances.map(item => item.id === input.id ? input : item);
      });
      return ok(input);
    },
    saveShift(input, id) {
      if (!input.name.trim() || !input.start || !input.end) return fail({ form: 'Nhập tên ca và khung giờ.' });
      const saved = id ?? uid('ca');
      commit(draft => {
        const row = { ...input, name: input.name.trim(), code: input.code.trim() || saved.toUpperCase(), id: saved };
        if (id) draft.shifts = draft.shifts.map(item => item.id === id ? row : item);
        else draft.shifts.push(row);
      });
      return ok({ id: saved });
    },
    savePunch(input) {
      if (!input.employeeId || !input.at) return fail({ form: 'Chọn nhân sự, ngày và giờ chấm công.' });
      const row: Punch = { ...input, id: uid('pu') };
      commit(draft => { draft.punches.push(row); });
      return ok(row);
    },
    deletePunch(id) {
      commit(draft => { draft.punches = draft.punches.filter(item => item.id !== id); });
      return ok(undefined);
    },
    setFraudConclusion(id, conclusion) {
      if (!state.fraudAlerts.some(item => item.id === id)) return fail({ form: 'Không tìm thấy cảnh báo.' });
      commit(draft => { draft.fraudAlerts = draft.fraudAlerts.map(item => item.id === id ? { ...item, conclusion } : item); });
      return ok(undefined);
    },
    saveHoliday(input, id) {
      if (!input.name.trim() || !input.startDate) return fail({ form: 'Nhập tên và ngày nghỉ lễ.' });
      const saved = id ?? uid('hd');
      commit(draft => {
        const row = { ...input, name: input.name.trim(), endDate: input.endDate || input.startDate, id: saved };
        if (id) draft.holidays = draft.holidays.map(item => item.id === id ? row : item);
        else draft.holidays.push(row);
      });
      return ok({ id: saved });
    },
    deleteHoliday(id) {
      commit(draft => { draft.holidays = draft.holidays.filter(item => item.id !== id); });
      return ok(undefined);
    },
    saveTemplate(input, id) {
      if (!input.name.trim()) return fail({ name: 'Nhập tên mẫu.' });
      const saved = id ?? uid('tt');
      commit(draft => {
        const row = { ...input, name: input.name.trim(), id: saved };
        if (id) draft.timesheetTemplates = draft.timesheetTemplates.map(item => item.id === id ? row : item);
        else draft.timesheetTemplates.push(row);
      });
      return ok({ id: saved });
    },
    saveStandardWorkday(input) {
      if (input.days <= 0) return fail({ form: 'Số công chuẩn phải lớn hơn 0.' });
      const saved = uid('sw');
      const today = new Date().toISOString().slice(0, 10);
      commit(draft => { draft.standardWorkdays.push({ ...input, id: saved, createdAt: today, updatedAt: today }); });
      return ok({ id: saved });
    },
    saveAttendanceMethod(input, id) {
      if (!input.name.trim()) return fail({ name: 'Nhập tên cài đặt.' });
      const saved = id ?? uid('am');
      const today = new Date().toISOString().slice(0, 10);
      commit(draft => {
        const row = { ...input, name: input.name.trim(), id: saved, updatedAt: today };
        if (id) draft.attendanceMethods = draft.attendanceMethods.map(item => item.id === id ? row : item);
        else draft.attendanceMethods.push(row);
      });
      return ok({ id: saved });
    },
    deleteAttendanceMethod(id) {
      commit(draft => { draft.attendanceMethods = draft.attendanceMethods.filter(item => item.id !== id); });
      return ok(undefined);
    },
    saveWorkdayConfig(input) {
      commit(draft => { draft.workdayConfig = input; });
      return ok(undefined);
    },
    setOpenShift(enabled) {
      commit(draft => { draft.openShiftEnabled = enabled; });
      return ok(undefined);
    },
    saveOtThreshold(input, id) {
      if (!input.name.trim()) return fail({ name: 'Nhập tên cấu hình.' });
      const saved = id ?? uid('otc');
      commit(draft => {
        const row = { ...input, name: input.name.trim(), id: saved };
        if (id) draft.otThresholds = draft.otThresholds.map(item => item.id === id ? row : item);
        else draft.otThresholds.push(row);
      });
      return ok({ id: saved });
    },
    saveLeavePolicyV2(input) {
      if (!input.name.trim() || !input.month) return fail({ form: 'Nhập tên chính sách và tháng áp dụng.' });
      commit(draft => {
        const index = draft.leavePoliciesV2.findIndex(item => item.id === input.id);
        if (index >= 0) draft.leavePoliciesV2[index] = input;
        else draft.leavePoliciesV2.push({ ...input, id: input.id || uid('lpv2') });
      });
      return ok(undefined);
    },
    saveRequestTypeSetting(input) {
      commit(draft => {
        const index = draft.requestTypeSettings.findIndex(item => item.type === input.type);
        if (index >= 0) draft.requestTypeSettings[index] = input;
        else draft.requestTypeSettings.push(input);
      });
      return ok(undefined);
    },
    saveDeadline(days, otApproveAfter, otAdjustByRaw) {
      if (days < 0) return fail({ form: 'Số ngày không được âm.' });
      commit(draft => { draft.deadlineDays = days; draft.otApproveAfter = otApproveAfter; draft.otAdjustByRaw = otAdjustByRaw; });
      return ok(undefined);
    },
    assignShift(employeeId, date, shiftId) {
      commit(draft => {
        draft.assignments = draft.assignments.filter(item => !(item.employeeId === employeeId && item.date === date));
        if (shiftId) draft.assignments.push({ id: uid('as'), employeeId, date, shiftId });
      });
      return ok(undefined);
    },
    saveShiftPlan(input) {
      if (!input.title.trim()) return fail({ form: 'Nhập tiêu đề phân ca.' });
      const saved = uid('sp');
      commit(draft => { draft.shiftPlans.push({ ...input, title: input.title.trim(), id: saved, createdAt: new Date().toISOString().slice(0, 10) }); });
      return ok({ id: saved });
    },
  };

function adjustBalance(draft: HrState, employeeId: string, leaveTypeId: string, year: number, delta: { pending?: number; used?: number }) {
  let row = findBalance(draft, employeeId, leaveTypeId, year);
  if (!row) {
    row = { id: uid('lb'), employeeId, leaveTypeId, year, entitled: draft.leavePolicy.annualDays, carried: 0, used: 0, pending: 0 };
    draft.leaveBalances.push(row);
  }
  row.pending = Math.max(0, round1(row.pending + (delta.pending ?? 0)));
  row.used = Math.max(0, round1(row.used + (delta.used ?? 0)));
}

  function decide(id: string, status: 'Đã duyệt' | 'Từ chối', note: string, actor: string): Result<Decision> {
    const current = state.decisions.find(d => d.id === id);
    if (!current) return fail({ form: 'Không tìm thấy quyết định.' });
    if (current.status !== 'Chờ duyệt') return fail({ form: 'Chỉ duyệt hoặc từ chối quyết định đang chờ duyệt.' });
    let updated!: Decision;
    commit(d => {
      d.decisions = d.decisions.map(item => {
        if (item.id !== id) return item;
        updated = { ...item, status, note: note.trim(), decidedBy: actor, decidedAt: new Date().toISOString() };
        return updated;
      });
    });
    return ok(updated);
  }

  function importEmployees(text: string): ImportResult {
    const table = parseCsv(text);
    const result: ImportResult = { added: 0, updated: 0, errors: [] };
    if (table.length < 2) {
      result.errors.push('Tệp không có dòng dữ liệu.');
      return result;
    }
    const header = table[0].map(h => plain(h));
    const col = (aliases: string[]) => header.findIndex(h => aliases.includes(h));
    const idx = {
      code: col(['ma nhan vien', 'ma']),
      fullName: col(['ho va ten', 'ho ten', 'ten']),
      gender: col(['gioi tinh']),
      dob: col(['ngay sinh']),
      phone: col(['so dien thoai', 'dien thoai', 'sdt']),
      email: col(['email']),
      idNumber: col(['so cccd', 'cccd', 'cmnd']),
      unit: col(['don vi']),
      position: col(['vi tri', 'vi tri cong viec']),
      branch: col(['chi nhanh']),
      start: col(['ngay vao lam', 'ngay di lam']),
      type: col(['loai hinh', 'loai hinh nhan su']),
      status: col(['trang thai', 'trang thai nhan su']),
      si: col(['ma bhxh', 'bhxh']),
    };
    if (idx.fullName < 0 || idx.unit < 0 || idx.position < 0 || idx.branch < 0 || idx.start < 0) {
      result.errors.push('Thiếu cột bắt buộc: Họ và tên, Đơn vị, Vị trí, Chi nhánh, Ngày vào làm.');
      return result;
    }
    const cell = (row: string[], i: number) => (i >= 0 ? row[i] ?? '' : '').trim();
    const matchByName = <T extends { id: string; name: string }>(rows: T[], label: string) =>
      rows.find(r => plain(r.name) === plain(label));

    table.slice(1).forEach((row, offset) => {
      const line = offset + 2;
      const unit = matchByName(state.units, cell(row, idx.unit));
      const position = matchByName(state.positions, cell(row, idx.position));
      const branch = matchByName(state.branches, cell(row, idx.branch));
      if (!unit || !position || !branch) {
        result.errors.push(`Dòng ${line}: không khớp đơn vị, vị trí hoặc chi nhánh.`);
        return;
      }
      const code = cell(row, idx.code);
      const existing = code ? state.employees.find(e => e.code.toLowerCase() === code.toLowerCase()) : undefined;
      const base: EmployeeInput = existing
        ? (({ id: _id, ...rest }) => rest)(existing)
        : blankEmployee(state, branch.id, unit.id, position.id);
      const gender = cell(row, idx.gender);
      const type = cell(row, idx.type);
      const status = cell(row, idx.status);
      const input: EmployeeInput = {
        ...base,
        code: code || base.code,
        fullName: cell(row, idx.fullName),
        gender: gender === 'Nam' || gender === 'Nữ' || gender === 'Khác' ? gender : base.gender,
        dob: cell(row, idx.dob) || base.dob,
        phone: cell(row, idx.phone) || base.phone,
        email: cell(row, idx.email) || base.email,
        idNumber: cell(row, idx.idNumber) || base.idNumber,
        unitId: unit.id,
        positionId: position.id,
        branchId: branch.id,
        startDate: cell(row, idx.start),
        employmentType: (['Chính thức', 'Thử việc', 'Thực tập', 'Thời vụ', 'Cộng tác viên'] as const).find(t => t === type) ?? base.employmentType,
        status: (['Đang làm việc', 'Tạm nghỉ', 'Đã nghỉ việc'] as const).find(s => s === status) ?? base.status,
        siNumber: cell(row, idx.si) || base.siNumber,
      };
      const saved = api.saveEmployee(input, existing?.id);
      if (!saved.ok) {
        result.errors.push(`Dòng ${line}: ${Object.values(saved.errors)[0]}`);
        return;
      }
      if (existing) result.updated += 1;
      else result.added += 1;
    });
    return result;
  }

  return api;
}

export function blankEmployee(state: HrState, branchId?: string, unitId?: string, positionId?: string): EmployeeInput {
  return {
    code: '',
    fullName: '',
    gender: 'Nam',
    dob: '',
    phone: '',
    email: '',
    personalEmail: '',
    idNumber: '',
    idIssueDate: '',
    idIssuePlace: '',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    marital: 'Độc thân',
    address: '',
    hometown: '',
    bankName: '',
    bankAccount: '',
    taxCode: '',
    branchId: branchId ?? state.branches[0]?.id ?? '',
    unitId: unitId ?? '',
    positionId: positionId ?? '',
    managerId: null,
    startDate: '',
    officialDate: '',
    resignDate: '',
    employmentType: 'Thử việc',
    status: 'Đang làm việc',
    note: '',
    siNumber: '',
    siStart: '',
    hiNumber: '',
    hospital: '',
  };
}

function defaultStorage(): MemStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function hydrate(data: HrState): HrState {
  return { ...buildSeed(), ...data };
}

function read(storage: MemStorage | null): HrState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as HrState;
      if (data && Array.isArray(data.employees) && Array.isArray(data.units) && Array.isArray(data.contracts)) {
        const hydrated = hydrate(data);
        if (!Array.isArray(data.requests)) {
          try { storage?.setItem(STORAGE_KEY, JSON.stringify(hydrated)); } catch { /* bỏ qua */ }
        }
        return hydrated;
      }
    }
  } catch { /* dùng dữ liệu mẫu */ }
  const fresh = buildSeed();
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch { /* bỏ qua */ }
  return fresh;
}

export const hr = createHrRepository();
