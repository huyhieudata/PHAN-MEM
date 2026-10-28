import { beforeEach, describe, expect, it } from 'vitest';
import { createHrRepository, STORAGE_KEY, type HrRepository } from './repositories/hrRepository';
import { canAct, findBalance, leaveRemaining } from './timeoff';
import type { TimeRequestInput } from './types';
import { USER } from './session';

function memory(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); },
  };
}

function leave(employeeId: string, quantity = 1): TimeRequestInput {
  const year = new Date().getFullYear();
  return {
    type: 'nghi-phep', employeeId, onBehalf: false, reasonId: 'rs-1', note: 'Nghỉ phép kiểm thử',
    startDate: `${year}-11-02`, endDate: `${year}-11-02`, startTime: '', endTime: '', quantity,
    leaveTypeId: 'lt-nam', shiftId: '', targetShiftId: '', watchers: [], submit: true,
  };
}

describe('đơn từ và phép', () => {
  let store: HrRepository;
  beforeEach(() => { store = createHrRepository(memory()); });

  it('duyệt hết chuỗi thì chuyển phép từ chờ sang đã dùng', () => {
    const year = new Date().getFullYear();
    const before = findBalance(store.getState(), 'emp-02', 'lt-nam', year)!;
    const created = store.saveRequest(leave('emp-02'), undefined, USER.name);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(findBalance(store.getState(), 'emp-02', 'lt-nam', year)!.pending).toBe(before.pending + 1);
    expect(store.approveRequest(created.value.id, '', USER.name).ok).toBe(false);
    expect(store.approveRequest(created.value.id, 'Đồng ý', 'Đặng Thị Lan').ok).toBe(true);
    expect(store.getState().requests.find(item => item.id === created.value.id)?.status).toBe('Đang duyệt');
    expect(store.approveRequest(created.value.id, 'Thông qua', USER.name).ok).toBe(true);
    const after = findBalance(store.getState(), 'emp-02', 'lt-nam', year)!;
    expect(after.pending).toBe(before.pending);
    expect(after.used).toBe(before.used + 1);
    expect(leaveRemaining(after)).toBe(leaveRemaining(before) - 1);
  });

  it('từ chối thì nhả phép đang chờ', () => {
    const year = new Date().getFullYear();
    const created = store.saveRequest(leave('emp-05'), undefined, USER.name);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const rejected = store.rejectRequest(created.value.id, 'Chưa sắp xếp người thay', 'Nguyễn Văn An');
    expect(rejected.ok).toBe(true);
    expect(findBalance(store.getState(), 'emp-05', 'lt-nam', year)!.pending).toBe(0);
  });

  it('chặn khi không đủ phép hoặc OT vượt trần ngày', () => {
    const tooMuch = store.saveRequest(leave('emp-02', 100), undefined, USER.name);
    expect(tooMuch.ok).toBe(false);
    const ot = store.saveRequest({
      ...leave('emp-02'), type: 'lam-them-gio', leaveTypeId: '', reasonId: 'rs-5', quantity: 5,
      startTime: '18:00', endTime: '23:00', note: 'Làm thêm quá dài',
    }, undefined, USER.name);
    expect(ot.ok).toBe(false);
  });

  it('ủy quyền cho phép giám đốc duyệt thay quản lý', () => {
    const request = store.getState().requests.find(item => item.code === 'DT0003')!;
    expect(canAct(request, USER.name, store.getState())).toBe(true);
    expect(store.approveRequest(request.id, 'Duyệt hộ', USER.name).ok).toBe(true);
    expect(store.getState().requests.find(item => item.id === request.id)?.history.some(item => item.action.includes('ủy quyền'))).toBe(true);
  });

  it('dữ liệu cũ thiếu đơn từ được bù từ mẫu', () => {
    const box = memory();
    createHrRepository(box);
    const raw = JSON.parse(box.getItem(STORAGE_KEY)!) as { requests?: unknown };
    delete raw.requests;
    box.setItem(STORAGE_KEY, JSON.stringify(raw));
    const again = createHrRepository(box);
    expect(again.getState().requests.length).toBeGreaterThan(0);
    expect(again.getState().employees.some(item => item.fullName === 'Nguyễn Văn An')).toBe(true);
  });
});
