# Chặng 2 · Preview 1: catalog, lựa chọn và nhất quán phí

> Lưu trữ phiên bản bài học cũ. Hành trình hiện hành: [Revision3](CHANG-2-REVISION-3.md). Source/ID lịch sử giữ nguyên; các kết quả dưới đây không thay thế người dùng review/đồng ý Product.

Ngày 31/10/2026. Người dùng đã chốt bộ quy tắc demo và yêu cầu triển khai preview đầu tiên trong cả hai repo. [Kế hoạch Chặng 2](CHANG-2-PLAN.md) đã chuyển thành đặc tả cụ thể. **Chưa commit/push trong lượt này; dừng để review.**

## Mở trực tiếp

- [Product · tạo bản chào](http://localhost:3180/quotations/new).
- [Workshop · 0 nhận yêu cầu](http://localhost:3181/?stage=2&version=1#checkpoint=s2-00).
- [1.1 catalog dùng ngay để hiển thị A](http://localhost:3181/?stage=2&version=1#checkpoint=s2-01-catalog).
- [1.2 selector / state / props](http://localhost:3181/?stage=2&version=1#checkpoint=s2-02-selection).
- [1.3 đổi sản phẩm an toàn](http://localhost:3181/?stage=2&version=1#checkpoint=s2-03-switch).
- [Phiên chạy mẫu A → B → A](http://localhost:3181/?stage=2&version=1&run=product-switch&runMode=demo#checkpoint=s2-03-switch).
- [Phiên tự thao tác có hướng dẫn](http://localhost:3181/?stage=2&version=1&run=product-switch&runMode=guided#checkpoint=s2-03-switch).
- [Chặng 1, URL cũ giữ nguyên](http://localhost:3181/#journey=2&step=3&sub=4&tab=build).

Chọn Chặng học trên header để chuyển chặng. `journey=2` vẫn là phiên bản hành trình Chặng 1. Chặng 2 có `stage=2&version=1`, ID checkpoint `s2-*`, manifest/index riêng trong `stage2/`.

## Thử A → B → A

1. Mặc định A, BASIC_PROPERTY / v1. Điền mẫu → Tính phí: một tỷ / 365 ngày = **1.100.000 VND**.
2. Chọn B, EXTENDED_PROPERTY / v1. Thông tin đổi ngay: **10 triệu–50 tỷ VND, 1–180 ngày, 0,15% năm, thuế demo 10%**. Tên/điện thoại/email/tài sản/địa chỉ/số tiền/hai ngày giữ nguyên. Phí cũ hết hiệu lực; Tính phí và Lưu bị khóa.
3. Nhãn **Chưa nối tính phí trong mốc này** và giải thích nằm cạnh vùng hành động. Không sửa draft để ép hợp lệ theo B. Validation/công thức/lưu B chưa được triển khai, API/schema vẫn chỉ lưu A như Chặng 1.
4. Chọn lại A: chưa được lưu bằng phí cũ. Tính lại → Lưu → chi tiết → reload/mở lại.
5. Trong Workshop mở Phụ thuộc, theo catalog → selector → changeProduct → setPremium(null) → PremiumSummary. Cây dùng đúng file/definition; đích mở đúng source/range và cuộn tới đoạn liên quan.
6. Chạy thử: phiên riêng đi A → B → A; mở Lịch sử, chọn bản ghi cũ rồi Về trực tiếp. Chọn lịch sử chỉ thay vùng đọc/highlight, không làm lại nghiệp vụ. Thoát quay về iframe/form/source/scroll của review.

Các thông số là **dữ liệu demo học tập, không phải quy tắc bảo hiểm thực tế**. Mốc 1.2 chủ động tạm khóa tính/lưu cả hai sản phẩm để chỉ học selector/state trước khi nối nhất quán ở 1.3; không giả báo thành công trong trạng thái trung gian.

## File và trách nhiệm

| Phần | Thay đổi / lý do |
| --- | --- |
| Product `src/quotation/products.ts` | Contract và catalog tối thiểu A/B, version/rule metadata; chưa tạo framework cấu hình hoặc schema lưu B. |
| Product `src/pages/CreateQuotation.tsx` | State mã lựa chọn, tìm product, changeProduct giữ draft/xóa premium, guard A/B trong calculate/save và điều kiện nút. |
| Product `src/components/ProductInformation.tsx` | Trình bày thông tin/selector qua props; không tính phí hoặc lưu. |
| Product `FixedInformation`, `PremiumSummary`, `quotation/format.ts`, CSS | Hiển thị tên/rate tương ứng, định dạng tỷ lệ dùng ngay; giữ nguyên công thức/validation/API/storage A. |
| Workshop `src/stage2/` | Bốn mốc, cây chức năng/quan hệ và workspace Chặng 2. Dùng lại CodeBlock, SourceTree, layout, engine/controls phiên chạy. |
| Workshop `scripts/materialize-stage2.mjs`, `index-stage2.mjs` | Tái dựng snapshot từ baseline ghim + Product; index/hash bằng analyzer AST/CSS hiện có. Dev/build/test chỉ kiểm tra/index, không tự materialize. |
| Workshop `checkpoints/s2-*`, `stage2/` | Source chạy và source đọc cùng snapshot, có manifest/hash/range riêng. Chỉ năm adapter nhúng công khai cho router/worker/API/storage. |
| Workshop `run/driver.ts`, `run/model.ts` | Bổ sung quan sát/chọn sản phẩm trong phiên riêng; không đổi danh mục kịch bản Chặng 1. |

Source Chặng 1 không đổi. Unit đối chiếu Chặng 1 giờ dùng hash/release ghim thay vì yêu cầu Product hiện tại phải đứng yên ở Chặng 1. Unit Chặng 2 đối chiếu toàn bộ snapshot cuối với Product thực tế sau khi đảo adapter nhúng. Chưa tạo starter Chặng 2; `src/practice` vẫn là bài người học Chặng 1 nguyên trạng.

## Bằng chứng và diễn giải

**Quan sát thật:** DOM input/change/click, thông tin A/B, tám giá trị draft, vùng phí, disabled, UI đã lưu và request/response/status MSW nếu có. Phiên A → B → A không cần POST; thao tác lưu/reload A được kiểm tra riêng.

**Diễn giải source:** lựa chọn → setter/state → consumer → props/render, lời gọi guard/helper, persistence bên trong. Chưa instrument React state/hàm/render/storage và không tạo nhật ký giả cho chúng. Đường quan hệ trên cây không phải thứ tự runtime đã đo.

QA Product có một phép gọi callback onClick thực qua prop React để kiểm tra guard B: React tự chặn click khi prop disabled=true dù sửa thuộc tính DOM. Đây là phép thử riêng có kiểm soát, **không** được coi là instrumentation của Chạy thử Workshop. Guard save còn được thử qua submit trực tiếp, không có POST.

## Kiểm tra thực tế

| Kiểm tra | Kết quả phiên này |
| --- | --- |
| Product unit | **20/20 đạt**. |
| Product Chrome | **6/6 đạt**, gồm bốn ca Chặng 1 và hai ca mới: giữ mọi input A/B/A, mất hiệu lực, guard tính/lưu B, tính lại/lưu/reload A, bàn phím/mobile và không ép tiền/ngày. |
| Product typecheck/build | **Đạt**. |
| Workshop unit/source | **57/57 đạt**, gồm hash/range bốn mốc, release Chặng 1, parity toàn Product cuối mốc và các liên kết/khả năng của phiên chạy. |
| Workshop typecheck/build | **Đạt**, cả 29 checkpoint Chặng 1 và bốn checkpoint Chặng 2. |
| Workshop Chrome | **71/71 đạt** (14,9 phút): toàn bộ 64 ca Chặng 1 và 7 ca Chặng 2; baseline/catalog/selector/switch, cây/range, phiên mẫu/hướng dẫn, history không POST, khôi phục review, desktop/mobile và A lưu/GET/reload. Sau chỉnh picker source cuối cùng, chạy lại ca cây/range/iframe: **1/1 đạt**, gồm symbol `setPremium(null)` và node đang chọn nằm trong vùng đọc. |
| Bảo toàn | **686/686 file được bảo vệ giữ nguyên hash**: snapshot/manifest/index Chặng 1, sample, practice, reference, starter và solutions. |

Đã xử lý trong quá trình kiểm tra: tên truy cập selector rõ ràng; đọc fixture JSON có BOM mà không đổi byte ghim; cleanup auto-start để link phiên chạy làm việc đúng dưới React Strict Mode; ca kiểm tra chuyển chặng đợi điều hướng thực hoàn tất trước khi điều hướng tiếp. Không giảm assertion để báo đạt.

Lệnh kiểm tra: Product `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:browser`; Workshop `npm.cmd test -- --testTimeout=15000`, `npm.cmd run build`, `npm.cmd run test:browser -- --timeout=120000`. `npm.cmd run test:hmr` dùng cache riêng của bản sao QA theo sửa lỗi Chặng 1.

Ảnh/log/trace QA chỉ nằm trong `.verification/` và `test-results/`, ngoài Git; không đọc hồ sơ Chrome cá nhân hoặc xóa dữ liệu review. Snapshot có namespace `quotation-workshop.stage2.checkpoint.<id>.v1`; phiên mẫu tiếp tục dùng namespace run riêng theo UUID + checkpoint. Bố cục Chặng 2 dùng key riêng, không ghi key layout/tiến độ Chặng 1.

## Giới hạn và mốc tiếp

Chỉ xác minh Chrome; các kích thước CSS không thay thế kiểm tra zoom browser thật/Firefox/Safari. Build còn cảnh báo chunk source/index lớn (khoảng 1.675 kB minified / 238 kB gzip) và import config native thiếu đuôi file; chưa tối ưu chia tải trong preview này. Chưa tự chạy/chấm bài người học, chưa lưu B hoặc productVersion mới, chưa thêm backend/idempotency/đồng bộ nhiều thiết bị. Đổi checkpoint chủ động khởi tạo lại form; đổi file/tab/resize giữ iframe. Pause không hủy request đã gửi.

Sau review: nối validation và tính phí theo sản phẩm, cùng consumer/UI lỗi/kết quả trong từng mốc; tiếp đó mới nối lưu/đọc lại mã + phiên bản và tương thích dữ liệu A cũ theo [kế hoạch](CHANG-2-PLAN.md). Không triển khai các phần tiếp theo trong lượt preview đầu tiên này.
