import { describe, expect, it } from 'vitest'
import { stepRunPlan, stepRunVariants, validateStepPlan } from '../src/workshop/run/step-plans'
import { runPlan } from '../src/workshop/run/model'
import { checkpoints } from '../src/workshop/catalog'
import { runtimeFlows } from '../src/workshop/runtime-flows'
import { runtimeAdapter } from '../src/stage2/workspace-flows'

describe('shared step journeys', () => {
  for (const stage of [1, 2])
    for (let step = 0; step < (stage === 1 ? 7 : 5); step++) {
      for (const [variant] of stepRunVariants(stage, step))
        it(`${stage}/${step}/${variant}: output, sub-step, source, capability references`, () => {
          const plan = stepRunPlan(stage, step, variant)
          expect(validateStepPlan(plan)).toEqual([])
          const flows = stage === 1 ? runtimeFlows : runtimeAdapter(plan.checkpoint).flows
          for (const segment of plan.journey!.segments)
            if (segment.flow) expect(flows.some((f) => f.id === segment.flow)).toBe(true)
          expect(plan.supported).toBe(!(stage === 1 && step === 0))
          if (plan.supported) expect(plan.tasks.length).toBeGreaterThan(0)
        })
    }
  it('catalog is a continuous A → real navigation → B journey before panel/validation/save', () => {
    const plan = stepRunPlan(2, 1)
    expect(plan.checkpoint.id).toBe('s2-r4-entry')
    expect(plan.journey!.segments[1].flow).toBe('product')
    expect(plan.journey!.segments[3].flow).toBe('product')
    expect(stepRunPlan(2, 2).journey!.segments[1].flow).toBe('product')
    expect(plan.tasks.map((t) => t.kind)).toEqual([
      'inspect-catalog',
      'open-product',
      'back-products',
      'open-product',
    ])
    expect(plan.tasks.filter((t) => t.kind === 'open-product').map((t) => t.value)).toEqual([
      'BASIC_PROPERTY',
      'EXTENDED_PROPERTY',
    ])
    expect(plan.journey!.segments[0].builtAt.some((l) => l.foundation)).toBe(true)
    expect(plan.tasks.some((t) => ['save', 'calculate', 'switch-product'].includes(t.kind))).toBe(
      false,
    )
  })
  it('early steps never borrow later capabilities and sub-step plans stay independent', () => {
    for (const [stage, step] of [
      [1, 1],
      [1, 2],
      [2, 1],
    ])
      expect(
        stepRunPlan(stage, step).tasks.some((t) => ['calculate', 'save', 'retry'].includes(t.kind)),
      ).toBe(false)
    expect(stepRunPlan(2, 2).tasks.some((t) => ['save', 'retry'].includes(t.kind))).toBe(false)
    expect(stepRunPlan(2, 3).tasks.some((t) => ['save', 'retry'].includes(t.kind))).toBe(false)
    const old = runPlan(checkpoints.find((cp) => cp.id === '05')!, 'calculate')
    expect(old.journey).toBeUndefined()
    expect(old.tasks.map((t) => t.kind)).toEqual(['fill', 'calculate'])
  })
  it('rejects broken learning and checkpoint references', () => {
    const plan = structuredClone(stepRunPlan(2, 1))
    plan.journey!.segments[0].builtAt[0].symbol = 'does-not-exist'
    plan.journey!.outputCheckpoint = 's2-r4-complete'
    expect(validateStepPlan(plan).length).toBeGreaterThan(1)
    plan.journey!.segments[0].builtAt[0].sub = 999
    expect(validateStepPlan(plan).some((e) => e.includes('Sub-step'))).toBe(true)
    expect(stepRunPlan(2, 1, 'retry').supported).toBe(false)
    expect(() => stepRunPlan(3, 1)).toThrow('chưa có bộ hành trình')
  })
})
