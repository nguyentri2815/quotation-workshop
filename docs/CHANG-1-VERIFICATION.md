# Chặng 1 · bàn giao hành trình theo hành vi · 30/10/2026

Đợt mới nhất: [Cây thư mục và quan hệ ngay trên cây](CHANG-1-DEPENDENCY-TREE.md). Flow có nhánh trong Tổng thể giữ theo [bản branching](CHANG-1-BRANCHING.md). Bản ghi dưới đây là lịch sử; danh mục sáu tình huống đã được gom theo bảng mới.

**Đợt cập nhật tiếp theo:** [Thanh sub-step, focus và mốc Field](CHANG-1-MICROSTEPS.md) bổ sung 7 snapshot (tổng 29), giữ 6 bước/30 sub-step. Bản ghi bên dưới là kết quả của đợt hành trình trước; xem tài liệu mới cho URL review và kiểm tra mới nhất.

Chỉ sửa quotation-workshop. Sản phẩm chỉ đọc, src/practice giữ nguyên; không commit/push hoặc chuyển Chặng 2. Kiểm tra kỹ thuật không thay thế review trải nghiệm học.

## Mở và thử

- [Bắt đầu](http://localhost:3181/#journey=2&step=0&sub=0&tab=build).
- [Nối validation](http://localhost:3181/#journey=2&step=3&sub=1&tab=build): để rỗng → Tính phí; mở intent/validation/errors/JSX lỗi trong cây; Tổng thể → Theo một thao tác → Tính phí dữ liệu sai.
- [Nối tính phí](http://localhost:3181/#journey=2&step=3&sub=4&tab=build): Điền dữ liệu mẫu → Tính phí → 1.100.000 VND.
- [Nối lưu](http://localhost:3181/#journey=2&step=5&sub=5&tab=build): điền mẫu → tính → lưu; Công cụ riêng workshop → Gây lỗi lần lưu kế tiếp để thử lỗi/thử lại. Theo Lưu thành công/Lưu lỗi để đọc UI → handler → client → mock → storage → response → UI.
- [Hoàn thiện](http://localhost:3181/#journey=2&step=6&sub=3&tab=build): thử toàn hành trình, reload, danh sách và rời form chưa lưu.

## Thay đổi thực tế

- Khôi phục tiếng Việt bị hỏng từ phiên dở. Mở đầu + sáu bước, 30 bước con; nhiệm vụ, tiền đề, dependency, nơi nối tiếp và tiêu chí quan sát riêng từng thao tác.
- Giữ 22 ID và sắp lại checkpoint: 03-fields dựng đủ màn hình tĩnh ở bước 1, 02/03 nối dữ liệu ở bước 2; validation/công thức/presentation/calculate cùng bước 3. Không chỉ đổi tên menu cũ.
- Bước 5 nối client/mock/storage/save. 09/10-list có biên nhận POST với số/ID/khách hàng/phí đã kiểm tra. Adapter biên nhận được công khai; mốc 10 thay bằng GET detail, cuối chặng giữ source sản phẩm.
- Tổng thể tách dependency và sáu chuỗi sự kiện có inspector, nhánh/dữ liệu, thứ tự, điểm đầu/cuối, đường nối nổi và source cụ thể. Mốc chưa có hành vi phải được chọn chuyển rõ ràng.
- Cây tính năng có tám nhóm trách nhiệm, trạng thái theo nội dung symbol, liên kết và lịch sử; highlight các phần liên quan validation/lưu. Cây vật lý vẫn đầy đủ. Phân tích file nhóm tám vai trò, ghi rõ chồng lấn; AST thêm range hẹp cho callback, guard, lock, catch và props.
- URL journey=2, mapping URL cũ, explorer/tab/flow/event/code/Trước-Sau và history; đổi file/tab cùng checkpoint giữ iframe. Tiến độ mới riêng, dữ liệu cũ chỉ đọc tham khảo.

## Kiểm tra đã thực hiện

| Kiểm tra | Kết quả |
| --- | --- |
| Unit | 36/36, 7 file: sáu bước/luồng, mapping legacy, hash/diff, range/quan hệ, parity và tiến độ |
| Typecheck | PASS cho workshop, practice hiện có, reference và 22 checkpoint |
| Build | PASS; cảnh báo chunk workshop khoảng 708 KB minified / 102 KB gzip |
| Chrome | PASS 20/20 trong lượt đầy đủ cuối; các lỗi phát hiện đã sửa và chạy lại, không skip |
| HMR | PASS: sửa → đổi không reload → khôi phục trong bản sao QA riêng; source gốc giữ hash |
| Bảo toàn | 85 file đầu phiên tiếp tục không đổi; 33 hash practice/product từ upgrade-baseline và 50 hash practice/starter/solutions từ ux-session-baseline đều khớp |
| Git | diff --check không báo lỗi; repo có file untracked nên hash/typecheck/parity là bằng chứng chính. Không commit/push |

Chrome dùng context QA mới, không mở profile người học. Ca tuần tự đi qua đủ 30 thao tác: code/range/checkpoint/iframe đồng bộ, nhập được ở các mốc có state. Ca chuyên sâu kiểm tra validation/focus, phí đúng, đổi tên giữ phí/đổi tiền mất phí, 501 trước mock, POST sau mock, gửi lặp chỉ một request, lỗi/retry, HTTP 400/422 và lỗi ghi storage thực giữ bản ghi cũ. Cuối chặng lưu/reload/list/detail và dialog rời form được kiểm tra. Desktop 1440/1512/1920, mobile 390/320; code, cây và luồng không tràn ngang.

## Phát hiện và xử lý

Phiên dở còn definitions thao tác 13 bước, generator suy stage từ ID cũ, lỗi TypeScript trong trạng thái load source và thiếu AST range được nội dung tham chiếu. Đã sửa nguồn sinh/metadata, không sửa tay snapshot. Mục tiêu nằm trong phần mở rộng để vùng hướng dẫn không bị đẩy khi mở phân tích. Range lỗi lưu thu hẹp về errorBox/catch, không trỏ cả CreateQuotation.

Lỗi kiểm thử đã xử lý: đọc fixture JSON tương thích Node ESM; selector status tách công cụ khỏi biên nhận; kiểm tra văn bản có nội dung thay vì áp độ dài tùy ý. Không skip test. Legacy test:journey không chạy lại vì starter/solutions không đổi; ca sáu bước mới kiểm tra riêng trên preview thật.

## Bằng chứng và giới hạn

Baseline tiếp tục/audit JSON tại .verification/review-screenshots/behavior-20261030 (bản QA gốc ở TEMP/quotation-behavior-resume-20261030); baseline cũ .verification giữ nguyên. 18 runtime path cuối chặng khớp sản phẩm: 13 file nguyên byte, 5 chỉ khác adapter nhúng hữu hạn. [Bảng đối chiếu và biên nhận trung gian](CHANG-1-SOURCE-REVIEW.md).

Ảnh Chrome ở test-results; ảnh bàn giao được giữ riêng trong .verification/review-screenshots/behavior-20261030 để không mất khi chạy test tiếp.

Luồng là diễn giải source, không phải live trace. Types-only/quan sát không tạo thay đổi UI giả. Dữ liệu demo tách theo checkpoint, không tự chuyển giữa mốc. Biên nhận 09 chỉ chứng minh response POST; GET/reload đầy đủ từ mốc 10. Không mở/xác minh dữ liệu profile thật; việc giữ key/progress được thử bằng context riêng và code. Chrome là trình duyệt được kiểm tra, chưa khẳng định Firefox/Safari. Source mẫu không tự đồng bộ khi sản phẩm đổi. Cảnh báo bundle lớn còn tồn tại.

Một lần khởi động bổ sung báo port đã được dùng; giữ server 3181 đang phục vụ đúng workshop, không dừng tiến trình khác. HTTP 200 và toàn bộ kiểm tra Chrome đã xác nhận source mới. Preview tiếp tục chạy tại http://localhost:3181. Dừng Chặng 1 để người dùng review.
