import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/menu';
import EmployeeList from './hr/EmployeeList';
import EmployeeWizard from './hr/EmployeeWizard';
import EmployeeProfile from './hr/EmployeeProfile';
import { CertificatesPage, ContractReportPage, ContractSettingsPage, ContractsPage as ContractList, DecisionListPage, DecisionSettingsPage, DirectoryPage, FamilyPage, HeadcountPage as HeadcountBoard, HrDelegationPage, HrOverviewPage, HrReportPage, HrSettingsPage, InsuranceDeclarePage, InsuranceInfoPage, OnboardingSettings, RewardBatchPage } from './hr/catalog';
import { LevelsPage, PositionsPage, SystemOverview, UnitsPage } from './system/OrgPages';
import { AuditPage, BranchAdminPage, CompanyPage, LoginMethodPage, OpenApiPage, OrgStructurePage, PlanPage, Unsurveyed } from './system/spec';
import RequestsPage from './don-tu/RequestsPage';
import { DelegationPage, DonTuOverview, LeaveListPage, LeaveManagePage, LeavePolicyPage, OtPolicyPage, OtReportPage, OtThresholdPage, OtThresholdReport, ProcedurePage, ReasonPage, RequestReportPage, RequestSetupPage } from './don-tu/spec';
import { AttendanceMethodPage, AttendanceOverview, AttendanceReports, HolidayPage, OpenShiftPage, RawAttendancePage, ScheduleConfigPage, SchedulePage, ShiftDayPage, ShiftListPage, ShiftPlanPage, StandardWorkdayPage, TemplateListPage, TimesheetPage, UnspecifiedPage, WorkdaySettings } from './cham-cong/Pages';
import { CriteriaPage, EvalOverview, FormCreate, FormFill, FormList, GroupPage, KpiBoard, KpiCreate, KpiList, PeriodCreate, PeriodList, TemplateDetail, TemplateEditor, TemplateList as EvalTemplates } from './eval/pages';
import { PrioritySettings, ProjectBoard, StatusSettings, TaskOverview, TaskReport } from './tasks/pages';
import { AccountingPage, CostPage, CreatePayroll, IncomeInfoPage, PayrollDetail, PayrollGate, PayrollOverview, SalaryReport, TaxTablePage, listPage } from './payroll/pages';
import { CategoryPage, IndicatorPage, ReportTemplatePage, SimpleMaster, TableSettingsPage, TemplateEdit, TemplateList, V1Extra, V1General, V1MainList, V1PayslipSettings } from './payroll/settings';

const BUILT: Record<string, () => JSX.Element> = {
  'nhan-su/overview': HrOverviewPage,
  'nhan-su/thong-tin-nhan-su': EmployeeList,
  'nhan-su/hop-dong': ContractList,
  'nhan-su/dinh-bien': HeadcountBoard,
  'nhan-su/gia-dinh-nguoi-phu-thuoc': FamilyPage,
  'nhan-su/chung-chi': CertificatesPage,
  'nhan-su/danh-ba': DirectoryPage,
  'nhan-su/uy-quyen-tat-ca': () => <HrDelegationPage mode="all" />,
  'nhan-su/toi-uy-quyen': () => <HrDelegationPage mode="mine" />,
  'nhan-su/duoc-uy-quyen': () => <HrDelegationPage mode="received" />,
  'nhan-su/khai-bao-bhxh': InsuranceDeclarePage,
  'nhan-su/thong-tin-bhxh': InsuranceInfoPage,
  'nhan-su/quyet-dinh': () => <DecisionListPage view="all" />,
  'nhan-su/quyet-dinh-cua-toi': () => <DecisionListPage view="mine" />,
  'nhan-su/quyet-dinh-can-duyet': () => <DecisionListPage view="approve" />,
  'nhan-su/quyet-dinh-uy-quyen': () => <DecisionListPage view="proxy" />,
  'nhan-su/quyet-dinh-theo-doi': () => <DecisionListPage view="watch" />,
  'nhan-su/khen-thuong': () => <RewardBatchPage kind="reward" />,
  'nhan-su/ky-luat': () => <RewardBatchPage kind="discipline" />,
  'nhan-su/bao-cao-nhan-su': HrReportPage,
  'nhan-su/bao-cao-hop-dong': ContractReportPage,
  'nhan-su/cai-dat-nhan-su': HrSettingsPage,
  'nhan-su/cai-dat-hop-dong': ContractSettingsPage,
  'nhan-su/cai-dat-quyet-dinh': DecisionSettingsPage,
  'nhan-su/onboarding': OnboardingSettings,
  'don-tu/overview': DonTuOverview,
  'don-tu/tat-ca': () => <RequestsPage view="all" />,
  'don-tu/cua-toi': () => <RequestsPage view="mine" />,
  'don-tu/can-duyet': () => <RequestsPage view="approve" />,
  'don-tu/uy-quyen-duyet': DelegationPage,
  'don-tu/quan-ly': () => <RequestsPage view="manage" />,
  'don-tu/theo-doi': () => <RequestsPage view="watch" />,
  'don-tu/tao-ho': () => <RequestsPage view="behalf" />,
  'don-tu/bao-cao-don-tu': RequestReportPage,
  'don-tu/bao-cao-ot': OtReportPage,
  'don-tu/bao-cao-nguong-ot': OtThresholdReport,
  'don-tu/phep': LeaveManagePage,
  'don-tu/chinh-sach-nghi-phep-v2': LeavePolicyPage,
  'don-tu/danh-sach-phep': LeaveListPage,
  'don-tu/chinh-sach-nghi-phep': LeavePolicyPage,
  'don-tu/thiet-lap-don-tu': RequestSetupPage,
  'don-tu/chinh-sach-ot': OtPolicyPage,
  'don-tu/cau-hinh-nguong-ot': OtThresholdPage,
  'don-tu/ly-do-tao-don-tu': ReasonPage,
  'don-tu/quy-trinh-duyet-don': ProcedurePage,
  'cham-cong/overview': AttendanceOverview,
  'cham-cong/bang-cong': TimesheetPage,
  'cham-cong/du-lieu-cham-cong': RawAttendancePage,
  'cham-cong/lich-lam-viec': SchedulePage,
  'cham-cong/lich-lam-viec-theo-ca': ShiftDayPage,
  'cham-cong/bao-cao-cham-cong': AttendanceReports,
  'cham-cong/cai-dat-ngay-cong': WorkdaySettings,
  'cham-cong/cai-dat-cong-chuan': StandardWorkdayPage,
  'cham-cong/mau-bang-cong': TemplateListPage,
  'cham-cong/thong-tin-tinh-cong': () => <UnspecifiedPage title="Thông tin tính công" />,
  'cham-cong/cai-dat-thong-bao': () => <UnspecifiedPage title="Cài đặt thông báo" />,
  'cham-cong/ca-lam-viec': ShiftListPage,
  'cham-cong/phan-ca': () => <ShiftPlanPage />,
  'cham-cong/lich-nghi-le': HolidayPage,
  'cham-cong/ca-mo': OpenShiftPage,
  'cham-cong/ke-hoach-phan-ca-theo-kip': () => <ShiftPlanPage kip />,
  'cham-cong/cau-hinh-lich-lam-viec': ScheduleConfigPage,
  'cham-cong/cai-dat-cham-cong': AttendanceMethodPage,
  'cham-cong/cham-cong-dien-thoai': () => <UnspecifiedPage title="Chấm công điện thoại" />,
  'cham-cong/cham-cong-van-tay': () => <UnspecifiedPage title="Chấm công vân tay" />,
  'cham-cong/ho-so-khuon-mat': () => <UnspecifiedPage title="Hồ sơ khuôn mặt" />,
  'cham-cong/cham-cong-ho': () => <UnspecifiedPage title="Chấm công hộ" />,
  'he-thong/overview': SystemOverview,
  'he-thong/thong-tin-cong-ty': CompanyPage,
  'he-thong/he-thong-chi-nhanh': BranchAdminPage,
  'he-thong/co-cau-to-chuc': OrgStructurePage,
  'he-thong/cap-don-vi': LevelsPage,
  'he-thong/don-vi': UnitsPage,
  'he-thong/vi-tri-cong-viec': PositionsPage,
  'he-thong/hinh-thuc-dang-nhap': LoginMethodPage,
  'he-thong/lich-su-thao-tac': AuditPage,
  'he-thong/goi-dich-vu': PlanPage,
  'he-thong/open-api': OpenApiPage,
  'he-thong/cai-dat-ung-dung-mobile': () => <Unsurveyed title="Cài đặt ứng dụng mobile" />,
  'he-thong/goi-y-ma-nhan-vien': () => <Unsurveyed title="Gợi ý mã nhân viên" />,
  'he-thong/tich-hop-hanet': () => <Unsurveyed title="Tích hợp Hanet" />,
  'he-thong/tich-hop': () => <Unsurveyed title="Tích hợp" />,
  'he-thong/business-rule': () => <Unsurveyed title="Business rule" />,
  'he-thong/bieu-mau-tai-lieu': () => <Unsurveyed title="Biểu mẫu tài liệu" />,
  'tinh-luong/overview': PayrollOverview,
  'tinh-luong/bang-luong-chinh': listPage('Bảng lương chính'),
  'tinh-luong/bang-san-pham': listPage('Bảng sản phẩm'),
  'tinh-luong/bang-kpi': listPage('Bảng lương KPI'),
  'tinh-luong/khen-thuong-ky-luat': listPage('Bảng khen thưởng - kỷ luật'),
  'tinh-luong/dieu-chinh-thu-nhap': listPage('Bảng điều chỉnh thu nhập'),
  'tinh-luong/bang-luong-tam-ung': listPage('Bảng lương tạm ứng'),
  'tinh-luong/bang-luong-khac': listPage('Bảng lương khác'),
  'tinh-luong/chi-phi-luong': CostPage,
  'tinh-luong/hach-toan-luong': AccountingPage,
  'tinh-luong/thong-tin-thu-nhap': IncomeInfoPage,
  'tinh-luong/bang-thue': TaxTablePage,
  'tinh-luong/bao-cao-luong': SalaryReport,
  'tinh-luong/mau-bang-luong': TemplateList,
  'tinh-luong/thong-tin-tinh-luong': IndicatorPage,
  'tinh-luong/san-pham': () => <SimpleMaster kind="product" />,
  'tinh-luong/cost-center': () => <SimpleMaster kind="center" />,
  'tinh-luong/phan-bo-chi-phi': () => <SimpleMaster kind="assign" />,
  'tinh-luong/hang-muc-chi-phi': CategoryPage,
  'tinh-luong/mau-bao-cao-hoach-toan': ReportTemplatePage,
  'tinh-luong/cai-dat-bang-luong': TableSettingsPage,
  'tinh-luong/bang-luong-chinh-v1': V1MainList,
  'tinh-luong/bang-luong-phu-v1': V1Extra,
  'tinh-luong/mau-bang-luong-v1': V1PayslipSettings,
  'tinh-luong/cai-dat-chung-v1': V1General,
  'danh-gia/overview': EvalOverview,
  'danh-gia/kpi-tat-ca': () => <KpiList view="all" />,
  'danh-gia/kpi-can-thiet-lap': () => <KpiList view="setup" />,
  'danh-gia/kpi-can-duyet': () => <KpiList view="approve" />,
  'danh-gia/kpi-theo-doi': () => <KpiList view="watch" />,
  'danh-gia/ky-tat-ca': () => <PeriodList view="all" />,
  'danh-gia/ky-can-danh-gia': () => <PeriodList view="evaluate" />,
  'danh-gia/ky-can-duyet': () => <PeriodList view="approve" />,
  'danh-gia/ky-theo-doi': () => <PeriodList view="watch" />,
  'danh-gia/phieu-tat-ca': () => <FormList view="all" />,
  'danh-gia/phieu-cua-toi': () => <FormList view="mine" />,
  'danh-gia/phieu-can-danh-gia': () => <FormList view="evaluate" />,
  'danh-gia/phieu-can-duyet': () => <FormList view="approve" />,
  'danh-gia/phieu-theo-doi': () => <FormList view="manage" />,
  'danh-gia/kpi-bang-tat-ca': () => <KpiBoard view="all" />,
  'danh-gia/kpi-cua-toi': () => <KpiBoard view="mine" />,
  'danh-gia/kpi-nhan-vien': () => <KpiBoard view="team" />,
  'danh-gia/tieu-chi': CriteriaPage,
  'danh-gia/nhom-tieu-chi': GroupPage,
  'danh-gia/mau-danh-gia': EvalTemplates,
  'cong-viec/overview': TaskOverview,
  'cong-viec/bao-cao': TaskReport,
  'cong-viec/du-an': ProjectBoard,
  'cong-viec/trang-thai': StatusSettings,
  'cong-viec/uu-tien': PrioritySettings,
};

export default function ModulePage() {
  const { moduleId, pageId, recordId } = useParams();
  const nav = useNavigate();
  const mod = getModule(moduleId);
  if (!mod) return <Navigate to="/select-apps" replace />;
  const sub = mod.sub.find(s => s.id === (pageId || 'overview')) || { id: pageId || 'overview', label: 'Không tìm thấy trang' };
  if (mod.id === 'nhan-su' && sub.id === 'thong-tin-nhan-su' && recordId === 'tao-moi') return <EmployeeWizard />;
  if (mod.id === 'nhan-su' && sub.id === 'thong-tin-nhan-su' && recordId) return <EmployeeProfile />;
  if (mod.id === 'danh-gia' && sub.id === 'kpi-tat-ca' && recordId === 'tao') return <KpiCreate />;
  if (mod.id === 'danh-gia' && sub.id === 'ky-tat-ca' && recordId === 'tao') return <PeriodCreate />;
  if (mod.id === 'danh-gia' && sub.id === 'phieu-tat-ca' && recordId === 'tao') return <FormCreate />;
  if (mod.id === 'danh-gia' && sub.id === 'phieu-tat-ca' && recordId) return <FormFill />;
  if (mod.id === 'danh-gia' && sub.id === 'mau-danh-gia' && recordId === 'tao') return <TemplateEditor />;
  if (mod.id === 'danh-gia' && sub.id === 'mau-danh-gia' && recordId) return <TemplateDetail />;
  if (mod.id === 'tinh-luong' && recordId === 'tao' && sub.id === 'mau-bang-luong') return <PayrollGate><TemplateEdit /></PayrollGate>;
  if (mod.id === 'tinh-luong' && recordId === 'tao') return <PayrollGate><CreatePayroll /></PayrollGate>;
  if (mod.id === 'tinh-luong' && recordId) return <PayrollGate><PayrollDetail /></PayrollGate>;
  const Built = BUILT[`${mod.id}/${sub.id}`];
  const isOverview = sub.id === 'overview';
  const v2 = ['overview', 'bang-luong-chinh', 'bang-san-pham', 'bang-kpi', 'khen-thuong-ky-luat', 'dieu-chinh-thu-nhap', 'bang-luong-tam-ung', 'bang-luong-khac', 'chi-phi-luong', 'hach-toan-luong', 'thong-tin-thu-nhap', 'bang-thue'];
  const payrollGroup = mod.id !== 'tinh-luong' ? '' : sub.id === 'bao-cao-luong' ? 'Báo cáo' : sub.id.endsWith('v1') && sub.id.startsWith('bang-') ? 'Tính lương V1' : v2.includes(sub.id) ? 'Tính lương V2' : 'Cài đặt';
  const title = mod.id === 'tinh-luong' && isOverview ? 'Tổng quan module Tính lương' : isOverview ? `Tổng quan ${mod.label.toLowerCase()}` : sub.label;
  const body = (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb"><a href="#/select-apps">Trang chủ</a> / <a href={`#/m/${mod.id}`}>{mod.label}</a>{payrollGroup && <> / {payrollGroup}</>}{!isOverview && <> / <span>{sub.label}</span></>}</div>
          <h1>{title}</h1>
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
  return mod.id === 'tinh-luong' ? <PayrollGate>{body}</PayrollGate> : body;
}
