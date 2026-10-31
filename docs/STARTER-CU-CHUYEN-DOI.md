# Bài đang dùng starter cũ: cách đối chiếu và chuyển đổi riêng

Workshop đã sửa **mẫu**, chưa sửa bài của bạn. `src/practice`, tiến độ, ghi chú và dữ liệu vẫn ở vị trí/namespace cũ. Bạn có thể tiếp tục hoàn thành bài cũ theo hành vi rồi đối chiếu cấu trúc chuẩn; không cần đổi code chỉ để mở workshop.

## Những tên không phải phép đổi tên một-một

| Starter cũ | Cấu trúc sản phẩm mẫu | Điều cần hiểu |
| --- | --- | --- |
| PracticeApp.tsx / practiceTitle | App.tsx / Layout / router | App chứa layout và bảng route; Layout là component, không phải chuỗi tiêu đề |
| components/FormFields.tsx / Field / bind | pages/CreateQuotation.tsx / Field / inputProps / JSX các section | Field chỉ bọc nhãn/lỗi; inputProps đóng trên draft/errors của trang; các nhóm input vẫn ở trang tạo |
| components/PremiumPanel.tsx | components/PremiumSummary.tsx + quotation/format.ts | Tách trình bày phí khỏi helper định dạng tiền/ngày; không nhân đôi công thức |
| inFlight / saved trong handler cũ | saveInFlight / quotation | Đối chiếu vòng đời save và catch; không đổi tên mù quáng |
| practice.module.css / base.css | components/ui.module.css / styles.css | CSS và markup liên quan; chỉ đổi tên stylesheet không làm giao diện khớp |
| ApiProbe / mocks/scenario.ts | _workshop/tools.ts bên ngoài ứng dụng mẫu | Đây là công cụ học, không phải component sản phẩm |

`solutions/01`…`solutions/11` vẫn là lời giải **legacy** tương thích starter cũ, không dùng để kết luận source mẫu cuối giống sản phẩm. Mẫu chuẩn theo từng mốc nằm ở cây Source của workshop hoặc `checkpoints/<id>/`. `sample/product/` là bản ghim cuối chặng để đọc, không phải thư mục bài làm.

## Nếu muốn tự chuyển bài sang cấu trúc chuẩn

1. Sao lưu thư mục bài và export dữ liệu/ghi chú của bạn trước. Tạo bản sao repo vào vị trí khác, chạy ở port khác để thử việc chuyển đổi. Không chạy lệnh chép toàn bộ checkpoint đè lên `src/practice` đang làm.
2. Trên bản sao, đối chiếu từng thay đổi do bạn tự viết. Giữ các bổ sung cá nhân. Chuyển helper `Field` và các nhóm JSX về trang tạo; thay bind bằng inputProps đọc state của trang. Đối chiếu từng handler với panel “Bên trong file”, không dán cả component nếu nó làm mất bài của bạn.
3. Chuyển phần trình bày phí thành PremiumSummary và helper format về quotation/format.ts. Chuyển CSS/markup cùng nhau. Thêm các component có sẵn của sản phẩm (Icon, FixedInformation, AsyncMessage) khi trang cần chúng; đừng giả định starter cũ đã có.
4. Đổi entrypoint/router chỉ khi đã sửa imports tương ứng. Giữ hash router cho `/practice.html`, scope worker `/practice.html`, endpoint `/api/practice/quotations` và khóa `quotation-workshop.practice.v1`. **Không dùng** `quotation-product.demo.v1`, key reference hoặc key checkpoint cho bài học.
5. Giữ probe/thử lỗi trong khu vực học riêng. Đừng import `_workshop/environment` của checkpoint vào bài: adapter đó xác định môi trường theo URL checkpoint/reference, không dành cho practice.
6. Chạy typecheck/build và thử: dữ liệu rỗng → lỗi đúng ô → nhập mẫu → tính phí → đổi số tiền/ngày phải tính lại → lỗi lưu vẫn giữ form → lưu thành công → reload chi tiết → danh sách. Kiểm tra Hủy/Back và dữ liệu cá nhân trên bản sao trước khi tự quyết định áp dụng các thay đổi về bài chính.

Workshop không tự thực hiện sáu bước này, không tự chấm hay đánh dấu bài bạn đã chuyển đổi. Những URL cũ chỉ giúp tìm trách nhiệm tương ứng trong **mẫu mới**, không chứng nhận file bài học đã đổi cấu trúc.
