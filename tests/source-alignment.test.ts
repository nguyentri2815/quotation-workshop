import { expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { checkpoints } from '../src/workshop/catalog'
import { sectionsAt, symbolsAt, diffRows, sourceRows } from '../src/workshop/source'
import { parseLocation, selectionHash } from '../src/workshop/navigation'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
function files(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(path, entry.name)) : [resolve(path, entry.name)])
}
it('source runtime cuối chặng có đúng cây sản phẩm và khác biệt nhúng hữu hạn', () => {
  const product = resolve(root, '../quotation-product/src')
  const paths = files(product).filter(path => !path.includes('.test.')).map(path => relative(product, path).replaceAll('\\', '/')).sort()
  const last = checkpoints.at(-1)!
  expect(last.files.filter(file => file.origin !== 'workshop').map(file => file.path).sort()).toEqual(paths)
  expect(paths).toHaveLength(18)
  for (const path of paths) {
    const original = readFileSync(resolve(product, path), 'utf8')
    expect(read('sample/product/' + path), path).toBe(original)
    let sample = read('checkpoints/12/' + path)
    // Independently reverse the five disclosed adapter surfaces.
    if (path === 'App.tsx') sample = sample.replaceAll('createHashRouter', 'createBrowserRouter')
    if (path === 'main.tsx') sample = sample.replace("import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n", '').replace('worker.start(workerOptions)', "worker.start({ quiet: true, onUnhandledFrame: 'bypass' })").replace("mountTools()\n  const { router }", 'const { router }')
    if (path === 'api/quotations.ts' || path === 'mocks/handlers.ts') sample = sample.replace("import { apiBase } from '../_workshop/environment'\n", '').replaceAll("apiBase + '/:id'", "'/api/quotations/:id'").replaceAll('`${apiBase}/${', '`/api/quotations/${').replaceAll('apiBase', "'/api/quotations'")
    if (path === 'mocks/storage.ts') sample = sample.replace("import { storageKey } from '../_workshop/environment'\n", '').replace('STORAGE_KEY = storageKey', "STORAGE_KEY = 'quotation-product.demo.v1'")
    expect(sample, path).toBe(original)
    expect(read('src/reference/' + path), path).toBe(read('checkpoints/12/' + path))
  }
})
it('mọi nhóm phân tích thuộc đúng hash và range có thật; trạng thái/handler/JSX không trỏ cả component', () => {
  for (const cp of checkpoints) for (const file of cp.files) {
    const raw = read(`checkpoints/${cp.id}/${file.path}`)
    expect(sha(raw)).toBe(file.sha256)
    for (const section of sectionsAt(cp.id, file.path)) {
      expect(section.ranges.length).toBeGreaterThan(0)
      for (const range of section.ranges) {
        expect(symbolsAt(cp.id, file.path)).toContainEqual(range)
        expect(range.start).toBeGreaterThan(0)
        expect(range.end).toBeLessThanOrEqual(raw.split('\n').length)
      }
      for (const link of section.links)
        expect([...symbolsAt(cp.id, link.file), ...symbolsAt('12', link.file)].some(range => range.qualified === link.symbol || range.name === link.symbol), `${file.path} → ${link.file}#${link.symbol}`).toBe(true)
    }
  }
  const form = sectionsAt('11', 'pages/CreateQuotation.tsx')
  for (const id of ['draft', 'errors', 'premium', 'saving', 'can-save', 'calculate', 'save', 'request', 'customer', 'asset', 'period', 'actions', 'dialog', 'leave']) {
    const section = form.find(item => item.id === id)
    expect(section, id).toBeDefined()
    expect(section?.ranges.every(range => range.end - range.start < 90), id).toBe(true)
  }
  expect(sectionsAt('09', 'pages/CreateQuotation.tsx').some(item => item.id === 'leave')).toBe(false)
  expect(sectionsAt('04', 'quotation/rules.ts').some(item => item.id === 'price')).toBe(false)
})
it('toàn file và diff có đầy đủ ngữ cảnh; URL cũ và vị trí analysis roundtrip', () => {
  const before = read('checkpoints/09/pages/CreateQuotation.tsx')
  const after = read('checkpoints/11/pages/CreateQuotation.tsx')
  expect(sourceRows(after)[0].line).toBe(1)
  const rows = diffRows('CreateQuotation.tsx', before, after)
  expect(rows.find(row => row.oldLine === 1)).toBeDefined()
  expect(rows.find(row => row.newLine === after.trimEnd().split('\n').length)).toBeDefined()
  for (const old of ['PracticeApp.tsx', 'components/PremiumPanel.tsx', 'components/FormFields.tsx']) {
    const selection = parseLocation('#step=11&tab=source&file=' + encodeURIComponent(old))
    expect(selection.notice).toContain(old)
    expect(selection.file).not.toBe(old)
    expect(parseLocation(selectionHash(selection))).toEqual(selection)
  }
  const selection = parseLocation('#step=11&tab=build&file=pages/CreateQuotation.tsx&section=actions&position=2&side=before')
  expect(parseLocation(selectionHash(selection))).toEqual(selection)
  expect(parseLocation('#file=does-not-exist.ts').file).toBe('does-not-exist.ts')
})
