import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { LAUNCHER_PAGES } from '../data/menu';
import { USER, currentWs } from '../data/session';
import { useTheme } from '../components/useTheme';
import { EMPLOYEES } from '../data/employees';

function Clock() {
  const [d, setD] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setD(new Date()), 1000); return () => clearInterval(t); }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return <div className="clock"><div className="time">{p(d.getHours())}:{p(d.getMinutes())}<small>:{p(d.getSeconds())}</small></div><div>{days[d.getDay()]}, {p(d.getDate())}/{p(d.getMonth() + 1)}/{d.getFullYear()}</div></div>;
}
function MiniCal() {
  const now = new Date(); const y = now.getFullYear(), m = now.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(0), ...Array.from({ length: n }, (_, i) => i + 1)];
  const ev = [5, 12, 20, 27];
  return <div><div className="cal-title">Tháng {m + 1}, {y}</div><div className="cal">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => <b key={x}>{x}</b>)}
    {cells.map((c, i) => <span key={i} className={(c === now.getDate() ? 'today ' : '') + (ev.includes(c) ? 'ev' : '')}>{c || ''}</span>)}</div></div>;
}
function Tabs({ items }: { items: string[] }) { const [t, setT] = useState(0); return <div className="ctabs">{items.map((x, i) => <button key={x} className={i === t ? 'on' : ''} onClick={() => setT(i)}>{x}</button>)}</div>; }

export function TopRight({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return <div className="hdr-right">
    <button className="ico" title="Thông báo">🔔<i className="badge">12</i></button>
    <button className="pill">VIE</button>
    <button className="ico" onClick={toggle} title="Giao diện">{dark ? '☀' : '🌙'}</button>
    <button className="ico" title="Cài đặt">⚙</button>
    <div className="user-chip"><div className="av">{USER.initials}</div><div><b>{USER.name}</b><small>{USER.title}</small></div></div>
  </div>;
}

export default function Launcher() {
  const nav = useNavigate();
  const [dark, toggle] = useTheme();
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 's' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  const all = LAUNCHER_PAGES.flat();
  const norm = (s: string) => s.toLowerCase();
  const apps = q ? all.filter(a => norm(a.label).includes(norm(q))) : LAUNCHER_PAGES[page];
  const ws = currentWs();
  return (
    <div className="launcher">
      <div className="wallpaper" />
      <header className="l-head">
        <div className="hdr-left"><Logo light /><button className="ws-chip" onClick={() => nav('/workspaces')}><small>Workspace hiện tại</small><b>{ws.name} ▾</b></button></div>
        <TopRight dark={dark} toggle={toggle} />
      </header>
      <section className="hero">
        <h1>Chào mừng trở lại, <span>{USER.name}</span> 👋</h1>
        <div className="search"><span>🔍</span><input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm ứng dụng..." /><kbd>S</kbd></div>
        <div className="grid-wrap">
          {!q && <button className="nav-arrow" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>}
          <div className="app-grid">
            {apps.map(a => (
              <button key={a.label} className={'app' + (a.disabled ? ' disabled' : '')} disabled={a.disabled} onClick={() => a.to && nav(a.to)} title={a.disabled ? 'Sắp ra mắt' : a.label}>
                <div className="app-ico" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)` }}>{a.icon}</div><span>{a.label}</span>
              </button>))}
            {q && !apps.length && <p className="empty-light">Không tìm thấy ứng dụng phù hợp</p>}
          </div>
          {!q && <button className="nav-arrow" disabled={page === LAUNCHER_PAGES.length - 1} onClick={() => setPage(page + 1)}>›</button>}
        </div>
        {!q && <div className="dots">{LAUNCHER_PAGES.map((_, i) => <i key={i} className={i === page ? 'on' : ''} onClick={() => setPage(i)} />)}</div>}
      </section>
      <section className="widgets">
        <div className="card w2"><h3>Tin tức công ty</h3><Tabs items={['Tất cả', 'THÔNG BÁO', 'TIN TỨC HOẠT ĐỘNG']} />
          {[['Thông báo lịch nghỉ Tết Dương lịch 2027', 'THÔNG BÁO', '2 giờ trước'], ['Tổ chức khám sức khỏe định kỳ năm 2026', 'THÔNG BÁO', 'Hôm qua'], ['Chương trình chào mừng ngày Phụ nữ Việt Nam 20/10', 'TIN TỨC HOẠT ĐỘNG', '8 ngày trước']].map(([t, c, d]) =>
            <div className="news" key={t}><div className="thumb" /><div><b>{t}</b><small><span className="tag">{c}</span> · {d}</small></div></div>)}
        </div>
        <div className="card w2"><h3>Lịch làm việc</h3><Tabs items={['Hôm nay', 'Ngày mai', 'Tuần này']} />
          <div className="counters">{[['Có mặt', 128, '#10B981'], ['Đi trễ', 7, '#F59E0B'], ['Vắng mặt', 4, '#EF4444'], ['Nghỉ phép', 6, '#3B82F6']].map(([l, n, c]) =>
            <div key={l as string} style={{ borderColor: c as string }}><b style={{ color: c as string }}>{n}</b><small>{l}</small></div>)}</div>
          <div className="shift">Ca hành chính · 08:00 – 17:30</div>
        </div>
        <div className="card"><h3>Sự kiện</h3><MiniCal /></div>
        <div className="card"><h3>Sinh nhật 🎂</h3>{EMPLOYEES.slice(0, 4).map((e, i) => <div className="person" key={e.code}><div className="av sm">{e.name.split(' ').pop()![0]}</div><div><b>{e.name}</b><small>{e.unit} · {28 + i > 31 ? i : 28 + i}/10</small></div></div>)}</div>
        <div className="card"><h3>Thâm niên 🏅</h3>{EMPLOYEES.slice(6, 9).map((e, i) => <div className="person" key={e.code}><div className="av sm">{e.name.split(' ').pop()![0]}</div><div><b>{e.name}</b><small>{[9, 7, 6][i]} năm gắn bó</small></div></div>)}</div>
        <div className="card"><h3>Phép của tôi</h3><div className="leave"><div><b>12</b><small>Tổng phép năm</small></div><div><b className="o">7.5</b><small>Còn lại</small></div><div><b>4.5</b><small>Đã dùng</small></div></div></div>
        <div className="card"><h3>Đơn từ của tôi</h3>{[['Đơn nghỉ phép 30/10', 'Chờ duyệt', 'warn'], ['Đơn đi công tác Đà Nẵng', 'Đã duyệt', 'ok'], ['Đơn làm thêm giờ 18/10', 'Từ chối', 'bad']].map(([t, s, c]) => <div className="req" key={t}><span>{t}</span><span className={'status ' + c}>{s}</span></div>)}</div>
      </section>
      <Clock />
    </div>
  );
}
