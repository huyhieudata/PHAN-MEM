import { NavLink, Outlet, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { MODULES, getModule } from '../data/menu';
import { plain } from '../data/text';
import { USER, currentWs } from '../data/session';
import { useTheme } from './useTheme';

export default function ModuleLayout() {
  const { moduleId } = useParams();
  const nav = useNavigate();
  const mod = getModule(moduleId);
  const [dark, toggle] = useTheme();
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  if (!mod) return <Navigate to="/select-apps" replace />;
  const results = q ? MODULES.flatMap(m => m.sub.map(s => ({ m, s }))).filter(x => plain(x.m.label + ' ' + x.s.label).includes(plain(q))).slice(0, 8) : [];
  return (
    <div className="shell">
      <aside className="rail">
        <button className="rail-item" onClick={() => nav('/select-apps')}><span className="ri">▦</span><small>Tất cả ứng dụng</small></button>
        <div className="rail-sep" />
        {MODULES.map(m => (
          <NavLink key={m.id} to={`/m/${m.id}`} className={() => 'rail-item' + (m.id === mod.id ? ' active' : '')}>
            <span className="ri">{m.icon}</span><small>{m.label}</small>
          </NavLink>))}
      </aside>
      <aside className="subnav">
        <div className="subnav-title"><span style={{ background: mod.color }}>{mod.icon}</span>{mod.label}</div>
        {mod.sub.map(s => <NavLink key={s.id} end={s.id === 'overview'} to={`/m/${mod.id}/${s.id === 'overview' ? '' : s.id}`} className={({ isActive }) => 'sub-item' + (isActive ? ' active' : '')}>{s.label}</NavLink>)}
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="tb-ws">🏢 <b>{currentWs().name}</b></div>
          <div className="tb-search"><span>🔍</span><input ref={ref} value={q} onChange={e => setQ(e.target.value)} onBlur={() => setTimeout(() => setQ(''), 150)} placeholder="Tìm kiếm chức năng..." /><kbd>Ctrl K</kbd>
            {results.length > 0 && <div className="tb-results">{results.map(r => <button key={r.m.id + r.s.id} onMouseDown={() => nav(`/m/${r.m.id}/${r.s.id === 'overview' ? '' : r.s.id}`)}>{r.m.icon} {r.m.label} › {r.s.label}</button>)}</div>}
          </div>
          <div className="hdr-right dark-text">
            <button className="pill">VIE</button>
            <button className="ico" onClick={toggle}>{dark ? '☀' : '🌙'}</button>
            <button className="ico">🔔<i className="badge">12</i></button>
            <div className="user-chip"><div className="av">{USER.initials}</div><div><b>{USER.name}</b><small>{USER.title}</small></div></div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </div>
    </div>
  );
}
