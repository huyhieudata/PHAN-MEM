import type { Contract, Employee, HrState } from './types';
import { contractPhase, findName } from './derive';
import { fmtDate } from './text';

export const EMPLOYEE_HEADERS = [
  'Mã nhân viên',
  'Họ và tên',
  'Giới tính',
  'Ngày sinh',
  'Số điện thoại',
  'Email',
  'Số CCCD',
  'Đơn vị',
  'Vị trí',
  'Chi nhánh',
  'Ngày vào làm',
  'Loại hình',
  'Trạng thái',
  'Mã BHXH',
] as const;

function esc(value: string): string {
  if (/[",\n\r;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map(r => r.map(c => esc(c ?? '')).join(','));
  return '\uFEFF' + lines.join('\r\n');
}

/** Đọc CSV dấu phẩy hoặc chấm phẩy, có ngoặc kép. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!src.trim()) return [];
  const first = src.split('\n')[0] ?? '';
  const comma = (first.match(/,/g) || []).length;
  const semi = (first.match(/;/g) || []).length;
  const delim = semi > comma ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delim) { row.push(cell.trim()); cell = ''; continue; }
    if (ch === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter(r => r.some(c => c !== ''));
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function employeesToCsv(rows: Employee[], state: HrState): string {
  const body = rows.map(e => [
    e.code,
    e.fullName,
    e.gender,
    e.dob,
    e.phone,
    e.email,
    e.idNumber,
    findName(state.units, e.unitId),
    findName(state.positions, e.positionId),
    findName(state.branches, e.branchId),
    e.startDate,
    e.employmentType,
    e.status,
    e.siNumber,
  ]);
  return toCsv([...EMPLOYEE_HEADERS], body);
}

export function employeeTemplateCsv(): string {
  return toCsv([...EMPLOYEE_HEADERS], [[
    '',
    'Nguyễn Thị Mẫu',
    'Nữ',
    '1995-01-01',
    '0900 000 099',
    'mau.nt@vi-du.hrm.local',
    '000000000099',
    'Phòng Nhân sự',
    'Chuyên viên Nhân sự',
    'CN Hà Nội',
    '2026-01-06',
    'Thử việc',
    'Đang làm việc',
    '0000000099',
  ]]);
}

export function contractsToCsv(rows: Contract[], state: HrState): string {
  const headers = ['Mã hợp đồng', 'Nhân sự', 'Mã nhân viên', 'Loại', 'Ngày hiệu lực', 'Ngày hết hạn', 'Lương', 'Trạng thái', 'Ghi chú'];
  const body = rows.map(c => {
    const emp = state.employees.find(e => e.id === c.employeeId);
    return [c.code, emp?.fullName ?? '', emp?.code ?? '', c.type, fmtDate(c.startDate), c.endDate ? fmtDate(c.endDate) : '', String(c.salary), contractPhase(c).label, c.note];
  });
  return toCsv(headers, body);
}
