import { useState } from 'react'
import type { ReactNode } from 'react'
import type { RunMode, RunPlan } from './model'
import { stepRunPlan, stepRunVariants } from './step-plans'

/** Lives inside the existing Chạy thử drawer; no persistent toolbar. */
export function RunScopePicker({
  stage,
  step,
  current,
  children,
  onRun,
}: {
  stage: number
  step: number
  current: RunPlan
  children: ReactNode
  onRun: (plan: RunPlan, mode: RunMode) => void
}) {
  const [scope, setScope] = useState('sub'),
    [variant, setVariant] = useState('success')
  const variants = stepRunVariants(stage, step)
  const selectedVariant = variants.some(([id]) => id === variant) ? variant : variants[0][0]
  const whole = stepRunPlan(stage, step, selectedVariant),
    plan = scope === 'step' ? whole : current
  return (
    <section aria-label="Chọn phiên chạy có quan sát">
      <label>
        Phạm vi chạy thử
        <select
          aria-label="Phạm vi chạy thử"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="sub">Sub-step hiện tại</option>
          <option value="step">{whole.title}</option>
        </select>
      </label>
      {scope === 'sub'
        ? children
        : variants.length > 1 && (
            <label>
              Hành trình
              <select
                aria-label="Hành trình cả bước"
                value={selectedVariant}
                onChange={(e) => setVariant(e.target.value)}
              >
                {variants.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
      <p>
        <b>{scope === 'step' ? plan.title : 'Sub-step hiện tại'}</b> · Checkpoint sẽ chạy:{' '}
        <code>{plan.checkpoint.id}</code>
      </p>
      <p role="status">{plan.reason}</p>
      <button disabled={!plan.supported} onClick={() => onRun(plan, 'demo')}>
        Xem chạy mẫu
      </button>
      <button disabled={!plan.supported} onClick={() => onRun(plan, 'guided')}>
        Tự thao tác có hướng dẫn
      </button>
      <p>
        DOM/MSW là quan sát thật; hàm/state/render là diễn giải source. Retry cần bạn chủ động bấm.
        Không tự tăng tiến độ.
      </p>
    </section>
  )
}
