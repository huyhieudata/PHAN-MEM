export const USER = { name: 'Dương Văn Hiệu', title: 'Giám đốc vận hành', initials: 'DH' };
export const WORKSPACES = [
  { id: 'macas', name: 'MACAS GROUP', color: '#F97316' },
  { id: 'cec', name: 'CEC GROUP', color: '#2563EB' },
  { id: 'cti', name: 'CTI GROUP', color: '#16A34A' },
  { id: 'h2n', name: 'H2N DƯỢC PHẨM', color: '#DB2777' },
  { id: 'pvk', name: 'HỘ KINH DOANH GIA DỤNG PHAN VĂN KHẢI', color: '#7C3AED' },
  { id: 'dxt', name: 'HỘ KINH DOANH ĐỖ XUÂN TÀI', color: '#0891B2' },
  { id: 'nd', name: 'Xây dựng Nam Dương', color: '#CA8A04' },
];
export function currentWs() {
  const id = localStorage.getItem('ws') || 'macas';
  return WORKSPACES.find(w => w.id === id) || WORKSPACES[0];
}
