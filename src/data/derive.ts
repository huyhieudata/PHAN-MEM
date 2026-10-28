import type { Contract, Employee, HrState } from './types';
import { addDaysISO, todayISO, yearsBetween } from './text';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';

export interface Phase {
  label: string;
  tone: Tone;
}

/** Trạng thái hiển thị của hợp đồng, tính từ ngày (không cần job nền). */
export function contractPhase(c: Pick<Contract, 'type' | 'endDate' | 'status'>, today = todayISO()): Phase {
  if (c.status === 'Thanh lý') return { label: 'Thanh lý', tone: 'muted' };
  if (c.status === 'Chờ ký') return { label: 'Chờ ký', tone: 'info' };
  if (!c.endDate || c.type === 'Không xác định thời hạn') return { label: 'Hiệu lực', tone: 'ok' };
  if (c.endDate < today) return { label: 'Hết hạn', tone: 'bad' };
  if (c.endDate <= addDaysISO(today, 30)) return { label: 'Sắp hết hạn', tone: 'warn' };
  return { label: 'Hiệu lực', tone: 'ok' };
}

export function isOpenContract(c: Contract, today = todayISO()): boolean {
  const phase = contractPhase(c, today).label;
  return phase === 'Hiệu lực' || phase === 'Sắp hết hạn';
}

export const TENURE_BUCKETS = ['Dưới 1 năm', '1–3 năm', '3–5 năm', 'Trên 5 năm'] as const;

export function tenureBucket(start: string, today = todayISO()): (typeof TENURE_BUCKETS)[number] {
  const years = yearsBetween(start, today);
  if (years < 1) return 'Dưới 1 năm';
  if (years < 3) return '1–3 năm';
  if (years < 5) return '3–5 năm';
  return 'Trên 5 năm';
}

export function onPayroll(e: Pick<Employee, 'status'>): boolean {
  return e.status !== 'Đã nghỉ việc';
}

export function actualHeadcount(state: HrState, unitId: string, positionId: string): number {
  return state.employees.filter(e => onPayroll(e) && e.unitId === unitId && e.positionId === positionId).length;
}

export function findName(rows: { id: string; name?: string; fullName?: string }[], id: string | null | undefined): string {
  if (!id) return '—';
  const row = rows.find(r => r.id === id);
  return row?.name || row?.fullName || '—';
}
