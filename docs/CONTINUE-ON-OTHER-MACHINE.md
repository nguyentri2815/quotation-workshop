# Tiếp tục Quotation Learning Project trên máy khác

Bàn giao ngày **01/11/2026 (Asia/Saigon)**. Lượt này chỉ kiểm tra, lưu toàn bộ công việc hiện có, commit/push và bàn giao. Không bắt đầu thêm tính năng, không reset dữ liệu, không chuyển Chặng 3. Người dùng đã cho phép commit/push cả hai repo. Các câu “chưa/không commit/push” trong biên bản cũ mô tả phạm vi lượt review trước, không còn là chỉ dẫn cho lượt bàn giao này.

## Phiên bản và cặp source tương thích

- **Product Chặng 2:** luồng A/B chọn sản phẩm → form → tính phí → lưu → đọc lại/reload; đổi sản phẩm qua panel xác nhận; phí có định danh và guard hiệu lực; mock tự validate/tính lại; record giữ snapshot biểu phí, adapter đọc A cũ và báo row lỗi mà không xóa bản gốc.
- **Workshop hiện hành: revision 4**, 26 checkpoint `s2-r4-*`, năm bước lớn gồm baseline và bốn bước xây. Có thêm **Chạy thử cả bước** dùng engine chung. Chặng 1 giữ 29 checkpoint; Chặng 2 lưu đủ 42 checkpoint qua r1/r2/r3/r4: tổng 71 checkpoint, 74 HTML entry khi build.
- Product commit tương thích: `22e3195009db0fd0caf4a17c2598689df3397d46` trên `main`. Source runtime khớp đủ 22 file trong [`stage2/product-r3.json`](../stage2/product-r3.json), hash tập file **`3d2849fa4e88d301047c39878d421d2f535677cb01fcd8b40d7b76f43f1e43f9`**.
- Workshop source commit tương thích: `a5c11b587d60937da862d0b1bb15eabef5dc3393` trên `main`, revision 4 cộng Chạy thử cả bước. Commit bàn giao tài liệu kế tiếp giữ nguyên runtime của cặp này. Manifest r4: SHA-256 **`d0d04bb7ea30324541cc6756b395597d19346c0f6fb814d0c3fb8c3cda9b90da`**.
- Trường `commit: 83faf664…` trong pin Product là commit nền **trước khi** Chặng 2 được commit; pin còn ghi working tree và hash source lúc ghim. Đó là chứng cứ lịch sử, không phải yêu cầu checkout Product Chặng 1. Giữ nguyên pin/snapshot đã niêm phong. Test đạt hoặc commit/push không thay thế người dùng review/đồng ý thiết kế Product.

Commit nguồn tương thích: [Product `22e3195`](https://github.com/nguyentri2815/quotation-product/commit/22e3195009db0fd0caf4a17c2598689df3397d46) + [Workshop `a5c11b5`](https://github.com/nguyentri2815/quotation-workshop/commit/a5c11b587d60937da862d0b1bb15eabef5dc3393). Dùng `main` sau các commit tài liệu bàn giao cũng chạy cùng runtime này.

Product sau cập nhật README là [`c630b2aad2d6c03e7044ab0d45e93e3b9f89dec3`](https://github.com/nguyentri2815/quotation-product/commit/c630b2aad2d6c03e7044ab0d45e93e3b9f89dec3), chỉ đổi tài liệu so với `22e3195`. Workshop commit chứa tài liệu này chỉ thêm/cập nhật tài liệu so với `a5c11b5`; lấy SHA của nó bằng `git log -1 --format=%H -- docs/CONTINUE-ON-OTHER-MACHINE.md`. Đây là cặp bàn giao hiện hành, có cùng runtime với cặp nguồn được kiểm tra trên.

Hai repo nên đặt cạnh nhau, tên `quotation-product` và `quotation-workshop`. Runtime Workshop độc lập; unit đối chiếu source cuối cần `../quotation-product/src` đúng cặp trên. Giữ cả `package-lock.json`, scripts, manifests, snapshot, Product pin, `.workshop/source-index.json` và `stage2/source-index.json` trong Git. Không chạy materialize chỉ để cài/chạy hoặc review; predev/typecheck/pretest xác minh snapshot hiện có và cập nhật chỉ mục, không được ghi đè snapshot/practice.

## Mở review và chạy

Node >=22.12; lượt bàn giao dùng **Node 24.18.0 / npm 11.16.0**, Windows và Chrome đã cài.

```powershell
# Terminal Product, từ thư mục cha chứa hai repo
Set-Location .\quotation-product
npm.cmd ci
npm.cmd run dev -- --strictPort
# http://localhost:3180
```

```powershell
# Terminal Workshop, từ cùng thư mục cha
Set-Location .\quotation-workshop
npm.cmd ci
npm.cmd run dev -- --strictPort
# http://localhost:3181
```

`--strictPort` giữ đúng origin; nếu cổng bận, kiểm tra tiến trình chiếm cổng. Không tự đổi port/hostname nếu cần dùng lại dữ liệu trình duyệt. Không cần `.env` hoặc backend thật.

- [Product: chọn A/B](http://localhost:3180/products), [danh sách đã lưu](http://localhost:3180/quotations).
- [Workshop r4: bắt đầu](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-00&tab=build), [contract đầu bước Catalog](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-contract&tab=build).
- [Catalog: định nghĩa → import → map → UI](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-catalog&tab=build).
- [Validation](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-validation&tab=build), [kết quả phí có receipt](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-summary&tab=build), [lưu/đọc lại](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=build).
- [Chạy thử cả bước Catalog, demo](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runMode=demo#checkpoint=s2-r4-contract), [tự thao tác](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runMode=guided#checkpoint=s2-r4-contract).
- [Chạy thử lưu lỗi/retry chủ động](http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runVariant=retry&runMode=demo#checkpoint=s2-r4-record).
- [Flow tính phí và thay đổi từ Chặng 1](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate&runtimeEvent=validate&compareChanges=true).

A mẫu 365 ngày: tổng **1.100.000 VND**. B mẫu 365 ngày phải báo tối đa 180 ngày; đổi ngày kết thúc = ngày bắt đầu +180 ngày lịch: thuần 739.726, thuế 73.973, tổng **813.699 VND**. B với số tiền 1 triệu phải báo tối thiểu 10 triệu. Đây là biểu phí mô phỏng cho học tập.

## Công việc thực sự đã có và phần còn lại

Các thay đổi tồn tại trước bàn giao được lưu đầy đủ, gồm source Product Chặng 2, Workshop r1/r2/r3/r4 và Chạy thử cả bước. Riêng **“Bản đồ của bước” chưa có giao diện hoàn chỉnh với hai cách đọc yêu cầu**. Có nền tảng liên quan đã triển khai và chạy, nên không bắt đầu lại từ số không:

| Phần đã có | File thực tế | Còn thiếu so với Bản đồ của bước |
| --- | --- | --- |
| R4 chia nhỏ contract → object A → page → catalog/map → presentation → route/form; bài nêu vì sao, nguồn, nơi dùng và UI | `src/stage2/revision.ts`, `stage2/revision-4.json`, `scripts/materialize-stage2-paced.mjs` | Cần góc nhìn kết quả cuối **cả bước**, thấy ngay các phần phối hợp và trình tự tạo ra chúng; giải thích trước vai trò và nơi dùng về sau của ba tên Product. |
| Nguồn gốc dữ liệu: Định nghĩa → Import → Nơi dùng → UI theo AST/checkpoint | `src/stage2/provenance.ts`, `src/workshop/SourcePanel.tsx`, `src/workshop/BuildSession.tsx`, `scripts/analyze-source.mjs` | Hiện đi từ source ra UI, UI chỉ highlight vùng đang có; chưa có khám phá ngược UI → source → sub-step đầy đủ. Không tự chuyển route khi vùng UI chưa mở. |
| Dependency, phạm vi toàn bước/sub-step; quan hệ type/call/state/props; flow thao tác và mapping source/UI | `src/stage2/workspace-data.ts`, `workspace-flows.ts`, `changes.ts`; `src/workshop/StepDependencies.tsx`, `dependency-tree.model.ts`, `RuntimeFlow.tsx`, `PreviewGuide.tsx` | Dùng lại dữ liệu, resolver và controller này để trình bày hai cách đọc; không suy thứ tự dạy từ cạnh phụ thuộc. |
| Chạy thử cả bước có checkpoint đầu ra, hành trình, liên kết “Được xây tại”, source Trước/Sau/Diff trong “Xem cách xây”; phiên riêng và quay lại | `src/workshop/run/model.ts`, `step-plans.ts`, `RunScopePicker.tsx`, `RunJourney.tsx`, `RunWorkspace.tsx`, `useRunSession.ts`, `driver.ts`; `src/stage2/StageTwoAdapter.tsx` | Đã phân biệt source đang đọc/checkpoint phiên trong run. Cần nối vào Bản đồ của bước và phân biệt checkpoint đang học/đích ngay trước khi xem đích; không đổi checkpoint bài học ngầm. |
| Workspace, chọn mốc, URL, khôi phục bố cục và draft preview khi thoát run | `src/workshop/WorkshopFrame.tsx`, `navigation.ts`, `useSplitLayout.ts`; `src/stage2/StageTwoAdapter.tsx` | Tái sử dụng khung hiện hành; không thêm hàng loạt toolbar hoặc remount iframe khi chỉ đổi cách đọc. |
| Mapping vùng quan sát catalog/form/phí/lưu đã có trong provenance/flow/run | `src/stage2/provenance.ts`, `runs.ts`, `workspace-flows.ts`; `src/workshop/PreviewGuide.tsx`, `run/step-plans.ts` | Cần chỉ dẫn rõ **“Quan sát ở đâu”** cho từng mốc, đưa người học chủ động đến màn/vùng phù hợp; không để mốc form/phí/lưu chỉ đứng ở trang chọn sản phẩm. |

`entryFor` hiện lấy entry của từng bài; nhiều mốc sau catalog mở đầu ở `/products` rồi cần chọn A/B để vào form. Nút UI khóa nếu vùng chưa tồn tại/đang không mở là hành vi có thật, không phải đã giải quyết yêu cầu “Quan sát ở đâu”. Chạy thử cả bước đã có hành trình chủ động tới form/phí/lưu ở checkpoint đầu ra; cần giữ sự phân biệt đó với preview thường ở checkpoint đang học.

Biên bản nền: [Revision 4](CHANG-2-REVISION-4.md), [Chạy thử cả bước](CHAY-THU-CA-BUOC.md), [quy trình Product/Workshop](PRODUCT-WORKSHOP-WORKFLOW.md). Tài liệu revision1/2/3 và workspace cũ là lịch sử, không phải revision hiện hành. Lượt bàn giao chỉ sửa tài liệu trạng thái/hướng dẫn, không thêm code Bản đồ của bước.

## Yêu cầu tiếp tục “Bản đồ của bước” — giữ đủ nội dung được cung cấp

Trong ngữ cảnh bàn giao hiện có, yêu cầu đầy đủ khả dụng là nội dung người dùng cung cấp ở lượt này. Không có nguyên văn một prompt trước đó trong ngữ cảnh để xác nhận đối chiếu từng câu; không khẳng định đã khôi phục bản nguyên văn ngoài những yêu cầu sau.

> Nhiệm vụ tiếp theo: **“Bản đồ của bước” cho Chặng 2 trước, chưa mở rộng sang Chặng 1.** Lượt bàn giao chỉ lưu và bàn giao, không bắt đầu thêm tính năng mới.

1. Bắt đầu từ **kết quả cuối bước → các thành phần phối hợp → quá trình hình thành qua sub-step**. Người học cần hiểu đích trước khi đi từng mảnh code.
2. Có hai cách đọc cùng một bước: **“Các phần phối hợp”** và **“Quá trình hình thành”**. Dùng cùng mapping và selection/ngữ cảnh; cách phối hợp trả lời thành phần nào làm gì/nối nhau ra sao, quá trình trả lời chúng được dựng và ghép qua những sub-step nào.
3. Nói ngay từ đầu vì sao cần **`PropertyProductCode`**, **`PropertyProduct`**, **`propertyProducts`** và chúng được dùng ở đâu về sau. Phân biệt type mã định danh, contract cấu trúc của sản phẩm, và danh sách object runtime; theo tới render catalog, chọn/đổi, validation, tính phí và lưu/đọc khi phù hợp với source thực tế. Không giả rằng khai báo type tạo ra dữ liệu hoặc sự kiện runtime.
4. Nối **định nghĩa → import → nơi dùng → UI** bằng file/symbol/range thật tại đúng checkpoint. Giải thích nếu cùng file không có import hoặc phần đó chưa hình thành, không nhảy sang source hoàn chỉnh rồi giả là hiện tại.
5. Cho khám phá ngược **UI → source → sub-step tạo ra nó**, có đường quay lại giữ ngữ cảnh và dữ liệu. Mapping tới đúng vùng UI đang có hoặc chỉ rõ cần quan sát ở màn nào.
6. Tách **quan hệ type với runtime**, **phụ thuộc kỹ thuật với thứ tự giảng dạy**. Cạnh type/import/call/props/state không tự đồng nghĩa thứ tự thực thi hay trình tự học; DOM/MSW quan sát thật khác helper/React state được giải thích từ source.
7. Phân biệt rõ **checkpoint đang học** và **checkpoint đích cuối bước**. Người học thấy cái nào đang đọc và cái nào đang chạy, phần đã có và phần chưa hình thành. Xem đích không tự tăng tiến độ hoặc chuyển mốc bài học.
8. **Xem trước bằng phiên riêng**, quay lại vẫn giữ dữ liệu và ngữ cảnh bài học: draft/phí, URL, checkpoint, file/symbol, scroll, bố cục và lựa chọn liên quan. Không phát lại thao tác, POST hoặc ghi đè namespace review/practice chỉ vì đọc bản đồ/source/history.
9. Bổ sung **“Quan sát ở đâu”**: catalog ở trang chọn sản phẩm; ngữ cảnh/đổi sản phẩm ở form và panel; validation ở input/lỗi; phí ở summary/receipt; lưu và đọc ở kết quả, danh sách/chi tiết/reload. Không để tất cả mốc form/phí/lưu chỉ mở trang chọn sản phẩm; chỉ chạy hành vi đã có ở checkpoint thích hợp.
10. Dùng lại **mapping, dependency, flow, Chạy thử và khung workspace** hiện có. Không tạo engine/cây/mapping song song hoặc thêm nhiều toolbar thường trực. Giữ code nhiều dòng, Trước/Sau/Diff, focus và đường quay lại.
11. **Bảo toàn Product, snapshot cũ, practice, tiến độ và URL**. Snapshot r4 đã `publication: published` cũng là nội dung niêm phong; không đổi source/metadata dưới ID đã phát hành. Chỉ đổi host/mapping khi đủ; nếu thật sự cần đổi source đích phải tuân quy trình Product → review/đồng ý → ghim → Workshop, không sửa ngầm pin/lịch sử.
12. **Không chuyển Chặng 3.** Chặng 1 chỉ cần tránh hồi quy trong khung dùng chung; không mở rộng Bản đồ của bước sang Chặng 1 trong nhiệm vụ tiếp theo này.

## Kiểm tra gần nhất và giới hạn

Kết quả chạy lại trong lượt bàn giao (01/11/2026), không cộng với số ca trong báo cáo lịch sử:

| Repo / lệnh | Kết quả lần này |
| --- | --- |
| Product `npm.cmd test` | **37/37**, 4 file, đạt. |
| Product `npm.cmd run build` | Đạt, bao gồm `tsc --noEmit` và Vite build. |
| Product `npm.cmd run test:browser` | **8/8 đạt**, 3 file Chrome; A/B, panel hủy/xác nhận, phí/lưu/reload, adapter A cũ/row lỗi, lỗi lưu/retry và mobile. |
| Workshop `npm.cmd test -- --testTimeout=30000` | **93/93**, 16 file, đạt; kiểm hash và đối chiếu source Product. |
| Workshop `npm.cmd run build` | **Đạt**, gồm typecheck host và toàn bộ checkpoint; build 74 HTML entry (71 checkpoint). Có các cảnh báo nêu bên dưới. |
| Workshop browser chọn lọc | Lượt đầu **6 đạt / 1 timeout** khi `page.goto` đợi load trang Catalog; chạy lại **riêng ca đó 1/1 đạt** trên cùng source/server đã khởi động. Tổng **7 ca khác nhau đạt qua hai lượt**, không phải một lượt 7/7 xanh. |
| Bảo toàn source/snapshot/practice | **1.862 file được theo dõi không đổi byte** trong lượt bàn giao; đủ **71 checkpoint / 1.581 mục file** khớp manifest, cả blob đã commit; **22 file Product** khớp pin trong cả hai commit. Đủ chỉ mục và lockfile. |
| Git | Product `22e3195` và Workshop source `a5c11b5` đã push; `git ls-remote` trùng SHA local, upstream cả hai là `origin/main`. Commit tài liệu kế tiếp chỉ sửa README và tài liệu bàn giao/transfer; SHA cuối cùng được đối chiếu lại sau push và báo trong thông báo bàn giao. |

Browser Workshop chọn lọc, khi server 3181 đang chạy:

```powershell
npm.cmd run test:browser -- tests/browser/stage2-paced.spec.ts tests/browser/step-runs.spec.ts --grep 'Định nghĩa|route thiếu|source đã format|điểm thay đổi|guided catalog:|whole-step retry:|whole-step restores' --timeout=120000
```

Ca đầu chưa đạt: `tests/browser/stage2-paced.spec.ts:50`, dừng ở dòng 51 `page.goto`, chờ `load` quá 120.000 ms khi mở `/?stage=2&version=4#checkpoint=s2-r4-catalog&tab=build`; chưa tới assertion provenance. Tái hiện bằng khởi động dev sau cold dependency optimization rồi chạy lệnh ở trên; hiện tượng lần này không tái hiện khi server đã ấm. Dev log cho thấy optimizer vẫn bundling trong lượt đầu, nên cold start là khả năng giải thích, chưa có kết luận nguyên nhân gốc hoặc bản sửa. Lệnh kiểm lại riêng: `npm.cmd run test:browser -- tests/browser/stage2-paced.spec.ts --grep 'Định nghĩa' --timeout=120000` → **1/1 đạt (15,4 giây)**, không tăng timeout hoặc sửa source. Giữ đây là giới hạn khởi động cần quan sát trên máy cũ. Log/trace lần lỗi được lưu tại `.verification/transfer-20261101-first-browser-failures/`, bản kiểm lại tại `.verification/transfer-20261101-provenance-recheck.log`, đều không thuộc Git.

Dev còn ghi một thông báo `ResizeObserver loop completed with undelivered notifications` trong lượt browser; chưa sửa trong phạm vi lưu/bàn giao. Các assertion đã chọn sau đó và kiểm lại provenance đều đạt; chưa chứng minh cảnh báo không tái diễn.

Bộ này kiểm provenance, route/panel, namespace phiên riêng, flow/source, xem cách xây/quay lại, retry không POST ngầm, khôi phục preview/source/draft. Không chạy lại toàn bộ browser lịch sử, HMR hoặc journey legacy trong lượt bàn giao; không suy rằng các bộ chưa chạy đã đạt trên máy cũ. Kết quả lịch sử r4 (75 unit/48 browser) và cả bước (93 unit/45 browser khác nhau qua nhiều lượt) có trong các biên bản trên, không phải kết quả chạy lại lần này.

Giới hạn còn mở: Bản đồ của bước và luồng UI → source/sub-step/“Quan sát ở đâu” theo yêu cầu chưa hoàn chỉnh; chưa triển khai trong lượt bàn giao. Build Workshop còn cảnh báo bundle trên 500 kB và import plugin trong Vite config chưa có extension cho native config tương lai. Đây là cảnh báo, không phải lỗi build; chưa tối ưu bundle. Chạy thử đo DOM/HTTP MSW, không instrument mọi hàm/state; mobile là viewport giả lập, chưa kiểm Safari/Firefox/screen reader. Practice Chặng 2 chưa có adapter hoàn chỉnh và không được fallback sang bài Chặng 1. Source được lưu không đồng nghĩa mọi yêu cầu UX đã xong hoặc Product đã được người dùng duyệt.

Kiểm tra whitespace khi stage toàn bộ source báo dòng trống cuối file tại `checkpoints/s2-04-validation/quotation/rules.ts:190` và `checkpoints/s2-05-pricing/quotation/rules.ts:201`. Đây là snapshot lịch sử khớp hash đã ghim; giữ nguyên byte thay vì sửa để làm sạch báo cáo. Các thay đổi tài liệu bàn giao được kiểm tra whitespace riêng. Hướng dẫn backup cũng đã kiểm cú pháp hai đoạn JavaScript, allowlist xuất/import giống nhau, có key Chặng 2 và loại phiên run tạm.

## Những gì không thuộc Git

`node_modules/`, `dist/`, `.verification/`, `test-results/`, Playwright report, log, cache, `.env*`, secrets và backup dữ liệu trình duyệt không được commit. `npm ci`/build sinh lại dependency và output. Chỉ mục source/manifest/snapshot cần chạy ứng dụng đã được lưu; thư mục QA bị ignore không phải source bắt buộc.

**Dữ liệu trình duyệt không tự chuyển theo source.** Product `quotation-product.demo.v1`; Workshop tiến độ/ghi chú Chặng 1, các revision Chặng 2 (`quotation-workshop.stage2.progress.v2/v3/v4`), layout, wrap và bản chào demo nằm trong localStorage của đúng profile và origin 3180/3181. Dữ liệu đã có trên máy cũ vẫn thuộc máy cũ, không tự gộp với dữ liệu máy này.

[Hướng dẫn xuất/import riêng dữ liệu](BROWSER-DATA-TRANSFER.md) đã bổ sung allowlist key Chặng 2. Backup phải nằm ngoài hai repo. Không xuất toàn bộ browser storage, không reset key, không nhập đè dữ liệu trên máy cũ khi chưa đối chiếu/backup. Form chưa lưu, phí trong React state, phiên chạy tạm và lịch sử tab không đi theo Git hoặc backup localStorage; bookmark URL cần giữ. Lượt bàn giao **không tạo hay import backup profile thật** và không reset dữ liệu người dùng.

## Cập nhật an toàn trên máy cũ

Chạy từ thư mục cha chứa hai repo; kiểm tra **cả hai repo trước khi pull**:

```powershell
git -C .\quotation-product status --short --branch
git -C .\quotation-product diff
git -C .\quotation-product diff --cached
git -C .\quotation-workshop status --short --branch
git -C .\quotation-workshop diff
git -C .\quotation-workshop diff --cached
```

Nếu có thay đổi local hoặc untracked cần giữ: dừng pull, lưu bằng commit/nhánh riêng sau khi kiểm tra file hoặc backup ngoài repo. Không reset/clean; không chép đè snapshot/practice. Khi đã bảo toàn công việc và working tree sạch, xác minh nhánh/remotes rồi cập nhật:

```powershell
git -C .\quotation-product remote -v
git -C .\quotation-workshop remote -v
git -C .\quotation-product fetch origin
git -C .\quotation-workshop fetch origin
git -C .\quotation-product switch main
git -C .\quotation-workshop switch main
git -C .\quotation-product pull --ff-only origin main
git -C .\quotation-workshop pull --ff-only origin main
git -C .\quotation-product log -1 --oneline
git -C .\quotation-workshop log -2 --oneline
git -C .\quotation-product branch -vv
git -C .\quotation-workshop branch -vv
```

Remote phải là `https://github.com/nguyentri2815/quotation-product.git` và `https://github.com/nguyentri2815/quotation-workshop.git`. Nếu `--ff-only` dừng vì lịch sử tách nhánh: giữ cả hai phía, xem graph và merge an toàn; không force push/reset. Sau đó chạy `npm.cmd ci` trong từng repo và mở hai terminal như trên. Nhánh bàn giao là `main`, upstream `origin/main`; không có nhánh WIP riêng cần checkout.

## Prompt ngắn cho IDE Agent máy cũ

> Đọc `quotation-workshop/docs/CONTINUE-ON-OTHER-MACHINE.md`, `CHANG-2-REVISION-4.md` và `CHAY-THU-CA-BUOC.md`; kiểm tra branch/status của cả Product/Workshop và đúng cặp source. Tiếp tục phần còn thiếu của **“Bản đồ của bước” cho Chặng 2**, dùng lại provenance/dependency/flow/Chạy thử/workspace đã có, hai cách đọc “Các phần phối hợp” và “Quá trình hình thành”, giải thích ba tên Product từ đầu, nối UI ↔ source ↔ sub-step, thêm “Quan sát ở đâu”, tách checkpoint học/đích và xem trước phiên riêng rồi quay lại giữ ngữ cảnh. Bảo toàn Product, mọi snapshot đã phát hành, practice, tiến độ và URL; không làm lại phần đã có, không reset dữ liệu, chưa mở rộng Chặng 1 và không chuyển Chặng 3. Xác minh hành vi thực tế, ghi rõ WIP/giới hạn và kết quả kiểm tra.
