# Quotation Workshop · Chặng 1 và Chặng 2

Chặng 1 theo hành vi: mở đầu và **6 bước chính, 30 bước con, 29 checkpoint**. Source mẫu, phân tích và preview cùng một checkpoint; bài người học ở src/practice được giữ riêng.

[Tiếp tục trên máy khác — trạng thái hiện tại, cặp phiên bản và Bản đồ của bước](docs/CONTINUE-ON-OTHER-MACHINE.md). Bản đồ của bước là nhiệm vụ tiếp theo cho Chặng 2; nền tảng provenance/dependency/flow/Chạy thử đã có, giao diện hai cách đọc chưa hoàn chỉnh.

[Bàn giao Chặng 1, kiểm tra và chuyển máy](docs/CHANG-1-HANDOFF.md) · [Kế hoạch Chặng 2](docs/CHANG-2-PLAN.md) · [Preview 1](docs/CHANG-2-PREVIEW-1.md) · [Preview 2 và kiểm tra thực tế](docs/CHANG-2-PREVIEW-2.md).

**Revision hiện hành: v4**, theo [Product đã ghim và biên bản điều chỉnh](docs/CHANG-2-REVISION-4.md). [Mở Chặng 2](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-00) · [Tính phí có điểm thay đổi](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate&runtimeEvent=validate&compareChanges=true) · [Flow mới chọn/đổi sản phẩm](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=product&runtimeEvent=choose&compareChanges=true).

[Quy trình Product → người dùng review/đồng ý → ghim source → thiết kế Workshop](docs/PRODUCT-WORKSHOP-WORKFLOW.md) áp dụng từ nay. Product đổi thiết kế phải rà toàn bộ bài liên quan; test đạt/báo cáo hoàn thành không thay thế phê duyệt. Trong lượt này dùng Product hiện hành làm đích theo chỉ định người dùng, không mở rộng nghiệp vụ.

Chặng1 giữ baseline. Chặng2 v4 có **26 checkpoint source nhiều dòng**, vẫn năm bước lớn: baseline → contract → object A → page một sản phẩm → catalog A/B/map → presentation → route/ngữ cảnh → panel từng phần → validation → công thức/receipt/presentation → contract lưu/API/đọc/submit. [Bảng sub-step/source/UI và cách theo nguồn dữ liệu](docs/CHANG-2-REVISION-4.md). “Ngắt dòng dài” dùng chung cả hai chặng; source/preview/flow/dependency/Chạy thử cùng ID. Tiến độ v4 riêng, không tự hoàn thành từ revision cũ; practice và dữ liệu người học giữ nguyên.

Khu vực lưu trữ: [revision3](http://localhost:3181/?stage=2&version=3#checkpoint=s2-r3-complete), [revision2](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete), [Preview1/2](http://localhost:3181/?stage=2&version=1#checkpoint=s2-00), [biên bản workspace trước đây](docs/WORKSPACE-CHANG-1-2.md), [thiết kế trước đây](docs/CHANG-2-REDESIGN.md). Link cũ có thông báo “Phiên bản bài học cũ” và đường sang mốc mới; không đổi source dưới ID cũ. `journey=2` vẫn là Chặng1. Giữ preview Product3180 / Workshop3181; công việc được lưu trên `main` trong lượt bàn giao 01/11/2026; chưa triển khai Chặng 3.

Cập nhật mới: [Chạy thử cả bước dùng chung và bảng checkpoint/phạm vi](docs/CHAY-THU-CA-BUOC.md), [Chạy thử có quan sát, phiên riêng và link mở trực tiếp](docs/CHANG-1-RUN-SESSIONS.md), [bố cục Xây từng bước](docs/CHANG-1-BUILD-LAYOUT.md), [workspace flow và cây phụ thuộc](docs/CHANG-1-WORKSPACE.md). Source và quan hệ giữ theo [bản cây phụ thuộc](docs/CHANG-1-DEPENDENCY-TREE.md), [flow có nhánh](docs/CHANG-1-BRANCHING.md).

- [Review cây phụ thuộc 3.4 · props → PremiumSummary → Premium/formatMoney](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props).
- [Review cây phụ thuộc 3.5 · calculate và dependency thực tế](http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyNode=calculate).

## Bắt đầu

- Field từ contract đến ba nhóm: http://localhost:3181/#journey=2&step=1&sub=2&mark=01-field-contract&tab=build
- Auto-focus presentation phí: http://localhost:3181/#journey=2&step=3&sub=3&tab=build
- Hành trình: http://localhost:3181/#journey=2&step=0&sub=0&tab=build
- Nối validation: http://localhost:3181/#journey=2&step=3&sub=1&tab=build
- Nối tính phí: http://localhost:3181/#journey=2&step=3&sub=4&tab=build
- Nối lưu: http://localhost:3181/#journey=2&step=5&sub=5&tab=build

Yêu cầu Node >=22.12; lượt bàn giao 01/11/2026 xác nhận **Node 24.18.0 / npm 11.16.0** trên Windows. Nhánh bàn giao: `main`. Chạy từ thư mục cha bạn chọn:

```powershell
git clone https://github.com/nguyentri2815/quotation-workshop.git
Set-Location .\quotation-workshop
npm.cmd ci
npm.cmd run dev -- --strictPort
```

Mở http://localhost:3181. Giữ package-lock.json và đúng hostname/port để dùng lại localStorage. `--strictPort` không tự chuyển cổng khi bị chiếm. Runtime/dev/build không cần chạy hay có repo sản phẩm bên cạnh, core-insurance-portal, Codebase Learning Workspace, đường dẫn Windows cũ hoặc `.env`.

Để chạy toàn bộ `npm.cmd test`, đặt repo Product tương ứng vào **cùng thư mục cha**, tên `quotation-product`. `tests/stage2.test.ts` đọc `../quotation-product/src` để đối chiếu snapshot cuối Chặng 2; Chặng 1 đối chiếu release ghim và hash trong `sample/product-source.json`, không yêu cầu Product hiện tại dừng phát triển. Kiểm thử không ghi vào Product và không cần Product đang chạy. Product dùng port 3180 nếu mở trong terminal riêng.

Git bao gồm đủ `src/practice`, `src/reference`, `sample/product`, **71 checkpoint (29 Chặng 1 + 42 Chặng 2), manifests**, `.workshop/source-index.json` và `stage2/source-index.json`. `predev`, `pretest`, `typecheck` và `build` tự xác minh hash snapshot và sinh lại chỉ mục từ script; không thay source mẫu hay bài người học. Không chạy explicit materialize để thay phiên bản source khi chỉ muốn review. `.gitattributes` giữ byte source ghim/snapshot/practice qua checkout Windows.

Tiến độ, ghi chú và bản chào demo ở browser profile cũ **không có trong Git**. Làm theo [xuất/import riêng các key Workshop](docs/BROWSER-DATA-TRANSFER.md); lưu backup ngoài hai repo và giữ URL review/bookmark riêng nếu muốn tiếp tục đúng selection.

## Trình tự mới

| Bước | Hành vi và kết quả | Checkpoint theo thứ tự |
| --- | --- | --- |
| Mở đầu | Yêu cầu, phạm vi, trải nghiệm bản hoàn chỉnh, nhận diện scaffold | 00 |
| 1. Dựng màn hình | Entry/route, Field và đủ bố cục tĩnh; nút/trường khóa có giải thích | 01 → 01-field-contract → example → first → customer → asset → 03-fields |
| 2. Nhập và quản lý dữ liệu | Contract, draft ownership, value/change, điền mẫu | 02 → 02-draft → 02-inputs → 03 |
| 3. Tính phí và lỗi | Validation nối ngay → công thức → presentation → nối calculate | 04-rules → 04 → 05-rules → 03-summary → 05 |
| 4. Nhất quán khi sửa | Đổi tiền/ngày mất phí; đổi tên giữ phí; điều kiện lưu | 06-rules → 06 |
| 5. Lưu và kết quả | Contract → client/probe → storage/mock → submit, loading/lỗi/thử lại | 07-contract → 07-client → 07 → 08-storage → 08 → 09 |
| 6. Hoàn thiện | GET list/detail, reload, bảo vệ rời trang, hành trình và tổng kết | 10-list → 10 → 11 → 12 |

ID checkpoint là định danh ổn định, **không phải số bước mới**. Các thao tác đọc/quan sát có thể dùng chung snapshot và nói rõ UI không đổi. Trình tự là tái dựng để học, không phải lịch sử Git.

## Trải nghiệm

Giữ ba vùng, tab Tổng thể / Xây từng bước và preview Theo bước mẫu / Bài tôi đang làm. Tổng thể tách cấu trúc dependency và graph sự kiện có nhánh: Nhập/sửa, Tính phí, Lưu bản chào, Đọc dữ liệu đã lưu, Rời form. Có điểm đầu/cuối, cạnh điều kiện, inspector và lịch sử lượt đi qua node. Đây là diễn giải từ source, không phải live trace; setter React xếp cập nhật cho lần render sau. Điểm rẽ chưa biết chờ người học chọn tình huống; graph không tự thực hiện nghiệp vụ trên preview.

Xây từng bước có Code / Phụ thuộc của bước, hai phạm vi toàn bước hoặc sub-step/mốc; cây thư mục thật chứa symbol và các liên kết có hướng, chọn đích tự mở tổ tiên, cuộn và highlight. Định nghĩa có một vị trí; quan hệ ngược dùng cùng dữ liệu cạnh. Inspector có code/range, nguồn/đích, chọn vị trí tham chiếu và Quay lại; không tự đổi checkpoint. Thanh kéo giữa vùng học và preview hỗ trợ bàn phím, thu/mở, preset và lưu kích thước. Resize giữ iframe/form/selection và không tự Fit View. Mobile chuyển vùng Hướng dẫn/Preview. Liên hệ với UI trong event chỉ highlight phần tử thật đang tồn tại; nếu thiếu thì có giải thích và Cách tự thử.

Explorer mặc định Cấu trúc tính năng; chuyển Cây thư mục vật lý khi muốn xem vị trí file. Vai trò có symbol/range thật, trạng thái theo checkpoint, liên kết và đường quay lại. Cây chỉ nhóm trách nhiệm, không tạo layer Consumer/Intent. CSS đầy đủ vẫn xem trong cây vật lý. Panel Bên trong file nhóm contract, state, policy, intent, normalization, orchestration, presentation và lifecycle; chỉ hiện nhóm có source tại mốc đó.

Code toàn file dùng Shiki, số dòng, highlight hẹp và Trước/Sau/Diff. Trước đổi cả source và preview; Diff chạy Sau. Đổi file/tab cùng checkpoint giữ iframe và dữ liệu đang gõ. URL giữ context và Back/Forward. Chưa có hành vi thì giải thích và cho người học chủ động đến mốc phù hợp.

Thanh sub-step ở ngay dưới hai tab, không cuộn theo code/explorer. Dùng Trước/Tiếp, phím trái/phải hoặc Home/End; đây là trình tự hướng dẫn, không phải runtime flow. Mốc nhỏ của Field và draft có source chạy riêng. Chọn mốc tự mở đúng nhóm/chi tiết/file/range; tự khám phá không bị kéo lại, nút **Về nhiệm vụ hiện tại** khôi phục focus. **Chi tiết nhiệm vụ / Chạy thử** mở panel riêng; mobile dùng nút Explorer.

Field được phân biệt giữa định nghĩa chung (contract, vỏ hiển thị) và từng nơi dùng (props/children). **Xem đích của sub-step** hiện các phần chưa hình thành mà không tự đổi mốc. **Chỉ trên preview** chỉ hiện khi host tìm thấy vùng UI có mapping; cuộn và viền tạm, không đổi state hoặc focus input.

Tham số URL **mark** chọn mốc nhỏ. URL cũ thiếu mark vẫn mở đích cũ của sub-step; chọn sub-step từ thanh tiến trình bắt đầu ở mốc đầu tiên. Đổi checkpoint khởi tạo lại form, dữ liệu đã lưu vẫn thuộc namespace cũ. [Bàn giao mốc nhỏ và kiểm tra](docs/CHANG-1-MICROSTEPS.md).

## Cách thử

**Nối validation:** để form rỗng → Tính phí → lỗi cạnh input và focus đầu tiên. Trong cây mở intent, validation, errors và presentation lỗi; Tổng thể → Theo một thao tác → Tính phí → nhánh Có lỗi. Điền mẫu đúng ở mốc 04 mới chỉ kiểm tra; sang 05 để thấy phí thật 1.100.000 VND.

**Nối lưu:** điền mẫu → tính phí → lưu. Mở Công cụ riêng workshop → Gây lỗi lần lưu kế tiếp để thử lỗi và retry; draft/phí được giữ. Theo các nhánh trong cùng flow Lưu bản chào ở Tổng thể. Mốc 09/10-list dùng **biên nhận POST có nhãn riêng**, đọc từ response đã kiểm tra; chưa phải GET detail, reload biên nhận không giả báo thành công. Bước 6 thay bằng trang GET hoàn chỉnh.

## Source và dữ liệu

- src/practice: bài người học, không bị generator ghi đè; starter/solutions legacy được bảo toàn. [Đối chiếu starter cũ](docs/STARTER-CU-CHUYEN-DOI.md).
- sample/product: 18 file runtime sản phẩm ghim nguyên văn, chỉ để đọc. Cuối chặng trùng sản phẩm sau năm adapter nhúng hữu hạn. [Bảng đối chiếu](docs/CHANG-1-SOURCE-REVIEW.md).
- scripts/checkpoint-plan.mjs, presentation-stages.mjs và sample-source.mjs: nguồn thứ tự và tái dựng. reconstruct-checkpoints.mjs sinh snapshots; không sửa tay checkpoints hoặc .workshop/source-index.json.
- `npm.cmd run checkpoints` xác minh hash và sinh chỉ mục AST/range. Build/dev/test không ghi đè snapshot đã có. Explicit materialize chỉ dùng khi chủ động tái dựng nguồn mẫu.
- _workshop: namespace HTTP/storage/Service Worker, host/probe và thử lỗi; không thuộc sản phẩm. HashRouter chỉ phục vụ nhúng/reload.

Tiến độ cũ `quotation-workshop.guide.v1` giữ nguyên, chỉ đọc tham khảo cùng ghi chú. Tiến độ mới `quotation-workshop.behaviors.v2` không kế thừa dấu hoàn thành. Xem lời giải hoặc chọn code không tăng hoàn thành. URL cũ không có journey=2 được mapping và có thông báo.

| Chế độ | API | localStorage |
| --- | --- | --- |
| Bài người học | /api/practice/quotations | quotation-workshop.practice.v1 |
| Tham chiếu | /api/reference/quotations | quotation-workshop.reference.v1 |
| Checkpoint | /api/checkpoints/<id>/quotations | quotation-workshop.checkpoint.<id>.v1 |

Không tự di chuyển dữ liệu giữa mốc. Demo: số tiền nguyên 1 triệu–100 tỷ, thời hạn 1–365 ngày lịch; net=round(sum×0.001×days/365), tax=round(net×0.1). Đây là phí giả lập.

## Kiểm tra và giới hạn

`npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:browser`, `npm.cmd run test:hmr`. Browser cần preview đang chạy và Chrome. HMR dùng bản sao riêng. `test:journey` chỉ là kiểm tra starter/solutions legacy, không đại diện hành trình mới.

[Kết quả Chặng 1](docs/CHANG-1-VERIFICATION.md) và [preview Chặng 2](docs/CHANG-2-PREVIEW-1.md). Chạy thử quan sát DOM/MSW qua adapter phiên riêng; chưa instrument hàm hoặc React state. Không có tự chấm source, editor/runtime code mới hoặc đồng bộ nhiều thiết bị. Kiểm tra tự động không thay thế review trải nghiệm của người học. Các tài liệu cũ giữ giới hạn của phiên tương ứng; trạng thái kiểm tra và công việc còn lại hiện hành được ghi trong [tài liệu tiếp tục](docs/CONTINUE-ON-OTHER-MACHINE.md).
# Review workspace Chặng 1/2

[Ba chế độ, controller dùng chung, mapping và kết quả đối chiếu](docs/WORKSPACE-CHANG-1-2.md). Chặng2 dùng cùng Overview/RuntimeFlow/FunctionalTree/StepDependencies và useSelection; khác biệt nằm ở dữ liệu, codec URL và capability. Source snapshot và practice giữ nguyên.
