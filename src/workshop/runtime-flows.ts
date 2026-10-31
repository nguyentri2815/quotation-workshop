import { checkpoints } from './catalog'
import type { Checkpoint } from './catalog'
import { findSymbol } from './source'

export interface FlowSelection {
  overviewMode: 'structure' | 'runtime'
  runtimeFlow: string
  runtimeEvent: string
  runtimeScenario: string
  runtimeField: string
  runtimeHadPremium: boolean
  runtimePath: string
}
export interface FlowSource { file: string; symbol: string; since: string }
export interface EventUI { kind: 'origin' | 'result' | 'internal'; target?: string; try: string }
export interface RuntimeEvent {
  id: string; title: string; kind: 'Thao tác' | 'Gọi hàm' | 'State' | 'Render' | 'Async' | 'Nhánh'
  input: string; output: string; branches: string; timing: string; sources: FlowSource[]; ui: EventUI
  shape?: 'start' | 'end'; x: number; y: number
}
export interface FlowEdge { id: string; from: string; to: string; label: string; loop?: boolean }
export interface RuntimeFlow { id: string; title: string; premise: string; events: RuntimeEvent[]; edges: FlowEdge[] }
const form = (symbol: string, since = '09'): FlowSource => ({ file: 'pages/CreateQuotation.tsx', symbol, since })
const rule = (symbol: string, since: string): FlowSource => ({ file: 'quotation/rules.ts', symbol, since })
const api = (symbol: string): FlowSource => ({ file: 'api/quotations.ts', symbol, since: '07-client' })
const store = (symbol: string): FlowSource => ({ file: 'mocks/storage.ts', symbol, since: '08-storage' })
const handlers: FlowSource = { file: 'mocks/handlers.ts', symbol: 'handlers', since: '08' }
const summary: FlowSource = { file: 'components/PremiumSummary.tsx', symbol: 'PremiumSummary', since: '03-summary' }
const validation = [form('validatedInput', '04'), rule('validateAndBuildInput', '04-rules'), rule('validateDraft', '04-rules')]
const internal: EventUI = { kind: 'internal', try: 'Xem code; xử lý này không có phần tử UI riêng. Quan sát kết quả ở event Render kế tiếp.' }
const ui = (kind: 'origin' | 'result', target: string, attempt: string): EventUI => ({ kind, target, try: attempt })
function event(id: string, title: string, kind: RuntimeEvent['kind'], x: number, y: number, sources: FlowSource[], input: string, output: string, branches: string, uiLink = internal, shape?: RuntimeEvent['shape']): RuntimeEvent {
  return { id, title, kind, x, y, sources, input, output, branches, ui: uiLink, shape, timing: kind === 'Async' ? 'Có Promise/await; UI vẫn có thể render trong lúc chờ. Chưa quan sát runtime.' : kind === 'Render' ? 'React render rồi commit từ state; setter không gọi trực tiếp component trình bày.' : 'Đồng bộ; setter xếp cập nhật cho lần render kế tiếp. Chọn event chỉ thay diễn giải.' }
}
const edge = (from: string, to: string, label = '', loop = false): FlowEdge => ({ id: `${from}~${to}`, from, to, label, loop })
const calculateTry = 'Để trống Tên khách hàng rồi tự bấm Tính phí để thấy lỗi; hoặc Điền dữ liệu mẫu → Tính phí để thấy phí. Chọn tình huống ở đây không điền form.'
const saveTry = 'Mốc 09 trở đi: Điền dữ liệu mẫu → Tính phí → Lưu. Thử lỗi: tự mở Công cụ riêng workshop, bật Gây lỗi lần lưu kế tiếp, rồi bấm Lưu. Retry là lần bấm mới.'
const readSources: FlowSource[] = [{ file: 'pages/QuotationList.tsx', symbol: 'QuotationList', since: '10-list' }, { file: 'pages/QuotationDetail.tsx', symbol: 'QuotationDetail', since: '10' }]

export const runtimeFlows: RuntimeFlow[] = [
  {
    id: 'input-edit', title: 'Nhập / sửa dữ liệu', premise: 'Chọn trường và state trước thao tác. Giả định giá trị mới khác giá trị cũ; quy tắc quyết định đường đi, không cần chọn lại kết quả.',
    events: [
      event('input', 'Input phát onChange', 'Thao tác', 1, 0, [form('inputProps', '02-inputs')], 'key và event.target.value; draft của render hiện tại.', 'Tạo next = { ...draft, [key]: value } → updateDraft(next).', 'Tám trường cùng điểm vào; không tự gọi calculate/save.', ui('origin', '$field', 'Tự sửa trường đang chọn. Để có phí trước thao tác: Điền mẫu → Tính phí trước, rồi mới sửa.'), 'start'),
      event('draft', 'updateDraft nhận next', 'Gọi hàm', 1, 1, [form('updateDraft', '02-inputs')], 'draft cũ và next.', 'Trước 06 chỉ cập nhật draft; từ 06 so đầu vào phí.', 'Đường đi theo source checkpoint.'),
      event('compare', 'Đầu vào tính phí có đổi?', 'Nhánh', 1, 2, [rule('pricingInputsChanged', '06-rules'), form('updateDraft', '06')], 'previous và next QuotationDraft.', 'So sumInsured, startDate, endDate bằng !==.', 'Chỉ ba trường này ảnh hưởng phí; không kiểm tra tên/liên hệ.'),
      event('invalidate', 'setPremium(null)', 'State', 0, 3, [form('updateDraft', '06')], 'pricingInputsChanged = true.', 'Xóa premium, giữ calculatedBefore.', 'Đã tính trước → stale; chưa từng tính → vẫn chưa có phí.'),
      event('keep', 'Giữ premium hiện tại', 'State', 2, 3, [form('updateDraft', '06')], 'pricingInputsChanged = false.', 'Không gọi setPremium.', 'Có phí → giữ phí; chưa có → tiếp tục null.'),
      event('update', 'Cập nhật draft và phản hồi', 'State', 1, 4, [form('updateDraft', '02-inputs'), form('inputProps', '02-inputs')], 'next và lỗi cũ.', 'setDraft(next); xóa message/notice; từ 04 xóa lỗi của trường đang sửa.', 'onBlur là tương tác riêng gọi validateDraft; không tự tính lại.'),
      event('render', 'Render giá trị và trạng thái phí', 'Render', 1, 5, [form('CreateQuotation.inputProps.read', '02-inputs')], 'draft mới; premium/calculatedBefore nếu đã có.', 'Input hiển thị draft mới. Từ 06: sửa tiền/ngày sau tính → Cần tính lại phí; sửa tên giữ phí.', 'Trước 06 chưa có mất hiệu lực. Từ 09 guard !premium chặn gửi khi cần tính lại.', ui('result', '$editResult', 'So sánh sửa Tên khách hàng và Số tiền bảo hiểm sau tính phí ở mốc 06 trở đi.'), 'end'),
    ],
    edges: [edge('input', 'draft'), edge('draft', 'compare', 'Từ 06: có quy tắc'), edge('draft', 'update', 'Trước 06: chỉ cập nhật'), edge('compare', 'invalidate', 'Ảnh hưởng phí'), edge('compare', 'keep', 'Không ảnh hưởng phí'), edge('invalidate', 'update'), edge('keep', 'update'), edge('update', 'render')],
  },
  {
    id: 'calculate', title: 'Tính phí', premise: 'Cùng ý định và đoạn kiểm tra rồi rẽ nhánh. Chưa chọn dữ liệu minh họa thì dừng ở validation để chọn tình huống.',
    events: [
      event('calculate', 'Bấm Tính phí → calculate', 'Thao tác', 1, 0, [form('calculate', '04')], 'Draft hiện tại.', 'Gọi validatedInput().', 'Không có HTTP hay storage.', ui('origin', 'calculate', calculateTry), 'start'),
      event('validate', 'Kiểm tra và chuyển draft thành input', 'Nhánh', 1, 1, validation, 'QuotationDraft gồm chuỗi.', 'validateAndBuildInput gọi validateDraft, trim chuỗi, Number(sumInsured).', 'Có lỗi → null; hợp lệ → result.data. Sửa sau lỗi là tương tác tiếp theo, không phải callback validation.'),
      event('stop', 'Có lỗi: errors/message rồi return', 'State', 0, 2, [form('validatedInput', '04'), form('calculate', '04')], 'success = false.', 'setErrors, setMessage; đăng ký requestAnimationFrame focus; calculate return.', 'Không tính phí, không tự xóa premium đang có.'),
      event('invalid-render', 'Hiện lỗi và focus trường sai', 'Render', 0, 3, [form('inputProps', '04'), form('Field', '03-fields'), form('validatedInput', '04')], 'errors/message và formRef.', 'Field hiện lỗi; aria-invalid; callback tìm trường lỗi đầu tiên để focus.', 'Kết thúc lần tính. Người học tự sửa rồi bấm Tính phí lần mới.', ui('result', 'validationErrors', 'Để trống Tên khách hàng rồi tự bấm Tính phí. Chỉ highlight nếu lỗi thực đang tồn tại.'), 'end'),
      event('premium', 'calculatePremium trả Premium', 'Gọi hàm', 2, 2, [rule('calculatePremium', '05-rules'), rule('calendarDays', '04-rules'), form('calculate', '05')], 'Số tiền number và hai ngày từ input hợp lệ.', 'days; net = round(sum × 0.001 × days / 365); tax = round(net × 0.1); total = net + tax.', 'Helper có guard RangeError; calculate không catch. Input qua validation hợp lệ không vào guard này.'),
      event('range-error', 'Guard helper: RangeError', 'Gọi hàm', 3, 3, [rule('calculatePremium', '05-rules')], 'Gọi trực tiếp helper với đầu vào sai.', 'Ném RangeError.', 'Không có UI phục hồi/try-catch trong calculate; đây là guard phòng vệ của helper.', internal, 'end'),
      event('state', 'Đưa Premium vào state', 'State', 2, 3, [form('calculate', '05')], 'Premium vừa trả về.', 'setPremium(result), setCalculatedBefore(true), setNotice.', 'Không gọi trực tiếp PremiumSummary.'),
      event('render', 'Render kết quả phí', 'Render', 2, 4, [form('CreateQuotation.jsx.premiumAside', '05'), summary], 'premium khác null; stale = calculatedBefore && !premium.', 'PremiumSummary nhận props và formatMoney để hiển thị.', '1 tỷ / 365 ngày → 1.100.000 VND; component không tính lại công thức.', ui('result', 'premiumResult', 'Điền dữ liệu mẫu rồi tự bấm Tính phí ở mốc 05 trở đi. Vùng phí trống không phải kết quả đã tính.'), 'end'),
    ],
    edges: [edge('calculate', 'validate'), edge('validate', 'stop', 'Có lỗi'), edge('validate', 'premium', 'Dữ liệu hợp lệ'), edge('stop', 'invalid-render'), edge('premium', 'state', 'Đầu vào qua validation'), edge('premium', 'range-error', 'Gọi helper sai: RangeError'), edge('state', 'render')],
  },
  {
    id: 'save', title: 'Lưu bản chào', premise: 'Submit/guard/gửi dùng chung. Lỗi có thể trước hoặc sau persistence; không cam kết rollback/idempotency. Retry do người học chủ động.',
    events: [
      event('submit', 'Submit → save', 'Thao tác', 1, 0, [form('CreateQuotation.onSubmit'), form('save')], 'Form hiện tại.', 'preventDefault; gọi save.', 'Nút có disabled; guard trong handler vẫn cần thiết.', ui('origin', 'save', saveTry), 'start'),
      event('guard', 'Guard trước khi gửi', 'Nhánh', 1, 1, [form('save'), ...validation], 'saveInFlight.current → validatedInput() → premium.', 'Đang gửi: return trước validation. Input sai: return. !premium: thông báo rồi return.', 'Hợp lệ, có phí và chưa gửi mới đi tiếp.'),
      event('busy', 'Bỏ lần submit lặp', 'State', 0, 2, [form('save')], 'saveInFlight.current = true.', 'return, không tạo request thứ hai.', 'Không reset ref request đang chạy.', ui('result', 'saving', 'Tự bấm Lưu với dữ liệu hợp lệ. Đang lưu chỉ tồn tại trong lúc chờ; nút đã bị khóa.'), 'end'),
      event('invalid', 'Input sai: hiện lỗi, dừng gửi', 'Render', 0, 3, [form('save'), ...validation], 'Validation thất bại.', 'errors/message; focus trường đầu tiên; save return.', 'Không gọi API.', ui('result', 'validationErrors', 'Sau khi có phí, xóa Tên khách hàng rồi tự bấm Lưu. Trường này không xóa phí từ mốc 06.'), 'end'),
      event('no-premium', 'Chưa có phí: dừng gửi', 'Render', 0, 4, [form('save')], 'Input hợp lệ nhưng premium = null.', 'setMessage yêu cầu tính phí hiện tại.', 'Nút Lưu vốn disabled khi !premium; guard bảo vệ lời gọi handler.', ui('result', 'save', 'Sửa tiền/ngày sau tính từ mốc 06: nút Lưu bị khóa. Không thể kích hoạt guard thông báo từ nút disabled.'), 'end'),
      event('pending', 'Khóa gửi lặp và chờ Promise', 'Async', 2, 2, [form('save'), form('CreateQuotation.disabled:{saving}')], 'Input hợp lệ, premium hiện tại.', 'saveInFlight.current=true; setSaving(true); setNotice(\'\'); await create(input).', 'Ref khóa ngay; UI khóa ở render kế tiếp.', ui('result', 'saving', saveTry)),
      event('post', 'API client gửi POST', 'Nhánh', 2, 3, [api('quotationsApi'), api('request')], 'QuotationInput, không gửi Premium.', 'fetch → JSON; timeout 12 giây.', 'Mạng/timeout/JSON response/HTTP lỗi đều reject. Timeout có thể đã lưu phía nhận.'),
      event('handler', 'Mock đọc JSON và kiểm tra contract', 'Nhánh', 2, 4, [handlers, rule('parseQuotationInput', '07-contract')], 'Body unknown; delay 650 ms.', 'request.json(); parseQuotationInput.', 'JSON sai → 400; contract sai → 422; hợp lệ → createQuotation.'),
      event('persist', 'Tính lại phí và persist', 'Nhánh', 2, 5, [store('createQuotation'), store('persist'), handlers], 'Input đã kiểm tra phía nhận.', 'Đọc danh sách, cấp UUID/số, tính lại Premium rồi persist; trả 201.', 'Đọc/tính/ghi throw → 500. Không có cam kết transaction rollback.'),
      event('response', 'Client xác minh response', 'Nhánh', 2, 6, [api('request'), api('requireQuotation'), rule('parseQuotation', '07-contract')], 'HTTP response/JSON sau xử lý phía nhận.', 'response.ok; requireQuotation → parseQuotation rồi resolve.', '2xx sai contract vẫn ApiError(502), dù có thể đã persist.'),
      event('failure', 'Promise reject về catch', 'Async', 4, 5, [form('CreateQuotation.save.quotationsApi.create'), api('request'), api('requireQuotation'), handlers], 'Một lỗi được chọn, không phải mọi lỗi cùng xảy ra.', 'await create ném lỗi về save.catch.', 'Không suy lỗi = chưa persist. Timeout/response sai cần kiểm tra danh sách trước khi gửi lại.'),
      event('catch', 'Giữ form và mở khóa', 'State', 4, 6, [form('CreateQuotation.save.catch')], 'Error/ApiError.', 'setMessage; ApiError → setErrors; saveInFlight=false; setSaving(false).', 'Giữ draft/phí; không navigate.'),
      event('retry', 'Hiện lỗi, chờ lần bấm Lưu mới', 'Thao tác', 4, 7, [form('CreateQuotation.jsx.errorBox'), form('CreateQuotation.save.catch')], 'saving=false, form còn nguyên.', 'Người học kiểm tra/sửa rồi quyết định thử lại.', 'Không có tự retry. Vòng lặp là tương tác mới, phải chọn kết quả mới.', ui('result', 'saveError', saveTry)),
      event('navigate', 'Điều hướng tới ID đã xác minh', 'Async', 1, 7, [form('save')], 'quotation.id từ response hợp lệ.', 'navigate /quotations/:id với replace, state.created.', '09/10-list: state.receipt; từ 10: GET detail. Từ 11: allowLeave.current=true.'),
      event('receipt', 'Hiện biên nhận / GET chi tiết', 'Render', 1, 8, [{ file: 'pages/QuotationDetail.tsx', symbol: 'QuotationDetail', since: '09' }], '09/10-list: POST đã kiểm tra; từ 10: GET theo URL.', 'Hiện số/ID/phí; GET có loading/error riêng.', 'Biên nhận POST không chứng minh GET/reload đã được nối.', ui('result', 'savedResult', 'Tự lưu thành công. 09/10-list xem biên nhận POST; từ 10 mở/reload chi tiết để thử GET.'), 'end'),
    ],
    edges: [edge('submit', 'guard'), edge('guard', 'busy', 'Đang gửi'), edge('guard', 'invalid', 'Dữ liệu có lỗi'), edge('guard', 'no-premium', 'Phí chưa có / mất hiệu lực'), edge('guard', 'pending', 'Hợp lệ · có phí · chưa gửi'), edge('pending', 'post'), edge('post', 'handler', 'Request tới mock'), edge('post', 'failure', 'Request thất bại / chưa xác nhận'), edge('handler', 'persist', 'JSON và contract hợp lệ'), edge('handler', 'failure', 'JSON sai 400 / input sai 422'), edge('persist', 'response', 'Persist xong · response 201'), edge('persist', 'failure', 'Đọc / tính / ghi throw → 500'), edge('response', 'navigate', 'Response thành công và hợp lệ'), edge('response', 'failure', 'HTTP / JSON / contract lỗi'), edge('failure', 'catch'), edge('catch', 'retry'), edge('retry', 'submit', 'Người dùng bấm Lưu lần mới', true), edge('navigate', 'receipt')],
  },
  {
    id: 'read', title: 'Đọc dữ liệu đã lưu', premise: 'GET list/detail có loading/error/attempt ở hai trang. Biên nhận POST mốc 09 chưa phải GET.',
    events: [
      event('load', 'Mở trang / thử lại GET', 'Thao tác', 1, 0, readSources, 'Danh sách hoặc URL có id.', 'Effect gọi list/get; loading=true, xóa lỗi.', 'Cleanup đặt active=false ngăn cập nhật trang đã rời.', ui('origin', 'readPage', 'Từ mốc 10: tự về Danh sách, mở một bản chào rồi reload chi tiết.'), 'start'),
      event('get', 'Client → GET mock → storage', 'Nhánh', 1, 1, [...readSources, api('request'), handlers, store('readQuotations')], 'GET list hoặc GET theo id.', 'Mock đọc/sort hoặc find; client kiểm tra contract.', 'Storage lỗi → 500; id không có → 404; mạng/response lỗi → reject.'),
      event('data', 'Hiện dữ liệu đã đọc', 'Render', 0, 2, readSources, 'Danh sách có dữ liệu / Quotation.', 'setQuotations/setQuotation; finally loading=false.', 'Phí từ bản đã lưu, không từ draft cũ.', ui('result', 'readData', 'Tự mở danh sách có dữ liệu hoặc một ID tồn tại.'), 'end'),
      event('empty', 'Danh sách rỗng', 'Render', 1, 2, [readSources[0]], 'GET list trả [].', 'Hiện Chưa có bản chào nào.', 'Không seed lại một danh sách rỗng đã lưu.', ui('result', 'emptyList', 'Chỉ có khi GET list thật trả []. Graph không xóa dữ liệu để tạo tình huống.'), 'end'),
      event('not-found', 'Không tìm thấy ID: 404', 'Render', 2, 2, [readSources[1]], 'ApiError.status=404.', 'setError và setNotFound(true).', 'Có thể bản chào ở browser/origin khác.', ui('result', 'detailNotFound', 'Tự mở preview riêng và nhập URL chi tiết với ID không tồn tại.')),
      event('error', 'Hiện lỗi tải dữ liệu', 'Render', 3, 2, readSources, 'Promise reject.', 'AsyncMessage lỗi, loading=false.', 'Không dựng dữ liệu thay thế.', ui('result', 'readError', 'Có thể tự chặn GET bằng DevTools để thử lỗi mạng; graph không gửi request/bật lỗi.')),
      event('retry', 'Người dùng bấm Thử lại', 'Thao tác', 2, 3, readSources, 'Nút retry của AsyncMessage.', 'setAttempt(attempt+1); effect chạy lại.', 'Tương tác mới, không tự retry.', ui('origin', 'readRetry', 'Khi lỗi thật đang hiển thị, tự bấm Thử lại.')),
    ],
    edges: [edge('load', 'get'), edge('get', 'data', 'Response hợp lệ · có dữ liệu'), edge('get', 'empty', 'GET list trả []'), edge('get', 'not-found', 'GET detail trả 404'), edge('get', 'error', 'Request / storage / response lỗi'), edge('not-found', 'retry'), edge('error', 'retry'), edge('retry', 'load', 'Bấm Thử lại: attempt mới', true)],
  },
  {
    id: 'leave', title: 'Rời form', premise: 'Đổi route dùng blocker/dialog. Reload/đóng tab dùng beforeunload và prompt của browser; không phải cùng dialog DOM.',
    events: [
      event('leave', 'Người dùng rời form', 'Thao tác', 1, 0, [form('CreateQuotation.blocker', '11')], 'Đổi route, reload hoặc đóng tab.', 'Đọc dirty và allowLeave.current.', 'dirty là có chuỗi khác rỗng, không phải so bản đã lưu.', ui('origin', 'cancel', 'Mốc 11: nhập tên rồi tự bấm Hủy/Về danh sách.'), 'start'),
      event('guard', 'Điều kiện và kiểu rời trang', 'Nhánh', 1, 1, [form('CreateQuotation.blocker', '11'), form('CreateQuotation.dirty', '11')], 'dirty && !allowLeave.current.', 'Đổi route: blocker; reload: beforeunload effect.', 'Sau lưu allowLeave=true cho navigate đi qua.'),
      event('direct', 'Đi thẳng theo điều hướng', 'Async', 0, 2, [form('CreateQuotation.blocker', '11')], '!dirty hoặc allowLeave.current.', 'Không bị giữ lại.', 'Không tự lưu draft.', internal, 'end'),
      event('dialog', 'Dialog Bỏ dữ liệu chưa lưu?', 'Nhánh', 1, 2, [form('CreateQuotation.jsx.discard-title', '11')], 'blocker.state=blocked.', 'Effect showModal, chờ người dùng.', 'Chọn graph không mở dialog.', ui('result', 'discardDialog', 'Nhập một trường rồi tự bấm Hủy; chỉ highlight dialog thật đang mở.')),
      event('stay', 'Tiếp tục nhập: reset()', 'Thao tác', 0, 3, [form('CreateQuotation.jsx.discard-title', '11')], 'Tiếp tục nhập / Escape.', 'Hủy điều hướng; giữ form.', 'Không tự lưu.', ui('origin', 'discardStay', 'Trong dialog thật, tự chọn Tiếp tục nhập.'), 'end'),
      event('discard', 'Bỏ dữ liệu: proceed()', 'Thao tác', 2, 3, [form('CreateQuotation.jsx.discard-title', '11')], 'Chọn Bỏ dữ liệu.', 'Tiếp tục điều hướng bị chặn.', 'Người học tự quyết định bỏ draft.', ui('origin', 'discardConfirm', 'Trong dialog thật, tự chọn Bỏ dữ liệu nếu muốn rời.'), 'end'),
      event('unload', 'beforeunload yêu cầu xác nhận', 'Async', 3, 2, [form('CreateQuotation.useEffect[1]', '11')], 'Reload/đóng tab khi dirty và chưa cho rời.', 'preventDefault và returnValue; cleanup gỡ listener.', 'Browser quyết định hiện prompt; không có DOM riêng để highlight.', internal, 'end'),
    ],
    edges: [edge('leave', 'guard'), edge('guard', 'direct', 'Form rỗng / đã cho phép rời'), edge('guard', 'dialog', 'Đổi route · có dữ liệu'), edge('guard', 'unload', 'Reload / đóng tab · có dữ liệu'), edge('dialog', 'stay', 'Tiếp tục nhập / Escape'), edge('dialog', 'discard', 'Xác nhận Bỏ dữ liệu')],
  },
]
export function flowSourceAvailable(cp: Checkpoint, source: FlowSource): boolean {
  const birth = checkpoints.find(item => item.id === source.since)
  return Boolean(birth && cp.order >= birth.order && findSymbol(cp.id, source.file, source.symbol))
}
export const eventAvailable = (cp: Checkpoint, item: RuntimeEvent) => item.sources.every(source => flowSourceAvailable(cp, source))
export const flowCheckpoint = (flow: RuntimeFlow) => checkpoints.find(cp => flow.events.every(item => eventAvailable(cp, item)))
export const outgoing = (flow: RuntimeFlow, id: string) => flow.edges.filter(item => item.from === id)

export function explainedEdge(flow: RuntimeFlow, id: string, s: FlowSelection, cp: Checkpoint): FlowEdge | undefined {
  const choices = outgoing(flow, id)
  if (choices.length === 1) return choices[0]
  let target: string | undefined
  if (flow.id === 'input-edit') {
    if (id === 'draft') target = cp.order >= (checkpoints.find(item => item.id === '06')?.order ?? Infinity) ? 'compare' : 'update'
    if (id === 'compare') target = ['sumInsured', 'startDate', 'endDate'].includes(s.runtimeField) ? 'invalidate' : 'keep'
  }
  if (flow.id === 'calculate') {
    if (id === 'validate') target = s.runtimeScenario === 'valid' ? 'premium' : s.runtimeScenario === 'invalid' ? 'stop' : undefined
    if (id === 'premium') target = 'state'
  }
  if (flow.id === 'save') {
    const scenario = s.runtimeScenario
    if (id === 'guard' && scenario !== 'choose') target = scenario === 'invalid' ? 'invalid' : scenario === 'no-premium' ? 'no-premium' : scenario === 'busy' ? 'busy' : 'pending'
    if (!s.runtimePath.split(',').includes('retry') && ['success', 'request-error'].includes(scenario)) {
      if (id === 'post') target = scenario === 'request-error' ? 'failure' : 'handler'
      if (id === 'handler') target = 'persist'
      if (id === 'persist') target = 'response'
      if (id === 'response') target = 'navigate'
    }
  }
  return choices.find(item => item.to === target)
}

export function normalizeFlow(raw: Partial<FlowSelection>): FlowSelection {
  const aliases: Record<string, [string, string]> = { 'calculate-success': ['calculate', 'valid'], 'calculate-invalid': ['calculate', 'invalid'], 'save-success': ['save', 'success'], 'save-error': ['save', 'request-error'], 'edit-after-calculation': ['input-edit', 'edit-priced'] }
  const alias = aliases[raw.runtimeFlow ?? '']
  const flow = runtimeFlows.find(item => item.id === (alias?.[0] ?? raw.runtimeFlow)) ?? runtimeFlows[0]
  const scenario = alias?.[1] ?? raw.runtimeScenario ?? 'choose'
  const requested = raw.runtimeEvent ?? flow.events[0].id
  const mapped = flow.id === 'calculate' && alias?.[1] === 'invalid' && requested === 'render' ? 'invalid-render' : requested
  const selected = flow.events.find(item => item.id === mapped)?.id ?? flow.events[0].id
  const path: string[] = []
  for (const id of (raw.runtimePath ?? '').split(',').slice(0, 120)) {
    if (!flow.events.some(item => item.id === id) || (path.length && !flow.edges.some(item => item.from === path.at(-1) && item.to === id))) break
    path.push(id)
  }
  const allowed = flow.id === 'calculate' ? ['choose', 'valid', 'invalid'] : flow.id === 'save' ? ['choose', 'success', 'request-error', 'no-premium', 'busy', 'invalid'] : ['choose', 'edit-priced']
  const at = path.lastIndexOf(selected)
  return { overviewMode: raw.overviewMode ?? 'structure', runtimeFlow: flow.id, runtimeEvent: selected, runtimeScenario: allowed.includes(scenario) ? scenario : 'choose', runtimeField: ['customerName', 'phone', 'email', 'assetName', 'address', 'sumInsured', 'startDate', 'endDate'].includes(raw.runtimeField ?? '') ? raw.runtimeField! : alias?.[1] === 'edit-priced' ? 'sumInsured' : 'customerName', runtimeHadPremium: alias?.[1] === 'edit-priced' || raw.runtimeHadPremium === true, runtimePath: at >= 0 ? path.slice(0, at + 1).join(',') : selected }
}

