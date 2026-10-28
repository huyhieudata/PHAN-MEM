import { useSyncExternalStore } from 'react';
import { USER } from '../session';

export interface TaskStatus { id: string; name: string; column: string; color: string }
export interface TaskPriority { id: string; name: string; color: string }
export interface TaskItem {
  id: string; projectId: string; title: string; statusId: string; priorityId: string;
  assigneeId: string; owner: string; watchers: string[]; start: string; end: string;
  description: string; parentId: string | null; comments: { at: string; author: string; text: string }[];
}
export interface Project { id: string; name: string }
export interface TaskState { projects: Project[]; statuses: TaskStatus[]; priorities: TaskPriority[]; tasks: TaskItem[] }

const KEY = 'hrmhub.tasks.v1';

export function seedTasks(): TaskState {
  const statuses: TaskStatus[] = [
    { id: 'st-todo', name: 'Chưa thực hiện', column: 'Cần làm', color: '#4f46e5' },
    { id: 'st-doing', name: 'Đang thực hiện', column: 'Đang làm', color: '#ea580c' },
    { id: 'st-review', name: 'Chờ duyệt', column: 'Chờ duyệt', color: '#c026d3' },
    { id: 'st-done', name: 'Hoàn thành', column: 'Hoàn thành', color: '#166534' },
  ];
  const priorities: TaskPriority[] = [
    { id: 'pr-normal', name: 'Bình thường', color: '#4f46e5' },
    { id: 'pr-urgent', name: 'Khẩn cấp', color: '#c026d3' },
  ];
  const project = { id: 'pj-1', name: 'HCNS THÁNG 8' };
  const task = (id: string, title: string, statusId: string, start = '', end = ''): TaskItem => ({
    id, projectId: project.id, title, statusId, priorityId: '', assigneeId: '', owner: USER.name,
    watchers: [], start, end, description: '', parentId: null, comments: [],
  });
  return {
    projects: [project], statuses, priorities,
    tasks: [
      task('tk-1', 'Thu hồ sơ nhân sự', 'st-todo'),
      task('tk-2', 'Hoàn thiện hợp đồng lao động của toàn bộ nhân viên', 'st-todo', '2026-08-14', '2026-08-31'),
      task('tk-3', 'Kiểm tra vệ sinh hàng ngày', 'st-todo', '2026-08-14', '2026-08-31'),
      task('tk-4', 'Công tác văn thư lưu trữ', 'st-todo'),
      task('tk-5', 'Tuyển dụng nhân sự', 'st-doing'),
    ],
  };
}

let state = read();
const listeners = new Set<() => void>();
function read(): TaskState {
  const fresh = seedTasks();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw) as TaskState;
    if (!Array.isArray(data.tasks)) return fresh;
    return data.projects?.length ? data : fresh;
  } catch { return fresh; }
}
function commit(recipe: (draft: TaskState) => void) {
  const draft = structuredClone(state);
  recipe(draft);
  state = draft;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bỏ qua */ }
  listeners.forEach(fn => fn());
}
function uid(prefix: string) { return prefix + '-' + Math.random().toString(36).slice(2, 7); }

export const taskStore = {
  getState: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  addProject(name: string) { const id = uid('pj'); commit(d => { d.projects.push({ id, name }); }); return id; },
  addTask(input: Omit<TaskItem, 'id' | 'comments' | 'owner'> & { owner?: string }) {
    const id = uid('tk');
    commit(d => { d.tasks.push({ ...input, id, owner: input.owner || USER.name, comments: [] }); });
    return id;
  },
  updateTask(id: string, patch: Partial<TaskItem>) { commit(d => { d.tasks = d.tasks.map(task => task.id === id ? { ...task, ...patch } : task); }); },
  deleteTask(id: string) { commit(d => { d.tasks = d.tasks.filter(task => task.id !== id && task.parentId !== id); }); },
  comment(id: string, text: string) { commit(d => { const task = d.tasks.find(item => item.id === id); if (task) task.comments.push({ at: new Date().toISOString(), author: USER.name, text }); }); },
  saveStatus(input: TaskStatus) { commit(d => { const i = d.statuses.findIndex(s => s.id === input.id); if (i >= 0) d.statuses[i] = input; else d.statuses.push({ ...input, id: input.id || uid('st'), column: input.name }); }); },
  deleteStatus(id: string) { commit(d => { d.statuses = d.statuses.filter(s => s.id !== id); }); },
  savePriority(input: TaskPriority) { commit(d => { const i = d.priorities.findIndex(s => s.id === input.id); if (i >= 0) d.priorities[i] = input; else d.priorities.push({ ...input, id: input.id || uid('pr') }); }); },
  deletePriority(id: string) { commit(d => { d.priorities = d.priorities.filter(s => s.id !== id); }); },
};

export function useTasks() { return useSyncExternalStore(taskStore.subscribe, taskStore.getState, taskStore.getState); }
