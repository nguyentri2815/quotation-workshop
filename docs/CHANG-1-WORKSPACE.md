# Chặng 1 · workspace đọc flow và cây phụ thuộc

Ngày 31/10/2026. Chỉ thay giao diện và điều hướng workshop. Practice, reference, starter, solutions, sample, checkpoint và repo sản phẩm được bảo vệ bằng hash. Không đổi khóa dữ liệu/tiến độ; không commit/push; dừng ở Chặng 1.

- [Flow Lưu bản chào](http://localhost:3181/#journey=2&step=5&sub=5&tab=overview&overviewMode=runtime&runtimeFlow=save).
- [Cây phụ thuộc 3.4 · Props](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props).

Tổng thể ẩn thanh sub-step và footer hành trình. Hai chế độ cấu trúc/hành vi giữ selection xây code. Xem source dùng đúng checkpoint hiện tại; Xem cách xây sang sub-step hình thành và có nút quay lại flow, khôi phục checkpoint/event/scenario/path. Đổi checkpoint chủ động khởi tạo lại form preview theo cơ chế hiện có, không xác nhận hoàn thành.

Flow dùng vùng làm việc theo viewport: toolbar ngoài vùng cuộn, canvas độc lập với inspector. Inspector hẹp chuyển vùng Sơ đồ/Chi tiết sự kiện; toàn màn hình mở cả hai, Escape và nút thoát trả focus. Các panel và iframe giữ nguyên khi resize, thu/mở, đổi tab và toàn màn hình.

Tình huống bắt đầu là panel với thẻ chọn; hành vi dùng menu có tên/mô tả, hoặc chips khi đủ rộng. Thông tin về flow mặc định đóng. Tại điểm rẽ chưa có điều kiện, Tiếp tục thành Chọn nhánh và focus vùng lựa chọn đầu inspector. Thẻ thể hiện điều kiện, đích và khả dụng theo checkpoint. Chọn nhánh chỉ đổi diễn giải; Chỉ trên preview/Cách tự thử vẫn riêng. Đổi nhánh cắt phần history phía sau; retry ghi occurrence mới và chờ chọn kết quả mới.

Toàn luồng Fit View chỉ khi bấm. Đến sự kiện đưa node vào vùng nhìn. Theo sự kiện chỉ pan khi cần, giữ zoom đọc được. Pan/zoom thủ công tạm dừng follow; Theo tiếp sự kiện bật lại. Viewport/follow lưu theo flow trong sessionStorage (có fallback bộ nhớ khi storage bị chặn). Event/scenario/path mỗi flow giữ trong phiên giao diện; URL giữ selection và history hiện tại cho reload/Back/Forward. Resize và quay lại tab không tự căn viewport.

Graph giữ topology đầy đủ để đối chiếu các nhánh chưa hình thành; node thiếu source có viền đứt và nhãn. Nếu event đang chọn không còn khả dụng tại checkpoint, inspector nói rõ, giữ lịch sử để đối chiếu và chặn tiến tiếp. Banner chỉ báo đủ luồng khi mọi event/source bắt buộc đều khả dụng, dùng cùng mapping checkpoint; chọn hành vi không đổi mốc.

Cây phụ thuộc ưu tiên diện tích đọc: sub-step một hàng, nhiệm vụ một câu và nút mở chi tiết, toolbar phạm vi/tìm symbol/Tùy chọn. Tìm symbol mở tổ tiên, cuộn và highlight; URL dependencyNode cũ vẫn dùng được. Cây/inspector khởi đầu 65/35, có thanh kéo riêng, có thu inspector và chuyển drawer khi vùng giữa dưới 800 CSS px. Cách đọc, phần tương lai, metadata và mô tả các bước thu vào Tùy chọn/disclosure. Quan hệ trực tiếp hiện ở đầu inspector.

## Review trực tiếp

1. Flow Lưu: Bắt đầu → Tiếp tục → Chọn nhánh → đủ điều kiện → POST → request lỗi. Tới catch, mở source và cuộn inspector. Toolbar giữ nguyên; graph không dịch do cuộn. Sự kiện trước/Tiếp tục vẫn bấm được. Tới retry rồi gửi lần mới, chọn các nhánh thành công; Đổi nhánh cắt đúng đoạn sau điểm rẽ.
2. Pan hoặc zoom canvas: Theo tiếp sự kiện xuất hiện. Đi event khác giữ viewport; bật lại follow chỉ pan cần thiết. Kéo thanh preview, thu/mở, mở toàn màn hình rồi Escape: event/branch/history/checkpoint và zoom giữ nguyên. Đổi hành vi rồi quay lại khôi phục viewport cùng đường đọc của flow đó.
3. Xem source rồi Quay lại flow: giữ form tại cùng checkpoint. Xem cách xây mở sub-step của event; quay lại khôi phục ngữ cảnh flow. Khi mốc thay đổi có thông báo form khởi tạo lại.
4. Cây 3.4: Props → PremiumSummary → formatMoney → Quay lại lựa chọn trước. Thử tìm formatMoney bằng bàn phím, chọn vị trí tham chiếu, code nguồn/đích, URL/Back/Forward và resize. Preview rộng dùng drawer để cây còn đủ chỗ.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| Typecheck / build | PASS: `npm.cmd run build` chạy typecheck workshop và cả 29 checkpoint trước Vite; Vite 37,97 giây |
| Source / unit | 48/48, 8 file: `npm.cmd test -- --fileParallelism=false --testTimeout=15000` |
| Browser | 43 kịch bản đã chạy đạt. Lượt đầy đủ: 39 đạt, 4 chạm giới hạn tổng 40 giây; `npx.cmd playwright test --last-failed --timeout=120000`: cả 4 đạt, 2,7 phút. Giữ toàn bộ assertion |
| Nghiệm thu tương tác | PASS: flow Lưu lỗi/retry/thành công, đổi nhánh/cắt history, scroll inspector giữ toolbar/graph, source ↔ flow, checkpoint thiếu và chuyển mốc chủ động |
| Canvas / preview | PASS: pan vừa đủ, manual pan/zoom tạm dừng follow, bật lại, khôi phục theo flow, resize bằng chuột/phím, thu/mở, fullscreen/Escape giữ ngữ cảnh và iframe |
| Cây 3.4 | PASS: Props → PremiumSummary → formatMoney → quay lại; tìm symbol bằng bàn phím, tổ tiên/scroll/highlight, nguồn/đích và bốn vị trí formatMoney |
| Kích thước | Desktop 1440×900, 1920×1080; preview rộng/thu; mobile 390/320; Chrome zoom 125% thật qua Settings trong profile QA |
| Zoom 125% | Cửa sổ 1440×900: CSS viewport 1138×643, DPR 1,25, không tràn ngang; cây khoảng 251 CSS px, inspector drawer; giữ iframe/form qua thu/mở và fullscreen |
| Field / nghiệp vụ | PASS: Field A–F; cuối chặng tính/lưu/reload/GET/bảo vệ rời form; namespace mẫu/tham chiếu/practice độc lập |
| HMR | PASS: `npm.cmd run test:hmr`, sửa/quan sát/khôi phục ở bản sao QA, không reload và không đổi source gốc |
| Bảo toàn / Git | 719/719 file được bảo vệ giữ nguyên hash; product sạch; `git diff --check` đạt; không commit/push |
| Preview | HTTP 200 tại localhost:3181; giữ dev server đang chạy |

Ca đối chiếu toàn bộ vai trò/source vượt giới hạn mặc định 5 giây trên máy này, nên lượt unit cuối dùng 15 giây; không đổi assertion hoặc cấu hình timeout mặc định của repo. Các browser case dài kiểm tra nhiều dòng/source/Field; timeout chạy lại là giới hạn toàn kịch bản, không nới assertion. Riêng kịch bản validation có thêm thao tác mở panel, tăng giới hạn tổng của ca lên 60 giây.

Bằng chứng QA nằm tại `.verification/workspace-20261031`, gồm ảnh desktop/mobile, script review/zoom, `chrome-125-result.json` và hash bảo toàn. Browser dùng profile riêng, không truy cập profile hay dữ liệu người học.

## Giới hạn còn lại

Chỉ xác minh Chrome, chưa kiểm tra Firefox/Safari. Build còn cảnh báo chunk workshop lớn (1.231,61 kB minified / 191,77 kB gzip), đã có trước đợt này. Graph vẫn là diễn giải hữu hạn từ source, không phải live trace. Viewport lưu trong phiên; lịch sử các flow khác giữ trong giao diện đang mở, URL lưu đường đọc hiện tại. Đổi checkpoint chủ động vẫn khởi tạo lại form preview theo cơ chế cũ.

Giữ preview ở port 3181 và dừng tại Chặng 1 để review.
