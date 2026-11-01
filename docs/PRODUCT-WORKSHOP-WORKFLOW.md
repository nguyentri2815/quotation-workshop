# Quy trình Product → Workshop

Áp dụng từ 01/11/2026 cho mọi thay đổi hành trình học.

1. Triển khai Product của chặng trước để có sản phẩm nền thực tế.
2. Người dùng review và đồng ý Product. Ghi lại yêu cầu/phản hồi đồng ý và phạm vi; không suy từ test đạt, báo cáo hoàn thành hoặc việc đã có mã nguồn.
3. Ghim source Product làm đích: commit nền, trạng thái working tree và hash từng file thực tế. Commit SHA riêng lẻ không đủ khi Product có thay đổi chưa commit.
4. Sau đó mới thiết kế checkpoint, bài học, mapping source/flow/dependency và Chạy thử trong Workshop. Mỗi mốc phải tăng khả năng của thiết kế đích.
5. Khi Product đổi thiết kế, rà tác động tới **toàn bộ** bài học, snapshot, sub-step, route preview, graph, source/range, dependency và scenario có liên quan. Không chỉ sửa checkpoint cuối.
6. Xuất revision mới nếu source/checkpoint đã phát hành thay đổi. Giữ source, tiến độ, ghi chú, practice và dữ liệu lịch sử. Link cũ phải công khai phiên bản cũ và có đường sang mốc tương ứng; không đổi source dưới ID cũ hoặc tự đánh dấu bước mới hoàn thành.

Trong lượt điều chỉnh Chặng 2 này, người dùng chỉ định dùng **Product hiện hành** làm đích đối chiếu. Đây là căn cứ ghim `stage2/product-r3.json`, không phải tuyên bố rằng test hoặc báo cáo trước đó là phê duyệt Product. Không mở rộng nghiệp vụ Product; Chặng 1 là baseline và không triển khai Chặng 3.

Source Product ghim nằm ở `stage2/product-r3/`. Checkpoint/range lấy từ manifest và source chạy thật. `dev`, `test`, `typecheck`, `build` chỉ xác minh và lập chỉ mục; không tự lấy Product mới hay viết lại snapshot. `npm run stage2:materialize` dùng bản ghim, từ chối sửa ID hiện có khi nội dung khác. Product mới cần một bản ghim/revision mới và rà soát đầy đủ theo quy trình trên.


Khi chỉnh nhịp học hoặc format source đã phát hành, tạo revision/checkpoint mới. Mỗi bước xây code có bản chạy riêng; bước quan sát ghi rõ “Quan sát, không đổi source”. Từng bài trả lời vì sao, dữ liệu đến từ đâu, file tạo/sửa, consumer và thay đổi source/UI. Nối helper với consumer ở mốc phù hợp, không tạo bản sao/abstraction để tăng số bước. Formatter chạy trên source trước khi hash/index; dùng chung byte source học/preview và range AST từ bản đó. Kiểm tra adapter nhúng, cô lập Chạy thử, provenance và wrap/diff sau khi format.

Revision4 đọc nguyên pin r3; không ghim lại Product. Trong lúc biên soạn revision mới, manifest có `publication: draft`; chỉ các ID mới chưa phát hành được chỉnh. `node scripts/materialize-stage2-paced.mjs --publish` niêm phong sau kiểm tra; từ đó generator từ chối thay byte dưới cùng ID. Các lệnh dev/test/build chỉ xác minh, không tự niêm phong và không xác nhận Product được người dùng duyệt.

## Phiên chạy tổng hợp của bước lớn

Mỗi bước lớn cần phiên chạy tổng hợp; mỗi sub-step có phiên riêng khi có nội dung quan sát hữu ích.

Biên soạn sau khi Product đã được người dùng duyệt và ghim theo quy trình trên. Phiên cấp bước là một hành trình liên tục tại checkpoint đầu ra của chính bước đó, không ghép cơ học các phiên sub-step và không dùng checkpoint cuối chặng cho bước sớm. Bước chỉ quan sát yêu cầu mà chưa có hành vi phù hợp phải giải thích rõ, không tạo nút chạy giả.

Contract dùng chung nằm ở `src/workshop/run/model.ts`: StepJourney gồm stage/revision/step, outputCheckpoint, initial, observe, capabilities, segments và summary. Mỗi JourneySegment khai báo taskIds, observation, builtAt (checkpoint/sub-step/file/symbol, foundation nếu là nền tảng source), flow và capability. RunTask tiếp tục dùng chung action, assertion và kết quả DOM/MSW của engine hiện có; không thêm runner theo chặng.

Khai báo đích đầu ra, thứ tự hành động và nguồn học rõ ràng trong `src/workshop/run/step-plans.ts`. Tái sử dụng action/assertion có cùng ngữ nghĩa; không suy hành trình từ tên bước. Chặng mới cần bộ dữ liệu hành trình được biên soạn và adapter source/flow, không sửa engine để chạy riêng. Chặng chưa có dữ liệu bị từ chối, không tự dùng hành trình của chặng khác.

`validateStepPlan` kiểm tra checkpoint đầu ra, thứ tự/độ phủ task, capability và mọi tham chiếu sub-step/source bằng range AST thật. Plan lỗi bị khóa trước khi chạy. `tests/step-runs.test.ts` kiểm tra mọi bước/biến thể và ngăn khả năng bước sau xuất hiện ở bước sớm. Bổ sung kiểm thử trình duyệt cho hành vi mới, nhất là request/retry và chuyển ngữ cảnh đọc.

“Xem cách xây” chỉ mở vùng đọc source riêng; giữ iframe, namespace API/storage và vị trí phiên. Source trước đó có checkpoint và diff riêng, luôn ghi rõ đang đối chiếu với checkpoint phiên; không đưa range đó vào flow/source theo phiên. Trở lại vẫn tạm dừng; người học chủ động Chạy/Tiếp bước. Không gửi lại request khi đọc source, lịch sử hoặc khi retry chưa có thao tác chủ động. Thoát khôi phục ngữ cảnh bài học, không ghi tiến độ hoàn thành.
