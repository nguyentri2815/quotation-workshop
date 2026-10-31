// Stable checkpoint IDs are not lesson numbers or Git history.
export const checkpointPlan = [
  {
    "id": "00",
    "step": 0,
    "title": "Khung chạy được",
    "ui": "Khung rỗng có chủ đích. Chưa có biểu mẫu nghiệp vụ.",
    "kind": "ui",
    "formStage": 0,
    "rulesStage": 0
  },
  {
    "id": "01",
    "step": 1,
    "title": "Điểm vào và HMR",
    "ui": "Tiêu đề mẫu đổi; routing và MSW là scaffold được cung cấp.",
    "kind": "ui",
    "formStage": 0,
    "rulesStage": 0
  },
{
  "id": "01-field-contract",
  "step": 1,
  "title": "Contract Field",
  "ui": "Chỉ thêm contract id, label, children. UI chưa đổi; đọc type và chạy typecheck.",
  "kind": "source",
  "formStage": "static",
  "rulesStage": 0,
  "fieldStage": "contract"
},
{
  "id": "01-field-example",
  "step": 1,
  "title": "Vỏ Field minh họa",
  "ui": "Một Field minh họa, chưa phải form. Input chỉ đọc, chưa có state.",
  "kind": "ui",
  "formStage": "static",
  "rulesStage": 0,
  "fieldStage": "example"
},
{
  "id": "01-field-first",
  "step": 1,
  "title": "Tên khách hàng đầu tiên",
  "ui": "Ghép Field vào form với label và input children. Chỉ có Tên khách hàng; chưa có điện thoại/email.",
  "kind": "ui",
  "formStage": "static",
  "rulesStage": 0,
  "fieldStage": "first"
},
{
  "id": "01-field-customer",
  "step": 1,
  "title": "Nhóm khách hàng",
  "ui": "Cùng Field được dùng cho tên, điện thoại, email. Chưa có tài sản/thời hạn.",
  "kind": "ui",
  "formStage": "static",
  "rulesStage": 0,
  "fieldStage": "customer"
},
{
  "id": "01-field-asset",
  "step": 1,
  "title": "Thêm nhóm tài sản",
  "ui": "Thêm tên tài sản, địa chỉ và số tiền với hint. Chưa có nhóm thời hạn.",
  "kind": "ui",
  "formStage": "static",
  "rulesStage": 0,
  "fieldStage": "asset"
},
  {
    "id": "03-fields",
    "step": 1,
    "title": "Màn hình tĩnh đầy đủ",
    "ui": "Đủ khách hàng, tài sản, thời hạn, vùng phí và nút. Fieldset khóa; chưa có draft hoặc tính phí.",
    "kind": "ui",
    "formStage": "static",
    "rulesStage": 0
  },
  {
    "id": "02",
    "step": 2,
    "title": "Contract dữ liệu",
    "ui": "Màn hình tĩnh giữ nguyên; thêm QuotationDraft, QuotationInput, Premium và Quotation.",
    "kind": "source",
    "formStage": "static",
    "rulesStage": 0
  },
{
  "id": "02-draft",
  "step": 2,
  "title": "Sở hữu draft",
  "ui": "Draft khởi tạo từ emptyDraft; inputProps đọc value nhưng input chỉ đọc, chưa nối onChange.",
  "kind": "source",
  "formStage": 3,
  "rulesStage": 0,
  "draftStage": "draft"
},
{
  "id": "02-inputs",
  "step": 2,
  "title": "Nối value và onChange",
  "ui": "Nhập/sửa được qua inputProps → updateDraft. Nút điền mẫu còn khóa; mốc tiếp nối sampleDraft.",
  "kind": "ui",
  "formStage": 3,
  "rulesStage": 0,
  "draftStage": "inputs"
},
  {
    "id": "03",
    "step": 2,
    "title": "Nhập và điền mẫu",
    "ui": "Draft nối value/onChange qua inputProps; điền mẫu hoạt động. Chưa validation hay tính phí.",
    "kind": "ui",
    "formStage": 3,
    "rulesStage": 0
  },
  {
    "id": "04-rules",
    "step": 3,
    "title": "Quy tắc validation",
    "ui": "Hàm validation đã có; UI chưa gọi chúng. Xem rules và chạy typecheck.",
    "kind": "source",
    "formStage": 3,
    "rulesStage": 4
  },
  {
    "id": "04",
    "step": 3,
    "title": "Lỗi gắn với trường",
    "ui": "Tính phí kiểm tra dữ liệu và focus trường sai. Dữ liệu đúng vẫn chưa có công thức phí.",
    "kind": "ui",
    "formStage": 4,
    "rulesStage": 4
  },
  {
    "id": "05-rules",
    "step": 3,
    "title": "Hàm tính phí thuần",
    "ui": "calculatePremium đã có; nút Tính phí chưa được nối. UI chưa có kết quả mới.",
    "kind": "source",
    "formStage": 4,
    "rulesStage": 5
  },
  {
    "id": "03-summary",
    "step": 3,
    "title": "Nối presentation phí",
    "ui": "PremiumSummary thay vùng tĩnh với premium=null. Validation và công thức đã có; chưa nối calculate.",
    "kind": "ui",
    "formStage": 4,
    "rulesStage": 5
  },
  {
    "id": "05",
    "step": 3,
    "title": "Hiển thị kết quả phí",
    "ui": "1 tỷ / 365 ngày → 1.100.000 VND. Chưa xử lý phí cũ khi sửa đầu vào; chưa lưu form.",
    "kind": "ui",
    "formStage": 5,
    "rulesStage": 5
  },
  {
    "id": "06-rules",
    "step": 4,
    "title": "Nhận biết đầu vào phí đổi",
    "ui": "pricingInputsChanged đã có; updateDraft chưa dùng nó. Không coi phí đã nhất quán ở mốc này.",
    "kind": "source",
    "formStage": 5,
    "rulesStage": 6
  },
  {
    "id": "06",
    "step": 4,
    "title": "Vô hiệu hóa phí cũ",
    "ui": "Đổi số tiền hoặc ngày xóa phí; đổi tên giữ phí. Nút Lưu vẫn chưa gửi API.",
    "kind": "ui",
    "formStage": 6,
    "rulesStage": 6
  },
  {
    "id": "07-contract",
    "step": 5,
    "title": "Kiểm tra contract ngoài",
    "ui": "Thêm parser unknown cho input / response. UI chưa đổi; chưa có API client.",
    "kind": "source",
    "formStage": 6,
    "rulesStage": 7
  },
  {
    "id": "07-client",
    "step": 5,
    "title": "Fetch API client",
    "ui": "Client đã có; chưa có nút gọi thử. Đọc request / ApiError và kiểm tra typecheck.",
    "kind": "source",
    "formStage": 6,
    "rulesStage": 7
  },
  {
    "id": "07",
    "step": 5,
    "title": "Thử contract HTTP",
    "ui": "Mở Công cụ riêng workshop → Thử tạo qua API để thấy HTTP 501: mock nghiệp vụ chưa được xây.",
    "kind": "ui",
    "formStage": 6,
    "rulesStage": 7
  },
  {
    "id": "08-storage",
    "step": 5,
    "title": "Lưu trữ demo",
    "ui": "Storage đã có nhưng handler vẫn trả 501. Chưa có request nào đi qua lớp lưu trữ này.",
    "kind": "source",
    "formStage": 6,
    "rulesStage": 7
  },
  {
    "id": "08",
    "step": 5,
    "title": "Mock API hoạt động",
    "ui": "Thử tạo qua API cấp số, tính lại phí và persist. Nút Lưu của form chưa được nối.",
    "kind": "ui",
    "formStage": 6,
    "rulesStage": 7
  },
  {
    "id": "09",
    "step": 5,
    "title": "Nối lưu, lỗi và thử lại",
    "ui": "Lưu lỗi giữ draft. Thành công hiện biên nhận POST có số/ID/khách hàng/phí; GET chi tiết ở bước 6.",
    "kind": "ui",
    "formStage": 9,
    "rulesStage": 7
  },
  {
    "id": "10-list",
    "step": 6,
    "title": "Đọc danh sách",
    "ui": "GET list và Link theo ID. Lưu mới dẫn tới biên nhận POST; GET chi tiết chưa xây.",
    "kind": "ui",
    "formStage": 9,
    "rulesStage": 7
  },
  {
    "id": "10",
    "step": 6,
    "title": "Chi tiết và reload",
    "ui": "Tạo → danh sách → chi tiết → reload dùng được. Chưa có xác nhận bỏ form bẩn.",
    "kind": "ui",
    "formStage": 10,
    "rulesStage": 7
  },
  {
    "id": "11",
    "step": 6,
    "title": "Luồng Chặng 1 hoàn chỉnh",
    "ui": "Có xác nhận rời form, phí nhất quán, lưu và đọc lại. Một khách hàng, một tài sản, một kỳ.",
    "kind": "ui",
    "formStage": 11,
    "rulesStage": 7
  },
  {
    "id": "12",
    "step": 6,
    "title": "Đối chiếu và giải thích",
    "ui": "Code giống mốc 11; bước này tập trung giải thích thiết kế, không tự tạo thêm chức năng.",
    "kind": "source",
    "formStage": 11,
    "rulesStage": 7
  }
]

export const substepCheckpoints = [
  [
    "00",
    "00",
    "00"
  ],
  [
    "01",
    "01",
    "03-fields"
  ],
  [
    "02",
    "02",
    "03"
  ],
  [
    "04-rules",
    "04",
    "05-rules",
    "03-summary",
    "05"
  ],
  [
    "06-rules",
    "06"
  ],
  [
    "07-contract",
    "07-client",
    "07",
    "08-storage",
    "08",
    "09",
    "09"
  ],
  [
    "10-list",
    "10",
    "11",
    "11",
    "12",
    "12",
    "12"
  ]
]

export const microstepCheckpoints = { "1.2": ["01-field-contract","01-field-example","01-field-first","01-field-customer","01-field-asset","03-fields"], "2.2": ["02-draft","02-inputs","03"] }
