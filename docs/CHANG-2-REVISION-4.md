# Chặng 2 · Revision 4: nhịp học và code nhiều dòng

Revision hiện hành dùng nguyên Product ghim `stage2/product-r3.json`: commit nền `83faf6641b66aff178b08cae8877f5397134186a`, kèm working tree thực tế, SHA-256 `3d2849fa4e88d301047c39878d421d2f535677cb01fcd8b40d7b76f43f1e43f9`. Không thay nghiệp vụ hoặc thiết kế Product. [Quy trình biên soạn](PRODUCT-WORKSHOP-WORKFLOW.md) vẫn áp dụng; test/báo cáo không thay thế đồng ý của người dùng.

- [Bắt đầu từ baseline](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-00&tab=build).
- [Bắt đầu chuỗi nhỏ Catalog A](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-contract&tab=build).
- [Theo catalog từ định nghĩa đến UI](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-catalog&tab=build).
- [Tính phí, các điểm thay đổi so với Chặng 1](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate&runtimeEvent=validate&compareChanges=true).
- [Flow mới chọn/đổi sản phẩm](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=product&runtimeEvent=choose&compareChanges=true).

Giữ năm bước lớn ở sidebar và thanh sub-step Trước/Tiếp luôn ở đầu vùng học. Mỗi lần chuyển sub-step mở đúng file/symbol mới; có thể tự khám phá rồi bấm “Về nhiệm vụ hiện tại”. “Chi tiết nhiệm vụ” trả lời vì sao, nguồn dữ liệu, file tạo/sửa, consumer, thay đổi source và UI. Baseline là quan sát; các sub-step xây code có snapshot riêng, không dùng lại một ảnh/source hoàn chỉnh để giả lập quá trình.

## Bảng sub-step / source / UI

ID trong bảng là hậu tố sau `s2-r4-`. Mỗi link mở đúng checkpoint source và preview của chính mốc đó. Cột source là những file thực sự thêm/sửa so với mốc trước; `_workshop` là adapter, không phải bài nghiệp vụ.

| Sub-step | Source mới/sửa và focus | UI / phạm vi có thể thử |
| --- | --- | --- |
| [Quan sát sản phẩm cố định ở Chặng 1](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-00&tab=build) | Bản sao baseline mới được format; Chặng 1 gốc giữ nguyên. · focus `FixedInformation` | Form A của Chặng 1; chưa có /products. |
| [A · Contract: type khác dữ liệu runtime](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-contract&tab=build) | `quotation/products.ts` · focus `PropertyProduct` | UI giữ nguyên form A; kiểm tra bằng npm run typecheck. |
| [B · Khai báo một sản phẩm A](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-data&tab=build) | `quotation/products.ts` · focus `basicProperty` | Form baseline giữ nguyên; không có thẻ sản phẩm mới. |
| [C · Import và render một sản phẩm](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-page&tab=build) | `App.tsx`, `pages/SelectProduct.tsx` · focus `SelectProduct` | /products chỉ có tên và mô tả A; chưa có B, tiêu đề trang hoặc nút. |
| [D · Catalog A/B và consumer map](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-catalog&tab=build) | `pages/SelectProduct.tsx`, `quotation/products.ts` · focus `propertyProducts` | /products có hai article tên/mô tả, chưa có presentation hoặc action. |
| [E1 · Tiêu đề và chỉ dẫn trang](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-heading&tab=build) | `pages/SelectProduct.tsx` · focus `SelectProduct.jsx.pageHeading` | Có tiêu đề Chọn sản phẩm; hai article vẫn chưa thành card/grid. |
| [E2 · Trình bày nội dung thẻ](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-cards&tab=build) | `components/ui.module.css`, `pages/SelectProduct.tsx` · focus `SelectProduct.jsx.card` | Hai thẻ nội dung xếp dọc, chưa có grid/action. |
| [E3 · Bố cục catalog](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-layout&tab=build) | `pages/SelectProduct.tsx` · focus `SelectProduct.jsx.productGrid` | Grid hai thẻ theo kích thước preview; chưa có nút tạo. |
| [E4 · Nút tạo chưa nối route](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-actions&tab=build) | `pages/SelectProduct.tsx` · focus `SelectProduct.jsx.primaryButton` | Presentation khớp trang chọn; cả hai nút bị khóa. |
| [F1 · Truyền, đọc và kiểm tra mã qua URL](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-route&tab=build) | `App.tsx`, `pages/SelectProduct.tsx` · focus `QuotationEntry` | Chọn A/B mở đúng tên/mô tả tại route nhận; chưa hiện form. Thiếu/sai mã xử lý theo thiết kế đích. |
| [F2 · Props → state → ngữ cảnh form](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-entry&tab=build) | `components/ProductInformation.tsx`, `pages/CreateQuotation.tsx`, `pages/SelectProduct.tsx`, `quotation/format.ts` · focus `CreateQuotation.product` | A/B mở đúng form/ngữ cảnh. A tính được; B và lưu chưa nối. |
| [A · Mở và đóng panel](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-panel-open&tab=build) | `components/ProductInformation.tsx`, `pages/CreateQuotation.tsx` · focus `ProductInformation.panel` | Panel mở/đóng, không đổi sản phẩm, draft hoặc phí. |
| [B · Lựa chọn tạm và hủy](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-candidate&tab=build) | `components/ProductInformation.tsx` · focus `ProductInformation.candidate` | Chọn B trong panel rồi hủy vẫn là A; mở lại reset về A. |
| [C · Xác nhận, áp dụng và vô hiệu phí](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-panel&tab=build) | `components/ProductInformation.tsx`, `pages/CreateQuotation.tsx` · focus `CreateQuotation.changeProduct` | Hủy giữ A/phí; xác nhận B giữ tám trường và bỏ phí. B/lưu chưa nối. |
| [A · Quy tắc từ catalog vào validation A](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-rule-source&tab=build) | `quotation/products.ts`, `quotation/rules.ts` · focus `getPropertyProduct` | UI không đổi; validation A dùng giá trị catalog. |
| [B · Hàm kiểm tra nhận quy tắc sản phẩm](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-validator&tab=build) | `quotation/rules.ts` · focus `validateDraft` | Lỗi A giữ hành vi; B chưa được nối từ consumer form. |
| [C · Consumer → input chuẩn hóa → lỗi tại trường](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-validation&tab=build) | `pages/CreateQuotation.tsx`, `quotation/rules.ts`, `quotation/types.ts` · focus `CreateQuotation.validatedInput` | B365 báo tối đa180 ngày; B1 triệu báo tối thiểu10 triệu. B chưa tính phí. |
| [D · Revalidation khi sửa và đổi](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-revalidate&tab=build) | `pages/CreateQuotation.tsx` · focus `CreateQuotation.updateDraft` | Sửa ngày B hợp lệ hoặc đổi sang A cập nhật lỗi ngay sau lần validation. |
| [E · Tham số và công thức thuần](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-formula&tab=build) | `quotation/rules.ts` · focus `calculatePremium` | A tính như cũ; B chưa gọi công thức dù helper đã hỗ trợ. |
| [F · Handler → state kết quả → props tỷ lệ](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-pricing&tab=build) | `components/PremiumSummary.tsx`, `pages/CreateQuotation.tsx` · focus `CreateQuotation.calculate` | A365 = 1.100.000; B180 = 813.699. Lưu vẫn khóa, chưa có receipt định danh. |
| [G · Receipt và policy hiệu lực phí](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-receipt&tab=build) | `pages/CreateQuotation.tsx`, `quotation/rules.ts`, `quotation/types.ts` · focus `premiumMatchesDraft` | Tính/sửa/đổi bỏ phí đúng; sửa tên giữ phí. UI kết quả còn dạng số như mốc trước. |
| [H · Trình bày định danh của kết quả](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-summary&tab=build) | `components/PremiumSummary.tsx` · focus `PremiumSummary.receipt-identity` | Kết quả hiển thị đúng mã/v1, ngày và số tiền đã tính; lưu còn khóa. |
| [A · Contract lưu và consumer mock/parser](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-record&tab=build) | `mocks/storage.ts`, `quotation/products.ts`, `quotation/records.ts`, `quotation/rules.ts`, `quotation/types.ts` · focus `Quotation` | Form/lưu vẫn khóa. Danh sách/chi tiết baseline đọc record mới qua parser; adapter A cũ chỉ đọc. |
| [B · API consumer và xử lý response](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-api&tab=build) | `api/quotations.ts`, `mocks/handlers.ts` · focus `quotationsApi` | Đọc A được; lỗi response giữ thông báo. Chưa có UI tên sản phẩm lịch sử đầy đủ. |
| [C · Hiển thị sản phẩm đã lưu](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-read&tab=build) | `components/FixedInformation.tsx`, `pages/QuotationDetail.tsx`, `pages/QuotationList.tsx` · focus `QuotationDetail` | Tên sản phẩm/phiên bản/biểu phí đã lưu xuất hiện ở danh sách và chi tiết. |
| [D · Lưu, response, điều hướng và reload](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=build) | `pages/CreateQuotation.tsx` · focus `CreateQuotation.save` | A/B tính/lưu/mở lại/reload; adapter A cũ và row lỗi rõ ràng. Khớp Product ghim. |

## Định nghĩa → Import → Nơi dùng → UI

Mở mốc D (`s2-r4-catalog`), bấm nút **Nguồn gốc dữ liệu** trên thanh file đang có:

1. **Định nghĩa** mở `quotation/products.ts` tại range AST của `propertyProducts`: array runtime A/B được export. `PropertyProduct` là type; React không tạo ra array này.
2. **Import** mở `pages/SelectProduct.tsx` tại khai báo import thực tế.
3. **Nơi dùng** mở cùng page tại range `SelectProduct.catalog-map`; tự cuộn và highlight toàn biểu thức map đang render article/name/description.
4. **UI · Chỉ vùng được tạo** chỉ cuộn/đánh dấu các article do catalog tạo trong preview. Không click link, đổi sản phẩm, tính phí hoặc POST.

Có thể mở lại menu sau mỗi link; lựa chọn dùng chính revision/checkpoint đang xem, không đưa số dòng đích vào bài học. Tại C, đường tương tự theo `basicProperty` và một article. Từ D, object A được chuyển vào array A/B và consumer đổi cùng mốc; không giữ một bản sao A để đủ bước. Các mốc sau có đường theo props, state, validator/errors, công thức/premium và response API. Liên kết Import chỉ xuất hiện khi có import giữa hai module; khai báo và consumer cùng file được giải thích tại chỗ. UI chưa có trên màn hình thì liên kết UI khóa, không điều hướng hộ người học.

## Source và cách đọc

`scripts/materialize-stage2-paced.mjs` dùng Prettier **3.6.2**, width76, không chấm phẩy, single quote, LF. Repo trước đó chưa có formatter; TypeScript printer có sẵn không tách JSX một dòng thành cấu trúc dễ đọc. Formatter chạy trước khi ghi source/hash/index; `scripts/index-stage2.mjs` lập lại AST ranges trên những byte đó. Không format HTML hiển thị riêng. Mốc cuối đúng bằng source revision3 cuối đã format, gồm cả adapter; kiểm thử đối chiếu toàn bộ file. Product pin và revision1/2/3 không đổi byte.

**Ngắt dòng dài** là nút trên thanh file dùng chung Chặng1/2, bật mặc định và nhớ riêng tùy chọn xem. Nó chỉ đổi CSS: một số dòng cho mỗi dòng source gốc; phần tiếp được thụt lề, gutter cố định, highlight bao phủ trọn dòng wrap. Diff giữ số dòng Trước/Sau độc lập. Chép gọi Clipboard API với nguyên chuỗi source/diff, không chép số dòng hoặc khoảng trắng thị giác; Windows có thể chuẩn hóa LF thành CRLF khi đọc lại clipboard hệ điều hành.

## Đồng bộ và lịch sử

- Catalog preview, sidebar, Trước/Tiếp, source tree/dependency, flow và Chạy thử hiện hành chỉ nhận 26 ID `s2-r4-*`.
- Metadata `features` ghi khả năng đã xây ở từng mốc; delta giữa Chặng1→Chặng2 vẫn là registry ổn định dùng chung cho graph/cây/hành trình, tách khỏi tiến độ checkpoint. Không ghép thành phần bằng số dòng. Reader `parseQuotation` được đối chiếu từ rules.ts baseline sang records.ts khi file đó thật sự hình thành.
- Mốc tính phí chưa nối Lưu chỉ báo “Đã tính phí.”, không hứa có thể lưu khi nút đang khóa. Chạy thử tại C quan sát một article, D trở đi hai article; đến F2 mới mở form theo sản phẩm. Panel shell/candidate chưa có xác nhận, nên không đề xuất scenario đổi hoàn chỉnh. Các mốc tiếp chỉ đề xuất validation/phí/lưu đã nối. Unsupported scenario không tự chạy thay thế.
- `quotation-workshop.stage2.progress.v4` riêng; không sao chép trạng thái hoàn thành v1/v2/v3. Không sửa practice, starter, source/snapshot hoặc tiến độ Chặng1.
- [Revision3](http://localhost:3181/?stage=2&version=3#checkpoint=s2-r3-catalog&tab=build), [revision2](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete), revision1 giữ ID/hash và dữ liệu cũ; có banner **Phiên bản bài học cũ** cùng link mốc mới tương ứng. `src/stage2/archive3` giữ mapping r3, `archive` giữ r1/r2. ID cũ không được âm thầm gắn source r4.

## Các phương án cũ và adapter

| Vị trí | Hiện hành |
| --- | --- |
| Sidebar, selector preview, Trước/Tiếp | Chỉ r4; không có checkpoint selector/catalog lớn trong form |
| Source/preview form | Ngữ cảnh gọn và panel Product; không có `#productCode` hoặc catalog card trong form |
| Bài học nhiệm vụ, range/import/map | Lấy source formatted ở mỗi mốc; không dùng selector cũ làm đích highlight |
| Chạy thử chọn sản phẩm | `/products`, một/hai article đúng mốc; Link chỉ có từ F1 |
| Chạy thử đổi sản phẩm | Dialog và radio candidate hiện hành; chỉ xác nhận mới áp dụng |
| Lịch sử | r1/r2/r3 còn nguyên source, ID, ghi chú/tiến độ và data namespace; có thông báo phiên bản cũ |

Adapter vẫn là HashRouter để nhúng checkpoint, main/worker/tool bootstrap, namespace API/localStorage theo checkpoint và namespace phiên Chạy thử riêng. Plugin runtime chỉ chèn quan sát MSW/cô lập phiên, bỏ qua `?raw`/`?url`; source học không bị plugin biến đổi. Adapter đọc initializer bằng AST để không phụ thuộc khai báo một hay nhiều dòng. Driver chờ trang tối thiểu có article, không bắt buộc tiêu đề trang xuất hiện trước sub-step E1. Ngoài adapter và format, mốc cuối không khác Product ghim.

## Kiểm tra và giới hạn

Đã kiểm tra ngày 01/11/2026:

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| `npm run build` sau niêm phong | Đạt; gồm typecheck Workshop và toàn bộ checkpoint, build đủ 71 entry checkpoint. `.verification/r4-build-final.log` |
| `npm test -- --maxWorkers=2` | 75/75 kiểm tra, 15 file. `.verification/r4-unit-final.log` |
| Browser revision4 | 19/19 đạt trong lượt cuối: đi tuần tự 26 mốc, provenance, wrap/copy/diff/gutter, panel/route, namespace, flow/source, scenarios, responsive/zoom, focus và Back qua archive |
| Browser hồi quy | 29/29 đạt: branching Chặng1 (7), Evolution/guided r4 (2), source/URL/flow/run/layout r3 và điều hướng phiên bản (20). `.verification/r4-browser.log` ghi lượt này cùng các lượt responsive được sửa và chạy lại trong bộ r4 cuối |
| Tổng browser khác nhau đã đạt | 48 bài. Các lần thử trước có lỗi locator role tab trên mobile, chờ boot quá ngắn ở profile zoom mới, và các lỗi adapter/ready được sửa; không tính những lần thử lỗi là đạt |
| Kích thước | Desktop1440×900; mobile390×844 có chuyển Guide/Preview; Chrome **zoom thật125%** bằng `settingsPrivate.setDefaultZoom` trong profile thử riêng, xác nhận DPR1.25 / viewport CSS1152×720 |
| Snapshot lịch sử | 45 checkpoint cũ / 967 file giữ đúng SHA manifest; pin Product giữ nguyên. `.verification/r4-history-audit.json` |
| Practice / Chặng1 | Không sửa source practice/reference/starter/solutions/sample, manifest hoặc index Chặng1. Tiến độ cũ không được nhập vào key v4 |
| Niêm phong | `publication: published`; chạy materialize lại vẫn đúng byte/metadata. Từ chối thay nội dung hoặc metadata dưới ID r4 đã niêm phong |

Ảnh: `.verification/r4-1440x900.png`, `r4-390x844.png`, `r4-mobile-preview.png`, `r4-chrome-zoom125.png`. Bộ browser r4 nằm ở `tests/browser/stage2-paced.spec.ts`; các bộ hồi quy đã chạy là branching, evolution-guided và stage2-current (r3 lưu trữ). Chưa chạy lại mọi bài browser lịch sử r1/r2.

Build còn cảnh báo chunk lớn (module Workshop khoảng3,85MB chưa gzip /552KB gzip, phần lớn gồm index/source học) và cảnh báo cấu hình native tương lai của Vite. Không có lỗi typecheck/build; chưa làm công việc tối ưu bundle trong phạm vi lượt này. Clipboard Windows có thể chuẩn hóa LF thành CRLF; kiểm tra đã xác nhận chuỗi đưa vào Clipboard API đúng nguyên source và nội dung đọc lại không đổi sau chuẩn hóa xuống dòng hệ điều hành.

Giữ Product3180 / Workshop3181. Không commit/push, không chuyển Chặng3. Đây là chuỗi tái dựng để học, không phải lịch sử Git; Chạy thử phân biệt DOM/MSW quan sát thật với state/helper được diễn giải từ source.
