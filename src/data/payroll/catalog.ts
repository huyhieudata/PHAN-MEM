import type { FormulaKind, Indicator, PayrollComponent, ValueFormat } from './types';

const money = 'Tiền tệ (VND)' as const;
const num = 'Số' as const;
const text = 'Văn bản' as const;

function ind(code: string, name: string, kind: FormulaKind = 'Nhập tay', formula = '', format: ValueFormat = num, description = ''): Indicator {
  return { code, name, kind, formula, format, defaultValue: format === text ? '' : '0', description };
}

function excel(code: string, name: string, formula: string, description = ''): Indicator {
  return ind(code, name, 'Công thức Excel', formula, money, description);
}

const PROFILE: [string, string][] = [
  ['EMPLOYEE_CODE', 'Mã nhân viên'], ['FULL_NAME', 'Họ và tên'], ['GENDER', 'Giới tính'], ['PHONE', 'Số điện thoại'],
  ['BIRTH_DAY', 'Ngày sinh'], ['COMPANY_EMAIL', 'Email công ty'], ['PERSONAL_EMAIL', 'Email cá nhân'], ['ID_CARD', 'CCCD/CMND'],
  ['TAX_CODE', 'Mã số thuế'], ['PERMANENT_ADDRESS', 'Địa chỉ thường trú'], ['CURRENT_ADDRESS', 'Địa chỉ tạm trú'],
  ['BANK_ACCOUNT_NUMBER', 'Số tài khoản'], ['BANK_NAME', 'Ngân hàng'], ['BANK_BRANCH', 'Chi nhánh ngân hàng'],
  ['POSITION_NAME', 'Vị trí'], ['POSITION_CODE', 'Mã vị trí'], ['GROUP_NAME', 'Đơn vị'], ['BRANCH_NAME', 'Chi nhánh'],
  ['START_DATE_OF_WORK', 'Ngày đi làm'], ['OFFICIAL_START_DATE_OF_WORK', 'Ngày chính thức'], ['EMPLOYMENT_STATUS', 'Trạng thái nhân sự'],
  ['EMPLOYMENT_CATEGORY', 'Loại hình nhân sự'], ['RESIGNATION_DATE', 'Ngày nghỉ việc'],
];

const OT_BASES = ['OT_NORMAL', 'OT_WEEKEND', 'OT_HOLIDAY', 'OT_NIGHT', 'OT_WEEKEND_NIGHT', 'OT_HOLIDAY_NIGHT', 'OT_COMP', 'OT_150', 'OT_200', 'OT_210', 'OT_270', 'OT_300', 'OT_390', 'OT_BEFORE', 'OT_AFTER', 'OT_DAY', 'OT_SHIFT', 'OT_UNPAID'];

export function buildIndicators(): Indicator[] {
  const rows: Indicator[] = [
    ...PROFILE.map(([code, name]) => ind(code, name, 'Nhập tay', '', text)),
    ind('NUMBER_OF_DEPENDENT_PERSONS', 'Số người phụ thuộc'),
    ind('INSURANCE_RATE', 'Mức đóng bảo hiểm', 'Nhập tay', '', money, 'Lấy từ lương hợp đồng đang hiệu lực.'),
    ind('PHU_CAP_AN_CA', 'Phụ cấp ăn ca', 'Nhập tay', '', money),
    ind('TONG_TIEN_TANG_CA', 'Tổng tiền tăng ca', 'Nhập tay', '', money),
    ind('THU_NHAP_MIEN_THUE', 'Thu nhập miễn thuế', 'Nhập tay', '', money),
    excel('THUC_NHAN', 'Thực nhận', 'TONG_THU_NHAP-KHAU_TRU_THUE-BHXH_NLD-BHYT_NLD-BHTN_NLD-CONG_DOAN_NLD', 'Lương NET'),
    excel('TONG_THU_NHAP', 'Tổng thu nhập', 'LUONG_CO_BAN_THANG*WORKING_POINT/STANDARD_WORKING_POINT+TONG_TIEN_TANG_CA'),
    ind('CONG_DOAN_DN', 'Công đoàn doanh nghiệp', 'Nhập tay', '', money),
    ind('CONG_DOAN_NLD', 'Công đoàn người lao động', 'Nhập tay', '', money),
    ind('TIEN_TU_THIEN', 'Tiền từ thiện', 'Nhập tay', '', money),
    ind('LUONG_CO_BAN_THANG', 'Lương cơ bản tháng', 'Nhập tay', '', money),
    excel('KHAU_TRU_THUE', 'Khấu trừ thuế TNCN', 'TAX5(THU_NHAP_TINH_THUE)', '5 bậc tháng: 5%, 10%, 20%, 30%, 35%.'),
    excel('THU_NHAP_TINH_THUE', 'Thu nhập tính thuế', 'MAX(0,TONG_THU_NHAP-BHXH_NLD-BHYT_NLD-BHTN_NLD-THU_NHAP_MIEN_THUE-11000000-4400000*NUMBER_OF_DEPENDENT_PERSONS)', 'Giảm trừ 11.000.000 và 4.400.000 mỗi người phụ thuộc.'),
    excel('THU_NHAP_CHIU_THUE', 'Thu nhập chịu thuế', 'THU_NHAP_TINH_THUE'),
    excel('BH_TNLD_BNN_DN', 'Bảo hiểm TNLĐ-BNN công ty đóng 0.5%', 'INSURANCE_RATE*BH_TNLD_BNN_DN_RATE%'),
    excel('BH_TNLD_BNN_NLD', 'Bảo hiểm TNLĐ-BNN NLĐ 0%', 'INSURANCE_RATE*BH_TNLD_BNN_NLD_RATE%'),
    excel('BHXH_NLD', 'BHXH người lao động 8%', 'INSURANCE_RATE*BHXH_NLD_RATE%'),
    excel('BHYT_NLD', 'BHYT người lao động 1,5%', 'INSURANCE_RATE*BHYT_NLD_RATE%'),
    excel('BHTN_NLD', 'BHTN người lao động 1%', 'INSURANCE_RATE*BHTN_NLD_RATE%'),
    excel('BHXH_DN', 'BHXH công ty 17,5%', 'INSURANCE_RATE*BHXH_DN_RATE%'),
    excel('BHYT_DN', 'BHYT công ty 3%', 'INSURANCE_RATE*BHYT_DN_RATE%'),
    excel('BHTN_DN', 'BHTN công ty 1%', 'INSURANCE_RATE*BHTN_DN_RATE%'),
    ind('BHXH_NLD_RATE', 'Tỷ lệ BHXH NLĐ', 'Nhập tay', '', num, '8'),
    ind('BHYT_NLD_RATE', 'Tỷ lệ BHYT NLĐ', 'Nhập tay', '', num, '1.5'),
    ind('BHTN_NLD_RATE', 'Tỷ lệ BHTN NLĐ', 'Nhập tay', '', num, '1'),
    ind('BHXH_DN_RATE', 'Tỷ lệ BHXH công ty', 'Nhập tay', '', num, '17.5'),
    ind('BHYT_DN_RATE', 'Tỷ lệ BHYT công ty', 'Nhập tay', '', num, '3'),
    ind('BHTN_DN_RATE', 'Tỷ lệ BHTN công ty', 'Nhập tay', '', num, '1'),
    ind('BH_TNLD_BNN_DN_RATE', 'Tỷ lệ TNLĐ-BNN công ty', 'Nhập tay', '', num, '0.5'),
    ind('BH_TNLD_BNN_NLD_RATE', 'Tỷ lệ TNLĐ-BNN NLĐ', 'Nhập tay', '', num, '0'),
    ind('STANDARD_WORKING_POINT', 'Công chuẩn'),
    ind('REAL_WORKING_POINT', 'Công thực tế'),
    ind('WORKING_POINT', 'Công tính lương'),
    ind('WORKING_HOURS', 'Số giờ làm việc'),
    ind('OT_HOURS', 'Giờ tăng ca'),
    ind('LEAVE_UNPAID', 'Nghỉ không lương'),
    ind('MINUTES_LATE', 'Số phút đi muộn'),
    ind('MINUTES_LEAVE_EARLY', 'Số phút về sớm'),
    ind('HOLIDAY', 'Ngày nghỉ lễ'),
    ind('WORK_FROM_HOME', 'Ngày làm việc tại nhà'),
    ind('ON_BUSINESS', 'Ngày công tác'),
    ind('LEAVE', 'Ngày nghỉ phép'),
    ind('NIGHT_WORKING_POINT', 'Công đêm'),
    ind('PAID_LEAVE', 'Nghỉ hưởng lương'),
    ind('ABSENT_DAYS', 'Ngày vắng'),
    ind('LATE_TIMES', 'Số lần đi muộn'),
    ind('EARLY_TIMES', 'Số lần về sớm'),
    ind('MEAL_DAYS', 'Ngày ăn ca'),
    ind('STANDARD_WORKING_HOURS', 'Giờ chuẩn'),
    ind('ACTUAL_WORKING_HOURS', 'Giờ thực tế'),
    ind('WORKING_POINT_PREV', 'Công kỳ trước'),
    ind('WORKING_POINT_CURR', 'Công kỳ này'),
    ind('OT_HOURS_CURR', 'Giờ tăng ca kỳ này'),
    ind('OT_HOURS_PREV', 'Giờ tăng ca kỳ trước'),
    ind('NIGHT_HOURS', 'Giờ làm đêm'),
    ind('WFH_HOURS', 'Giờ làm việc tại nhà'),
    ind('BUSINESS_HOURS', 'Giờ công tác'),
    ind('UNPAID_LEAVE_HOURS', 'Giờ nghỉ không lương'),
    ind('PRODUCT_PRICE', 'Đơn giá sản phẩm', 'Nhập tay', '', money),
    ind('DISCIPLINE', 'Kỷ luật', 'Nhập tay', '', money),
    ind('REWARD', 'Khen thưởng', 'Nhập tay', '', money),
    ind('EVALUATION_FINAL_SCORE', 'Điểm đánh giá'),
    ind('CURRENT_BALANCE', 'Số dư phép'),
    ind('GIAM_TRU_BAN_THAN', 'Giảm trừ bản thân', 'Nhập tay', '', money, '11.000.000'),
    ind('GIAM_TRU_NGUOI_PHU_THUOC', 'Giảm trừ người phụ thuộc', 'Nhập tay', '', money, '4.400.000'),
  ];
  for (const base of OT_BASES) {
    rows.push(ind(base + '_HOURS', base + ' giờ'));
    rows.push(ind(base + '_HOURS_CURR', base + ' giờ kỳ này'));
    rows.push(ind(base + '_HOURS_PREV', base + ' giờ kỳ trước'));
  }
  for (const code of ['SO_TAI_KHOAN', 'NGAN_HANG', 'CHI_NHANH', 'MA_SO_THUE', 'KY_LUONG', 'TU_NGAY', 'DEN_NGAY', 'TEN_BANG', 'LOAI_BANG']) {
    rows.push(ind('PAYROLL_INFO__' + code, 'Thông tin bảng lương ' + code, 'Nhập tay', '', text));
  }
  for (const [code, name] of [['DOANH_SO', 'Doanh số'], ['KPI', 'KPI']] as const) {
    rows.push(ind(`CRITERION__${code}__RESULT`, name + ' kết quả'));
    rows.push(ind(`CRITERION__${code}__ACTUAL`, name + ' thực đạt'));
    rows.push(ind(`CRITERION__${code}__TARGET`, name + ' mục tiêu'));
  }
  for (const [code, name] of [['LUONG_CO_BAN', 'Lương cơ bản'], ['PHU_CAP_AN_TRUA', 'Phụ cấp ăn trưa'], ['PHU_CAP_DI_LAI', 'Phụ cấp đi lại'], ['PHU_CAP_DIEN_THOAI', 'Phụ cấp điện thoại'], ['PHU_CAP_NHA_O', 'Phụ cấp nhà ở']] as const) {
    rows.push(ind('INCOME__' + code, name, 'Nhập tay', '', money));
    rows.push(ind('INCOME__' + code + '__PREV', name + ' kỳ trước', 'Nhập tay', '', money));
    rows.push(ind('INCOME__' + code + '__PREV_MONTH', name + ' tháng trước', 'Nhập tay', '', money));
  }
  const unique = new Map<string, Indicator>();
  rows.forEach(row => unique.set(row.code, row));
  return [...unique.values()];
}

export const INDICATORS = buildIndicators();

export const MAIN_TEMPLATE_CODES = [
  'EMPLOYEE_CODE', 'FULL_NAME', 'GROUP_NAME', 'POSITION_NAME', 'NUMBER_OF_DEPENDENT_PERSONS',
  'LUONG_CO_BAN_THANG', 'STANDARD_WORKING_POINT', 'WORKING_POINT', 'OT_HOURS', 'LEAVE', 'LEAVE_UNPAID',
  'INSURANCE_RATE', 'BHXH_NLD_RATE', 'BHYT_NLD_RATE', 'BHTN_NLD_RATE', 'BHXH_DN_RATE', 'BHYT_DN_RATE', 'BHTN_DN_RATE', 'BH_TNLD_BNN_DN_RATE', 'BH_TNLD_BNN_NLD_RATE',
  'PHU_CAP_AN_CA', 'TONG_TIEN_TANG_CA', 'THU_NHAP_MIEN_THUE', 'TONG_THU_NHAP',
  'BHXH_NLD', 'BHYT_NLD', 'BHTN_NLD', 'BHXH_DN', 'BHYT_DN', 'BHTN_DN', 'BH_TNLD_BNN_DN', 'BH_TNLD_BNN_NLD',
  'CONG_DOAN_NLD', 'CONG_DOAN_DN', 'TIEN_TU_THIEN', 'THU_NHAP_TINH_THUE', 'KHAU_TRU_THUE', 'THUC_NHAN',
];

export function componentFrom(indicator: Indicator): PayrollComponent {
  return {
    code: indicator.code,
    name: indicator.name,
    value: indicator.defaultValue,
    format: indicator.format,
    kind: indicator.kind,
    formula: indicator.formula,
    showOnSlip: ['FULL_NAME', 'LUONG_CO_BAN_THANG', 'WORKING_POINT', 'TONG_THU_NHAP', 'BHXH_NLD', 'BHYT_NLD', 'BHTN_NLD', 'KHAU_TRU_THUE', 'THUC_NHAN'].includes(indicator.code),
  };
}

export function mainTemplateComponents(indicators = INDICATORS): PayrollComponent[] {
  return MAIN_TEMPLATE_CODES.map(code => indicators.find(item => item.code === code)).filter((item): item is Indicator => Boolean(item)).map(componentFrom);
}

export interface CostCategorySeed {
  group: string;
  code: string;
  name: string;
  info: string;
}

export const COST_CATEGORIES: CostCategorySeed[] = [
  { group: 'BHXH người lao động đóng', code: 'INSURANCE_RATE', name: 'Mức đóng bảo hiểm', info: 'Mức đóng bảo hiểm' },
  { group: 'BHXH người lao động đóng', code: 'BHXH_NLD', name: 'BHXH NLĐ', info: '8%' },
  { group: 'BHXH người lao động đóng', code: 'BHYT_NLD', name: 'BHYT NLĐ', info: '1,5%' },
  { group: 'BHXH người lao động đóng', code: 'BHTN_NLD', name: 'BHTN NLĐ', info: '1%' },
  { group: 'BHXH công ty đóng', code: 'BHXH_DN', name: 'BHXH công ty', info: '17.5%' },
  { group: 'BHXH công ty đóng', code: 'BHYT_DN', name: 'BHYT công ty', info: '3%' },
  { group: 'BHXH công ty đóng', code: 'BHTN_DN', name: 'BHTN công ty', info: '1%' },
  { group: 'Thuế', code: 'THU_NHAP_CHIU_THUE', name: 'Thu nhập chịu thuế', info: '' },
  { group: 'Thuế', code: 'THU_NHAP_TINH_THUE', name: 'Thu nhập tính thuế', info: '' },
  { group: 'Thuế', code: 'KHAU_TRU_THUE', name: 'Khấu trừ thuế', info: '' },
  { group: 'Tiền từ thiện', code: 'TIEN_TU_THIEN', name: 'Tiền từ thiện', info: '' },
  { group: 'Công đoàn', code: 'CONG_DOAN_NLD', name: 'Công đoàn NLĐ', info: '' },
  { group: 'Công đoàn', code: 'CONG_DOAN_DN', name: 'Công đoàn doanh nghiệp', info: '' },
  { group: 'Tổng thu nhập', code: 'TONG_THU_NHAP', name: 'Tổng thu nhập', info: '' },
  { group: 'Thực nhận', code: 'THUC_NHAN', name: 'Thực nhận', info: 'Lương NET' },
];

export const TAX_ROWS_V2 = [
  ['1', 'Đến 120', 'Đến 10', '5'],
  ['2', 'Trên 120 đến 360', 'Trên 10 đến 30', '10'],
  ['3', 'Trên 360 đến 720', 'Trên 30 đến 60', '20'],
  ['4', 'Trên 720 đến 1200', 'Trên 60 đến 100', '30'],
  ['5', 'Trên 1200', 'Trên 100', '35'],
];

export const TAX_ROWS_V1 = [
  ['Đến 60.000.000', 'Đến 5.000.000', '5'],
  ['Trên 60.000.000 đến 120.000.000', 'Trên 5.000.000 đến 10.000.000', '10'],
  ['Trên 120.000.000 đến 216.000.000', 'Trên 10.000.000 đến 18.000.000', '15'],
  ['Trên 216.000.000 đến 384.000.000', 'Trên 18.000.000 đến 32.000.000', '20'],
  ['Trên 384.000.000 đến 624.000.000', 'Trên 32.000.000 đến 52.000.000', '25'],
  ['Trên 624.000.000 đến 960.000.000', 'Trên 52.000.000 đến 80.000.000', '30'],
  ['Trên 960.000.000', 'Trên 80.000.000', '35'],
];

export const PAYROLL_TYPES = ['Bảng lương chính', 'Bảng sản phẩm', 'Bảng lương KPI', 'Bảng khen thưởng - kỷ luật', 'Bảng điều chỉnh thu nhập', 'Bảng lương tạm ứng', 'Bảng lương khác', 'Bảng dữ liệu gốc'] as const;

export const LIST_TYPES = PAYROLL_TYPES.filter(item => item !== 'Bảng dữ liệu gốc');
