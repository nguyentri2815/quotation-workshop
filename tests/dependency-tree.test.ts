import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { checkpointById, checkpoints } from '../src/workshop/catalog'
import { definitionsAt, relationsAt, relationSites, definitionKey, selectedDefinition } from '../src/workshop/dependency-tree.model'
import { dependencyEdges } from '../src/workshop/dependencies'
import { findSymbol, sourceRows } from '../src/workshop/source'
import { parseLocation, selectionHash } from '../src/workshop/navigation'

it('mỗi định nghĩa có một vị trí file/symbol, range khớp source ở mọi checkpoint', () => {
  for (const cp of checkpoints) {
    const entries = definitionsAt(cp)
    expect(new Set(entries.map(item => item.key)).size).toBe(entries.length)
    for (const item of entries) {
      expect(cp.files.some(file => file.path === item.file)).toBe(true)
      expect(item.key).toBe(definitionKey(item.file, item.symbol))
      expect(findSymbol(cp.id, item.file, item.symbol)).toEqual(item.range)
    }
  }
})

it('3.4: props dữ liệu, type Premium và bốn lời gọi formatMoney đều có vị trí nguồn thật', () => {
  const cp = checkpointById('03-summary'), definitions = definitionsAt(cp)
  const edges = relationsAt(cp, definitions, false)
  const props = edges.find(edge => edge.from === 'props' && edge.to === 'summary')!
  expect(props.kind).toBe('Truyền props')
  expect(props.source.file).toBe('pages/CreateQuotation.tsx')
  expect(props.target.file).toBe('components/PremiumSummary.tsx')
  expect(props.sites).toHaveLength(1)
  const type = edges.find(edge => edge.from === 'summary' && edge.to === 'premium-type')!
  expect(type.kind).toBe('Phụ thuộc type')
  expect(type.sites).toHaveLength(1)
  const format = edges.find(edge => edge.from === 'summary' && edge.to === 'format')!
  expect(format.sites).toHaveLength(4)
  const code = readFileSync(`checkpoints/${cp.id}/components/PremiumSummary.tsx`, 'utf8')
  expect(format.sites.map(site => sourceRows(code, findSymbol(cp.id, site.file, site.symbol), true).map(row => row.text).join('\n'))).toEqual([
    expect.stringContaining('formatMoney(premium.net)'), expect.stringContaining('formatMoney(premium.tax)'), expect.stringContaining('formatMoney(premium.total)'), expect.stringContaining('formatMoney(premium.installmentAmount)'),
  ])
})

it('liên kết chỉ hình thành khi có tham chiếu thật, không dựa vào scaffold cùng tên', () => {
  const price = dependencyEdges.find(edge => edge.from === 'calculate' && edge.to === 'price')!
  expect(relationSites(checkpointById('03-summary'), price)).toEqual([])
  expect(relationSites(checkpointById('05'), price)).toHaveLength(1)
  const cp = checkpointById('03-summary')
  expect(relationsAt(cp, definitionsAt(cp, true), false).some(edge => edge.from === 'calculate' && edge.to === 'price')).toBe(false)
  expect(relationsAt(cp, definitionsAt(cp, true), true).find(edge => edge.from === 'calculate' && edge.to === 'price')?.birth?.id).toBe('05')
})

it('URL canvas cũ về đúng file/symbol; URL quan hệ và vị trí code roundtrip', () => {
  for (const id of ['props','summary','premium-type','format','button','calculate']) {
    const value = parseLocation(`#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyNode=${id}`)
    expect(findSymbol('05', value.file, value.symbol), id).toBeDefined()
    expect(parseLocation(selectionHash(value))).toEqual(value)
  }
  const value = parseLocation('#journey=2&step=3&sub=3&tab=build&buildView=dependencies&file=quotation%2Fformat.ts&symbol=formatMoney&dependencyNode=quotation%2Fformat.ts%23formatMoney&dependencyRelation=summary~Gọi~format&dependencyLocation=2')
  expect(value.dependencyLocation).toBe(2)
  expect(parseLocation(selectionHash(value))).toEqual(value)
})

it('giữ symbol tương lai được yêu cầu và chọn file rỗng không nhảy sang định nghĩa khác', () => {
  const cp = checkpointById('05-rules'), definitions = definitionsAt(cp, true)
  const requested = selectedDefinition(definitions, { file: 'components/PremiumSummary.tsx', symbol: 'PremiumSummary', dependencyNode: '' }, cp)
  expect(requested?.node?.id).toBe('summary')
  expect(requested?.actual).toBe(false)
  expect(selectedDefinition(definitions, { file: 'components/PremiumSummary.tsx', symbol: '', dependencyNode: '' }, cp)).toBeUndefined()
  expect(selectedDefinition(definitions, { file: 'components/PremiumSummary.tsx', symbol: 'missing', dependencyNode: '' }, cp)).toBeUndefined()
})

it('submit gọi save và dialog reset/proceed có từng range thực trong source cuối chặng', () => {
  const cp = checkpointById('11')
  const submit = dependencyEdges.find(edge => edge.from === 'submit' && edge.to === 'save')!
  const dialog = dependencyEdges.find(edge => edge.from === 'dialog' && edge.to === 'blocker')!
  expect(relationSites(cp, submit)).toHaveLength(1)
  const sites = relationSites(cp, dialog)
  expect(sites).toHaveLength(3)
  expect(sites.map(site => findSymbol(cp.id, site.file, site.symbol)?.name)).toEqual(['blocker.reset()', 'blocker.reset()', 'blocker.proceed()'])
})
