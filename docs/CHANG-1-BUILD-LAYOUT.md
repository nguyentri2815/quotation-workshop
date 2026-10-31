# Chặng 1 · bố cục Xây từng bước

Ngày 31/10/2026. Đợt này chỉ chỉnh UX/layout của workshop, tiếp nối [workspace flow và cây phụ thuộc](CHANG-1-WORKSPACE.md). Không đổi nghiệp vụ, source mẫu, checkpoint, practice hoặc khóa dữ liệu/tiến độ. Không commit/push.

- [Đọc code · nối tính phí 3.5](http://localhost:3181/#journey=2&step=3&sub=4&tab=build).
- [Cây phụ thuộc 3.4 · Props](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props).
- [Flow Lưu bản chào](http://localhost:3181/#journey=2&step=5&sub=5&tab=overview&overviewMode=runtime&runtimeFlow=save).

## Bố cục và điều khiển

Tiêu đề, hai tab chính và chế độ làm việc cùng một header. Quay lại flow nằm cạnh tiêu đề khi đi từ flow sang source. Thanh sub-step giữ Trước/Tiếp và mốc nhỏ A–F trong cùng hàng; bỏ footer điều hướng lặp. Sub-step đang chọn được đưa vào vùng nhìn khi đổi bước hoặc độ rộng, không cuộn cả trang.

Nhiệm vụ hiện một dòng; bấm dòng đó mở chi tiết. Toolbar vùng làm việc gom Code/Phụ thuộc, explorer hoặc tìm symbol/phạm vi, Tùy chọn và Chạy thử. Kiểu cây, phần tương lai và chú giải nằm trong Tùy chọn explorer. Phụ thuộc dùng cùng hàng toolbar; khi hẹp, phạm vi và quay lại có trong Tùy chọn để cây không bị đẩy xuống.

Code toàn file kéo đến đáy vùng làm việc, cuộn độc lập với cây. Tên file, Trước/Sau/Diff, Symbol và Bên trong file cùng một hàng; range chỉ một dòng. Thông tin kỹ thuật/source origin/hash và chú giải diff mở bằng nút Thông tin kỹ thuật. Giữ nguyên cỡ chữ code 13 px và chiều cao dòng 22 px.

Preview mặc định chỉ một hàng: Mẫu/Bài tôi, checkpoint ngắn, Thông tin, mở rộng và mở riêng. Mô tả mốc, source thay đổi, dữ liệu và hướng dẫn nằm trong Thông tin preview. Iframe giữ nguyên khi đổi bố cục; đổi checkpoint chủ động vẫn khởi tạo lại form theo cơ chế cũ.

Menu Chế độ làm việc có Đối chiếu, Đọc code và Thử giao diện. Đọc code thu preview và bỏ các control đã khuất khỏi thứ tự Tab, vẫn giữ iframe. Đối chiếu khôi phục độ rộng đối chiếu gần nhất trong phiên, Thử giao diện dành 55% vùng chia cho preview. Thanh kéo tự do và phím trái/phải vẫn dùng được. Preset và Thu/Mở preview ở Tùy chọn bố cục. Explorer giữ disclosure và scroll khi thu/mở; chuyển chế độ không ghi vào history của source.

## Đo diện tích đọc

Đo cùng sub-step 3.5, Đối chiếu, cỡ chữ không đổi. Đây là chiều cao vùng cuộn code và iframe, không tính toolbar.

| Viewport 100% | Code trước → sau | Iframe trước → sau |
| --- | --- | --- |
| 1440×900 | 352 → 651 px (72% chiều cao ứng dụng) | 417 → 782 px (87%) |
| 1920×1080 | 532 → 831 px (77%) | 617 → 962 px (89%) |

Trước sửa, các hàng phía trên code chiếm khoảng 496 px, footer thêm 43 px. Sau sửa, code bắt đầu tại 248 px và kết thúc sát đáy. Header 60, sub-step 44, nhiệm vụ 32, toolbar chung 40, toolbar code 40, range 31 px; các đường viền chiếm phần còn lại. Không thêm max-height cho code/cây hoặc hạ cỡ chữ.

Kiểm tra zoom 125% thật qua Chrome Settings trong profile QA riêng, gồm cả thanh giao diện browser:

| Cửa sổ vật lý | Viewport CSS / DPR | Code / chiều cao ứng dụng | Cây / chiều cao ứng dụng | Iframe / chiều cao ứng dụng |
| --- | --- | --- | --- | --- |
| 1440×900 | 1138×643 / 1,25 | 395 px / 61% | 417 px / 65% | 526 px / 82% |
| 1920×1080 | 1522×787 / 1,25 | 539 px / 68% | 561 px / 71% | 670 px / 85% |

Ở cả ba chế độ, không cuộn ngang toàn trang; chiều cao code/cây không thay đổi khi ưu tiên preview. Cây hẹp dùng inspector drawer, không ép hai cột nhỏ. Ở 100%, code thấy khoảng 29/37 dòng; ở zoom 125% cửa sổ 1440×900 còn khoảng 18 dòng, đủ đọc một block hàm thông thường.

## Review trực tiếp

1. Mở URL code, nhập tên khách hàng trong preview và cuộn code. Chuyển lần lượt Đọc code → Thử giao diện → Đối chiếu: form, checkpoint, symbol, history và vị trí cuộn code giữ nguyên. Bấm Explorer hai lần để kiểm tra disclosure/scroll; kéo thanh chia hoặc focus thanh chia và dùng trái/phải.
2. Mở Thông tin preview rồi Escape: focus quay lại nút mở. Mô tả dài chỉ xuất hiện trong panel này; iframe chiếm phần còn lại. Bấm nhiệm vụ để xem hướng dẫn/kiểm chứng, Chạy thử để tự kiểm tra.
3. Mở cây 3.4, theo Props → PremiumSummary → formatMoney → Quay lại. Đổi chế độ, thu inspector, mở Tùy chọn và tìm symbol bằng bàn phím. Selection và quan hệ giữ nguyên khi resize.
4. Từ flow mở source: nút Quay lại flow nằm cạnh tiêu đề. Quay lại giữ event, đường đã đi và checkpoint. Tổng thể vẫn ẩn sub-step xây code.

## Kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| Typecheck / build | PASS: `npm.cmd run build`, gồm typecheck workshop và 29 checkpoint |
| Source / unit | PASS: 48/48, `npm.cmd test -- --fileParallelism=false --testTimeout=15000` |
| Bố cục trực tiếp | PASS ở 1440×900, 1920×1080 và vùng CSS tương đương zoom; chiều cao, ba chế độ, explorer, iframe/timeOrigin/form, source scroll, URL/history, thanh kéo bằng bàn phím, đóng Info trả focus, control preview đã thu không nhận focus |
| Zoom thật | PASS ở cả hai cửa sổ vật lý, Chrome Page zoom 125%, DPR 1,25; giữ code scroll/form/iframe, sub-step đang chọn, cây và Options/Escape |
| Cây / source | PASS: 3.4 Props → PremiumSummary → formatMoney → quay lại, URL/search, nguồn/đích, nhiều vị trí, source toàn file và range/diff, cây vật lý; cây hẹp mở inspector drawer |
| Mốc / nghiệp vụ | PASS: Field A–F, draft/input/điền mẫu, tính phí/lưu lỗi/thử lại/reload/GET/bảo vệ rời form; mẫu/tham chiếu/practice độc lập; chuyển tab/file cùng checkpoint không remount |
| Flow hồi quy | PASS: Lưu lỗi/retry/thành công, các nhánh Tính phí/Nhập sửa/Đọc/Rời form, history, mốc thiếu, pan/follow/resize/fullscreen, source ↔ flow |
| Mobile | PASS: 390/320 px, explorer mở đúng selection, mốc nhỏ và panel chạy thử vẫn truy cập được, không tràn trang |
| HMR | PASS: `npm.cmd run test:hmr`, sửa/quan sát/khôi phục trên bản sao QA; không reload hoặc đổi source gốc |
| Bảo toàn | PASS: 719/719 file hash không đổi; product sạch; `git diff --check`; không commit/push |
| Preview | HTTP 200, server cũ vẫn chạy tại localhost:3181 |

Browser: 37 kịch bản liên quan đã đạt (31 hồi quy, 6 bố cục mới). Các ca mở explorer mobile, focus/scroll cây desktop và bốn kích thước đọc code đã chạy lại sau sửa; giữ toàn bộ assertion. Control preview đã thu được kiểm tra cả truy cập theo role và chặn focus bằng trình duyệt. Giới hạn chạy browser 120 giây phù hợp các hành trình nhiều source; không đổi timeout assertion hoặc cấu hình mặc định. Unit dùng 15 giây cho ca đối chiếu source toàn bộ vai trò trên máy Windows này.

Bằng chứng đo, ảnh trước/sau, script zoom Chrome và hash bảo toàn ở `.verification/build-layout-20261031` (không đưa profile/dữ liệu QA vào Git).

Chỉ xác minh Chrome; chưa kiểm tra Firefox/Safari. Build còn cảnh báo chunk lớn đã có trước đợt này. Giữ preview ở port 3181 và dừng tại Chặng 1 để review.
