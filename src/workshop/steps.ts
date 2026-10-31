/** v1 URL coordinates → v2 curriculum. Call only for URLs without journey=2. */
export function legacySelection(step: number, sub: number): { step: number; sub: number } {
  const mapping: Array<Array<[number, number]>> = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1]],
    [[2, 0], [2, 1]],
    [[1, 2], [3, 3], [2, 2]],
    [[3, 0], [3, 1]],
    [[3, 2], [3, 4]],
    [[4, 0], [4, 1]],
    [[5, 0], [5, 1], [5, 2]],
    [[5, 3], [5, 4]],
    [[5, 5], [5, 6]],
    [[6, 0], [6, 1]],
    [[6, 2], [6, 3]],
    [[6, 4], [6, 5], [6, 6]],
  ]
  const row = mapping[Number.isInteger(step) ? step : -1] ?? mapping[0]
  const [nextStep, nextSub] = row[Number.isInteger(sub) ? sub : -1] ?? row[0]
  return { step: nextStep, sub: nextSub }
}

export interface LessonTask {
 title: string; kind: 'create'|'edit'|'connect'|'observe'; file: string; locator: string; symbol: string; change: string; run: string; expected: string
}
export interface Lesson { id: number; title: string; kind: string; goal: string; why: string; before: string; tasks: LessonTask[]; run: string[]; expected: string[]; forbidden: string; troubleshooting: string[]; hint1: string; hint2: string; answer: string; explanation: string; question: string }
export const lessons: Lesson[] = [
  {
    "title": "Mở đầu · Yêu cầu và trải nghiệm đích",
    "goal": "Tự xây bản chào Normal / Tài sản cơ bản / VND: một khách hàng, một tài sản, một kỳ thanh toán.",
    "why": "Thử kết quả đích trước để biết mỗi hành vi cần đạt điều gì.",
    "before": "Bootstrap, router, CSS và MSW được cung cấp; checkpoint 00 chưa có form nghiệp vụ.",
    "question": "Kết quả phí trong state khác bản chào đã lưu ở điểm nào?",
    "tasks": [
      {
        "title": "Thử trải nghiệm đích",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "CreateQuotation",
        "symbol": "CreateQuotation",
        "change": "Mở bản hoàn chỉnh tham chiếu riêng ở thanh preview; đây là source mẫu, không phải bài người học.",
        "run": "Mở tham chiếu → Tạo bản chào → Điền dữ liệu mẫu → Tính phí.",
        "expected": "Tổng phí 1.100.000 VND cho một tỷ / 365 ngày."
      },
      {
        "title": "Theo hành trình tính → lưu",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "CreateQuotation",
        "symbol": "CreateQuotation",
        "change": "Ở tham chiếu, đổi số tiền, tính lại, lưu rồi reload và trở về danh sách.",
        "run": "Đổi số tiền thành hai tỷ; tính lại, lưu và reload.",
        "expected": "Phí đổi thành 2.200.000 VND; bản chào có ID và số, đọc lại được sau reload."
      },
      {
        "title": "Nhận diện scaffold và bài riêng",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "CreateQuotation",
        "symbol": "CreateQuotation",
        "change": "Phân biệt src/practice, checkpoint mẫu và reference. Chọn mẫu không chép code hoặc xác nhận tiến độ.",
        "run": "Đổi giữa Theo bước mẫu và Bài tôi đang làm; quan sát checkpoint 00.",
        "expected": "Khung chưa có form; source bài người học vẫn độc lập."
      }
    ],
    "id": 0,
    "kind": "Khám phá",
    "run": [
      "Mở tham chiếu → Tạo bản chào → Điền dữ liệu mẫu → Tính phí.",
      "Đổi số tiền thành hai tỷ; tính lại, lưu và reload.",
      "Đổi giữa Theo bước mẫu và Bài tôi đang làm; quan sát checkpoint 00."
    ],
    "expected": [
      "Tổng phí 1.100.000 VND cho một tỷ / 365 ngày.",
      "Phí đổi thành 2.200.000 VND; bản chào có ID và số, đọc lại được sau reload.",
      "Khung chưa có form; source bài người học vẫn độc lập."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Mở bản hoàn chỉnh tham chiếu riêng ở thanh preview; đây là source mẫu, không phải bài người học.",
    "hint2": "Phân biệt src/practice, checkpoint mẫu và reference. Chọn mẫu không chép code hoặc xác nhận tiến độ.",
    "answer": "Khung chưa có form; source bài người học vẫn độc lập.",
    "explanation": "Thử kết quả đích trước để biết mỗi hành vi cần đạt điều gì."
  },
  {
    "title": "Dựng màn hình tạo bản chào",
    "goal": "Mở được route tạo bản chào và nhìn thấy đủ bố cục ban đầu.",
    "why": "Dựng vùng nhập và vùng kết quả trước để xác định nơi dữ liệu sẽ được đọc và trình bày.",
    "before": "Khung Vite, router, MSW, CSS và các component trang trí đã có sẵn.",
    "question": "Route đưa người dùng tới đâu và phần nào của màn hình chưa có hành vi?",
    "tasks": [
      {
        "title": "Điểm vào và khung màn hình",
        "kind": "edit",
        "file": "sample/product/App.tsx",
        "locator": "Layout",
        "symbol": "Layout",
        "change": "Đọc Layout/router; đổi nhãn khung để thấy HMR. Starter cũ dùng practiceTitle trong PracticeApp.tsx; chỉ sửa bài của mình trong IDE.",
        "run": "Xem route /quotations/new; đối chiếu Layout và Outlet.",
        "expected": "Khung và route hoạt động; chưa có biểu mẫu nghiệp vụ."
      },
      {
        "title": "Đọc thứ tự khởi động",
        "kind": "observe",
        "file": "sample/product/main.tsx",
        "locator": "start",
        "symbol": "start",
        "change": "worker.start hoàn tất trước khi render router. Đây là scaffold được cung cấp, không thêm nghiệp vụ vào main.",
        "run": "Theo start → worker → router → CreateQuotation trong code.",
        "expected": "Chỉ ra được điểm vào và lý do chờ MSW; UI không đổi."
      },
      {
        "title": "Biểu mẫu hình thành từ Field",
        "kind": "edit",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "Field",
        "symbol": "Field",
        "change": "Dựng Field với id/label/children, các nhóm khách hàng, tài sản, thời hạn, phí và nút. Field nằm trong trang, không cần tạo layer mới.",
        "run": "Mở mẫu 03-fields; quan sát nhãn, input, vùng phí và thanh hành động.",
        "expected": "Đủ tám trường và bố cục; fieldset khóa, thông báo màn hình tĩnh giải thích chưa nhập/tính/lưu."
      }
    ],
    "id": 1,
    "kind": "Xây hành vi",
    "run": [
      "Xem route /quotations/new; đối chiếu Layout và Outlet.",
      "Theo start → worker → router → CreateQuotation trong code.",
      "Mở mẫu 03-fields; quan sát nhãn, input, vùng phí và thanh hành động."
    ],
    "expected": [
      "Khung và route hoạt động; chưa có biểu mẫu nghiệp vụ.",
      "Chỉ ra được điểm vào và lý do chờ MSW; UI không đổi.",
      "Đủ tám trường và bố cục; fieldset khóa, thông báo màn hình tĩnh giải thích chưa nhập/tính/lưu."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Đọc Layout/router; đổi nhãn khung để thấy HMR. Starter cũ dùng practiceTitle trong PracticeApp.tsx; chỉ sửa bài của mình trong IDE.",
    "hint2": "Dựng Field với id/label/children, các nhóm khách hàng, tài sản, thời hạn, phí và nút. Field nằm trong trang, không cần tạo layer mới.",
    "answer": "Đủ tám trường và bố cục; fieldset khóa, thông báo màn hình tĩnh giải thích chưa nhập/tính/lưu.",
    "explanation": "Dựng vùng nhập và vùng kết quả trước để xác định nơi dữ liệu sẽ được đọc và trình bày."
  },
  {
    "title": "Nhập và quản lý dữ liệu",
    "goal": "Input phản ánh draft do CreateQuotation sở hữu; sửa và điền mẫu được.",
    "why": "Chuỗi đang gõ có thể rỗng hoặc chưa hợp lệ; dữ liệu nghiệp vụ chỉ được dựng sau validation.",
    "before": "Màn hình tĩnh đã có đủ vùng; chưa có state draft hoặc contract nghiệp vụ.",
    "question": "Vì sao sumInsured trong draft là string nhưng trong input lại là number?",
    "tasks": [
      {
        "title": "Contract dữ liệu nhập",
        "kind": "edit",
        "file": "sample/product/quotation/types.ts",
        "locator": "QuotationDraft",
        "symbol": "QuotationDraft",
        "change": "Thống nhất QuotationDraft tám trường string, FieldErrors theo key, QuotationInput với số tiền number và cấu trúc customer/asset/period.",
        "run": "Đọc types; chạy npm.cmd run typecheck trong IDE.",
        "expected": "Contract có mặt; preview giữ màn hình tĩnh, chưa có state nhập."
      },
      {
        "title": "Phân biệt phí và bản đã lưu",
        "kind": "observe",
        "file": "sample/product/quotation/types.ts",
        "locator": "Quotation",
        "symbol": "Quotation",
        "change": "Đối chiếu Premium với Quotation có id/number/createdAt/status. Cùng checkpoint types; đây là đọc contract, không giả một thay đổi UI.",
        "run": "So QuotationInput, Premium và Quotation.",
        "expected": "Chỉ bản chào đã lưu có định danh; type không tự tạo input hay request."
      },
      {
        "title": "Nối draft, callback và điền mẫu",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "inputProps",
        "symbol": "inputProps",
        "change": "CreateQuotation sở hữu draft. inputProps truyền value/onChange; updateDraft nhận bản sao mới, sampleDraft nối nút điền mẫu.",
        "run": "Nhập tên, sửa/xóa số tiền, điền mẫu rồi sửa riêng một trường.",
        "expected": "Giá trị phản ánh đúng; các trường còn lại không mất. Tính phí báo chưa xây validation/công thức."
      }
    ],
    "id": 2,
    "kind": "Xây hành vi",
    "run": [
      "Đọc types; chạy npm.cmd run typecheck trong IDE.",
      "So QuotationInput, Premium và Quotation.",
      "Nhập tên, sửa/xóa số tiền, điền mẫu rồi sửa riêng một trường."
    ],
    "expected": [
      "Contract có mặt; preview giữ màn hình tĩnh, chưa có state nhập.",
      "Chỉ bản chào đã lưu có định danh; type không tự tạo input hay request.",
      "Giá trị phản ánh đúng; các trường còn lại không mất. Tính phí báo chưa xây validation/công thức."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Thống nhất QuotationDraft tám trường string, FieldErrors theo key, QuotationInput với số tiền number và cấu trúc customer/asset/period.",
    "hint2": "CreateQuotation sở hữu draft. inputProps truyền value/onChange; updateDraft nhận bản sao mới, sampleDraft nối nút điền mẫu.",
    "answer": "Giá trị phản ánh đúng; các trường còn lại không mất. Tính phí báo chưa xây validation/công thức.",
    "explanation": "Chuỗi đang gõ có thể rỗng hoặc chưa hợp lệ; dữ liệu nghiệp vụ chỉ được dựng sau validation."
  },
  {
    "title": "Tính phí và phản hồi lỗi",
    "goal": "Draft sai hiện lỗi; input hợp lệ đi qua công thức và render kết quả thật.",
    "why": "Nối validation ngay sau khi viết để quan sát lỗi trước khi thêm công thức; presentation và công thức có thể xây độc lập sau contract.",
    "before": "Draft, inputProps và contract Premium/FieldErrors đã có; vùng phí còn tĩnh.",
    "question": "Dữ liệu sai bị chặn ở đâu và setter đưa kết quả tới render bằng cách nào?",
    "tasks": [
      {
        "title": "Contract và validation",
        "kind": "edit",
        "file": "sample/product/quotation/rules.ts",
        "locator": "validateAndBuildInput",
        "symbol": "validateAndBuildInput",
        "change": "Dùng ValidationResult đã thống nhất. validateDraft kiểm tra trường, tiền và ngày; validateAndBuildInput chỉ trim/chuyển số khi hợp lệ.",
        "run": "Đọc nhánh success/errors và chạy typecheck; kế tiếp nối ngay vào handler.",
        "expected": "Có validation thuần; preview vẫn chưa gọi nên chưa xuất hiện lỗi nghiệp vụ."
      },
      {
        "title": "Nối validation",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "validatedInput",
        "symbol": "validatedInput",
        "change": "calculate gọi validatedInput; errors/message đưa về Field/inputProps. Nối onBlur, aria-invalid/aria-describedby và focus trường sai.",
        "run": "Để rỗng rồi bấm Tính phí; thử email sai, tiền 999999 và ngày kết thúc trước ngày bắt đầu. Sau đó điền mẫu và thử lại.",
        "expected": "Sai: có lỗi cạnh trường và focus đầu tiên. Đúng: báo hợp lệ nhưng chưa tính phí; bước tiếp viết calculatePremium rồi nối tại calculate."
      },
      {
        "title": "Viết hàm tính phí",
        "kind": "edit",
        "file": "sample/product/quotation/rules.ts",
        "locator": "calculatePremium",
        "symbol": "calculatePremium",
        "change": "Hàm thuần dùng calendarDays: net=round(sum×0.001×days/365), tax=round(net×0.1), total=net+tax. Không sửa state.",
        "run": "Đọc đầu vào/kết quả Premium, chạy typecheck; nút vẫn chỉ validation.",
        "expected": "Có công thức; chưa có kết quả thật vì calculate chưa gọi hàm."
      },
      {
        "title": "Nối presentation phí",
        "kind": "create",
        "file": "sample/product/components/PremiumSummary.tsx",
        "locator": "PremiumSummary",
        "symbol": "PremiumSummary",
        "change": "PremiumSummary nhận Premium|null và stale, gọi formatMoney để trình bày. Ghép ngay vào CreateQuotation với premium=null. Bài chọn công thức trước presentation; hai phần có thể làm song song sau contract.",
        "run": "Quan sát trạng thái chưa có phí; mở component và props tại CreateQuotation.",
        "expected": "Vùng PremiumSummary đã nối, chưa có số phí giả. Chưa gọi calculatePremium."
      },
      {
        "title": "Nối tính phí và theo toàn hành vi",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "calculate",
        "symbol": "calculate",
        "change": "calculate → validatedInput → calculatePremium → setPremium; React render tiếp truyền premium tới PremiumSummary. Setter không cập nhật DOM đồng bộ.",
        "run": "Điền mẫu một tỷ / 365 ngày → Tính phí. Theo luồng hợp lệ và dữ liệu sai trong Tổng thể.",
        "expected": "Net 1.000.000, thuế 100.000, tổng/một kỳ 1.100.000 VND; input sai không tạo phí mới."
      }
    ],
    "id": 3,
    "kind": "Xây hành vi",
    "run": [
      "Đọc nhánh success/errors và chạy typecheck; kế tiếp nối ngay vào handler.",
      "Để rỗng rồi bấm Tính phí; thử email sai, tiền 999999 và ngày kết thúc trước ngày bắt đầu. Sau đó điền mẫu và thử lại.",
      "Đọc đầu vào/kết quả Premium, chạy typecheck; nút vẫn chỉ validation.",
      "Quan sát trạng thái chưa có phí; mở component và props tại CreateQuotation.",
      "Điền mẫu một tỷ / 365 ngày → Tính phí. Theo luồng hợp lệ và dữ liệu sai trong Tổng thể."
    ],
    "expected": [
      "Có validation thuần; preview vẫn chưa gọi nên chưa xuất hiện lỗi nghiệp vụ.",
      "Sai: có lỗi cạnh trường và focus đầu tiên. Đúng: báo hợp lệ nhưng chưa tính phí; bước tiếp viết calculatePremium rồi nối tại calculate.",
      "Có công thức; chưa có kết quả thật vì calculate chưa gọi hàm.",
      "Vùng PremiumSummary đã nối, chưa có số phí giả. Chưa gọi calculatePremium.",
      "Net 1.000.000, thuế 100.000, tổng/một kỳ 1.100.000 VND; input sai không tạo phí mới."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Dùng ValidationResult đã thống nhất. validateDraft kiểm tra trường, tiền và ngày; validateAndBuildInput chỉ trim/chuyển số khi hợp lệ.",
    "hint2": "calculate → validatedInput → calculatePremium → setPremium; React render tiếp truyền premium tới PremiumSummary. Setter không cập nhật DOM đồng bộ.",
    "answer": "Net 1.000.000, thuế 100.000, tổng/một kỳ 1.100.000 VND; input sai không tạo phí mới.",
    "explanation": "Nối validation ngay sau khi viết để quan sát lỗi trước khi thêm công thức; presentation và công thức có thể xây độc lập sau contract."
  },
  {
    "title": "Giữ tính nhất quán khi sửa",
    "goal": "Phân biệt thay đổi làm phí mất hiệu lực với thay đổi giữ phí.",
    "why": "Kết quả dẫn xuất đúng ở lần tính trước có thể không còn đúng với draft hiện tại.",
    "before": "Đã nối validation, tính phí và PremiumSummary; chưa vô hiệu phí khi sửa.",
    "question": "Vì sao đổi tên giữ phí nhưng đổi ngày hoặc số tiền phải tính lại?",
    "tasks": [
      {
        "title": "Xác định đầu vào ảnh hưởng phí",
        "kind": "edit",
        "file": "sample/product/quotation/rules.ts",
        "locator": "pricingInputsChanged",
        "symbol": "pricingInputsChanged",
        "change": "So riêng sumInsured/startDate/endDate giữa previous và next. Tên, điện thoại, email, địa chỉ không tham gia công thức.",
        "run": "Đọc rule; thử đổi tên và số tiền tại mốc trước để nhận ra phí còn cũ.",
        "expected": "Rule có mặt nhưng updateDraft chưa gọi; chưa coi kết quả nhất quán."
      },
      {
        "title": "Nối policy và phản hồi khi sửa",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "updateDraft",
        "symbol": "updateDraft",
        "change": "Trước setDraft, gọi pricingInputsChanged và xóa premium khi cần; giữ calculatedBefore để hiển thị stale. Xóa message/notice, onChange xóa lỗi trường. Điều kiện nút là saving || !premium; save thật sẽ validate lại.",
        "run": "Tính mẫu; đổi tên rồi đổi tiền thành hai tỷ, thử lưu và tính lại.",
        "expected": "Đổi tên giữ 1.100.000; đổi tiền xóa phí, khóa Lưu, hiện Cần tính lại phí; tính lại được 2.200.000 VND."
      }
    ],
    "id": 4,
    "kind": "Xây hành vi",
    "run": [
      "Đọc rule; thử đổi tên và số tiền tại mốc trước để nhận ra phí còn cũ.",
      "Tính mẫu; đổi tên rồi đổi tiền thành hai tỷ, thử lưu và tính lại."
    ],
    "expected": [
      "Rule có mặt nhưng updateDraft chưa gọi; chưa coi kết quả nhất quán.",
      "Đổi tên giữ 1.100.000; đổi tiền xóa phí, khóa Lưu, hiện Cần tính lại phí; tính lại được 2.200.000 VND."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "So riêng sumInsured/startDate/endDate giữa previous và next. Tên, điện thoại, email, địa chỉ không tham gia công thức.",
    "hint2": "Trước setDraft, gọi pricingInputsChanged và xóa premium khi cần; giữ calculatedBefore để hiển thị stale. Xóa message/notice, onChange xóa lỗi trường. Điều kiện nút là saving || !premium; save thật sẽ validate lại.",
    "answer": "Đổi tên giữ 1.100.000; đổi tiền xóa phí, khóa Lưu, hiện Cần tính lại phí; tính lại được 2.200.000 VND.",
    "explanation": "Kết quả dẫn xuất đúng ở lần tính trước có thể không còn đúng với draft hiện tại."
  },
  {
    "title": "Lưu và xử lý kết quả",
    "goal": "Nối UI → handler → API client → mock → storage → response → UI trong cùng bước.",
    "why": "Chỉ response hợp lệ sau persist mới xác nhận lưu thành công; lỗi phải giữ dữ liệu để sửa/thử lại.",
    "before": "Draft có validation, phí nhất quán và điều kiện cho phép lưu; chưa có client/mock nghiệp vụ.",
    "question": "Lỗi HTTP hoặc storage quay về UI thế nào mà không làm mất draft?",
    "tasks": [
      {
        "title": "Contract tạo và response",
        "kind": "edit",
        "file": "sample/product/quotation/rules.ts",
        "locator": "parseQuotationInput",
        "symbol": "parseQuotationInput",
        "change": "Kiểm tra unknown tại HTTP boundary; input không chứa Premium tin cậy. parseQuotation xác nhận ID/số/ngày/trạng thái và phí đọc về.",
        "run": "Đọc parseQuotationInput/parseQuotation; typecheck.",
        "expected": "Contract chuẩn bị cho client và mock; UI chưa gửi request."
      },
      {
        "title": "Viết API client",
        "kind": "edit",
        "file": "sample/product/api/quotations.ts",
        "locator": "request",
        "symbol": "request",
        "change": "request quản lý fetch, JSON, timeout và ApiError. quotationsApi.create gửi input, requireQuotation kiểm tra response. GET được dùng ở bước 6.",
        "run": "Theo create → request → requireQuotation.",
        "expected": "Client có mặt, form chưa gọi. Client và mock có thể xây độc lập sau contract; bài chọn thử client trước."
      },
      {
        "title": "Thử contract qua HTTP",
        "kind": "connect",
        "file": "checkpoints/07/_workshop/tools.ts",
        "locator": "probe",
        "symbol": "probe",
        "change": "Adapter probe của workshop gọi client với sampleDraft đã validate; handler scaffold trả 501. Đây là lỗi dự kiến, không giả lưu thành công.",
        "run": "Mở Công cụ riêng workshop → Thử tạo qua API.",
        "expected": "Thấy HTTP 501; request đã qua client và tới mock chờ triển khai."
      },
      {
        "title": "Thêm mock storage",
        "kind": "edit",
        "file": "sample/product/mocks/storage.ts",
        "locator": "createQuotation",
        "symbol": "createQuotation",
        "change": "Đọc/kiểm tra dữ liệu, cấp UUID/số/ngày, tính lại Premium rồi persist. Giữ dữ liệu lỗi và báo lỗi ghi; chưa ghép handler.",
        "run": "Đọc createQuotation/readQuotations/persist và typecheck.",
        "expected": "Storage có mặt; probe vẫn 501 vì handler chưa dùng."
      },
      {
        "title": "Nối mock với storage",
        "kind": "connect",
        "file": "sample/product/mocks/handlers.ts",
        "locator": "handlers",
        "symbol": "handlers",
        "change": "POST JSON sai trả 400, input sai 422, storage lỗi 500. Chỉ persist thành công trả 201. Nối parser và storage ngay trong bước này.",
        "run": "Thử tạo qua API; kiểm tra số bản chào trả về.",
        "expected": "Có bản lưu thật trong namespace checkpoint; form chưa submit qua client."
      },
      {
        "title": "Nối lưu",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "save",
        "symbol": "save",
        "change": "onSubmit → save: guard ref, validate lại, yêu cầu premium; khóa saving, await create, điều hướng theo ID. Checkpoint 09 dùng biên nhận POST được công khai; GET độc lập xây ở bước 6.",
        "run": "Điền mẫu → Tính phí → Lưu. Quan sát đang lưu, thử bấm lặp và theo từng sự kiện Lưu thành công.",
        "expected": "Chỉ một request; biên nhận có số/ID/khách hàng/phí từ response. Không báo thành công trước persist."
      },
      {
        "title": "Lỗi, giữ dữ liệu và thử lại",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "save",
        "symbol": "save",
        "change": "Bật lỗi một lần. catch hiện message/field errors, mở ref/state; giữ draft/premium, không navigate. Timeout yêu cầu kiểm tra danh sách trước khi thử lại.",
        "run": "Mở Công cụ riêng workshop → Gây lỗi lần lưu kế tiếp; lưu, quan sát lỗi rồi lưu lại.",
        "expected": "Lỗi giữ dữ liệu; lần thử lại thành công có biên nhận. Loading khóa thao tác trong lúc chờ."
      }
    ],
    "id": 5,
    "kind": "Xây hành vi",
    "run": [
      "Đọc parseQuotationInput/parseQuotation; typecheck.",
      "Theo create → request → requireQuotation.",
      "Mở Công cụ riêng workshop → Thử tạo qua API.",
      "Đọc createQuotation/readQuotations/persist và typecheck.",
      "Thử tạo qua API; kiểm tra số bản chào trả về.",
      "Điền mẫu → Tính phí → Lưu. Quan sát đang lưu, thử bấm lặp và theo từng sự kiện Lưu thành công.",
      "Mở Công cụ riêng workshop → Gây lỗi lần lưu kế tiếp; lưu, quan sát lỗi rồi lưu lại."
    ],
    "expected": [
      "Contract chuẩn bị cho client và mock; UI chưa gửi request.",
      "Client có mặt, form chưa gọi. Client và mock có thể xây độc lập sau contract; bài chọn thử client trước.",
      "Thấy HTTP 501; request đã qua client và tới mock chờ triển khai.",
      "Storage có mặt; probe vẫn 501 vì handler chưa dùng.",
      "Có bản lưu thật trong namespace checkpoint; form chưa submit qua client.",
      "Chỉ một request; biên nhận có số/ID/khách hàng/phí từ response. Không báo thành công trước persist.",
      "Lỗi giữ dữ liệu; lần thử lại thành công có biên nhận. Loading khóa thao tác trong lúc chờ."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Kiểm tra unknown tại HTTP boundary; input không chứa Premium tin cậy. parseQuotation xác nhận ID/số/ngày/trạng thái và phí đọc về.",
    "hint2": "Bật lỗi một lần. catch hiện message/field errors, mở ref/state; giữ draft/premium, không navigate. Timeout yêu cầu kiểm tra danh sách trước khi thử lại.",
    "answer": "Lỗi giữ dữ liệu; lần thử lại thành công có biên nhận. Loading khóa thao tác trong lúc chờ.",
    "explanation": "Chỉ response hợp lệ sau persist mới xác nhận lưu thành công; lỗi phải giữ dữ liệu để sửa/thử lại."
  },
  {
    "title": "Xem lại và hoàn thiện hành trình",
    "goal": "Đọc danh sách/chi tiết qua API, reload và bảo vệ dữ liệu chưa lưu.",
    "why": "Dữ liệu đã lưu phải sống ngoài state của form; URL giữ định danh, effect quản lý vòng đời đọc.",
    "before": "Lưu đã nối và có biên nhận POST; chưa có GET UI hoặc bảo vệ rời form.",
    "question": "Sau reload, trang lấy dữ liệu ở đâu và vì sao không cần draft cũ?",
    "tasks": [
      {
        "title": "Đọc danh sách qua API",
        "kind": "connect",
        "file": "sample/product/pages/QuotationList.tsx",
        "locator": "QuotationList",
        "symbol": "QuotationList",
        "change": "Nối GET list, loading/error/retry/empty và Link theo ID. Mỗi checkpoint có namespace demo riêng.",
        "run": "Tạo ngay tại mốc 10-list; quay về Danh sách và tìm số vừa lưu.",
        "expected": "Danh sách đọc dữ liệu qua client; trang chi tiết vẫn là biên nhận có giới hạn."
      },
      {
        "title": "Chi tiết, điều hướng và reload",
        "kind": "connect",
        "file": "sample/product/pages/QuotationDetail.tsx",
        "locator": "QuotationDetail",
        "symbol": "QuotationDetail",
        "change": "Thay biên nhận bằng GET theo useParams; loading/error/retry/404. Cleanup bỏ response muộn. save chuyển ID; detail không dựa vào navigate state để đọc dữ liệu.",
        "run": "Lưu tại mốc 10, reload chi tiết, về danh sách rồi mở lại.",
        "expected": "Cùng ID vẫn đọc được; URL không tồn tại hiện trạng thái 404."
      },
      {
        "title": "Bảo vệ dữ liệu chưa lưu",
        "kind": "connect",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "CreateQuotation.useEffect[1]",
        "symbol": "CreateQuotation.useEffect[1]",
        "change": "dirty đọc draft; useBlocker và beforeunload bảo vệ rời form. allowLeave chỉ mở sau lưu thành công; dialog cho tiếp tục hoặc bỏ dữ liệu.",
        "run": "Nhập dữ liệu → Hủy → Tiếp tục nhập; sau đó thử Hủy → Bỏ dữ liệu.",
        "expected": "Giữ draft khi tiếp tục; chỉ bỏ sau xác nhận. Lưu thành công không bị blocker giữ lại."
      },
      {
        "title": "Thử hành trình xuyên suốt",
        "kind": "observe",
        "file": "sample/product/components/PremiumSummary.tsx",
        "locator": "PremiumSummary",
        "symbol": "PremiumSummary",
        "change": "Nhập → lỗi → sửa → tính → đổi tiền → tính lại → lưu lỗi → thử lại → chi tiết → reload → danh sách.",
        "run": "Thực hiện toàn hành trình tại checkpoint 11.",
        "expected": "Các phản hồi, phí và bản lưu nhất quán; không tự xác nhận bài người học."
      },
      {
        "title": "Giải thích một lần lưu",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "save",
        "symbol": "save",
        "change": "Tự giải thích ownership, intent, guard, client/mock/storage và nhánh lỗi từ source.",
        "run": "Theo luồng Lưu thành công và Lưu lỗi trong Tổng thể.",
        "expected": "Phân biệt thứ tự runtime với dependency cấu trúc; setter không đồng nghĩa DOM đã cập nhật."
      },
      {
        "title": "Tìm nơi thay đổi công thức",
        "kind": "observe",
        "file": "sample/product/quotation/rules.ts",
        "locator": "calculatePremium",
        "symbol": "calculatePremium",
        "change": "Xác định công thức dùng chung ở UI và mock; presentation chỉ format. Không sửa biểu phí trong phạm vi nghiệm thu này.",
        "run": "Theo liên kết calculatePremium → createQuotation và calculate.",
        "expected": "Chỉ đúng caller/consumer và ảnh hưởng; không nhân đôi công thức trong JSX."
      },
      {
        "title": "Đối chiếu và tự xác nhận",
        "kind": "observe",
        "file": "sample/product/pages/CreateQuotation.tsx",
        "locator": "CreateQuotation",
        "symbol": "CreateQuotation",
        "change": "Đối chiếu source cuối chặng với sản phẩm đã ghim và adapter công khai. Người học tự kiểm tra tiêu chí mới, không kế thừa dấu hoàn thành cũ.",
        "run": "Thử bài riêng; ghi phần còn thiếu. Chỉ tự xác nhận khi đã thực hiện các tiêu chí.",
        "expected": "Dừng Chặng 1 để review; không chuyển chặng hoặc chép đè bài."
      }
    ],
    "id": 6,
    "kind": "Xây hành vi",
    "run": [
      "Tạo ngay tại mốc 10-list; quay về Danh sách và tìm số vừa lưu.",
      "Lưu tại mốc 10, reload chi tiết, về danh sách rồi mở lại.",
      "Nhập dữ liệu → Hủy → Tiếp tục nhập; sau đó thử Hủy → Bỏ dữ liệu.",
      "Thực hiện toàn hành trình tại checkpoint 11.",
      "Theo luồng Lưu thành công và Lưu lỗi trong Tổng thể.",
      "Theo liên kết calculatePremium → createQuotation và calculate.",
      "Thử bài riêng; ghi phần còn thiếu. Chỉ tự xác nhận khi đã thực hiện các tiêu chí."
    ],
    "expected": [
      "Danh sách đọc dữ liệu qua client; trang chi tiết vẫn là biên nhận có giới hạn.",
      "Cùng ID vẫn đọc được; URL không tồn tại hiện trạng thái 404.",
      "Giữ draft khi tiếp tục; chỉ bỏ sau xác nhận. Lưu thành công không bị blocker giữ lại.",
      "Các phản hồi, phí và bản lưu nhất quán; không tự xác nhận bài người học.",
      "Phân biệt thứ tự runtime với dependency cấu trúc; setter không đồng nghĩa DOM đã cập nhật.",
      "Chỉ đúng caller/consumer và ảnh hưởng; không nhân đôi công thức trong JSX.",
      "Dừng Chặng 1 để review; không chuyển chặng hoặc chép đè bài."
    ],
    "forbidden": "Chỉ sửa bài của mình; không sửa sản phẩm, chép đè src/practice hoặc chuyển sang Chặng 2.",
    "troubleshooting": [
      "Kiểm tra checkpoint và chế độ preview đang chọn.",
      "Mở đúng file/range và theo liên kết tới phần sử dụng."
    ],
    "hint1": "Nối GET list, loading/error/retry/empty và Link theo ID. Mỗi checkpoint có namespace demo riêng.",
    "hint2": "Đối chiếu source cuối chặng với sản phẩm đã ghim và adapter công khai. Người học tự kiểm tra tiêu chí mới, không kế thừa dấu hoàn thành cũ.",
    "answer": "Dừng Chặng 1 để review; không chuyển chặng hoặc chép đè bài.",
    "explanation": "Dữ liệu đã lưu phải sống ngoài state của form; URL giữ định danh, effect quản lý vòng đời đọc."
  }
]
