import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Workflow,
  Hammer,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Copy,
  Play,
  Monitor,
} from 'lucide-react'
import { lessons } from './steps'
import { loadProgress, saveProgress, initialProgress, legacyProgressSummary } from './progress'
import type { Progress } from './progress'
import { selectionForCheckpoint, partById } from './catalog'
import { operationAt, defaultSymbol } from './operations'
import { useSelection, selectionAt } from './navigation'
import { Preview } from './Preview'
import { PreviewGuideProvider } from './PreviewGuide'
import { SubstepProgress } from './SubstepProgress'
import { milestonesFor } from './milestones'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useSplitLayout } from './useSplitLayout'
import styles from './workshop.module.css'

const Overview = lazy(() =>
  import('./Overview').then((module) => ({ default: module.Overview })),
)
const BuildSession = lazy(() =>
  import('./BuildSession').then((module) => ({ default: module.BuildSession })),
)
class RegionBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: '' }
  static getDerivedStateFromError(error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Không mở được vùng đang xem.',
    }
  }
  render() {
    return this.state.error ? (
      <div role="alert" className={styles.error}>
        <p>{this.state.error}</p>
        <button onClick={() => this.setState({ error: '' })}>Thử lại</button>
      </div>
    ) : (
      this.props.children
    )
  }
}
export function Workshop() {
  const [loaded] = useState(loadProgress)
  const [legacySummary] = useState(legacyProgressSummary)
  const completed = (ids: number[]) => ids.filter(id => id > 0).length
  const [progress, setProgress] = useState(loaded.progress)
  const [warning, setWarning] = useState(loaded.warning)
  const [selection, navigate] = useSelection(loaded.progress.current)
  const split = useSplitLayout()
  const [mobile, setMobile] = useState<'guide' | 'preview'>('guide')
  const [overviewVisited, setOverviewVisited] = useState(
    selection.tab === 'overview',
  )
  const [buildVisited, setBuildVisited] = useState(selection.tab === 'build')
  const [overviewCollapsed, setOverviewCollapsed] = useState<string[]>([])
  const [buildCollapsed, setBuildCollapsed] = useState<string[]>([])
  const [linkNotice, setLinkNotice] = useState('')
  const operation = operationAt(selection.step, selection.sub, selection.mark)
  const checkpoint =
    selection.side === 'before' ? operation.before : operation.after
  const checked = progress.checked.includes(selection.step)
  useEffect(() => {
    if (selection.tab === 'overview') setOverviewVisited(true)
    else setBuildVisited(true)
  }, [selection.tab])
  function update(next: Progress) {
    setProgress(next)
    setWarning(saveProgress(next))
  }
  function chooseAction(step: number, sub = 0) {
    navigate({ ...selectionAt(step, sub, milestonesFor(step, sub)[0]?.id), mode: selection.mode, tab: selection.tab, buildView: selection.buildView, dependencyScope: selection.dependencyScope })
    update({
      ...progress,
      started: true,
      current: step,
      visited: [...new Set([...progress.visited, step])],
    })
  }
  function chooseCheckpoint(id: string, file?: string, symbol?: string) {
    const target = selectionForCheckpoint(id)
    const next = selectionAt(target.step, target.sub, target.mark)
    navigate({
      ...next,
      tab: selection.tab,
      overviewMode: selection.overviewMode,
      runtimeFlow: selection.runtimeFlow,
      runtimeEvent: selection.runtimeEvent,
      runtimeScenario: selection.runtimeScenario,
      runtimeField: selection.runtimeField,
      runtimeHadPremium: selection.runtimeHadPremium,
      runtimePath: selection.runtimePath,
      buildView: selection.buildView,
      dependencyScope: selection.dependencyScope,
      dependencyNode: '',
      dependencyRelation: '',
      dependencyLocation: 0,
      mode: selection.mode,
      ...(file ? { file, symbol: symbol ?? defaultSymbol(id, file) } : {}),
    })
    update({
      ...progress,
      current: target.step,
      visited: [...new Set([...progress.visited, target.step])],
    })
  }
  function chooseFile(file: string) {
    const preferred =
      partById(selection.component).files.find((item) => item.path === file)
        ?.symbols[0] ?? ''
    navigate({
      tab: 'build',
      buildView: 'code',
      file,
      symbol: defaultSymbol(checkpoint.id, file, preferred),
      scope: 'full',
    })
  }
  function tryApp(mode: 'sample' | 'mine') {
    navigate({ mode, ...(mode === 'sample' ? { side: 'after' } : {}) })
    setMobile('preview')
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkNotice('Đã chép liên kết.')
    } catch {
      setLinkNotice('Bạn có thể chép URL trên thanh địa chỉ.')
    }
  }
  return (
    <PreviewGuideProvider mode={selection.mode} onReveal={() => { split.reveal(); setMobile('preview') }}>
    <div className={styles.workshop}>
      <a
        className={styles.skip}
        href="#workspace-title"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('workspace-title')?.focus()
        }}
      >
        Đến nội dung
      </a>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/">
          <span>Q</span>
          <div>
            Quotation<small>Phòng thực hành</small>
          </div>
        </a>
        <div className={styles.headerGoal}>
          <strong>Chặng 1 · Tự xây bản chào tối thiểu</strong>
          <span>Hiểu → sửa code → chạy thử → tự giải thích</span>
        </div>
        <div className={styles.progress}>
          <label htmlFor="progress">
            {completed(progress.checked)}/6 bước đã tự kiểm tra
          </label>
          <progress id="progress" max={6} value={completed(progress.checked)} />
          <small>Dấu tự xác nhận, chưa tự động chấm bài</small>
        </div>
      </header>
      <div
        className={styles.layout}
      >
        <aside className={styles.sidebar}>
          <h2>Các bước Chặng 1</h2>
          {legacySummary && <details><summary>Tiến độ hành trình cũ</summary><p>{legacySummary}</p></details>}
          <nav aria-label="Các bước thực hành">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                aria-current={selection.step === lesson.id ? 'step' : undefined}
                onClick={() => {
                  chooseAction(lesson.id)
                  setMobile('guide')
                }}
              >
                <span
                  className={
                    progress.checked.includes(lesson.id)
                      ? styles.checkedIndex
                      : styles.stepIndex
                  }
                >
                  {progress.checked.includes(lesson.id) ? (
                    <Check aria-hidden />
                  ) : (
                    String(lesson.id).padStart(2, '0')
                  )}
                </span>
                <span>{lesson.title}</span>
              </button>
            ))}
          </nav>
          <button
            className={styles.reset}
            onClick={() => {
              if (
                window.confirm(
                  'Làm lại tiến độ và ghi chú hướng dẫn? Source và dữ liệu bài thực hành được giữ nguyên.',
                )
              ) {
                update(initialProgress())
                navigate(selectionAt(0))
              }
            }}
          >
            <RotateCcw aria-hidden />
            Làm lại tiến độ
          </button>
        </aside>
        <div
          className={styles.mobileSwitch}
          role="tablist"
          aria-label="Vùng làm việc"
        >
          <button
            role="tab"
            aria-selected={mobile === 'guide'}
            onClick={() => setMobile('guide')}
          >
            Hướng dẫn
          </button>
          <button
            role="tab"
            aria-selected={mobile === 'preview'}
            onClick={() => setMobile('preview')}
          >
            Preview
          </button>
        </div>
        <Group id="learning-preview" groupRef={split.group} defaultLayout={split.initial} disabled={split.small} className={`${styles.split} ${mobile === 'guide' ? styles.showGuide : styles.showPreview}`} onLayoutChanged={split.changed}>
        <Panel id="code" minSize={split.small ? '0%' : '420px'} className={styles.panelContent}>
        <main
          className={`${styles.middle} ${mobile !== 'guide' ? styles.mobileHidden : ''}`}
        >
          <div className={styles.contextHeader}>
            <div>
              <p className={styles.breadcrumb}>
                Chặng 1 / Bước {selection.step} / Thao tác {operation.id}
              </p>
              <h1 id="workspace-title" tabIndex={-1}>
                {lessons[selection.step].title}
              </h1>
            </div>
            <div className={styles.contextTools}>
              <select
                aria-label="Độ rộng vùng làm việc"
                value=""
                onChange={(event) => split.preset(event.target.value)}
              >
                <option value="" disabled>Đặt lại độ rộng</option>
                <option value="balanced">Cân bằng</option>
                <option value="code">Ưu tiên code</option>
                <option value="preview">Ưu tiên preview</option>
              </select>
              <button className={styles.previewToggle} onClick={split.toggle} aria-expanded={!split.collapsed}>{split.collapsed ? 'Mở preview' : 'Thu preview'}</button>
              <button
                onClick={() => void copyLink()}
                aria-label="Chép liên kết"
              >
                <Copy aria-hidden />
              </button>
            </div>
          </div>
          <div className={styles.tabs} role="tablist" aria-label="Nội dung học">
            <button
              role="tab"
              aria-selected={selection.tab === 'overview'}
              onClick={() => navigate({ tab: 'overview' })}
            >
              <Workflow aria-hidden />
              Tổng thể
            </button>
            <button
              role="tab"
              aria-selected={selection.tab === 'build'}
              onClick={() => navigate({ tab: 'build' })}
            >
              <Hammer aria-hidden />
              Xây từng bước
            </button>
            <span className={styles.tabContext}>
              Mẫu {checkpoint.id} ·{' '}
              {selection.side === 'before' ? 'Trước' : 'Sau'}
            </span>
            {!progress.started && (
              <button
                className={styles.startButton}
                onClick={() => {
                  update({ ...progress, started: true })
                  navigate({ tab: 'build' })
                }}
              >
                <Play aria-hidden />
                Bắt đầu
              </button>
            )}
          </div>
          <SubstepProgress step={selection.step} sub={selection.sub} onAction={chooseAction} />
          {selection.notice && selection.tab === 'overview' && <p role="status" className={styles.status}>{selection.notice}</p>}
          <div className={styles.tabPanels}>
            <div
              className={styles.overviewTab}
              hidden={selection.tab !== 'overview'}
            >
              <RegionBoundary>
                <Suspense fallback={<p role="status">Đang mở sơ đồ…</p>}>
                  {overviewVisited && (
                    <Overview
                      flowSelection={selection}
                      onFlowSelection={navigate}
                      onCode={(file, symbol) => navigate({ tab: 'build', buildView: 'code', file, symbol, section: '', position: 0, scope: 'full' })}
                      active={selection.tab === 'overview'}
                      checkpoint={checkpoint}
                      selected={selection.component}
                      selectedFile={selection.file}
                      collapsed={overviewCollapsed}
                      onCollapse={setOverviewCollapsed}
                      onSelect={(component) => {
                        const part = partById(component)
                        const file = part.files[0].path
                        navigate({ component, file, symbol: defaultSymbol(checkpoint.id, file, part.files[0].symbols[0]) })
                      }}
                      onFile={chooseFile}
                      onCheckpoint={chooseCheckpoint}
                    />
                  )}
                </Suspense>
              </RegionBoundary>
            </div>
            <div className={styles.buildTab} hidden={selection.tab !== 'build'}>
              <RegionBoundary>
                <Suspense
                  fallback={<p role="status">Đang mở phiên xây dựng…</p>}
                >
                  {buildVisited && (
                    <BuildSession
                      operation={operation}
                      checkpoint={checkpoint}
                      selection={selection}
                      collapsed={buildCollapsed}
                      onCollapse={setBuildCollapsed}
                      onChange={navigate}
                      onFile={chooseFile}
                      onCheckpoint={chooseCheckpoint}
                      onTry={tryApp}
                      checked={checked}
                      note={progress.notes[String(selection.step)] ?? ''}
                      onNote={(note) =>
                        update({
                          ...progress,
                          notes: {
                            ...progress.notes,
                            [String(selection.step)]: note,
                          },
                        })
                      }
                      onCheck={() =>
                        update({
                          ...progress,
                          started: true,
                          checked: checked
                            ? progress.checked.filter(
                                (step) => step !== selection.step,
                              )
                            : [...progress.checked, selection.step],
                        })
                      }
                    />
                  )}
                </Suspense>
              </RegionBoundary>
            </div>
          </div>
          {(warning || linkNotice || split.warning) && (
            <p role="status" className={styles.status}>
              {warning || linkNotice || split.warning}
            </p>
          )}
          <footer className={styles.stepFooter}>
            <button
              disabled={selection.step === 0}
              onClick={() => chooseAction(selection.step - 1)}
            >
              <ArrowLeft aria-hidden />
              Bước trước
            </button>
            <span>
              {checked
                ? 'Bạn đã tự kiểm tra bước này'
                : 'Chọn thao tác không tự đánh dấu hoàn thành'}
            </span>
            <button
              className={styles.primary}
              disabled={selection.step === 6}
              onClick={() => chooseAction(selection.step + 1)}
            >
              Bước tiếp
              <ArrowRight aria-hidden />
            </button>
          </footer>
        </main>
        </Panel>
        <Separator className={styles.resizeHandle} aria-label="Kéo độ rộng preview" onPointerDownCapture={split.startDrag}><span aria-hidden>⋮</span></Separator>
        <Panel id="preview" collapsible minSize={split.small ? '0%' : '300px'} collapsedSize="0%" className={styles.panelContent}>
        <aside
          className={`${styles.previewPane} ${mobile !== 'preview' ? styles.mobileHidden : ''}`}
          aria-label="Vùng preview"
        >
          <div className={styles.previewIdentity}>
            <Monitor aria-hidden />
            <span>Ứng dụng đang chạy</span>
          </div>
          <Preview
            checkpoint={checkpoint}
            mode={selection.mode}
            onMode={(mode) => navigate({ mode })}
            onCheckpoint={(id) => {
              chooseCheckpoint(id)
              setMobile('preview')
            }}
            comparison={`${selection.side === 'before' ? 'Trước' : selection.side === 'diff' ? 'Sau · đang so sánh diff' : 'Sau'} thao tác ${operation.id} (${operation.before.id} → ${operation.after.id})`}
          />
        </aside>
        </Panel>
        </Group>
      </div>
      {split.dragging && <div className={styles.dragShield} data-testid="iframe-drag-shield" aria-hidden />}
    </div>
    </PreviewGuideProvider>
  )
}
