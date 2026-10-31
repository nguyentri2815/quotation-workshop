# Chặng 1 · dependency, preview và flow có nhánh

Phạm vi ngày 30/10/2026: chỉ workshop. Giữ 6 bước chính, 30 sub-step, 29 checkpoint và chuỗi Field A–F. Sản phẩm chỉ đọc; không sửa practice/starter/solutions hoặc source checkpoint; không commit/push, không chuyển Chặng 2.

## Bảng flow cũ → flow gốc

| Mục/tình huống trước | Flow gốc hiện tại | Nhánh/điều kiện | Căn cứ source mẫu |
| --- | --- | --- | --- |
| `input-edit` | Nhập / sửa dữ liệu (`input-edit`) | Trước 06 chỉ cập nhật; từ 06 so ba đầu vào phí. Chưa từng có phí/đã có phí là state ban đầu, không phải kết quả chọn thủ công. | `CreateQuotation.inputProps → updateDraft`; `rules.pricingInputsChanged` |
| `edit-after-calculation` | Nhập / sửa dữ liệu | URL cũ đặt trường `sumInsured`, đã có phí; sửa tiền/ngày xóa phí, sửa trường khác giữ phí. | `pricingInputsChanged`, `setPremium(null)`, `PremiumSummary` với stale |
| `calculate-success` | Tính phí (`calculate`) | `scenario=valid`: dữ liệu hợp lệ → công thức → state → render | `calculate → validatedInput → validateAndBuildInput → calculatePremium` |
| `calculate-invalid` | Tính phí | `scenario=invalid`: validation lỗi → errors/message → return → phản hồi. Event `render` cũ chuyển `invalid-render`. | `validatedInput`, `Field`, `inputProps`, rAF focus |
| `save-success` | Lưu bản chào (`save`) | `scenario=success`: qua guard, POST, mock, persist, response hợp lệ → điều hướng | `save`, `quotationsApi.create`, `request`, handlers, `createQuotation`, `requireQuotation` |
| `save-error` | Lưu bản chào | `scenario=request-error`: request lỗi → catch → người dùng thử lại. Cùng graph còn có lỗi contract input, storage và response sau persist. | `request`, POST parse, `persist`, `requireQuotation`, `save.catch` |
| GET list/detail ở bước 6 (trước chưa có mục flow) | Đọc dữ liệu đã lưu (`read`) | Có dữ liệu, list rỗng, detail 404, lỗi, retry qua attempt | Effects hai trang đọc, `AsyncMessage`, GET handlers |
| Bảo vệ rời form ở bước 6 (trước chưa có mục flow) | Rời form (`leave`) | Đi thẳng; route blocked → tiếp tục nhập/bỏ dữ liệu; reload/đóng tab → beforeunload | `dirty`, `allowLeave`, `blocker`, hai effect và dialog |

Không gom các ý định khác nhau chỉ vì dùng chung validation/client. Danh mục mới có ba flow thao tác tạo bản chào và hai hành vi bước cuối đã tồn tại trong source. Các bảng này thay thế mô tả sáu flow độc lập trong bản bàn giao trước.

## URL review

- Dependency 3.5: http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyScope=current&dependencyNode=button
- Toàn bước 3: http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyScope=step
- Tính phí: http://localhost:3181/#journey=2&step=3&sub=4&tab=overview&overviewMode=runtime&runtimeFlow=calculate
- Nhập/sửa sau tính: http://localhost:3181/#journey=2&step=4&sub=1&tab=overview&overviewMode=runtime&runtimeFlow=input-edit&field=sumInsured&hadPremium=true
- Lưu: http://localhost:3181/#journey=2&step=5&sub=5&tab=overview&overviewMode=runtime&runtimeFlow=save
- GET/rời form: ở bước 6, chọn hai mục tương ứng trong Thao tác cần theo.

Giữ nguyên URL cũ, cả mapping hành trình và mapping flow/tình huống. URL mới giữ flow, event, scenario, trường/state và path có lượt lặp; refresh và Back/Forward khôi phục context. Lịch sử tối đa 120 lượt đọc gần nhất. Chọn một event ngoài lịch sử bắt đầu đoạn đọc mới; chọn event đã đi qua cắt phần phía sau. Thay tình huống bắt đầu lại diễn giải, không đổi dữ liệu hoặc tiến độ.

## Dependency trong bước học

Hai tab chính vẫn là Tổng thể / Xây từng bước. Trong Xây từng bước có Code / Phụ thuộc của bước, với phạm vi toàn bước hoặc sub-step/mốc đang chọn. Đây là metadata được biên soạn và đối chiếu source checkpoint; không thêm scanner, engine phân tích repository hay live trace.

Chọn node đọc tên, symbol, file/range, vai trò, bước hình thành và trạng thái source; code hiện trong inspector. Mở đúng file/range chuyển sang Code cùng checkpoint. Chỉ nút Đến bước hình thành mới đổi checkpoint. Các cạnh gọi/đọc/ghi state/props-callback/type/import có nhãn và màu riêng. Cạnh ref được ghi rõ là ref, cập nhật đồng bộ.

Tại 3.5/mốc 05: nút `onClick={calculate}`, handler, validatedInput, draft/errors/message/notice/formRef, premium/setPremium, calculatedBefore/setCalculatedBefore và props PremiumSummary đều nằm trong `pages/CreateQuotation.tsx`. Validation/chuyển đổi, calendarDay/calendarDays, giới hạn tiền và calculatePremium ở `quotation/rules.ts`; trim/Number nằm trong validateAndBuildInput, không có file/helper chuyển đổi riêng. PremiumSummary ở component riêng, formatMoney ở quotation/format.ts. Contract Input/Premium đến từ bước 2. Toàn bước 3 giải thích các sub-step rule → nối validation → pricing → presentation → điểm ghép calculate; thứ tự học không phải thứ tự runtime hoặc thứ tự bắt buộc giữa các file.

Range nút calculate và props PremiumSummary được thêm ở nguồn sinh `scripts/analyze-source.mjs`; chạy `npm.cmd run checkpoints` để sinh chỉ mục. Không sửa tay `.workshop/source-index.json` hoặc checkpoint.

## Thử resize và UI

Kéo thanh giữa vùng học/preview; Tab tới thanh rồi dùng phím trái/phải. Có Thu/Mở preview và menu Đặt lại độ rộng: Cân bằng / Ưu tiên code / Ưu tiên preview. Dùng react-resizable-panels **4.15.2**, đã đọc type/API của bản cài (`Group`, `Panel`, `Separator`; size số là pixel, phần trăm dùng chuỗi). Tham khảo [API chính thức](https://github.com/bvaughn/react-resizable-panels/blob/main/README.md).

Giới hạn desktop: code 420 px, preview mở 300 px; thư viện điều chỉnh theo viewport. Kích thước lưu riêng tại `quotation-workshop.layout.v1`, version và số hữu hạn được kiểm tra/clamp; dữ liệu cũ/hỏng về cân bằng. Chỉ ghi sau tương tác/preset, không ghi liên tục mỗi pointermove. Cùng Group/Panel/iframe tồn tại khi kéo, thu/mở, đổi viewport. Không gọi Fit View khi resize. Lớp chặn iframe được gỡ khi pointerup/cancel, blur, Escape hoặc chuyển viewport. <=1050 px chuyển Hướng dẫn/Preview, có Mở riêng; không ép hai vùng nhỏ cạnh nhau.

Mỗi event có Liên hệ với UI: phát sinh từ UI / có kết quả UI / xử lý nội bộ. Chỉ trên preview cuộn và vẽ viền tạm quanh phần tử thật; Cách tự thử hướng dẫn tạo trạng thái. Chọn event/nhánh không gọi business handler, điền input, request hoặc bật lỗi. Ví dụ lỗi validation phải tự để sai rồi bấm Tính phí; lỗi lưu phải tự bật công cụ lỗi rồi bấm Lưu. Phí trống không được highlight thành phí đã tính; dialog phải đang mở; đang lưu phải có aria-busy; 404 phải là màn hình detail thực.

Mapping host theo checkpoint khả dụng, route và điều kiện DOM. Không dùng postMessage, nên không có giao thức message mới. Chỉ iframe cùng origin và chế độ mẫu được truy cập. Bài người học chưa được xác minh checkpoint/source nên không nhận mapping mẫu. Đây là giới hạn chủ ý, không phải đánh giá bài người học.

Graph luôn giữ các nhánh trên topology; điểm rẽ chưa biết không cho Tiếp vượt qua. Có thẻ nhánh/cạnh, Quay lại điểm rẽ và lịch sử occurrence; đổi nhánh bỏ phần phía sau. Nhánh chưa hình thành gắn nhãn, chỉ chuyển mốc bằng nút rõ ràng. Đường xanh là đường đang diễn giải; không tự xác nhận preview đã chạy nhánh đó. Công thức có guard RangeError nhưng calculate không catch; graph không bịa nhánh phục hồi. Lỗi response/timeout không chứng minh chưa persist hoặc đã rollback. Retry không có bảo đảm idempotency.

Biên nhận ở 09/10-list nhận response POST đã kiểm tra; từ 10 mới có GET detail. Hai kết quả này được phân biệt trong inspector, UI và hướng dẫn tự thử.

## Kiểm tra và giới hạn

Kết quả đã chạy trên source cuối:

| Kiểm tra | Kết quả |
| --- | --- |
| `npm.cmd test` | 41/41, 7 file, lượt cuối chạy riêng 3,83 giây |
| Typecheck | PASS cho workshop/practice/reference và 29 checkpoint; chạy trong build |
| `npm.cmd run build` | PASS, exit 0; còn cảnh báo chunk workshop 1.021,88 kB minified / 152,15 kB gzip |
| `npm.cmd run test:browser` | 33/33 Chrome, 4,6 phút, không skip; desktop 1440/1512/1920 và mobile 390/320 |
| `npm.cmd run test:hmr` | PASS trên bản sao riêng; sửa/quan sát không reload/khôi phục, source gốc không đổi |
| Bảo toàn | 680/680 hash practice/starter/solutions/checkpoints/toàn repo sản phẩm khớp; không có file mới trong các vùng đó |
| Preview | HTTP 200 tại http://localhost:3181; giữ server đang chạy |
| Git | `git diff --check` không báo lỗi; repo vốn untracked nên kết luận bảo toàn dựa thêm hash và parity, không suy từ diff rỗng |

Ca mới kiểm tra điểm rẽ chờ lựa chọn, lỗi/hợp lệ trong cùng graph, field/state nhất quán, success rồi lỗi sau persist, cắt history và retry lặp node, refresh/Back/Forward, range nút/setter/props, UI vắng mặt/thực có/404/dialog thật, bàn phím kéo, pointer đi qua iframe, thu/mở/preset/lưu/đổi viewport mà không remount hoặc đổi viewport graph. Các ca cũ giữ đủ Field A–F, 30 sub-step, dữ liệu/tiến độ/ghi chú, API contract/storage lỗi thật, khóa gửi lặp, lưu/reload/list/detail và rời form. Đã xem ảnh desktop và mobile trực tiếp; thêm mở rộng graph/đọc quanh node và rút gọn phần trợ giúp để dễ truy cập trên màn hình nhỏ.

Lượt hồi quy đầu có 31/32 thành công: tỷ lệ mặc định mới làm panel phân tích ở màn hình rộng chuyển sang drawer. Đã sửa preset Cân bằng về code 70% / preview 30%, giữ nguyên assertion hành vi cạnh code; lượt đầy đủ cuối 33/33. Một lượt unit chạy đồng thời với build/browser chạm timeout 5 giây ở test đối chiếu range; không sửa/skip test, chạy riêng cuối 41/41. Lỗi generic ref graph ở lượt typecheck trung gian được sửa bằng type node tường minh; build cuối thành công.

Bằng chứng ở `.verification/branches-20261030`: protected-before/after, preservation-result, build-final.log và ảnh desktop/mobile; HMR có thư mục QA riêng. Browser dùng context QA mới, không truy cập profile/dữ liệu người học. Giữ namespace, khóa tiến độ và source bài; không có thao tác migrate/reset dữ liệu thật.

Graph lớn có thể cần Mở rộng sơ đồ, Đọc quanh node/event hoặc zoom/pan. Không xây runtime instrumentation và không tự chấm bài. Chrome là trình duyệt kiểm tra; không suy ra Firefox/Safari. Kiểm tra kỹ thuật và ảnh không thay người học đánh giá trải nghiệm. Dừng tại Chặng 1 để review.
