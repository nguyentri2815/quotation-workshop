# Workspace dùng chung Chặng1 / Chặng2

> Lưu trữ phiên bản bài học cũ. Hành trình hiện hành: [Revision3](CHANG-2-REVISION-3.md). Source/ID lịch sử giữ nguyên; các kết quả dưới đây không thay thế người dùng review/đồng ý Product.

Bản review tiếp nối công việc chưa commit. Không sửa nghiệp vụ Product, snapshot hoặc practice. Đây là thay đổi host Workshop và dữ liệu bài học; không phải chặng nghiệp vụ mới hay revision source Product.

## Mở đúng chế độ

- [Cấu trúc tính năng](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete&tab=overview&overviewMode=structure).
- [Theo một thao tác](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate).
- [Xây từng bước / Code tại Validation](http://localhost:3181/?stage=2&version=2#checkpoint=s2-04-validation&tab=build).
- [Phụ thuộc tại Validation](http://localhost:3181/?stage=2&version=2#checkpoint=s2-04-validation&tab=build&buildView=dependencies).

Ví dụ: trong Cấu trúc tính năng chọn [**Validation theo sản phẩm**](http://localhost:3181/?stage=2&version=2#checkpoint=s2-r2-complete&tab=overview&impact=validation). Catalog, Validation và Form & state có viền tác động riêng; các quan hệ tra giới hạn/consumer được đánh dấu, các node khác giữ làm ngữ cảnh. Chọn node để đọc inspector, Trước/Sau/Lý do và source; “Học cách xây yêu cầu” mở mốc2.1. Bỏ lọc không fit lại canvas. “Mới ở Chặng2” là delta yêu cầu; “Đang bổ sung” là trạng thái tại checkpoint; selection có outline xanh khác viền tím tác động. Tham số `impact` của workspace tách khỏi `requirement` của Hành trình dự án; mở/đóng màn dự án không ghi đè bộ lọc.

## Đối chiếu source và controller thực tế

| Vùng | Chặng1 baseline | Trước lượt này ở Chặng2 | Hiện dùng chung |
| --- | --- | --- | --- |
| Routing / lựa chọn | `useSelection` trong `navigation.ts`: state, reset khi đổi source, normalize flow, hash, Back/Forward | Parse/hash/pushState và listener riêng trong StageTwoAdapter | Cùng `useSelection`; Stage2 chỉ cấp codec parse/hash/normalize cho `stage/version/checkpoint/requirement` và các ID của bài học. Không dùng `journey=2` đặt tên Chặng2. |
| Tổng thể / Cấu trúc | `Overview`: ReactFlow responsibility nodes/relations, selection, Fit View, inspector, SourceTree và bước hình thành | Text yêu cầu/thử và graph khác cho flow | Cùng `Overview` và node renderer, inspector/controller. Stage2 cấp10 trách nhiệm (9 vai trò nền + catalog), delta, trạng thái, quan hệ, yêu cầu và source. Viewport lưu theo chặng trong vòng đời app; chỉ fit khi mở lần đầu hoặc chủ động bấm. |
| Tổng thể / Theo thao tác | `RuntimeFlow`, `runtime-flows`, `useFlowViewport`, history path, tình huống, nhánh/merge/retry, source/UI linkage | StageFlow riêng, thiếu controller tình huống và lịch sử đọc của Chặng1 | Cùng `RuntimeFlow`, controller selection/path/branch, overlay/focus và viewport. Stage2 cấp5 flow, mapping nguồn theo checkpoint và quy tắc diễn giải nhánh. Renderer StageFlow riêng đã gỡ. |
| Code / explorer chức năng | `BuildSession`, `FunctionalTree`/model/history, nhóm vai trò, task focus/related, source Trước/Sau/Diff | SourceTree có symbol và liên kết thay cho cây vai trò | Cùng `FunctionalTree`; Stage2 cấp role sections/ranges, nhóm, liên kết và task focus. `SourcePanel` nhận cùng section resolver để lựa chọn vai trò và code khớp nhau. Cây vật lý vẫn là `SourceTree` riêng. |
| Phụ thuộc | `StepDependencies`, `dependency-tree.model`: scope, file/symbol/edge, vị trí gọi, source/target, local history và inspector | Chỉ active tab, vẫn giữ Code + cây cũ | Cùng `StepDependencies`/model, portal toolbar, tree reveal, scope, history và quan hệ inspector. Stage2 cấp node/edge, catalog, range anchors, scope và vị trí bước. |
| Chạy thử | `useRunSession`, `RunToolbar`, `RunPreview`, `RunWorkspace`/RunGraph và driver DOM/MSW | Cùng engine nhưng graph riêng | Cùng renderer run; Stage2 cấp flow và mapping evidence chọn sản phẩm/đọc lại sang đúng node. Đọc lại journal không chạy thao tác hay POST. |

State disclosure/scroll/viewport và focus thuộc component dùng chung. Dữ liệu Stage2 ở `workspace-data.ts`, `workspace-flows.ts`; `StageTwoAdapter` ghép các component, dữ liệu, progress key và capability. Không có app shell hoặc engine diagram thứ hai. Header/frame, resize, ba work modes, preview và session engine tiếp tục dùng chung.

## Cách đọc và thử

**Cấu trúc:** chọn yêu cầu → chọn node → mở chi tiết → source hoặc bước học. Delta dùng màu/glyph và chữ; node chưa có giữ trạng thái thiếu, cạnh chưa nối có nhãn riêng. Các node là trách nhiệm, không phải mỗi file một node. Inspector/cây source mới dẫn tới file/symbol thật. Mũi tên cấu trúc không phải thứ tự chạy.

**Theo thao tác:** chọn hành vi, chuẩn bị tình huống, đi từng sự kiện hoặc nhánh, tiến/lùi, danh sách/history, đổi nhánh, pan/zoom rồi Theo tiếp sự kiện. Cùng graph cho lỗi/thành công và đường hợp nhất; retry là tương tác mới. Thao tác chọn event chỉ đổi diễn giải. Liên hệ với UI chỉ highlight phần tử đang có; không tạo dữ liệu, bấm nút hay gửi GET/POST.

**Xây:** chọn2.1 → nhóm Validation & pricing mở và chọn `validateDraft`; Consumer validation/chuẩn hóa/lookup/catalog là liên quan, không mặc định chọn `productCode`. Tự chọn role/source giữ quyền khám phá; resize/chuyển tab không kéo lại scroll. “Về nhiệm vụ hiện tại” mới chủ động trả focus. Sub-step chỉ hiện trong Xây; Tổng thể và phiên chạy dùng checkpoint gọn ở header.

**Phụ thuộc:** scope Sub-step2.1 → chọn Validation → Xem quan hệ Gọi lookup → chọn vị trí → code nguồn hoặc đích → quay lại cây và lựa chọn trước. Scope Toàn bước có thêm các thành phần thuộc2.2. Tìm symbol dùng portal toolbar của chính component dùng chung. “Xem phần chưa hình thành” và cây vật lý tương lai dùng catalog của chặng hiện tại, không lấy nhầm source Chặng1.

Tham chiếu kiểu, gọi hàm, đọc/ghi state, callback và props có nhãn riêng. Một số call initializer/JSX chưa có `DependencySite` riêng trong index cũ: mapping dùng AST range của đúng khai báo/JSX chứa vị trí đó, không đổi snapshot để chèn site. Helper overload chọn thân triển khai có range chứa consumer; không chọn signature rồi báo mất quan hệ. Symbol không tồn tại giữ trạng thái thiếu, không thay bằng symbol đầu file.

## Ngữ cảnh được giữ và capability

- Đổi tab/file, Code↔Phụ thuộc, khám phá yêu cầu/event, work mode hoặc resize không đổi key/src của iframe checkpoint. Lịch sử đọc không gọi lại POST. Chọn checkpoint/Trước/Sau có thể đổi source chạy và khởi tạo form của mốc khác, có mô tả sẵn ở Preview.
- Tiến độ/ghi chú Stage2 vẫn dùng `quotation-workshop.stage2.progress.v2`; tiến độ Chặng1 và practice không đổi. Chọn/bỏ yêu cầu, node, nhánh, source, scope/vị trí dependency được ghi trong URL phù hợp. Các URL cũ `stage=2&version=1#checkpoint=...&view=flow/diff/dependencies` vẫn được ánh xạ.
- Bài tôi ở Chặng2 chưa có adapter starter đủ mapping; nút bị khóa và có giải thích. Không mở practice Chặng1 thay thế.
- Stage2 cần dữ liệu riêng vì khác yêu cầu, source và khả năng từng mốc. Quy tắc nhánh/khả năng A/B ở intermediate checkpoints được giữ đúng code ghim (ví dụ1.2 khóa cả hai,2.1 validation B nhưng chưa tính B,2.2 tính B nhưng chưa lưu). Chưa viết framework cho nghiệp vụ/chặng khác.

## Kiểm tra và ảnh đối chiếu

Kết quả: **64/64 unit**, typecheck host/checkpoint và build đạt. **101 ca browser riêng biệt đã được xác minh đạt qua các lượt hồi quy**, không phải một lệnh chạy xanh duy nhất: Chặng1 đủ64 ca (lượt đầy đủ62 đạt,2 lỗi rồi kiểm tra lại đạt); Preview1/2 đủ15; workspace/phiên quan sát và Hành trình dự án12; bộ đối chiếu mới10/10 đạt ở lượt cuối. Bộ mới kiểm cả API GET/POST bằng0 khi chỉ khám phá graph; code/dependency có chức năng khác nhau, URL/Back/Forward, filter/viewport, late source, missing symbol, future tree, capability, desktop và mobile.

Zoom Chrome thật125% đã đạt bốn vùng Cấu trúc / Theo thao tác / Code / Phụ thuộc: devicePixelRatio1→1,25, viewport CSS1422×804→1138×643; không tràn ngang; Code còn trên60% chiều cao. Screenshot dùng CDP để tránh crop sai khi zoom native. Kiểm tra900 file đã ghi hash trước sửa cho kết quả **không file nào đổi**, gồm toàn bộ snapshot hiện có, practice, source Product và index Chặng1. Không đổi lockfile/dependency.

Các lần lỗi và xử lý (đã nêu nguyên nhân trước khi chạy lại):

1. Signature overload thiếu consumer/site: resolver chọn thân hàm; initializer/JSX dùng range AST đúng vị trí. Unit xác minh chuỗi consumer→chuẩn hóa→validation→lookup→catalog và range source/target.
2. Refactor codec còn gọi serializer baseline ở một nhánh: filter chỉ đổi `requirement` bị bỏ qua. Toàn bộ so sánh/ghi/restore dùng codec; bộ lọc dùng `impact`, độc lập `requirement` của màn Hành trình. Ca giữ filter qua đóng/mở màn dự án/reload và deep link dự án đã đạt.
3. Explorer ở1920 đôi lúc kéo lại scroll khi source tải xong sau thao tác khám phá. Reveal dùng chung nay hủy chờ khi người học thao tác, chỉ reset theo navigation/focus epoch. Kiểm lại1440/1920 và một ca chủ động giữ raw source trả về muộn đều đạt.
4. Test cũ tìm search result trong panel thay vì portal, hoặc tìm cả cây đang ẩn và cây vật lý đang hiện: sửa đúng scope/visible locator; không chọn đại symbol/file đầu tiên. Test sub-step trong run cũng được đổi theo baseline Chặng1 (ẩn strip). Mobile run đo khoảng59,6% chiều cao; tiêu chí kiểm55%, desktop60%, không giảm ngưỡng của Code thông thường.
5. Cold start/lazy iframe dưới tải QA vượt5 giây, guided save chưa xong trong5 giây; các kiểm tra readiness chờ điều kiện thật tối đa30 giây, không dùng thời gian làm bằng chứng thành công. Một unit tái lập snapshot timeout15 giây khi chạy đồng thời nhiều browser; chạy lại giới hạn30 giây kiểm nguyên hash/practice đạt64/64.
6. Lần QA zoom đầu dùng nhầm URL bước6.0 (checkpoint10-list) nhưng đợi checkpoint12; đã sửa URL6.4, không sửa source để khớp locator. Lượt toàn bộ sớm được dừng để hoàn thiện routing chung; không tính lượt dừng là đạt.

Artifact QA ở `.verification/unify/` bị Git ignore; không phải dữ liệu trình duyệt cá nhân và không cần để cài/running app. Build vẫn cảnh báo chunk source/index lớn và import config Vite thiếu extension có sẵn. Kiểm bằng Chrome trên máy này, mobile là viewport giả lập; chưa kiểm Firefox/Safari hoặc screen reader. Quan hệ học tập được biên soạn và kiểm range theo scope, không phải toàn bộ dependency tự suy ra.

Ảnh cùng kích thước: `compare-stage1-structure-1440.png` / `compare-stage2-structure-1440.png`, cặp1920 tương ứng; `compare-stage1-runtime-1440.png` / `compare-stage2-runtime-1440.png`. Native125% có cặp `native125-stage1-structure.png` / `native125-stage2-structure.png`, cùng ảnh Code/Runtime/Dependency và số đo `zoom.json`. Screenshot chỉ là bằng chứng bố cục; tương tác/không POST/giữ iframe được kiểm tra riêng bằng browser tests.

Lệnh: `npm.cmd ci`; `npm.cmd run dev -- --strictPort` tại3181; `npm.cmd test -- --testTimeout=15000`; `npm.cmd run build`; `npm.cmd run test:browser -- --timeout=120000`. Build bao gồm typecheck host/checkpoint. Không commit/push; không chuyển Chặng3.
