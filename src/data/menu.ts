// Single source of truth for modules, sub-menus and launcher apps.
export type SubItem = { id: string; label: string };
export type Module = { id: string; label: string; icon: string; color: string; sub: SubItem[]; inRail?: boolean };

const s = (...labels: string[]): SubItem[] =>
  labels.map((label, i) => ({ id: i === 0 ? 'overview' : slug(label), label }));
export function slug(t: string) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const MODULES: Module[] = [
  { id: 'overview', label: 'Tổng quan', icon: '◎', color: '#2563EB', sub: s('Tổng quan', 'Bảng tin', 'Lịch của tôi') },
  { id: 'nhan-su', label: 'Nhân sự', icon: '👥', color: '#2563EB', sub: s('Tổng quan', 'Thông tin nhân sự', 'Hợp đồng', 'Định biên', 'Gia đình & người phụ thuộc', 'Chứng chỉ', 'Danh bạ', 'Ủy quyền', 'Khai báo BHXH', 'Quyết định', 'Khen thưởng', 'Kỷ luật', 'Báo cáo', 'Cài đặt') },
  { id: 'don-tu', label: 'Đơn từ', icon: '📝', color: '#3B82F6', sub: [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'tat-ca', label: 'Tất cả' },
    { id: 'cua-toi', label: 'Của tôi' },
    { id: 'can-duyet', label: 'Cần duyệt' },
    { id: 'uy-quyen-duyet', label: 'Ủy quyền duyệt' },
    { id: 'quan-ly', label: 'Quản lý' },
    { id: 'theo-doi', label: 'Theo dõi' },
    { id: 'tao-ho', label: 'Tạo hộ' },
    { id: 'bao-cao-don-tu', label: 'Đơn từ' },
    { id: 'bao-cao-ot', label: 'Báo cáo OT' },
    { id: 'bao-cao-nguong-ot', label: 'Báo cáo ngưỡng OT' },
    { id: 'phep', label: 'Phép' },
    { id: 'chinh-sach-nghi-phep-v2', label: 'Chính sách nghỉ phép V2' },
    { id: 'danh-sach-phep', label: 'Danh sách phép' },
    { id: 'chinh-sach-nghi-phep', label: 'Chính sách nghỉ phép' },
    { id: 'thiet-lap-don-tu', label: 'Thiết lập đơn từ' },
    { id: 'chinh-sach-ot', label: 'Chính sách OT' },
    { id: 'cau-hinh-nguong-ot', label: 'Cấu hình ngưỡng OT & thông báo' },
    { id: 'ly-do-tao-don-tu', label: 'Lý do tạo đơn từ' },
    { id: 'quy-trinh-duyet-don', label: 'Quy trình duyệt đơn' },
  ] },
  { id: 'cham-cong', label: 'Chấm công', icon: '⏱', color: '#10B981', sub: [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'bang-cong', label: 'Bảng công' },
    { id: 'du-lieu-cham-cong', label: 'Dữ liệu chấm công' },
    { id: 'lich-lam-viec', label: 'Lịch làm việc' },
    { id: 'lich-lam-viec-theo-ca', label: 'Lịch làm việc theo ca' },
    { id: 'bao-cao-cham-cong', label: 'Chấm công' },
    { id: 'cai-dat-ngay-cong', label: 'Cài đặt ngày công' },
    { id: 'cai-dat-cong-chuan', label: 'Cài đặt công chuẩn' },
    { id: 'mau-bang-cong', label: 'Mẫu bảng công' },
    { id: 'thong-tin-tinh-cong', label: 'Thông tin tính công' },
    { id: 'cai-dat-thong-bao', label: 'Cài đặt thông báo' },
    { id: 'ca-lam-viec', label: 'Ca làm việc' },
    { id: 'phan-ca', label: 'Phân ca' },
    { id: 'lich-nghi-le', label: 'Lịch nghỉ lễ' },
    { id: 'ca-mo', label: 'Ca mở' },
    { id: 'ke-hoach-phan-ca-theo-kip', label: 'Kế hoạch phân ca theo kíp' },
    { id: 'cau-hinh-lich-lam-viec', label: 'Cấu hình lịch làm việc' },
    { id: 'cai-dat-cham-cong', label: 'Cài đặt chấm công' },
    { id: 'cham-cong-dien-thoai', label: 'Chấm công điện thoại' },
    { id: 'cham-cong-van-tay', label: 'Chấm công vân tay' },
    { id: 'ho-so-khuon-mat', label: 'Hồ sơ khuôn mặt' },
    { id: 'cham-cong-ho', label: 'Chấm công hộ' },
  ] },
  { id: 'tinh-luong', label: 'Tính lương', icon: '💰', color: '#EAB308', sub: s('Tổng quan', 'Bảng lương', 'Báo cáo lương', 'Cài đặt') },
  { id: 'danh-gia', label: 'Đánh giá', icon: '⭐', color: '#8B5CF6', sub: s('Tổng quan', 'Kỳ đánh giá', 'Phiếu đánh giá', 'Đánh giá 360', 'KPI', 'Cần duyệt', 'Báo cáo', 'Cài đặt') },
  { id: 'cong-viec', label: 'Công việc', icon: '✅', color: '#06B6D4', sub: s('Tổng quan', 'Dự án', 'Công việc của tôi', 'Công việc được giao', 'Báo cáo', 'Cài đặt') },
  { id: 'tai-san', label: 'Tài sản', icon: '💼', color: '#64748B', sub: s('Tổng quan', 'Danh sách tài sản', 'Cấp phát', 'Thu hồi', 'Bảo trì', 'Kiểm kê', 'Báo cáo', 'Cài đặt') },
  { id: 'de-xuat', label: 'Đề xuất', icon: '💡', color: '#EC4899', sub: s('Tổng quan', 'Tất cả', 'Của tôi', 'Cần duyệt', 'Theo dõi', 'Báo cáo', 'Cài đặt') },
  { id: 'tai-lieu', label: 'Tài liệu', icon: '📁', color: '#0EA5E9', sub: s('Tổng quan', 'Tài liệu công ty', 'Tài liệu của tôi', 'Được chia sẻ', 'Thùng rác', 'Cài đặt') },
  { id: 'ky-so', label: 'Ký số', icon: '✍', color: '#14B8A6', sub: s('Tổng quan', 'Tài liệu cần ký', 'Tài liệu đã gửi', 'Mẫu tài liệu', 'Chữ ký số', 'Cài đặt') },
  { id: 'truyen-thong', label: 'Truyền thông nội bộ', icon: '📣', color: '#F43F5E', sub: s('Tổng quan', 'Tin tức', 'Thông báo', 'Mạng nội bộ', 'Sự kiện', 'Cài đặt') },
  { id: 'ca-nhan', label: 'Cá nhân', icon: '👤', color: '#F59E0B', sub: s('Tổng quan', 'Thông tin cá nhân', 'Hợp đồng của tôi', 'Bảng công của tôi', 'Bảng lương của tôi', 'Ngày phép của tôi', 'Quyết định của tôi', 'Tài sản được cấp', 'Đổi mật khẩu') },
  { id: 'he-thong', label: 'Hệ thống', icon: '⚙', color: '#475569', sub: s('Tổng quan', 'Thông tin công ty', 'Hệ thống chi nhánh', 'Cơ cấu tổ chức', 'Cấp đơn vị', 'Đơn vị', 'Vị trí công việc', 'Phân quyền', 'Lịch sử thao tác', 'Tích hợp', 'Open API') },
];
export const getModule = (id?: string) => MODULES.find(m => m.id === id);

export type App = { label: string; icon: string; color: string; to?: string; disabled?: boolean };
const a = (label: string, icon: string, color: string, mod: string, page?: string): App =>
  ({ label, icon, color, to: `/m/${mod}${page ? '/' + slug(page) : ''}` });

export const LAUNCHER_PAGES: App[][] = [
  [
    a('Nhân sự', '👥', '#2563EB', 'nhan-su'), a('Đơn từ', '📝', '#3B82F6', 'don-tu'),
    a('Chấm công', '⏱', '#10B981', 'cham-cong'), a('Tính lương', '💰', '#EAB308', 'tinh-luong'),
    a('Quyết định nhân sự', '📜', '#EF4444', 'nhan-su', 'Quyết định'), a('Đánh giá nhân sự', '⭐', '#8B5CF6', 'danh-gia'),
    a('Phiếu đánh giá', '📋', '#A855F7', 'danh-gia', 'Phiếu đánh giá'), a('Công việc', '✅', '#06B6D4', 'cong-viec'),
    a('Tài sản', '💼', '#64748B', 'tai-san'), a('Đề xuất', '💡', '#EC4899', 'de-xuat'),
    a('Tài liệu', '📁', '#0EA5E9', 'tai-lieu'), a('Ký số', '✍', '#14B8A6', 'ky-so'),
    a('Hệ thống', '⚙', '#475569', 'he-thong'), a('Thông tin cá nhân', '👤', '#F59E0B', 'ca-nhan', 'Thông tin cá nhân'),
    a('Đơn từ của tôi', '🗂', '#2563EB', 'don-tu', 'Của tôi'),
  ],
  [
    a('Đơn từ cần duyệt', '📥', '#1D4ED8', 'don-tu', 'Cần duyệt'), a('Đề xuất của tôi', '💭', '#DB2777', 'de-xuat', 'Của tôi'),
    a('Đề xuất cần duyệt', '🔖', '#BE185D', 'de-xuat', 'Cần duyệt'), a('Bảng công của tôi', '📅', '#059669', 'ca-nhan', 'Bảng công của tôi'),
    a('Hợp đồng của tôi', '📄', '#1D4ED8', 'ca-nhan', 'Hợp đồng của tôi'), a('Ngày phép của tôi', '🏖', '#0D9488', 'ca-nhan', 'Ngày phép của tôi'),
    a('Quyết định của tôi', '📜', '#DC2626', 'ca-nhan', 'Quyết định của tôi'), a('Bảng lương của tôi', '💵', '#CA8A04', 'ca-nhan', 'Bảng lương của tôi'),
    a('Phiếu đánh giá của tôi', '📋', '#7C3AED', 'danh-gia', 'Phiếu đánh giá'), a('Kỳ đánh giá cần duyệt', '🗓', '#6D28D9', 'danh-gia', 'Cần duyệt'),
    a('Phiếu đánh giá cần duyệt', '☑', '#9333EA', 'danh-gia', 'Cần duyệt'), a('Tin tức', '📰', '#F43F5E', 'truyen-thong', 'Tin tức'),
    a('Mạng nội bộ', '🌐', '#E11D48', 'truyen-thong', 'Mạng nội bộ'), a('Thông tin công ty', '🏢', '#334155', 'he-thong', 'Thông tin công ty'),
    a('Tài sản được cấp', '🎒', '#475569', 'ca-nhan', 'Tài sản được cấp'),
  ],
  [
    a('Danh bạ', '📇', '#0284C7', 'nhan-su', 'Danh bạ'), a('Đổi mật khẩu', '🔑', '#57534E', 'ca-nhan', 'Đổi mật khẩu'),
    { label: 'Trò chơi', icon: '🎮', color: '#9CA3AF', disabled: true }, a('Tuyển dụng', '🎯', '#16A34A', 'nhan-su'),
  ],
];
