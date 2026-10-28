export function BarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (!items.length) return <p className="muted">Chưa có dữ liệu.</p>;
  return (
    <div className="bars">
      {items.map(item => (
        <div className="bar-row" key={item.label}>
          <span title={item.label}>{item.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} /></div>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}

const COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#8B5CF6', '#64748B', '#EC4899'];

export function Donut({ items }: { items: { label: string; value: number }[] }) {
  const data = items.filter(i => i.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" width="168" height="168" role="img" aria-label="Biểu đồ tròn">
        <g transform="rotate(-90 70 70)">
          {total === 0 && <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="16" />}
          {data.map((item, index) => {
            const len = (item.value / Math.max(total, 1)) * circ;
            const node = (
              <circle key={item.label} cx="70" cy="70" r={r} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="16"
                strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return node;
          })}
        </g>
        <text x="70" y="74" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{total}</text>
      </svg>
      <ul className="legend-list">
        {items.map((item, index) => (
          <li key={item.label}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.label}</span><b>{item.value}</b></li>
        ))}
      </ul>
    </div>
  );
}
