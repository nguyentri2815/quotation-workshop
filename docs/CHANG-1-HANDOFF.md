# Bàn giao Chặng 1 và tiếp tục trên máy khác

Ngày 31/10/2026. Đây là tài liệu tổng hợp hiện hành; các biên bản QA cũ giữ kết quả và giới hạn của phiên tương ứng. Người dùng đã cho phép commit/push toàn bộ Chặng 1 trong phiên bàn giao này. Chưa triển khai nghiệp vụ Chặng 2.

## Trạng thái và phiên bản

| Repo | Nhánh / upstream | Trạng thái bàn giao |
| --- | --- | --- |
| [quotation-product](https://github.com/nguyentri2815/quotation-product) | `main` / `origin/main` | Chặng 1 đã có trong commit `83faf6641b66aff178b08cae8877f5397134186a`; push báo Everything up-to-date, SHA từ `ls-remote` trùng local. Không có thay đổi source cần commit thêm hoặc commit rỗng. |
| [quotation-workshop](https://github.com/nguyentri2815/quotation-workshop) | `main` / `origin/main` | Bàn giao bố cục làm việc, flow/cây phụ thuộc, Chạy thử có quan sát, kiểm thử và tài liệu trong commit chứa tài liệu này. Dùng `git log -1` để lấy SHA. |

Đã đọc README, cấu hình/scripts, tài liệu Chặng 1, nội dung bài học và diff thực tế của cả hai repo. Không tìm thấy `AGENTS.md` áp dụng trong hai repo hoặc các thư mục cha. Cả hai remote đã fetch; tại lúc kiểm tra không có commit khác giữa local và remote. Kết quả push và SHA cuối cùng được đối chiếu lại sau khi commit, báo tại phần bàn giao của phiên làm việc.

## Chức năng đã có và link review

- Product: danh sách → tạo bản chào Normal / Tài sản cơ bản / VND → validation → tính phí → lưu mock API → chi tiết → reload/đọc lại. Một khách hàng, một tài sản, một kỳ thanh toán. Sửa số tiền hoặc một trong hai ngày làm phí hết hiệu lực và khóa Lưu; sửa tên/mô tả giữ phí. Đang lưu khóa form; lỗi giữ draft/phí để người dùng thử lại; có bảo vệ rời form chưa lưu.
- Workshop: mở đầu, 6 bước chính, 30 sub-step, 29 checkpoint. Code mẫu, phân tích, AST/range và preview dùng cùng mốc. Bài `src/practice`, tham chiếu và các checkpoint có namespace riêng.
- Field A–F: contract chưa có input → minh họa chỉ đọc → nơi dùng đầu tiên → ba trường khách hàng → thêm tài sản → ba nhóm/tám input; số input tương ứng **0/1/1/3/6/8**. Các mốc này chưa nhập liệu; bước 2 mới nối state/change.
- Cây phụ thuộc dùng folder/file/symbol thực, cạnh type/call/props có hướng, vị trí tham chiếu, source nguồn/đích, quay lại và phần chưa hình thành. Flow nhiều nhánh có điều kiện, lịch sử occurrence và retry; chọn nhánh trong flow thường chỉ thay cách đọc.
- Bố cục Đối chiếu / Đọc code / Thử giao diện; kéo bằng chuột/phím, thu/mở preview, explorer/inspector và mobile. Đổi file/tab/bố cục cùng checkpoint giữ iframe và form; đổi checkpoint chủ động khởi tạo lại form.
- Chạy thử: phiên có ID/API/storage riêng, Xem chạy mẫu hoặc Tự thao tác có hướng dẫn, pause/tiếp bước/chạy lại/thoát, source và flow liên quan, nhật ký quan sát, theo UI/code. Lỗi lưu chờ người học tự retry; chọn mục lịch sử chỉ đổi vùng đọc.

| Mục review | Link localhost |
| --- | --- |
| Product hoàn chỉnh | [Danh sách](http://localhost:3180/quotations) |
| Mở đầu workshop | [Yêu cầu và trải nghiệm đích](http://localhost:3181/#journey=2&step=0&sub=0&tab=build) |
| Field A–F | [Mốc A](http://localhost:3181/#journey=2&step=1&sub=2&mark=01-field-contract&tab=build), chọn mốc A–F trên thanh sub-step |
| Cây phụ thuộc 3.4 | [props → PremiumSummary → formatMoney](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props) |
| Cây phụ thuộc 3.5 | [calculate và các phụ thuộc](http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyNode=calculate) |
| Flow nhiều nhánh | [Lưu bản chào](http://localhost:3181/#journey=2&step=5&sub=5&tab=overview&overviewMode=runtime&runtimeFlow=save) |
| Chạy thử tính phí | [Mở phiên mới](http://localhost:3181/?run=calculate&runMode=demo#journey=2&step=3&sub=4&tab=build) |
| Chạy thử mất hiệu lực phí | [Mở phiên mới](http://localhost:3181/?run=invalidate&runMode=demo#journey=2&step=4&sub=1&tab=build) |
| Chạy thử lưu lỗi/retry | [Mở phiên mới](http://localhost:3181/?run=save-retry&runMode=demo#journey=2&step=5&sub=5&tab=build) |
| Hoàn thiện GET/reload | [Bước 6](http://localhost:3181/#journey=2&step=6&sub=3&tab=build) |

`journey=2` là phiên bản hành trình học của **Chặng 1**, không có nghĩa đã triển khai Chặng 2. Link localhost chỉ dùng khi chạy repo tại máy đang review, chưa phải URL hosting công khai. [Toàn bộ link phiên chạy Field A–F và các kịch bản](CHANG-1-RUN-SESSIONS.md).

## Bằng chứng quan sát và diễn giải

| Nhóm | Có thể kết luận |
| --- | --- |
| Quan sát trực tiếp DOM | Giá trị input, nhãn/readonly, lỗi hiển thị, vùng phí, disabled/aria-busy, click/input và kết quả điều hướng đã thấy. |
| Quan sát trực tiếp MSW | Request/response theo ID phiên và request, method, URL, HTTP status. Đây là mock HTTP trong trình duyệt. |
| Diễn giải từ source | Lời gọi helper/validation/setter, React state/render, truyền props, kiểm tra response bên trong client, lời gọi storage/navigate. Chưa có instrumentation từng hàm hoặc transaction storage. |

Không suy ra mọi lời gọi hàm từ đường xanh trong graph. Setter xếp cập nhật cho lần render sau; DOM/MSW không chứng minh thời điểm thay đổi state nội bộ. Nhật ký không tạo bản ghi giả cho các lời gọi chưa đo. Flow thường là mô hình đọc source; Chạy thử mới thực hiện/đợi thao tác thật trên preview phiên riêng. Ở checkpoint 09 là biên nhận POST có nhãn; GET detail và reload độc lập được hoàn thiện ở bước 6.

## Cài và chạy hai repo

Yêu cầu Node.js `>=22.12.0`, npm và Chrome để chạy browser test. Phiên bàn giao kiểm tra trên Windows với **Node 24.18.0 / npm 11.16.0**. Hai repo để cạnh nhau vì unit đối chiếu của Workshop đọc `../quotation-product/src`; runtime của từng repo chạy độc lập, không cần dự án ngoài hoặc `.env`.

Trên máy mới, từ thư mục cha tùy chọn:

```powershell
git clone https://github.com/nguyentri2815/quotation-product.git
git clone https://github.com/nguyentri2815/quotation-workshop.git

Set-Location .\quotation-product
npm.cmd ci
npm.cmd run dev -- --strictPort
```

Mở terminal thứ hai ở thư mục cha đó:

```powershell
Set-Location .\quotation-workshop
npm.cmd ci
npm.cmd run dev -- --strictPort
```

Product: **http://localhost:3180**. Workshop: **http://localhost:3181**. Giữ `localhost` và hai cổng này để dùng đúng origin dữ liệu. `--strictPort` báo bận thay vì tự đổi cổng; không dừng preview đang dùng chỉ để mở thêm server.

Máy đã clone, cập nhật khi working tree sạch, từ thư mục cha:

```powershell
git -C .\quotation-product pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw 'Dừng để kiểm tra lịch sử/local changes của Product.' }
git -C .\quotation-workshop pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw 'Dừng để kiểm tra lịch sử/local changes của Workshop.' }

Push-Location .\quotation-product
npm.cmd ci
Pop-Location
Push-Location .\quotation-workshop
npm.cmd ci
Pop-Location
```

Nếu pull báo phân nhánh, giữ công việc local và đối chiếu lịch sử trước khi merge; không reset/clean/force push. Chạy `npm ci` khi server của repo đó đã dừng trên máy đang cập nhật; cài dependencies không cần thiết trên máy bàn giao đang giữ preview.

## Git lưu gì

Git có source, cấu hình, `package-lock.json`, assets/MSW worker, scripts, kiểm thử, tài liệu, starter/solutions, source mẫu/tham chiếu/bài người học ban đầu, 29 checkpoint + manifest và `.workshop/source-index.json` cần để tái lập. Các lệnh predev/pretest/typecheck/build xác minh hash snapshot và tái tạo chỉ mục; không cần file QA cục bộ để chạy.

Không đưa `node_modules/`, `dist/`, cache, log, `.verification/`, `test-results/`, báo cáo Playwright, secrets/`.env` hoặc dữ liệu trình duyệt vào Git. Không có bản backup browser nào được thêm vào commit. Các thư mục local bị ignore vẫn được giữ tại máy bàn giao.

Git **không mang theo** bản chào localStorage, form đang gõ, tiến độ/ghi chú, bố cục và viewport browser, lịch sử phiên chạy hoặc browser profile. Muốn chuyển riêng dữ liệu, dùng [hướng dẫn Product](https://github.com/nguyentri2815/quotation-product/blob/main/docs/BROWSER-DATA-TRANSFER.md) hoặc [hướng dẫn Workshop](BROWSER-DATA-TRANSFER.md), lưu file xuất **ngoài hai repo**. Namespace phiên chạy `quotation-workshop.run.*` không thay thế dữ liệu review; không tự gộp sang dữ liệu checkpoint.

## Kiểm tra thực tế phiên bàn giao

Các kết quả dưới đây thuộc lần kiểm tra ngày 31/10/2026, không sao chép kết luận PASS của biên bản cũ. Browser dùng context QA riêng, không truy cập profile/dữ liệu cá nhân.

| Kiểm tra | Kết quả |
| --- | --- |
| Product unit | **20/20 đạt**, `npm.cmd test`. |
| Product typecheck/build | **Đạt**, `npm.cmd run build` gồm `tsc --noEmit`. |
| Product Chrome | **4/4 đạt**, `npm.cmd run test:browser`: tính phí, sửa tiền/ngày làm phí hết hiệu lực, lưu/chi tiết/reload/mở lại, validation/rời form, lưu lỗi quota → giữ form → retry, mobile. |
| Workshop unit/source | **53/53 đạt**, `npm.cmd test -- --testTimeout=15000`; gồm đối chiếu source Product, 29 checkpoint/range, flow/dependency và model phiên chạy. |
| Workshop typecheck/build | **Đạt**, gồm source host/practice/reference và 29 checkpoint. |
| Workshop Chrome | **64/64 đạt**, toàn bộ suite sau sửa cache HMR, `npm.cmd run test:browser -- --timeout=120000` (12,7 phút). Gồm Field A–F, cây/flow/source, phí → sửa làm phí hết hiệu lực → tính lại, lưu thành công, HTTP 500 → giữ form/phí → retry chủ động, pause/restart, đọc lịch sử không thêm POST, GET/reload cuối chặng và bảo toàn namespace/tiến độ. |
| Workshop HMR | **Đạt**, `npm.cmd run test:hmr`; sửa/quan sát/khôi phục trên bản sao QA, không sửa bài người học. |
| Cài từ file Git | **Đạt**: xuất cây Git vào hai thư mục cạnh nhau, `npm.cmd ci --no-audit --no-fund` cài mới 99 package Product / 167 package Workshop; cả hai build đạt, Workshop unit/source 53/53 đạt. Không chép node_modules/cache hoặc source từ working tree vào bản xuất. |
| Git / preview | **Đạt** `git diff --check` và kiểm tra staged files; không thay snapshot/practice/reference/starter/solutions hoặc source Product. Product local/remote trùng SHA, upstream `origin/main`, working tree sạch. Hai preview HTTP 200; giữ PID 5448 (3180), 4168 (3181). SHA và xác nhận push cuối của Workshop nằm trong báo cáo bàn giao của phiên. |

Lệnh kiểm tra lại (cần preview tương ứng đang chạy cho browser):

```powershell
# Trong quotation-product
npm.cmd test
npm.cmd run build
npm.cmd run test:browser

# Trong quotation-workshop; quotation-product nằm cạnh bên
npm.cmd test -- --testTimeout=15000
npm.cmd run build
npm.cmd run test:browser -- --timeout=120000
npm.cmd run test:hmr
```

Timeout unit 15 giây dành cho đối chiếu source; timeout browser tổng 120 giây dành cho kịch bản đi qua nhiều mốc. Không bỏ assertion hoặc tăng timeout assertion mặc định. `test:journey` là bài starter/solutions legacy; không đại diện hành trình mới và không chạy lại trong lần bàn giao này.

Lượt Chrome đầu bị gián đoạn sau khi bài HMR dùng cache mặc định qua junction `node_modules`, ghi đè optimizer của preview đang chạy. Trace ghi HTTP 504 **Outdated Optimize Dep** ở lucide-react/react-resizable-panels và trang trắng; đây không phải bằng chứng đạt của các ca cây/source bị ảnh hưởng. Đã sửa `tests/hmr.mjs` để server QA dùng `cacheDir: './.vite-cache'` trong bản sao riêng. Sau khi Vite nạp lại cấu hình nguyên byte trong tiến trình preview cũ, các dependency trả HTTP 200; HMR chạy lại đạt và hash metadata optimizer của preview **không đổi** trước/sau. Không giảm assertion để xử lý lỗi này. Các trace lượt lỗi được giữ local tại `.verification/handoff-browser-first-run/`; lượt Chrome cuối được chạy lại toàn bộ sau sửa.

## Giới hạn và việc còn mở

- Chỉ xác minh Chrome trong phiên này; chưa kiểm tra Firefox/Safari. Các kích thước CSS trong suite không chứng minh zoom browser thật; kết quả zoom thật của phiên trước được giữ riêng trong [biên bản Chạy thử](CHANG-1-RUN-SESSIONS.md).
- Chưa tự chạy/chấm source `Bài tôi đang làm`, chưa instrument hàm/React/storage. Những điều này không được ghi là đạt.
- Mock API/localStorage chỉ ở browser/origin, chưa có backend, đăng nhập, đồng bộ thiết bị, idempotency/giao dịch nhiều tab. Timeout chưa có response phải kiểm tra danh sách trước khi thử lại.
- Build Workshop còn cảnh báo chunk lớn (khoảng 1.264 kB minified / 202 kB gzip) và cảnh báo Vite về import plugin cấu hình thiếu đuôi file khi dùng config loader native trong tương lai; build hiện tại thành công. Chưa tối ưu chia tải source index.
- Đổi checkpoint làm mất form chưa lưu tại mốc cũ theo cơ chế hiện hành; đổi file/tab/bố cục cùng mốc giữ form. Pause không hủy request đã gửi; response cũ không cập nhật phiên mới.
- Kết quả tự động chưa thay thế review trải nghiệm học. Các điểm nghiệp vụ Chặng 2 còn thiếu căn cứ được ghi trong [kế hoạch Chặng 2](CHANG-2-PLAN.md); chưa tự chọn nghiệp vụ mới.
