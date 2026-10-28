import { describe, expect, it } from 'vitest';
import { seedTasks } from './store';

describe('công việc mẫu', () => {
  it('có dự án HCNS và năm việc trên bốn trạng thái', () => {
    const data = seedTasks();
    expect(data.projects[0].name).toBe('HCNS THÁNG 8');
    expect(data.statuses).toHaveLength(4);
    expect(data.priorities.map(item => item.name)).toEqual(['Bình thường', 'Khẩn cấp']);
    expect(data.tasks.filter(task => task.statusId === 'st-todo')).toHaveLength(4);
    expect(data.tasks.find(task => task.title === 'Tuyển dụng nhân sự')?.statusId).toBe('st-doing');
  });
});
