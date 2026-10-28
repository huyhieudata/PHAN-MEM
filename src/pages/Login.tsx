import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
const TABS = ['Số điện thoại', 'Email', 'Tên đăng nhập'];
export default function Login() {
  const nav = useNavigate();
  const [tab, setTab] = useState(0);
  const [show, setShow] = useState(false);
  return (
    <div className="login">
      <div className="login-left">
        <Logo />
        <h1>Nền tảng quản trị nhân sự<br /><span>hiệu suất cao</span></h1>
        <p>Số hóa toàn bộ quy trình nhân sự: hồ sơ, chấm công, tính lương, đánh giá và hơn thế nữa.</p>
        <svg className="diagram" viewBox="0 0 400 260">
          <circle cx="200" cy="130" r="46" fill="#F97316" /><text x="200" y="137" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700">HRM</text>
          {[[70, 50, 'Nhân sự'], [330, 50, 'Chấm công'], [60, 210, 'Tính lương'], [340, 210, 'Đánh giá'], [200, 20, 'Đơn từ'], [200, 245, 'Công việc']].map(([x, y, t], i) => (
            <g key={i}><line x1={200} y1={130} x2={x as number} y2={y as number} stroke="#FDBA74" strokeWidth="2" strokeDasharray="5 5" />
              <rect x={(x as number) - 48} y={(y as number) - 15} width="96" height="30" rx="15" fill="#fff" stroke="#FDBA74" />
              <text x={x as number} y={(y as number) + 5} textAnchor="middle" fontSize="13" fill="#9A3412">{t}</text></g>))}
        </svg>
      </div>
      <div className="login-right">
        <div className="lang-pill">🇻🇳 VIE ▾</div>
        <form className="login-form" onSubmit={e => { e.preventDefault(); nav('/workspaces'); }}>
          <h2>Đăng nhập</h2>
          <p className="muted">Chào mừng bạn quay trở lại 👋</p>
          <div className="tabs">{TABS.map((t, i) => <button type="button" key={t} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}</div>
          <label>{TABS[tab]}</label>
          <input placeholder={tab === 0 ? 'Nhập số điện thoại' : tab === 1 ? 'Nhập email' : 'Nhập tên đăng nhập'} />
          <label>Mật khẩu</label>
          <div className="pw"><input type={show ? 'text' : 'password'} placeholder="Nhập mật khẩu" /><button type="button" onClick={() => setShow(!show)}>{show ? '🙈' : '👁'}</button></div>
          <div className="row-between"><label className="chk"><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label><a href="#/auth/login" className="link">Quên mật khẩu?</a></div>
          <button className="btn-primary big" type="submit">ĐĂNG NHẬP</button>
          <div className="divider"><span>hoặc tiếp tục bằng</span></div>
          <div className="sso">
            <button type="button" onClick={() => nav('/workspaces')}><b style={{ color: '#EA4335' }}>G</b> Google</button>
            <button type="button" onClick={() => nav('/workspaces')}><b style={{ color: '#2563EB' }}>▦</b> Microsoft</button>
            <button type="button" onClick={() => nav('/workspaces')}><b></b> Apple</button>
          </div>
          <p className="muted small center">Bản demo giao diện: nhập bất kỳ để đăng nhập.</p>
        </form>
      </div>
    </div>
  );
}
