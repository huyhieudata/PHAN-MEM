# HRM Hub

Phần mềm quản trị nhân sự, giao diện tiếng Việt, làm theo hướng các nền tảng như HappyTime. Giai đoạn này chạy hoàn toàn trên trình duyệt: dữ liệu nằm trong `localStorage`, phía sau một lớp repository để sau này thay bằng API mà không phải viết lại màn hình.

Xem trước sau khi bật GitHub Pages: [https://huyhieudata.github.io/PHAN-MEM/](https://huyhieudata.github.io/PHAN-MEM/)

Nếu trang chưa mở được, vào **Settings → Pages → Source: GitHub Actions** rồi chạy lại workflow `Deploy GitHub Pages`. Token mặc định của Actions thường không tự bật Pages lần đầu.

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (mặc định `http://localhost:5173`). Đăng nhập demo: nhập bất kỳ, rồi chọn công ty.

```bash
npm test         # kiểm thử repository, CSV và danh sách nhân sự
npm run build    # kiểm tra kiểu rồi đóng gói vào dist/
npm run preview  # xem bản build
```

Ứng dụng dùng `HashRouter` và `base: './'`, nên mở được dưới đường dẫn con `/PHAN-MEM/` của GitHub Pages. Đăng nhập là bản demo, không có máy chủ xác thực.

Dữ liệu mẫu là hồ sơ hư cấu (số điện thoại `0900 000 0xx`, email `@vi-du.hrm.local`). Nút **Khôi phục dữ liệu mẫu** nằm ở Nhân sự → Cài đặt.

## Cấu trúc

```
src/
  main.tsx                 HashRouter
  App.tsx                  route gốc
  styles.css               cam #F97316, thẻ trắng, bóng nhẹ
  data/menu.ts             14 phân hệ và menu
  data/types.ts            mô hình nhân sự
  data/seed.ts             dữ liệu mẫu
  data/repositories/       HrRepository + localStorage
  pages/hr/                phân hệ Nhân sự
  pages/system/            cơ cấu tổ chức, đơn vị, vị trí, chi nhánh
  pages/Timesheet.tsx      bảng công đọc chung danh sách nhân sự
.github/workflows/pages.yml
```

Mọi thao tác ghi đi qua `hr` trong `src/data/repositories`. Giao diện chỉ gọi `useHr()` và các hàm `save*` / `delete*`. Muốn đổi sang API, viết một lớp cùng interface và giữ nguyên trang.

## Đã có trong giai đoạn này

- Thông tin nhân sự: lọc, sắp xếp, phân trang, tìm không dấu, thêm / sửa / xóa, hồ sơ chi tiết (cá nhân, công việc, hợp đồng, gia đình, chứng chỉ, BHXH), import / export CSV.
- Hợp đồng: tạo, sửa, trạng thái hiệu lực / sắp hết hạn / hết hạn / chờ ký / thanh lý.
- Định biên: kế hoạch so với số người thực tế theo đơn vị và vị trí.
- Quyết định: Tất cả / Của tôi / Cần duyệt, tạo nháp hoặc gửi duyệt, duyệt, từ chối.
- Khen thưởng và kỷ luật.
- Báo cáo: biểu đồ biên chế theo đơn vị, thâm niên, loại hợp đồng.
- Hệ thống: cây cơ cấu tổ chức, đơn vị, cấp đơn vị, vị trí, chi nhánh.
- Danh bạ, người phụ thuộc, chứng chỉ, khai báo BHXH dùng chung dữ liệu hồ sơ.
- Bảng công lấy nhân sự từ cùng repository.

## Lộ trình các phân hệ tiếp theo

| Thứ tự | Phân hệ | Ghi chú |
| --- | --- | --- |
| 1 | Đơn từ & nghỉ phép | phép năm, đơn của tôi / cần duyệt, quỹ phép |
| 2 | Chấm công | thay bảng công demo bằng ca, công thực tế, tổng hợp |
| 3 | Tính lương | bảng lương từ công, phụ cấp, khấu trừ |
| 4 | Đánh giá | kỳ đánh giá, phiếu, KPI |
| 5 | Công việc | dự án và việc được giao |
| 6 | Tài sản | cấp phát, thu hồi |
| 7 | Đề xuất | luồng duyệt giống quyết định |
| 8 | Tài liệu và ký số | kho tài liệu, trình ký |
| 9 | Truyền thông nội bộ | bảng tin, thông báo |
| 10 | Cá nhân | self-service đọc dữ liệu nhân sự của người đăng nhập |
| 11 | Hệ thống phần còn lại | phân quyền, lịch sử thao tác, tích hợp, Open API |
