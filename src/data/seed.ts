import type {
  Branch, Certificate, Contract, Decision, Dependent, Employee, HeadcountPlan,
  HrState, OrgLevel, OrgUnit, Position, Reward,
} from './types';
import { addDaysISO, mailLocal, todayISO } from './text';
import { buildTimeoffSeed } from './timeoffSeed';

/**
 * Dữ liệu hư cấu cho công ty demo. Số điện thoại 0900 000 0xx, CCCD 0000000000xx,
 * email @vi-du.hrm.local — không phải thông tin của người thật.
 */
export function buildSeed(now = new Date()): HrState {
  const today = todayISO(now);
  const branches: Branch[] = [
    { id: 'br-hn', code: 'HN', name: 'CN Hà Nội', address: 'Số 1 Phố Mẫu, Quận Demo, Hà Nội', phone: '024 0000 0001', status: 'Hoạt động' },
    { id: 'br-hcm', code: 'HCM', name: 'CN TP. Hồ Chí Minh', address: 'Số 8 Đường Mẫu, Quận Demo, TP. Hồ Chí Minh', phone: '028 0000 0002', status: 'Hoạt động' },
    { id: 'br-dn', code: 'DN', name: 'CN Đà Nẵng', address: 'Số 3 Đường Mẫu, Quận Demo, Đà Nẵng', phone: '0236 000 0003', status: 'Hoạt động' },
  ];
  const levels: OrgLevel[] = [
    { id: 'lv-1', name: 'Công ty', rank: 1 },
    { id: 'lv-2', name: 'Khối', rank: 2 },
    { id: 'lv-3', name: 'Phòng ban', rank: 3 },
    { id: 'lv-4', name: 'Tổ / nhóm', rank: 4 },
  ];
  const positions: Position[] = [
    ['pos-gd', 'GD', 'Giám đốc điều hành', 'Điều hành chung công ty demo'],
    ['pos-tpns', 'TPNS', 'Trưởng phòng Nhân sự', 'Quản lý phòng nhân sự'],
    ['pos-cvns', 'CVNS', 'Chuyên viên Nhân sự', 'C&B, hồ sơ, hợp đồng'],
    ['pos-tphc', 'TPHC', 'Trưởng phòng Hành chính', 'Hành chính văn phòng'],
    ['pos-tx', 'TX', 'Tài xế', 'Đưa đón và công tác'],
    ['pos-cvpc', 'CVPC', 'Chuyên viên Pháp chế', 'Hợp đồng và nội quy'],
    ['pos-tpkd', 'TPKD', 'Trưởng phòng Kinh doanh', 'Quản lý doanh số'],
    ['pos-nvkd', 'NVKD', 'Nhân viên Kinh doanh', 'Chăm sóc khách hàng demo'],
    ['pos-mkt', 'MKT', 'Chuyên viên Marketing', 'Truyền thông nội bộ demo'],
    ['pos-cskh', 'CSKH', 'Nhân viên CSKH', 'Tổng đài mẫu'],
    ['pos-kt', 'KTT', 'Kế toán tổng hợp', 'Sổ sách demo'],
    ['pos-ltv', 'LTV', 'Lập trình viên', 'Phát triển sản phẩm mẫu'],
    ['pos-it', 'IT', 'Nhân viên IT', 'Hỗ trợ máy trạm'],
    ['pos-tk', 'TK', 'Thủ kho', 'Xuất nhập kho mẫu'],
    ['pos-ks', 'KS', 'Kỹ sư xây dựng', 'Hồ sơ công trình demo'],
    ['pos-gs', 'GS', 'Giám sát công trình', 'Hiện trường demo'],
    ['pos-ds', 'DS', 'Dược sĩ', 'Hồ sơ chất lượng mẫu'],
  ].map(([id, code, name, description]) => ({ id, code, name, description, status: 'Hoạt động' as const }));

  const unitRows: [string, string, string, string | null, string, string, string | null][] = [
    ['un-cty', 'CTY', 'Công ty Demo HRM Hub', null, 'lv-1', 'br-hn', 'emp-17'],
    ['un-vp', 'KVP', 'Khối Văn phòng', 'un-cty', 'lv-2', 'br-hn', 'emp-07'],
    ['un-kd', 'KKD', 'Khối Kinh doanh', 'un-cty', 'lv-2', 'br-hn', 'emp-01'],
    ['un-tc', 'KTC', 'Khối Tài chính', 'un-cty', 'lv-2', 'br-hn', 'emp-03'],
    ['un-cn', 'KCN', 'Khối Công nghệ', 'un-cty', 'lv-2', 'br-hn', 'emp-06'],
    ['un-vh', 'KVH', 'Khối Vận hành', 'un-cty', 'lv-2', 'br-dn', 'emp-10'],
    ['un-ns', 'PNS', 'Phòng Nhân sự', 'un-vp', 'lv-3', 'br-hn', 'emp-07'],
    ['un-hc', 'PHC', 'Phòng Hành chính', 'un-vp', 'lv-3', 'br-hn', 'emp-18'],
    ['un-pc', 'PPC', 'Phòng Pháp chế', 'un-vp', 'lv-3', 'br-hn', 'emp-15'],
    ['un-pkd', 'PKD', 'Phòng Kinh doanh', 'un-kd', 'lv-3', 'br-hn', 'emp-01'],
    ['un-kdh', 'PKD-HCM', 'Phòng Kinh doanh HCM', 'un-kd', 'lv-3', 'br-hcm', 'emp-01'],
    ['un-kdd', 'PKD-DN', 'Phòng Kinh doanh Đà Nẵng', 'un-kd', 'lv-3', 'br-dn', 'emp-01'],
    ['un-mkt', 'PMKT', 'Phòng Marketing', 'un-kd', 'lv-3', 'br-hcm', 'emp-05'],
    ['un-cskh', 'PCSKH', 'Phòng CSKH', 'un-kd', 'lv-3', 'br-hcm', 'emp-09'],
    ['un-kt', 'PKT', 'Phòng Kế toán', 'un-tc', 'lv-3', 'br-hn', 'emp-03'],
    ['un-it', 'PCN', 'Phòng Công nghệ', 'un-cn', 'lv-3', 'br-hn', 'emp-06'],
    ['un-kho', 'KHO', 'Kho vận', 'un-vh', 'lv-3', 'br-dn', 'emp-08'],
    ['un-da', 'BDA', 'Ban Dự án', 'un-vh', 'lv-3', 'br-dn', 'emp-10'],
    ['un-cl', 'PCL', 'Phòng Chất lượng', 'un-vh', 'lv-3', 'br-hn', 'emp-11'],
    ['un-to', 'TO-MB', 'Tổ bán hàng miền Bắc', 'un-pkd', 'lv-4', 'br-hn', 'emp-01'],
  ];
  const units: OrgUnit[] = unitRows.map(([id, code, name, parentId, levelId, branchId, managerId]) => ({
    id, code, name, parentId, levelId, branchId, managerId, status: 'Hoạt động',
  }));

  type Person = {
    id: string; name: string; gender: Employee['gender']; dob: string;
    unit: string; pos: string; branch: string; start: string;
    type: Employee['employmentType']; status: Employee['status'];
    manager?: string; resign?: string; marital?: Employee['marital'];
  };
  const people: Person[] = [
    { id: 'emp-17', name: 'Hà Minh Khôi', gender: 'Nam', dob: '1984-02-02', unit: 'un-cty', pos: 'pos-gd', branch: 'br-hn', start: '2016-01-04', type: 'Chính thức', status: 'Đang làm việc', marital: 'Đã kết hôn' },
    { id: 'emp-01', name: 'Nguyễn Văn An', gender: 'Nam', dob: '1990-03-12', unit: 'un-pkd', pos: 'pos-tpkd', branch: 'br-hn', start: '2019-03-01', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17', marital: 'Đã kết hôn' },
    { id: 'emp-02', name: 'Trần Thị Bích', gender: 'Nữ', dob: '1996-07-21', unit: 'un-ns', pos: 'pos-cvns', branch: 'br-hn', start: '2020-07-15', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-07' },
    { id: 'emp-03', name: 'Lê Hoàng Cường', gender: 'Nam', dob: '1988-11-02', unit: 'un-kt', pos: 'pos-kt', branch: 'br-hn', start: '2018-11-20', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17', marital: 'Đã kết hôn' },
    { id: 'emp-04', name: 'Phạm Minh Đức', gender: 'Nam', dob: '1999-02-06', unit: 'un-kdh', pos: 'pos-nvkd', branch: 'br-hcm', start: '2023-02-06', type: 'Thử việc', status: 'Đang làm việc', manager: 'emp-01' },
    { id: 'emp-05', name: 'Hoàng Thu Hà', gender: 'Nữ', dob: '1994-09-09', unit: 'un-mkt', pos: 'pos-mkt', branch: 'br-hcm', start: '2021-09-01', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-01' },
    { id: 'emp-06', name: 'Vũ Quang Huy', gender: 'Nam', dob: '1995-04-18', unit: 'un-it', pos: 'pos-ltv', branch: 'br-hn', start: '2022-04-11', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17' },
    { id: 'emp-07', name: 'Đặng Thị Lan', gender: 'Nữ', dob: '1986-06-19', unit: 'un-ns', pos: 'pos-tpns', branch: 'br-hn', start: '2017-06-19', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17', marital: 'Đã kết hôn' },
    { id: 'emp-08', name: 'Bùi Văn Long', gender: 'Nam', dob: '1991-01-02', unit: 'un-kho', pos: 'pos-tk', branch: 'br-dn', start: '2020-01-02', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-10' },
    { id: 'emp-09', name: 'Đỗ Thị Mai', gender: 'Nữ', dob: '2000-08-12', unit: 'un-cskh', pos: 'pos-cskh', branch: 'br-hcm', start: '2024-08-12', type: 'Thử việc', status: 'Đang làm việc', manager: 'emp-05' },
    { id: 'emp-10', name: 'Ngô Đức Nam', gender: 'Nam', dob: '1989-10-07', unit: 'un-da', pos: 'pos-ks', branch: 'br-dn', start: '2019-10-07', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17' },
    { id: 'emp-11', name: 'Dương Thị Oanh', gender: 'Nữ', dob: '1993-03-22', unit: 'un-cl', pos: 'pos-ds', branch: 'br-hn', start: '2021-03-22', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-10' },
    { id: 'emp-12', name: 'Lý Văn Phúc', gender: 'Nam', dob: '1985-05-16', unit: 'un-hc', pos: 'pos-tx', branch: 'br-hn', start: '2016-05-16', type: 'Chính thức', status: 'Đã nghỉ việc', manager: 'emp-18', resign: '2025-12-01' },
    { id: 'emp-13', name: 'Mai Thanh Quý', gender: 'Nữ', dob: '2003-01-06', unit: 'un-kdd', pos: 'pos-nvkd', branch: 'br-dn', start: '2025-01-06', type: 'Thực tập', status: 'Đang làm việc', manager: 'emp-01' },
    { id: 'emp-14', name: 'Trịnh Hồng Sơn', gender: 'Nam', dob: '1987-08-27', unit: 'un-da', pos: 'pos-gs', branch: 'br-hcm', start: '2018-08-27', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-10' },
    { id: 'emp-15', name: 'Phan Ngọc Trâm', gender: 'Nữ', dob: '1992-12-01', unit: 'un-pc', pos: 'pos-cvpc', branch: 'br-hn', start: '2022-12-01', type: 'Chính thức', status: 'Tạm nghỉ', manager: 'emp-07' },
    { id: 'emp-16', name: 'Cao Minh Tuấn', gender: 'Nam', dob: '1998-06-19', unit: 'un-it', pos: 'pos-it', branch: 'br-hcm', start: '2023-06-19', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-06' },
    { id: 'emp-18', name: 'Ngô Thanh Tâm', gender: 'Nữ', dob: '1990-05-20', unit: 'un-hc', pos: 'pos-tphc', branch: 'br-hn', start: '2019-05-20', type: 'Chính thức', status: 'Đang làm việc', manager: 'emp-17' },
  ];

  const employees: Employee[] = people.map(p => {
    const n = p.id.replace(/\D/g, '').padStart(2, '0');
    const addr = p.branch === 'br-hcm' ? 'Phường Mẫu, Quận Demo, TP. Hồ Chí Minh' : p.branch === 'br-dn' ? 'Phường Mẫu, Quận Demo, Đà Nẵng' : 'Phường Mẫu, Quận Demo, Hà Nội';
    return {
      id: p.id,
      code: `NV00${n}`,
      fullName: p.name,
      gender: p.gender,
      dob: p.dob,
      phone: `0900 000 0${n}`,
      email: `${mailLocal(p.name)}@vi-du.hrm.local`,
      personalEmail: '',
      idNumber: `0000000000${n}`.slice(-12),
      idIssueDate: '2021-01-15',
      idIssuePlace: 'Cục Cảnh sát demo',
      nationality: 'Việt Nam',
      ethnicity: 'Kinh',
      religion: 'Không',
      marital: p.marital ?? 'Độc thân',
      address: addr,
      hometown: addr,
      bankName: 'Ngân hàng Demo',
      bankAccount: `970400000000${n}`,
      taxCode: `80000000${n}`,
      branchId: p.branch,
      unitId: p.unit,
      positionId: p.pos,
      managerId: p.manager ?? null,
      startDate: p.start,
      officialDate: p.type === 'Chính thức' ? addMonths(p.start, 2) : '',
      resignDate: p.resign ?? '',
      employmentType: p.type,
      status: p.status,
      note: '',
      siNumber: `79000000${n}`,
      siStart: p.start,
      hiNumber: `DN000000${n}`,
      hospital: 'Bệnh viện Demo',
    };
  });

  const plus = (days: number) => addDaysISO(today, days);
  const contracts: Contract[] = [
    hd('hd-17', 'HD0017', 'emp-17', 'Không xác định thời hạn', '2016-01-04', '', '2016-01-04', 45000000, 'Hiệu lực'),
    hd('hd-01', 'HD0001', 'emp-01', 'Xác định thời hạn', '2024-03-01', plus(200), '2024-02-20', 32000000, 'Hiệu lực'),
    hd('hd-02', 'HD0002', 'emp-02', 'Xác định thời hạn', '2024-07-15', plus(260), '2024-07-01', 16000000, 'Hiệu lực'),
    hd('hd-03', 'HD0003', 'emp-03', 'Không xác định thời hạn', '2020-11-20', '', '2020-11-15', 22000000, 'Hiệu lực'),
    hd('hd-04', 'HD0004', 'emp-04', 'Thử việc', '2026-08-01', plus(12), '2026-07-28', 11000000, 'Hiệu lực', 'Hết hạn thử việc trong tháng này'),
    hd('hd-05', 'HD0005', 'emp-05', 'Xác định thời hạn', '2024-09-01', plus(140), '2024-08-20', 18000000, 'Hiệu lực'),
    hd('hd-06', 'HD0006', 'emp-06', 'Xác định thời hạn', plus(7), plus(370), '', 19000000, 'Chờ ký', 'Gia hạn chờ ký'),
    hd('hd-07', 'HD0007', 'emp-07', 'Không xác định thời hạn', '2019-06-19', '', '2019-06-10', 30000000, 'Hiệu lực'),
    hd('hd-08', 'HD0008', 'emp-08', 'Xác định thời hạn', '2024-01-02', plus(-6), '2023-12-20', 12000000, 'Hiệu lực', 'Đã quá ngày kết thúc, cần gia hạn hoặc thanh lý'),
    hd('hd-09', 'HD0009', 'emp-09', 'Thử việc', '2026-09-01', plus(20), '2026-08-25', 9000000, 'Hiệu lực'),
    hd('hd-10', 'HD0010', 'emp-10', 'Xác định thời hạn', '2023-10-07', plus(320), '2023-10-01', 24000000, 'Hiệu lực'),
    hd('hd-11', 'HD0011', 'emp-11', 'Xác định thời hạn', '2024-03-22', plus(180), '2024-03-15', 18000000, 'Hiệu lực'),
    hd('hd-12', 'HD0012', 'emp-12', 'Xác định thời hạn', '2022-05-16', '2025-12-01', '2022-05-10', 11000000, 'Thanh lý', 'Thanh lý khi nghỉ việc'),
    hd('hd-13', 'HD0013', 'emp-13', 'Thực tập', '2025-01-06', plus(18), '2025-01-02', 5000000, 'Hiệu lực'),
    hd('hd-14', 'HD0014', 'emp-14', 'Xác định thời hạn', '2024-08-27', plus(90), '2024-08-20', 20000000, 'Hiệu lực'),
    hd('hd-15', 'HD0015', 'emp-15', 'Xác định thời hạn', '2024-12-01', plus(400), '2024-11-20', 17000000, 'Hiệu lực', 'Tạm nghỉ thai sản'),
    hd('hd-16', 'HD0016', 'emp-16', 'Xác định thời hạn', '2023-06-19', plus(220), '2023-06-15', 15000000, 'Hiệu lực'),
    hd('hd-18', 'HD0018', 'emp-18', 'Không xác định thời hạn', '2021-05-20', '', '2021-05-15', 24000000, 'Hiệu lực'),
  ];

  const dependents: Dependent[] = [
    dep('dep-01', 'emp-01', 'Nguyễn Thị Mẫu An', 'Vợ/chồng', '1992-04-04', '000000000101', true, '2020-01-01', ''),
    dep('dep-02', 'emp-01', 'Nguyễn Minh Mẫu', 'Con', '2018-06-01', '', true, '2018-06-01', ''),
    dep('dep-03', 'emp-03', 'Lê Bảo Mẫu', 'Con', '2016-09-09', '', true, '2016-09-09', ''),
    dep('dep-04', 'emp-07', 'Đặng Thị Mẫu', 'Mẹ', '1960-01-20', '000000000102', true, '2017-06-19', ''),
    dep('dep-05', 'emp-17', 'Phạm Thu Mẫu', 'Vợ/chồng', '1986-08-08', '000000000103', true, '2016-01-04', ''),
  ];

  const certificates: Certificate[] = [
    cert('cer-01', 'emp-06', 'Chứng chỉ lập trình demo', 'Học viện Mẫu', 'CC-0001', '2023-05-01', '2027-05-01', 'Chuyên môn'),
    cert('cer-02', 'emp-03', 'Chứng chỉ kế toán viên demo', 'Hội Kế toán Mẫu', 'KT-0002', '2019-08-01', '', 'Hành nghề'),
    cert('cer-03', 'emp-11', 'Chứng chỉ hành nghề dược demo', 'Sở Y tế Mẫu', 'DS-0003', '2022-01-10', plus(25), 'Hành nghề'),
    cert('cer-04', 'emp-10', 'An toàn lao động demo', 'Trung tâm Mẫu', 'AT-0004', '2024-03-03', '2027-03-03', 'An toàn'),
    cert('cer-05', 'emp-02', 'Nghiệp vụ nhân sự demo', 'HRM Academy Mẫu', 'HR-0005', '2021-11-11', '', 'Chuyên môn'),
  ];

  const headcounts: HeadcountPlan[] = [
    hc('hc-01', 'un-pkd', 'pos-tpkd', 1),
    hc('hc-02', 'un-kdh', 'pos-nvkd', 3),
    hc('hc-03', 'un-kdd', 'pos-nvkd', 2),
    hc('hc-04', 'un-ns', 'pos-cvns', 2),
    hc('hc-05', 'un-ns', 'pos-tpns', 1),
    hc('hc-06', 'un-it', 'pos-ltv', 3),
    hc('hc-07', 'un-it', 'pos-it', 2),
    hc('hc-08', 'un-cskh', 'pos-cskh', 2),
    hc('hc-09', 'un-kt', 'pos-kt', 1),
    hc('hc-10', 'un-mkt', 'pos-mkt', 1),
    hc('hc-11', 'un-kho', 'pos-tk', 2),
    hc('hc-12', 'un-da', 'pos-ks', 1),
    hc('hc-13', 'un-da', 'pos-gs', 1),
    hc('hc-14', 'un-cl', 'pos-ds', 1),
    hc('hc-15', 'un-hc', 'pos-tphc', 1),
    hc('hc-16', 'un-pc', 'pos-cvpc', 1),
  ].map(([id, unitId, positionId, planned]) => ({
    id, unitId, positionId, year: now.getFullYear(), planned: planned as number, note: '',
  }));

  const decisions: Decision[] = [
    qd('qd-01', 'QD0001', 'Bổ nhiệm Trưởng phòng Kinh doanh', 'Bổ nhiệm', 'emp-01', 'Bổ nhiệm ông Nguyễn Văn An giữ chức Trưởng phòng Kinh doanh (dữ liệu demo).', '2024-03-01', 'Đã duyệt', 'Đặng Thị Lan', '2024-02-20T08:00:00.000Z', 'Dương Văn Hiệu', '2024-02-21T09:00:00.000Z', 'Đồng ý'),
    qd('qd-02', 'QD0002', 'Tăng lương lập trình viên', 'Tăng lương', 'emp-06', 'Điều chỉnh lương demo cho ông Vũ Quang Huy sau kỳ đánh giá.', plus(15), 'Chờ duyệt', 'Dương Văn Hiệu', daysAgo(2), '', '', ''),
    qd('qd-03', 'QD0003', 'Điều chuyển nhân viên IT vào Hà Nội', 'Điều chuyển', 'emp-16', 'Điều chuyển ông Cao Minh Tuấn từ chi nhánh mẫu TP. Hồ Chí Minh về Hà Nội.', plus(30), 'Chờ duyệt', 'Đặng Thị Lan', daysAgo(1), '', '', ''),
    qd('qd-04', 'QD0004', 'Kỷ luật tài xế demo', 'Kỷ luật', 'emp-12', 'Đề xuất khiển trách (hồ sơ đã nghỉ, dùng để minh họa từ chối).', '2025-11-01', 'Từ chối', 'Dương Văn Hiệu', '2025-10-28T08:00:00.000Z', 'Đặng Thị Lan', '2025-10-29T08:00:00.000Z', 'Không đủ căn cứ, đề nghị làm rõ.'),
    qd('qd-05', 'QD0005', 'Nháp quyết định nghỉ việc', 'Nghỉ việc', 'emp-08', 'Dự thảo, chưa gửi duyệt.', plus(45), 'Nháp', 'Đặng Thị Lan', daysAgo(3), '', '', ''),
    qd('qd-06', 'QD0006', 'Khen thưởng trưởng phòng nhân sự', 'Khen thưởng', 'emp-07', 'Tặng giấy khen demo vì hoàn thành số hóa hồ sơ.', '2026-03-08', 'Đã duyệt', 'Dương Văn Hiệu', '2026-03-01T08:00:00.000Z', 'Hà Minh Khôi', '2026-03-02T08:00:00.000Z', 'Nhất trí'),
  ];

  const rewards: Reward[] = [
    { id: 'rw-01', employeeId: 'emp-01', kind: 'reward', title: 'Hoàn thành doanh số demo', form: 'Thưởng tiền', date: '2026-01-20', amount: 5000000, reason: 'Vượt chỉ tiêu quý mẫu.', decisionId: null },
    { id: 'rw-02', employeeId: 'emp-07', kind: 'reward', title: 'Giấy khen số hóa hồ sơ', form: 'Giấy khen', date: '2026-03-08', amount: 0, reason: 'Dẫn dắt dự án hồ sơ điện tử.', decisionId: 'qd-06' },
    { id: 'rw-03', employeeId: 'emp-05', kind: 'reward', title: 'Chiến dịch truyền thông mẫu', form: 'Bằng khen', date: '2025-12-15', amount: 0, reason: 'Chiến dịch nội bộ đạt chỉ tiêu demo.', decisionId: null },
    { id: 'rw-04', employeeId: 'emp-08', kind: 'discipline', title: 'Kiểm kê lệch mẫu', form: 'Khiển trách', date: '2025-09-10', amount: 0, reason: 'Lệch biên bản kiểm kê demo, đã khắc phục.', decisionId: null },
    { id: 'rw-05', employeeId: 'emp-12', kind: 'discipline', title: 'Đi trễ nhiều lần', form: 'Cảnh cáo', date: '2025-06-01', amount: 0, reason: 'Vi phạm nội quy giờ giấc (hồ sơ minh họa).', decisionId: null },
  ];

  return { branches, levels, units, positions, employees, contracts, dependents, certificates, headcounts, decisions, rewards, ...buildTimeoffSeed(employees, now) };
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hd(
  id: string, code: string, employeeId: string, type: Contract['type'], startDate: string, endDate: string,
  signedDate: string, salary: number, status: Contract['status'], note = '',
): Contract {
  return { id, code, employeeId, type, startDate, endDate, signedDate, salary, status, note };
}

function dep(
  id: string, employeeId: string, name: string, relation: string, dob: string, idNumber: string,
  taxDependent: boolean, fromDate: string, toDate: string,
): Dependent {
  return { id, employeeId, name, relation, dob, idNumber, taxDependent, fromDate, toDate };
}

function cert(
  id: string, employeeId: string, name: string, issuer: string, number: string,
  issueDate: string, expiryDate: string, kind: string,
): Certificate {
  return { id, employeeId, name, issuer, number, issueDate, expiryDate, kind };
}

function hc(id: string, unitId: string, positionId: string, planned: number): [string, string, string, number] {
  return [id, unitId, positionId, planned];
}

function qd(
  id: string, code: string, title: string, type: Decision['type'], employeeId: string, content: string,
  effectiveDate: string, status: Decision['status'], createdBy: string, createdAt: string,
  decidedBy: string, decidedAt: string, note: string,
): Decision {
  return { id, code, title, type, employeeId, content, effectiveDate, status, createdBy, createdAt, decidedBy, decidedAt, note };
}
