import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { checkpoints } from '../src/workshop/catalog'
import { operationsFor, operationAt } from '../src/workshop/operations'
import { findSymbol, symbolsAt, sourceRows } from '../src/workshop/source'
import { parseLocation, selectionHash } from '../src/workshop/navigation'
import { lessons } from '../src/workshop/steps'

it('mọi thao tác dẫn tới file/symbol thật và phủ đủ checkpoint cùng các mốc nhỏ', () => {
  const operations = lessons.flatMap((lesson) => operationsFor(lesson.id))
  expect(lessons).toHaveLength(7)
  expect(checkpoints.length).toBeGreaterThanOrEqual(22)
  expect(new Set(operations.map((operation) => operation.id)).size).toBe(operations.length)
  const expanded = operations.flatMap(operation => [operation, ...operation.milestones.map(mark => operationAt(operation.step, operation.sub, mark.id))])
  expect(new Set(expanded.map((operation) => operation.after.id))).toEqual(
    new Set(checkpoints.map((cp) => cp.id)),
  )
  for (const operation of expanded) {
    expect(
      operation.after.files.some((file) => file.path === operation.file),
      operation.id,
    ).toBe(true)
    expect(
      findSymbol(operation.after.id, operation.file, operation.symbol),
      `${operation.id}: ${operation.file}#${operation.symbol}`,
    ).toBeDefined()
    if (operation.kind === 'observe')
      expect(operation.before.id).toBe(operation.after.id)
    if (operation.kind === 'create')
      expect(
        operation.before.files.some((file) => file.path === operation.file),
      ).toBe(false)
  }
})

it('range có số dòng gốc và giữ đủ body lồng nhau', () => {
  for (const cp of checkpoints)
    for (const file of cp.files) {
      const raw = readFileSync(`checkpoints/${cp.id}/${file.path}`, 'utf8')
      for (const range of symbolsAt(cp.id, file.path)) {
        const rows = sourceRows(raw, range, true)
        expect(rows[0].line).toBe(range.start)
        expect(rows.at(-1)?.line).toBe(range.end)
        expect(rows.map((row) => row.text).join('\n')).toBe(
          raw
            .split(/\r?\n/)
            .slice(range.start - 1, range.end)
            .join('\n'),
        )
      }
    }
  const range = findSymbol('11', 'pages/CreateQuotation.tsx', 'save')
  expect(range).toBeDefined()
  const code = sourceRows(
    readFileSync('checkpoints/11/pages/CreateQuotation.tsx', 'utf8'),
    range,
    true,
  )
    .map((row) => row.text)
    .join('\n')
  expect(code).toContain('catch (error)')
  expect(code).toContain('setSaving(false)')
  expect(code.trimEnd().endsWith('}')).toBe(true)
  expect(
    findSymbol('05', 'quotation/rules.ts', 'pricingInputsChanged'),
  ).toBeUndefined()
})

it('URL cũ ánh xạ hai tab và roundtrip không mất ngữ cảnh', () => {
  for (const tab of ['source', 'build', 'order', 'execute', 'guide'])
    expect(parseLocation(`#step=6&sub=1&tab=${tab}`).tab).toBe('build')
  const selected = parseLocation(
    '#step=5&sub=1&tab=source&file=quotation%2Frules.ts&symbol=pricingInputsChanged&side=before&mode=mine',
  )
  expect(parseLocation(selectionHash(selected))).toEqual(selected)
  expect(selected.symbol).toBe('pricingInputsChanged')
})
