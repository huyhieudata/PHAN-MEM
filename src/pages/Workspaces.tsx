import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { WORKSPACES } from '../data/session';
export default function Workspaces() {
  const nav = useNavigate();
  return (
    <div className="ws-page">
      <header className="ws-head"><Logo /><a className="link" href="#/auth/login">Đăng xuất</a></header>
      <h1>Chọn công ty của bạn</h1>
      <p className="muted center">Bạn đang là thành viên của {WORKSPACES.length} công ty</p>
      <div className="ws-grid">
        {WORKSPACES.map(w => (
          <button key={w.id} className="ws-card" onClick={() => { localStorage.setItem('ws', w.id); nav('/select-apps'); }}>
            <div className="ws-avatar" style={{ background: w.color }}>{w.name.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('')}</div>
            <div className="ws-info"><b>{w.name}</b><span className="role">Super Admin</span></div><span className="arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
