import { useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { operationsFor } from './operations'
import type { Milestone } from './milestones'
import styles from './workshop.module.css'

export function SubstepProgress({ step, sub, onAction, marks = [], currentMark = '', onMark, actions, steps = 7 }: { step: number; sub: number; onAction: (step: number, sub: number) => void; marks?: Milestone[]; currentMark?: string; onMark?: (id: string) => void; actions?: Array<Array<{id:string;sub:number;title:string}>>; steps?: number }) {
  const items = actions?.[step] ?? operationsFor(step)
  const markIndex = Math.max(0, marks.findIndex(mark => mark.id === currentMark))
  const strip = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const host = strip.current, item = host?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!host || !item) return
    const reveal = (center = false) => {
      if (!host.clientWidth) return
      const bounds = host.getBoundingClientRect(), target = item.getBoundingClientRect()
      if (center) host.scrollLeft += target.left - bounds.left - (host.clientWidth - target.width) / 2
      else if (target.left < bounds.left) host.scrollLeft += target.left - bounds.left
      else if (target.right > bounds.right) host.scrollLeft += Math.min(target.right - bounds.right, target.left - bounds.left)
    }
    reveal(true)
    const observer = new ResizeObserver(() => reveal())
    observer.observe(host)
    return () => observer.disconnect()
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
    {marks.length > 0 && <div className={styles.milestonePicker}><select aria-label="Mốc nhỏ trong sub-step" value={marks[markIndex].id} onChange={event => onMark?.(event.target.value)}>{marks.map((mark, index) => <option key={mark.id} value={mark.id}>{String.fromCharCode(65 + index)}. {mark.title}</option>)}</select><button aria-label="Mốc nhỏ tiếp" title="Mốc nhỏ tiếp" disabled={markIndex === marks.length - 1} onClick={() => onMark?.(marks[markIndex + 1].id)}>›</button></div>}
    <div className={styles.substepControls}><button aria-label="Sub-step trước" disabled={step === 0 && sub === 0} onClick={() => sub > 0 ? onAction(step, sub - 1) : onAction(step - 1, (actions?.[step-1] ?? operationsFor(step - 1)).length - 1)}><ChevronLeft aria-hidden /><span>Trước</span></button><b aria-label="Vị trí sub-step">{sub + 1}/{items.length}</b><button aria-label="Sub-step tiếp" disabled={step === steps - 1 && sub === items.length - 1} onClick={() => sub < items.length - 1 ? onAction(step, sub + 1) : onAction(step + 1, 0)}><span>Tiếp</span><ChevronRight aria-hidden /></button></div>
  </nav>
}
