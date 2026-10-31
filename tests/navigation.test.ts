import { expect, it } from 'vitest'
import { checkpointFor, checkpoints, selectionForCheckpoint } from '../src/workshop/catalog'
import { lessons } from '../src/workshop/steps'
import { operationsFor, operationAt } from '../src/workshop/operations'
import { parseLocation, selectionAt, selectionHash } from '../src/workshop/navigation'

const legacyCheckpoints = [
  ['00', '00', '00'], ['01', '01'], ['02', '02'], ['03-fields', '03-summary', '03'],
  ['04-rules', '04'], ['05-rules', '05'], ['06-rules', '06'],
  ['07-contract', '07-client', '07'], ['08-storage', '08'], ['09', '09'],
  ['10-list', '10'], ['11', '11'], ['12', '12', '12'],
]

it('mọi hash legacy giữ đúng checkpoint và chuyển sang URL journey=2', () => {
  legacyCheckpoints.forEach((ids, step) => ids.forEach((checkpoint, sub) => {
    const selected = parseLocation(`#step=${step}&sub=${sub}&tab=source`)
    expect(checkpointFor(selected.step, selected.sub).id, `${step}.${sub}`).toBe(checkpoint)
    expect(selected.notice).not.toBe('')
    expect(selected.step).toBeLessThanOrEqual(6)
    const hash = selectionHash(selected)
    expect(new URLSearchParams(hash.slice(1)).get('journey')).toBe('2')
    expect(parseLocation(hash)).toEqual(selected)
  }))
})

it('mọi thao tác v2 và lựa chọn checkpoint roundtrip, không bị ánh xạ legacy lần hai', () => {
  for (const lesson of lessons) for (const operation of operationsFor(lesson.id)) {
    const selected = selectionAt(operation.step, operation.sub)
    expect(parseLocation(selectionHash(selected))).toEqual(selected)
    expect(checkpointFor(selected.step, selected.sub).id).toBe(operation.after.id)
    expect(parseLocation(`#journey=2&step=${operation.step}&sub=${operation.sub}&tab=build`).step).toBe(operation.step)
  }
  for (const cp of checkpoints) {
    const selected = selectionForCheckpoint(cp.id)
    expect(operationAt(selected.step, selected.sub, selected.mark).after.id, cp.id).toBe(cp.id)
  }
})

it('URL không hợp lệ báo rõ và không truy cập thao tác ngoài sáu bước', () => {
  for (const query of ['step=7', 'step=-1', 'step=1.5', 'step=2&sub=999']) {
    const selection = parseLocation('#journey=2&' + query)
    expect(selection.notice).not.toBe('')
    expect(selection.step).toBeGreaterThanOrEqual(0)
    expect(selection.step).toBeLessThanOrEqual(6)
    expect(operationsFor(selection.step)[selection.sub]).toBeDefined()
  }
})

it('mốc nhỏ giữ checkpoint/range khi roundtrip; URL không có mark giữ đích cũ', () => {
  for (const id of ['01-field-contract','01-field-example','01-field-first','01-field-customer','01-field-asset','03-fields','02-draft','02-inputs','03']) {
    const target = selectionForCheckpoint(id)
    const selection = selectionAt(target.step, target.sub, target.mark)
    expect(parseLocation(selectionHash(selection))).toEqual(selection)
    expect(operationAt(selection.step, selection.sub, selection.mark).after.id).toBe(id)
  }
  expect(operationAt(1, 2, parseLocation('#journey=2&step=1&sub=2').mark).after.id).toBe('03-fields')
  expect(parseLocation('#journey=2&step=1&sub=2&mark=missing').notice).toContain('Mốc nhỏ')
})

it('giữ mode runtime và vị trí flow khi roundtrip cùng code và preview', () => {
  const selected = {
    ...selectionAt(6), tab: 'overview' as const, overviewMode: 'runtime' as const,
    runtimeFlow: 'input-edit', runtimeEvent: 'input', side: 'before' as const, mode: 'mine' as const,
  }
  expect(parseLocation(selectionHash(selected))).toEqual(selected)
})
