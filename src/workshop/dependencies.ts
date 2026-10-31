import { checkpoints, selectionForCheckpoint } from './catalog'
import type { Checkpoint } from './catalog'
import { findSymbol } from './source'
import type { FlowSource } from './runtime-flows'

export interface DependencyNode extends FlowSource { id: string; title: string; role: string; alternatives?: string[] }
export type Relation = 'Gọi' | 'Đọc' | 'Cập nhật state' | 'Truyền props' | 'Truyền callback' | 'Ghép component' | 'Phụ thuộc type' | 'Import'
export interface DependencyEdge { from: string; to: string; kind: Relation; note?: string }
const f = 'pages/CreateQuotation.tsx', r = 'quotation/rules.ts', t = 'quotation/types.ts'
function node(id: string, title: string, file: string, symbol: string, since: string, role: string, alternatives?: string[]): DependencyNode { return { id, title, file, symbol, since, role, alternatives } }
export const dependencyNodes = [
  node('start', 'Khởi động ứng dụng', 'main.tsx', 'start', '00', 'Chờ worker trước khi render router.'),
  node('worker', 'Mock worker được cung cấp', 'mocks/browser.ts', 'worker', '00', 'MSW nhận handler của checkpoint, không phân tích repository.'),
  node('router', 'Bảng route', 'App.tsx', 'router', '00', 'Gắn URL với CreateQuotation/list/detail; scaffold.'),
  node('layout', 'Khung ứng dụng', 'App.tsx', 'Layout', '00', 'Layout và Outlet; bước 1 đổi nhãn để thử HMR.'),
  node('page', 'Màn hình tạo', f, 'CreateQuotation', '00', 'Sở hữu phần ghép giao diện; checkpoint 00 chỉ là scaffold.'),
  node('field-contract', 'Contract Field dùng lại', f, 'FieldProps', '01-field-contract', 'id/label/children; về sau type inline ở tham số Field.', ['Field.contract']),
  node('field', 'Vỏ trình bày một trường', f, 'Field', '01-field-example', 'Label, children; bổ sung optional/hint/error theo từng mốc.'),
  node('field-use', 'Nơi dùng Field tại mốc', f, 'CreateQuotation.field.customerName', '01-field-example', 'Props và children tại nơi dùng; ví dụ chỉ đọc ở B, trường thật từ C, tiếp tục A–F.', ['CreateQuotation.field.fieldExample']),
  node('draft-type', 'Contract chuỗi đang nhập', t, 'QuotationDraft', '02', 'Tám trường string; không đồng nhất với input gửi API.'),
  node('input-type', 'Contract input nghiệp vụ', t, 'QuotationInput', '02', 'customer/asset/period; sumInsured là number.'),
  node('premium-type', 'Contract kết quả phí', t, 'Premium', '02', 'days/net/tax/total và installmentAmount.'),
  node('errors-type', 'Contract lỗi validation', t, 'FieldErrors', '02', 'Lỗi theo key draft; dùng chung UI và validation.'),
  node('validation-type', 'Kết quả hợp lệ hoặc lỗi', t, 'ValidationResult', '02', 'Discriminated union success/data hoặc errors/message.'),
  node('quotation-type', 'Contract bản chào đã lưu', t, 'Quotation', '02', 'Input + ID/số/trạng thái/thời điểm/phí; không phải draft.'),
  node('draft', 'State dữ liệu nhập', f, 'CreateQuotation.draft', '02-draft', 'draft/setDraft thuộc CreateQuotation.'),
  node('input', 'Props và callback nhập', f, 'inputProps', '02-inputs', 'Đọc draft[key], onChange gọi updateDraft; từ 04 có validation blur.'),
  node('update', 'Cập nhật draft', f, 'updateDraft', '02-inputs', 'setDraft; xóa phản hồi. Từ 06 gọi pricingInputsChanged và có thể xóa phí.'),
  node('sample', 'Dữ liệu minh họa', t, 'sampleDraft', '02', 'Tạo một draft mẫu; nút Điền mẫu chỉ nối ở 03.'),
  node('sample-use', 'Nút Điền mẫu', f, 'CreateQuotation.jsx.sampleCard', '03', 'updateDraft(sampleDraft()); xóa lỗi và đặt notice.'),
  node('button', 'Nút / callback Tính phí', f, 'CreateQuotation.action.calculate', '04', 'onClick={calculate}; node là đúng nút, không phải cả actionBar.'),
  node('calculate', 'Handler tính phí', f, 'calculate', '04', 'Từ 04 nối kiểm tra; từ 05 ghép validatedInput, công thức và state.'),
  node('validated', 'Chặn lỗi, lấy input hợp lệ', f, 'validatedInput', '04', 'Đọc draft → validateAndBuildInput; errors/message, rAF focus hoặc trả input.'),
  node('build', 'Validation và chuyển đổi', r, 'validateAndBuildInput', '04-rules', 'Gọi validateDraft; trim và Number(sumInsured) nằm ngay trong hàm, không có helper chuyển đổi riêng.'),
  node('validate', 'Quy tắc kiểm tra draft', r, 'validateDraft', '04-rules', 'Tên/liên hệ/tài sản/số tiền và thời hạn; trả FieldErrors.'),
  node('days', 'Số ngày lịch', r, 'calendarDays', '04-rules', 'Hai lần calendarDay, trừ ngày UTC.'),
  node('day', 'Đọc một ngày lịch', r, 'calendarDay', '04-rules', 'Kiểm tra định dạng/ngày tồn tại; UTC nửa đêm, tránh DST.'),
  node('minimum', 'Giới hạn tiền tối thiểu', r, 'MIN_SUM_INSURED', '04-rules', '1.000.000 VND; validation và pricing cùng đọc.'),
  node('maximum', 'Giới hạn tiền tối đa', r, 'MAX_SUM_INSURED', '04-rules', '100.000.000.000 VND; validation và pricing cùng đọc.'),
  node('price', 'Công thức tính phí', r, 'calculatePremium', '05-rules', 'Hàm thuần trả Premium, có guard RangeError; không catch trong calculate.'),
  node('premium', 'State kết quả phí / setter', f, 'CreateQuotation.premium', '05', 'premium/setPremium được nối để nhận kết quả từ 05; trước đó premium chỉ null.'),
  node('calculated', 'Dấu đã từng tính / setter', f, 'CreateQuotation.calculatedBefore', '05', 'calculatedBefore/setCalculatedBefore; tạo props stale cùng premium.'),
  node('errors', 'State lỗi / setter', f, 'CreateQuotation.errors', '04', 'errors/setErrors dùng cho Field và aria-invalid.'),
  node('message', 'State thông báo lỗi', f, 'CreateQuotation.message', '02-inputs', 'message/setMessage; validation nối ở 04, lưu nối ở 09.'),
  node('notice', 'State phản hồi thường', f, 'CreateQuotation.notice', '03', 'notice/setNotice; tính thành công nối ở 05.'),
  node('form-ref', 'DOM ref của form', f, 'CreateQuotation.formRef', '04', 'validatedInput đọc formRef.current để focus sau rAF.'),
  node('props', 'Props truyền cho vùng phí', f, 'CreateQuotation.props.PremiumSummary', '03-summary', 'premium={premium}; stale={calculatedBefore && !premium}; không gọi tính phí khi render.'),
  node('summary', 'Trình bày phí', 'components/PremiumSummary.tsx', 'PremiumSummary', '03-summary', 'Nhận Premium/null/stale; hiển thị nhánh kết quả/chờ/cần tính lại.'),
  node('format', 'Định dạng tiền', 'quotation/format.ts', 'formatMoney', '00', 'Chỉ định dạng, không tính phí; scaffold được cung cấp.'),
  node('pricing-change', 'Quy tắc mất hiệu lực phí', r, 'pricingInputsChanged', '06-rules', 'So ba chuỗi tiền/ngày cũ–mới; không dùng tên/liên hệ.'),
  node('save', 'Handler lưu', f, 'save', '09', 'Guard → khóa → await API → navigate hoặc catch giữ form.'),
  node('submit', 'Submit form', f, 'CreateQuotation.onSubmit', '09', 'preventDefault và void save().'),
  node('saving', 'State chờ gửi', f, 'CreateQuotation.saving', '09', 'saving/setSaving khóa UI; khác ref khóa đồng bộ.'),
  node('lock', 'Ref khóa gửi lặp', f, 'CreateQuotation.saveInFlight', '09', 'Đọc/ghi đồng bộ trong save; catch mở khóa.'),
  node('client', 'Client API bản chào', 'api/quotations.ts', 'quotationsApi', '07-client', 'list/get/create; input nghiệp vụ, không gửi Premium.'),
  node('request', 'Fetch và xử lý lỗi', 'api/quotations.ts', 'request', '07-client', 'Timeout, HTTP, JSON unknown; ném ApiError.'),
  node('response', 'Kiểm tra response', 'api/quotations.ts', 'requireQuotation', '07-client', 'parseQuotation, dữ liệu sai → ApiError(502).'),
  node('mock', 'Mock HTTP handlers', 'mocks/handlers.ts', 'handlers', '08', 'GET list/detail; POST parse rồi gọi createQuotation.'),
  node('parse-input', 'Kiểm tra input ngoài', r, 'parseQuotationInput', '07-contract', 'Narrow unknown rồi kiểm tra nghiệp vụ.'),
  node('parse-output', 'Kiểm tra bản chào ngoài', r, 'parseQuotation', '07-contract', 'Kiểm tra ID/số/phí/contract response và storage.'),
  node('storage', 'Tạo bản chào có định danh', 'mocks/storage.ts', 'createQuotation', '08-storage', 'Đọc, cấp ID/số, tính lại phí rồi persist.'),
  node('persist', 'Ghi dữ liệu demo', 'mocks/storage.ts', 'persist', '08-storage', 'localStorage.setItem; lỗi ghi throw, không giả thành công.'),
  node('read', 'Đọc dữ liệu demo', 'mocks/storage.ts', 'readQuotations', '08-storage', 'Seed khi chưa có key; parse bản ghi; dữ liệu lỗi giữ nguyên.'),
  node('list', 'Trang danh sách GET', 'pages/QuotationList.tsx', 'QuotationList', '10-list', 'Effect GET list, loading/error/attempt; Link mang ID.'),
  node('detail', 'Trang chi tiết GET', 'pages/QuotationDetail.tsx', 'QuotationDetail', '10', 'GET theo useParams; loading/404/error/retry. 09 chỉ có biên nhận POST.'),
  node('async', 'Phản hồi bất đồng bộ', 'components/AsyncMessage.tsx', 'AsyncMessage', '00', 'Component scaffold; loading/error và nút retry do consumer truyền.'),
  node('dirty', 'Form có chuỗi đã nhập?', f, 'CreateQuotation.dirty', '11', 'Object.keys(emptyDraft).some(... !== \"\").'),
  node('allow', 'Ref cho phép rời', f, 'CreateQuotation.allowLeave', '11', 'save bật true sau response hợp lệ.'),
  node('blocker', 'Chặn đổi route', f, 'CreateQuotation.blocker', '11', 'useBlocker đọc dirty && !allowLeave.current.'),
  node('dialog', 'Dialog bỏ dữ liệu', f, 'CreateQuotation.jsx.discard-title', '11', 'reset/proceed khi blocked; Escape giữ form.'),
  node('unload', 'Bảo vệ reload / đóng tab', f, 'CreateQuotation.useEffect[1]', '11', 'Đăng ký/gỡ beforeunload; prompt do browser quản lý.'),
]
const e = (from: string, to: string, kind: Relation, note?: string): DependencyEdge => ({ from, to, kind, note })
export const dependencyEdges: DependencyEdge[] = [
  e('start','worker','Gọi'), e('start','router','Đọc'), e('router','layout','Ghép component'), e('router','page','Ghép component'),
  e('field','field-contract','Phụ thuộc type'), e('field-use','field','Truyền props'), e('page','field-use','Ghép component'),
  e('draft','draft-type','Phụ thuộc type'), e('input','draft','Đọc'), e('input','update','Gọi'), e('update','draft','Cập nhật state'), e('sample-use','sample','Gọi'), e('sample-use','update','Gọi'), e('field-use','input','Gọi','spread props cho input children'),
  e('button','calculate','Truyền callback','onClick={calculate}'), e('calculate','validated','Gọi'), e('validated','draft','Đọc'), e('validated','build','Gọi'), e('build','validate','Gọi'), e('build','input-type','Phụ thuộc type'), e('build','validation-type','Phụ thuộc type'), e('validate','errors-type','Phụ thuộc type'), e('validate','draft-type','Phụ thuộc type'), e('validate','days','Gọi'), e('validate','day','Gọi'), e('days','day','Gọi'), e('validate','minimum','Đọc'), e('validate','maximum','Đọc'),
  e('calculate','price','Gọi'), e('price','days','Gọi'), e('price','minimum','Đọc'), e('price','maximum','Đọc'), e('price','premium-type','Phụ thuộc type'), e('calculate','premium','Cập nhật state'), e('calculate','calculated','Cập nhật state'), e('calculate','notice','Cập nhật state'), e('validated','errors','Cập nhật state'), e('validated','message','Cập nhật state'), e('validated','form-ref','Đọc'), e('input','errors','Đọc'), e('field-use','errors','Đọc'), e('props','premium','Đọc'), e('props','calculated','Đọc'), e('props','summary','Truyền props'), e('summary','premium-type','Phụ thuộc type'), e('summary','format','Gọi'),
  e('update','pricing-change','Gọi'), e('pricing-change','draft-type','Phụ thuộc type'), e('update','premium','Cập nhật state'),
  e('submit','save','Gọi'), e('save','validated','Gọi'), e('save','premium','Đọc'), e('save','lock','Đọc'), e('save','lock','Cập nhật state','ref đổi đồng bộ'), e('save','saving','Cập nhật state'), e('save','client','Gọi'), e('client','request','Gọi'), e('client','response','Gọi'), e('response','parse-output','Gọi'), e('client','input-type','Phụ thuộc type'), e('client','quotation-type','Phụ thuộc type'), e('mock','parse-input','Gọi'), e('mock','storage','Gọi'), e('storage','read','Gọi'), e('storage','price','Gọi'), e('storage','persist','Gọi'), e('read','parse-output','Gọi'), e('worker','mock','Import','handlers'),
  e('list','client','Gọi'), e('detail','client','Gọi'), e('list','async','Truyền props'), e('detail','async','Truyền props'), e('detail','summary','Truyền props'), e('dirty','draft','Đọc'), e('blocker','dirty','Đọc'), e('blocker','allow','Đọc'), e('save','allow','Cập nhật state','ref'), e('dialog','blocker','Gọi','reset/proceed'), e('unload','dirty','Đọc'), e('unload','allow','Đọc'),
]
const stepNodes = [
  ['start','worker','router','layout','page'],
  ['start','worker','router','layout','page','field-contract','field','field-use'],
  ['draft-type','input-type','premium-type','quotation-type','errors-type','draft','input','update','field-use','field','sample','sample-use'],
  ['draft-type','input-type','premium-type','errors-type','validation-type','draft','button','calculate','validated','build','validate','days','day','minimum','maximum','price','premium','calculated','errors','message','notice','form-ref','props','summary','format','field-use','input'],
  ['input','draft','update','pricing-change','draft-type','premium','calculated','props','summary','save'],
  ['submit','save','validated','premium','saving','lock','input-type','quotation-type','client','request','response','parse-input','parse-output','mock','worker','storage','read','price','persist'],
  ['list','detail','client','request','response','async','summary','router','dirty','draft','allow','save','blocker','dialog','unload'],
]
const subFocus: Record<number, string[][]> = {
  3: [['build','validate','days','day','minimum','maximum','draft-type','input-type','errors-type','validation-type'], ['button','calculate','validated','build','draft','errors','message','form-ref','input'], ['price','days','day','minimum','maximum','premium-type'], ['props','summary','premium-type','format','premium','calculated'], stepNodes[3]],
  4: [['pricing-change','draft-type'], stepNodes[4]],
  5: [['input-type','quotation-type','parse-input','parse-output'], ['client','request','response','parse-output','input-type','quotation-type'], ['client','request','response'], ['storage','read','persist','price','parse-output'], ['mock','parse-input','storage','worker'], stepNodes[5], stepNodes[5]],
  6: [['list','client','async'], ['detail','client','async','summary'], ['dirty','draft','allow','blocker','dialog','unload','save']],
}
export function dependencyGraph(step: number, sub: number, scope: 'step' | 'current') {
  const ids = scope === 'current' ? subFocus[step]?.[sub] ?? stepNodes[step] : stepNodes[step]
  const selected = dependencyNodes.filter(item => ids.includes(item.id))
  return { nodes: selected, edges: dependencyEdges.filter(item => ids.includes(item.from) && ids.includes(item.to)) }
}
export function dependencySource(cp: Checkpoint, item: DependencyNode): FlowSource {
  return { ...item, symbol: [item.symbol, ...(item.alternatives ?? [])].find(symbol => findSymbol(cp.id, item.file, symbol)) ?? item.symbol }
}
export function dependencyBirth(item: DependencyNode) {
  const since = checkpoints.find(cp => cp.id === item.since)
  const cp = checkpoints.find(cp => since && cp.order >= since.order && findSymbol(cp.id, item.file, dependencySource(cp, item).symbol))
  return cp ? { checkpoint: cp, position: selectionForCheckpoint(cp.id) } : undefined
}

