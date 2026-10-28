import { describe, expect, it } from 'vitest';
import { gradeFor, totalPercent, weightSum } from './score';
import type { Criterion, CriterionRef } from './types';

const catalog: Criterion[] = [
  { id: 'c1', name: 'Việc', code: 'V', groupId: 'g', kind: 'Thang điểm', description: '', active: true, formula: '', levels: [{ name: 'XS', score: 5, note: '' }] },
  { id: 'c2', name: 'Báo cáo', code: 'B', groupId: 'g', kind: 'Thang điểm', description: '', active: true, formula: '', levels: [{ name: 'XS', score: 5, note: '' }] },
  { id: 'c3', name: 'Quy trình', code: 'Q', groupId: 'g', kind: 'Thang điểm', description: '', active: true, formula: '', levels: [{ name: 'XS', score: 5, note: '' }] },
];
const rows: CriterionRef[] = [
  { criterionId: 'c1', target: '', weight: 70, counted: true },
  { criterionId: 'c2', target: '', weight: 10, counted: true },
  { criterionId: 'c3', target: '', weight: 20, counted: true },
];

describe('điểm đánh giá', () => {
  it('trọng số phải đủ 100 và điểm có trọng số map vào mức xếp loại', () => {
    expect(weightSum(rows)).toBe(100);
    const total = totalPercent({ scores: [{ criterionId: 'c1', raw: 4, note: '' }, { criterionId: 'c2', raw: 5, note: '' }, { criterionId: 'c3', raw: 3, note: '' }] }, rows, catalog, 'Không cho phép vượt 100%');
    expect(total).toBe(78);
    expect(gradeFor(total, [{ color: '#f59e0b', name: 'Đạt', from: 60, to: 79 }])?.name).toBe('Đạt');
  });
});
