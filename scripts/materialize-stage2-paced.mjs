import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { format } from 'prettier'

// Revision 4 is authored from immutable revision 3 and its Product pin. Never
// rewrite a published checkpoint to improve formatting or lesson granularity.
const root = resolve(import.meta.dirname, '..')
const read = path => readFile(resolve(root, path), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
async function write(path, code) {
  try { if (await read(path) === code) return } catch (e) { if (e.code !== 'ENOENT') throw e }
  await mkdir(dirname(resolve(root, path)), { recursive: true })
  await writeFile(resolve(root, path), code)
}
const old = JSON.parse(await read('stage2/revision-3.json'))
const pin = JSON.parse(await read(old.productPin))
const snapshots = {}
for (const cp of old.checkpoints) {
  snapshots[cp.id.replace('s2-r3-', '')] = {}
  for (const f of cp.files) {
    const code = await read(`checkpoints/${cp.id}/${f.path}`)
    if (sha(code) !== f.sha256) throw Error('Historical source changed: ' + cp.id + '/' + f.path)
    snapshots[cp.id.replace('s2-r3-', '')][f.path] = code
  }
}
const b = snapshots['00'], target = snapshots.complete
const p = 'quotation/products.ts', f = 'pages/CreateQuotation.tsx', v = 'components/ProductInformation.tsx', r = 'quotation/rules.ts', t = 'quotation/types.ts', page = 'pages/SelectProduct.tsx'
const products = target[p]
const contract = products.slice(0, products.indexOf('export const propertyProducts'))
const array = products.slice(products.indexOf('export const propertyProducts'), products.indexOf('export function getPropertyProduct'))
const first = array.slice(array.indexOf('  {'), array.indexOf('  },') + 3).trim().replace(/,$/, '')
const a = contract + '\nexport const basicProperty: PropertyProduct = ' + first + '\n'
const catalog = contract + array
const lookup = products.slice(0, products.indexOf('export type ProductTerms'))
let source = { ...b }
const lessons = []
function step(id, group, title, focus, why, origin, consumer, delta, ui, run, options = {}) {
  lessons.push({ id: 's2-r4-' + id, step: group, title, focus, why, origin, consumer, delta, ui, run, ...options, source: { ...source } })
}
const baseline = 'Chặng 1 hoàn chỉnh: FixedInformation trình bày A, rules.ts chứa giới hạn và tỷ lệ cố định.'
step('00', 0, 'Quan sát sản phẩm cố định ở Chặng 1', ['components/FixedInformation.tsx', 'FixedInformation'], 'Xác định điểm xuất phát trước khi thêm nhiều sản phẩm.', baseline, 'CreateQuotation render FixedInformation; calculatePremium và validateDraft dùng quy tắc A.', 'Quan sát, không đổi source nghiệp vụ. Bản sao mới chỉ format nhiều dòng; Chặng 1 và revision cũ giữ nguyên.', 'Form A của Chặng 1; chưa có /products.', 'Điền mẫu → tính A = 1.100.000. Đối chiếu FixedInformation với rules.ts.', { observe: true, phase: 0, entry: '/quotations/new' })
source[p] = contract
step('contract', 1, 'A · Contract: type khác dữ liệu runtime', [p, 'PropertyProduct'], 'Nhiều sản phẩm cần mã, phiên bản, tên, mô tả, giới hạn và tỷ lệ có kiểu thống nhất.', baseline + ' Contract lấy đúng thuộc tính từ Product ghim.', 'TypeScript kiểm tra dữ liệu ở sub-step B; interface bị xóa khi chạy, chưa tạo thẻ UI.', 'Tạo PropertyProductCode và PropertyProduct; chưa có giá trị sản phẩm runtime.', 'UI giữ nguyên form A; kiểm tra bằng npm run typecheck.', 'Đọc từng thuộc tính contract; xác nhận chưa có trang chọn.', { phase: 0, entry: '/quotations/new', sourceOnly: true })
source[p] = a
step('data', 1, 'B · Khai báo một sản phẩm A', [p, 'basicProperty'], 'Contract cần một giá trị thực để page có thể import.', 'basicProperty được export trực tiếp trong quotation/products.ts, theo PropertyProduct; giá trị A lấy từ Product ghim.', 'SelectProduct sẽ import basicProperty tại C; hiện typecheck kiểm tra object A.', 'Thêm một object A; chưa khai báo B, chưa tạo trang.', 'Form baseline giữ nguyên; không có thẻ sản phẩm mới.', 'Kiểm tra export, code BASIC_PROPERTY, version 1, name và description.', { phase: 0, entry: '/quotations/new', sourceOnly: true })
source['App.tsx'] = snapshots.catalog['App.tsx']
source[page] = `import { basicProperty } from '../quotation/products'
export function SelectProduct() {
  return <article><h2>{basicProperty.name}</h2><p>{basicProperty.description}</p></article>
}
`
step('page', 1, 'C · Import và render một sản phẩm', [page, 'SelectProduct'], 'Đưa dữ liệu runtime vào UI bằng consumer thật.', 'Import basicProperty từ quotation/products.ts, không khai báo lại trong component.', 'Route /products trong App.tsx render SelectProduct; JSX đọc name và description.', 'Tạo page, nối route, import A và render đúng một article; chưa có action.', '/products chỉ có tên và mô tả A; chưa có B, tiêu đề trang hoặc nút.', 'Theo Định nghĩa → Import → Nơi dùng → UI; chỉ một article xuất hiện.', { phase: 1, entry: '/products', provenance: 'single' })
source[p] = catalog
source[page] = `import { propertyProducts } from '../quotation/products'
export function SelectProduct() {
  return <div>{propertyProducts.map(product => <article key={product.code}><h2>{product.name}</h2><p>{product.description}</p></article>)}</div>
}
`
step('catalog', 1, 'D · Catalog A/B và consumer map', [p, 'propertyProducts'], 'Danh sách giúp cùng một page render từng sản phẩm mà không sao chép JSX.', 'propertyProducts là catalog runtime được khai báo trong quotation/products.ts; A được chuyển vào array và thêm B từ Product ghim.', 'SelectProduct import và duyệt danh sách bằng map để render hai thẻ; React chỉ render dữ liệu này.', 'Thay basicProperty bằng propertyProducts; cập nhật import và JSX map cùng checkpoint. Không giữ bản sao A.', '/products có hai article tên/mô tả, chưa có presentation hoặc action.', 'Bấm lần lượt Định nghĩa, Import, Nơi dùng, UI; kiểm tra A/B đúng dữ liệu.', { phase: 1, entry: '/products', provenance: 'catalog' })
const selectTarget = snapshots.catalog[page]
const heading = selectTarget.slice(selectTarget.indexOf('<div className={styles.pageHeading}'), selectTarget.indexOf('<div className={styles.productGrid}'))
source[page] = source[page].replace("export function", "import styles from '../components/ui.module.css'\nexport function").replace('return <div>', 'return <>' + heading + '<div>').replace('</div>\n}', '</div></>\n}')
step('heading', 1, 'E1 · Tiêu đề và chỉ dẫn trang', [page, 'SelectProduct.jsx.pageHeading'], 'Cho người dùng biết đang chọn sản phẩm trước khi nhập form.', 'Tiêu đề và subtitle lấy từ SelectProduct của Product ghim; dùng style pageHeading đã có.', 'SelectProduct đặt heading trước danh sách runtime.', 'Thêm heading; giữ hai article và map hiện có.', 'Có tiêu đề Chọn sản phẩm; hai article vẫn chưa thành card/grid.', 'So sánh Trước/Sau: chỉ phần heading và import styles mới.', { phase: 1, entry: '/products', provenance: 'catalog' })
source['components/ui.module.css'] = target['components/ui.module.css']
source[page] = source[page].replace('<article key={product.code}>', '<article key={product.code} className={styles.card}>')
step('cards', 1, 'E2 · Trình bày nội dung thẻ', [page, 'SelectProduct.jsx.card'], 'Nhóm tên và mô tả từng sản phẩm theo card của thiết kế đích.', 'name/description vẫn đến từ propertyProducts; styles.card là presentation dùng chung.', 'article trong map dùng class card, không sở hữu dữ liệu sản phẩm.', 'Nối style card; chưa đổi layout danh sách và chưa có nút.', 'Hai thẻ nội dung xếp dọc, chưa có grid/action.', 'Đối chiếu import, map và nội dung card với object runtime.', { phase: 1, entry: '/products', provenance: 'catalog' })
source[page] = source[page].replace(heading + '<div>', heading + '<div className={styles.productGrid}>')
step('layout', 1, 'E3 · Bố cục catalog', [page, 'SelectProduct.jsx.productGrid'], 'Bố trí thẻ theo màn hình bằng layout của Product.', 'styles.productGrid được định nghĩa trong components/ui.module.css.', 'Container bọc kết quả map nhận productGrid; nội dung và dữ liệu giữ nguyên.', 'Chỉ nối class productGrid vào container.', 'Grid hai thẻ theo kích thước preview; chưa có nút tạo.', 'Thu nhỏ preview để kiểm tra layout, rồi quay lại code.', { phase: 1, entry: '/products', provenance: 'catalog' })
source[page] = selectTarget
step('actions', 1, 'E4 · Nút tạo chưa nối route', [page, 'SelectProduct.jsx.primaryButton'], 'Đặt đúng vị trí action trước khi kết nối điều hướng.', 'Nút và nhãn truy cập từ Product; tạm disabled vì consumer URL chưa hình thành.', 'Mỗi article render button disabled; không điều hướng hoặc tạo dữ liệu.', 'Thêm nút Tạo bản chào ở từng card, chưa thêm Link.', 'Presentation khớp trang chọn; cả hai nút bị khóa.', 'Bấm nút không chuyển trang. Source ghi disabled, không có handler ẩn.', { phase: 1, entry: '/products', provenance: 'catalog' })
source['App.tsx'] = target['App.tsx']
source[page] = target[page].replace('return <CreateQuotation initialCode={product.code} />', 'return <section><h1>{product.name}</h1><p>{product.description}</p><button type="button" disabled>Tạo bản chào</button></section>').replace("import { CreateQuotation } from './CreateQuotation'\n", '')
step('route', 1, 'F1 · Truyền, đọc và kiểm tra mã qua URL', [page, 'QuotationEntry'], 'Điều hướng phải mang định danh tới consumer và kiểm tra trước khi mở form.', 'Link tạo query product; useSearchParams đọc query; propertyProducts.find kiểm mã runtime.', 'App route /quotations/new render QuotationEntry. Thiếu mã về /products; mã sai hiện lỗi; mã đúng mới có ngữ cảnh tối thiểu.', 'Nối Link và QuotationEntry; form theo sản phẩm chưa nối, action tại nơi nhận còn khóa.', 'Chọn A/B mở đúng tên/mô tả tại route nhận; chưa hiện form. Thiếu/sai mã xử lý theo thiết kế đích.', 'Chọn B; kiểm URL. Thử /quotations/new và ?product=UNKNOWN, không tự biến mã sai thành A.', { phase: 1, entry: '/products', provenance: 'route' })
Object.assign(source, Object.fromEntries([f,v].map(path=>[path,snapshots.entry[path]])))
source[page] = target[page]
source['quotation/format.ts'] = target['quotation/format.ts']
step('entry', 1, 'F2 · Props → state → ngữ cảnh form', [f, 'CreateQuotation.product'], 'Form cần sở hữu mã đã được route kiểm tra và hiển thị đúng sản phẩm.', 'QuotationEntry truyền initialCode; useState giữ productCode; product được tìm từ catalog.', 'ProductInformation nhận product qua props; hint số tiền/ngày đọc cùng product. Giữ draft của Chặng 1.', 'Nối form, state và ngữ cảnh gọn. Chưa có panel; B chưa nối validation/phí, lưu khóa.', 'A/B mở đúng form/ngữ cảnh. A tính được; B và lưu chưa nối.', 'Theo Định nghĩa → Import → Nơi dùng → UI của props sản phẩm. Không có catalog lớn trong form.', { phase: 2, entry: '/products', provenance: 'props' })
// The first panel opens/closes only. It cannot apply an unfinished selection.
source[v] = target[v].replace("import { useRef, useState }", "import { useRef }").replace("import { propertyProducts } from '../quotation/products'\n", '').replace('  const [candidate, setCandidate] = useState(product.code)\n','').replace('setCandidate(product.code); ', '').replace(/      <fieldset className=\{styles.productChoices\}>[\s\S]*?<\/fieldset>\n/, '').replace(/disabled=\{candidate === product.code \|\| disabled\} onClick=\{\(\) => \{ onProductChange\?\.\(candidate\); panel.current\?\.close\(\) \}\}/, 'disabled')
source[f] = source[f].replace('<ProductInformation product={product} disabled={saving} />','<ProductInformation product={product} onProductChange={() => {}} disabled={saving} />')
step('panel-open', 2, 'A · Mở và đóng panel', [v, 'ProductInformation.panel'], 'Tách không gian đổi sản phẩm khỏi ngữ cảnh gọn trên form.', 'useRef giữ dialog; nút Đổi sản phẩm gọi showModal; hủy/Escape đóng dialog.', 'ProductInformation render dialog; callback form chưa nối, xác nhận bị khóa.', 'Thêm shell panel và nút mở/hủy; chưa có lựa chọn tạm.', 'Panel mở/đóng, không đổi sản phẩm, draft hoặc phí.', 'Điền mẫu/tính A, mở panel rồi hủy/Escape: giữ nguyên form/phí.', { phase: 2, entry: '/products', provenance: 'panel' })
source[v] = target[v].replace(/disabled=\{candidate === product.code \|\| disabled\} onClick=\{\(\) => \{ onProductChange\?\.\(candidate\); panel.current\?\.close\(\) \}\}/, 'disabled')
step('candidate', 2, 'B · Lựa chọn tạm và hủy', [v, 'ProductInformation.candidate'], 'Ứng viên trong panel phải độc lập với mã đang áp dụng trên form.', 'candidate là state cục bộ; mỗi lần mở reset từ product.code; radio map catalog runtime.', 'Radio cập nhật candidate; hủy chỉ close. Confirm chưa nối nên disabled.', 'Thêm candidate và radio consumer ngay trong panel; chưa ghi productCode của form.', 'Chọn B trong panel rồi hủy vẫn là A; mở lại reset về A.', 'Theo state → onChange → checked; kiểm tra hủy không gọi callback đổi.', { phase: 2, entry: '/products', provenance: 'candidate' })
source[f] = snapshots.panel[f];source[v]=target[v]
step('panel', 2, 'C · Xác nhận, áp dụng và vô hiệu phí', [f, 'CreateQuotation.changeProduct'], 'Áp dụng lựa chọn phải giữ draft và bỏ phí cũ trong cùng một thao tác.', 'Confirm gọi onProductChange(candidate); form kiểm mã/saving/cùng mã rồi setProductCode.', 'changeProduct giữ draft, setPremium(null), đặt notice; ProductInformation chỉ phát intent và đóng panel.', 'Nối callback, guard và vô hiệu phí đồng thời. Không có mốc áp dụng B nhưng vẫn giữ phí A.', 'Hủy giữ A/phí; xác nhận B giữ tám trường và bỏ phí. B/lưu chưa nối.', 'Tính A → panel B → hủy; lặp lại xác nhận → B, draft giữ, phí cần tính lại.', { phase: 3, entry: '/products', provenance: 'change' })
source[p]=lookup
source[r]="import { getPropertyProduct } from './products'\n"+b[r].replace('export const MIN_SUM_INSURED = 1_000_000', "export const MIN_SUM_INSURED = getPropertyProduct('BASIC_PROPERTY').minSumInsured").replace('export const MAX_SUM_INSURED = 100_000_000_000', "export const MAX_SUM_INSURED = getPropertyProduct('BASIC_PROPERTY').maxSumInsured")
step('rule-source', 3, 'A · Quy tắc từ catalog vào validation A', [p, 'getPropertyProduct'], 'Bỏ nguồn giới hạn số tiền cố định trùng với catalog.', 'getPropertyProduct tra code/version trong propertyProducts; MIN/MAX đọc A qua helper này.', 'validateDraft baseline đang dùng MIN/MAX, nên helper có consumer ngay tại mốc này.', 'Tạo lookup và thay nguồn MIN/MAX; vẫn validation A, chưa nối mã B từ form.', 'UI không đổi; validation A dùng giá trị catalog.', 'Mở lookup → MIN/MAX → validateDraft. Không giả đã có validation B.', { phase: 3, entry: '/products', provenance: 'validation' })
const prefix=snapshots.validation[r].slice(0,snapshots.validation[r].indexOf('export function calculatePremium'))
const validate=prefix.slice(prefix.indexOf('export function validateDraft'),prefix.indexOf('export function validateAndBuildInput'))
source[r]=source[r].replace("import type {", "import type { PropertyProductCode } from './products'\nimport type {")
source[r]=source[r].replace(/export function validateDraft[\s\S]*?(?=export function validateAndBuildInput)/,validate)
step('validator', 3, 'B · Hàm kiểm tra nhận quy tắc sản phẩm', [r, 'validateDraft'], 'Cùng bộ kiểm tra phải đọc giới hạn của sản phẩm được truyền vào.', 'productCode là tham số có mặc định A; getPropertyProduct cung cấp min/max số tiền/ngày.', 'validateAndBuildInput và blur baseline vẫn gọi một tham số nên dùng A. Mốc sau mới truyền mã từ form.', 'Thay điều kiện giới hạn trong validateDraft; giữ kiểm tên/email/ngày lịch.', 'Lỗi A giữ hành vi; B chưa được nối từ consumer form.', 'So source validateDraft trước/sau; không coi hàm có tham số là UI đã dùng B.', { phase: 3, entry: '/products', provenance: 'validator' })
source[t]=snapshots.validation[t].replace(/export interface CalculatedPremium extends Premium \{[\s\S]*?\nexport type ValidationResult/, 'export type ValidationResult')
source[r]=snapshots.validation[r]
source[f]=snapshots.validation[f].replace('    if (validated) setErrors(validateDraft(next, productCode))\n','').replace('    if (validated) setErrors(validateDraft(draft, next.code))\n','')
step('validation', 3, 'C · Consumer → input chuẩn hóa → lỗi tại trường', [f, 'CreateQuotation.validatedInput'], 'Mã form phải đi qua build input và lỗi phải quay về đúng trường.', 'validateAndBuildInput(draft, productCode) gọi validator và tạo ProductInput có code/version.', 'validatedInput ghi errors/message, focus trường lỗi; Field nhận errors qua props đã có từ Chặng 1.', 'Nối mã ở build/blur và handler kiểm tra; thêm ProductInput cùng consumer. Chưa revalidate ngay khi sửa/đổi.', 'B365 báo tối đa180 ngày; B1 triệu báo tối thiểu10 triệu. B chưa tính phí.', 'Chọn B → mẫu365 → Tính phí; theo validateDraft → errors → Field endDate.', { phase: 4, entry: '/products', provenance: 'errors' })
source[f]=snapshots.validation[f]
step('revalidate', 3, 'D · Revalidation khi sửa và đổi', [f, 'CreateQuotation.updateDraft'], 'Sau lần kiểm tra đầu, lỗi phải theo draft và mã sản phẩm hiện tại.', 'validated state ghi nhận đã kiểm tra; updateDraft và changeProduct gọi validateDraft khi cần.', 'errors đi qua inputProps và Field; giữ policy vô hiệu phí của Chặng 1.', 'Nối revalidation vào hai consumer sửa draft/đổi sản phẩm, không thêm validator khác.', 'Sửa ngày B hợp lệ hoặc đổi sang A cập nhật lỗi ngay sau lần validation.', 'B365 lỗi → sửa180 hết lỗi; đổi A dùng quy tắc365.', { phase: 4, entry: '/products', provenance: 'errors' })
const formula=target[r].slice(target[r].indexOf('export function calculatePremium'),target[r].indexOf('export function pricingInputsChanged'))
source[r]=source[r].replace(/export function calculatePremium[\s\S]*?(?=export function pricingInputsChanged)/,formula)
step('formula', 3, 'E · Tham số và công thức thuần', [r, 'calculatePremium'], 'Công thức cần tỷ lệ, thuế và giới hạn theo mã sản phẩm.', 'getPropertyProduct cung cấp tham số; calendarDays giữ phép tính ngày lịch đã có.', 'Handler A và mock A đang gọi calculatePremium với mặc định A; công thức B chưa nối từ handler.', 'Thay hằng tỷ lệ bằng product.annualRate/taxRate; giữ net→tax làm tròn.', 'A tính như cũ; B chưa gọi công thức dù helper đã hỗ trợ.', 'Đối chiếu đầu vào, guard, net, tax và return; consumer A dùng helper ngay.', { phase: 4, entry: '/products', provenance: 'formula' })
source[f]=source[f].replace("    if (productCode !== 'BASIC_PROPERTY') return\n",'').replace('calculatePremium(Number(draft.sumInsured), draft.startDate, draft.endDate)','calculatePremium(Number(draft.sumInsured), draft.startDate, draft.endDate, productCode)').replace(' stale={calculatedBefore && !currentPremium}', ' stale={calculatedBefore && !currentPremium} annualRate={product.annualRate} taxRate={product.taxRate}')
source['components/PremiumSummary.tsx']=target['components/PremiumSummary.tsx'].replace('Premium, CalculatedPremium','Premium').replace('Premium | CalculatedPremium | null','Premium | null').replace("{'productCode' in premium && <p data-priced-product={premium.productCode}>{premium.productName} · {premium.productCode} / v{premium.productVersion}<br />{premium.inputs.startDate} → {premium.inputs.endDate} · {formatMoney(Number(premium.inputs.sumInsured))}</p>}\n",'')
step('pricing', 3, 'F · Handler → state kết quả → props tỷ lệ', [f, 'CreateQuotation.calculate'], 'Nối công thức theo mã vào thao tác thật sau validation.', 'validatedInput kiểm draft; handler truyền productCode vào calculatePremium và setPremium.', 'PremiumSummary nhận premium và tỷ lệ qua props; component chỉ trình bày.', 'Bỏ guard chưa hỗ trợ B; nối tham số công thức và props presentation trong cùng mốc.', 'A365 = 1.100.000; B180 = 813.699. Lưu vẫn khóa, chưa có receipt định danh.', 'B365 lỗi →180 → Tính phí; theo handler đến kết quả và UI.', { phase: 4, entry: '/products', provenance: 'premium' })
source[t]=snapshots.pricing[t];source[r]=snapshots.pricing[r];source[f]=snapshots.pricing[f]
step('receipt', 3, 'G · Receipt và policy hiệu lực phí', [r, 'premiumMatchesDraft'], 'Kết quả hiện tại cần gắn mã/phiên bản và ba đầu vào đã tính.', 'calculateDraftPremium bọc công thức; CalculatedPremium giữ định danh và inputs; premiumMatchesDraft so với draft.', 'calculate ghi receipt; currentPremium kiểm receipt trước khi truyền presentation. Helpers có consumer ngay.', 'Thêm receipt, helper so khớp và hai consumer đồng thời; chưa thêm hàng định danh vào UI.', 'Tính/sửa/đổi bỏ phí đúng; sửa tên giữ phí. UI kết quả còn dạng số như mốc trước.', 'Theo receipt → currentPremium → PremiumSummary; đọc graph không tính lại.', { phase: 5, entry: '/products', provenance: 'receipt' })
source['components/PremiumSummary.tsx']=target['components/PremiumSummary.tsx']
step('summary', 3, 'H · Trình bày định danh của kết quả', ['components/PremiumSummary.tsx','PremiumSummary.receipt-identity'], 'Người đọc cần biết kết quả thuộc sản phẩm/phiên bản và đầu vào nào.', 'Các trường productName/code/version/inputs có sẵn trong receipt; không tra lại bằng catalog khi render.', 'PremiumSummary nhận receipt từ currentPremium và render hàng định danh.', 'Thêm presentation định danh; không sửa công thức hoặc handler.', 'Kết quả hiển thị đúng mã/v1, ngày và số tiền đã tính; lưu còn khóa.', 'Tính B180, kiểm hàng định danh cùng tổng813.699.', { phase: 5, entry: '/products', provenance: 'receipt' })
for(const path of [p,t,r,'quotation/records.ts','mocks/storage.ts'])source[path]=target[path]
step('record', 4, 'A · Contract lưu và consumer mock/parser', [t,'Quotation'], 'Dữ liệu lưu phải tự mô tả sản phẩm và biểu phí lịch sử.', 'QuotationInput thêm version; Quotation có schemaVersion2/productSnapshot; productTerms chụp quy tắc đã dùng.', 'Mock tạo seed/record theo contract; parseQuotationInput kiểm biên; records.parseQuotation đọc snapshot và adapter A cũ ngay.', 'Nối contract, writer và reader tối thiểu cùng lúc để không có record nửa cũ/nửa mới. Form chưa gửi POST.', 'Form/lưu vẫn khóa. Danh sách/chi tiết baseline đọc record mới qua parser; adapter A cũ chỉ đọc.', 'Theo ProductTerms → createQuotation → parseQuotation. Giữ byte row lỗi, không ghi lại khi đọc.', { phase: 5, entry: '/products', provenance: 'record' })
for(const path of ['api/quotations.ts','mocks/handlers.ts'])source[path]=target[path]
step('api', 4, 'B · API consumer và xử lý response', ['api/quotations.ts','quotationsApi'], 'Response unknown cần kiểm tra trước khi UI dùng và có báo số record bị cách ly.', 'request đọc JSON/status/header; requireQuotation và listResult dùng parser lịch sử.', 'GET list/detail đang dùng HTTP client; mock trả header X-Quotation-Skipped. POST chưa mở trên form.', 'Nối contract response, lỗi API và skipped count; không tự lưu khi mở source/graph.', 'Đọc A được; lỗi response giữ thông báo. Chưa có UI tên sản phẩm lịch sử đầy đủ.', 'Đọc request → parse response → listResult/get; kiểm không POST khi đọc.', { phase: 5, entry: '/products', provenance: 'api' })
for(const path of ['pages/QuotationList.tsx','pages/QuotationDetail.tsx','components/FixedInformation.tsx'])source[path]=target[path]
step('read', 4, 'C · Hiển thị sản phẩm đã lưu', ['pages/QuotationDetail.tsx','QuotationDetail'], 'Danh sách/chi tiết phải dùng thông tin đã lưu thay cho nhãn A cố định.', 'API trả Quotation đã parse; productSnapshot giữ tên, phiên bản, tỷ lệ lịch sử.', 'QuotationList và QuotationDetail render response; reload vẫn GET, không tái báo giá.', 'Nối presentation lịch sử và cảnh báo row lỗi vào API đã có.', 'Tên sản phẩm/phiên bản/biểu phí đã lưu xuất hiện ở danh sách và chi tiết.', 'Mở seed → về danh sách → mở lại → reload; không tạo record mới.', { phase: 5, entry: '/products', provenance: 'read' })
source={...target}
step('complete', 4, 'D · Lưu, response, điều hướng và reload', [f,'CreateQuotation.save'], 'Cuối cùng mới mở hành động lưu sau khi contract, API và presentation cùng sẵn sàng.', 'validatedInput và currentPremium cung cấp input/guard; quotationsApi.create trả record đã parse.', 'save chống gửi lặp, điều hướng tới ID sau response; catch giữ draft/phí và cho retry chủ động. GET reload dùng reader đã nối.', 'Nối handler POST và mở nút lưu. Source cuối bằng Product ghim sau format và adapter nhúng công khai.', 'A/B tính/lưu/mở lại/reload; adapter A cũ và row lỗi rõ ràng. Khớp Product ghim.', 'B365 lỗi →180 =813.699 → lưu → mở lại/reload. Quan sát reload không đổi source và không POST.', { phase: 6, entry: '/products', provenance: 'save' })

const formatter={parser:'typescript',printWidth:76,tabWidth:2,semi:false,singleQuote:true,trailingComma:'all',endOfLine:'lf',objectWrap:'preserve'}
const cache=new Map()
let published
try{published=JSON.parse(await read('stage2/revision-4.json'))}catch(e){if(e.code!=='ENOENT')throw e}
if(published)for(const cp of published.checkpoints)for(const file of cp.files)if(sha(await read(`checkpoints/${cp.id}/${file.path}`))!==file.sha256)throw Error('Published checkpoint edited: '+cp.id+'/'+file.path)
const manifest={publication:process.argv.includes('--publish')?'published':published?.publication??'draft',stage:2,version:4,baseline:'12',productPin:old.productPin,productHash:pin.sha256,formatter:{name:'prettier',version:'3.6.2',...formatter},checkpoints:[]}
let previous={}
for(const [order,lesson]of lessons.entries()){
  const {source:raw,...metadata}=lesson,files=[]
  for(const [path,input]of Object.entries(raw).sort(([a],[b])=>a.localeCompare(b))){
    const displayInput=path===f&&lesson.phase>=2&&lesson.phase<6?input.replace('Đã tính phí. Bạn có thể lưu bản chào.','Đã tính phí.'):input
    const key=path+':'+sha(displayInput)
    const code=/\.tsx?$/.test(path)?(cache.get(key)??await format(displayInput,{...formatter,filepath:path})):input
    cache.set(key,code)
    const existing=published?.checkpoints.find(cp=>cp.id===lesson.id)?.files.find(f=>f.path===path)
    if(published?.publication==='published'&&existing&&existing.sha256!==sha(code))throw Error('Use a new revision instead of changing '+lesson.id+'/'+path)
    await write(`checkpoints/${lesson.id}/${path}`,code)
    files.push({path,sha256:sha(code),status:previous[path]===code?'unchanged':previous[path]===undefined?'new':'modified',origin:path.startsWith('_workshop/')||path==='index.html'?'workshop':['App.tsx','main.tsx','api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(path)?'adapted':'product',first:manifest.checkpoints.find(cp=>cp.files.some(f=>f.path===path))?.id??lesson.id,lastStep:lesson.step,scaffold:false,lines:code.trimEnd().split('\n').length})
    previous[path]=code
  }
  manifest.checkpoints.push({...metadata,features:lessons.slice(0,order+1).map(item=>item.id.replace('s2-r4-','')),order,kind:lesson.sourceOnly?'source':'ui',previous:lessons[order-1]?.id??null,files})
}
if(published?.publication==='published'&&JSON.stringify(published)!==JSON.stringify(manifest))throw Error('Published revision metadata changed; create a new revision instead.')
await write('stage2/revision-4.json',JSON.stringify(manifest,null,2)+'\n')
console.log(`Verified/authored ${lessons.length} formatted revision 4 checkpoints; Product ${pin.sha256}. Historical snapshots untouched.`)
