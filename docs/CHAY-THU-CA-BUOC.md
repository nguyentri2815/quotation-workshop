# Chạy thử cả bước · engine dùng chung

[Chặng 2 — Catalog và chọn sản phẩm](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runMode=demo#checkpoint=s2-r4-contract) · [Chặng 1 — Tính phí và phản hồi lỗi](http://localhost:3181/?run=step&runScope=step&runMode=demo#journey=2&step=3&sub=0&tab=build).

Nút **Chạy thử** hiện có mở lựa chọn **Sub-step hiện tại** hoặc **Cả bước: …**. Tên phạm vi và checkpoint hiện rõ trước nút bắt đầu. Không thêm toolbar thường trực. Sub-step tiếp tục chạy đúng scenario/checkpoint đang chọn như trước.

Phiên cấp bước sử dụng một checkpoint đầu ra trong suốt hành trình. Source mẫu và preview thường của bài học vẫn được giữ phía sau, cùng draft và vị trí đọc trước khi chạy. Đây không phải chuỗi phát mọi snapshot hoặc ghép tất cả phiên sub-step.

| Chặng | Bước lớn | Checkpoint đầu ra | Hành trình tổng hợp |
|---|---|---|---|
| 1 | Mở đầu · Yêu cầu và trải nghiệm đích | `00` | Chưa chạy nghiệp vụ: giải thích mốc chưa có form và chỉ cách khám phá bản tham chiếu riêng. Không có nút chạy giả. |
| 1 | Dựng màn hình tạo bản chào | `03-fields` | Quan sát tám trường chỉ đọc, nhãn và nhóm UI; liên kết contract/Field/nơi dùng. Chưa nhập hay tính phí. |
| 1 | Nhập và quản lý dữ liệu | `03` | Nhập tên rồi sửa cùng trường; quan sát giá trị cập nhật. Chưa validation/tính phí. |
| 1 | Tính phí và phản hồi lỗi | `05` | Form rỗng → lỗi tại trường → điền mẫu → tính thành công 1.100.000 VND. |
| 1 | Giữ tính nhất quán khi sửa | `06` | Tính → sửa tên giữ phí → sửa số tiền làm phí hết hiệu lực/khóa lưu → tính lại 2.200.000 VND. |
| 1 | Lưu và xử lý kết quả | `09` | Chọn lưu thành công, hoặc HTTP 500 → giữ draft/phí → người học chủ động retry. |
| 1 | Xem lại và hoàn thiện hành trình | `12` | Tính → lưu → danh sách → mở chi tiết → reload; đối chiếu ID/số bản chào/phí. |
| 2 v4 | Baseline và đích Product | `s2-r4-00` | Quan sát form A kế thừa, nhận diện thông tin cố định trước khi có catalog. |
| 2 v4 | Catalog và chọn sản phẩm | `s2-r4-entry` | `/products` hai thẻ A/B → chọn A → ngữ cảnh A → link Danh sách bản chào → Tạo bản chào → chọn B → ngữ cảnh B. Không chạy panel/validation/lưu. |
| 2 v4 | Panel đổi sản phẩm | `s2-r4-panel` | A/draft/phí A → mở panel, chọn tạm B, hủy giữ nguyên → xác nhận B giữ draft/bỏ phí → xác nhận về A. Chưa tính B hoặc lưu. |
| 2 v4 | Validation và tính phí | `s2-r4-summary` | Chọn B → mẫu 365 ngày → lỗi giới hạn 180 ngày → sửa kỳ hạn → tính 813.699 VND và receipt đúng sản phẩm. Chưa lưu. |
| 2 v4 | Lưu và đọc lại | `s2-r4-complete` | Chọn B → validation → tính → lưu → mở lại → reload. Có lựa chọn lỗi lưu/retry chủ động hoặc adapter đọc bản ghi A cũ. |

## Cách thử

1. Mở một link trên, đọc mở đầu và bấm **Bắt đầu hành trình**. Dữ liệu nằm trong namespace API/storage riêng, form bắt đầu rỗng. Với lưu, mở Chạy thử để chọn hành trình thành công/lỗi; `runVariant=retry` mở trực tiếp phiên lỗi lưu.
2. Trong phiên, nút hình hành trình (**Hành trình cả bước**) mở danh sách đoạn và vị trí hiện tại. Mỗi đoạn có **Được xây tại…**, source/range cụ thể, các nền tảng type/contract và flow liên quan.
3. Bấm **Xem cách xây…**: engine ngừng phát thao tác tiếp theo, iframe giữ nguyên. Vùng đọc mở đúng sub-step/checkpoint, có file selector, source nhiều dòng, Trước/Sau/Diff và nhãn **Source … ↔ Phiên …** luôn hiện. Type/contract chỉ được giải thích từ source, không dựng event runtime.
4. Bấm **Trở lại phiên chạy cả bước**, rồi **Chạy** hoặc **Tiếp bước**. Không replay thao tác và không gửi lại POST. Xem flow chỉ đọc graph tại checkpoint phiên; đọc lịch sử cũng không thực thi lại action.
5. Kết thúc có kết quả DOM/MSW đã quan sát và các sub-step phối hợp. **Tự thử lại từ đầu** tạo phiên mới ở chế độ tự thao tác; **Chạy lại** trên control giữ chế độ hiện tại. Retry lưu luôn đợi người học bấm Lưu. **Quay về bài học/Thoát** trả lại checkpoint, source, draft review, bố cục và ngữ cảnh trước khi chạy, không đánh dấu hoàn thành.

Link guided Catalog: [tự thao tác A → quay lại → B](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runMode=guided#checkpoint=s2-r4-contract). Link lỗi lưu: [HTTP 500 → xem source → retry chủ động](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runVariant=retry&runMode=demo#checkpoint=s2-r4-record).

## Biên soạn và bảo toàn

`RunPlan.journey`, `StepJourney`, `JourneySegment`, `LearningLink` ở `src/workshop/run/model.ts` là contract dùng chung. `step-plans.ts` biên soạn dữ liệu, checkpoint và liên kết rõ ràng cho từng bước. `validateStepPlan` khóa plan sai trước khi chạy; unit test duyệt toàn bộ biến thể, source AST, sub-step, flow và capability. Chặng chưa có dữ liệu biên soạn bị từ chối, không suy từ tên bước.

`useRunSession` và `RunDriver` tiếp tục chạy cả hai phạm vi. “Xem cách xây” có vùng đọc riêng, không đổi selection/progress của bài học. Iframe keyed theo session ID: resize, đổi file/tab/mode không remount; restart tạo ID mới, hủy hàng đợi cũ và bỏ phản hồi muộn. Request đã gửi có thể hoàn tất trong namespace cũ, không cập nhật phiên mới. Nút điều khiển không phát thao tác khi đang xem cách xây.

Product vẫn dùng pin `stage2/product-r3.json`, SHA-256 `3d2849fa4e88d301047c39878d421d2f535677cb01fcd8b40d7b76f43f1e43f9`. Không sửa Product, practice, snapshot/manifest đã phát hành hoặc tiến độ người học. Adapter nhúng/API/storage quan sát giữ như revision4. Tuân theo [quy trình Product → review → ghim → Workshop](PRODUCT-WORKSHOP-WORKFLOW.md).

## Kiểm tra và giới hạn

| Kiểm tra | Kết quả |
|---|---|
| Unit | **93/93**, 16 file; `.verification/step-runs-unit-final.log`. Gồm 15 bộ dữ liệu cấp bước (14 hỗ trợ runtime, một mở đầu giải thích chưa có hành vi) và kiểm tra tham chiếu/khả năng. |
| Trình duyệt | **45 ca khác nhau đã đạt** qua các lượt kiểm tra: hai ca Evolution/guided B, 15 ca phiên sub-step cũ và 28 ca phạm vi cả bước. Bắt đầu từ sub-step đầu/giữa/cuối, cả demo/guided, source/flow/UI, hủy/xác nhận, lỗi/retry, pause/restart/thoát, context và readiness. |
| Lượt kiểm tra cuối cho phần thay đổi | **13/13**; `.verification/step-runs-browser-final.log`. Bao gồm mọi flow Catalog/panel đã đổi metadata, xem cách xây/return, retry không POST ngầm, desktop/mobile và queue đợi iframe. |
| Typecheck/build | **Đạt** qua `npm run build` (gồm typecheck ứng dụng và toàn bộ checkpoint), 71 checkpoint / 74 HTML entry; `.verification/step-runs-build-final.log`. |
| Giao diện | Desktop1440×900, mobile390×844 và Chrome zoom thật125%; thêm hồi quy ở320/1152/1536/1920px. Ảnh `.verification/step-run-{1440,390,mobile-peek,zoom125}.png`. |
| Tính bất biến | **1.581 file / 71 checkpoint** khớp hash manifest; 22 file runtime Product khớp pin và source Product thật. `.verification/step-runs-integrity.json`. HEAD hai repo giữ nguyên. |

Các log giữ cả lần thử chưa đạt để đối chiếu: lượt rộng đầu đạt39, một ca bốn phiên liên tiếp vượt40 giây, hai assertion mới dùng sai giả định (file contract và vị trí cuộn trước khi đổi bố cục), một ca zoom chưa chạy vì giới hạn lỗi. Lượt bổ sung xác nhận timeout với90 giây, file contract đúng, cuộn sau bố cục, zoom, đổi bước/variant và đợi iframe. Test đếm POST được sửa để theo session xuyên reload thay vì đếm bridge vừa khởi tạo lại. Lượt cuối13/13 xác nhận retry vẫn đúng hai POST chủ động, mở source/history không thêm POST, cùng các phần graph vừa sửa. Tổng45 là số ca khác nhau đạt, không cộng trùng giữa các lượt.

Build còn cảnh báo kích thước bundle trên500kB và cảnh báo cấu hình native của Vite; không có lỗi typecheck/build. Bảng này không được dùng để suy rằng người dùng đã duyệt Product.

Bằng chứng đo là DOM/UI và HTTP MSW; hàm, React state, công thức và quan hệ nội bộ được giải thích từ source. Không tự chạy practice. Bước mở đầu Chặng 1 chưa có runtime nghiệp vụ. Chỉ các hành trình và capability đã biên soạn được chạy; không triển khai Chặng 3.
