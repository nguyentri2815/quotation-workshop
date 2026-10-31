# Chặng 1 · đối chiếu source và nghiệm thu điều hướng

Ngày kiểm tra: 30/10/2026. Phạm vi chỉ workshop Chặng 1. Repo `../quotation-product` chỉ đọc; không commit/push, không triển khai Chặng 2.

## Nguồn kiểm chứng và bản khôi phục

Đã đọc cây `src` và source thực tế của sản phẩm, gồm App/main, ba page, bốn component, hai stylesheet, types/rules/format, API và mock/storage. Không suy mapping từ README hay tên trong ảnh. Test đối chiếu đọc lại source sản phẩm trên đĩa.

Source runtime có **18 file**. Hai file `src/quotation/rules.test.ts`, `src/mocks/storage.test.ts` là test của sản phẩm, không phải source chạy ứng dụng nên không nằm trong cây học. Không sao chép node_modules, dist, test-results hoặc Git vào snapshot. Cây cuối có 18 file ứng dụng và **3 file nhúng riêng** (`_workshop/environment.ts`, `_workshop/tools.ts`, `index.html`).

Trước sửa đã tạo và kiểm tra SHA-256 từng file của bản khôi phục:
`../quotation-workshop-recovery-20261030-012002/` (1.438 file, gồm checkpoint, reference, bài học, scripts, legacy solutions và metadata cũ). `recovery-manifest.json` ghi hash workshop; `product-readonly-hashes.json` ghi hash repo sản phẩm trước sửa. Log đang ghi, dependencies, build/test output và Git được loại khỏi bản khôi phục.

Nguồn sản phẩm ghim nguyên văn tại `sample/product/`; `sample/product-source.json` chứa hash 18 file. `reference-source.json` cũ vẫn là hồ sơ lần đọc trước, không dùng nó để kết luận parity lần này.

## Bảng đối chiếu

Trong bảng, `<cp>` là thư mục `checkpoints/11` hoặc `checkpoints/12`. Reference có cùng đường dẫn tương đối dưới `src/reference`.

| File sản phẩm | File mẫu/checkpoint | Khác biệt phát hiện | Xử lý |
| --- | --- | --- | --- |
| `src/App.tsx` | `<cp>/App.tsx` | Checkpoint cũ chạy `PracticeApp.tsx` với layout riêng | Dùng đúng Layout, NotFound, router của sản phẩm; chỉ BrowserRouter → HashRouter để nhúng |
| `src/main.tsx` | `<cp>/main.tsx` | Main cũ bootstrap starter | Dùng main sản phẩm; workerOptions và mountTools nhập từ `_workshop` |
| `src/pages/CreateQuotation.tsx` | `<cp>/pages/CreateQuotation.tsx` | Cũ tách FormFields, dùng PremiumPanel, tên ref/response khác, có vùng debug trong component | Cuối chặng **nguyên byte sản phẩm**: Field nội bộ, inputProps, saveInFlight, quotation, các vùng JSX và hai effect đúng source |
| `src/pages/QuotationList.tsx` | `<cp>/pages/QuotationList.tsx` | Cũ dùng layout và component phụ khác | Nguyên byte; GET, loading/error/empty/retry, Link theo ID |
| `src/pages/QuotationDetail.tsx` | `<cp>/pages/QuotationDetail.tsx` | Cũ dùng PremiumPanel và cách trình bày riêng | Nguyên byte; GET theo useParams, 404, dữ liệu reload qua API |
| `src/components/PremiumSummary.tsx` | `<cp>/components/PremiumSummary.tsx` | Cũ có PremiumPanel, định dạng tiền đặt sai ranh giới | Nguyên byte; chỉ trình bày Premium/null/stale, import formatMoney |
| `src/components/FixedInformation.tsx` | `<cp>/components/FixedInformation.tsx` | Thiếu trong cây mẫu cũ | Nguyên byte; scaffold từ 00, không giả tạo ở bước 3 |
| `src/components/AsyncMessage.tsx` | `<cp>/components/AsyncMessage.tsx` | UI đọc cũ không dùng đúng component này | Nguyên byte; scaffold từ 00 |
| `src/components/Icon.tsx` | `<cp>/components/Icon.tsx` | Thiếu trong cấu trúc starter | Nguyên byte; scaffold từ 00 |
| `src/components/ui.module.css` | `<cp>/components/ui.module.css` | Cũ dùng practice.module.css | Nguyên byte stylesheet sản phẩm; scaffold từ 00 |
| `src/styles.css` | `<cp>/styles.css` | Cũ dùng base.css | Nguyên byte; scaffold từ 00 |
| `src/quotation/types.ts` | `<cp>/quotation/types.ts` | Cần đối chiếu từng model, không chỉ tên file | Nguyên byte từ bước 2; trước đó là module rỗng đã có sẵn |
| `src/quotation/rules.ts` | `<cp>/quotation/rules.ts` | Cần đồng bộ validation, phí, parser và range | Nguyên byte sau 07-contract; trước đó thêm nhóm khai báo theo AST |
| `src/quotation/format.ts` | `<cp>/quotation/format.ts` | Cũ gộp formatMoney vào PremiumPanel | Nguyên byte; module định dạng có sẵn từ scaffold |
| `src/api/quotations.ts` | `<cp>/api/quotations.ts` | Endpoint sản phẩm không thể dùng chung trong workshop | Giữ logic request/response; thay endpoint bằng apiBase riêng |
| `src/mocks/handlers.ts` | `<cp>/mocks/handlers.ts` | Cũ ghép cờ thử lỗi vào handler nghiệp vụ | Giữ handler sản phẩm, chỉ đổi apiBase; lỗi once chuyển sang host `_workshop` |
| `src/mocks/storage.ts` | `<cp>/mocks/storage.ts` | Khóa dữ liệu phải độc lập | Giữ logic seed/read/create/persist; STORAGE_KEY nhận storageKey của adapter |
| `src/mocks/browser.ts` | `<cp>/mocks/browser.ts` | Cần kiểm tra worker thật dùng handler cùng mốc | Nguyên byte; worker scope được main truyền qua adapter |
| Không có trong sản phẩm | `<cp>/_workshop/*`, `<cp>/index.html` | Host, probe, lỗi thử nghiệm, scope/namespace | Tách thư mục, nhãn “Riêng workshop”; không được tính là component sản phẩm |

**13/18 file cuối chặng trùng byte sản phẩm; 5/18 có khác biệt nhúng hữu hạn như bảng.** Test đảo riêng năm adapter rồi so toàn bộ nội dung với sản phẩm; không bỏ qua code nghiệp vụ. Reference dùng cùng nguồn ghim và cùng adapter. Source viewer đọc chính các file mà entrypoint preview chạy, không có source rút gọn khác bản chạy.

## Tái dựng các bước

`scripts/sample-source.mjs` dùng TypeScript AST để thay khai báo/JSX ở các mốc trước; không cắt block bằng regex. `scripts/reconstruct-checkpoints.mjs` tạo toàn bộ snapshot/manifest và reference từ source ghim. `scripts/checkpoint-plan.mjs` giữ 22 ID, sắp thứ tự theo sáu bước hành vi và ánh xạ các bước con mới. Đây là trình tự giảng dạy tái dựng, không phải lịch sử Git.

- 00: main/router, UI primitives/CSS/format, mock worker và các file module/page rỗng có sẵn. Handler trả 501 thật.
- 01: đổi chữ thương hiệu trong Layout. Bài starter cũ vẫn thử HMR bằng practiceTitle.
- 02: thêm mô hình trong types.ts có sẵn.
- 03-fields: dựng đầy đủ màn hình tĩnh bằng Field trong CreateQuotation, các section/input/phí/nút; fieldset khóa và có giải thích. Đặt trước 02 để bước 1 kết thúc bằng màn hình nhìn thấy được.
- 03: nối input/draft/sample trong bước 2. 03-summary được chuyển vào bước 3, sau validation và công thức, ngay trước khi ghép calculate; PremiumSummary nhận null có nhãn chưa có phí, không giả kết quả tính.
- 04-rules → 04: thêm validation rồi nối vào form; 05-rules → 05: thêm công thức rồi nối calculate.
- 06-rules → 06: thêm so đầu vào rồi xóa phí cũ trong updateDraft.
- 07-contract → 07-client → 07: parser, client, probe của workshop. Form chưa gửi API.
- 08-storage → 08: storage rồi handler sản phẩm; 09: nối save vào form trong bước 5. Mốc 09/10-list dùng biên nhận POST tạm có công khai: save truyền receipt; trang scaffold kiểm tra parseQuotation và ID trước khi hiển thị số/khách hàng/phí. Không có receipt đúng thì không báo lưu thành công. Tới mốc 10 bỏ adapter biên nhận, dùng GET detail; cuối chặng không có khác biệt nghiệp vụ này.
- 10-list → 10: đọc danh sách/chi tiết; 11: blocker, beforeunload và dialog; 12: cùng code nghiệp vụ với 11 để giải thích.

`solutions/` và `starter/practice/` được giữ để người học đang theo cấu trúc cũ tiếp tục làm; không còn dùng chúng để sinh mẫu chuẩn. Đọc [hướng dẫn chuyển đổi riêng](STARTER-CU-CHUYEN-DOI.md). `src/practice` không di chuyển, không ghi đè.

## Cây, toàn file và phân tích

File đang mở có nền xanh rõ, viền trái 5px, icon mắt và “Đang xem”. Liên quan có nền nhạt và icon liên kết; trạng thái Mới/Đã sửa có badge riêng, so với checkpoint trước, không phải Git. Cây giữ tất cả file tại mốc. Chọn file mở tổ tiên và chỉ scroll container cây; render lại không kéo người đang cuộn.

Trước/Sau mặc định toàn file với số dòng thật. Chọn nhóm chỉ đổi range highlight và vị trí khung code. Diff giữ toàn bộ ngữ cảnh, số dòng old/new và +/−. File/nhóm chưa có hiện thông báo, không fallback đầu file. Chọn file/tab không đổi checkpoint và không remount iframe cùng mốc.

“Bên trong file” có lời giải riêng theo file. TypeScript AST xác định imports, model, state/ref, derived values, effects, helper/handler, request, JSX, export. PostCSS được khai báo trực tiếp làm parser CSS; HTML scaffold có metadata kiểm tra nội dung/hash. Metadata đặt ngoài source. Nhóm nhiều range có danh sách vị trí và Tiếp vị trí, chỉ highlight vị trí đang chọn. Liên kết quan hệ giữ history và có nút quay lại. Màn hình đủ rộng đặt panel cạnh code; khung code dưới 900px dùng drawer đóng sau khi chọn.

URL lưu file, symbol hoặc section/position, tab, Trước/Sau và chế độ preview. Các alias đã khảo sát cho PracticeApp/PremiumPanel/FormFields/ApiProbe có thông báo chuyển nghĩa; không sửa bài cũ. URL file/symbol/nhóm không hợp lệ được báo rõ. Digest nằm trong mục kỹ thuật thu gọn.

## Bảo toàn và giới hạn

Giữ nguyên key tiến độ cũ `quotation-workshop.guide.v1` (chỉ đọc tham khảo); tiến độ sáu bước mới dùng `quotation-workshop.behaviors.v2`, không kế thừa dấu hoàn thành cũ. Giữ nguyên bài học `quotation-workshop.practice.v1`, reference và các key checkpoint `.v1` hiện có. Không migrate/reset dữ liệu; dữ liệu lỗi vẫn được storage báo lỗi và giữ nguyên. Test trình duyệt dùng context mới, không dùng profile người học. Kiểm tra HMR/journey chỉ ghi vào bản sao `.verification`.

Mẫu là bản ghim tại lần khảo sát này; sản phẩm đổi sau đó cần một lần đối chiếu và tái dựng có kiểm soát. Chưa có tự di chuyển bài học, tự chấm bài hoặc đồng bộ dữ liệu nhiều tab/thiết bị. Bộ journey legacy kiểm tra tính tương thích starter cũ, không phải bằng chứng parity của mẫu chuẩn. Các kiểm tra parity và trình duyệt checkpoint chịu trách nhiệm cho mẫu chuẩn.

Kết quả lệnh và hash bảo toàn cuối cùng được ghi trong `CHANG-1-VERIFICATION.md`. Dừng ở Chặng 1 để người dùng review.
