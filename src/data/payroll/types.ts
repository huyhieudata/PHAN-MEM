export type FormulaKind = 'Nhập tay' | 'Công thức Excel' | 'Ngôn ngữ Happy Time' | 'Ngôn ngữ Expression';
export type ValueFormat = 'Văn bản' | 'Số' | 'Tiền tệ (VND)' | 'Ngày';
export type PayrollType = 'Bảng lương chính' | 'Bảng sản phẩm' | 'Bảng lương KPI' | 'Bảng khen thưởng - kỷ luật' | 'Bảng điều chỉnh thu nhập' | 'Bảng lương tạm ứng' | 'Bảng lương khác' | 'Bảng dữ liệu gốc';
export type PayrollStatus = 'Nháp' | 'Đã khóa' | 'Đã gửi phiếu';

export interface Indicator {
  code: string;
  name: string;
  kind: FormulaKind;
  formula: string;
  format: ValueFormat;
  defaultValue: string;
  description: string;
}

export interface PayrollComponent {
  code: string;
  name: string;
  value: string;
  format: ValueFormat;
  kind: FormulaKind;
  formula: string;
  showOnSlip: boolean;
}

export interface PayrollLine {
  employeeId: string;
  values: Record<string, string | number>;
}

export interface PayrollDoc {
  id: string;
  name: string;
  type: PayrollType;
  period: string;
  timeMode: 'month' | 'custom';
  rangeLabel: string;
  unitIds: string[];
  positionIds: string[];
  employeeIds: string[];
  feedbackTo: string[];
  feedbackDays: number;
  components: PayrollComponent[];
  status: PayrollStatus;
  lines: PayrollLine[];
  linkedId: string;
  createdAt: string;
}

export interface PayrollTemplate {
  id: string;
  name: string;
  code: string;
  type: PayrollType;
  description: string;
  unitIds: string[];
  positionIds: string[];
  employeeIds: string[];
  components: PayrollComponent[];
}

export interface ExportTemplate {
  id: string;
  name: string;
  groups: { name: string; codes: string[] }[];
}

export interface CostEntry {
  id: string;
  costCenter: string;
  employeeId: string;
  category: string;
  group: string;
  amount: number;
  source: 'Bảng lương' | 'Nhập tay' | 'Import';
  payrollName: string;
  note: string;
  period: string;
}

export interface ProductRow { id: string; name: string; code: string; price: number }
export interface CostCenterRow { id: string; name: string; code: string; status: string }
export interface CostAssignRow { id: string; target: string; costCenter: string; rate: number; from: string; to: string; status: string }

export interface TableSettings {
  working: boolean;
  resignedInPeriod: boolean;
  maternity: boolean;
}

export interface V1Settings {
  reopenOn: boolean;
  reopenDays: number;
  feedbackMode: 'Không thời hạn' | 'Ngày cuối cùng của tháng' | 'Tùy chọn ngày cố định mỗi tháng';
  feedbackEmployee: string;
}

export interface PayrollState {
  indicators: Indicator[];
  templates: PayrollTemplate[];
  payrolls: PayrollDoc[];
  exports: ExportTemplate[];
  products: ProductRow[];
  costCenters: CostCenterRow[];
  assignments: CostAssignRow[];
  reportTemplates: { id: string; name: string; count: number; status: string }[];
  entries: CostEntry[];
  table: TableSettings;
  v1: V1Settings;
}
