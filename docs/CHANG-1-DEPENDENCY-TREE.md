# Chặng 1 · cây thư mục và quan hệ ngay trên cây

Tiếp tục phiên dở ngày 30/10/2026, chỉ cải thiện **Phụ thuộc của bước** trong quotation-workshop. Giữ 6 bước / 30 sub-step, 29 checkpoint, Field A–F, practice/starter/solutions, dữ liệu và tiến độ. Repo quotation-product chỉ đọc. Không commit/push hoặc chuyển Chặng 2.

## URL và cách review

- [Bước 3.4 · props vùng phí](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props).
- [Bước 3.5 · handler calculate](http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyNode=calculate).

Ở 3.4, bấm dòng **Truyền props → Trình bày phí · PremiumSummary** ngay dưới nhóm props trong CreateQuotation.tsx. Cây mở component ở file thật; dưới component có **Phụ thuộc type → Premium** và **Gọi → formatMoney**. Bấm formatMoney rồi **Quay lại lựa chọn trước** để trở về PremiumSummary. Inspector giữ cạnh đã theo, có chọn nguồn/đích trên cây và xem code nguồn/đích. Chọn từng vị trí trong bốn lời gọi định dạng net/tax/total/installmentAmount; Code highlight range tương ứng, không thay bằng toàn file. Mở **Quan hệ vào** để theo liên kết ngược về nơi truyền props.

Ở 3.5, calculate có liên kết thật tới validatedInput, calculatePremium và các setter premium/calculatedBefore/notice. Theo calculatePremium sang quotation/rules.ts hoặc validatedInput để đọc chuỗi validation. Các symbol vẫn ở file định nghĩa gốc.

Thử thu folder quotation rồi theo liên kết formatMoney: folder, file và symbol tự mở, cây cuộn tới đích và highlight. Thử chuyển Code/Phụ thuộc, resize preview, Back/Forward và reload URL. Trong Code chọn Trước của 3.4, trở lại cây rồi bật **Xem phần chưa hình thành** để thấy PremiumSummary tương lai. Hoặc ở 3.4 chọn phạm vi Toàn bước, bật tương lai và mở quan hệ calculate → calculatePremium: quan hệ ghi rõ chưa hình thành; chỉ nút **Đến mốc 05** mới đổi checkpoint.

## Source và cách biểu diễn

- Tái sử dụng SourceTree, manifest checkpoint, index range và dữ liệu dependency đã có. Folder/file/symbol thể hiện bao chứa; quan hệ là dòng liên kết có hướng dưới symbol, không tạo cây file theo dependency hoặc sao chép định nghĩa đích.
- Mỗi định nghĩa có khóa file + qualified symbol duy nhất. Mặc định giữ đầy đủ cây file, mở các file liên quan và symbol chính/quan hệ trực tiếp. Symbol khác trong file liên quan mở thêm bằng disclosure; các file còn lại vẫn ở vị trí vật lý và có thể mở bình thường.
- Toàn bước/Sub-step quyết định phần liên quan và focus, không bỏ cây file. Đang xem, Liên quan, Mới/Đã sửa tại mốc và Chưa hình thành có nhãn riêng. File được chọn độc lập với symbol; chọn module rỗng hoặc symbol không hợp lệ không nhảy sang định nghĩa khác.
- Quan hệ vào suy ra bằng lọc cùng tập cạnh dùng cho quan hệ ra. Không lưu bản metadata ngược độc lập. Type là tham chiếu compile time; props vùng phí chỉ có dữ liệu premium/stale, không gắn nhãn callback.
- Chỉ mục build bổ sung range tham chiếu cho các cạnh đã biên soạn, với danh sách tên hữu hạn. Không thêm scanner/engine tìm dependency repository. Chỉ sửa nguồn sinh; không sửa tay .workshop/source-index.json hoặc snapshot. Script chuẩn xác minh hash trước khi sinh index.
- 03-summary: PremiumSummary nhận Premium/null/stale, gọi formatMoney bốn lần. CreateQuotation chỉ ghép presentation, chưa gọi calculatePremium trong calculate. Từ 05 mới nối lời gọi công thức và setter. Quan hệ chỉ sẵn sàng nếu có cả định nghĩa và vị trí tham chiếu tại checkpoint.
- URL dependencyNode cũ ánh xạ tới file/symbol tương ứng; URL mới giữ cạnh và vị trí code nguồn. Cây không remount khi đổi Code/Phụ thuộc; resize không khởi tạo lại disclosure/scroll hoặc iframe. Đổi sub-step/mốc focus lại đúng phần liên quan. Lịch sử chọn trong cây hữu hạn và bắt đầu lại khi đổi ngữ cảnh bước/mốc/phạm vi; browser Back/Forward giữ selection qua URL mà không đẩy thêm vòng history.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| npm.cmd test | 47/47, 8 file, lượt cuối 3,57 giây |
| npm.cmd run typecheck | PASS cho workshop/practice/reference và 29 checkpoint |
| npm.cmd run build | PASS, exit 0; Vite build 12,19 giây, còn cảnh báo chunk workshop 1.230,41 kB minified / 191,41 kB gzip |
| npm.cmd run test:browser | 37/37 Chrome, 4,9 phút, không skip |
| Kiểm tra bổ sung | PASS: selection ban đầu, code đích PremiumSummary đúng range, quan hệ ngược trên cây và checkpoint giữ nguyên |
| Bảo toàn đầu phiên tiếp tục | 719/719 hash khớp; không thêm/xóa file trong practice/starter/solutions/checkpoints/sample/reference/toàn repo sản phẩm đã bảo vệ |
| Baseline phiên dở | 683/683 hash khớp |

Bộ trình duyệt bao gồm chuỗi props/type/call, nhiều vị trí code, định nghĩa duy nhất, folder tổ tiên thu/mở, source trước/sau, phần tương lai và chuyển mốc chủ động, resize/đổi tab giữ cây và iframe, legacy URL/Back/Forward, sáu bước/30 sub-step, Field A–F và thanh tiến trình cố định, flow hành vi có nhánh, lưu/lỗi/retry/storage/reload/rời form và dữ liệu/tiến độ riêng. Chrome chạy bằng context QA mới, không mở profile người học.

Lượt unit ban đầu khi preview đang khởi động chạm timeout 5 giây ở kiểm tra range cũ; lượt riêng cuối đạt đủ 47 ca, không đổi timeout/skip. Ca tương lai ban đầu phát hiện fallback sai sang symbol khác khi định nghĩa chưa có; đã sửa và chạy lại. Kiểm tra dialog xác nhận source có ba call site (Escape, Tiếp tục nhập, Bỏ dữ liệu), gồm hai reset và một proceed; không gộp mất vị trí code.

Ảnh desktop/mobile, script kiểm tra nguồn/đích, bản sao source trước sửa, protected-before và preservation-result ở `.verification/dependency-tree-resume-20261030`. Bộ test cũng giữ ảnh chuỗi liên kết trong `.verification/dependency-tree-20261030`.

## Giới hạn

Quan hệ là tập hữu hạn được biên soạn cho bài học và đối chiếu source ghim, không phải mọi dependency của ứng dụng hoặc live trace. Symbol tồn tại dạng scaffold có thể có trước vai trò hoàn chỉnh; inspector và nhãn khung phân biệt hai thời điểm. Cần cuộn/mở thêm disclosure khi cây lớn; màn hình hẹp đặt inspector dưới cây. Chỉ xác minh Chrome, chưa kết luận Firefox/Safari. Bundle workshop còn lớn, chủ yếu dữ liệu index/range; không mở rộng đợt này sang tối ưu chia tải. Không truy cập hay chỉnh dữ liệu profile thật; bằng chứng bảo toàn là hash, code và context kiểm thử riêng.

Preview giữ ở http://localhost:3181. Dừng tại Chặng 1 để người dùng review.
