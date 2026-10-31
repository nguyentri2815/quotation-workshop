# Chuẩn bị Chặng 2

Ngày 31/10/2026. **Chỉ là kế hoạch có điều kiện; chưa triển khai tính năng Chặng 2.** Mốc xuất phát là [bàn giao Chặng 1](CHANG-1-HANDOFF.md).

## Căn cứ đã đọc và điểm chưa chốt

Đã đối chiếu README của cả hai repo, `docs/CHANG-1-BEHAVIOR-JOURNEY.md`, `CHANG-1-MICROSTEPS.md`, `CHANG-1-DEPENDENCY-TREE.md`, `CHANG-1-BRANCHING.md`, `CHANG-1-RUN-SESSIONS.md`, `CHANG-1-SOURCE-REVIEW.md`, `src/workshop/steps.ts`, `catalog.ts`, `operations.ts`, `milestones.ts`, `checkpoints/manifest.json`, cùng các trang/types/rules/API/mock hiện có của Product.

Trình tự được lưu hiện tại mô tả **Chặng 1**: dựng UI → nhập liệu → validation/phí → nhất quán khi sửa → lưu → GET/reload/bảo vệ rời trang. Không tìm thấy file roadmap hoặc yêu cầu nghiệp vụ xác định Chặng 2 trong hai repo và thư mục cha dự án. Các tài liệu nhắc Chặng 2 chỉ yêu cầu dừng ở Chặng 1. Cần roadmap nghiệp vụ của hai repo này để điền các yêu cầu còn trống bên dưới.

`journey=2` trong URL và `behaviors.v2` là phiên bản hành trình **Chặng 1**, không phải yêu cầu cho Chặng 2. README Product ghi chưa có lưu nháp/chỉnh sửa sau lưu/đăng nhập; đó là giới hạn, **không phải quyết định chọn chúng cho chặng tiếp theo**.

| Nội dung cần chốt | Hiện có | Thông tin cần bổ sung trước khi triển khai |
| --- | --- | --- |
| Hành vi mới | Chưa có đặc tả | Ai thực hiện, từ màn hình nào, thao tác nào, kết quả khác Chặng 1 ra sao; một ví dụ trước/sau. |
| Dữ liệu/quy tắc | Chặng 1 chỉ Normal, một tài sản/khách hàng, VND, một kỳ | Trường/quy tắc nào thêm hoặc đổi, mặc định và giới hạn, trường hợp không hợp lệ. |
| Phạm vi bản đầu | Chưa được chọn | Một hành vi đủ nhỏ để preview ngay; các nhánh nào làm sau. |
| API/lưu trữ | MSW + localStorage hiện tại | Có đổi contract/schema/API hay giữ nguyên; xử lý dữ liệu cũ và lỗi. |
| Bài học/đối tượng | Chặng 1 có mẫu và bài người học riêng | Mục tiêu học mới; bắt đầu từ bản hoàn chỉnh hay bài người học, tiêu chí tự kiểm tra. |

Chưa thể viết tiêu chí nghiệp vụ Chặng 2 như một yêu cầu đã được phê duyệt. Khi có roadmap, bổ sung đường dẫn/bản sao đặc tả được phép lưu vào repo và thay các phần có điều kiện bên dưới. Việc thiếu này không cản commit/push Chặng 1.

## Phần mới so với Chặng 1

- **Đã xác nhận về cách triển khai:** yêu cầu mới phải có căn cứ; có preview sớm; chỉ rõ dùng lại/thay đổi và lý do; mỗi helper được nối nơi dùng trong cùng bước; UI/cách thử/điều kiện đạt rõ tại từng mốc. Giữ ranh giới giữa quan sát DOM/MSW với giải thích source.
- **Chưa xác định về nghiệp vụ:** tập trường, thao tác, công thức/quy tắc, API và trạng thái mới. Không coi tính phí/lưu/retry/reload đã có là nghiệp vụ mới của Chặng 2.
- Đề xuất mô tả thay đổi mới bằng **Δ**: đúng một thao tác cùng đầu vào, trạng thái trước và kết quả sau đã được người dùng chốt. Δ chỉ là chỗ ghi đặc tả, không phải tên một tính năng sẽ tự thêm.

## Phạm vi nhỏ đề xuất để có preview sớm

Trong khi thiếu yêu cầu, phạm vi chuẩn bị an toàn là **một mốc xuất phát dùng lại bản Chặng 1 hoàn chỉnh và một thẻ mô tả yêu cầu Δ khi đã chốt**, tách khỏi các snapshot Chặng 1. Preview đầu tiên phải chạy lại hành trình hiện có tại 3180/3181, chưa đổi dữ liệu hay công thức. Đây là đề xuất khung mở đầu, chưa được code trong lượt này và chưa được coi là hoàn thành nghiệp vụ Chặng 2.

Sau khi Δ có đặc tả, bản đầu chỉ nối **một đường đi thành công có thể quan sát từ UI đến kết quả**. Thêm ngay điều kiện sai cần thiết để không tạo dữ liệu sai hoặc báo thành công giả. Các nhánh lỗi/retry và đọc lại cần cho Δ nằm trong mốc kế tiếp. Không gom nhiều loại bản chào, nhiều sản phẩm hoặc nhiều quy tắc mới chỉ để lấp chỗ trống roadmap.

## Thành phần dùng lại và cần xem xét thay đổi

| Thành phần | Hướng xử lý | Lý do / điều kiện đổi |
| --- | --- | --- |
| Product: router/layout, CSS Modules, Field, FixedInformation, PremiumSummary, format | Dùng lại phần còn đúng với Δ | Đã có UI và định dạng; chỉ đổi props/presentation khi yêu cầu mới cần. Không tạo bản sao công thức trong component. |
| Product: types, rules, `CreateQuotation` draft/errors/premium/saving | Giữ baseline; sửa đúng điểm Δ yêu cầu | Contract/quy tắc và ownership quyết định tác động validation, phí, điều kiện lưu; chưa có căn cứ đổi công thức. |
| Product: `quotationsApi`, parser response, MSW handlers/storage | Dùng lại ranh giới; chỉ mở rộng nếu Δ cần HTTP/schema mới | Giữ validate tại ranh giới, tính lại phí ở mock và seed một lần. Nếu đổi schema phải có chính sách dữ liệu cũ trước khi ghi. |
| Workshop: code viewer/Shiki, source tree, dependency inspector, layout/preview | Dùng lại cơ chế | Các vùng đã hỗ trợ checkpoint/range và giữ ngữ cảnh; không cần viết lại workspace để thêm bài học. |
| Workshop: bài học, operations/milestones, dependency/flow/run plan | Bổ sung dữ liệu cho Δ sau khi đã có source chạy | Mapping cũ chỉ đúng Chặng 1; không gắn nhãn đã quan sát cho hàm mới chưa instrument. |
| Workshop: sample, snapshot plan, manifest, source index | Tạo baseline/version riêng khi bắt đầu Chặng 2 | Không đổi ý nghĩa ID/hash Chặng 1 hoặc sửa tay generated snapshots/index. Xác định cơ chế version trước khi thêm. |
| Workshop: progress/storage namespace, `src/practice`, starter/solutions | Bảo toàn; namespace mới nếu cần | Không chuyển dấu hoàn thành cũ thành hoàn thành mới, không ghi đè bài đang làm hoặc dữ liệu review. |
| Tests/lockfiles/assets | Dùng lại suite; bổ sung kiểm thử hành vi Δ | Đảm bảo tái lập hai repo; chỉ đổi dependency khi có nhu cầu cụ thể và giữ lockfile. |

## Thứ tự hình thành tính năng sau khi có đặc tả

Không chia thành đợt “viết toàn bộ helper” rồi mới ghép UI. Bảng dưới là khung tuần tự; tên trường/thao tác/API cụ thể chỉ được điền khi có Δ. Bước không liên quan HTTP/schema thì bỏ phần tương ứng và ghi lý do.

| Bước / sub-step | Kết quả và nơi ghép | UI tại mốc / cách chạy thử | Điều kiện qua mốc |
| --- | --- | --- | --- |
| 0.1 Chốt yêu cầu | Ghi nguồn roadmap, ví dụ trước/sau, phạm vi Δ và giới hạn; xác định input/output/error và dữ liệu cũ. | Dùng Product Chặng 1 tại 3180 để chỉ đúng nơi hành vi mới xuất hiện; đối chiếu Workshop tại 3181. | Không còn chỗ trống quyết định nghiệp vụ cho đường đi đầu tiên. |
| 0.2 Mốc xuất phát chạy được | Ghim baseline Chặng 1 theo SHA; thống nhất version/namespace Chặng 2 và bài người học, không đè mốc cũ. | Preview mở được bản hiện có; thẻ yêu cầu nêu Δ và cách tự thử, phân biệt phần chưa có. | Hành trình tính → sửa → tính lại → lưu → reload vẫn chạy; tiến độ/bài cũ được giữ. |
| 1.1 Hình dạng tương tác mới | Thêm đúng affordance/nhãn/trường cần cho Δ tại nơi dùng, cùng props/contract tối thiểu; phần chưa nối có giải thích. | Người review thấy ngay UI khác baseline; thử nhãn, Tab, mobile và trạng thái chưa đủ điều kiện. | Có URL/mốc review; UI không báo thành công hay gửi request khi chưa nối. |
| 1.2 Nối nhập và điều kiện | Nếu Δ có input, thêm draft/state/change tại component sở hữu; helper chuẩn hóa/validation viết và nối ngay vào handler/JSX lỗi trong bước này. Nếu không có input mới, nối điều kiện của thao tác ngay tại nơi dùng. | Tự nhập/thao tác với đầu vào hợp lệ và sai, xem lỗi tại đúng chỗ, chưa gửi dữ liệu sai. | State/hiển thị/điều kiện nút khớp; không còn helper chưa có consumer. |
| 1.3 Đường đi thành công đầu tiên | Thêm rule/biến đổi Δ rồi gọi ngay từ handler, trình bày kết quả bằng component dùng chung. Nếu phải lưu mới có kết quả, nối client + MSW tối thiểu + consumer cùng mốc; không giả báo lưu thành công. | Preview sớm: người dùng làm đúng một thao tác Δ và thấy kết quả theo ví dụ đã chốt. So sánh cùng đầu vào với baseline. | Kết quả tính/hiển thị hoặc response thật của mock khớp tiêu chí Δ; không phá phí/lưu Chặng 1. |
| 2.1 Tính nhất quán | Nối helper phát hiện thay đổi (nếu cần) trực tiếp trong update/guard; xác định dữ liệu nào làm kết quả cũ hết hiệu lực. | Thử sửa từng trường liên quan và không liên quan, nút/kết quả phản ánh đúng. | Không lưu kết quả cũ khi đầu vào Δ đã đổi; quy tắc được dẫn từ đặc tả. |
| 2.2 Lưu và lỗi/retry nếu Δ cần | Bổ sung contract/parser/client/mock/storage cùng nhánh submit và hiển thị; loading/guard/catch/retry được nối cùng đường dùng. Xử lý schema cũ trước khi ghi. | Thử thành công, lỗi một lần, double click, retry chủ động; request/status thấy được, dữ liệu không mất. | Không báo thành công khi response lỗi/timeout; không POST lặp từ thao tác đọc. |
| 2.3 Đọc lại nếu Δ có dữ liệu lưu | Nối parser/GET/list/detail cùng UI cần hiển thị Δ; có empty/not-found/error/retry tương ứng. | Reload và mở từ danh sách; thử ID không có hoặc dữ liệu cũ theo chính sách đã chốt. | Kết quả mới được đọc lại đúng, không chỉ nằm trong state của trang tạo. |
| 3.1 Diễn giải và Chạy thử | Khi từng mốc Product đã chạy, thêm bài học/source-range/dependency/flow và run mapping tương ứng; snapshot và index sinh từ script. | Trong Workshop, xem source/cây/nhánh tại từng mốc, chạy mẫu/hướng dẫn; node chưa có giải thích rõ. | Source và preview cùng version; DOM/MSW có bằng chứng, hàm/state/render có nhãn diễn giải. |
| 3.2 Kiểm tra và bàn giao | Chạy suite Δ và hồi quy Chặng 1, cập nhật giới hạn/link/phiên bản hai repo. | Đi hết đường mới và lỗi/retry/reload; đổi file/tab/bố cục, đọc lịch sử Chạy thử. | Đạt tiêu chí dưới đây, có kết quả thực tế và SHA tương thích. |

## Tiêu chí hoàn thành cụ thể

1. Có đặc tả Δ được truy nguồn và xác nhận: ít nhất một ví dụ đầu vào/kết quả hợp lệ, một trường hợp sai/không được phép, phạm vi dữ liệu/API và giới hạn. Chưa có đặc tả thì không gọi Chặng 2 hoàn tất.
2. Có preview sớm chạy trên 3180/3181, một thao tác mới quan sát được và checklist thử ở từng mốc. Helper mới có nơi gọi thực trong cùng bước phù hợp; không có nút active nhưng không làm gì hoặc thành công giả.
3. UI mới hoạt động bằng bàn phím và ở desktop/mobile; lỗi/loading/retry và điều kiện nút được kiểm chứng theo Δ. Nếu có persist, reload/GET đọc lại dữ liệu mới đúng; dữ liệu cũ được giữ hoặc chuyển theo chính sách đã chốt.
4. Tính phí 1 tỷ/365 ngày = 1.100.000 VND của Chặng 1 vẫn đúng trừ khi đặc tả Δ chủ động thay quy tắc đó. Sửa tiền/ngày làm phí hết hiệu lực, lưu thành công, lưu lỗi/retry, reload và chống gửi lặp vẫn đạt.
5. Workshop có source/range/checkpoint đúng phiên bản, bước/sub-step theo cách hình thành hành vi, flow phản ánh các nhánh thực. Lịch sử Chạy thử không tạo POST mới; quan sát MSW/DOM và diễn giải source được ghi riêng.
6. Chặng 1, bài người học, snapshot cũ và dữ liệu review không bị ghi đè; progress/version/namespace được xác minh. Không tự chấm bài chỉ vì đã xem mẫu.
7. Hai repo chạy được bằng `npm ci`, typecheck/build và kiểm thử phù hợp; tài liệu ghi kết quả thực, giới hạn còn lại và cặp SHA tương thích trước commit/push của Chặng 2.

Việc tiếp theo khi bắt đầu lượt mới: đọc tài liệu bàn giao, xác minh hai SHA và preview, nhận/định vị roadmap nghiệp vụ Chặng 2, rồi chốt mục 0.1. Không bắt đầu sửa nghiệp vụ dựa riêng vào khung có điều kiện này.
