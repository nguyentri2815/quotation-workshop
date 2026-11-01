# Chặng 2 · Bản review sản phẩm đầy đủ và workspace chung

> Lưu trữ phiên bản bài học cũ. Hành trình hiện hành: [Revision3](CHANG-2-REVISION-3.md). Source/ID lịch sử giữ nguyên; các kết quả dưới đây không thay thế người dùng review/đồng ý Product.

Triển khai tiếp trên công việc Preview1/2 chưa commit, ngày01/11/2026. Không commit/push, không triển khai Chặng3. [Preview1](CHANG-2-PREVIEW-1.md) và [Preview2](CHANG-2-PREVIEW-2.md) giữ nguyên biên bản lịch sử, giới hạn của mốc tương ứng.

## Mở và thử

- [Product · chọn sản phẩm](http://localhost:3180/products).
- [Workshop · nhận yêu cầu Chặng2](http://localhost:3181/?stage=2&version=2#checkpoint=s2-00).
- [Mốc refactor UX giữ hành vi Preview2](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-ui).
- [Mốc lưu/đọc A và B hoàn chỉnh](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete).
- [Hành trình phát triển](http://localhost:3181/?stage=2&version=2&screen=evolution#requirement=choice).
- [Phiên B365 lỗi →180 tính/lưu/mở lại](http://localhost:3181/?stage=2&version=2&run=b-save&runMode=demo#checkpoint=s2-r2-complete).
- [Phiên lưu lỗi/retry chủ động](http://localhost:3181/?stage=2&version=2&run=retry-save&runMode=demo#checkpoint=s2-r2-complete).
- [Đọc A gốc trong phiên riêng](http://localhost:3181/?stage=2&version=2&run=legacy-read&runMode=demo#checkpoint=s2-r2-complete).

Product: chọn A →Tạo bản chào →Điền mẫu →Tính phí =1.100.000 VND →Lưu →Reload. Với B, mẫu365 ngày báo lỗi; đặt endDate=startDate+180 ngày lịch →thuần739.726, thuế73.973, tổng813.699 →Lưu →chi tiết/danh sách/mở lại. Ví dụ ngày cố định2024-02-01→2024-07-30 đúng180 ngày, không cộng năm lịch. Bộ quy tắc là **dữ liệu mô phỏng phục vụ học tập, không phải biểu phí bảo hiểm thực tế**.

Đổi sản phẩm: mở panel, chọn một phương án rồi hủy giữ draft/phí; chỉ nút Xác nhận mới đổi. Khi đổi, giữ tám trường, không ép tiền/ngày theo giới hạn; phí cũ bị bỏ và lỗi kiểm tra lại. Về A phải tính lại. Product hiện hành không có nội dung chặng/checkpoint/source; chỉ có nhãn môi trường “Dữ liệu mô phỏng”.

## Thiết kế và trình tự học

Khung **WorkshopFrame** được trích từ Workshop Chặng1: cùng Header/tiến độ/chọn chặng, sidebar, thanh sub-step, vùng học, splitter, preview và chuyển chế độ. Chặng1 và **StageTwoAdapter** cùng dùng khung đó; Chặng2 không còn shell riêng. BuildSession, SourcePanel (Trước/Sau/Diff, full file/range/Shiki), SourceTree, Preview, SubstepProgress và run engine dùng chung. Flow thuộc Tổng thể; Diff thuộc SourcePanel. Không thêm cột thường trực cho Hành trình phát triển.

Năm bước lớn: **Nhận yêu cầu mới →Chọn sản phẩm →Validation và tính phí →Nhất quán khi đổi/sửa →Lưu và đọc lại**. Các mốc1.1/1.2/1.3 ở thanh sub-step trong bước Chọn sản phẩm. Mốc refactor UI đi sau nhất quán Preview2, trước mở lưu B, giữ đúng thứ tự source hình thành. Bảy ID snapshot cũ vẫn chọn được, không đổi nội dung. Version2 là cách biên soạn bài học/workspace, không phải nghiệp vụ mới hoặc version sản phẩm.

| Mốc | Lý do / dùng lại / consumer trong cùng mốc | UI / tiêu chí |
| --- | --- | --- |
| s2-06-consistency | Preview2 trước refactor, nguyên source ghim. | A/B tính, A lưu; B khóa lưu như biên bản Preview2. |
| s2-r2-ui | Tách màn SelectProduct/QuotationEntry; ProductInformation chuyển thành ngữ cảnh/panel xác nhận. Catalog bỏ nội dung học, layout bỏ nhãn chặng. Dùng lại draft/rules/receipt/guard A và tất cả luồng cũ. | Trước form có chọn sản phẩm; hủy panel không thay draft/phí; xác nhận giữ draft/bỏ phí. Hành vi tính/lưu tương đương Preview2: mốc này B còn khóa lưu. |
| s2-r2-complete | Contract code/version nối ngay form→client→POST. productTerms tạo snapshot và được mock lưu ngay. records.parseQuotation được API/readQuotationReport dùng ngay. | A/B tính/lưu/reload. List/detail theo sản phẩm đã lưu. GET đọc lịch sử, A gốc có adapter hẹp, row sai không làm hỏng phần còn lại. |

Mốc biên soạn phục vụ học tập, **không tự nhận là lịch sử Git commit**. So sánh UI dùng checkpoint12 (Chặng1) và s2-r2-complete với manifest/hash rõ; hai namespace UUID riêng. Cây phân biệt bao chứa file/symbol, gọi hàm, callback/props và đọc/ghi state bằng nhãn. Các quan hệ nội bộ là diễn giải source; không tự động coi cạnh là thứ tự runtime.

Hành trình phát triển: mỗi yêu cầu có ví dụ trước/sau, giới hạn cũ, quyết định đã chọn, kết quả/trạng thái, file/symbol bị tác động; có mở so sánh UI, Diff, theo tác động, đúng bước học và phiên chạy. Mở/đóng màn này giữ workspace/iframe review đang mounted. Chọn chặng lưu URL gần nhất trong sessionStorage; URL cũ có `stage=2&version=1#checkpoint=...` vẫn ánh xạ đúng mốc, không viết lại source hay tiến độ.

## Contract và dữ liệu lịch sử

Input mới: `product` là BASIC_PROPERTY hoặc EXTENDED_PROPERTY, **productVersion=1** cùng Normal/Property/VND và dữ liệu khách hàng/tài sản/kỳ. POST từ chối mã/phiên bản thiếu hoặc sai. `parseQuotationInput` chỉ lấy các trường chuẩn hóa; bỏ qua tên/rate/phí/snapshot client tự gửi. Mock lookup code/version, validate giới hạn, tự tính lại và lưu.

Record mới có **schemaVersion=2**, code/version, `productSnapshot` gồm tên, giới hạn, tỷ lệ, dayBasis365, roundingNET_THEN_TAX và `premium` đã áp dụng. Envelope localStorage vẫn version1/key cũ, cho phép chứa bản cũ và mới cùng nhau. Không reset/seed lại khóa đã tồn tại.

GET không dùng catalog hiện tại để tái báo giá. `records.parseQuotation` kiểm shape, ngày/số và tính nhất quán **với snapshot đã phát hành**, trả về các số đã lưu. Đây là kiểm tra toàn vẹn, không ghi lại phí hoặc chuyển version record. Tên/tỷ lệ/số phí lịch sử không đổi khi active catalog thay đổi. Catalog version đã phát hành cần bất biến; nếu đổi quy tắc tương lai phải tạo version khác.

Adapter legacy chỉ nhận record Normal/Property/VND, customer/asset/period/ID/number/status/premium hợp lệ, **thiếu đồng thời schemaVersion/productVersion/productSnapshot**, product chỉ được vắng hoặc BASIC_PROPERTY. Dùng **originalBasicTerms** ghim độc lập catalog hiện tại (A/v1 gốc). Không nhận unknown/B/mã null hoặc metadata thiếu một phần làm A. Adapter tạo view tương thích trong bộ nhớ; GET không ghi localStorage.

Một row sai: báo skipped trên list; các row đúng vẫn đọc. GET không ghi lại envelope; append record mới giữ nguyên nội dung các row cũ, kể cả row sai. JSON/envelope không đọc được vẫn báo lỗi và giữ dữ liệu gốc, không thay bằng seed. Chi tiết ID không hợp lệ không được báo thành công. Chưa có UI sửa/xóa/khôi phục row bị cách ly.

## Quan sát và phiên chạy

Các phiên: chọn sản phẩm→form; A tính/lưu/reload; B365 lỗi→180 tính813.699→lưu→mở lại; đổi sản phẩm vô hiệu phí; lỗi lưu giữ draft/phí và chờ người học chủ động retry; đọc A gốc.

Thao tác DOM/input/change/click, nội dung UI/disabled và MSW request/response được quan sát thật. Hàm/state/render/receipt/storage bên trong vẫn là diễn giải source. Reload/mở lại đọc UI và GET; history chỉ đổi con trỏ đọc/source/highlight, không gửi lại POST. Fixture A gốc do công cụ riêng chuẩn bị **chỉ trong namespace phiên run**, không chạm dữ liệu review. Mở lại phiên dùng ID mới; pause không hủy request đã gửi.

## Kiểm tra thực tế

Product:

- **37/37 unit**, typecheck/build đạt. Bao gồm biên tiền/ngày A/B, ngày lịch sai, làm tròn, receipt hết hiệu lực, code/version sai, mock tự tính và bỏ phí client, parser lịch sử không phụ thuộc catalog đang hoạt động, adapter A gốc và cách ly row sai.
- **8/8 ca Chrome** đạt: chọn trước form, xác nhận/hủy đổi sản phẩm, giữ draft/bỏ phí, A365 và B180, lưu chống bấm lặp, chi tiết/list/reload, HTTP500/retry chủ động, điều hướng form chưa lưu, A cũ/row sai, mobile và bàn phím. A=1.100.000; B=739.726+73.973=813.699 VND.

Workshop:

- **60/60 unit**, typecheck/build đạt. AST/range/hash, checkpoint/source Product, thứ tự năm bước và consumer, mapping kịch bản đã kiểm.
- **91 ca trình duyệt riêng biệt đã được xác minh đạt qua các lượt hồi quy**, không phải một lượt chạy xanh duy nhất: lượt đầy đủ ban đầu89 ca đạt82, lỗi7; sau sửa/chẩn đoán, nhóm Preview1/2 + hai ca bổ sung đạt17/17, các ca Chặng1 lỗi được chạy lại tới đạt; nhóm workspace/sáu phiên mới chạy cuối đạt10/10. Hai ca bổ sung kiểm Back/Forward/ghi chú/tiến độ sau reload và guided B tự thao tác qua lỗi→tính→lưu→mở lại→reload; đọc history không tăng POST.
- Chặng1: Field A–F, full file/range/diff, graph nhiều nhánh, URL cũ/Back/Forward, tiến độ cũ, starter/practice, namespace và phiên chạy được hồi quy. HMR sửa trong bản sao riêng→UI đổi không reload→khôi phục đạt; không sửa `src/practice` thật.
- Desktop1440×900 và1920×1080, mobile390/320, splitter bằng bàn phím, native dialog/Escape và giữ iframe qua tab/file/chế độ/resize đã kiểm. Code mặc định Chặng2 còn trên60% chiều cao viewport ở các kích thước kiểm tra. Mobile Chặng2 khi mở thêm vùng Phụ thuộc còn trên45%; thanh sub-step vẫn hiện và có thể chuyển Đọc code để tăng diện tích.
- **Zoom Chrome thật125%**: cửa sổ1440×900, CSS viewport từ1422×804 thành1138×643, devicePixelRatio từ1 thành1,25; vùng code438×395 CSS px (~61% chiều cao), nút bố cục nằm trong viewport. Hành động Đổi sản phẩm không tràn ngang, cuộn tới và mở/hủy panel được. Đã kiểm DOM/rect và ảnh CDP; không suy luận zoom chỉ từ đổi kích thước viewport.
- Đối chiếu848 file đã ghi hash trước sửa:847 file giữ nguyên; file duy nhất khác là `stage2/source-index.json` do thêm hai mốc. Phần index của bảy ID Preview1/2 tái dựng cho hash **trùng nguyên bản**. Manifest/source snapshot cũ, source practice/reference/starter/solutions và index Chặng1 giữ nguyên.

Các ca thất bại và xử lý đã ghi trước khi chạy lại:

1. Graph Chặng2 tự pan lúc nhận focus giữa pointer-down/up làm mất click; sau khi tắt auto-pan cho wrapper và cho nút nhận pointer, bấm thật đi đúng file/symbol/range, iframe không remount. Hai ca source Preview2 đã đạt lại.
2. Panel Chạy thử của adapter không đóng trước khi vào phiên, khiến modal chặn các nút lịch sử. Adapter nay nhận callback đóng panel của BuildSession; ca A→B→A/history đạt lại.
3. Nhãn textarea ghi chú bị ghép với nội dung đã lưu; đặt accessible name rõ. Ca reload chủ động chấp nhận cảnh báo rời form hiện có; tiến độ/ghi chú giữ nguyên và Chặng1 không đổi.
4. Guided reload ban đầu thao tác ngay khi index bước đổi, trước khi driver sẵn sàng quan sát. Ca kiểm nay chờ đúng chỉ dẫn reload trên UI; sau đó xác minh document mới, bản chào/phí và một POST duy nhất.
5. Ba ca cũ gặp cửa sổ khởi động/highlight ngắn; ca xem source và guided input đạt khi chạy riêng. Ca fault injection khóa nút trước cue được chuyển sang observer tại iframe thực, không đua với timer trình diễn. Init-script trong iframe do service worker kiểm soát đã không kích hoạt ổn định ở lần thử đầu; observer từ parent giải quyết. Driver vẫn phải thấy nút bị khóa thật và dừng, sau khôi phục mới quan sát tiếp.
6. Ca pause cũ dùng nhiều round-trip trong650ms lưu nên đôi lúc response đã xong trước khi bấm/đọc trạng thái. Ca kiểm mới quan sát `aria-busy` rồi bấm nút pause ngay trong lượt DOM đó, ghi nhận paused khi còn busy; không kéo dài delay nghiệp vụ. Chạy lại phiên không nhận bằng chứng/POST của namespace cũ đã đạt.

Build còn cảnh báo chunk source/index lớn (>500kB) và import cấu hình Vite thiếu extension có sẵn; build vẫn hoàn tất. Kiểm trình duyệt bằng Chrome trên máy này và viewport giả lập; chưa xác minh Firefox/Safari, screen reader hay thiết bị di động vật lý. Log/trace/ảnh QA nằm trong thư mục bị Git ignore, không phải dữ liệu trình duyệt cá nhân.

## Chạy lại / giới hạn

Mỗi repo: `npm.cmd ci`, `npm.cmd run dev -- --strictPort` (Product3180, Workshop3181). Không thêm dependency. Kiểm tra Product: `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:browser`; Workshop: `npm.cmd test -- --testTimeout=15000`, `npm.cmd run build`, `npm.cmd run test:browser -- --timeout=120000`.

Source/range/index sinh từ cơ chế AST/CSS hiện có. `npm.cmd run stage2:materialize` hiện chỉ dựng revision2, giữ bảy snapshot đã phát hành. Mốc UI được ghim; command trên máy khác dùng snapshot đó, không cần thư mục QA `.verification`. Generator cũ từ chối tái sinh ID Preview1/2 bằng Product mới. Dev/build/test không materialize hoặc ghi bài người học.

Chưa commit/push: `git pull` chưa chuyển bản review này sang máy khác. Git không chứa localStorage/draft/tiến độ/ghi chú hoặc dữ liệu review, dependencies/build/cache/log/trace. Dữ liệu trình duyệt và các khóa hiện có được giữ. Chưa có backend thật, auth, idempotency giữa nhiều tab, đồng bộ đa thiết bị hoặc Chặng3.
