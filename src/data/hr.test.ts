import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';
import { contractPhase } from './derive';
import { getModule } from './menu';
import { createHrRepository, type HrRepository } from './repositories';
import { includesPlain, todayISO } from './text';
import type { EmployeeInput } from './types';
import { validateContract, validateEmployee } from './validate';

function memory(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

function repo(): HrRepository {
  return createHrRepository(memory());
}

function copyOf(source: HrRepository, patch: Partial<EmployeeInput> = {}): EmployeeInput {
  const employee = source.getState().employees[0];
  const { id, ...rest } = employee;
  void id;
  return {
    ...rest,
    code: 'NV9999',
    fullName: 'Nguyễn Test',
    email: 'nguyen.test@vi-du.hrm.local',
    phone: '0900 000 099',
    idNumber: '000000000099',
    siNumber: '7900000099',
    ...patch,
  };
}

describe('tiếng Việt không dấu', () => {
  it('khớp Nguyễn, Đặng và Hà Nội', () => {
    expect(includesPlain('Nguyễn Văn An', 'nguyen van')).toBe(true);
    expect(includesPlain('Đặng Thị Lan', 'dang thi')).toBe(true);
    expect(includesPlain('CN Hà Nội', 'ha noi')).toBe(true);
    expect(includesPlain('Trần Thị Bích', 'bich')).toBe(true);
    expect(includesPlain('Trần Thị Bích', 'cuong')).toBe(false);
  });
});

describe('repository', () => {
  it('dữ liệu mẫu hợp lệ', () => {
    const store = repo();
    const state = store.getState();
    expect(state.employees.length).toBeGreaterThan(10);
    for (const employee of state.employees) {
      const { id, ...input } = employee;
      expect(`${employee.code} ${JSON.stringify(validateEmployee(input, state, id))}`).toBe(`${employee.code} {}`);
    }
    for (const contract of state.contracts) {
      const { id, ...input } = contract;
      expect(`${contract.code} ${JSON.stringify(validateContract(input, state, id))}`).toBe(`${contract.code} {}`);
    }
    expect(state.employees.some(e => e.fullName === 'Nguyễn Văn An' && e.code === 'NV0001')).toBe(true);
  });

  it('từ chối hồ sơ thiếu điện thoại và không ghi thêm', () => {
    const store = repo();
    const before = store.getState().employees.length;
    const result = store.saveEmployee(copyOf(store, { phone: '123' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.phone).toBeTruthy();
    expect(store.getState().employees.length).toBe(before);
  });

  it('lưu nhân sự và đọc lại từ storage', () => {
    const box = memory();
    const first = createHrRepository(box);
    const saved = first.saveEmployee(copyOf(first));
    expect(saved.ok).toBe(true);
    const second = createHrRepository(box);
    expect(second.getState().employees.some(e => e.fullName === 'Nguyễn Test')).toBe(true);
  });

  it('luồng duyệt quyết định: nháp, gửi, duyệt, từ chối', () => {
    const store = repo();
    const employeeId = store.getState().employees[0].id;
    const input = {
      title: 'Tăng lương thử nghiệm',
      type: 'Tăng lương' as const,
      employeeId,
      content: 'Điều chỉnh lương demo cho kỳ này.',
      effectiveDate: todayISO(),
      submit: false,
    };
    const draft = store.saveDecision(input, undefined, 'Dương Văn Hiệu');
    expect(draft.ok && draft.value.status).toBe('Nháp');
    if (!draft.ok) return;
    expect(store.approveDecision(draft.value.id, 'OK', 'Dương Văn Hiệu').ok).toBe(false);
    expect(store.submitDecision(draft.value.id).ok && store.getState().decisions.find(d => d.id === draft.value.id)?.status).toBe('Chờ duyệt');
    const rejected = store.rejectDecision(draft.value.id, '', 'Dương Văn Hiệu');
    expect(rejected.ok).toBe(false);
    expect(store.rejectDecision(draft.value.id, 'Thiếu căn cứ', 'Đặng Thị Lan').ok).toBe(true);
    expect(store.getState().decisions.find(d => d.id === draft.value.id)?.status).toBe('Từ chối');

    const pending = store.saveDecision({ ...input, title: 'Bổ nhiệm thử', submit: true }, undefined, 'Dương Văn Hiệu');
    expect(pending.ok && pending.value.status).toBe('Chờ duyệt');
    if (!pending.ok) return;
    expect(store.getState().decisions.filter(d => d.createdBy === 'Dương Văn Hiệu' && d.id === pending.value.id)).toHaveLength(1);
    const approved = store.approveDecision(pending.value.id, 'Đồng ý', 'Dương Văn Hiệu');
    expect(approved.ok && approved.value.status).toBe('Đã duyệt');
    expect(store.deleteDecision(pending.value.id).ok).toBe(false);
  });

  it('không xóa chi nhánh còn đơn vị và import CSV', () => {
    const store = repo();
    expect(store.deleteBranch('br-hn').ok).toBe(false);
    const csv = [
      'Mã nhân viên,Họ và tên,Giới tính,Ngày sinh,Số điện thoại,Email,Số CCCD,Đơn vị,Vị trí,Chi nhánh,Ngày vào làm,Loại hình,Trạng thái,Mã BHXH',
      'NV8888,Nguyễn Thị Mẫu,Nữ,1995-01-01,0900 000 088,mau.nt@vi-du.hrm.local,000000000088,Phòng Nhân sự,Chuyên viên Nhân sự,CN Hà Nội,2026-01-06,Thử việc,Đang làm việc,7900000088',
    ].join('\n');
    const result = store.importEmployeesCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.added).toBe(1);
    expect(store.getState().employees.some(e => e.fullName === 'Nguyễn Thị Mẫu')).toBe(true);
    const again = store.importEmployeesCsv(csv.replace('Nguyễn Thị Mẫu', 'Nguyễn Thị Mẫu Hai'));
    expect(again.updated).toBe(1);
  });
});

describe('csv và hợp đồng', () => {
  it('đọc ô có dấu phẩy trong ngoặc kép', () => {
    const rows = parseCsv('Tên,Ghi chú\n"Nguyễn, An","Dòng 1"');
    expect(rows[1]).toEqual(['Nguyễn, An', 'Dòng 1']);
  });

  it('phân loại sắp hết hạn và hết hạn', () => {
    const today = '2026-10-28';
    expect(contractPhase({ type: 'Thử việc', endDate: '2026-11-10', status: 'Hiệu lực' }, today).label).toBe('Sắp hết hạn');
    expect(contractPhase({ type: 'Xác định thời hạn', endDate: '2026-10-01', status: 'Hiệu lực' }, today).label).toBe('Hết hạn');
    expect(contractPhase({ type: 'Không xác định thời hạn', endDate: '', status: 'Hiệu lực' }, today).label).toBe('Hiệu lực');
    expect(contractPhase({ type: 'Xác định thời hạn', endDate: '2026-12-01', status: 'Chờ ký' }, today).label).toBe('Chờ ký');
  });
});

describe('menu', () => {
  it('slug các trang nhân sự và hệ thống khớp route', () => {
    expect(getModule('nhan-su')?.sub.map(s => s.id)).toEqual([
      'overview', 'thong-tin-nhan-su', 'hop-dong', 'dinh-bien', 'gia-dinh-nguoi-phu-thuoc', 'chung-chi', 'danh-ba',
      'uy-quyen-tat-ca', 'toi-uy-quyen', 'duoc-uy-quyen', 'khai-bao-bhxh', 'thong-tin-bhxh', 'quyet-dinh',
      'quyet-dinh-cua-toi', 'quyet-dinh-can-duyet', 'quyet-dinh-uy-quyen', 'quyet-dinh-theo-doi',
      'khen-thuong', 'ky-luat', 'bao-cao-nhan-su', 'bao-cao-hop-dong', 'cai-dat-nhan-su', 'cai-dat-hop-dong', 'cai-dat-quyet-dinh', 'onboarding',
    ]);
    expect(getModule('he-thong')?.sub.map(s => s.id)).toContain('co-cau-to-chuc');
    expect(getModule('he-thong')?.sub.map(s => s.id)).toContain('he-thong-chi-nhanh');
    expect(getModule('he-thong')?.sub.map(s => s.id)).toContain('vi-tri-cong-viec');
  });
});
