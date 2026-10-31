import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { checkpoints, checkpointById } from '../src/workshop/catalog'
import { findSymbol, sectionsAt } from '../src/workshop/source'
import { rangeStatus, roleGroup, roleGroups, roleSections, sectionStatus, sourceKey } from '../src/workshop/FunctionalTree.model'

const sources = Object.fromEntries(checkpoints.flatMap(cp => cp.files.map(file => [
  sourceKey(cp.id, file.path), readFileSync(`checkpoints/${cp.id}/${file.path}`, 'utf8'),
])))

it('vai trò trong cây ánh xạ range thật và quan hệ tới symbol hiện tại hoặc đích cuối chặng', () => {
  for (const cp of checkpoints) for (const file of cp.files) {
    for (const section of roleSections(file.path, cp, false)) {
      expect(sectionsAt(cp.id, file.path)).toContainEqual(section)
      expect(roleGroups.map(group => group.id)).toContain(roleGroup(file.path, section))
      expect(section.ranges.length).toBeGreaterThan(0)
      expect(sectionStatus(cp, file.path, section, sources)).not.toBe('future')
      for (const range of section.ranges) {
        expect(findSymbol(cp.id, file.path, range.qualified)).toEqual(range)
        expect(rangeStatus(cp, file.path, range.qualified, sources)).toBeDefined()
      }
      for (const link of section.links)
        expect(findSymbol(cp.id, link.file, link.symbol) ?? findSymbol(checkpoints.at(-1)!.id, link.file, link.symbol), `${file.path}/${section.id} → ${link.file}#${link.symbol}`).toBeDefined()
    }
  }
})

it('trạng thái theo nội dung symbol, không gắn sửa cho mọi symbol trong file đổi', () => {
  const cp = checkpointById('06-rules')
  expect(cp.files.find(file => file.path === 'quotation/rules.ts')?.status).toBe('modified')
  expect(rangeStatus(cp, 'quotation/rules.ts', 'calculatePremium', sources)).toBe('available')
  expect(rangeStatus(cp, 'quotation/rules.ts', 'pricingInputsChanged', sources)).toBe('new')
  expect(rangeStatus(checkpointById('05'), 'quotation/rules.ts', 'pricingInputsChanged', sources)).toBe('future')
  expect(rangeStatus(checkpointById('06'), 'pages/CreateQuotation.tsx', 'updateDraft', sources)).toBe('modified')
  expect(rangeStatus(cp, 'quotation/rules.ts', 'calculatePremium', {})).toBeUndefined()
})

it('vai trò tương lai chỉ được thêm khi bật lựa chọn và vẫn mang range tại mốc hình thành', () => {
  const cp = checkpointById('05')
  const file = 'quotation/rules.ts'
  const present = roleSections(file, cp, false)
  const future = roleSections(file, cp, true)
  const invalidation = future.find(section => section.ranges.some(range => range.name === 'pricingInputsChanged'))
  expect(invalidation).toBeDefined()
  expect(present.map(section => section.id)).not.toContain(invalidation!.id)
  expect(sectionStatus(cp, file, invalidation!, sources)).toBe('future')
  expect(present.every(section => future.some(item => item.id === section.id))).toBe(true)
})
