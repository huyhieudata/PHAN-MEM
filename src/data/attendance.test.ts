import { describe, expect, it } from 'vitest';
import { dayCell } from './attendance';
import { createHrRepository } from './repositories/hrRepository';

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

describe('bảng công', () => {
  it('hai lần chấm đúng giờ của ca hành chính là 1 công', () => {
    const state = createHrRepository(memory()).getState();
    const punch = state.punches.find(item => item.employeeId === 'emp-02' && item.at.includes('T08:28'));
    expect(punch).toBeTruthy();
    const cell = dayCell(state, 'emp-02', punch!.at.slice(0, 10), '2099-01-01');
    expect(cell.kind).toBe('ok');
    expect(cell.work).toBe(1);
  });

  it('ngày lễ trong seed hiển thị ký hiệu nghỉ lễ', () => {
    const state = createHrRepository(memory()).getState();
    const year = new Date().getFullYear();
    const cell = dayCell(state, 'emp-02', `${year}-10-20`, `${year}-10-21`);
    expect(cell.kind).toBe('holiday');
    expect(cell.text).toBe('L');
  });
});
