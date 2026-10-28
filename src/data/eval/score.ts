import type { Criterion, CriterionRef, EvalForm, GradeBand } from './types';

export function weightSum(rows: { weight: number; counted?: boolean }[]) {
  return rows.reduce((sum, row) => sum + (row.counted === false ? 0 : Number(row.weight) || 0), 0);
}

export function criterionPercent(criterion: Criterion | undefined, raw: number | null, kpiMode: string) {
  if (raw == null || Number.isNaN(raw)) return null;
  if (!criterion || criterion.kind === 'Tỉ lệ hoàn thành') {
    const value = kpiMode.includes('Không cho phép vượt') ? Math.min(100, raw) : raw;
    return value;
  }
  const max = Math.max(...(criterion.levels.map(level => level.score)), 5);
  return Math.max(0, Math.min(100, (raw / max) * 100));
}

export function totalPercent(form: Pick<EvalForm, 'scores'>, criteria: CriterionRef[], catalog: Criterion[], kpiMode: string) {
  const counted = criteria.filter(row => row.counted);
  if (!counted.length) return null;
  let acc = 0;
  let seen = 0;
  counted.forEach(row => {
    const entry = form.scores.find(score => score.criterionId === row.criterionId);
    const pct = criterionPercent(catalog.find(item => item.id === row.criterionId), entry?.raw ?? null, kpiMode);
    if (pct == null) return;
    acc += pct * row.weight / 100;
    seen += 1;
  });
  return seen ? Math.round(acc * 10) / 10 : null;
}

export function gradeFor(total: number | null, grades: GradeBand[]) {
  if (total == null) return null;
  return grades.find(band => total >= band.from && total <= band.to) || null;
}
