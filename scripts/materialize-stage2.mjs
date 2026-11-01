// Explicit authoring command. Stage 1 snapshots and the learner's files are read-only.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'

throw new Error('Preview 1/2 are frozen. Use npm run stage2:materialize to author revision 2; never regenerate published IDs from live Product.')
const root = resolve(import.meta.dirname, '..')
const sha = value => createHash('sha256').update(value).digest('hex')
async function files(dir, prefix = '') {
  const result = {}
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name
    if (entry.isDirectory()) Object.assign(result, await files(resolve(dir, entry.name), path + '/'))
    else if (!path.includes('.test.') && /\.(tsx?|css)$/.test(path)) result[path] = await readFile(resolve(dir, entry.name), 'utf8')
  }
  return result
}
const product = await files(resolve(root, '../quotation-product/src'))
const manifest = JSON.parse(await readFile(resolve(root, 'stage2/manifest.json'), 'utf8'))
// Preview 1 is a published learning baseline. Never reconstruct it from live Product.
for (const cp of manifest.checkpoints) for (const file of cp.files) {
  if (sha(await readFile(resolve(root, 'checkpoints', cp.id, file.path))) !== file.sha256)
    throw new Error('Snapshot edited: ' + cp.id + '/' + file.path)
}
async function runtime(id) {
  const cp = manifest.checkpoints.find(cp => cp.id === id), result = {}
  for (const file of cp.files) result[file.path] = await readFile(resolve(root, 'checkpoints', id, file.path), 'utf8')
  return result
}
const pinned = await runtime('s2-03-switch')
const validation = { ...product }
validation['quotation/types.ts'] = product['quotation/types.ts'].replace(/export interface CalculatedPremium[\s\S]*?\n}\n\n/, '')
const pricingStart = product['quotation/rules.ts'].indexOf('export function calculatePremium')
validation['quotation/rules.ts'] = (product['quotation/rules.ts'].slice(0, pricingStart)
  + pinned['quotation/rules.ts'].slice(pinned['quotation/rules.ts'].indexOf('export function calculatePremium'), pinned['quotation/rules.ts'].indexOf('export function isRecord'))
  + product['quotation/rules.ts'].slice(product['quotation/rules.ts'].indexOf('export function isRecord'), product['quotation/rules.ts'].indexOf('// Only the form')))
  .replace('CalculatedPremium, ', '')
// The fixed-A formula still uses A catalog values; validation is already selected-product aware.
validation['quotation/rules.ts'] = validation['quotation/rules.ts'].replace('sumInsured * 0.001', "sumInsured * getPropertyProduct('BASIC_PROPERTY').annualRate").replace('net * 0.1', "net * getPropertyProduct('BASIC_PROPERTY').taxRate")
validation['components/PremiumSummary.tsx'] = pinned['components/PremiumSummary.tsx']
validation['pages/CreateQuotation.tsx'] = pinned['pages/CreateQuotation.tsx']
  .replace('if (productSupported) setErrors((previous) => ({ ...previous, [key]: validateDraft(draft)[key] }))', 'setErrors((previous) => ({ ...previous, [key]: validateDraft(draft, productCode)[key] }))')
  .replace('validateAndBuildInput(draft)', 'validateAndBuildInput(draft, productCode)')
  .replace('    if (!productSupported) { setMessage(unsupportedMessage); return }\n    const input = validatedInput()\n    if (!input) return\n    setPremium(', '    const input = validatedInput()\n    if (!input) return\n    if (!productSupported) { setMessage(unsupportedMessage); return }\n    setPremium(')
  .replace('if (!input) return\n    if (!premium)', "if (!input || input.product !== 'BASIC_PROPERTY') return\n    if (!premium)")
  .replace('disabled={!productSupported || saving}', 'disabled={saving}')
  .replace('Thông tin B mới để quan sát; validation, tính phí và lưu B sẽ nối ở mốc tiếp. Chọn Tài sản cơ bản rồi tính lại để lưu.', 'Validation B đã nối vào form; công thức và lưu B chưa được hỗ trợ ở mốc 2.1.')
validation['mocks/storage.ts'] = product['mocks/storage.ts'].replaceAll(", 'BASIC_PROPERTY')", ')')
const pricing = { ...product }
pricing['quotation/rules.ts'] = product['quotation/rules.ts'].slice(0, product['quotation/rules.ts'].indexOf('export function premiumMatchesDraft'))
pricing['pages/CreateQuotation.tsx'] = product['pages/CreateQuotation.tsx']
  .replace('  premiumMatchesDraft,\n', '')
  .replace('  const [validated, setValidated] = useState(false)\n', '')
  .replace('const currentPremium = premiumMatchesDraft(premium, draft, productCode) ? premium : null', 'const currentPremium = premium')
  .replace(/    if \(validated\) setErrors\(validateDraft\(next, productCode\)\)\n/, '')
  .replace('    if (validated) setErrors(validateDraft(draft, next.code))', '    setErrors({})')
  .replace('if (!validated) setErrors', 'setErrors')
  .replaceAll('        setValidated(true)\n', '').replaceAll('    setValidated(true)\n', '')
const stages = [
  { id:'s2-04-validation', title:'2.1 Validation theo sản phẩm', ui:'Chọn A/B rồi Tính phí: lỗi số tiền/thời hạn theo catalog. B hợp lệ vẫn chưa tính phí ở mốc này.', source:validation },
  { id:'s2-05-pricing', title:'2.2 Tính phí B', ui:'A/B dùng cùng công thức nhận tham số; kết quả có mã/phiên bản, số tiền, ngày và tỷ lệ. B tính được, lưu vẫn khóa.', source:pricing },
  { id:'s2-06-consistency', title:'2.3 Nhất quán khi đổi/sửa', ui:'Sau validation, lỗi đổi ngay theo sản phẩm/đầu vào. Receipt kiểm tra mã/phiên bản/đầu vào trước hiển thị và lưu; phí cũ vô hiệu, B chưa lưu.', source:product },
]
const environment = `// Stage 2 embedding only; no business feature switches.
const match = window.location.pathname.match(/^\\/checkpoints\\/([^/]+)\\//)
export const checkpointId = match?.[1] ?? 's2-reference'
export const apiBase = '/api/checkpoints/' + checkpointId + '/quotations'
export const storageKey = 'quotation-workshop.stage2.checkpoint.' + checkpointId + '.v1'
export const workerOptions = { quiet: true, onUnhandledFrame: 'bypass' as const, serviceWorker: { url: '/mockServiceWorker.js?' + checkpointId, options: { scope: '/checkpoints/' + checkpointId + '/' } } }
`
function embed(path, code) {
  if (path === 'App.tsx') return code.replaceAll('createBrowserRouter', 'createHashRouter')
  if (path === 'main.tsx') return "import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n" + code.replace("worker.start({ quiet: true, onUnhandledFrame: 'bypass' })", 'worker.start(workerOptions)').replace("const { router } = await import('./App')", "mountTools()\n  const { router } = await import('./App')")
  if (path === 'api/quotations.ts' || path === 'mocks/handlers.ts') return "import { apiBase } from '../_workshop/environment'\n" + code.replaceAll("'/api/quotations/:id'", "apiBase + '/:id'").replaceAll('`/api/quotations/${', '`${apiBase}/${').replaceAll("'/api/quotations'", 'apiBase')
  if (path === 'mocks/storage.ts') return "import { storageKey } from '../_workshop/environment'\n" + code.replace("STORAGE_KEY = 'quotation-product.demo.v1'", 'STORAGE_KEY = storageKey')
  return code
}
// Keep all Preview 1 entries and bytes, append/rebuild only Preview 2.
manifest.checkpoints = manifest.checkpoints.slice(0, 4)
let previous = await runtime('s2-03-switch')
const first = Object.fromEntries(manifest.checkpoints.flatMap(cp => cp.files.map(file => [file.path, file.first])))
for (const [index, stage] of stages.entries()) {
  const order = index + 4
  const source = Object.fromEntries(Object.entries(stage.source).map(([path, code]) => [path, embed(path, code)]))
  source['_workshop/environment.ts'] = environment
  source['_workshop/tools.ts'] = await readFile(resolve(root, 'checkpoints/12/_workshop/tools.ts'), 'utf8')
  source['index.html'] = await readFile(resolve(root, 'checkpoints/12/index.html'), 'utf8')
  const entries = []
  for (const [path, code] of Object.entries(source).sort(([a], [b]) => a.localeCompare(b))) {
    const target = resolve(root, 'checkpoints', stage.id, path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, code, 'utf8')
    first[path] ??= stage.id
    entries.push({ path, sha256: sha(code), status: order === 0 || previous[path] === code ? 'unchanged' : previous[path] === undefined ? 'new' : 'modified', origin: path.startsWith('_workshop/') || path === 'index.html' ? 'workshop' : ['App.tsx','main.tsx','api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(path) ? 'adapted' : 'product', first: first[path], lastStep: order, scaffold: order === 0, lines: code.trimEnd().split('\n').length })
  }
  manifest.checkpoints.push({ id: stage.id, title: stage.title, ui: stage.ui, step: order, order, kind: 'ui', previous: manifest.checkpoints.at(-1).id, files: entries })
  previous = source
}
await mkdir(resolve(root, 'stage2'), { recursive: true })
await writeFile(resolve(root, 'stage2/manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('Preserved 4 Preview 1 checkpoints; materialized 3 Preview 2 checkpoints. No Stage 1 or learner edits.')
