# Đối chiếu Chấm công với ghi chú khảo sát HappyTime

Nguồn: `uploads/happytime-donnu-chamcong.md`, mục CHẤM CÔNG. Chỉ đánh dấu xong khi màn hình trong app có đúng thành phần được ghi trong khảo sát. Chỗ khảo sát không mô tả thì để mở, không suy đoán thêm luật.

## Tổng quan

- [x] Sơ đồ các thẻ: Cài đặt ca làm việc [Admin], Phân ca [Quản lý], Lịch làm việc [Nhân sự], Cài đặt chấm công [Admin], Chấm công [Nhân sự], Bảng công [Quản lý] (được nhấn), Báo cáo chấm công [Quản lý] với các ý đi muộn/về sớm, giờ thực tế/tiêu chuẩn, làm thêm, sửa chấm công, nghỉ phép, thiếu dữ liệu, Bảng lương [Quản lý]
- [x] Mỗi thẻ có đường dẫn sang trang tương ứng
- [x] Nút phóng to / thu nhỏ trên khung sơ đồ
- [ ] Bố cục tọa độ và kiểu nối mũi tên của flowchart gốc — khảo sát chỉ nói "flowchart canvas with zoom controls"

## Bảng công

- [x] Tab Bảng công mặc định và Bảng công tùy chỉnh (nhãn MỚI)
- [x] Trạng thái trống tùy chỉnh: "Bạn chưa cài đặt mẫu bảng công tùy chỉnh" + "Thêm mới bảng công" khi chưa có mẫu
- [x] Tìm "Tên, mã nhân viên"
- [x] Chọn tháng, modal "Chọn khoảng thời gian" với radio Theo tháng công / Tuỳ chỉnh, HỦY BỎ / XÁC NHẬN
- [x] Bộ lọc trái: CHỌN ĐƠN VỊ, VỊ TRÍ, NHÂN VIÊN, CHI NHÁNH CHẤM CÔNG, Xóa bộ lọc
- [x] Kiểu xem đủ 5 tên: tổng hợp, số giờ, chi tiết, tổng hợp kèm ký hiệu đơn, số giờ kèm ký hiệu đơn
- [x] Nút tải lên dữ liệu, lịch sử cập nhật, làm mới, Xuất
- [x] Cột nhân viên (ảnh, tên, mã, đơn vị, chức danh, nhãn nghỉ việc)
- [x] Cột ngày dạng thứ + ngày/tháng, Chủ nhật và ngày lễ làm mờ
- [x] Ô công 0 / 0.5 / 1 và chấm màu; cuối tuần "-"
- [x] Chú giải: đúng giờ, đi muộn/về sớm/quên check out, không chấm công, có đơn, nghỉ lễ, có lỗi, vừa đơn vừa chấm công
- [ ] Phân trang "100 / page" đúng kiểu điều khiển của bản gốc (app dùng phân trang chung 10/20/50/100 cho bảng khác; lưới bảng công đang cuộn, chưa khóa 100 dòng/trang)
- [ ] Quy tắc tô màu từng ô khi vừa đi muộn vừa có đơn — khảo sát có chú giải nhưng không nói thứ tự ưu tiên

## Dữ liệu chấm công

- [x] Tab Dữ liệu chấm công và Cảnh báo gian lận
- [x] Tìm theo tên, mã; khoảng ngày; Bộ lọc (Nhân viên, Hình thức, Máy, Chi nhánh); Xuất Excel; Thêm dữ liệu
- [x] Cột: nhân viên, thời gian, mã, hình thức (GPS / vân tay / hình ảnh có vị trí), máy, thiết bị, IP, GPS, ảnh, tác nhân, tác vụ
- [x] Ngăn thêm: Nhân viên, Ngày, Giờ, Chi nhánh, Hủy bỏ / Lưu
- [x] Bốn thẻ đếm cảnh báo (30 ngày, mức cao, mức vừa, chưa thẩm tra)
- [x] Thanh ghi chú kết luận Hợp lệ / Vi phạm / Bỏ qua
- [x] Lọc mức độ, loại, trạng thái chờ xử lý, Xuất Excel
- [x] Cột thời gian, nhân viên, loại bất thường, mức độ, chi tiết, kết luận, thao tác
- [ ] Menu ⋯ của tác vụ (khảo sát chỉ ghi "⋯ → Xem", không mô tả màn xem)
- [ ] Bộ lọc Đơn vị và khoảng ngày trên tab gian lận được nêu tên nhưng không nói chúng lọc thế nào khi một cảnh báo không gắn đơn vị riêng

## Lịch làm việc

- [x] Hai kiểu xem: giờ "08:30 - 17:30" và mã ca
- [x] Làm mới, Xuất Excel, Phân ca ▾ (thủ công / Excel)
- [x] Tìm, "Đang hoạt động", đơn vị/vị trí, kỳ công, chi nhánh, ô "Đối tượng được bảo vệ"
- [x] Lưới áp dụng (mã – tên, chức danh), pill ca, Chủ nhật mờ, chú giải Ca đêm
- [x] Dòng "Hiển thị 1-10 / N Bản ghi"
- [ ] Ai là "đối tượng được bảo vệ" và họ bị ẩn hay chỉ đánh dấu — khảo sát không nói

## Lịch làm việc theo ca

- [x] Nút Phân ca, điều hướng ngày, dải ngày trong tháng, Hôm nay, lọc đơn vị
- [x] Thẻ Tổng NV, Đi làm (%), Nghỉ phép, WFH, Nghỉ không phép, Nghỉ không tính công, Chờ duyệt
- [x] Thanh cảnh báo nghỉ không phép và chưa phân ca, có chữ Xuất
- [x] Khối từng ca, tìm trong ca, chip lọc (Đi làm, Nghỉ phép, WFH, Nghỉ không phép, Nghỉ KTC, Chờ duyệt, Đi muộn, Về sớm)
- [x] Bảng nhân viên, đơn vị/vị trí, trạng thái, đi muộn, về sớm, ghi chú, giờ làm, Đổi ca
- [ ] Cách tính số phút đi muộn/về sớm trên từng dòng (bản gốc ví dụ "-2 phút") — khảo sát không đưa công thức
- [ ] "Nghỉ không tính công" chưa có nguồn dữ liệu trong ghi chú

## Cài đặt ngày công / công chuẩn / mẫu

- [x] Radio ngày cuối tháng hoặc ngày cố định; công tắc luồng xác nhận bảng công
- [x] Thẻ nhắc kiểm tra công (bật/tắt, Hủy bỏ / Lưu thay đổi)
- [x] Khối miễn chốt công giữa các ca: nút thêm và bảng đúng tên cột
- [ ] Không thêm luật miễn chốt vì khảo sát không cho đơn vị phút hay cách tính
- [x] Công chuẩn: đối tượng, thêm mới, cột STT, đối tượng, số công, ngày tạo, ngày cập nhật
- [x] Mẫu bảng công: tìm, thêm, cột tên, mô tả, trạng thái, tác vụ

## Ca làm việc

- [x] Tab danh sách ca và danh sách loại ca
- [x] Lọc trạng thái/loại, tìm tên hoặc mã, ô chấm công theo chi nhánh, nút Cài đặt công ăn, THÊM MỚI
- [x] Cột trạng thái, mã, tên, giờ, loại, menu sửa
- [x] Ca mẫu HCS-NT 08:30–17:30 và HC-T7 08:30–16:00
- [x] Hộp chọn loại: Ca hành chính / Ca đơn / Ca nâng cao
- [x] Form ca hành chính: trạng thái, phạm vi, tên, mã, không nhắc chấm, giờ sáng/chiều và cửa check-in/out, nghỉ cả ca và 1/2–1/4, đi muộn, về sớm, công ăn, công đêm, tự động tăng ca, số công, quên check out, giờ chuẩn
- [x] Form ca đơn: ca qua đêm, giờ làm, check-in/out, nghỉ cả ca / tùy chọn giờ / một phần
- [x] Form ca nâng cao: mốc thời gian, qua đêm, check-in từ hôm trước, khối thông tin tính công và nút kiểm tra
- [ ] Công thức "Thêm trường hợp / Kiểm tra" không chạy được vì khảo sát không mô tả ngôn ngữ công thức
- [ ] "Cài đặt công ăn" không có form trong ghi chú
- [ ] Các cửa giờ chi tiết (07:00–09:00, …) đang hiện trên form nhưng mới lưu giờ bắt đầu/kết thúc của ca, chưa lưu từng cửa

## Phân ca, lễ, ca mở

- [x] Phân ca: hai tab nhân sự / kíp; tìm tiêu đề; đối tượng; khoảng ngày; ngày tạo; Cài đặt đổi ca; THÊM MỚI thủ công hoặc Excel
- [x] Cột tiêu đề, đối tượng, thời gian áp dụng, ngày tạo
- [ ] Cột của tab "theo kíp" — khảo sát không liệt kê
- [ ] Nội dung "Cài đặt đổi ca" và mẫu cột file Excel — không có trong ghi chú
- [x] Lịch nghỉ lễ: hai tab, tìm, năm, cột STT / tên / ngày / đối tượng
- [x] Ngăn thêm: tên, ngày, đối tượng (Toàn công ty, Đơn vị, Vị trí, Nhân viên), HỦY BỎ / THÊM MỚI
- [ ] Tab "Ngày lễ hàng năm" không có cột riêng trong ghi chú (đang dùng chung bảng)
- [x] Ca mở khi tắt: đúng câu "Ca mở hiện không khả dụng" và nút sang Cấu hình lịch làm việc
- [x] Cấu hình lịch làm việc có công tắc bật ca mở
- [ ] Phần còn lại của Cấu hình lịch làm việc không được mô tả
- [ ] Trang menu "Kế hoạch phân ca theo kíp" không có bố cục riêng ngoài tab kíp ở trên

## Cài đặt chấm công và báo cáo

- [x] Tìm tên cài đặt, hình thức, đối tượng, chấm theo chi nhánh, ô Chấm công V2, Thêm mới
- [x] Cột STT, tên, hình thức, đối tượng, theo chi nhánh, cập nhật, sửa/xóa
- [x] Mẫu "Chấm công văn phòng" và "Chấm công công trình"
- [ ] Trang Chấm công điện thoại, vân tay, hồ sơ khuôn mặt, chấm công hộ: menu có tên, khảo sát không có màn hình
- [ ] "Thông tin tính công" và "Cài đặt thông báo" như trang riêng: không có mô tả ngoài thẻ nhắc nằm trong Cài đặt ngày công
- [x] Báo cáo: khoảng ngày, bộ lọc, nút Ngày/Tuần/Tháng/Năm, chọn phòng ban
- [x] Các tiêu đề biểu đồ trong ghi chú (giờ thực tế/tiêu chuẩn, OT theo đơn vị, về sớm, đi muộn, OT theo thời gian, sửa chấm công, OT theo nhân sự, nghỉ phép, đi muộn/về sớm, thiếu dữ liệu)
- [x] Ô trống ghi "Chưa có thông tin" khi không có số liệu
- [ ] Biểu đồ đường và nút tải xuống đúng định dạng file của bản gốc — khảo sát không nói định dạng

## Open questions

1. Công thức phút đi muộn / về sớm và thứ tự ưu tiên khi một ô vừa có đơn vừa đi muộn.
2. Định nghĩa "Đối tượng được bảo vệ" và "Nghỉ không tính công".
3. Menu ⋯ trên dữ liệu chấm công và trên quy trình đơn (phần đơn từ) gồm những lệnh nào.
4. Mẫu file Excel phân ca: tên cột, dòng tiêu đề.
5. Form "Cài đặt công ăn" và "Cài đặt đổi ca".
6. Ngôn ngữ công thức ở ca nâng cao (trường hợp, điều kiện, kết quả kiểm tra).
7. Cột của phân ca theo kíp và của tab Ngày lễ hàng năm.
8. Toàn bộ trường của Cấu hình lịch làm việc ngoài công tắc ca mở.
9. Màn hình riêng: Thông tin tính công, Cài đặt thông báo, Chấm công điện thoại, Chấm công vân tay, Hồ sơ khuôn mặt, Chấm công hộ.
10. Cách tính "Hạn xử lý cấp duyệt" trên danh sách đơn (cột có tên nhưng không có công thức). Khảo sát cũng không nói chi nhánh ghi nhận công khác chi nhánh nhân sự thế nào; bộ lọc đang so cùng chi nhánh nhân sự.
11. Các mục trong menu "Xuất báo cáo ▾" của danh sách đơn, và quy tắc khoảng ngày "Tuỳ chỉnh" trên modal tháng công.
12. Bộ nút zoom của flowchart (bản gốc có thể khác +, −, 100%).
