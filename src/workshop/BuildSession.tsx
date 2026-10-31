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
  Settings2,
  LocateFixed,
  Play,
} from 'lucide-react'
import { kindLabels } from './operations'
import type { Operation } from './operations'
import { selectionAt } from './navigation'
import type { Selection } from './navigation'
import type { Checkpoint } from './catalog'
import { SourceTree } from './SourceTree'
import { SourcePanel } from './SourcePanel'
import { FunctionalTree } from './FunctionalTree'
import { OperationCheck } from './OperationCheck'
import styles from './workshop.module.css'
import migrationGuide from '../../docs/STARTER-CU-CHUYEN-DOI.md?url'
import { lessons } from './steps'
import { StepDependencies } from './StepDependencies'
import type { RunMode, RunPlan } from './run/model'

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
  onRun,
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
  onRun: (plan: RunPlan, mode: RunMode) => void
}) {
  const [future, setFuture] = useState(false)
  const [tree, setTree] = useState(() => window.innerWidth > 700)
  const [focusEpoch, setFocusEpoch] = useState(0)
  const drawer = useRef<HTMLDialogElement>(null)
  const [drawerMode, setDrawerMode] = useState<'task' | 'try'>('task')
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null)
  const explorerOptions = useRef<HTMLDialogElement>(null)
  const markIndex = Math.max(0, operation.milestones.findIndex(item => item.id === (selection.mark || operation.destination.id)))
  useEffect(() => { setFuture(false) }, [operation.id])
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
      <section className={styles.taskLine} aria-label="Nhiệm vụ hiện tại"><button aria-label="Chi tiết nhiệm vụ" title={`${operation.milestone?.title ?? operation.title}: ${operation.intention}`} onClick={() => openDrawer('task')}><strong>{operation.milestone?.title ?? operation.title}</strong><span> · {operation.intention}</span></button></section>
      <div className={styles.workspaceToolbar}>
      <div className={styles.workspaceTabs} role="tablist" aria-label="Nội dung Xây từng bước">
        <button role="tab" aria-selected={selection.buildView === 'code'} onClick={() => onChange({ buildView: 'code' })}>Code</button>
        <button role="tab" aria-label="Phụ thuộc của bước" aria-selected={selection.buildView === 'dependencies'} onClick={() => onChange({ buildView: 'dependencies' })}>Phụ thuộc</button>
      </div>
      <div ref={setToolbarHost} className={styles.toolbarSlot}>
      <div className={styles.codeActions} hidden={selection.buildView !== 'code'}>
        <button aria-label="Explorer" title="Thu/mở explorer" aria-expanded={tree} onClick={() => setTree(!tree)}>
          {tree ? (
            <PanelLeftClose aria-hidden />
          ) : (
            <PanelLeftOpen aria-hidden />
          )}
          <span>Explorer</span>
        </button>
        <button aria-label="Về nhiệm vụ hiện tại" title="Về nhiệm vụ hiện tại" onClick={restoreTask}><LocateFixed aria-hidden /></button>
        <button aria-label="Tùy chọn explorer" title="Kiểu cây, chú giải và source tương lai" onClick={() => explorerOptions.current?.showModal()}><Settings2 aria-hidden /></button>
        <span className={styles.srOnly}>
          Code mẫu · checkpoint {checkpoint.id}
          {selection.mode === 'mine' ? ' · khác source bài bạn đang sửa' : ''}
        </span>
      </div>
      </div>
      <button className={styles.tryButton} aria-label="Chạy thử" title="Chạy thử" onClick={() => openDrawer('try')}><Play aria-hidden /><span>Chạy thử</span></button>
      </div>
      <div className={styles.dependencyView} hidden={selection.buildView !== 'dependencies'}><StepDependencies toolbarHost={toolbarHost} active={selection.tab === 'build' && selection.buildView === 'dependencies'} checkpoint={checkpoint} selection={selection} onChange={onChange} onCheckpoint={onCheckpoint} /></div>
      <div className={styles.codeView} hidden={selection.buildView !== 'code'}>
      <div
        className={`${styles.sourceWorkspace} ${tree ? '' : styles.hideTree}`}
      >
          <aside hidden={!tree} className={styles.buildTree}>
            <div hidden={explorer !== 'functional'} className={styles.explorerRegion}><FunctionalTree compact destination={operation.destination} focusEpoch={focusEpoch} checkpoint={checkpoint} selection={selection} future={future} onFuture={setFuture} onChange={onChange} onCheckpoint={onCheckpoint} /></div>
            <div hidden={explorer !== 'physical'} className={styles.explorerRegion}><SourceTree compact
              checkpoint={checkpoint}
              active={selection.tab === 'build' && selection.buildView === 'code' && explorer === 'physical'}
              before={operation.before}
              selectedFile={selection.file}
              related={operation.part.files.map((file) => file.path)}
              collapsed={collapsed}
              onCollapse={onCollapse}
              onSelect={onFile}
              future={future}
            /></div>
          </aside>
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
      <dialog ref={explorerOptions} className={styles.taskDrawer} aria-label="Tùy chọn explorer"><header><strong>Explorer và cách đọc cây</strong><button autoFocus onClick={() => explorerOptions.current?.close()}>Đóng tùy chọn explorer</button></header><div role="group" aria-label="Kiểu cây source"><button aria-pressed={explorer === 'functional'} onClick={() => setExplorer('functional')}>Cấu trúc tính năng</button><button aria-pressed={explorer === 'physical'} onClick={() => setExplorer('physical')}>Cây thư mục vật lý</button></div><label><input type="checkbox" checked={future} onChange={event => setFuture(event.target.checked)} />{explorer === 'functional' ? 'Xem đích của sub-step' : 'Xem cấu trúc cuối chặng'}</label><p>Vai trò và bao chứa ở vị trí source thật. Đang xem khác Liên quan; nhãn Thêm/Sửa so với checkpoint trước. Quan hệ gọi/truyền nằm trong từng mục; không biểu diễn thứ tự thực thi.</p><button onClick={() => { window.history.back(); explorerOptions.current?.close() }}>← Quay lại lựa chọn trước</button><button onClick={() => { restoreTask(); explorerOptions.current?.close() }}>Về nhiệm vụ hiện tại</button></dialog>
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
        checkpoint={checkpoint}
        onRun={(plan, mode) => { drawer.current?.close(); onRun(plan, mode) }}
      />}
      </dialog>
    </div>
  )
}
