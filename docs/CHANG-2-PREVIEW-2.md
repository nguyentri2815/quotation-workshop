# Chặng 2 · Preview 2: validation và tính phí theo sản phẩm

> Lưu trữ phiên bản bài học cũ. Hành trình hiện hành: [Revision3](CHANG-2-REVISION-3.md). Source/ID lịch sử giữ nguyên; các kết quả dưới đây không thay thế người dùng review/đồng ý Product.

Triển khai và QA ngày 31/10–01/11/2026.

Tiếp nối [Preview 1](CHANG-2-PREVIEW-1.md); giữ thay đổi chưa commit. Đây là **quy tắc demo học tập, không phải quy tắc bảo hiểm thực tế**. Dừng để review, không commit/push và chưa mở API/storage cho B.

## Mở và thử

- [Product · tạo bản chào](http://localhost:3180/quotations/new).
- [Workshop · 2.1 validation](http://localhost:3181/?stage=2&version=1#checkpoint=s2-04-validation).
- [Workshop · 2.2 tính phí B](http://localhost:3181/?stage=2&version=1#checkpoint=s2-05-pricing).
- [Workshop · 2.3 nhất quán khi đổi/sửa](http://localhost:3181/?stage=2&version=1#checkpoint=s2-06-consistency).
- [Chạy mẫu Preview 2](http://localhost:3181/?stage=2&version=1&run=product-switch&runMode=demo#checkpoint=s2-06-consistency) · [Tự thao tác có hướng dẫn](http://localhost:3181/?stage=2&version=1&run=product-switch&runMode=guided#checkpoint=s2-06-consistency).
- [Chặng 1 giữ URL cũ](http://localhost:3181/#journey=2&step=3&sub=4&tab=build).

1. A mặc định → Điền mẫu → Tính phí: **1 tỷ / 365 ngày = 1.100.000 VND**.
2. Chọn B: tám giá trị draft giữ nguyên; phí A hết hiệu lực. Sau validation, lỗi Ngày kết thúc cập nhật ngay thành tối đa 180 ngày. Không tự sửa ngày/tiền.
3. Đặt Ngày kết thúc = Ngày bắt đầu +180 ngày lịch. Ví dụ **2024-02-01 → 2024-07-30** (180 ngày, qua năm nhuận). Tính B: **thuần 739.726, thuế 73.973, tổng 813.699 VND**.
4. Kết quả hiện tên, mã/phiên bản, tiền/hai ngày, tỷ lệ 0,15% và thời hạn 180 ngày đã dùng. Lưu vẫn khóa với giải thích “Lưu sản phẩm B được bổ sung ở mốc tiếp theo”. Submit trực tiếp cũng bị handler chặn.
5. Nhập số tiền 1.000.000 khi chọn B: lỗi ngay tại Số tiền bảo hiểm, giới hạn 10 triệu–50 tỷ. Chọn A: lỗi tiền biến mất vì A chấp nhận 1 triệu. Vẫn cần tính lại.
6. Sửa tiền/ngày hoặc chọn A ↔ B: phí cũ không dùng lại. Về A, đặt lại 1 tỷ / 365 ngày → tính lại → lưu mock → chi tiết → reload.

Ngày kết thúc của kịch bản chạy được tính bằng `Date.parse(start + 'T00:00:00Z') + days * 86400000`, không cộng một năm lịch. Bấm Điền mẫu luôn giữ ví dụ A365 để thấy rõ nhánh lỗi khi chuyển B.

## Phạm vi và trách nhiệm

| File / khu vực | Trách nhiệm |
| --- | --- |
| Product `quotation/products.ts` | Catalog là nguồn giới hạn/tỷ lệ; lookup từ chối mã lạ, không mặc định mã không hợp lệ thành A. |
| Product `quotation/types.ts` | Input A/B cho validation trên form và receipt phí tạm; contract `QuotationInput`/`Quotation` của API/storage vẫn chỉ A. |
| Product `quotation/rules.ts` | Một bộ validation chung nhận mã sản phẩm; công thức chung lấy rule từ catalog. Receipt giữ mã/phiên bản/tiền/hai ngày; kiểm tra hiệu lực dùng ngay khi hiển thị và lưu. |
| Product `pages/CreateQuotation.tsx` | Sở hữu lựa chọn/draft/lỗi/phí; cập nhật lỗi sau validation; xóa phí khi đổi/sửa; guard lưu B và phí không khớp. |
| Product `components/PremiumSummary.tsx` | Hiển thị kết quả và nguồn đầu vào đã tính, không chứa công thức. ProductInformation/hints dùng cùng catalog. |
| Product `mocks/storage.ts` | Tính lại A rõ ràng tại mock; parser vẫn từ chối B/mã lạ. Không thêm trường phiên bản hay schema lưu mới. |
| Workshop `checkpoints/s2-04-*` → `s2-06-*`, `stage2/` | Ba snapshot runnable, manifest/hash và AST index/range cùng source thật. `preview1-baseline.json` ghim metadata bốn mốc cũ. |
| Workshop `src/stage2/` | Bổ sung ba mốc, quan hệ ngay trên cây, full source/Diff/Flow có nhánh; tách thứ tự xây dựng khỏi thứ tự chạy. |
| Workshop `run/driver.ts`, `run/model.ts` | Thao tác DOM chọn sản phẩm/nhập ngày/tiền; quan sát lỗi, phí, disabled. Tái sử dụng phiên/API/storage riêng, history chỉ đọc. |

Không thêm thư viện, strategy engine, bản sao form/validation theo từng sản phẩm hoặc helper chờ nhiều mốc mới dùng. Chưa tạo starter Chặng 2; bài `src/practice` và tiến độ Chặng 1 được bảo toàn.

`validateDraft`, `validateAndBuildInput`, `calculatePremium` giữ default A cho các consumer Chặng 1 đã biết chỉ hỗ trợ A. Form truyền mã đang chọn rõ ràng; mã lạ truyền vào lookup/validation/formula bị từ chối. Mock A không đọc state chọn sản phẩm của form. API parse vẫn kiểm tra `BASIC_PROPERTY` trước khi validate/tính lại; B không được coi là A.

## Các mốc hình thành

| Mốc | Yêu cầu mới / dùng lại / thay đổi cùng consumer | UI và tiêu chí |
| --- | --- | --- |
| 2.1 | Dùng lại trường/lỗi chung/ngày lịch. Input validation cho A/B, lookup và rule giới hạn nối ngay `onBlur`/`validatedInput`. Công thức B chưa mở. | A365 tính/lưu như cũ. B365 lỗi Ngày kết thúc; B1 triệu lỗi Số tiền. B hợp lệ báo chưa nối tính phí, không giả thành công. |
| 2.2 | Dùng lại công thức/làm tròn; thay tham số cố định bằng catalog, nối ngay handler, receipt và presentation. | B1 tỷ/180 ngày ra 813.699; hiện sản phẩm/phiên bản/đầu vào/tỷ lệ. Giữ vô hiệu phí từ 1.3 và guard lưu B. |
| 2.3 | Dùng lại handlers/receipt; thêm phản hồi lỗi khi sửa/đổi sau validation và helper so mã/phiên bản/đầu vào, dùng ngay cho hiển thị/guard lưu. | B365 lỗi ngay khi chuyển từ A đã validation; B1 triệu → A xóa lỗi tiền đúng rule. Sửa tiền/ngày/chọn sản phẩm cần tính lại; không dùng receipt không khớp. |

Flow **Tính phí** có hai nhánh trong cùng hành vi: validation lỗi → lỗi tại trường → dừng; hợp lệ → công thức → receipt → state kết quả → presentation. Cây nối catalog → lookup → validation/công thức → consumer/handler → state → presentation; quan hệ là diễn giải source, không phải thứ tự runtime đã đo. Diff đối chiếu mốc trước; đọc toàn file với số dòng/range/highlight. Đổi tab/file/resize giữ iframe.

Generator chỉ kiểm tra và giữ nguyên bốn snapshot Preview 1, sau đó dựng ba mốc Preview 2 từ baseline ghim + Product cuối. Dev/build/test chỉ kiểm hash/index, không materialize hoặc viết bài người học. Lệnh chủ động: `npm.cmd run stage2:materialize`; cần Product đặt cạnh Workshop.

## Quan sát và kiểm chứng

DOM input/change/click, nội dung thông tin/phí/lỗi tại trường, disabled và MSW request/response là bằng chứng thực. Validation/hàm/setter/state/render/receipt bên trong chỉ là diễn giải source, chưa instrument. Mẫu kiểm chứng hiển thị A/B được đối chiếu trên DOM; không coi phép tính tham chiếu của driver là đo lời gọi hàm Product.

Phiên mẫu cuối chạy A365 → B giữ365 lỗi → sửa180 → tính B → thấy Lưu khóa → tiền dưới min lỗi → về A → đặt lại 1 tỷ/365 → tính A → B/sửa180/tính B → sửa179 làm phí hết hiệu lực. Mốc 2.1 chỉ chạy phần validation đã có; không trình diễn tính B. Chọn history không lặp hành động hay POST; thoát khôi phục review.

Đã kiểm tra bằng Node24.18.0 / npm11.16.0 / Chrome trên Windows:

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| Product unit | **28/28 đạt**: biên tiền/ngày A/B, lịch sai, định dạng/common validation, mẫu A/B, thứ tự làm tròn, receipt khác mã/phiên bản/tiền/ngày, mã lạ và API vẫn chỉ A. |
| Product Chrome | **6/6 đạt**: A/B/A giữ draft, B365 lỗi/180 tính đúng, B dưới min, đổi/sửa vô hiệu phí, guard submit B không POST, A lưu/lỗi/retry/reload, bàn phím/mobile. |
| Product typecheck/build | **Đạt** trên source cuối. |
| Workshop unit/source | **57/57 đạt**: bảy mốc hash/range, metadata Preview1 ghim, Stage1 baseline và parity toàn source Product cuối qua năm adapter nhúng công khai. |
| Workshop typecheck/build | **Đạt**, 29 checkpoint Chặng1 +7 Chặng2. |
| Workshop Preview2 Chrome | **8/8 đạt** trên source cuối: ba mốc có khả năng riêng; ba phiên mẫu có lỗi/hợp lệ/khóa B/history không POST; mobile/bàn phím/vùng code >60% chiều cao; từng cạnh mới chọn đúng full file/range/highlight và giữ iframe/draft. Ca toàn hành trình Chặng1 cũng đạt ở lượt kiểm tra cuối (gộp cùng bộ này: **9/9**). |
| Bảo toàn | **776/776 file bất biến giữ hash**, gồm 686 file Chặng1/practice/reference/sample/starter/solutions và 90 file snapshot Preview1. Manifest/index Chặng2 mở rộng; toàn bộ mapping/range/section Preview1 giữ nguyên. |

Bộ hồi quy dài Chặng1/Preview1: **68/71 đạt ở lượt đầu (19 phút)**. Ba ca chưa đạt đã chạy lại, giữ nguyên assertion: toàn bộ sáu bước/các bước con **1/1 đạt** trong bộ cuối; bố cục1536 **1/1 đạt**; phân tích bên trong file/iframe/history **1/1 đạt**. Cộng với tám ca Preview2, **79 ca Workshop đều có lượt xác minh đạt**, không phải một lượt đầy đủ 79/79 không retry. Đã kiểm tra FieldA–F, nhánh flow, lưu lỗi/retry/reload, lịch sử không POST, phiên riêng/khôi phục review, practice/progress/URL cũ và các kích thước320–1920px.

Lệnh kiểm tra: Product `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:browser`. Workshop `npm.cmd test -- --testTimeout=15000`, `npm.cmd run build`, `npm.cmd run test:browser -- --timeout=120000`. Có thể chỉ chạy mốc mới bằng `npm.cmd run test:browser -- tests/browser/stage2-preview2.spec.ts --output=.verification/preview2-results`. Khi chạy nhiều bộ browser song song, cần thư mục `--output` khác nhau; không materialize/sửa source phục vụ qua Vite trong lúc kiểm chứng browser.

Đã gặp và xử lý trong QA: hai bộ dùng chung trace gây ENOENT khi đóng browser; sinh snapshot/sửa source trong lúc hồi quy gây tải lại Vite và thiếu highlight tạm thời; một ca iframe chưa lên trong timeout5 giây. Các assertion được giữ nguyên, chạy lại trên source ổn định và output riêng; không coi lượt lỗi là đạt. Log/trace/ảnh chỉ ở `.verification/` hoặc `test-results/`, ngoài Git.

Giới hạn: chỉ xác minh Chrome, chưa xác minh Firefox/Safari hoặc zoom thật. Build còn cảnh báo import Vite config native thiếu đuôi file và chunk source/index khoảng **2.005 kB minified /288 kB gzip**. Chưa tối ưu chia tải trong preview này. Các kịch bản mới được tự động kiểm chứng ở chế độ chạy mẫu; hướng dẫn thao tác dùng chung engine và DOM listeners, chưa có bộ tự động thao tác hết kịch bản mới ở guided mode. Pause không hủy request đã gửi; đổi checkpoint chủ động mở form mới.

## Tiếp tục và dữ liệu

Preview còn **chưa lưu/đọc lại B**, chưa có version mới trong schema lưu, backend thật, auth, idempotency hoặc đồng bộ nhiều máy. Mốc sau mới thiết kế mã/phiên bản lưu, compatibility A cũ và mock tính lại theo phiên bản; không triển khai trước review.

Chạy mỗi repo trong terminal riêng: `npm.cmd ci`, `npm.cmd run dev -- --strictPort` (Product3180, Workshop3181). Không cần cài thư viện mới. Chưa commit/push preview nên `git pull` trên máy khác chưa mang các thay đổi này sang. Git lưu source/config/lockfile/tài liệu/kiểm thử; localStorage, draft, tiến độ/ghi chú và dữ liệu review thuộc trình duyệt. Không xóa hoặc đưa dữ liệu đó vào Git; nếu chuyển máy, dùng hướng dẫn xuất/import trong tài liệu bàn giao Chặng 1.
