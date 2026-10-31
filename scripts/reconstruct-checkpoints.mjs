import { readFile, readdir, mkdir, writeFile, unlink } from 'node:fs/promises'
import { resolve, relative, dirname, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { checkpointPlan, substepCheckpoints, microstepCheckpoints } from './checkpoint-plan.mjs'
import { stageForm, stageRules, adapt, environment, toolsSource, placeholderPage, saveAcknowledgment, pendingHandlers } from './sample-source.mjs'

import { fieldStage, draftStage } from './presentation-stages.mjs'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'checkpoints')
const hash = code => createHash('sha256').update(code).digest('hex')
async function walk(dir) {
  try { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)]))).flat() }
  catch (error) { if (error.code === 'ENOENT') return []; throw error }
}
async function put(base, path, code) {
  const target = resolve(base, path)
  if (!target.startsWith(base + sep)) throw new Error('Outside sample output')
  await mkdir(dirname(target), { recursive: true })
  let old
  try { old = await readFile(target, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (old !== code) await writeFile(target, code, 'utf8')
}
const pinned = JSON.parse((await readFile(resolve(root, 'sample/product-source.json'), 'utf8')).replace(/^\uFEFF/, ''))
const product = new Map()
for (const item of pinned) {
  const code = await readFile(resolve(root, 'sample/product', item.path), 'utf8')
  if (hash(code) !== item.sha256) throw new Error('Pinned product changed: ' + item.path)
  product.set(item.path, code)
}
const html = '<!doctype html>\n<html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Checkpoint mẫu · Bản chào</title></head><body><div id="root">Đang khởi động checkpoint…</div><script type="module" src="./main.tsx"></script></body></html>\n'
const introduced = new Map(), modified = new Map(), manifest = []
let previous = new Map()
for (const [order, checkpoint] of checkpointPlan.entries()) {
  const { id, step } = checkpoint
  const current = new Map(product)
  if (step === 0) current.set('App.tsx', product.get('App.tsx').replace('Quotation<small>', 'Khung mẫu<small>'))
  if (step < 2) current.set('quotation/types.ts', 'export {}\n')
  if (order < checkpointPlan.findIndex(cp => cp.id === '03-summary')) current.delete('components/PremiumSummary.tsx')
  current.set('pages/CreateQuotation.tsx', stageForm(product.get('pages/CreateQuotation.tsx'), checkpoint.formStage, { summary: order >= checkpointPlan.findIndex(cp => cp.id === '03-summary') }))
  if (checkpoint.fieldStage) current.set('pages/CreateQuotation.tsx', fieldStage(current.get('pages/CreateQuotation.tsx'), checkpoint.fieldStage))
  if (checkpoint.draftStage) current.set('pages/CreateQuotation.tsx', draftStage(current.get('pages/CreateQuotation.tsx'), checkpoint.draftStage))
  current.set('quotation/rules.ts', stageRules(product.get('quotation/rules.ts'), checkpoint.rulesStage))
  if (order < checkpointPlan.findIndex(cp => cp.id === '07-client')) current.set('api/quotations.ts', 'export {}\n')
  if (order < checkpointPlan.findIndex(cp => cp.id === '08-storage')) current.set('mocks/storage.ts', 'export {}\n')
  if (order < checkpointPlan.findIndex(cp => cp.id === '08')) current.set('mocks/handlers.ts', pendingHandlers)
  if (order < checkpointPlan.findIndex(cp => cp.id === '10-list')) current.set('pages/QuotationList.tsx', placeholderPage('QuotationList', 'Danh sách chưa được xây'))
  if (order < checkpointPlan.findIndex(cp => cp.id === '10')) current.set('pages/QuotationDetail.tsx', order >= checkpointPlan.findIndex(cp => cp.id === '09') ? saveAcknowledgment : placeholderPage('QuotationDetail', 'Trang chi tiết chưa được xây'))
  for (const [path, code] of current) current.set(path, adapt(path, code))
  current.set('_workshop/environment.ts', environment)
  current.set('_workshop/tools.ts', toolsSource(order >= checkpointPlan.findIndex(cp => cp.id === '07')))
  current.set('index.html', html)
  const files = [...current].sort(([a], [b]) => a.localeCompare(b)).map(([path, code]) => {
    const old = previous.get(path)
    const status = order === 0 ? 'unchanged' : old === undefined ? 'new' : old !== code ? 'modified' : 'unchanged'
    if (!introduced.has(path)) introduced.set(path, id)
    if (status !== 'unchanged' || order === 0) modified.set(path, step)
    return { path, status, sha256: hash(code), first: introduced.get(path), lastStep: modified.get(path), scaffold: introduced.get(path) === '00', origin: path.startsWith('_workshop/') || path === 'index.html' ? 'workshop' : ['App.tsx', 'main.tsx', 'api/quotations.ts', 'mocks/handlers.ts', 'mocks/storage.ts'].includes(path) ? 'adapted' : 'product', lines: code.split('\n').length }
  })
  const base = resolve(output, id)
  for (const old of await walk(base)) {
    if (!old.startsWith(base + sep)) throw new Error('Invalid stale path')
    if (!current.has(relative(base, old).replaceAll('\\', '/'))) await unlink(old)
  }
  for (const [path, code] of current) await put(base, path, code)
  manifest.push({ ...checkpoint, order, previous: order === 0 ? null : checkpointPlan[order - 1].id, files })
  previous = current
}
await put(output, 'manifest.json', JSON.stringify({ version: 2, provenance: 'Tái dựng theo source sản phẩm đã ghim; không phải lịch sử Git. Scaffold có sẵn được khai báo từ 00.', substepCheckpoints, microstepCheckpoints, checkpoints: manifest }, null, 2) + '\n')
const reference = resolve(root, 'src/reference')
for (const [path, code] of product) await put(reference, path, adapt(path, code))
await put(reference, '_workshop/environment.ts', environment)
await put(reference, '_workshop/tools.ts', toolsSource(false))
console.log(`Reconstructed ${manifest.length} checkpoints and reference from ${product.size} pinned product files. src/practice and starter untouched.`)
