import { useRef } from 'react'
import { Copy, Settings2, Workflow, Hammer } from 'lucide-react'
import type { WorkMode } from './useSplitLayout'
import styles from './workshop.module.css'
import { StageSwitch } from './StageSwitch'

export function WorkshopHeader({ title, context, tab, onOverview, onBuild, flowLabel, onReturn, workMode, onWorkMode, collapsed, onToggle, onPreset, onCopy, completed, running = false, stage = 1, total = 6 }: {
  title: string; context: string; tab: 'build' | 'overview'; onOverview: () => void; onBuild: () => void
  flowLabel?: string; onReturn: () => void; workMode: WorkMode; onWorkMode: (mode: WorkMode) => void
  collapsed: boolean; onToggle: () => void; onPreset: (value: string) => void; onCopy: () => void; completed: number
  running?: boolean
  stage?: 1 | 2; total?: number
}) {
  const options = useRef<HTMLDialogElement>(null)
  return <header className={styles.appHeader}>
    <div className={styles.appBrand}><span>Q</span><StageSwitch stage={stage} disabled={running} /><button disabled={running} aria-label="Hành trình phát triển" title="Hành trình phát triển" onClick={() => window.dispatchEvent(new CustomEvent('workshop:evolution'))}>Hành trình</button></div>
    <div className={styles.appTitle}><p>{context}</p><div><h1 id="workspace-title" tabIndex={-1} title={title}>{title}</h1>{flowLabel && tab === 'build' && <button onClick={onReturn} aria-label={`Quay lại flow ${flowLabel}`} title={`Quay lại ${flowLabel}, giữ sự kiện và lịch sử`}>← Quay lại flow</button>}</div></div>
    <div className={styles.appTabs} role="tablist" aria-label="Nội dung học">
      <button role="tab" aria-selected={tab === 'overview'} onClick={onOverview}><Workflow aria-hidden />{running ? 'Flow phiên chạy' : 'Tổng thể'}</button>
      <button role="tab" aria-selected={tab === 'build'} onClick={onBuild}><Hammer aria-hidden />{running ? 'Code liên quan' : 'Xây từng bước'}</button>
    </div>
    <div className={styles.workMode}>
      <select aria-label="Chế độ làm việc" value={workMode} onChange={event => onWorkMode(event.target.value as WorkMode)}>
        <option value="compare">Đối chiếu</option><option value="code">Đọc code</option><option value="preview">Thử giao diện</option>
      </select>
      <button aria-label="Tùy chọn bố cục" onClick={() => options.current?.showModal()}><Settings2 aria-hidden /></button>
    </div>
    <div className={styles.appProgress}><label htmlFor="progress">{completed}/{total} bước đã tự kiểm tra</label><progress id="progress" max={total} value={completed} /></div>
    <dialog ref={options} className={styles.taskDrawer} aria-label="Tùy chọn bố cục">
      <header><strong>Bố cục vùng làm việc</strong><button autoFocus onClick={() => options.current?.close()}>Đóng tùy chọn bố cục</button></header>
      <p>Chế độ chỉ đổi diện tích đọc. Có thể kéo thanh chia tự do hoặc dùng phím trái/phải khi thanh đang được chọn.</p>
      <label>Độ rộng vùng làm việc<select aria-label="Độ rộng vùng làm việc" defaultValue="" onChange={event => onPreset(event.target.value)}><option value="" disabled>Đặt lại độ rộng</option><option value="balanced">Cân bằng</option><option value="code">Ưu tiên code</option><option value="preview">Ưu tiên preview</option></select></label>
      <button aria-expanded={!collapsed} onClick={onToggle}>{collapsed ? 'Mở preview' : 'Thu preview'}</button>
      <button onClick={onCopy}><Copy aria-hidden />Chép liên kết</button>
      <p>Hoàn thành là dấu tự xác nhận; thay đổi bố cục không tăng tiến độ.</p>
    </dialog>
  </header>
}
