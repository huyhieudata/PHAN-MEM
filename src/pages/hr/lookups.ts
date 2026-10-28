import { useHr } from '../../hooks/useHr';

export function useLabels() {
  const state = useHr();
  return {
    state,
    unit: (id: string | null | undefined) => state.units.find(u => u.id === id)?.name ?? '—',
    branch: (id: string | null | undefined) => state.branches.find(b => b.id === id)?.name ?? '—',
    position: (id: string | null | undefined) => state.positions.find(p => p.id === id)?.name ?? '—',
    level: (id: string | null | undefined) => state.levels.find(l => l.id === id)?.name ?? '—',
    employee: (id: string | null | undefined) => state.employees.find(e => e.id === id),
  };
}
