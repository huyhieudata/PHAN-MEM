const raw: [string, string, string, string, string, string, string][] = [
  ['Nguyễn Văn An', 'Trưởng phòng Kinh doanh', 'Phòng Kinh doanh', 'Hà Nội', '0912 345 678', '2019-03-01', 'Chính thức'],
  ['Trần Thị Bích', 'Chuyên viên Nhân sự', 'Phòng Nhân sự', 'Hà Nội', '0903 112 233', '2020-07-15', 'Chính thức'],
  ['Lê Hoàng Cường', 'Kế toán tổng hợp', 'Phòng Kế toán', 'Hà Nội', '0987 654 321', '2018-11-20', 'Chính thức'],
  ['Phạm Minh Đức', 'Nhân viên Kinh doanh', 'Phòng Kinh doanh', 'TP. HCM', '0938 221 445', '2023-02-06', 'Thử việc'],
  ['Hoàng Thu Hà', 'Chuyên viên Marketing', 'Phòng Marketing', 'TP. HCM', '0977 889 900', '2021-09-01', 'Chính thức'],
  ['Vũ Quang Huy', 'Lập trình viên', 'Phòng Công nghệ', 'Hà Nội', '0966 123 789', '2022-04-11', 'Chính thức'],
  ['Đặng Thị Lan', 'Trưởng phòng Nhân sự', 'Phòng Nhân sự', 'Hà Nội', '0915 667 788', '2017-06-19', 'Chính thức'],
  ['Bùi Văn Long', 'Thủ kho', 'Kho vận', 'Đà Nẵng', '0905 334 556', '2020-01-02', 'Chính thức'],
  ['Đỗ Thị Mai', 'Nhân viên CSKH', 'Phòng CSKH', 'TP. HCM', '0944 556 677', '2024-08-12', 'Thử việc'],
  ['Ngô Đức Nam', 'Kỹ sư xây dựng', 'Ban Dự án', 'Đà Nẵng', '0923 778 899', '2019-10-07', 'Chính thức'],
  ['Dương Thị Oanh', 'Dược sĩ', 'Phòng Chất lượng', 'Hà Nội', '0918 990 011', '2021-03-22', 'Chính thức'],
  ['Lý Văn Phúc', 'Tài xế', 'Hành chính', 'Hà Nội', '0899 112 334', '2016-05-16', 'Nghỉ việc'],
  ['Mai Thanh Quý', 'Nhân viên Kinh doanh', 'Phòng Kinh doanh', 'Đà Nẵng', '0868 445 667', '2025-01-06', 'Thực tập'],
  ['Trịnh Hồng Sơn', 'Giám sát công trình', 'Ban Dự án', 'TP. HCM', '0975 667 889', '2018-08-27', 'Chính thức'],
  ['Phan Ngọc Trâm', 'Chuyên viên Pháp chế', 'Phòng Pháp chế', 'Hà Nội', '0936 778 990', '2022-12-01', 'Nghỉ thai sản'],
  ['Cao Minh Tuấn', 'Nhân viên IT', 'Phòng Công nghệ', 'TP. HCM', '0962 101 202', '2023-06-19', 'Chính thức'],
];
export type Employee = { name: string; code: string; position: string; unit: string; branch: string; phone: string; email: string; start: string; status: string; type: string };
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
export const EMPLOYEES: Employee[] = raw.map((r, i) => {
  const parts = plain(r[0]).split(' ');
  const status = r[6] === 'Nghỉ việc' ? 'Đã nghỉ việc' : r[6] === 'Nghỉ thai sản' ? 'Tạm nghỉ' : 'Đang làm việc';
  const type = r[6] === 'Nghỉ việc' || r[6] === 'Nghỉ thai sản' ? 'Chính thức' : r[6];
  return { name: r[0], code: 'NV' + String(i + 1).padStart(4, '0'), position: r[1], unit: r[2], branch: r[3], phone: r[4],
    email: `${parts[parts.length - 1]}.${parts.slice(0, -1).map(p => p[0]).join('')}@hrmhub.vn`, start: r[5], status, type };
});
export { plain };
