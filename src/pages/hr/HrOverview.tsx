import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/Person';
import { actualHeadcount, contractPhase, onPayroll } from '../../data/derive';
import { fmtDate } from '../../data/text';
import { useLabels } from './lookups';

export default function HrOverview() {
  const nav = useNavigate();
  const { state, unit, employee } = useLabels();
  const working = state.employees.filter(e => e.status === 'Đang làm việc').length;
  const probation = state.employees.filter(e => onPayroll(e) && e.employmentType === 'Thử việc').length;
  const expiring = state.contracts.filter(c => contractPhase(c).label === 'Sắp hết hạn');
  const pending = state.decisions.filter(d => d.status === 'Chờ duyệt').length;
  const gap = state.headcounts.reduce((sum, plan) => sum + Math.max(0, plan.planned - actualHeadcount(state, plan.unitId, plan.positionId)), 0);
  const cards = [
    ['Đang làm việc', working, '/m/nhan-su/thong-tin-nhan-su'],
    ['Đang thử việc', probation, '/m/nhan-su/thong-tin-nhan-su'],
    ['Hợp đồng sắp hết hạn', expiring.length, '/m/nhan-su/hop-dong'],
    ['Quyết định chờ duyệt', pending, '/m/nhan-su/quyet-dinh'],
    ['Thiếu so với định biên', gap, '/m/nhan-su/dinh-bien'],
  ] as const;

  return (
    <div>
      <div className="kpis">
        {cards.map(([label, value, to]) => (
          <button key={label} className="kpi" onClick={() => nav(to)}>
            <small>{label}</small>
            <b>{value}</b>
          </button>
        ))}
      </div>
      <div className="split">
        <section className="card">
          <h3>Hợp đồng sắp hết hạn</h3>
          {expiring.length === 0 && <p className="muted">Không có hợp đồng hết hạn trong 30 ngày.</p>}
          {expiring.map(c => (
            <div className="req" key={c.id}>
              <span>{employee(c.employeeId)?.fullName ?? '—'} · {c.code}<small className="muted"> · {unit(employee(c.employeeId)?.unitId)} · đến {fmtDate(c.endDate)}</small></span>
              <StatusBadge value="Sắp hết hạn" />
            </div>
          ))}
        </section>
        <section className="card">
          <h3>Quyết định gần đây</h3>
          {[...state.decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(d => (
            <div className="req" key={d.id}>
              <span>{d.title}<small className="muted"> · {employee(d.employeeId)?.fullName}</small></span>
              <StatusBadge value={d.status} />
            </div>
          ))}
          <button className="link" onClick={() => nav('/m/nhan-su/quyet-dinh')}>Mở quyết định</button>
        </section>
      </div>
    </div>
  );
}
