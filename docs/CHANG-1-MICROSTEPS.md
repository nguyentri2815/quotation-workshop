# Chặng 1 · thanh tiến trình, focus và UI hình thành dần

Đợt tiếp tục ngày 30/10/2026. Giữ mở đầu và 6 bước chính / 30 sub-step. Có 29 checkpoint: tái sử dụng 22 mốc cũ, bổ sung 7 snapshot chạy thật. Không sửa sản phẩm, practice, starter hoặc solutions; không commit/push.

## Mở để review

- [Field từ contract](http://localhost:3181/#journey=2&step=1&sub=2&mark=01-field-contract&tab=build).
- [Tự focus presentation phí](http://localhost:3181/#journey=2&step=3&sub=3&tab=build).
- [Draft → input → điền mẫu](http://localhost:3181/#journey=2&step=2&sub=2&mark=02-draft&tab=build).
- [Tính phí thật](http://localhost:3181/#journey=2&step=3&sub=4&tab=build) và [Nối lưu](http://localhost:3181/#journey=2&step=5&sub=5&tab=build).

Thanh sub-step luôn nằm dưới hai tab; cuộn ngang, Trước/Tiếp và phím trái/phải/Home/End. Số vị trí và nhãn Đang xem độc lập với dấu tự kiểm tra cả bước. Đường nối là trình tự học. Mốc A–F nằm ở một thanh nhỏ riêng, không thêm sáu mục vào thanh sub-step chính.

Mở Field rồi đi A → F. Quan sát cây, code và preview theo bảng dưới; dùng Trước/Sau/Diff để đối chiếu source. Chọn “Chỉ trên preview” ở mục UI hoặc thanh range để cuộn đến vùng tương ứng và thấy viền tạm. Mốc contract không có hiệu ứng UI giả. Mở “Chi tiết nhiệm vụ” để xem kiểm chứng, phần đã có và mốc tiếp; “Chạy thử” mở panel tự kiểm tra riêng.

| Mốc | Checkpoint | Source và UI quan sát |
| --- | --- | --- |
| A. Contract | 01-field-contract | FieldProps: id, label, children; vẫn là màn hình scaffold, 0 input |
| B. Vỏ minh họa | 01-field-example | Định nghĩa Field nhận props; một input minh họa chỉ đọc, có nhãn rõ |
| C. Field đầu tiên | 01-field-first | Thay ví dụ bằng customerName trong form, bổ sung wide; 1 trường thật |
| D. Khách hàng | 01-field-customer | Tái sử dụng Field cho phone/email, thêm optional; 3 trường |
| E. Tài sản | 01-field-asset | Thêm assetName/address/sumInsured và hint; 6 trường, chưa có thời hạn |
| F. Thời hạn | 03-fields | Thêm startDate/endDate, vùng phí chờ và nút khóa; 8 trường, form tĩnh hoàn chỉnh |

Field vẫn nằm trong CreateQuotation.tsx. FieldProps là tên type phục vụ mốc contract ở cùng file; cuối sub-step ghép lại type inline và cấu trúc của source sản phẩm trong phạm vi form tĩnh. Ví dụ Field tạm không còn ở mốc C trở đi. Bước 2 mới nối dữ liệu; các input bước 1 chỉ đọc/khóa, không giả nhận state.

## Focus, cấu trúc và nguồn

Mỗi operation/milestone có file, symbol/range thực, các liên kết liên quan, trước/sau và mapping UI khi có. Chọn mốc mở đúng nhóm và chi tiết, thu phần không liên quan, cuộn explorer và code tới mục chính. Thao tác khám phá không bị kéo lại ở mỗi render. “Về nhiệm vụ hiện tại” khôi phục cả cây và code, kể cả khi đã tự cuộn code.

Presentation phân biệt Field dùng lại (contract/vỏ hiển thị) với nhóm khách hàng/tài sản/thời hạn và từng lời gọi Field. Mỗi lời gọi có range AST bao trọn props và children, liên kết về định nghĩa chung; định nghĩa liệt kê đúng các nơi dùng đã xuất hiện. “Xem đích của sub-step” bổ sung cây của đích, gắn trạng thái Chưa hình thành, không tự đổi checkpoint.

Nguồn sinh: scripts/presentation-stages.mjs và checkpoint-plan.mjs; reconstruct-checkpoints.mjs materialize snapshot. scripts/analyze-source.mjs và file-analysis.mjs tạo range/quan hệ. Không sửa tay generated artifacts; viewer và iframe cùng đọc file của checkpoint. Snapshot là source riêng, không dùng chỉ số mốc để che một form đã hoàn chỉnh.

Đã rà soát 30 sub-step: ngoài Field, 2.3 được chia thành khởi tạo draft (02-draft), nối value/change (02-inputs), nối Điền mẫu (03). Luồng Nhập/sửa ở tab Tổng thể hình thành từ 02-inputs. Các phần validation/công thức/presentation và API client/mock/storage vốn đã có mốc riêng được giữ. Submit/loading/error/retry vẫn là một điểm ghép handler hoàn chỉnh; không tạo bản tạm bỏ chặn gửi lặp hoặc bỏ xử lý lỗi chỉ để tăng số mốc.

## Host preview và bảo toàn

PreviewGuide.tsx chạy ở host, kiểm tra same-origin và whitelist mapping, quan sát DOM của iframe mẫu. Chỉ hiện nút nếu vùng thật tồn tại. Overlay tự gỡ sau khoảng 3,5 giây; không gọi focus input, không sửa value/state/storage, không gửi message. Chế độ bài tôi đang làm không có overlay này. Không thêm thư viện.

URL thêm mark là ID checkpoint. URL thiếu mark giữ đích sub-step cũ; chọn sub-step từ thanh tiến trình bắt đầu mốc đầu. Back/Forward giữ mark/file/section/range/tab/side và checkpoint tương ứng. Đổi file/tab cùng checkpoint không remount iframe; đổi checkpoint khởi tạo lại form và có giải thích trong phần dữ liệu theo mốc. Không chuyển dữ liệu đã lưu giữa namespace.

Tiến độ vẫn dùng các key cũ: không tăng hoàn thành khi xem mốc, xem lời giải hoặc chọn code. Tự kiểm tra ở cấp bước chính; không suy ra dấu hoàn thành cho từng mốc nhỏ.

## Kiểm tra và giới hạn

- Typecheck và build production đã chạy thành công cho workshop, practice, reference và 29 snapshot.
- Unit: 37/37, bao gồm mark roundtrip, default URL cũ, range/hash/quan hệ và đối chiếu 18 file sản phẩm cuối chặng.
- Chrome: lượt đầy đủ 26/26; sau chỉnh hướng dẫn cần trước/tiếp theo, chạy lại 6/6 ca mốc nhỏ. Đi qua tất cả bước/sub-step và các mốc nhỏ, kiểm tra source/range/cây/preview, URL/Back/Forward, ghi chú/tiến độ, nhập liệu giữ nguyên khi đổi file/tab, validation, phí, mất hiệu lực, lưu thành công/lỗi/thử lại, chặn lặp, reload và rời form chưa lưu.
- Desktop 1440×900, 1920×1080; mobile 390×900 và 320×900. Đã xem ảnh trực tiếp; explorer/code có vùng cuộn riêng, thanh sub-step không đi theo vùng cuộn. Mobile mở Explorer bằng toggle, không xếp cây phía trên code.
- HMR đã thử sửa/khôi phục trên bản sao QA riêng, không ghi vào bài người học.
- Đối chiếu 85 hash practice/starter/solutions/toàn repo sản phẩm được bảo vệ: không đổi, không có file mới ở các vùng đó. Context Chrome QA riêng, không dùng profile/dữ liệu thật của người học.

Bằng chứng lưu tại `.verification/microsteps-20261030`: baseline/bản sao đầu phiên, protected-before/after, preservation-result, build-final.log và ảnh Field A–F, PremiumSummary desktop, Field mobile. Các lỗi kiểm tra ban đầu về selector drawer, thời điểm cuộn sau nạp badge và source đang HMR đã được kiểm tra lại, không skip ca.

Chỉ kiểm tra Chrome; chưa xác nhận Firefox/Safari. Overlay chỉ hỗ trợ những vùng có mapping được xác minh (Field minh họa, tám trường, ba nhóm, vùng phí), không phải live trace. Bundle workshop còn cảnh báo lớn, khoảng 946 KB minified / 127 KB gzip, chủ yếu dữ liệu source/range; chưa tối ưu chia tải chỉ mục. Những ca tự động và ảnh không thay thế review trải nghiệm của người học.

Preview tiếp tục tại http://localhost:3181. Dừng ở Chặng 1 để người dùng review.
