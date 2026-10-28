import type { ContractStatus, ContractType, DecisionType, EmployeeStatus, EmploymentType, Gender, Marital } from './types';

export const GENDERS: Gender[] = ['Nam', 'Nữ', 'Khác'];
export const MARITALS: Marital[] = ['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Khác'];
export const EMPLOYMENT_TYPES: EmploymentType[] = ['Thử việc', 'Chính thức', 'Thực tập', 'Cộng tác viên', 'Học việc', 'Thuê ngoài', 'Thời vụ', 'Part-time'];
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['Đang làm việc', 'Tạm nghỉ', 'Đã nghỉ việc'];
export const CONTRACT_TYPES: ContractType[] = ['Thử việc', 'Xác định thời hạn', 'Không xác định thời hạn', 'Thực tập', 'Cộng tác'];
export const CONTRACT_STATUSES: ContractStatus[] = ['Chờ ký', 'Hiệu lực', 'Thanh lý'];
export const DECISION_TYPES: DecisionType[] = ['Bổ nhiệm', 'Miễn nhiệm', 'Điều chuyển', 'Điều chuyển nội bộ', 'Tăng lương', 'Điều chỉnh lương & phụ cấp', 'Tạm hoãn HĐLĐ', 'Tạm đình chỉ công việc', 'Sa thải', 'Chấm dứt HĐLĐ', 'Khen thưởng', 'Kỷ luật', 'Nghỉ việc', 'Khác'];
export const RELATIONS = ['Vợ/chồng', 'Con', 'Cha', 'Mẹ', 'Anh/chị/em', 'Khác'];
export const REWARD_FORMS = ['Bằng khen', 'Giấy khen', 'Thưởng tiền', 'Chiến sĩ thi đua'];
export const DISCIPLINE_FORMS = ['Khiển trách', 'Cảnh cáo', 'Hạ bậc lương', 'Sa thải'];
