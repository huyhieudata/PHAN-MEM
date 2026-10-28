import { useMemo, useState } from 'react';
import { BarChart, Donut } from '../../components/Charts';
import { DataTable, type Column } from '../../components/DataTable';
import { downloadText, toCsv } from '../../data/csv';
import { isOpenContract, onPayroll, TENURE_BUCKETS, tenureBucket } from '../../data/derive';
import { fmtDate, todayISO } from '../../data/text';
import { useLabels } from './lookups';

interface UnitRow { id: string; name: string; count: number; share: string }

export default function ReportsPage() {
  const { state, branch } = useLabels();
  const [branchId, setBranchId] = useState('');
  const today = todayISO();
  const people = useMemo(
    () => state.employees.filter(e => onPayroll(e) && (!branchId || e.branchId === branchId)),
    [state.employees, branchId],
  );

  const byUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of people) map.set(person.unitId, (map.get(person.unitId) ?? 0) + 1);
    return [...map.entries()]
      .map(([id, count]) => ({ id, name: state.units.find(u => u.id === id)?.name ?? '—', count }))
      .sort((a, b) => b.count - a.count);
  }, [people, state.units]);

  const tenure = TENURE_BUCKETS.map(label => ({
    label,
    value: people.filter(p => tenureBucket(p.startDate, today) === label).length,
  }));

  const contractTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people) {
      const own = state.contracts.filter(c => c.employeeId === person.id && isOpenContract(c, today));
      const latest = [...own].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
      const key = latest?.type ?? 'Chưa có hợp đồng';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({ label, value }));
  }, [people, state.contracts, today]);

  const total = people.length || 1;
  const table: UnitRow[] = byUnit.map(row => ({ ...row, share: `${Math.round((row.count / total) * 100)}%` }));
  const columns: Column<UnitRow>[] = [
    { id: 'name', header: 'Đơn vị', sort: r => r.name, cell: r => r.name },
    { id: 'count', header: 'Số người', sort: r => r.count, cell: r => r.count },
    { id: 'share', header: 'Tỷ lệ', sort: r => r.count, cell: r => r.share },
  ];

  function exportReport() {
    downloadText('bao-cao-nhan-su.csv', toCsv(
      ['Đơn vị', 'Số người', 'Tỷ lệ'],
      table.map(r => [r.name, String(r.count), r.share]),
    ));
  }

  return (
    <div>
      <div className="toolbar card flat">
        <label className="muted">Chi nhánh</label>
        <select aria-label="Chi nhánh báo cáo" value={branchId} onChange={e => setBranchId(e.target.value)}>
          <option value="">Toàn công ty</option>
          {state.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="grow" />
        <span className="muted">Số liệu ngày {fmtDate(today)} · {branch(branchId) === '—' ? 'mọi chi nhánh' : branch(branchId)} · {people.length} người chưa nghỉ việc</span>
        <button className="btn-ghost" onClick={exportReport}>⤓ Export</button>
      </div>
      <div className="report-grid">
        <section className="card">
          <h3>Biên chế theo đơn vị</h3>
          <BarChart items={byUnit.map(r => ({ label: r.name, value: r.count }))} />
        </section>
        <section className="card">
          <h3>Thâm niên</h3>
          <BarChart items={tenure} />
        </section>
        <section className="card span2">
          <h3>Loại hợp đồng đang hiệu lực</h3>
          <Donut items={contractTypes} />
        </section>
      </div>
      <div className="card panel">
        <DataTable rows={table} columns={columns} filterKey={branchId} />
      </div>
    </div>
  );
}
