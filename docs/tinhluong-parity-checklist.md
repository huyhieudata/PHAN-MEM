# Đối chiếu Tính lương với ghi chú khảo sát

Nguồn: `uploads/happytime-tinhluong.md`. Mục đánh dấu khi nhãn, cột, bộ lọc hoặc form đã có trong ghi chú. Bản khảo sát không có dòng bảng lương nào, nên màn chi tiết và phiếu lương được ghi riêng là phương án xem kết quả, không phải bản sao màn hình.

## Menu, cổng mật khẩu, tổng quan

- [x] Menu trái: Tính lương V2 (tổng quan, 7 bảng lương, chi phí, hạch toán, thông tin thu nhập, bảng thuế), Tính lương V1 (2 trang), Báo cáo → Lương, Cài đặt V2 (8 trang) và Cài đặt V1 (2 trang)
- [x] Breadcrumb dạng Trang chủ / Tính lương / nhóm / trang
- [x] Hộp "Bảo mật thông tin": "Nhập mật khẩu của bạn để tiếp tục", ô "Mật khẩu *", placeholder "Nhập mật khẩu", TIẾP TỤC / QUAY LẠI. Mọi mật khẩu khác rỗng đều qua. Không lưu mật khẩu
- [x] Tổng quan là các thẻ luồng: template, chấm công, bảng lương, phản hồi, chi phí, báo cáo

## Bảy danh sách và trang tạo

- [x] Cùng bố cục: tìm "Nhập tên bảng lương", Bộ lọc, Thêm mới
- [x] Bộ lọc trái: Trạng thái, Kỳ lương, Đơn vị áp dụng, Vị trí áp dụng, Nhân viên áp dụng, Xóa bộ lọc
- [x] Cột: chọn, TÊN BẢNG LƯƠNG, KỲ LƯƠNG, THỜI GIAN TÍNH CÔNG, ĐỐI TƯỢNG ÁP DỤNG, TRẠNG THÁI, TÁC VỤ. Trống: "Không có dữ liệu"
- [x] Tạo bảng lương: Quay lại, Hủy bỏ, Lưu
- [x] Thông tin chung, "Sử dụng mẫu", loại bảng (kể cả Bảng dữ liệu gốc), kỳ lương, "Theo tháng công" / "Tùy chỉnh" và nhãn khoảng ngày
- [x] Đối tượng áp dụng và link xem nhân viên
- [x] "Chưa có bảng lương phụ nào để liên kết" khi chưa có bảng khác
- [x] Phản hồi: người nhận và "Sau [số] Ngày"
- [x] Thành phần lương: tìm, Import, Export, Xuất Excel, bảng cột đã nêu, chỗ trống "Chưa có thành phần nào / Thêm thành phần đầu tiên để bắt đầu"
- [x] Ngăn "Chọn thành phần" với 172 chỉ số (mã + tên, nút +) và "+ Thêm mới thành phần"
- [x] Modal thành phần: tên, mã, định dạng, giá trị mặc định, 4 loại công thức, công thức khóa khi Nhập tay, mô tả, "Tạo liên tiếp"
- [x] Modal mẫu export: tên, chỉ số khả dụng, đã chọn, thêm nhóm, Hủy bỏ / Xem trước / Lưu mẫu export

## Tính lương thật

- [x] Mẫu "Mẫu bảng lương chính" gắn công thức Excel đã nêu, gồm `THUC_NHAN` và `TONG_THU_NHAP`
- [x] Bộ đánh giá công thức không dùng `eval`: cộng trừ nhân chia, ngoặc, `%`, `MAX`, và `TAX5` cho 5 bậc tháng
- [x] Mỗi nhân viên lấy lương từ hợp đồng, công từ bảng công, giờ OT và nghỉ từ đơn đã duyệt, số người phụ thuộc, tỷ lệ BHXH 8% / 1,5% / 1% và phía công ty 17,5% / 3% / 1% / TNLĐ 0,5%
- [x] Giảm trừ 11.000.000 và 4.400.000 mỗi người phụ thuộc, rồi thuế 5 bậc
- [x] Màn kết quả: bảng nhân viên × thành phần, dòng tổng, Tính lại, Khóa, Gửi phiếu lương, Xuất excel, xem phiếu

## Chi phí, thuế, báo cáo, cài đặt

- [x] Chi phí lương: 4 thẻ, tìm, tháng, cột đã nêu
- [x] Hạch toán: lọc nhóm và cost center, Xuất Excel, 4 thẻ, bảng cost center theo kỳ
- [x] Thông tin thu nhập: tìm, cột đã nêu; số liệu lấy từ hợp đồng nhân sự
- [x] Bảng thuế 5 bậc đúng ngưỡng triệu đồng và thuế suất
- [x] Báo cáo Lương: 8 thẻ, hai biểu đồ, bảng cost center, top hạng mục; trống thì "Không có dữ liệu nào"
- [x] Mẫu bảng lương V2: cột đã nêu và form tạo
- [x] Thông tin tính lương: cột đã nêu, 172 dòng, 10 dòng mỗi trang, các chỉ số mẫu PHU_CAP_AN_CA, BH_TNLD_BNN_*, THUC_NHAN, TONG_THU_NHAP
- [x] Sản phẩm, cost center, phân bổ: đúng cột, danh sách trống
- [x] 15 hạng mục chi phí đúng nhóm và mã; cột khấu trừ là "--"; tab Nhóm hạng mục
- [x] Một mẫu báo cáo hoạch toán: STT 1, tên mẫu thử, 1 hạng mục, Hoạt động
- [x] Cài đặt bảng lương: 3 nhóm, "Người đang làm việc" khóa và gắn "Bắt buộc", Hủy bỏ / Lưu thay đổi
- [x] V1 có banner hạn 31/10/2026, nút Dùng thử và Xem chi tiết
- [x] Bảng lương chính V1 và bảng phụ (4 tab, tiêu đề "Bảng sản phẩm")
- [x] Cài đặt chung V1 và biểu thuế 7 bậc

## Open questions

Những mục dưới đây không có trong ghi chú, hoặc màn hình không mở được vì dữ liệu trống. Không suy ra form.

1. Màn chi tiết bảng lương, menu từng dòng, nhãn trạng thái, mẫu phiếu lương và luồng nhân viên xem / xác nhận / khiếu nại không hiện trong bản khảo sát. Bảng nhân viên × thành phần, nút Tính lại, Khóa, Gửi phiếu lương, Xuất excel và phiếu xem trước là cách đọc kết quả đã tính, không phải bố cục đã nhìn thấy. Nút Duyệt nằm trong ghi chú "không khảo sát" nên không thêm trạng thái duyệt riêng.
2. Nội dung mẫu export (cột kế toán, ngân hàng, BHXH) không được liệt kê.
3. Danh sách Định dạng trong modal không tải được. Ô đang có Văn bản (mặc định trong ghi chú) cùng Số, Tiền tệ (VND), Ngày như ghi chú đề nghị ghi vào câu hỏi mở.
4. Khác biệt cú pháp giữa Công thức Excel, Ngôn ngữ Happy Time và Ngôn ngữ Expression không được mô tả. Cả ba dùng cùng bộ đọc số học an toàn; Happy Time và Expression không có hàm riêng.
5. Công thức chữ của KHAU_TRU_THUE, THU_NHAP_TINH_THUE không có trong ví dụ. `TAX5` và mức giảm trừ 11.000.000 / 4.400.000 là theo yêu cầu tính lương của đợt này và bảng 5 bậc ở mục Bảng thuế, không phải công thức chép từ màn hình.
6. TONG_TIEN_TANG_CA trong ghi chú là Nhập tay. Giờ OT vẫn đổ vào chỉ số OT_HOURS; tiền tăng ca không tự nhân hệ số vì hệ số không được nêu.
7. Mức đóng bảo hiểm lấy bằng lương hợp đồng. Trần đóng BHXH không có trong ghi chú.
8. Form thêm: chi phí, sản phẩm, cost center, phân bổ, hạng mục, mẫu hoạch toán, thông tin thu nhập, và mẫu cột Import.
9. Quy tắc gán nhân viên vào cost center khi khóa bảng lương không có. Dòng chi phí ghi "Chưa gán cost center".
10. "Kéo để sắp xếp" ở mẫu export và hạng mục chi phí không có hành vi thả cụ thể.
11. Cách nhận biết "Nghỉ thai sản" ngoài đơn nghỉ thai sản đã duyệt không được mô tả. Ô chọn này đang nhìn đơn đó.
