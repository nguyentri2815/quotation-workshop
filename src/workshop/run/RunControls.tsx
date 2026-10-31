import { Play, Pause, SkipForward, RotateCcw, X } from 'lucide-react'
import type { RunController } from './useRunSession'
import styles from './run.module.css'

export function RunToolbar({ controller }: { controller: RunController }) {
  const run = controller.session!
  const playing = ['loading','running','waiting'].includes(run.status)
  return <nav className={styles.bar} aria-label="Điều khiển phiên chạy">
    <button onClick={controller.play} disabled={run.status === 'done'} aria-label={playing ? 'Tạm dừng' : 'Chạy'}>{playing ? <Pause aria-hidden /> : <Play aria-hidden />}<span>{playing ? 'Tạm dừng' : 'Chạy'}</span></button>
    <button onClick={controller.step} disabled={['loading','done'].includes(run.status)} aria-label={run.status === 'failed' ? 'Quan sát lại bước lỗi' : 'Tiếp bước'}><SkipForward aria-hidden /><span>{run.status === 'failed' ? 'Quan sát lại' : 'Tiếp bước'}</span></button>
    <button onClick={controller.restart} aria-label="Chạy lại phiên"><RotateCcw aria-hidden /><span>Chạy lại</span></button>
    <button onClick={controller.exit} aria-label="Thoát phiên chạy"><X aria-hidden /><span>Thoát</span></button>
    <strong>Bước trình diễn {run.index + 1}/{run.plan.tasks.length}</strong>
    <select aria-label="Tốc độ trình diễn" value={run.speed} onChange={event => controller.speed(Number(event.target.value))}><option value={.75}>0,75×</option><option value={1}>1×</option><option value={2}>2×</option></select>
  </nav>
}
export function RunPreview({ controller }: { controller: RunController }) {
  const run = controller.session!
  return <div className={styles.runPreview}><div className={styles.previewHeader}><strong>Phiên riêng · {run.plan.checkpoint.id}</strong><span>{run.mode === 'demo' ? 'Xem chạy mẫu' : 'Tự thao tác'}</span><small>{run.id.slice(0, 8)}</small></div><iframe key={run.id} ref={frame => { if (frame) void controller.attach(frame) }} title={`Phiên chạy mẫu ${run.plan.checkpoint.id}`} src={`/checkpoints/${run.plan.checkpoint.id}/index.html?workshopRun=${run.id}#/quotations/new`} onLoad={event => void controller.attach(event.currentTarget)} /></div>
}
