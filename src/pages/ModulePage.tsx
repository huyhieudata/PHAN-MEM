import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/menu';
import EmployeeDetail from './hr/EmployeeDetail';
import EmployeeList from './hr/EmployeeList';
import ContractsPage from './hr/ContractsPage';
import HeadcountPage from './hr/HeadcountPage';
import DecisionsPage from './hr/DecisionsPage';
import HrOverview from './hr/HrOverview';
import { CertificatesPage, DirectoryPage, FamilyPage, InsurancePage, SettingsPage } from './hr/lists';
import ReportsPage from './hr/ReportsPage';
import RewardsPage from './hr/RewardsPage';
import Timesheet from './Timesheet';
import { BranchesPage, LevelsPage, OrgTreePage, PositionsPage, SystemOverview, UnitsPage } from './system/OrgPages';

const BUILT: Record<string, () => JSX.Element> = {
  'nhan-su/overview': HrOverview,
  'nhan-su/thong-tin-nhan-su': EmployeeList,
  'nhan-su/hop-dong': ContractsPage,
  'nhan-su/dinh-bien': HeadcountPage,
  'nhan-su/gia-dinh-nguoi-phu-thuoc': FamilyPage,
  'nhan-su/chung-chi': CertificatesPage,
  'nhan-su/danh-ba': DirectoryPage,
  'nhan-su/khai-bao-bhxh': InsurancePage,
  'nhan-su/quyet-dinh': DecisionsPage,
  'nhan-su/khen-thuong': () => <RewardsPage kind="reward" />,
  'nhan-su/ky-luat': () => <RewardsPage kind="discipline" />,
  'nhan-su/bao-cao': ReportsPage,
  'nhan-su/cai-dat': SettingsPage,
  'cham-cong/bang-cong': Timesheet,
  'he-thong/overview': SystemOverview,
  'he-thong/he-thong-chi-nhanh': BranchesPage,
  'he-thong/co-cau-to-chuc': OrgTreePage,
  'he-thong/cap-don-vi': LevelsPage,
  'he-thong/don-vi': UnitsPage,
  'he-thong/vi-tri-cong-viec': PositionsPage,
};

export default function ModulePage() {
  const { moduleId, pageId, recordId } = useParams();
  const nav = useNavigate();
  const mod = getModule(moduleId);
  if (!mod) return <Navigate to="/select-apps" replace />;
  const sub = mod.sub.find(s => s.id === (pageId || 'overview')) || { id: pageId || 'overview', label: 'Không tìm thấy trang' };
  if (mod.id === 'nhan-su' && sub.id === 'thong-tin-nhan-su' && recordId) return <EmployeeDetail />;
  const Built = BUILT[`${mod.id}/${sub.id}`];
  const isOverview = sub.id === 'overview';
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><a href="#/select-apps">Trang chủ</a> / <a href={`#/m/${mod.id}`}>{mod.label}</a>{!isOverview && <> / <span>{sub.label}</span></>}</div>
          <h1>{isOverview ? `Tổng quan ${mod.label.toLowerCase()}` : sub.label}</h1>
        </div>
        <button className="btn-ghost" onClick={() => nav(-1)}>← Quay lại</button>
      </div>
      {Built ? <Built /> : isOverview ? (
        <div className="feature-grid">
          {mod.sub.filter(s => s.id !== 'overview').map(s => (
            <button key={s.id} className="feature" onClick={() => nav(`/m/${mod.id}/${s.id}`)}>
              <div className="f-ico" style={{ background: mod.color + '1f', color: mod.color }}>{mod.icon}</div>
              <div><b>{s.label}</b><small>Quản lý {s.label.toLowerCase()} trong {mod.label.toLowerCase()}</small></div>
              {BUILT[`${mod.id}/${s.id}`] && <span className="tag green">Sẵn sàng</span>}
            </button>))}
        </div>
      ) : (
        <div className="card panel">
          <div className="toolbar"><div className="sk w160" /><div className="sk w120" /><div className="grow" /><button className="btn-primary" disabled>+ Thêm mới</button></div>
          <div className="skel-table">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk-row"><div className="sk w32 round" /><div className="sk w200" /><div className="sk w120" /><div className="sk w160" /><div className="sk w80" /></div>)}</div>
          <div className="empty"><div className="empty-ico">🗂</div><b>Chức năng "{sub.label}" đang được xây dựng</b><small>Giao diện mẫu – dữ liệu sẽ hiển thị tại đây.</small></div>
        </div>
      )}
    </div>
  );
}
