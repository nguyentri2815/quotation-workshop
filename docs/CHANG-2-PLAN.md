# Chặng 2 · Hai sản phẩm trong nghiệp vụ Tài sản

## Hành trình hiện hành · Revision 4

Áp dụng [quy trình Product → Workshop](PRODUCT-WORKSHOP-WORKFLOW.md). Người dùng chỉ định Product hiện hành làm đích trong lượt này; không suy ra đã duyệt từ test/báo cáo trước. [Bản ghim, chuỗi checkpoint, flow, mapping và kiểm tra](CHANG-2-REVISION-4.md).

26 checkpoint nhiều dòng; catalog đi qua contract → object A → import/render một sản phẩm → array A/B/map → presentation → route/form. Xem bảng từng mốc trong biên bản revision4.

Hành trình: **baseline Chặng1 → catalog/trang chọn → form/ngữ cảnh → panel hủy/xác nhận → validation → phí/hiệu lực → lưu/đọc**. Source revision4 dùng ID mới `s2-r4-*`, không tái sử dụng source phương án selector trong form. Sidebar/preview/trước-tiếp/Chạy thử chỉ dùng revision4. Revision1/2/3 giữ nguyên source/dữ liệu trong lưu trữ, link cũ công khai thông báo và chuyển mốc tương ứng.

So sánh mặc định Chặng1 hoàn chỉnh (`12`) → Chặng2 hiện hành (`s2-r4-complete`). Phân loại flow bằng hành vi/source; metadata dùng chung cho tổng thể, thao tác, cây phụ thuộc và hành trình phát triển. Delta giữa chặng và khả năng tại checkpoint là hai ý nghĩa riêng.

Các phần dưới là kế hoạch/biên bản **lịch sử**, không phải trình tự học hiện hành và không phải bằng chứng phê duyệt Product mới.

## Phạm vi lịch sử · Preview 2

Tiếp tục từ Preview 1, theo yêu cầu đã chốt: **A/B cùng validation và tính phí theo catalog; B chưa lưu, A giữ tính/lưu/lỗi/retry/reload.** Không đổi bốn mốc cũ, Chặng 1, practice hoặc tiến độ; không mở API/storage B, không commit/push. [Biên bản Preview 2 và link review](CHANG-2-PREVIEW-2.md).

| Mốc nối tiếp | Yêu cầu / dùng lại / thay đổi có consumer ngay | UI chạy thử và tiêu chí hoàn thành |
| --- | --- | --- |
| 2.1 · s2-04-validation | Dùng lại form/validation chung và ngày lịch. Input A/B, lookup catalog, giới hạn theo lựa chọn nối ngay onBlur/validatedInput. | A365 tính được; chuyển B giữ365 báo lỗi tại Ngày kết thúc (180); B dưới10 triệu lỗi đúng trường. B hợp lệ chưa tính tại mốc này. |
| 2.2 · s2-05-pricing | Dùng lại công thức/làm tròn; nhận giới hạn/tỷ lệ catalog. Handler dùng ngay, receipt chứa sản phẩm/phiên bản/tiền/ngày và presentation hiển thị. | A1 tỷ/365 =1.100.000; B1 tỷ/180: thuần739.726, thuế73.973, tổng813.699. B có phí nhưng UI và handler chặn lưu với giải thích rõ. |
| 2.3 · s2-06-consistency | Dùng lại vô hiệu phí từ1.3; cập nhật lỗi sau validation khi sửa/đổi. Helper kiểm mã/phiên bản/đầu vào nối ngay currentPremium, presentation và guard lưu. | Giữ đủ draft, không ép hợp lệ. Đổi A/B hoặc tiền/ngày không dùng phí cũ; đổi sản phẩm cập nhật lỗi ngay sau validation. A tính lại/lưu/reload đúng, B chưa lưu. |

Phí thuần làm tròn trước; thuế làm tròn từ phí thuần, tổng cộng hai phần. Mẫu ngày dùng UTC start + số ngày, không cộng năm lịch. Lookup không đổi mã lạ thành A. API/storage giữ contract A và tính lại A độc lập với lựa chọn form.

Workshop thêm full source/range/diff, cây thật và cạnh catalog → validation/công thức → handler → state kết quả → presentation; Flow có nhánh lỗi/hợp lệ trong cùng hành vi. Trình tự xây dựng là checkpoint, thứ tự chạy là Flow. Phiên riêng quan sát DOM/MSW; hàm/state/render vẫn ghi diễn giải. Không remount iframe khi đổi file/tab/resize, không thêm hàng toolbar làm hẹp vùng đọc.

Kiểm tra: biên tiền/ngày A/B, lịch sai, làm tròn, receipt không khớp, giữ draft/vô hiệu phí, guard lưu B, hồi quy A và Chặng1/Preview1; typecheck/build. Kết quả thực ghi ở biên bản Preview 2; dừng review trước mốc lưu/đọc B.

Phần dưới giữ thiết kế và trình tự Preview 1 đã bàn giao; trạng thái “chưa validation/tính B” chỉ áp dụng bốn checkpoint đầu.

Đặc tả đã được người dùng chốt ngày 31/10/2026. Tài liệu này thay kế hoạch có điều kiện trước đó. Chỉ Normal / Tài sản / VND / một khách hàng / một tài sản / một kỳ thanh toán. Không thêm backend thật, nghiệp vụ/loại bản chào khác hoặc thư viện quản lý form/state. Các thông số dưới đây là **demo học tập, không phải quy tắc bảo hiểm thực tế**.

## Yêu cầu mới so với Chặng 1

Chặng 1 có sản phẩm A cố định. Chặng 2 dùng catalog tối thiểu hai sản phẩm, state mã lựa chọn thuộc CreateQuotation, presentation nhận props; validation/công thức/API dần nhận đúng sản phẩm và phiên bản. Đổi sản phẩm làm phí cũ hết hiệu lực nhưng giữ draft. Người học thấy rõ khi nào dữ liệu, handler và presentation cần tách; chưa xây framework cấu hình.

| Quy tắc demo | A · Tài sản cơ bản | B · Tài sản mở rộng |
| --- | --- | --- |
| Mã | BASIC_PROPERTY (giữ mã Chặng 1) | EXTENDED_PROPERTY |
| Phiên bản | 1 | 1 |
| Số tiền VND | 1.000.000–100.000.000.000 | 10.000.000–50.000.000.000 |
| Thời hạn | 1–365 ngày | 1–180 ngày |
| Tỷ lệ năm | 0,1% | 0,15% |
| Thuế demo | 10% | 10% |

Giữ cách đếm ngày lịch UTC và làm tròn Chặng 1: net = round(sum × annualRate × days / 365), tax = round(net × taxRate), total = net + tax. A một tỷ/365 ngày vẫn 1.100.000 VND. Việc có dữ liệu B trong catalog không có nghĩa validation/công thức/lưu B đã nối.

## Preview 1 đã bàn giao

Product tại http://localhost:3180/quotations/new: selector ở đầu form, mặc định A; tên/mô tả/mã/phiên bản/giới hạn/tỷ lệ cập nhật ngay theo state. Đổi lựa chọn không sửa tiền/ngày hoặc các thông tin khách hàng/tài sản; xóa phí đã tính. B có nhãn ngắn “Chưa nối tính phí trong mốc này”, khóa cả UI và handler calculate/save. A tiếp tục tính/lưu/reload bằng schema cũ; từ B về A phải tính lại. Chưa có schema lưu B hoặc productVersion mới trong bản chào đã lưu.

Workshop tại http://localhost:3181/?stage=2&version=1#checkpoint=s2-00. Stage/version riêng, **không dùng journey=2 để chỉ Chặng 2**. journey=2 vẫn là hành trình Chặng 1. Không đổi 29 checkpoint Chặng 1, source ghim, src/practice, reference, starter/solutions hoặc tiến độ cũ. Chặng 2 xuất phát từ bản Chặng 1 hoàn chỉnh; preview chỉ đọc source mẫu, chưa tạo bài thực hành mới và không tự chấm source.

## Trình tự hình thành preview đầu tiên

| Mốc | Code được hình thành và consumer cùng mốc | UI/cách thử | Điều kiện hoàn thành |
| --- | --- | --- | --- |
| 0 · s2-00 | Dùng nguyên 18 file runtime Product Chặng 1 ghim, thêm adapter nhúng công khai. | A cố định; điền mẫu → tính → lưu/GET/reload được. Đọc FixedInformation để chỉ ra điểm cố định. | Bản xuất phát hoàn chỉnh, source/preview trùng nhau, chưa có selector. |
| 1.1 · s2-01-catalog | quotation/products.ts chứa PropertyProduct và propertyProducts; ProductInformation nhận A trực tiếp tại CreateQuotation. formatRate được dùng ngay trong presentation. | Thẻ A hiện mã/version, giới hạn, tỷ lệ và disclaimer. Chưa có selector. A vẫn tính/lưu. | Catalog và contract có consumer ngay; không có helper chờ nhiều bước mới ghép. |
| 1.2 · s2-02-selection | State productCode, tìm product từ catalog; selector gọi callback về nơi sở hữu state, props cập nhật presentation. | Nhập dữ liệu → chọn B/A; thông tin đổi, draft giữ nguyên. Checkpoint này tạm khóa tính/lưu cả A/B với giải thích rõ để chỉ quan sát lựa chọn trước khi ghép quy tắc vô hiệu phí ở 1.3. | State/control/props có thật, không tự sửa draft hoặc giả báo tính/lưu thành công. |
| 1.3 · s2-03-switch | changeProduct xóa premium và thông báo/lỗi cũ, không setDraft. productSupported được dùng ngay trong UI và guard calculate/save; A mở lại. PremiumSummary nhận tỷ lệ hiển thị qua props, không chứa công thức mới. | Điền mẫu → tính A → B: giữ draft, hết hiệu lực phí, khóa hành động → A: chưa được lưu → tính lại → lưu/reload. | B không thể tính/lưu ngay cả khi bypass disabled hoặc dispatch submit trực tiếp; A giữ công thức/hành trình cũ. |

Snapshot được tái dựng cho mục tiêu học, không phải lịch sử Git. Bốn snapshot Preview 1 hiện được ghim; generator giữ nguyên chúng và chỉ dựng ba mốc Preview 2 từ baseline đó + Product hiện tại. Dev/build/test chỉ kiểm hash/index, không tự ghi đè snapshot hoặc bài người học. Tái dựng chủ động: npm.cmd run stage2:materialize.

## Dùng lại, thay đổi và lý do

- Giữ router/layout, draft/errors/premium/saving, rules tính phí A, API/MSW/storage/GET và persistence schema hiện có. Đó là baseline đã hoạt động, chưa có lý do thay công thức hoặc lưu B ở preview này.
- Thêm quotation/products.ts để tách dữ liệu/contract khỏi JSX; chỉ hai cấu hình demo, chưa có registry/plugin engine.
- Tách ProductInformation vì có trách nhiệm trình bày thông tin và selector sản phẩm. CreateQuotation giữ state, kiểm tra lựa chọn và tính nhất quán; FixedInformation nhận tên được chọn. PremiumSummary chỉ định dạng/hiển thị dữ liệu.
- Workshop dùng lại CodeBlock/Shiki, SourceTree, AST/CSS analyzer, layout splitter, RunDriver/useRunSession/RunControls và namespace phiên. Chặng 2 có manifest/index riêng và dữ liệu quan hệ tối thiểu; không sửa source/index Chặng 1 để đổi ý nghĩa mốc cũ.
- Catalog → option selector; selector → callback → state; state → consumer → props presentation; đổi lựa chọn → setPremium(null) đều có liên kết ngay trên cây, range từ AST tại đúng mốc. Type/state/setter/render là diễn giải source; DOM và MSW là quan sát trực tiếp.

## Chạy thử có quan sát

Mỗi lần mở phiên có ID/API/storage riêng, dùng lại bridge và engine hiện có. Phiên cuối: quan sát A → bấm Điền mẫu thật → tính A → chọn B → ghi UI B, draft giữ, phí hết hiệu lực và nút khóa → về A → tính lại. Mốc 0/1.1 chỉ quan sát A và tính A; mốc 1.2 chỉ điền mẫu và đổi A/B/A vì chưa mở tính/lưu.

DOM input/change/click, vùng thông tin/phí, disabled và request/response MSW nếu có được ghi thật. Không tạo nhật ký giả cho setState/validation/render/storage. Đọc lịch sử chỉ đổi con trỏ đọc/source và highlight, không lặp thao tác/POST. Đổi tab/file/resize không remount iframe; thoát khôi phục preview review. Pause chỉ chặn thao tác kế tiếp, request đã gửi vẫn có thể hoàn tất.

## Lộ trình sau Preview 1 (validation/tính phí được thực hiện trong Preview 2)

1. Validation theo sản phẩm: truyền rule sản phẩm vào validateDraft/validateAndBuildInput và parser tại ranh giới. Viết rule cùng lúc nối lỗi/guard tại form; B 1 triệu hoặc 181 ngày phải bị chặn bằng lỗi thật, không sửa draft tự động.
2. Tính phí theo sản phẩm: truyền annualRate/taxRate, giữ calendarDays/làm tròn/365 và nối ngay calculate + PremiumSummary. B một tỷ/180 ngày phải khớp công thức demo; A một tỷ/365 ngày giữ 1.100.000. Đổi sản phẩm/tiền/ngày tiếp tục làm phí hết hiệu lực.
3. Lưu/đọc đúng sản phẩm và phiên bản: bổ sung mã + productVersion vào input/bản chào khi thực sự nối B, parser kiểm cặp mã/version, mock tự tính lại phí theo cặp đó. Giữ Premium đã lưu để đọc lại; catalog phiên bản đã phát hành phải ổn định. Bản chào Chặng 1 thiếu version được hiểu là BASIC_PROPERTY/v1 bằng adapter đọc có kiểm thử, không tự ghi đè storage. Thiết kế cụ thể schema/compatibility được triển khai và kiểm tra trong mốc lưu, không thêm trước trong preview này.
4. Đồng bộ Workshop tại mỗi mốc: code chạy trước, tiếp đó checkpoint/index/range/dependency/flow/run scenario tương ứng; giữ namespace, bài/tiến độ cũ và link review.

## Tiêu chí hoàn thành

Preview đầu tiên: A tính/lưu/reload đúng; thông tin B đúng đặc tả; A → B → A giữ đủ tám giá trị draft, không dùng lại phí cũ; B bị guard chặn cả handler; không có POST khi đổi sản phẩm/đọc history. Bốn checkpoint chạy được và khớp source; Code đầy đủ/số dòng/range/cuộn, quan hệ ngay trên cây; layout desktop/mobile/bàn phím dùng được. Không sửa bài người học, dữ liệu review hoặc tự tăng tiến độ Chặng 1. Typecheck/build và kiểm thử phù hợp có kết quả thực, giới hạn ghi rõ trong biên bản preview.

Toàn Chặng 2: ngoài tiêu chí trên, validation/công thức A/B đúng bộ rule, mock validate và tính lại độc lập, mã/version được lưu và đọc lại đúng qua reload, dữ liệu A cũ vẫn đọc được theo chính sách đã kiểm chứng. Chưa coi các hạng mục tiếp theo này là đã đạt trong preview đầu tiên. Dừng để review, không commit/push trong lượt triển khai preview này.
