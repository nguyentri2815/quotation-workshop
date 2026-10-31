import { useEffect, useRef, useState } from 'react'
import {
  FilePlus2,
  FilePenLine,
  Cable,
  Eye,
  GitBranch,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { kindLabels } from './operations'
import type { Operation } from './operations'
import { selectionAt } from './navigation'
import type { Selection } from './navigation'
import type { Checkpoint } from './catalog'
import { SourceTree } from './SourceTree'
import { SourcePanel } from './SourcePanel'
import { FunctionalTree } from './FunctionalTree'
import explorerStyles from './FunctionalTree.module.css'
import { OperationCheck } from './OperationCheck'
import styles from './workshop.module.css'
import migrationGuide from '../../docs/STARTER-CU-CHUYEN-DOI.md?url'
import { lessons } from './steps'
import { StepDependencies } from './StepDependencies'

const operationIcons = {
  create: FilePlus2,
  edit: FilePenLine,
  connect: Cable,
  observe: Eye,
}
export function BuildSession({
  operation,
  checkpoint,
  selection,
  collapsed,
  onCollapse,
  onChange,
  onFile,
  onCheckpoint,
  onTry,
  checked,
  note,
  onNote,
  onCheck,
}: {
  operation: Operation
  checkpoint: Checkpoint
  selection: Selection
  collapsed: string[]
  onCollapse: (value: string[]) => void
  onChange: (value: Partial<Selection>) => void
  onFile: (file: string) => void
  onCheckpoint: (id: string, file?: string, symbol?: string) => void
  onTry: (mode: 'sample' | 'mine') => void
  checked: boolean
  note: string
  onNote: (value: string) => void
  onCheck: () => void
}) {
  const [future, setFuture] = useState(false)
  const [tree, setTree] = useState(() => window.innerWidth > 700)
  const [focusEpoch, setFocusEpoch] = useState(0)
  const drawer = useRef<HTMLDialogElement>(null)
  const [drawerMode, setDrawerMode] = useState<'task' | 'try'>('task')
  const markIndex = Math.max(0, operation.milestones.findIndex(item => item.id === (selection.mark || operation.destination.id)))
  const markStrip = useRef<HTMLDivElement>(null)
  useEffect(() => { setFuture(false) }, [operation.id])
  useEffect(() => {
    const host = markStrip.current, item = host?.querySelector<HTMLElement>('[aria-current="step"]')
    if (host && item) host.scrollLeft = item.offsetLeft - host.offsetLeft - (host.clientWidth - item.clientWidth) / 2
  }, [operation.id, selection.mark])
  function restoreTask() {
    const task = selectionAt(selection.step, selection.sub, selection.mark)
    onChange({ file: task.file, symbol: task.symbol, section: '', position: 0, side: 'after', explorer: 'functional' })
    setTree(true); setFocusEpoch(value => value + 1)
  }
  function openDrawer(mode: 'task' | 'try') { setDrawerMode(mode); drawer.current?.showModal() }
  const explorer = selection.explorer
  const setExplorer = (explorer: 'functional' | 'physical') => onChange({ explorer })
  const session = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (session.current) session.current.scrollTop = 0
  }, [operation.id])
  const Icon = operationIcons[operation.kind]
  return (
    <div className={styles.buildSession} ref={session}>
      {operation.milestones.length > 0 && <div className={styles.microProgress}>
        <strong>Mốc {markIndex + 1}/{operation.milestones.length}</strong>
        <div ref={markStrip} aria-label="Mốc nhỏ trong sub-step">{operation.milestones.map((mark, index) => <button key={mark.id} aria-current={index === markIndex ? 'step' : undefined} aria-pressed={index === markIndex} onClick={() => onCheckpoint(mark.id)}>{String.fromCharCode(65 + index)}. {mark.title}</button>)}</div>
        <button aria-label="Mốc nhỏ tiếp" disabled={markIndex === operation.milestones.length - 1} onClick={() => onCheckpoint(operation.milestones[markIndex + 1].id)}>Tiếp →</button>
      </div>}
      <section className={styles.taskSummary} aria-label="Nhiệm vụ hiện tại"><strong>{operation.milestone?.title ?? operation.title}</strong><p title={operation.intention}>{operation.intention}</p></section>
      <div className={styles.buildViews} role="tablist" aria-label="Nội dung Xây từng bước">
        <button role="tab" aria-selected={selection.buildView === 'code'} onClick={() => onChange({ buildView: 'code' })}>Code</button>
        <button role="tab" aria-selected={selection.buildView === 'dependencies'} onClick={() => onChange({ buildView: 'dependencies' })}>Phụ thuộc của bước</button>
      </div>
      <div className={styles.dependencyView} hidden={selection.buildView !== 'dependencies'}><StepDependencies active={selection.tab === 'build' && selection.buildView === 'dependencies'} checkpoint={checkpoint} selection={selection} onChange={onChange} onCheckpoint={onCheckpoint} /></div>
      <div className={styles.codeView} hidden={selection.buildView !== 'code'}>
      <div className={styles.sourceWorkspaceHeader}>
        <button aria-expanded={tree} onClick={() => setTree(!tree)}>
          {tree ? (
            <PanelLeftClose aria-hidden />
          ) : (
            <PanelLeftOpen aria-hidden />
          )}
          Explorer
        </button>
        <button onClick={restoreTask}>Về nhiệm vụ hiện tại</button>
        <button onClick={() => openDrawer('task')}>Chi tiết nhiệm vụ</button>
        <button onClick={() => openDrawer('try')}>Chạy thử</button>
        <span className={styles.srOnly}>
          Code mẫu · checkpoint {checkpoint.id}
          {selection.mode === 'mine' ? ' · khác source bài bạn đang sửa' : ''}
        </span>
      </div>
      <div
        className={`${styles.sourceWorkspace} ${tree ? '' : styles.hideTree}`}
      >
        {tree && (
          <aside className={styles.buildTree}>
            <div className={explorerStyles.explorer}>
            <div className={explorerStyles.switch} role="group" aria-label="Kiểu cây source">
              <button aria-pressed={explorer === 'functional'} onClick={() => setExplorer('functional')}>Cấu trúc tính năng</button>
              <button aria-pressed={explorer === 'physical'} onClick={() => setExplorer('physical')}>Cây thư mục vật lý</button>
            </div>
            {explorer === 'functional' ? <FunctionalTree destination={operation.destination} focusEpoch={focusEpoch} checkpoint={checkpoint} selection={selection} future={future} onFuture={setFuture} onChange={onChange} onCheckpoint={onCheckpoint} /> : <SourceTree
              checkpoint={checkpoint}
              active={selection.tab === 'build'}
              before={operation.before}
              selectedFile={selection.file}
              related={operation.part.files.map((file) => file.path)}
              collapsed={collapsed}
              onCollapse={onCollapse}
              onSelect={onFile}
              future={future}
              onFuture={setFuture}
            />}
            </div>
          </aside>
        )}
        <SourcePanel
          focusEpoch={focusEpoch}
          checkpoint={checkpoint}
          operation={operation}
          selection={selection}
          onChange={onChange}
          onCheckpoint={onCheckpoint}
        />
      </div>
      </div>
      <dialog ref={drawer} className={styles.taskDrawer} aria-label={drawerMode === 'task' ? 'Chi tiết nhiệm vụ' : 'Chạy thử và tự kiểm tra'}>
        <header><strong>{operation.id} · {operation.milestone?.title ?? operation.title}</strong><button onClick={() => drawer.current?.close()}>Đóng panel nhiệm vụ</button></header>
        {drawerMode === 'task' ? <>      <section className={styles.currentTask}>
        {selection.step === 0 && <p><strong>Mục tiêu:</strong> {lessons[selection.step].goal}</p>}
        {selection.step === 0 && <p>Phạm vi: một khách hàng, một tài sản, một kỳ; nhập → tính phí → lưu → xem lại. <a href="/reference.html#/quotations" target="_blank" rel="noreferrer">Trải nghiệm bản hoàn chỉnh ↗</a>. Bản mẫu và bài tự làm là hai source riêng.</p>}
        <details className={styles.taskReason}>
          <summary>Mẫu chuẩn và bài dùng starter cũ</summary>
          <p>Source bên dưới là mẫu sản phẩm tại checkpoint, không phải src/practice. Các vị trí mẫu dùng App.tsx, Field trong CreateQuotation.tsx, PremiumSummary và quotation/format.ts. Bài cũ vẫn có PracticeApp, FormFields, PremiumPanel; không tự đổi tên hoặc chép đè.</p>
          <p>Trong IDE, đọc docs/STARTER-CU-CHUYEN-DOI.md để đối chiếu từng trách nhiệm và chuyển đổi trên bản sao riêng. solutions/ là lời giải legacy cho starter cũ; source mẫu chuẩn lấy từ checkpoint đang xem.</p>
          <a href={migrationGuide} target="_blank" rel="noreferrer">Mở hướng dẫn chuyển đổi riêng ↗</a>
        </details>
        <div className={styles.taskHeading}>
          <span>
            <Icon aria-hidden />
            {kindLabels[operation.kind]}
          </span>
          <span>
            {operation.before.id}
            <ArrowRight aria-hidden />
            {operation.after.id}
          </span>
        </div>
        <p>{operation.intention}</p><p><b>Kiểm chứng:</b> {operation.run}</p><p><b>Mốc tiếp:</b> {operation.milestones[markIndex + 1]?.change ?? operation.next}</p>
        <div className={styles.dependencies}>
          <span title={operation.prerequisite}>
            <GitBranch aria-hidden />
            <b>Cần trước:</b> {operation.prerequisite}
          </span>
          <span title={operation.parallel}>
            <b>Song song:</b> {operation.parallel}
          </span>
          <span title={operation.next}>
            <b>Dùng tiếp:</b> {operation.next}
          </span>
        </div>
        <details className={styles.taskReason}>
          <summary>Vì sao · vị trí sửa</summary>
          <p><strong>Mục tiêu của bước:</strong> {lessons[selection.step].goal}</p>
          <p>{operation.task.change}</p>
          <p>{operation.part.teaching}</p>
          <code>
            {operation.file} · {operation.symbol}
          </code>
          <p>{operation.after.ui}</p>
        </details>
      </section>
</> : <OperationCheck
        key={operation.id + selection.mark}
        operation={operation}
        checked={checked}
        note={note}
        onNote={onNote}
        onCheck={onCheck}
        onTry={mode => { drawer.current?.close(); onTry(mode) }}
        onAnswer={() => { drawer.current?.close(); restoreTask() }}
      />}
      </dialog>
    </div>
  )
}
