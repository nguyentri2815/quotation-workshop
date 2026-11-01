import manifest from '../../stage2/manifest.json'
import type { Checkpoint } from '../workshop/catalog'
import { findSymbol } from '../workshop/source'
import type { RunPlan, RunTask, SourceLink } from '../workshop/run/model'

export const stageTwoCheckpoints = manifest.checkpoints as Checkpoint[]
export const stageTwoLessons = [
  { id: 's2-00', focus: ['components/FixedInformation.tsx','FixedInformation'], goal: 'So sánh điểm cố định của Chặng 1 với yêu cầu hai sản phẩm. Đây là bản hoàn chỉnh để bắt đầu, không phải form trống.', try: 'Điền mẫu → Tính phí A → 1.100.000 VND; mở FixedInformation để thấy tên sản phẩm đang viết cố định.' },
  { id: 's2-01-catalog', focus: ['quotation/products.ts','propertyProducts'], goal: 'Khai báo contract và catalog A/B, dùng ngay dữ liệu A trong ProductInformation. formatRate có consumer ngay tại mốc này.', try: 'Quan sát thẻ A: mã BASIC_PROPERTY, phiên bản 1, 1 triệu–100 tỷ, 1–365 ngày, 0,1% và thuế demo 10%. Chưa có selector.' },
  { id: 's2-02-selection', focus: ['pages/CreateQuotation.tsx','CreateQuotation.productCode'], goal: 'CreateQuotation sở hữu mã lựa chọn; tìm sản phẩm từ catalog rồi truyền props sang presentation. Đổi lựa chọn không sửa draft.', try: 'Nhập tên/số tiền/ngày → chọn B → A; thông tin đổi ngay và draft giữ nguyên. Mốc này tạm khóa tính/lưu cả A/B; mốc 1.3 ghép vô hiệu phí trước khi mở lại A.' },
  { id: 's2-03-switch', focus: ['pages/CreateQuotation.tsx','CreateQuotation.changeProduct'], goal: 'Nối đổi sản phẩm với việc bỏ phí cũ và guard tính/lưu. A giữ hành trình cũ; B chỉ có thông tin demo, chưa có validation/công thức/schema lưu riêng.', try: 'Điền mẫu → tính A → B: phí hết hiệu lực, giữ draft và khóa hành động → A: Lưu vẫn khóa → tính lại → lưu/reload.' },
  { id:'s2-04-validation', focus:['quotation/rules.ts','validateDraft'], goal:'Mới: validation nhận mã sản phẩm, lấy giới hạn từ catalog và nối ngay onBlur/validatedInput. Dùng lại tám trường, lỗi chung và phép đếm ngày; không nhân đôi form. Công thức B chưa nối.', try:'Điền mẫu → tính A → chọn B giữ 365 ngày → Tính phí: lỗi Ngày kết thúc tối đa 180 ngày. Nhập 1 triệu → lỗi Số tiền theo B.' },
  { id:'s2-05-pricing', focus:['quotation/rules.ts','calculateDraftPremium'], goal:'Mới: cùng công thức nhận annualRate/taxRate/giới hạn từ catalog. calculate tạo receipt và PremiumSummary hiển thị sản phẩm/phiên bản/đầu vào. Dùng lại ngày lịch và làm tròn; guard/UI vẫn khóa lưu B.', try:'Chọn B, tiền 1 tỷ, ngày kết thúc = ngày bắt đầu +180 ngày → 739.726 +73.973 =813.699 VND. B có phí nhưng Lưu khóa.' },
  { id:'s2-06-consistency', focus:['pages/CreateQuotation.tsx','CreateQuotation.changeProduct'], goal:'Mới: sau validation, đổi sản phẩm/sửa draft cập nhật lỗi ngay. premiumMatchesDraft nối ngay với vùng hiển thị và guard lưu, so mã/phiên bản/tiền/hai ngày. Dùng lại setPremium(null) từ 1.3 và handler tính từ 2.2.', try:'Tính A365 → B báo lỗi 180 ngay → sửa 180 → tính B → sửa tiền/ngày hoặc chọn A: phí hết hiệu lực. B1 triệu lỗi, chọn A lỗi tiền biến mất; phải tính lại.' },
]

export interface StageTwoNode { id: string; title: string; file: string; symbol: string; since: number; ui: string; links: Array<{ to: string; label: string; since?: number }> }
export const stageTwoNodes: StageTwoNode[] = [
  { id: 'fixed', title: 'Tóm tắt chung · FixedInformation', file: 'components/FixedInformation.tsx', symbol: 'FixedInformation', since: 0, ui: 'productInfo', links: [] },
  { id: 'contract', title: 'Contract sản phẩm', file: 'quotation/products.ts', symbol: 'PropertyProduct', since: 1, ui: 'productInfo', links: [{ to: 'catalog', label: 'Định kiểu catalog · compile time' }] },
  { id: 'catalog', title: 'Catalog A / B', file: 'quotation/products.ts', symbol: 'propertyProducts', since: 1, ui: 'productInfo', links: [{ to: 'props', label: 'Dữ liệu A → props trình bày' }, { to: 'selector', label: 'Catalog → các option selector' }, { to:'lookup', label:'Catalog → lookup mã, từ 2.1' }] },
  { id: 'selection', title: 'State mã lựa chọn', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.productCode', since: 2, ui: 'productCode', links: [{ to: 'consumer', label: 'Mã → tìm sản phẩm được chọn' }] },
  { id: 'consumer', title: 'Consumer · sản phẩm được chọn', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.product', since: 2, ui: 'productInfo', links: [{ to: 'props', label: 'Sản phẩm được chọn → props trình bày' }, { to: 'gate', label: 'Mã lựa chọn → điều kiện hành động' }] },
  { id: 'props', title: 'Nơi dùng · truyền props', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.props.ProductInformation', since: 1, ui: 'productInfo', links: [{ to: 'presentation', label: 'Props → presentation ProductInformation' }] },
  { id: 'presentation', title: 'Presentation thông tin sản phẩm', file: 'components/ProductInformation.tsx', symbol: 'ProductInformation', since: 1, ui: 'productInfo', links: [{ to: 'format', label: 'Gọi định dạng tỷ lệ · không tính phí' }] },
  { id: 'selector', title: 'Selector · nơi dùng catalog', file: 'components/ProductInformation.tsx', symbol: 'ProductInformation.selector', since: 2, ui: 'productCode', links: [{ to: 'change', label: 'change → callback của nơi sở hữu state' }] },
  { id: 'change', title: 'Đổi lựa chọn', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.changeProduct', since: 2, ui: 'productCode', links: [{ to: 'selection', label: 'setProductCode → yêu cầu cập nhật state' }, { to: 'invalidate', label: 'Đổi sản phẩm → vô hiệu phí · từ 1.3' }] },
  { id: 'invalidate', title: 'Vô hiệu phí cũ', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.changeProduct.site:call:setPremium[1]', since: 3, ui: 'premium', links: [{ to: 'summary', label: 'premium=null → presentation cần tính lại' }] },
  { id: 'gate', title: 'Điều kiện A/B của mốc', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.productSupported', since: 2, ui: 'product-action-note', links: [{ to: 'calculate', label: 'Guard trong calculate' }, { to: 'save', label: 'Guard trước POST' }] },
  { id: 'calculate', title: 'Handler tính · theo khả năng mốc', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.calculate', since: 0, ui: 'calculate', links: [{ to: 'summary', label: 'Kết quả phí → props presentation' }, { to:'validate', label:'Gọi validation, từ 2.1' }, { to:'receipt', label:'Tính kèm receipt, từ 2.2' }, { to:'result', label:'Setter → state kết quả' }] },
  { id: 'save', title: 'Lưu A / chặn B', file: 'pages/CreateQuotation.tsx', symbol: 'CreateQuotation.save', since: 0, ui: 'save', links: [] },
  { id: 'summary', title: 'Presentation phí / hết hiệu lực', file: 'components/PremiumSummary.tsx', symbol: 'PremiumSummary', since: 0, ui: 'premium', links: [] },
  { id: 'format', title: 'Định dạng tỷ lệ', file: 'quotation/format.ts', symbol: 'formatRate', since: 1, ui: 'productInfo', links: [] },
  { id:'lookup', title:'Tìm quy tắc · từ chối mã lạ', file:'quotation/products.ts', symbol:'getPropertyProduct', since:4, ui:'productInfo', links:[{to:'validate',label:'Quy tắc → validation'},{to:'formula',label:'Quy tắc → công thức, từ 2.2'}] },
  { id:'validate', title:'Validation theo sản phẩm', file:'quotation/rules.ts', symbol:'validateDraft', since:4, ui:'validationErrors', links:[{to:'validated',label:'Lỗi hoặc dữ liệu hợp lệ → consumer'}] },
  { id:'validated', title:'Consumer validation · lỗi tại trường', file:'pages/CreateQuotation.tsx', symbol:'CreateQuotation.validatedInput', since:4, ui:'validationErrors', links:[{to:'calculate',label:'Dữ liệu hợp lệ → handler tính'}] },
  { id:'formula', title:'Công thức chung · khác tham số', file:'quotation/rules.ts', symbol:'calculatePremium', since:5, ui:'premium', links:[{to:'receipt',label:'Phí thuần → thuế → tổng → receipt'}] },
  { id:'receipt', title:'Tính phí kèm sản phẩm/đầu vào', file:'quotation/rules.ts', symbol:'calculateDraftPremium', since:5, ui:'premium', links:[{to:'calculate',label:'Receipt → handler dùng ngay'}] },
  { id:'result', title:'State kết quả phí', file:'pages/CreateQuotation.tsx', symbol:'CreateQuotation.premium', since:5, ui:'premium', links:[{to:'summary',label:'Kết quả → presentation'},{to:'matches',label:'Kiểm tra hiệu lực, từ 2.3'}] },
  { id:'matches', title:'Mã/phiên bản/đầu vào khớp?', file:'quotation/rules.ts', symbol:'premiumMatchesDraft', since:6, ui:'premium', links:[{to:'current',label:'Receipt khớp → phí hiện tại'}] },
  { id:'current', title:'Consumer hiệu lực phí', file:'pages/CreateQuotation.tsx', symbol:'CreateQuotation.currentPremium', since:6, ui:'premium', links:[{to:'summary',label:'Chỉ trình bày phí còn hiệu lực'},{to:'save',label:'Chặn lưu phí không khớp'}] },
  { id:'edit', title:'Consumer sửa draft · giữ hành vi theo mốc', file:'pages/CreateQuotation.tsx', symbol:'CreateQuotation.updateDraft', since:0, ui:'sumInsured', links:[{to:'summary',label:'Sửa tiền/ngày → bỏ phí → presentation'},{to:'validate',label:'Từ 2.3: sau validation → lỗi theo draft/sản phẩm',since:6}] },
]
export const nodeAvailable = (checkpoint: Checkpoint, node: StageTwoNode) => checkpoint.order >= node.since && Boolean(findSymbol(checkpoint.id, node.file, node.symbol))

const source = (file: string, symbol: string): SourceLink => ({ file, symbol })
const form = (symbol: string) => source('pages/CreateQuotation.tsx', symbol)
export function stageTwoRunPlan(checkpoint: Checkpoint): RunPlan {
  const task = (kind: RunTask['kind'], title: string, target: string, sources: SourceLink[], instruction: string, resultTarget = target): RunTask => ({ id: kind, kind, title, target, resultTarget, sources, instruction, explanation: 'Đã quan sát DOM/UI và MSW nếu có request. Catalog → state → props, setter và render là diễn giải từ source, chưa instrument lời gọi bên trong.' })
  const info = task('product-info', 'Thông tin A đang hiển thị', 'productInfo', [source(checkpoint.order ? 'quotation/products.ts' : 'components/FixedInformation.tsx', checkpoint.order ? 'propertyProducts' : 'FixedInformation')], 'Quan sát thông tin sản phẩm A tại đúng mốc.')
  const fill = task('fill', 'Điền dữ liệu mẫu A', 'fill', [form('CreateQuotation.updateDraft')], 'Bấm Điền dữ liệu mẫu của ứng dụng.', 'customer')
  const calculate = task('calculate', 'Tính phí A từ draft hiện tại', 'calculate', [form('CreateQuotation.calculate')], 'Bấm Tính phí A và chờ kết quả thật 1.100.000 VND.', 'premium')
  const toB = task('switch-product', 'B cập nhật · draft được giữ · hành động bị khóa', 'product', [form('CreateQuotation.changeProduct'), source('components/ProductInformation.tsx','ProductInformation')], 'Chọn Tài sản mở rộng; quan sát 1–180 ngày, 0,15%, draft và trạng thái phí/nút.', 'productInfo')
  const toA = task('return-product', checkpoint.order === 2 ? 'Trở lại A · thông tin theo lựa chọn' : 'Trở lại A · chưa được dùng phí cũ', 'product', [form('CreateQuotation.changeProduct')], checkpoint.order === 2 ? 'Chọn lại Tài sản cơ bản; mốc này chỉ quan sát lựa chọn và giữ draft.' : 'Chọn lại Tài sản cơ bản; phải tính lại trước khi lưu.', checkpoint.order === 2 ? 'productInfo' : 'premium')
  let tasks = checkpoint.order === 2 ? [info, fill, toB, toA] : checkpoint.order === 3 ? [info, fill, calculate, toB, toA, calculate] : [info, fill, calculate]
  if (checkpoint.order >= 4) {
    const invalidPeriod = { ...calculate, title:'B giữ 365 ngày → lỗi thời hạn', expected:'invalid' as const, expectedField:'endDate', resultTarget:'endDate-error', sources:[source('quotation/rules.ts','validateDraft'),form('CreateQuotation.validatedInput')] }
    const period = (days: number): RunTask => ({ ...task('set-period', `Đặt thời hạn đúng ${days} ngày`, 'endDate', [form('CreateQuotation.updateDraft')], `Đặt Ngày kết thúc bằng Ngày bắt đầu +${days} ngày lịch (UTC).`, 'premium'), days })
    const amount = (value: string): RunTask => ({ ...task('set-amount', `Số tiền ${value} VND`, 'sumInsured', [form('CreateQuotation.updateDraft')], `Nhập Số tiền bảo hiểm = ${value}.`, 'premium'), value })
    const invalidAmount = { ...calculate, title:'Dưới tối thiểu B → lỗi số tiền', expected:'invalid' as const, expectedField:'sumInsured', resultTarget:'sumInsured-error', sources:invalidPeriod.sources }
    const switchB = { ...toB, title:'Chọn B · giữ draft · phí A hết hiệu lực' }
    if (checkpoint.order === 4) tasks = [info,fill,calculate,switchB,invalidPeriod,amount('1000000'),invalidAmount,toA]
    else {
      const priceB = { ...calculate, title:'Tính B · 1 tỷ / 180 ngày = 813.699 VND', expectedTotal:813699, sources:[source('quotation/rules.ts','calculateDraftPremium'),form('CreateQuotation.calculate'),source('components/PremiumSummary.tsx','PremiumSummary')] }
      const locked = task('inspect-save-lock','B có phí nhưng Lưu vẫn khóa','save',[form('CreateQuotation.save')],'Quan sát phí B và giải thích khóa Lưu cạnh vùng hành động.','product-action-note')
      tasks = [info,fill,calculate,switchB,invalidPeriod,period(180),priceB,locked,amount('1000000'),invalidAmount,toA,amount('1000000000'),period(365),calculate,switchB,period(180),priceB,period(179)]
    }
  }
  return { scenario: 'product-switch', title: 'Chặng 2 · chọn A → B → A', checkpoint, supported: true, reason: checkpoint.ui, tasks: tasks.map((item, index) => ({ ...item, id: `${index}-${item.kind}`, sources: item.sources.filter(link => findSymbol(checkpoint.id, link.file, link.symbol)) })) }
}
