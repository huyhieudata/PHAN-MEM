import { employeeTemplateCsv, employeesToCsv, parseCsv } from '../csv';
import { buildSeed } from '../seed';
import type {
  BranchInput, CertificateInput, ContractInput, Decision, DecisionInput, DependentInput,
  Employee, EmployeeInput, FieldErrors, HeadcountInput, HrState, ImportResult, LevelInput,
  PositionInput, Result, RewardInput, UnitInput,
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
  };

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

function read(storage: MemStorage | null): HrState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as HrState;
      if (data && Array.isArray(data.employees) && Array.isArray(data.units) && Array.isArray(data.contracts)) return data;
    }
  } catch { /* dùng dữ liệu mẫu */ }
  const fresh = buildSeed();
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch { /* bỏ qua */ }
  return fresh;
}

export const hr = createHrRepository();
