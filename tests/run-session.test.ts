import { describe, expect, it } from 'vitest'
import { checkpoints } from '../src/workshop/catalog'
import { runPlan, scenarioIds, outcomeFlow } from '../src/workshop/run/model'
import { findSymbol } from '../src/workshop/source'
import { waitFor } from '../src/workshop/run/driver'

const checkpoint = (id: string) => checkpoints.find(cp => cp.id === id)!
describe('phiên chạy dùng khả năng thực của checkpoint', () => {
  it('Field A–F chỉ quan sát UI chỉ đọc, không có thao tác nhập hoặc gọi API', () => {
    const ids = ['01-field-contract','01-field-example','01-field-first','01-field-customer','01-field-asset','03-fields']
    ids.forEach((id, index) => {
      const plan = runPlan(checkpoint(id), 'field')
      expect(plan.supported).toBe(true)
      expect(plan.tasks.every(task => task.kind === 'inspect')).toBe(true)
      expect(plan.tasks[0].count).toBe([0,1,1,3,6,8][index])
    })
  })
  it('không nhầm có helper với form đã nối đủ luồng', () => {
    expect(runPlan(checkpoint('02-draft'), 'input').supported).toBe(false)
    expect(runPlan(checkpoint('02-inputs'), 'input').supported).toBe(true)
    expect(runPlan(checkpoint('04'), 'validation').supported).toBe(true)
    expect(runPlan(checkpoint('05-rules'), 'calculate').supported).toBe(false)
    expect(runPlan(checkpoint('03-summary'), 'calculate').supported).toBe(false)
    expect(runPlan(checkpoint('05'), 'calculate').supported).toBe(true)
    expect(runPlan(checkpoint('06-rules'), 'invalidate').supported).toBe(false)
    expect(runPlan(checkpoint('08'), 'save').supported).toBe(false)
    expect(runPlan(checkpoint('09'), 'save').supported).toBe(true)
  })
  it('mọi liên kết trong kịch bản hợp lệ trỏ về range thật tại đúng mốc', () => {
    for (const cp of checkpoints) for (const scenario of scenarioIds) {
      const plan = runPlan(cp, scenario)
      if (!plan.supported) continue
      for (const task of plan.tasks) for (const source of task.sources) expect(findSymbol(cp.id, source.file, source.symbol), `${cp.id} ${source.symbol}`).toBeDefined()
    }
  })
  it('retry luôn là thao tác chủ động, đường diễn giải lấy từ kết quả', () => {
    expect(runPlan(checkpoint('09'), 'save-retry').tasks.at(-1)?.manual).toBe(true)
    expect(outcomeFlow('save-error','saved',checkpoint('09'))?.path).toContain('receipt')
    expect(outcomeFlow('calculate','invalid',checkpoint('05'))?.path).not.toContain('premium')
  })
})
it('hủy chờ không nhận kết quả muộn và signal cũ không chạy lại', async () => {
  const controller = new AbortController()
  let value = false
  const waiting = waitFor(() => value || undefined, controller.signal)
  controller.abort(); value = true
  await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
  await expect(waitFor(() => true, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
})
