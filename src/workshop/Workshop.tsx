import { stepRunPlan } from './run/step-plans'
import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { lessons } from './steps'
import { loadProgress, saveProgress, initialProgress, legacyProgressSummary } from './progress'
import type { Progress } from './progress'
import { selectionForCheckpoint, partById } from './catalog'
import { operationAt, defaultSymbol } from './operations'
import { useSelection, selectionAt } from './navigation'
import type { Selection } from './navigation'
import { runtimeFlows } from './runtime-flows'
import { Preview } from './Preview'
import { PreviewGuideProvider } from './PreviewGuide'
import { SubstepProgress } from './SubstepProgress'
import { milestonesFor } from './milestones'
import { WorkshopFrame } from './WorkshopFrame'
import { useSplitLayout } from './useSplitLayout'
import styles from './workshop.module.css'
import { useRunSession } from './run/useRunSession'
import { RunPreview, RunToolbar } from './run/RunControls'
import { runPlan, scenarioIds } from './run/model'
import type { RunPlan, RunMode, Scenario } from './run/model'

const Overview = lazy(() =>
  import('./Overview').then((module) => ({ default: module.Overview })),
)
const RunWorkspace = lazy(() => import('./run/RunWorkspace').then(module => ({ default: module.RunWorkspace })))
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
  const runContext = useRef<{view:ReturnType<typeof split.capture>;mobile:'guide'|'preview'} | null>(null)
  const runner = useRunSession({capture:()=>{runContext.current={view:split.capture(),mobile}},restore:()=>{const saved=runContext.current;if(saved){split.restore(saved.view);setMobile(saved.mobile);runContext.current=null}}})
  const runStarted = useRef(false)
  const [mobile, setMobile] = useState<'guide' | 'preview'>('guide')
  const [overviewVisited, setOverviewVisited] = useState(
    selection.tab === 'overview',
  )
  const [buildVisited, setBuildVisited] = useState(selection.tab === 'build')
  const [overviewCollapsed, setOverviewCollapsed] = useState<string[]>([])
  const [buildCollapsed, setBuildCollapsed] = useState<string[]>([])
  const [linkNotice, setLinkNotice] = useState('')
  const [flowReturn, setFlowReturn] = useState<Selection | null>(null)
  const operation = operationAt(selection.step, selection.sub, selection.mark)
  const checkpoint =
    selection.side === 'before' ? operation.before : operation.after
  const checked = progress.checked.includes(selection.step)
  function startRun(plan: RunPlan, mode: RunMode) {
    setLinkNotice(''); runner.start(plan, mode); split.reveal(); setMobile(split.small ? 'preview' : 'guide')
  }
  useEffect(() => {
    const entry = new URLSearchParams(location.search)
    const scenario = entry.get('run')
    if (!scenario || (scenario !== 'step' && !scenarioIds.includes(scenario as Scenario))) {
      if (runner.session && runner.session.plan.checkpoint.id !== checkpoint.id) {
        runner.exit(); setLinkNotice(`Đổi sang mốc ${checkpoint.id}: đã kết thúc phiên cũ. Preview mốc mới khởi tạo theo ngữ cảnh vừa chọn.`)
      }
      return
    }
    if (runStarted.current) return
    runStarted.current = true
    const plan = scenario === 'step' ? stepRunPlan(1, selection.step, entry.get('runVariant') ?? 'success') : runPlan(checkpoint, scenario as Scenario)
    if (plan.supported) startRun(plan, entry.get('runMode') === 'guided' ? 'guided' : 'demo')
    else { if (runner.session) runner.exit(); setLinkNotice(plan.reason) }
    return () => { runStarted.current = false }
  }, [checkpoint.id])
  function returnToFlow() {
    setLinkNotice('')
    if (flowReturn) { navigate(flowReturn); setFlowReturn(null) }
    else navigate({ tab: 'overview' })
  }
  function showBuild(id: string) {
    setFlowReturn({ ...selection })
    const target = selectionForCheckpoint(id)
    const next = selectionAt(target.step, target.sub, target.mark)
    navigate({ ...next, tab: 'build', mode: selection.mode, overviewMode: selection.overviewMode, runtimeFlow: selection.runtimeFlow, runtimeEvent: selection.runtimeEvent, runtimeScenario: selection.runtimeScenario, runtimeField: selection.runtimeField, runtimeHadPremium: selection.runtimeHadPremium, runtimePath: selection.runtimePath })
    if (checkpoint.id !== id) setLinkNotice(`Xem thứ tự xây tại mốc ${id}: preview khởi tạo lại form. Quay lại flow sẽ khôi phục mốc ${checkpoint.id} và lịch sử đọc.`)
  }
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
    <WorkshopFrame runState={runner.session} header={{
      title: runner.session ? runner.session.plan.title : selection.tab === 'build' ? lessons[selection.step].title : 'Tổng thể · Chặng 1',
      context: runner.session ? `Chặng 1 / Phiên riêng / Mốc ${runner.session.plan.checkpoint.id} · ${runner.session.mode === 'demo' ? 'Xem chạy mẫu' : 'Tự thao tác'}` : selection.tab === 'build' ? `Chặng 1 / Bước ${selection.step} / Thứ tự xây ${operation.id}` : `Mốc ${checkpoint.id} · ${selection.mode === 'sample' ? 'Mẫu có hướng dẫn' : 'Bài tự làm'}`,
      running: Boolean(runner.session),
      tab: runner.session ? runner.session.pane === 'flow' ? 'overview' : 'build' : selection.tab,
      onOverview: () => { if (runner.session) { runner.pane('flow'); setMobile('guide') } else returnToFlow() },
      onBuild: () => { if (runner.session) { runner.pane('code'); setMobile('guide') } else navigate({ tab: 'build' }) },
      flowLabel: !runner.session && flowReturn ? runtimeFlows.find(flow => flow.id === flowReturn.runtimeFlow)?.title : undefined,
      onReturn: returnToFlow,
      workMode: split.workMode,
      onWorkMode: mode => { split.mode(mode); setMobile(mode === 'preview' ? 'preview' : 'guide') },
      collapsed: split.collapsed,
      onToggle: split.toggle,
      onPreset: split.preset,
      onCopy: () => void copyLink(),
      completed: completed(progress.checked),
    }} sidebar={<>
          <h2>Các bước Chặng 1</h2>
          {legacySummary && <details><summary>Tiến độ hành trình cũ</summary><p>{legacySummary}</p></details>}
          <nav aria-label="Các bước thực hành">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                disabled={Boolean(runner.session)}
                title={runner.session ? 'Thoát phiên để đổi mốc học; tiến độ được giữ nguyên.' : undefined}
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
            disabled={Boolean(runner.session)}
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

    </>} substeps={<>{!runner.session && selection.tab === 'build' && <SubstepProgress step={selection.step} sub={selection.sub} onAction={chooseAction} marks={operation.milestones} currentMark={selection.mark || operation.destination.id} onMark={chooseCheckpoint} />}</>} split={split} mobile={mobile} onMobile={setMobile} runToolbar={runner.session && <RunToolbar controller={runner} />} preview={<>
          <div className={styles.previewContent} hidden={Boolean(runner.session)}><Preview
            onExpand={() => { split.mode('preview'); setMobile('preview') }}
            checkpoint={checkpoint}
            mode={selection.mode}
            onMode={(mode) => navigate({ mode })}
            onCheckpoint={(id) => {
              chooseCheckpoint(id)
              setMobile('preview')
            }}
            comparison={`${selection.side === 'before' ? 'Trước' : selection.side === 'diff' ? 'Sau · đang so sánh diff' : 'Sau'} thao tác ${operation.id} (${operation.before.id} → ${operation.after.id})`}
          /></div>
          {runner.session && <RunPreview controller={runner} />}
    </>}>
          {selection.notice && selection.tab === 'overview' && <p role="status" className={styles.status}>{selection.notice}</p>}
          <div className={styles.tabPanels} hidden={Boolean(runner.session)}>
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
                      onCode={(file, symbol) => { setFlowReturn({ ...selection }); navigate({ tab: 'build', buildView: 'code', file, symbol, section: '', position: 0, scope: 'full' }) }}
                      onBuild={showBuild}
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
                      onRun={startRun}
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
          {runner.session && <RegionBoundary><Suspense fallback={<p role="status">Đang mở vùng đọc phiên chạy…</p>}><RunWorkspace key={runner.session.id} controller={runner} /></Suspense></RegionBoundary>}
          {(warning || linkNotice || split.warning) && (
            <p role="status" className={styles.status}>
              {warning || linkNotice || split.warning}
            </p>
          )}

    </WorkshopFrame>
    </PreviewGuideProvider>
  )
}
