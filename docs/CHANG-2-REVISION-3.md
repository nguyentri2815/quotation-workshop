> Phiên bản bài học cũ. [Revision4 hiện hành và bảng nhịp học](CHANG-2-REVISION-4.md); source/ID revision3 giữ nguyên.

# Chặng 2 · Revision 3 theo Product hiện hành

Đích đối chiếu do người dùng chỉ định trong lượt 01/11/2026. [Quy trình áp dụng từ nay](PRODUCT-WORKSHOP-WORKFLOW.md). Các biên bản Preview1/2 và revision2 là lịch sử; test/báo cáo hoàn thành không thay thế người dùng đồng ý Product.

## Mở review

- [Hành trình hiện hành](http://localhost:3181/?stage=2&version=3#checkpoint=s2-r3-00).
- [Tính phí · điểm thay đổi validation](http://localhost:3181/?stage=2&version=3#checkpoint=s2-r3-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate&runtimeEvent=validate&compareChanges=true).
- [Flow mới chọn / đổi sản phẩm](http://localhost:3181/?stage=2&version=3#checkpoint=s2-r3-complete&tab=overview&overviewMode=runtime&runtimeFlow=product&runtimeEvent=choose&compareChanges=true).
- [Hành trình phát triển và source trước/sau](http://localhost:3181/?stage=2&version=3&screen=evolution#requirement=consistency).
- [Product ở cổng3180](http://localhost:3180/products).

## Chuỗi học mới

| ID mới | Khả năng hình thành | Route preview / khả năng chưa nối |
| --- | --- | --- |
| s2-r3-00 | Source Chặng 1 hoàn chỉnh, nguyên byte từ s2-00 | `/quotations/new`; chưa có catalog |
| s2-r3-catalog | Catalog và trang chọn hai sản phẩm | `/products`; nút tạo chưa nối, form A baseline còn dùng được |
| s2-r3-entry | Chọn trên trang → kiểm mã URL → initialCode → form/ngữ cảnh gọn | `/products`; A tính được, B và lưu chưa nối; chưa có panel |
| s2-r3-panel | Candidate trong panel, hủy/Escape giữ nguyên, xác nhận giữ draft và bỏ phí | `/products`; B và lưu chưa nối |
| s2-r3-validation | Validation theo mã và giới hạn catalog, revalidation sau sửa/đổi | `/products`; B365 lỗi180; công thức B/lưu chưa nối |
| s2-r3-pricing | Công thức tham số hóa, receipt + kiểm code/version/đầu vào | `/products`; B180=813.699, lưu chưa nối |
| s2-r3-complete | POST tự kiểm/tính, snapshot biểu phí, GET lịch sử và adapter A cũ | `/products`; khớp đích ghim |

Không có bước đi qua selector trong thẻ form hoặc “refactor UI” bắt buộc. Các action chưa nối bị khóa ngay ở UI; handler lưu ở mốc2–5 không gửi POST. Mốc validation cho phép B trả lỗi; công thức B chỉ nối ở mốc pricing.

## Phương án cũ đã được đưa khỏi đâu

| Thành phần cũ | Xử lý ở revision hiện hành | Nơi giữ lịch sử |
| --- | --- | --- |
| Thẻ catalog lớn trong form, selector `#productCode` | Không có ở mọi checkpoint v3; catalog nằm tại `/products` | Snapshot Preview1/2, manifest cũ |
| Nội dung giải thích bài học trong Product | Hướng dẫn ở nhiệm vụ/Chạy thử/inspector của Workshop | Source Product cũ trong snapshot lưu trữ |
| Đổi trực tiếp qua selector, `productSupported`, `product-action-note` | Không tồn tại trong source form v3; panel candidate → hủy/xác nhận | `src/stage2/archive/`, các checkpoint cũ |
| ID s2-00…s2-06 và s2-r2-ui/complete | Không có trong sidebar, selector preview, trước/tiếp, gợi ý chạy của v3 | URL version1/2 hiện “Phiên bản bài học cũ” và link tương ứng |
| Bước refactor UI sau chuỗi cũ | Không là bước học của v3 | s2-r2-ui vẫn giữ source/hash cũ |
| FixedInformation của baseline | Rời form từ s2-r3-entry; chỉ hiện như thành phần đã loại bỏ trong so sánh | Source baseline và file Product ghim không bị xóa |

`archiveMapping` ánh xạ từng ID lịch sử tới ID v3. Dù URL ghi version3 nhưng chứa checkpoint cũ vẫn mở lưu trữ và cảnh báo, không lặng lẽ đổi source. Tiến độ/ghi chú v3 có key `quotation-workshop.stage2.progress.v3`, bắt đầu rỗng. Key v1/v2, Chặng1, practice và mọi dữ liệu cũ được giữ; không di chuyển/xóa dữ liệu browser.

Đổi chặng mặc định chỉ khôi phục vị trí v3; session từng nhớ revision cũ không đưa thiết kế cũ trở lại hành trình chính. Chuyển hash/Back/Forward qua revision được phân quyền theo ID trước khi chuẩn hóa selection. URL tình huống không hỗ trợ hiện lý do và không tự chạy tình huống thay thế. Thoát Chạy thử gỡ tham số autorun; đọc checkpoint rồi quay lại không tự POST lần nữa.

## Flow và bằng chứng

So sánh mặc định: checkpoint **12** (Chặng 1 hoàn chỉnh) → **s2-r3-complete**. Metadata dùng ID ngữ nghĩa ổn định ở `src/stage2/changes.ts`; source/range tra riêng từng revision bằng AST, không ghép số dòng. Cùng record dùng ở tổng thể, từng thao tác, cây phụ thuộc và hành trình phát triển.

| Flow | Phân loại | Điểm đối chiếu source |
| --- | --- | --- |
| Nhập/sửa | Kế thừa, có thay đổi | `updateDraft`/`inputProps` giữ policy ba đầu vào, thêm revalidation; `premiumMatchesDraft` và `currentPremium` kiểm sản phẩm/phiên bản |
| Tính phí | Kế thừa, có thay đổi | `validateDraft`/`validateAndBuildInput` nhận mã, `calculatePremium` tra catalog; `calculateDraftPremium` tạo receipt |
| Lưu | Kế thừa, có thay đổi | `save` guard currentPremium; `parseQuotationInput` kiểm code/version; `createQuotation` tự tính và lưu productSnapshot |
| Đọc lại | Kế thừa, có thay đổi | `parseQuotation` từ rules.ts chuyển sang records.ts; đọc snapshot, adapter A cũ hẹp; readQuotationReport cách ly row lỗi |
| Rời form | Kế thừa, không đổi | blocker, dirty, allowLeave, dialog và beforeunload giữ cùng hành vi |
| Chọn/đổi sản phẩm | Mới ở Chặng 2 | SelectProduct/QuotationEntry, ProductInformation.candidate và CreateQuotation.changeProduct |

Node/edge bình thường giữ ngữ cảnh. Điểm mới có “Mới”, điểm đổi có “Thay đổi”; thành phần bỏ chỉ hiện khi bật so sánh và không được theo như nhánh hiện hành. Viền đen chỉ selection, ✓ và đường xanh chỉ lượt đã đi, badge vàng chỉ delta. “Đã có/chưa hình thành tại mốc” là dòng riêng. Điểm thay đổi trước/tiếp chỉ điều hướng đọc; không tự Fit View, không tính/lưu/đổi sản phẩm. Inspector mở source trước/sau đúng mốc kể cả khi chuyển file.

Ví dụ cạnh bị thay thế có source thật: `CreateQuotation.props.PremiumSummary` ở Chặng1 truyền trực tiếp premium; Chặng2 đi qua currentPremium/receipt-match. Cạnh trực tiếp chỉ hiện trong so sánh. Phiên chạy sửa tiền/ngày có đường diễn giải đủ draft → compare → invalidate → update; chỉ thêm matches khi helper đã có ở checkpoint. Các mốc sớm dừng phần diễn giải trước policy chưa xây, không coi DOM quan sát được là bằng chứng helper đã chạy.

## Product ghim và adapter

`stage2/product-r3.json` ghi commit nền **83faf6641b66aff178b08cae8877f5397134186a** cùng trạng thái working tree có sửa đổi. Hash tổng danh sách file:

`3d2849fa4e88d301047c39878d421d2f535677cb01fcd8b40d7b76f43f1e43f9`

Bản ghim bao gồm **22 file runtime** thực tế, không lấy HEAD thay cho thay đổi chưa commit. Mốc cuối đối chiếu từng file sau khi đảo adapter:

| Adapter công khai | Khác biệt với Product |
| --- | --- |
| App.tsx | BrowserRouter → HashRouter để nhúng checkpoint |
| main.tsx | Dùng workerOptions của Workshop, mount công cụ riêng |
| api/quotations.ts, mocks/handlers.ts | Namespace API theo checkpoint / run session |
| mocks/storage.ts | Namespace storage theo checkpoint / run session; không dùng key Product |
| `_workshop/*`, index.html | Shell nhúng, công cụ lỗi một lần và fixture A cũ chỉ dùng trong phiên riêng |
| preview-run-plugin | Chỉ instrument bridge MSW trong bản serve/build; raw source hiển thị không bị viết lại |

Adapter đọc record A cũ trong **quotation/records.ts** thuộc Product đã ghim; không phải sai khác nhúng. Nó chỉ nhận record A gốc thiếu toàn bộ metadata mới, không fallback mã lạ/metadata lỗi; GET không ghi lại storage. Khung Workshop/Header/BuildSession/SourcePanel/Preview/run engine dùng chung Chặng1; không có toolbar riêng cho Chặng2.

## Kiểm tra và giới hạn

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run stage2:materialize` | Xác minh bản ghim và tái hiện đúng 7 checkpoint v3; index xác minh 16 checkpoint Chặng2, giữ các ID lịch sử |
| Workshop `npm test -- --maxWorkers=2` | **69/69**, 13 file; gồm hash/range/đối chiếu Product, source trước/sau mọi record thay đổi, ID chuyển file, dependency sites và capability từng scenario |
| Product `npm test -- --maxWorkers=2` | **37/37**, 4 file; không sửa runtime Product |
| `npm run build` | **Exit0**, bao gồm cả hai typecheck (Workshop và mọi checkpoint), Vite build thành công |
| Browser Chrome | **40 kịch bản khác nhau được xác minh qua các lượt chạy và kiểm tra lại sau sửa lỗi** trong stage2-current, evolution-guided, branching, unified-workspace và một case redesign; không tuyên bố đã chạy toàn bộ browser suite |
| Chuỗi v3 | Đã mở cả 7 mốc; route, source, UI, nút chưa nối, catalog ngoài form, không có selector cũ |
| Hành vi | Hủy/Escape/xác nhận panel, giữ draft, phí hết hiệu lực; A365/B180, validation B365, lưu/mở lại/reload, lỗi/retry chủ động, adapter A gốc |
| Đọc và tương thích | Graph/source/history không POST; sau thoát run đổi mốc không autorun; URL cũ/hash/Back/Forward, cảnh báo lưu trữ, chuyển mốc, tiến độ không tự hoàn thành |
| Bố cục | 1440×900, 1920×1080, 390×900; vùng code đủ chiều cao, không tràn ngang document; không remount iframe hoặc Fit View khi đọc/resize |
| Bảo toàn | HEAD hai repo không đổi; src/practice, starter, sample, src/reference và manifest Chặng1 không bị sửa trong lượt này; cổng3180/3181 giữ nguyên |

Các lần lỗi đã được xử lý và kiểm lại: nhãn cũ trong test sau khi đổi yêu cầu Evolution; assertion dùng mã trong khi Product hiển thị tên/phiên bản; bridge MSW được tạo mới sau reload nên chuyển đếm POST sang toàn phiên; focus Escape của test cần đặt đúng control dialog. Một lỗi thực tế với URL chỉ đổi hash đã được sửa bằng quyền sở hữu URL của từng revision trước chuẩn hóa. Lần chạy unit đồng thời build/browser có 4 timeout5 giây; chạy lại với2 worker đạt69/69. Log/screenshot cục bộ ở `.verification/revision3-*` và `.verification/revision3/`; không dùng các báo cáo này thay thế phê duyệt Product.

Các giới hạn chủ đích: Chặng2 chưa có starter/practice adapter riêng, không tự chấm; hàm/state/render trong flow là diễn giải source, bằng chứng chạy thật là DOM/MSW. Các checkpoint là lộ trình biên soạn, không phải lịch sử Git. Chưa kiểm Chrome zoom125% trong lượt này. Vite còn cảnh báo chunk lớn và import extension cho configLoader native tương lai; build hiện tại vẫn đạt. Chưa commit/push, không triển khai Chặng3.
