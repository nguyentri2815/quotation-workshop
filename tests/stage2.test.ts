import { expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { stageTwoCheckpoints, stageTwoNodes, stageTwoRunPlan, nodeAvailable } from '../src/stage2/catalog'
import { checkpoints } from '../src/workshop/catalog'
import { findSymbol, symbolsAt } from '../src/workshop/source'
import { revisionCheckpoints } from '../src/stage2/archive/revision'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
function files(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)]) }
function unembed(path: string, code: string) {
  if (path === 'App.tsx') return code.replaceAll('createHashRouter', 'createBrowserRouter')
  if (path === 'main.tsx') return code.replace("import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n", '').replace('worker.start(workerOptions)', "worker.start({ quiet: true, onUnhandledFrame: 'bypass' })").replace("mountTools()\n  const { router }", 'const { router }')
  if (path === 'api/quotations.ts' || path === 'mocks/handlers.ts') return code.replace("import { apiBase } from '../_workshop/environment'\n", '').replaceAll("apiBase + '/:id'", "'/api/quotations/:id'").replaceAll('`${apiBase}/${', '`/api/quotations/${').replaceAll('apiBase', "'/api/quotations'")
  if (path === 'mocks/storage.ts') return code.replace("import { storageKey } from '../_workshop/environment'\n", '').replace('STORAGE_KEY = storageKey', "STORAGE_KEY = 'quotation-product.demo.v1'")
  return code
}

it('Chặng 2 độc lập: bốn mốc/ID riêng, source hash và range đúng file chạy', () => {
  expect(stageTwoCheckpoints).toHaveLength(7)
  const pinned = JSON.parse(read('stage2/preview1-baseline.json'))
  expect(stageTwoCheckpoints.slice(0, 4)).toEqual(pinned.checkpoints)
  for (const cp of revisionCheckpoints) {
    expect(checkpoints.some(old => old.id === cp.id)).toBe(false)
    for (const file of cp.files) {
      const code = read(`checkpoints/${cp.id}/${file.path}`)
      expect(sha(code)).toBe(file.sha256)
      for (const range of symbolsAt(cp.id, file.path)) {
        expect(range.start).toBeGreaterThan(0)
        expect(range.end).toBeLessThanOrEqual(code.split('\n').length)
      }
    }
  }
})

it('mốc 0 xuất phát đúng source Chặng 1; mốc cuối khớp toàn bộ Product qua adapter công khai', () => {
  const productRoot = resolve(root, '../quotation-product/src')
  const paths = files(productRoot).filter(path => !path.includes('.test.')).map(path => relative(productRoot, path).replaceAll('\\', '/')).sort()
  const last = revisionCheckpoints.at(-1)!
  expect(last.files.filter(file => file.origin !== 'workshop').map(file => file.path).sort()).toEqual(paths)
  for (const path of paths) expect(unembed(path, read(`checkpoints/${last.id}/${path}`)), path).toBe(readFileSync(resolve(productRoot, path), 'utf8'))
  const pinned: Array<{ path: string }> = JSON.parse(read('sample/product-source.json').replace(/^\uFEFF/, ''))
  for (const { path } of pinned) expect(unembed(path, read(`checkpoints/s2-00/${path}`)), path).toBe(read('sample/product/' + path))
})

it('catalog dùng ngay ở 1.1; state/selector từ 1.2; vô hiệu phí chỉ ở 1.3, quan hệ có range thật', () => {
  const [base, catalog, selection, switched] = stageTwoCheckpoints
  expect(findSymbol(catalog.id, 'pages/CreateQuotation.tsx', 'CreateQuotation.props.ProductInformation')).toBeDefined()
  const selector = stageTwoNodes.find(node => node.id === 'selector')!, invalidate = stageTwoNodes.find(node => node.id === 'invalidate')!
  expect(nodeAvailable(base, selector)).toBe(false)
  expect(nodeAvailable(catalog, selector)).toBe(false)
  expect(nodeAvailable(selection, selector)).toBe(true)
  expect(nodeAvailable(selection, invalidate)).toBe(false)
  expect(nodeAvailable(switched, invalidate)).toBe(true)
  expect(new Set(stageTwoNodes.map(node => node.file + '#' + node.symbol)).size).toBe(stageTwoNodes.length)
  for (const node of stageTwoNodes) {
    expect(nodeAvailable(stageTwoCheckpoints.at(-1)!, node), node.id).toBe(true)
    if (node.since > 3) expect(nodeAvailable(switched, node)).toBe(false)
    for (const edge of node.links) expect(stageTwoNodes.some(target => target.id === edge.to)).toBe(true)
  }
})

it('phiên mẫu chỉ thao tác phần đã hình thành và mọi link source thuộc đúng mốc', () => {
  for (const cp of stageTwoCheckpoints) {
    const plan = stageTwoRunPlan(cp)
    expect(plan.tasks.some(task => task.kind === 'switch-product')).toBe(cp.order >= 2)
    expect(plan.tasks.some(task => task.kind === 'calculate')).toBe(cp.order !== 2)
    for (const task of plan.tasks) {
      expect(task.sources.length).toBeGreaterThan(0)
      for (const link of task.sources) expect(findSymbol(cp.id, link.file, link.symbol)).toBeDefined()
    }
  }
})
