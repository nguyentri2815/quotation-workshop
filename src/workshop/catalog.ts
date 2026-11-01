import manifest from '../../checkpoints/manifest.json'
import { lessons } from './steps'

export type ComponentId =
  | 'entry'
  | 'model'
  | 'catalog'
  | 'form'
  | 'validation'
  | 'pricing'
  | 'client'
  | 'mock'
  | 'storage'
  | 'read'
export interface SourceFile {
  path: string
  status: 'new' | 'modified' | 'unchanged'
  origin: string
  sha256: string
  first: string
  lastStep: number
  scaffold: boolean
  lines: number
}
export interface Checkpoint {
  id: string
  step: number
  order: number
  title: string
  ui: string
  kind: 'source' | 'ui'
  previous: string | null
  files: SourceFile[]
}
export const checkpoints: Checkpoint[] = manifest.checkpoints.map((cp) => ({
  ...cp,
  kind: cp.kind === 'source' ? 'source' : 'ui',
  files: cp.files.map((file) => ({
    ...file,
    status: file.status === 'new' ? 'new' : file.status === 'modified' ? 'modified' : 'unchanged',
  })),
}))
export const checkpointById = (id: string): Checkpoint =>
  checkpoints.find((cp) => cp.id === id) ?? checkpoints[0]
export const checkpointFor = (step: number, sub: number): Checkpoint =>
  checkpointById(manifest.substepCheckpoints[step]?.[sub] ?? '00')

export interface PartFile {
  path: string
  symbols: string[]
  reason: string
}
export interface Part {
  id: ComponentId
  title: string
  short: string
  birth: string
  step: number
  role: string
  input: string
  output: string
  files: PartFile[]
  needs: ComponentId[]
  tier: 'foundation' | 'parallel' | 'join'
  teaching: string
}
export const parts: Part[] = [
  {
    id: 'entry',
    title: 'Điểm vào & điều hướng',
    short: 'Entrypoint',
    birth: '00',
    step: 1,
    role: 'Chờ MSW sẵn sàng, render React và cung cấp router cho ba trang. Đây là scaffold có sẵn; bước 1 đổi tiêu đề để quan sát HMR.',
    input: 'HTML entrypoint, URL mang ID và sự kiện điều hướng.',
    output: 'Trang tạo / danh sách / chi tiết có đúng router context.',
    files: [
      { path: 'main.tsx', symbols: ['start'], reason: 'Tránh request chạy trước worker.' },
      {
        path: 'App.tsx',
        symbols: ['Layout', 'router'],
        reason: 'Layout và bảng route; không tính phí.',
      },
    ],
    needs: [],
    tier: 'foundation',
    teaching:
      'Cung cấp trước để mỗi phần nhỏ đều mở được. Đây là lựa chọn giảng dạy, không khẳng định sản phẩm được code file này đầu tiên.',
  },
  {
    id: 'model',
    title: 'Dữ liệu & contract',
    short: 'Types',
    birth: '02',
    step: 2,
    role: 'Phân biệt chuỗi đang nhập, dữ liệu nghiệp vụ gửi API, Premium và bản chào có định danh. Contract không phải state của form.',
    input: 'Phạm vi Normal / Tài sản cơ bản / VND và trường nghiệp vụ.',
    output: 'QuotationDraft, QuotationInput, Premium, Quotation và ValidationResult.',
    files: [
      {
        path: 'quotation/types.ts',
        symbols: [
          'QuotationDraft',
          'QuotationInput',
          'Premium',
          'Quotation',
          'emptyDraft',
          'sampleDraft',
        ],
        reason: 'Cả UI, rules và mock cùng hiểu hình dạng dữ liệu.',
      },
    ],
    needs: [],
    tier: 'foundation',
    teaching:
      'Thống nhất types trước khi các nhánh bắt đầu. Thêm types không sinh input hoặc request.',
  },
  {
    id: 'form',
    title: 'Form & state',
    short: 'React UI',
    birth: '01-field-contract',
    step: 1,
    role: 'Sở hữu draft và phản hồi của người dùng. updateDraft, calculate và save ghép các trách nhiệm theo từng bước; component không truy cập storage.',
    input: 'Ký tự gõ vào input, callback, Premium và lỗi API.',
    output: 'Draft mới, lỗi cạnh trường, thao tác tính phí / lưu / điều hướng.',
    files: [
      {
        path: 'pages/CreateQuotation.tsx',
        symbols: ['CreateQuotation', 'Field', 'inputProps', 'updateDraft', 'validatedInput', 'calculate', 'save'],
        reason: 'Điểm ghép state với rules và API.',
      },
      {
        path: 'components/PremiumSummary.tsx',
        symbols: ['PremiumSummary'],
        reason: 'Hiển thị kết quả; không tạo công thức thứ hai.',
      },
      { path: 'components/FixedInformation.tsx', symbols: ['FixedInformation'], reason: 'Phạm vi cố định được cung cấp trong scaffold.' },
      { path: 'components/Icon.tsx', symbols: ['Icon'], reason: 'Icon dùng chung từ scaffold.' },
      { path: 'quotation/format.ts', symbols: ['formatMoney'], reason: 'Định dạng tiền, ngày; không tính lại phí.' },
    ],
    needs: ['entry', 'model'],
    tier: 'parallel',
    teaching:
      'Dựng form tĩnh ở bước 1, nối draft ở bước 2; validation/phí ở bước 3, nhất quán ở bước 4, lưu ở bước 5, đọc lại và bảo vệ rời trang ở bước 6.',
  },
  {
    id: 'validation',
    title: 'Validation',
    short: 'Rules',
    birth: '04-rules',
    step: 3,
    role: 'Kiểm tra trường bắt buộc, giới hạn, định dạng và ngày lịch. Chuyển draft thành input hợp lệ; parser unknown bảo vệ ranh giới.',
    input: 'QuotationDraft hoặc JSON unknown.',
    output: 'FieldErrors / ValidationResult; Quotation đã được kiểm tra khi đọc response.',
    files: [
      {
        path: 'quotation/rules.ts',
        symbols: [
          'calendarDays',
          'validateDraft',
          'validateAndBuildInput',
          'parseQuotationInput',
          'parseQuotation',
        ],
        reason: 'Một quy tắc dùng cho UI và mock; UI tự quyết định trình bày lỗi.',
      },
    ],
    needs: ['model'],
    tier: 'foundation',
    teaching:
      'Viết rule trước khi nối nút. calendarDays trong cùng module còn được calculatePremium dùng; đây là phụ thuộc source cụ thể.',
  },
  {
    id: 'pricing',
    title: 'Tính phí & nhất quán',
    short: 'Pure function',
    birth: '05-rules',
    step: 3,
    role: 'Tính phí thuần và nhận biết ba đầu vào làm Premium mất hiệu lực. Không tự đổi draft và không tự persist.',
    input: 'Số tiền nguyên VND, hai ngày lịch; hai draft khi so thay đổi.',
    output: 'Premium với net / tax / total / một kỳ; boolean pricingInputsChanged.',
    files: [
      {
        path: 'quotation/rules.ts',
        symbols: ['calculatePremium', 'pricingInputsChanged', 'calendarDays'],
        reason: 'Công thức, làm tròn và điều kiện tính lại.',
      },
      {
        path: 'components/PremiumSummary.tsx',
        symbols: ['PremiumSummary'],
        reason: 'Trình bày Premium đã tính.',
      },
    ],
    needs: ['model', 'validation'],
    tier: 'foundation',
    teaching:
      'Cần calendarDays đã có. Hàm thuần và phần nhập liệu có thể phát triển độc lập sau khi thống nhất types; bài chọn thêm phí sau khi form đã đọc được.',
  },
  {
    id: 'client',
    title: 'API client',
    short: 'Fetch',
    birth: '07-client',
    step: 5,
    role: 'Sở hữu HTTP, JSON unknown, timeout và ApiError. Không coi response 422/500 hay timeout là tạo thành công.',
    input: 'QuotationInput hoặc ID từ URL.',
    output: 'Promise<Quotation>, danh sách hoặc ApiError đã phân loại.',
    files: [
      {
        path: 'api/quotations.ts',
        symbols: ['ApiError', 'request', 'requireQuotation', 'quotationsApi'],
        reason: 'Đặt fetch ở một ranh giới, không rải trong form.',
      },
      {
        path: '_workshop/tools.ts',
        symbols: ['probe'],
        reason: 'Công cụ riêng workshop: gửi contract mẫu để quan sát 501 → 201; không phải component sản phẩm.',
      },
    ],
    needs: ['model', 'validation', 'pricing'],
    tier: 'parallel',
    teaching:
      'Fetch có thể viết song song với storage sau khi thống nhất contract. Client hiện tại dùng parseQuotation, nên lúc ghép cần helpers và rule phí để kiểm tra response.',
  },
  {
    id: 'storage',
    title: 'Lưu trữ demo',
    short: 'Persistence',
    birth: '08-storage',
    step: 5,
    role: 'Đọc/ghi dữ liệu demo, seed đúng một lần, cấp UUID và số bản chào; giữ dữ liệu lỗi để người dùng xử lý.',
    input: 'Input đã hợp lệ, dữ liệu JSON trong namespace của checkpoint.',
    output: 'Quotation đã persist hoặc lỗi; danh sách [] vẫn được giữ rỗng.',
    files: [
      {
        path: 'mocks/storage.ts',
        symbols: ['STORAGE_KEY', 'readQuotations', 'createQuotation', 'persist'],
        reason: 'Chỉ lớp này truy cập localStorage của bản chào.',
      },
    ],
    needs: ['model', 'validation', 'pricing'],
    tier: 'parallel',
    teaching:
      'Không cần đợi UI submit. Cần parser khi đọc và calculatePremium khi tạo. Chưa có handler thì storage chưa được gọi qua HTTP.',
  },
  {
    id: 'mock',
    title: 'Mock API',
    short: 'MSW',
    birth: '08',
    step: 5,
    role: 'Đóng vai phía nhận: kiểm tra JSON, tính lại phí, gọi storage và trả response đúng status. Worker/handler 501 là scaffold từ bước 0.',
    input: 'GET / POST, body unknown, ID và cờ lỗi thử một lần.',
    output: '201 / 200, 422, 404 hoặc 500 có độ trễ.',
    files: [
      {
        path: 'mocks/handlers.ts',
        symbols: ['handlers', 'storageError'],
        reason: 'Không tin Premium client gửi.',
      },
      { path: 'mocks/browser.ts', symbols: ['worker'], reason: 'Đăng ký handler với MSW.' },
      {
        path: '_workshop/tools.ts',
        symbols: ['mountTools'],
        reason: 'Công cụ riêng workshop gắn handler lỗi once cho một POST; không phải source sản phẩm.',
      },
    ],
    needs: ['validation', 'storage'],
    tier: 'join',
    teaching:
      'Ghép shared rules với storage trước khi nối save của form. Đây là Backend giả lập, không phải khóa học Backend.',
  },
  {
    id: 'read',
    title: 'Danh sách & chi tiết',
    short: 'Read UI',
    birth: '10-list',
    step: 6,
    role: 'Đọc bản đã lưu qua API; URL giữ ID để reload không dựa vào state từ form. Hai trang scaffold ban đầu chưa đọc dữ liệu.',
    input: 'GET list / detail, URL và trạng thái tải.',
    output: 'Bảng, chi tiết, loading, lỗi, rỗng và đường điều hướng.',
    files: [
      {
        path: 'pages/QuotationList.tsx',
        symbols: ['QuotationList'],
        reason: 'List qua client; link bằng ID ổn định.',
      },
      {
        path: 'pages/QuotationDetail.tsx',
        symbols: ['QuotationDetail'],
        reason: 'GET theo useParams; reload vẫn đọc được.',
      },
      { path: 'components/AsyncMessage.tsx', symbols: ['AsyncMessage'], reason: 'Loading, lỗi và thử lại; scaffold có sẵn từ 00.' },
    ],
    needs: ['entry', 'client'],
    tier: 'join',
    teaching:
      'Có thể viết UI đọc sau contract, nhưng để kiểm chứng reload cần mock persist. Bài chọn ghép ở bước 6 sau khi đã có một bản chào lưu từ form.',
  },
]
export const partById = (id: ComponentId): Part => parts.find((part) => part.id === id) ?? parts[0]
export const consumersOf = (id: ComponentId): Part[] =>
  parts.filter((part) => part.needs.includes(id))
// Responsibility changes are narrower than file changes: several rules share rules.ts.
const responsibilityChanges: Record<ComponentId, string[]> = {
  catalog: [],
  entry: ['01'],
  model: ['02'],
  form: ['01-field-contract', '01-field-example', '01-field-first', '01-field-customer', '01-field-asset', '03-fields', '02-draft', '02-inputs', '03-summary', '03', '04', '05', '06', '09', '11'],
  validation: ['04-rules', '07-contract'],
  pricing: ['05-rules', '06-rules'],
  client: ['07-client', '07'],
  storage: ['08-storage'],
  mock: ['08'],
  read: ['10-list', '10'],
}
export function partStatus(part: Part, checkpoint: Checkpoint): 'future' | 'current' | 'existing' {
  if (checkpoint.order < checkpointById(part.birth).order) return 'future'
  return responsibilityChanges[part.id].some((id) => {
    const change = checkpointById(id)
    return change.step === checkpoint.step && change.order <= checkpoint.order
  })
    ? 'current'
    : 'existing'
}
export const statusText = {
  future: 'Bước sau',
  current: 'Thêm / sửa ở bước này',
  existing: 'Đã có tại checkpoint',
}
export const fileStatusText = { new: 'Mới', modified: 'Đã sửa', unchanged: 'Giữ nguyên' }
export function partForFile(path: string, step: number): Part {
  if (path === 'quotation/rules.ts')
    return partById(step === 4 ? 'pricing' : 'validation')
  return parts.find((part) => part.files.some((file) => file.path === path)) ?? partById('entry')
}
export function fileMeaning(path: string): string {
  if(path==='quotation/products.ts')return 'Contract/catalog sản phẩm demo, lookup và snapshot biểu phí.'
  if(path==='quotation/records.ts')return 'Parser lịch sử và adapter A gốc; không tái báo giá theo catalog hiện tại.'
  if(path==='pages/SelectProduct.tsx')return 'Điểm chọn sản phẩm và consumer mã từ URL trước khi mở form.'
  if (path === '_workshop/environment.ts')
    return 'Scaffold preview: chỉ tách namespace API, storage và Service Worker bằng vị trí entrypoint. Không dùng ID để bật/tắt nghiệp vụ.'
  if (path.endsWith('.css'))
    return 'Scaffold giao diện: token màu, typography và bố cục. Không chứa quy tắc nghiệp vụ.'
  if (path === 'index.html')
    return 'Entrypoint HTML riêng của checkpoint; tải chính main.tsx ở thư mục này.'
  return (
    parts.flatMap((part) => part.files).find((file) => file.path === path)?.reason ??
    'Scaffold chạy ứng dụng.'
  )
}
export function substepsFor(step: number) {
  return lessons[step].tasks.map((task, index) => {
    const file = task.file.startsWith('checkpoints/') ? task.file.split('/').slice(2).join('/') : task.file.startsWith('sample/product/')
      ? task.file.slice('sample/product/'.length)
      : 'pages/CreateQuotation.tsx'
    return {
      ...task,
      index,
      title: task.title,
      sourceFile: file,
      checkpoint: checkpointFor(step, index),
      part: partForFile(file, step),
    }
  })
}
export function selectionForCheckpoint(id: string) {
  for (const [key, ids] of Object.entries(manifest.microstepCheckpoints)) {
    if (ids.includes(id)) { const [step, sub] = key.split('.').map(Number); return { step, sub, mark: id } }
  }
  const checkpoint = checkpointById(id)
  const sub = manifest.substepCheckpoints[checkpoint.step].findIndex((cp) => cp === id)
  return { step: checkpoint.step, sub: Math.max(0, sub), mark: '' }
}
