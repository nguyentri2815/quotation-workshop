# Chặng 1 — hành trình theo hành vi

Phạm vi: chỉ workshop. `../quotation-product` là nguồn đối chiếu chỉ đọc; `src/practice` vẫn là bài người học. Không commit/push và không triển khai Chặng 2.

## Mở và thử

- Bắt đầu: `http://localhost:3181/#journey=2&step=0&sub=0&tab=build`.
- Bước 3: chọn **Nối validation**, nhập form rỗng và bấm **Tính phí**. Mở các vai trò intent, validation và lỗi trong cây tính năng; tab Tổng thể → Theo một thao tác → Tính phí không hợp lệ.
- Sau khi nối tính phí: điền mẫu, tính phí, rồi ở bước 4 đổi tên và đổi số tiền để so sánh việc giữ/xóa phí.
- Bước 5: chọn **Nối lưu**, điền mẫu → tính phí → lưu. Mở công cụ riêng workshop, chọn **Gây lỗi lần lưu kế tiếp**, lưu và thử lại để quan sát nhánh lỗi giữ draft.
- Bước 6: lưu, đọc lại danh sách/chi tiết, reload và thử rời form chưa lưu.

## Ranh giới trải nghiệm

Luồng sự kiện là diễn giải từ source và dữ liệu mẫu, không phải instrumentation hay live trace. Gọi setter yêu cầu React cập nhật state cho lần render tiếp theo; không mô tả DOM đổi đồng bộ tại setter.

Code mẫu, phân tích và preview cùng dùng checkpoint đang chọn. Cây chức năng là mô hình phân tích trách nhiệm, không tạo thêm layer hoặc file Consumer/Intent trong sản phẩm. Quan hệ gọi/đọc/cập nhật/render có nhãn riêng.

Tiến độ mới dùng `quotation-workshop.behaviors.v2`. Khóa `quotation-workshop.guide.v1` được giữ nguyên và chỉ đọc để tham khảo; không chuyển dấu hoàn thành cũ thành hoàn thành mới. URL mới có `journey=2`; URL cũ không có tham số này được ánh xạ và thông báo.

Adapter nhúng tiếp tục công khai tại `_workshop`: namespace API/storage/Service Worker, HashRouter và công cụ thử lỗi. Source cuối chặng được so với sản phẩm sau khi đảo các adapter hữu hạn. Dữ liệu mẫu theo từng checkpoint có namespace riêng, không tự chuyển dữ liệu giữa các mốc.

## Bảo toàn và kiểm tra

Hash đầu phiên tiếp tục được lưu tại thư mục QA trong TEMP (protected-hashes.json): 85 file thuộc practice, starter, solutions và repo sản phẩm; loại dependencies, Git, build/test output. Kết quả cuối ở CHANG-1-VERIFICATION.md. Các baseline cũ trong .verification được giữ nguyên.

Các kiểm tra tự động là bằng chứng kỹ thuật; trải nghiệm học vẫn chờ người dùng review.
