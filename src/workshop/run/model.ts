import { checkpoints } from '../catalog'
import type { Checkpoint } from '../catalog'
import { findSymbol } from '../source'
import { milestonesFor } from '../milestones'

export type RunMode = 'demo' | 'guided'
export type Scenario = 'field' | 'input' | 'validation' | 'calculate' | 'invalidate' | 'save' | 'save-retry'
export type TaskKind = 'observe' | 'back-products' | 'inspect' | 'input' | 'fill' | 'invalid' | 'calculate' | 'edit' | 'arm-error' | 'save' | 'save-error' | 'retry' | 'product-info' | 'switch-product' | 'return-product' | 'cancel-product' | 'inspect-catalog' | 'set-period' | 'set-amount' | 'inspect-save-lock' | 'open-product' | 'reopen' | 'reload-record' | 'legacy-record'
export interface SourceLink { file: string; symbol: string }
export interface RunTask {
  id: string; kind: TaskKind; title: string; instruction: string; target: string; resultTarget: string
  sources: SourceLink[]; explanation: string; count?: number; manual?: boolean
  preservePremium?: boolean; value?: string; days?: number; expected?: 'valid' | 'invalid'; expectedField?: string; expectedTotal?: number
}
export interface RunPlan { journey?: StepJourney; scenario: Scenario | 'step' | 'product-switch' | 'a-save' | 'b-save' | 'switch' | 'retry-save' | 'legacy-read' | 'select-product'; title: string; checkpoint: Checkpoint; supported: boolean; reason: string; tasks: RunTask[]; entry?: string }
export interface RunRecord {
  id: string; session: string; order: number; at: number; step: number; action: string
  kind: 'dom' | 'ui' | 'request' | 'response' | 'diagnostic'; title: string; detail: string
  sources: SourceLink[]; ui: string; flow?: string; event?: string; path?: string[]
  explanation: string
}
export const scenarioNames: Record<Scenario, string> = { field: 'Field ở mốc hiện tại', input: 'Nhập một trường', validation: 'Tính phí · dữ liệu có lỗi', calculate: 'Điền mẫu và tính phí', invalidate: 'Sửa sau tính phí', save: 'Lưu thành công', 'save-retry': 'Lưu lỗi một lần và tự thử lại' }
export const scenarioIds = Object.keys(scenarioNames) as Scenario[]
const form = (symbol: string): SourceLink => ({ file: 'pages/CreateQuotation.tsx', symbol })
const rule = (symbol: string): SourceLink => ({ file: 'quotation/rules.ts', symbol })
const task = (kind: TaskKind, title: string, instruction: string, target: string, sources: SourceLink[], explanation: string, resultTarget = target): RunTask => ({ id: kind, kind, title, instruction, target, resultTarget, sources, explanation })
export function defaultScenario(step: number, checkpoint: Checkpoint): Scenario {
  return milestonesFor(1, 2).some(mark => mark.id === checkpoint.id) ? 'field' : step === 2 ? 'input' : step === 4 ? 'invalidate' : step >= 5 ? 'save-retry' : checkpoint.id === '04' ? 'validation' : 'calculate'
}
export function runPlan(checkpoint: Checkpoint, scenario: Scenario): RunPlan {
  const minimum: Record<Scenario, string> = { field: '01-field-contract', input: '02-inputs', validation: '04', calculate: '05', invalidate: '06', save: '09', 'save-retry': '09' }
  const mark = milestonesFor(1, 2).find(mark => mark.id === checkpoint.id)
  const required: Record<Scenario, SourceLink[]> = {
    field: [form(mark?.symbol ?? 'Field')], input: [form('inputProps'), form('updateDraft')], validation: [form('validatedInput'), form('calculate'), rule('validateAndBuildInput')],
    calculate: [form('calculate'), rule('calculatePremium'), { file: 'components/PremiumSummary.tsx', symbol: 'PremiumSummary' }],
    invalidate: [form('updateDraft'), rule('pricingInputsChanged')], save: [form('save'), { file: 'api/quotations.ts', symbol: 'quotationsApi' }],
    'save-retry': [form('save'), { file: 'api/quotations.ts', symbol: 'quotationsApi' }],
  }
  const supported = checkpoint.order >= checkpoints.find(cp => cp.id === minimum[scenario])!.order && required[scenario].every(source => findSymbol(checkpoint.id, source.file, source.symbol)) && (scenario !== 'field' || Boolean(mark))
  const reason = supported ? `Phiên dữ liệu riêng tại mốc ${checkpoint.id}. Không đổi dữ liệu review hoặc tiến độ.` : `Mốc ${checkpoint.id} chưa hỗ trợ kịch bản này${scenario === 'field' ? '; chọn một mốc Field A–F' : `; cần mốc ${minimum[scenario]} trở đi và đủ mapping source`}. Không tự đổi checkpoint hoặc xác nhận thành công.`
  const fill = task('fill', 'Điền dữ liệu mẫu', 'Bấm Điền dữ liệu mẫu; quan sát các giá trị xuất hiện.', 'fill', [form('updateDraft'), { file: 'quotation/types.ts', symbol: 'sampleDraft' }], 'sampleDraft → updateDraft → các input đọc draft. Quan hệ này là diễn giải từ source; bằng chứng là nút bấm và giá trị DOM.', 'customer')
  const calculate = task('calculate', 'Tính phí từ dữ liệu đang có', 'Bấm Tính phí; chờ vùng phí hiển thị kết quả thực.', 'calculate', required.calculate, 'Theo source: validateAndBuildInput → calculatePremium → setter → PremiumSummary/formatMoney. Không đo lời gọi hàm hoặc React state. Công thức: net=round(sum×0.001×days/365), tax=round(net×0.1).', 'premium')
  const save = task('save', 'Lưu bản chào', 'Bấm Lưu bản chào; chờ response và trang kết quả.', 'save', required.save, 'POST/response là bằng chứng MSW. Kiểm tra contract, persistence và navigate bên trong là diễn giải source; UI kết quả được quan sát riêng.', 'saved')
  let tasks: RunTask[] = []
  if (scenario === 'field' && mark) {
    const index = milestonesFor(1, 2).indexOf(mark), count = [0, 1, 1, 3, 6, 8][index]
    const target = mark.preview ?? 'root'
    tasks = [{ ...task('inspect', mark.title, index ? 'Quan sát nhãn/input và nhóm UI của đúng mốc. Các input chỉ đọc; chưa nối state, không trình diễn nhập liệu.' : 'Quan sát scaffold chưa có input. FieldProps là contract TypeScript; không có sự kiện runtime để chạy.', target, [form(mark.symbol), form('CreateQuotation')], mark.change), count }]
    if (index) tasks.push({ ...task('inspect', 'Một định nghĩa Field, các nơi sử dụng', 'Đối chiếu nhãn gắn với input và code Field; không thay value của input chỉ đọc.', target, [form(findSymbol(checkpoint.id, 'pages/CreateQuotation.tsx', 'Field.render') ? 'Field.render' : 'Field')], 'Định nghĩa nhận label/children/id. Các nơi dùng truyền props vào cùng Field; quan hệ nội bộ là diễn giải từ source.'), count })
  }
  if (scenario === 'input') tasks = [task('input', 'Nhập Tên khách hàng', 'Nhập một tên khác rỗng vào Tên khách hàng; chờ giá trị hiển thị sau tương tác.', 'customerName', required.input, 'inputProps.onChange → updateDraft → draft. Chỉ ghi nhận input DOM và giá trị sau cập nhật; không tuyên bố đã đọc React state.')]
  if (scenario === 'validation') tasks = [task('invalid', 'Thử Tính phí với form rỗng', 'Giữ form rỗng và bấm Tính phí; quan sát lỗi cạnh input.', 'calculate', required.validation, 'UI có lỗi quyết định nhánh Có lỗi. validatedInput/setErrors/return là diễn giải từ source, không phải các sự kiện đã được đo.', 'validationErrors')]
  if (scenario === 'calculate') tasks = [fill, calculate]
  if (scenario === 'invalidate') tasks = [fill, calculate, task('edit', 'Đổi Số tiền bảo hiểm', 'Đổi Số tiền bảo hiểm sang 2000000000; phí cũ phải hết hiệu lực và Lưu bị khóa.', 'sumInsured', required.invalidate, 'pricingInputsChanged so tiền/ngày; updateDraft có setPremium(null). Đã quan sát vùng Cần tính lại phí và disabled của Lưu, không đo setter.', 'premium'), calculate]
  if (scenario === 'save') tasks = [fill, calculate, save]
  if (scenario === 'save-retry') tasks = [fill, calculate, task('arm-error', 'Bật lỗi mock một lần', 'Bấm Gây lỗi lần lưu kế tiếp trong công cụ workshop của phiên riêng.', 'armError', [{ file: '_workshop/tools.ts', symbol: 'mountTools' }], 'Công cụ cài một handler MSW once; không sửa dữ liệu form hoặc source sản phẩm.', 'toolStatus'), { ...save, kind: 'save-error', title: 'Lưu và quan sát lỗi', instruction: 'Bấm Lưu bản chào; chờ HTTP 500, lỗi trên form và dữ liệu được giữ.', resultTarget: 'saveError' }, { ...save, kind: 'retry', manual: true, title: 'Bạn chủ động thử lại', instruction: 'Kiểm tra tên/phí còn nguyên, rồi tự bấm Lưu bản chào lần nữa. Phiên mẫu cũng không tự gửi lại POST.' }]
  tasks = tasks.map((item, index) => ({ ...item, id: `${index}-${item.kind}`, sources: item.sources.filter(source => findSymbol(checkpoint.id, source.file, source.symbol)) }))
  return { scenario, title: scenarioNames[scenario], checkpoint, supported, reason, tasks }
}

// Paths explain the observed outcome. Only entries with direct DOM/network
// evidence become records; intermediate state/validation/render calls do not.
export function outcomeFlow(kind: TaskKind, result: 'valid' | 'invalid' | 'stale' | 'saved' | 'error', checkpoint: Checkpoint) {
  if (kind === 'invalid' || kind === 'calculate') return { flow: 'calculate', event: result === 'invalid' ? 'invalid-render' : 'render', path: result === 'invalid' ? ['calculate', 'validate', 'stop', 'invalid-render'] : ['calculate', 'validate', 'premium', 'state', 'render'] }
  if (kind === 'input' || kind === 'edit') return { flow: 'input-edit', event: 'render', path: checkpoint.order >= checkpoints.find(cp => cp.id === '06')!.order ? ['input','draft','compare', result === 'stale' ? 'invalidate' : 'keep','update','render'] : ['input','draft','update','render'] }
  if (['save','save-error','retry'].includes(kind)) return { flow: 'save', event: result === 'error' ? 'retry' : 'receipt', path: result === 'error' ? ['submit','guard','pending','post','failure','catch','retry'] : ['submit','guard','pending','post','handler','persist','response','navigate','receipt'] }
}

/** Authored journeys are data consumed by the same driver as sub-step runs. */
export interface LearningLink extends SourceLink {
  checkpoint: string; step: number; sub: number; mark?: string; title: string
  foundation?: boolean
}
export interface JourneySegment {
  id: string; title: string; taskIds: string[]; observation: string
  builtAt: LearningLink[]; flow?: string; capabilities: string[]
}
export interface StepJourney {
  stage: number; revision: string; step: number; title: string
  outputCheckpoint: string; variant: string; initial: string; observe: string
  capabilities: string[]; segments: JourneySegment[]; summary: string
}
