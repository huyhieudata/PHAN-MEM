# HRM Hub

Phần mềm quản trị nhân sự (HRM) theo mô hình các nền tảng thương mại như HappyTime. Giao diện tiếng Việt, chạy hoàn toàn trên trình duyệt ở giai đoạn này.

Xem trước (sau khi bật GitHub Pages): [https://huyhieudata.github.io/PHAN-MEM/](https://huyhieudata.github.io/PHAN-MEM/)

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (mặc định `http://localhost:5173`). Đăng nhập demo: nhập bất kỳ rồi chọn công ty.

```bash
npm run build    # kiểm tra kiểu TypeScript rồi đóng gói vào dist/
npm run preview  # xem bản build
```

Ứng dụng dùng `HashRouter` và `base: './'`, nên bản build mở được cả bằng file tĩnh lẫn dưới đường dẫn con của GitHub Pages (`/PHAN-MEM/`).

## Cấu trúc

```
src/
  main.tsx              # HashRouter
  App.tsx               # các route gốc
  styles.css            # giao diện (cam #F97316, thẻ trắng, bóng nhẹ)
  data/menu.ts          # 14 phân hệ, menu con, launcher
  data/session.ts       # người dùng demo và danh sách công ty
  components/           # khung module, logo, giao diện sáng/tối
  pages/                # đăng nhập, chọn công ty, launcher, trang phân hệ
.github/workflows/      # build và deploy GitHub Pages (khi đã thêm)
```

Dữ liệu nghiệp vụ sẽ nằm sau một lớp repository (`src/data/repositories`) để sau này thay bằng API mà không phải sửa giao diện.

## Lộ trình phân hệ

| Thứ tự | Phân hệ | Trạng thái |
| --- | --- | --- |
| 1 | Nhân sự (hồ sơ, hợp đồng, tổ chức, định biên, quyết định, khen thưởng/kỷ luật, báo cáo, CSV) | Đang xây |
| 2 | Đơn từ & nghỉ phép | Chưa làm |
| 3 | Chấm công | Demo bảng công |
| 4 | Tính lương | Chưa làm |
| 5 | Đánh giá | Chưa làm |
| 6 | Công việc | Chưa làm |
| 7 | Tài sản | Chưa làm |
| 8 | Đề xuất | Chưa làm |
| 9 | Tài liệu | Chưa làm |
| 10 | Ký số | Chưa làm |
| 11 | Truyền thông nội bộ | Chưa làm |
| 12 | Cá nhân (self-service) | Chưa làm |
| 13 | Hệ thống (cơ cấu, đơn vị, vị trí, chi nhánh) | Đi cùng Nhân sự |
| — | Tổng quan / launcher | Khung sẵn |

Trang chưa xây hiển thị placeholder. Trang đã có màn hình thật được đăng ký trong `src/pages/ModulePage.tsx`.
