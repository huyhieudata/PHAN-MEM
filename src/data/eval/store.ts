import { useSyncExternalStore } from 'react';
import type { Criterion, EvalForm, EvalPeriod, EvalState, EvalTemplate, KpiSetup } from './types';

const KEY = 'hrmhub.eval.v1';
const LEVELS = [
  { name: 'Kém', score: 1, note: '' }, { name: 'Yếu', score: 2, note: '' }, { name: 'Đạt', score: 3, note: '' },
  { name: 'Tốt', score: 4, note: '' }, { name: 'XS', score: 5, note: '' },
];
const GRADES = [
  { color: '#ef4444', name: 'Cần cải thiện', from: 0, to: 59 },
  { color: '#f59e0b', name: 'Đạt', from: 60, to: 79 },
  { color: '#2563eb', name: 'Tốt', from: 80, to: 89 },
  { color: '#15803d', name: 'Xuất sắc', from: 90, to: 100 },
];

function criterion(id: string, name: string, code: string, groupId: string, kind: Criterion['kind'], description = ''): Criterion {
  return { id, name, code, groupId, kind, description, active: true, levels: kind === 'Thang điểm' ? LEVELS : [], formula: '' };
}

function seed(): EvalState {
  const criteria = [
    criterion('cr-1', 'Tuân thủ nội quy', 'TUAN_THU_NOI_QUY', 'gr-1', 'Thang điểm'),
    criterion('cr-2', 'Tỉ lệ tuân thủ quy trình', 'TI_LE_TUAN_THU_QUY_TRINH', 'gr-1', 'Thang điểm'),
    criterion('cr-3', 'Tỉ lệ sai sót', 'TI_LE_SAI_SOT', 'gr-1', 'Thang điểm'),
    criterion('cr-4', 'Hoàn thành báo cáo đúng hạn', 'HOAN_THANH_BAO_CAO_DUNG_HAN', 'gr-1', 'Thang điểm'),
    criterion('cr-5', 'Tỉ lệ hoàn thành công việc', 'TI_LE_HOAN_THANH_CONG_VIEC', 'gr-2', 'Thang điểm', 'Số công việc hoàn thành đúng hạn/Tổng số công việc được giao'),
    criterion('cr-6', 'Doanh thu', 'DOANH_THU', 'gr-3', 'Tỉ lệ hoàn thành'),
    criterion('cr-7', 'Doanh số', 'DOANH_SO', 'gr-3', 'Tỉ lệ hoàn thành'),
  ];
  const template: EvalTemplate = {
    id: 'tpl-1', name: 'Nhân viên hành chính nhân sự', active: true,
    scopes: ['Nhân viên Hành chính nhân sự', 'Thư ký công trình', 'Trợ lý TGĐ'],
    watchers: ['Phạm Thị Thùy (NV20)', 'Dương Văn Hiệu (ND013)'],
    resultMode: 'Có tính theo trọng số', kpiMode: 'Không cho phép vượt 100%',
    evalSteps: [{ role: 'Quản lý trực tiếp đánh giá', weight: 100, deadline: '', person: '' }],
    approvalOn: true,
    approvalSteps: [
      { role: 'Quản lý trực tiếp', weight: 0, deadline: '', person: '' },
      { role: 'Nhân sự khác', weight: 0, deadline: '', person: 'Không chỉ định' },
    ],
    criteria: [
      { criterionId: 'cr-5', target: '', weight: 70, counted: true },
      { criterionId: 'cr-4', target: '', weight: 10, counted: true },
      { criterionId: 'cr-2', target: '', weight: 20, counted: true },
    ],
    grades: [
      { color: '#ef4444', name: 'Không hoàn thành', from: 0, to: 59 },
      { color: '#f59e0b', name: 'Cần cải thiện', from: 60, to: 79 },
      { color: '#2563eb', name: 'Tốt', from: 80, to: 89 },
      { color: '#15803d', name: 'Xuất sắc', from: 90, to: 100 },
    ],
    fields: [{ name: 'Ghi chú', type: 'Văn bản dài', required: false }],
  };
  return {
    groups: [
      { id: 'gr-1', code: 'Y_THUC_TUAN_THU', name: 'Ý THỨC TUÂN THỦ', description: '' },
      { id: 'gr-2', code: 'TAC_VU', name: 'TÁC VỤ', description: '' },
      { id: 'gr-3', code: 'KET_QUA_KINH_DOANH', name: 'KẾT QUẢ KINH DOANH', description: '' },
    ],
    criteria, templates: [template], kpiSetups: [], periods: [], forms: [],
  };
}

let state = read();
const listeners = new Set<() => void>();
function read(): EvalState {
  const fresh = seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw) as EvalState;
    if (!Array.isArray(data.criteria)) return fresh;
    return { ...fresh, ...data, groups: data.groups?.length ? data.groups : fresh.groups, criteria: data.criteria.length ? data.criteria : fresh.criteria, templates: data.templates?.length ? data.templates : fresh.templates };
  } catch { return fresh; }
}
function commit(recipe: (draft: EvalState) => void) {
  const draft = structuredClone(state);
  recipe(draft);
  state = draft;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bộ nhớ đầy */ }
  listeners.forEach(fn => fn());
}
function uid(prefix: string) { return prefix + '-' + Math.random().toString(36).slice(2, 8); }

export function formsForPeriod(period: EvalPeriod): EvalForm[] {
  return period.employeeIds.map(employeeId => ({
    id: uid('ef'), periodId: period.id, employeeId, templateName: '', due: period.due,
    createdAt: new Date().toISOString(), status: 'Đang đánh giá' as const, kind: period.cycle,
    scores: period.criteria.map(row => ({ criterionId: row.criterionId, raw: null, note: '' })),
    comment: '', proposal: '', step: 0,
  }));
}

export const evalStore = {
  getState: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  saveGroup(input: EvalState['groups'][number]) { commit(d => { const i = d.groups.findIndex(g => g.id === input.id); if (i >= 0) d.groups[i] = input; else d.groups.unshift({ ...input, id: input.id || uid('gr') }); }); },
  deleteGroup(id: string) { commit(d => { d.groups = d.groups.filter(g => g.id !== id); }); },
  saveCriterion(input: Criterion) { commit(d => { const i = d.criteria.findIndex(c => c.id === input.id); if (i >= 0) d.criteria[i] = input; else d.criteria.unshift({ ...input, id: input.id || uid('cr') }); }); },
  deleteCriterion(id: string) { commit(d => { d.criteria = d.criteria.filter(c => c.id !== id); }); },
  saveTemplate(input: EvalTemplate) {
    const id = input.id || uid('tpl');
    commit(d => { const row = { ...input, id }; const i = d.templates.findIndex(t => t.id === id); if (i >= 0) d.templates[i] = row; else d.templates.unshift(row); });
    return id;
  },
  deleteTemplate(id: string) { commit(d => { d.templates = d.templates.filter(t => t.id !== id); }); },
  saveKpi(input: Omit<KpiSetup, 'id' | 'status'> & { id?: string }, publish: boolean) {
    const id = input.id || uid('kpi');
    commit(d => { d.kpiSetups.unshift({ ...input, id, status: publish ? 'Đã phát hành' : 'Nháp' }); });
    return id;
  },
  savePeriod(input: Omit<EvalPeriod, 'id' | 'status'> & { id?: string }, publish: boolean) {
    const id = input.id || uid('ep');
    const template = state.templates.find(item => item.id === input.templateId);
    const period: EvalPeriod = { ...input, id, status: publish ? 'Đang diễn ra' : 'Nháp', criteria: input.criteria.length ? input.criteria : template?.criteria || [] };
    commit(d => {
      const i = d.periods.findIndex(item => item.id === id);
      if (i >= 0) d.periods[i] = period; else d.periods.unshift(period);
      if (publish) {
        const name = template?.name || '';
        const created = formsForPeriod(period).map(form => ({ ...form, templateName: name }));
        d.forms = d.forms.filter(form => form.periodId !== id).concat(created);
      }
    });
    return id;
  },
  saveForm(input: EvalForm) { commit(d => { d.forms = d.forms.map(form => form.id === input.id ? input : form); }); },
  defaultGrades: GRADES,
  defaultLevels: LEVELS,
};

export function useEval() { return useSyncExternalStore(evalStore.subscribe, evalStore.getState, evalStore.getState); }
