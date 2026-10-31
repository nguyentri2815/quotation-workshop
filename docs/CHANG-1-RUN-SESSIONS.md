# Chặng 1 · Chạy thử có quan sát

Ngày 31/10/2026. Tiếp tục trên bố cục hiện tại; chỉ thêm cơ chế phiên chạy và adapter preview của workshop. Không sửa snapshot ghim, source sản phẩm, practice, reference/starter/solutions, dữ liệu review hoặc khóa tiến độ. Không commit/push; dừng tại Chặng 1.

## Mở phiên trực tiếp

Mỗi link mở một phiên mẫu mới, có ID/API/khóa dữ liệu riêng. Đổi `runMode=demo` thành `guided` để người học tự thao tác. Các mốc thiếu khả năng giải thích rõ và không tự chuyển mốc.

| Kịch bản | Link |
| --- | --- |
| Field A · contract, chưa có input | [Mốc 01-field-contract](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=01-field-contract&tab=build) |
| Field B · một minh họa chỉ đọc | [Mốc 01-field-example](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=01-field-example&tab=build) |
| Field C · nơi dùng Tên khách hàng | [Mốc 01-field-first](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=01-field-first&tab=build) |
| Field D · ba trường khách hàng | [Mốc 01-field-customer](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=01-field-customer&tab=build) |
| Field E · thêm tài sản | [Mốc 01-field-asset](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=01-field-asset&tab=build) |
| Field F · đủ ba nhóm, tám input chỉ đọc | [Mốc 03-fields](http://localhost:3181/?run=field&runMode=demo#journey=2&step=1&sub=2&mark=03-fields&tab=build) |
| Tự nhập một trường | [Nhập liệu có hướng dẫn](http://localhost:3181/?run=input&runMode=guided#journey=2&step=2&sub=2&mark=02-inputs&tab=build) |
| Validation lỗi trên form rỗng | [Mốc 04](http://localhost:3181/?run=validation&runMode=demo#journey=2&step=3&sub=1&tab=build) |
| Điền mẫu, tính phí thành công | [Mốc 05](http://localhost:3181/?run=calculate&runMode=demo#journey=2&step=3&sub=4&tab=build) |
| Sửa tiền sau tính, khóa lưu, tính lại | [Mốc 06](http://localhost:3181/?run=invalidate&runMode=demo#journey=2&step=4&sub=1&tab=build) |
| Lưu thành công | [Mốc 09](http://localhost:3181/?run=save&runMode=demo#journey=2&step=5&sub=5&tab=build) |
| Lỗi mock một lần, người học tự retry | [Lưu lỗi và retry](http://localhost:3181/?run=save-retry&runMode=demo#journey=2&step=5&sub=5&tab=build) |

Từ workspace thường: Chạy thử → chọn kịch bản → Xem chạy mẫu hoặc Tự thao tác có hướng dẫn. Panel nhiệm vụ đóng trước khi phiên chạy mở. Hai nút mở preview thường vẫn dùng để thử thủ công; Bài tôi đang làm chưa có mapping/adapter quan sát đủ tin cậy, không bật xác nhận tự động và không sửa source của người học.

## Cách đọc và thử

Thanh phiên chạy thay thanh sub-step, không xếp thêm nhiều hàng: Chạy/Tạm dừng, Tiếp bước, Chạy lại, Thoát, vị trí bước trình diễn và tốc độ. Trên mobile thanh này ở ngoài vùng chuyển Hướng dẫn/Preview nên vẫn truy cập được. Source giữ số dòng, toàn file, Shiki và range highlight. Cây phụ thuộc và flow thường giữ nguyên sau khi thoát.

Trên vùng đủ rộng, flow và code cạnh nhau; khi hẹp dùng chuyển vùng Flow/Code. Toolbar Theo UI/Theo code quyết định vùng tự cuộn; wheel/touch/scroll key ở vùng đang theo tạm ngừng follow, có Theo tiếp. Canvas pan thủ công cũng ngừng theo. Resize không Fit View, không remount iframe. Lần đầu mở vùng code/canvas đang ẩn mới đặt vào đoạn/sự kiện liên quan; quay lại giữ vị trí đã khám phá.

1. Tính phí: thấy chỉ dẫn trước nút, UI điền giá trị thật, rồi tổng phí 1.100.000 VND. Dữ liệu lấy bằng nút Điền dữ liệu mẫu của checkpoint, không chép fixture vào form. Số tiền/ngày trên DOM được đối chiếu với công thức source `net=round(sum×0.001×days/365)`, `tax=round(net×0.1)`.
2. Validation: form rỗng → Tính phí → lỗi thật cạnh input; graph đi nhánh Có lỗi theo kết quả này. Không báo tính phí thành công ở mốc mới chỉ nối validation.
3. Sửa sau tính: sau phí 1.100.000, đổi số tiền thành 2.000.000.000 → Cần tính lại phí, Lưu disabled → tính lại thành 2.200.000. Nhật ký giữ bằng chứng từng kết quả.
4. Lưu lỗi/retry: chạy đến HTTP 500, lỗi thật, tên và phí còn nguyên. Phiên chờ ở Bạn chủ động thử lại. Người học tự bấm Lưu lần nữa để có POST thứ hai và response 201; ngay cả Xem chạy mẫu cũng không tự retry.
5. Field A–F: kiểm tra 0/1/1/3/6/8 input, nhãn gắn đúng input, readonly/disabled và đúng nhóm UI. A chỉ có contract/scaffold; B là minh họa, C–F là nơi dùng. Không nhập giả vào input chỉ đọc. Node chưa hình thành có nhãn rõ; chọn định nghĩa/nơi dùng mở source/range đúng mốc.
6. Mở Lịch sử quan sát, chọn mục cũ: chỉ thay vùng đọc. Không bấm lại DOM, không POST lại. Về trực tiếp trả con trỏ đọc về kết quả mới nhất. Thông tin phiên chứa bằng chứng, diễn giải, source liên quan và link mở phiên mới.
7. Nhập một tên riêng trong preview thường, bắt đầu phiên mẫu, resize/đổi chế độ, rồi Thoát: form, iframe/timeOrigin, source scroll, URL và tiến độ review giữ nguyên. Chạy lại tạo ID/iframe riêng mới; đây là chuyển ngữ cảnh có chủ đích, khác thay file/tab/bố cục.

## Phạm vi ghi nhận

Mỗi bản ghi có ID phiên, số thứ tự, thời điểm, bước trình diễn, loại bằng chứng, thao tác, chi tiết kết quả, source và vùng UI. Một thao tác đồng bộ có thể tạo nhiều bản ghi liên tiếp. Tốc độ chỉ thay thời gian đọc chỉ dẫn/kết quả ở ngoài nghiệp vụ; không chèn delay vào hàm sản phẩm.

- **Đã quan sát:** input/click DOM, giá trị sau tương tác, nhãn/readonly, lỗi cạnh trường, thuộc tính aria-busy/disabled, nội dung vùng phí, kết quả điều hướng, MSW request/response và status thực tế.
- **Diễn giải từ source:** validation/helper/setter/React state/render, truyền props, contract compile-time, kiểm tra response bên trong client, persistence và navigate nội bộ. Không phát các bản ghi giả cho những lời gọi chưa đo này. Bằng chứng gắn tại node chỉ chứng minh phần DOM/UI/HTTP được ghi; đường xanh giải thích nhánh từ kết quả thực, không phải trace mọi hàm.

Graph nhiều nhánh dùng chung dữ liệu `runtime-flows.ts`; kịch bản chỉ chọn đầu vào/thao tác hoặc bật lỗi mock once. Nhánh được hiển thị dựa trên kết quả UI/HTTP đã xảy ra, kể cả khi khác mong đợi; khi thiếu điều kiện, phiên dừng và không xác nhận đạt.

`scripts/preview-run-plugin.ts` chỉ biến đổi adapter environment và gắn listener MSW trong bản preview được phục vụ/build. **Bỏ qua `?raw`/`?url`**, giữ source học nguyên văn. `?workshopRun=<id>` hợp lệ mới bật namespace `quotation-workshop.run.<id>.<checkpoint>.v1` và `/api/checkpoints/<checkpoint>/run/<id>/quotations`. Không có query này, API/storage/worker thường giữ cơ chế cũ. Không có chỉnh sửa hàng loạt snapshot hoặc thay logic nghiệp vụ.

Host truy cập iframe cùng origin, kiểm tra URL, checkpoint, session và phiên bản bridge. Không dùng postMessage hoặc nhận message từ cửa sổ khác. Observer MSW không đủ để xác nhận React state, từng lời gọi, hoặc transaction lưu trữ. Các khóa phiên riêng nằm trong localStorage ở namespace riêng; không gộp với dữ liệu review và không tự xóa các khóa khác.

Pause chỉ chặn trước thao tác tiếp theo. Request đã gửi vẫn có thể hoàn tất. AbortController hủy chờ/hàng đợi, ID phiên chặn kết quả cũ cập nhật phiên mới. Chạy lại mở namespace mới; response cũ nếu hoàn tất chỉ thuộc phiên cũ. Quan sát lại bước lỗi tiếp tục đọc điều kiện, không tự gửi lại POST chưa rõ kết quả. Có thể tự thao tác hoặc Chạy lại bằng phiên riêng mới.

## Kiểm tra và giới hạn

| Kiểm tra | Kết quả |
| --- | --- |
| Typecheck / build | PASS: `npm.cmd run build`, gồm workshop và cả 29 checkpoint; Vite 7,27 giây |
| Unit / source | PASS: 53/53, 9 file; `npm.cmd test -- --fileParallelism=false --testTimeout=15000` |
| Browser | 30 kịch bản liên quan đã đạt: lượt 28 ca đầy đủ đạt; 7 ca kiểm tra cuối đạt, gồm 2 ca mới về đổi mốc thiếu và pause lúc chờ iframe. Giữ assertion và dùng giới hạn tổng 120 giây cho các ca nhiều mốc/source |
| Field A–F | PASS: 0/1/1/3/6/8 input, nhãn/readonly, source/range cùng mốc, node chưa hình thành, bấm hoặc Enter ở Nơi dùng mở đúng code; không tăng tiến độ |
| UI / nhánh | PASS: tự nhập có hướng dẫn, validation lỗi, phí 1.100.000, mất hiệu lực/khóa Lưu, tính lại 2.200.000; MSW 500 → giữ tên/phí → người học tự bấm retry → POST thứ hai / 201 |
| Điều phối | PASS: pause khi chờ iframe, Tiếp bước chỉ điền mẫu rồi dừng trước Tính phí; pause trong lúc gửi, restart/thoát không nhận kết quả cũ; điều kiện thất bại dừng, quan sát lại và thao tác chủ động để tiếp tục |
| Context / history | PASS: resize, ba chế độ, Flow/Code, manual wheel ngừng follow, Theo tiếp; đọc lịch sử không POST lại; thoát giữ iframe/timeOrigin, form review, URL, code scroll và tiến độ |
| Bố cục | PASS: 1440×900, 1920×1080, vùng CSS tương đương zoom, mobile 390/320; điều khiển truy cập được, không cuộn ngang toàn trang, Info/Escape trả focus, source highlight khi mở vùng đọc trên mobile |
| Chrome zoom 125% thật | PASS qua Settings, DPR 1,25; cửa sổ 1440×900 cho viewport 1138×643, code 395,6 px / 61,5%; cửa sổ 1920×1080 cho viewport 1522×787, code 539,6 px / 68,6%. Cả ba chế độ giữ scroll/iframe/UI; reduced motion bật trong profile QA |
| Hồi quy | PASS: source toàn file/range, Field/mốc nhỏ thường, cây 3.4, URL/Back/Forward, preview cuối tính/lưu/reload/GET/bảo vệ rời form và namespace mẫu/tham chiếu/practice độc lập |
| HMR | PASS: `npm.cmd run test:hmr`, sửa/quan sát/khôi phục trên bản sao QA; không reload hoặc đổi source gốc |
| Bảo toàn / preview | 719/719 file được bảo vệ giữ nguyên hash; product sạch, `git diff --check` đạt; HTTP 200 tại localhost:3181, giữ server cũ chạy; không commit/push |

Bằng chứng tại `.verification/run-session-20261031`: hash trước/sau, log build/browser, ảnh desktop/mobile, script demo và Chrome zoom 125% thật. QA dùng profile riêng. Lượt unit dùng 15 giây cho ca đối chiếu source đầy đủ trên máy Windows này; không đổi cấu hình timeout mặc định của repository.

Chưa instrument hàm/React/storage; phần này vẫn là diễn giải. Chưa chạy tự động trên Bài tôi đang làm, Firefox hoặc Safari. Kịch bản quan sát theo các checkpoint/mapping đã công bố, không phải debugger tổng quát hoặc công cụ tự chấm bài. Mốc 09 hiển thị biên nhận POST theo cơ chế hiện có; GET/reload cuối chặng được kiểm tra riêng. Build vẫn có cảnh báo chunk lớn đã có trước đợt này; vùng graph/source của phiên chạy được lazy load.

Preview tiếp tục tại localhost:3181. Không commit/push hoặc triển khai Chặng 2.
