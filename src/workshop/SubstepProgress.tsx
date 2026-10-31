import { useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { operationsFor } from './operations'
import styles from './workshop.module.css'

export function SubstepProgress({ step, sub, onAction }: { step: number; sub: number; onAction: (step: number, sub: number) => void }) {
  const items = operationsFor(step)
  const strip = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const host = strip.current, item = host?.querySelector<HTMLElement>('[aria-current="step"]')
    if (host && item) host.scrollLeft = item.offsetLeft - host.offsetLeft - (host.clientWidth - item.clientWidth) / 2
  }, [step, sub])
  return <nav className={styles.substepProgress} aria-label="Tiến trình sub-step">
    <div className={styles.actionStrip} ref={strip} aria-label="Thao tác trong bước" onKeyDown={event => {
      const current = Number((event.target as HTMLElement).closest('button')?.dataset.sub)
      if (!Number.isInteger(current)) return
      const next = event.key === 'ArrowRight' ? Math.min(items.length - 1, current + 1) : event.key === 'ArrowLeft' ? Math.max(0, current - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : undefined
      if (next !== undefined) { event.preventDefault(); onAction(step, next); strip.current?.querySelector<HTMLButtonElement>(`[data-sub="${next}"]`)?.focus() }
    }}>
      {items.map(action => <button key={action.id} data-sub={action.sub} aria-label={`${action.id} ${action.title}`} aria-current={action.sub === sub ? 'step' : undefined} aria-pressed={action.sub === sub} onClick={() => onAction(step, action.sub)}><b>{action.id}</b><span>{action.title}</span>{action.sub === sub && <small>Đang xem</small>}</button>)}
    </div>
    <div className={styles.substepControls}><span title="Trình tự hướng dẫn; không phải runtime flow hoặc dependency bắt buộc">Trình tự học</span><button aria-label="Sub-step trước" disabled={sub === 0} onClick={() => onAction(step, sub - 1)}><ChevronLeft /></button><b aria-label="Vị trí sub-step">{sub + 1}/{items.length}</b><button aria-label="Sub-step tiếp" disabled={sub === items.length - 1} onClick={() => onAction(step, sub + 1)}><ChevronRight /></button></div>
  </nav>
}
