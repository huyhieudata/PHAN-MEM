import { useSyncExternalStore } from 'react';
import { hr } from '../repositories';
import { COST_CATEGORIES, INDICATORS, mainTemplateComponents } from './catalog';
import { computeLines } from './engine';
import type { ExportTemplate, Indicator, PayrollDoc, PayrollState, PayrollTemplate, TableSettings } from './types';

const KEY = 'hrmhub.payroll.v1';
let state = read();
const listeners = new Set<() => void>();

function seed(): PayrollState {
  const components = mainTemplateComponents();
  return {
    indicators: INDICATORS,
    templates: [{
      id: 'tpl-main',
      name: 'Mẫu bảng lương chính',
      code: 'BLC',
      type: 'Bảng lương chính',
      description: 'Lương hợp đồng theo công, BHXH và TNCN 5 bậc.',
      unitIds: [], positionIds: [], employeeIds: [],
      components,
    }],
    payrolls: [],
    exports: [],
    products: [],
    costCenters: [],
    assignments: [],
    reportTemplates: [{ id: 'rt-1', name: 'Mẫu thử', count: 1, status: 'Hoạt động' }],
    entries: [],
    table: { working: true, resignedInPeriod: true, maternity: true },
    v1: { reopenOn: false, reopenDays: 3, feedbackMode: 'Không thời hạn', feedbackEmployee: '' },
  };
}

function read(): PayrollState {
  const fresh = seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw) as PayrollState;
    if (!data || !Array.isArray(data.payrolls) || !Array.isArray(data.indicators)) return fresh;
    const known = new Set(data.indicators.map(item => item.code));
    const indicators = [...data.indicators, ...fresh.indicators.filter(item => !known.has(item.code))];
    return { ...fresh, ...data, indicators, table: { ...fresh.table, ...data.table }, v1: { ...fresh.v1, ...data.v1 } };
  } catch {
    return fresh;
  }
}

function commit(recipe: (draft: PayrollState) => void) {
  const draft = structuredClone(state);
  recipe(draft);
  state = draft;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bỏ qua khi bộ nhớ đầy */ }
  listeners.forEach(listener => listener());
}

function uid(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 8);
}

export const payrollStore = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  saveIndicator(input: Indicator) {
    commit(draft => {
      const index = draft.indicators.findIndex(item => item.code === input.code);
      if (index >= 0) draft.indicators[index] = input;
      else draft.indicators.unshift(input);
    });
  },
  saveTemplate(input: Omit<PayrollTemplate, 'id'> & { id?: string }) {
    const id = input.id || uid('tpl');
    commit(draft => {
      const row = { ...input, id };
      const index = draft.templates.findIndex(item => item.id === id);
      if (index >= 0) draft.templates[index] = row;
      else draft.templates.unshift(row);
    });
    return id;
  },
  savePayroll(input: Omit<PayrollDoc, 'id' | 'lines' | 'status' | 'createdAt'> & { id?: string }) {
    const id = input.id || uid('pl');
    const lines = computeLines(hr.getState(), input, input.components, state.table);
    commit(draft => {
      const prev = draft.payrolls.find(item => item.id === id);
      const row: PayrollDoc = { ...input, id, lines, status: prev?.status ?? 'Nháp', createdAt: prev?.createdAt ?? new Date().toISOString() };
      if (prev?.status === 'Đã khóa') row.status = 'Đã khóa';
      const index = draft.payrolls.findIndex(item => item.id === id);
      if (index >= 0) draft.payrolls[index] = row;
      else draft.payrolls.unshift(row);
    });
    return id;
  },
  recalc(id: string) {
    const doc = state.payrolls.find(item => item.id === id);
    if (!doc || doc.status === 'Đã khóa') return;
    const lines = computeLines(hr.getState(), doc, doc.components, state.table);
    commit(draft => { const row = draft.payrolls.find(item => item.id === id); if (row) row.lines = lines; });
  },
  setStatus(id: string, status: PayrollDoc['status']) {
    commit(draft => {
      const row = draft.payrolls.find(item => item.id === id);
      if (row) row.status = status;
      if (row && status === 'Đã khóa') draft.entries = draft.entries.filter(item => item.payrollName !== row.name).concat(costFrom(row));
    });
  },
  saveExport(input: Omit<ExportTemplate, 'id'>) {
    commit(draft => { draft.exports.unshift({ ...input, id: uid('ex') }); });
  },
  saveTable(table: TableSettings) { commit(draft => { draft.table = table; }); },
  saveV1(v1: PayrollState['v1']) { commit(draft => { draft.v1 = v1; }); },
  categories: COST_CATEGORIES,
};

function costFrom(doc: PayrollDoc): PayrollState['entries'] {
  return doc.lines.flatMap(line => {
    const amount = Number(line.values.THUC_NHAN) || 0;
    if (!amount) return [];
    const unit = 'Chưa gán cost center';
    return [{ id: uid('ce'), costCenter: unit, employeeId: line.employeeId, category: 'THUC_NHAN', group: 'Thực nhận', amount, source: 'Bảng lương' as const, payrollName: doc.name, note: 'Sinh khi khóa bảng lương. Quy tắc gán cost center chưa có trong ghi chú.', period: doc.period }];
  });
}

export function usePayroll() {
  return useSyncExternalStore(payrollStore.subscribe, payrollStore.getState, payrollStore.getState);
}
