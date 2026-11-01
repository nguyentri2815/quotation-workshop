import { useEffect, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { PencilLine, Calculator, Save, Database, LogOut, Maximize2, LocateFixed, Scan, List, Settings2, Info, ArrowLeft, ArrowRight } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import type { Checkpoint } from './catalog'
import { checkpoints as baselineCheckpoints } from './catalog'
import { findSymbol, readSource, sourceRows } from './source'
import { eventAvailable as baselineEventAvailable, flowCheckpoint as baselineFlowCheckpoint, flowSourceAvailable as baselineSourceAvailable, runtimeFlows as baselineFlows, outgoing, explainedEdge as baselineExplainedEdge, normalizeFlow } from './runtime-flows'
import type { FlowSelection, FlowSource, FlowEdge } from './runtime-flows'
import { usePreviewGuide } from './PreviewGuide'
import { useFlowViewport } from './useFlowViewport'
import { useOverlayFocus } from './useOverlayFocus'
import styles from './runtime-flow.module.css'
import type { ComponentChange, ChangeKind, StageComparison } from './change-model'
import { changeLabel, shortChangeLabel } from './change-model'
import { ChangeInspector } from './ChangeInspector'

export function FlowCode({ checkpoint, source }: { checkpoint: Checkpoint; source: FlowSource }) {
  const [loaded, setLoaded] = useState<{ code: string; error: string } | null>(null)
  useEffect(() => {
    let active = true
    setLoaded(null)
    readSource(checkpoint.id, source.file).then(code => { if (active) setLoaded({ code, error: '' }) })
      .catch((error: unknown) => { if (active) setLoaded({ code: '', error: error instanceof Error ? error.message : 'Không đọc được source.' }) })
    return () => { active = false }
  }, [checkpoint.id, source.file])
  const range = findSymbol(checkpoint.id, source.file, source.symbol)
  if (!range) return <p>Symbol chưa có tại checkpoint này.</p>
  if (!loaded) return <p role="status">Đang đọc source…</p>
  if (loaded.error) return <p role="alert">{loaded.error}</p>
  return <pre className={styles.code} aria-label={`Source ${source.symbol}`}><code>{sourceRows(loaded.code, range, true).map(row => `${row.line}  ${row.text}`).join('\n')}</code></pre>
}
type EventNode = Node<{ title: string; kind: string; available: boolean; active: boolean; visited: boolean; change?:ChangeKind; comparing:boolean; shape?: string; select: () => void }, 'event'>
function EventNodeView({ id, data }: NodeProps<EventNode>) {
  return <><Handle type="target" position={Position.Top} /><button data-event={id} className={styles.graphEvent} data-available={data.available} data-kind={data.kind} data-shape={data.shape} data-visited={data.visited} data-change={data.change} data-comparing={data.comparing} aria-current={data.active ? 'step' : undefined} aria-pressed={data.active} onClick={data.select}><small>{data.shape === 'start' ? 'Bắt đầu' : data.shape === 'end' ? 'Kết thúc' : data.kind}</small><strong>{data.title}</strong>{data.change&&shortChangeLabel[data.change]&&<b className={styles.changeBadge}>{shortChangeLabel[data.change]}</b>}<small>{data.change?(data.change==='removed'?'Không tham gia đường chạy hiện hành':data.available?'Đã có tại mốc':'Chưa hình thành tại mốc'):(data.available?'Đã hình thành':'Chưa hình thành')}</small>{data.visited&&<small className={styles.pathBadge}>✓ Đã đi</small>}</button><Handle type="source" position={Position.Bottom} /></>
}
const nodeTypes = { event: EventNodeView }
const fieldNames: Record<string, string> = { customerName: 'Tên khách hàng', phone: 'Điện thoại', email: 'Email', assetName: 'Tên tài sản', address: 'Địa chỉ tài sản', sumInsured: 'Số tiền bảo hiểm', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc' }

const behaviorIcons = { 'input-edit': PencilLine, calculate: Calculator, save: Save, read: Database, leave: LogOut }
const behaviorDescriptions: Record<string, string> = { 'input-edit': 'Giá trị nhập → draft → trạng thái phí', calculate: 'Kiểm tra dữ liệu → công thức → kết quả phí', save: 'Guard → POST → kết quả hoặc thử lại', read: 'GET danh sách / chi tiết và thử lại', leave: 'Điều kiện rời form và xác nhận' }
const scenarios = { calculate: [['choose', 'Tự chọn tại điểm rẽ'], ['valid', 'Dữ liệu hợp lệ'], ['invalid', 'Dữ liệu có lỗi']], save: [['choose', 'Tự chọn từng nhánh'], ['success', 'Đủ điều kiện · kết quả thành công'], ['request-error', 'Đủ điều kiện · request lỗi'], ['busy', 'Đang gửi · chặn submit lặp'], ['invalid', 'Đầu vào có lỗi'], ['no-premium', 'Chưa có phí / phí mất hiệu lực']] }

export interface RuntimeAdapter {
  comparison?:StageComparison
  eventAvailable?:(cp:Checkpoint,event:import('./runtime-flows').RuntimeEvent)=>boolean
  catalog: Checkpoint[]
  flows: import('./runtime-flows').RuntimeFlow[]
  explain: typeof baselineExplainedEdge
  descriptions?: Record<string,string>
  scenarios?: Record<string, string[][]>
  consistencyOrder?: number
  mapEvidence?: (record:import('./run/model').RunRecord)=>import('./run/model').RunRecord
}
export function RuntimeFlow({ checkpoint, selection, onSelection, onCode, onFile, onCheckpoint, onBuild, active = true, adapter }: {
  checkpoint: Checkpoint; selection: FlowSelection; onSelection: (patch: Partial<FlowSelection>) => void
  onCode?: (file: string, symbol: string) => void; onFile: (file: string) => void; onCheckpoint: (id: string) => void
  onBuild?: (id: string) => void; active?: boolean; adapter?: RuntimeAdapter
}) {
  const runtimeFlows=adapter?.flows??baselineFlows, checkpoints=adapter?.catalog??baselineCheckpoints
  const flowSourceAvailable=adapter ? (cp:Checkpoint,source:FlowSource)=>Boolean(findSymbol(cp.id,source.file,source.symbol)) : baselineSourceAvailable
  const eventAvailable=adapter?.eventAvailable??(adapter ? (cp:Checkpoint,item:import('./runtime-flows').RuntimeEvent)=>item.sources.length>0&&item.sources.every(source=>flowSourceAvailable(cp,source)) : baselineEventAvailable)
  const flowCheckpoint=adapter ? (flow:import('./runtime-flows').RuntimeFlow)=>checkpoints.find(cp=>flow.events.filter(e=>e.change?.kind!=='removed').every(item=>eventAvailable(cp,item))) : baselineFlowCheckpoint
  const explainedEdge=adapter?.explain??baselineExplainedEdge
  const descriptions=adapter?.descriptions??behaviorDescriptions
  const normalize=(raw:Partial<FlowSelection>)=>normalizeFlow(raw,runtimeFlows)
  const originalFlow = runtimeFlows.find(item => item.id === selection.runtimeFlow) ?? runtimeFlows[0]
  const comparing=Boolean(adapter?.comparison&&selection.compareChanges)
  const flow={...originalFlow,events:originalFlow.events.filter(e=>comparing||e.change?.kind!=='removed'),edges:originalFlow.edges.filter(e=>comparing||e.change?.kind!=='removed')}
  const [selectedEdge,setSelectedEdge]=useState('')
  const edgeChange=flow.edges.find(e=>e.id===selectedEdge)?.change
  const points=flow.events.filter(e=>e.change&&e.change.kind!=='unchanged').map(e=>({id:e.id,target:e.id,change:e.change!})).concat(flow.edges.filter(e=>e.change&&e.change.kind!=='unchanged').map(e=>({id:'edge:'+e.id,target:e.to,change:e.change!})))
  const pointIndex=points.findIndex(p=>p.id===(selectedEdge?'edge:'+selectedEdge:selection.runtimeEvent))
  const event = flow.events.find(item => item.id === selection.runtimeEvent) ?? flow.events[0]
  const path = selection.runtimePath.split(',').filter(id => flow.events.some(item => item.id === id))
  const available = eventAvailable(checkpoint, event)
  const ready = flow.events.filter(e=>e.change?.kind!=='removed').every(item => eventAvailable(checkpoint, item))
  const target = flowCheckpoint(flow)
  const guide = usePreviewGuide()
  const [source, setSource] = useState<FlowSource | null>(null)
  const inspector = useRef<HTMLElement>(null)
  const branchPanel = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement>(null)
  const scenarioDialog = useRef<HTMLDialogElement>(null)
  const eventsDialog = useRef<HTMLDialogElement>(null)
  const infoDialog = useRef<HTMLDialogElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [explorePartial, setExplorePartial] = useState('')
  const flowSelections = useRef(new Map<string, FlowSelection>())
  flowSelections.current.set(flow.id, normalize(selection))
  function selectFlow(id: string) {
    const next = runtimeFlows.find(item => item.id === id)
    if (!next || next.id === flow.id) return
    onSelection(flowSelections.current.get(id) ?? normalize({ ...selection, runtimeFlow: next.id, runtimeEvent: next.events[0].id, runtimePath: next.events[0].id, runtimeScenario: 'choose' }))
  }
  const viewport = useFlowViewport<EventNode>(`${adapter?adapter.catalog.at(-1)?.id:'stage1'}:${flow.id}`, event, canvas, active)
  useOverlayFocus(expanded, root, () => setExpanded(false))
  const choices = outgoing(flow, event.id).filter(e=>e.change?.kind!=='removed')
  const resolved = explainedEdge(flow, event.id, selection, checkpoint)
  const waiting = choices.length > 1 && !resolved
  const nextEvent = resolved && flow.events.find(item => item.id === resolved.to)
  const canContinue = available && nextEvent && eventAvailable(checkpoint, nextEvent)
  const lastFork = path.reduce((last, id, index) => index < path.length - 1 && outgoing(flow, id).length > 1 ? index : last, -1)
  const followed = lastFork >= 0 ? flow.edges.find(edge => edge.from === path[lastFork] && edge.to === path[lastFork + 1]) : undefined
  const scenarioItems = adapter?.scenarios?.[flow.id] ?? (flow.id === 'calculate' ? scenarios.calculate : flow.id === 'save' ? scenarios.save : [])
  const scenarioSummary = flow.id === 'input-edit' ? `${selection.runtimeHadPremium ? 'Đã có phí' : 'Chưa có phí'} · ${fieldNames[selection.runtimeField]}` : scenarioItems.find(([id]) => id === selection.runtimeScenario)?.[1] ?? 'Tự chọn tại điểm rẽ'
  const Icon = behaviorIcons[flow.id as keyof typeof behaviorIcons] ?? behaviorIcons['input-edit']
  const inputRule = flow.id === 'input-edit' && ['draft', 'compare'].includes(event.id)
  const pricingField = ['sumInsured', 'startDate', 'endDate'].includes(selection.runtimeField)
  const consistency = checkpoint.order >= (adapter?.consistencyOrder ?? checkpoints.find(cp => cp.id === '06')?.order ?? Infinity)
  const editResult = !selection.runtimeHadPremium ? 'Chưa từng có phí → vẫn chưa có kết quả phí.' : consistency && pricingField ? 'Đã có phí + sửa đầu vào phí → xóa premium, Cần tính lại phí.' : consistency ? 'Đã có phí + sửa trường không ảnh hưởng phí → giữ kết quả.' : 'Checkpoint này chưa có quy tắc mất hiệu lực; phí hiện tại được giữ.'
  const uiTarget = event.ui.target === '$field' ? selection.runtimeField : event.ui.target === '$editResult' ? (selection.runtimeHadPremium ? consistency && pricingField ? 'premiumStale' : 'premiumResult' : 'premiumEmpty') : event.ui.target
  const uiAvailable = available && Boolean(uiTarget && guide.available.includes(uiTarget))
  const eventSources: FlowSource[] = flow.id === 'input-edit' && ['input', 'render'].includes(event.id)
    ? [{ file: 'pages/CreateQuotation.tsx', symbol: `CreateQuotation.field.${selection.runtimeField}`, since: adapter?.catalog[0].id ?? '02-inputs' }, ...event.sources]
    : event.sources
  useEffect(() => { setSource(null); if (inspector.current) inspector.current.scrollTop = 0 }, [flow.id, event.id, checkpoint.id])
  useEffect(() => { if (!active) { setExpanded(false); scenarioDialog.current?.close(); eventsDialog.current?.close(); infoDialog.current?.close() } }, [active])
  function focusBranches() {
    setInspectorOpen(true)
    requestAnimationFrame(() => { if (inspector.current) inspector.current.scrollTop = 0; branchPanel.current?.focus({ preventScroll: true }) })
  }
  function setPath(next: string[], patch: Partial<FlowSelection> = {}) {
    onSelection({ runtimeFlow: flow.id, runtimeEvent: next.at(-1) ?? flow.events[0].id, runtimePath: next.slice(-120).join(','), ...patch })
  }
  function selectEvent(id: string) {
    if(comparing){onSelection({runtimeEvent:id});setInspectorOpen(true);setSelectedEdge('');return}
    const index = path.lastIndexOf(id)
    setPath(index >= 0 ? path.slice(0, index + 1) : [id])
    setInspectorOpen(true)
    setSelectedEdge('')
  }
  function changePoint(direction:number){
    if(!points.length)return
    const at=(pointIndex+direction+points.length)%points.length,point=points[at]
    selectEvent(point.target);setSelectedEdge(point.id.startsWith('edge:')?point.id.slice(5):'')
  }
  function take(branch: FlowEdge, manual = false) {
    const destination = flow.events.find(item => item.id === branch.to)
    const origin = flow.events.find(item => item.id === branch.from)
    if (branch.change?.kind==='removed'||!destination || !origin || !eventAvailable(checkpoint, origin) || !eventAvailable(checkpoint, destination)) return
    // Input forks are consequences of the example, never arbitrary outcomes.
    if (flow.id === 'input-edit' && branch.from === 'compare' && explainedEdge(flow, branch.from, selection, checkpoint)?.id !== branch.id) return
    if (flow.id === 'input-edit' && branch.from === 'draft' && explainedEdge(flow, branch.from, selection, checkpoint)?.id !== branch.id) return
    const at = path.lastIndexOf(branch.from)
    const prefix = at >= 0 ? path.slice(0, at + 1) : [branch.from]
    const patch: Partial<FlowSelection> = manual && flow.id === 'save' ? { runtimeScenario: 'choose' } : {}
    if (manual && flow.id === 'calculate' && branch.from === 'validate') patch.runtimeScenario = branch.to === 'stop' ? 'invalid' : 'valid'
    setPath([...prefix, branch.to], patch)
  }
  function changeExample(patch: Partial<FlowSelection>) { setPath([flow.events[0].id], patch) }
  function backToFork() {
    let at = path.length - 2
    while (at >= 0 && outgoing(flow, path[at]).length < 2) at--
    if (at >= 0) { setPath(path.slice(0, at + 1), { runtimeScenario: 'choose' }); focusBranches() }
  }
  const visitedEdges = new Set(path.slice(1).map((id, index) => `${path[index]}~${id}`))
  const nodes: EventNode[] = flow.events.map(item => ({ id: item.id, type: 'event', position: { x: item.x * 320, y: item.y * 190 }, data: { title: item.title, kind: outgoing(flow, item.id).length > 1 ? 'Nhánh' : item.kind, available: eventAvailable(checkpoint, item), active: event.id === item.id, visited: path.includes(item.id), change:item.change?.kind, comparing, shape: item.shape, select: () => selectEvent(item.id) } }))
  const edges = flow.edges.map(item => ({ id: item.id, source: item.from, target: item.to, type: item.loop ? 'default' : 'smoothstep', label: [item.label,item.change&&shortChangeLabel[item.change.kind]].filter(Boolean).join(' · '), markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: visitedEdges.has(item.id) ? '#0369a1' : item.change?.kind==='removed'?'#6b7280':comparing&&item.change?.kind!=='unchanged'?'#b45309':'#94a3b8', strokeWidth: visitedEdges.has(item.id) ? 3 : 1.5, strokeDasharray: item.change?.kind==='removed'?'3 5':item.loop?'6 4':undefined }, labelStyle: { fontSize: 12 }, interactionWidth: 24 }))
  return <section ref={root} className={`${styles.runtime} ${expanded ? styles.fullscreen : ''}`} data-flow-expanded={expanded} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Toàn màn hình flow và inspector' : 'Theo một thao tác'} data-testid="runtime-flow">
    <div className={styles.intro}>
      <div className={styles.exploreHeading}><div><h2>Khám phá một thao tác</h2><p>Chọn hành vi, theo xử lý và thử các nhánh.</p></div><button aria-label="Thông tin về flow" onClick={() => infoDialog.current?.showModal()}><Info aria-hidden /></button></div>
      <div className={styles.behaviorRow}>
        <label className={styles.picker}><Icon aria-hidden /><select aria-label="Thao tác cần theo" value={flow.id} onChange={e => selectFlow(e.target.value)}>{runtimeFlows.map(item => <option key={item.id} value={item.id}>{item.title}{item.changeKind?' · '+changeLabel[item.changeKind]:''} · {descriptions[item.id]}</option>)}</select></label>
        <div className={styles.behaviorChoices} role="group" aria-label="Hành vi">{runtimeFlows.map(item => { const BehaviorIcon = behaviorIcons[item.id as keyof typeof behaviorIcons] ?? behaviorIcons['input-edit']; return <button key={item.id} title={descriptions[item.id]} aria-pressed={flow.id === item.id} onClick={() => selectFlow(item.id)}><BehaviorIcon aria-hidden />{item.title}{item.changeKind&&<small>{changeLabel[item.changeKind]}</small>}</button> })}</div>
        <button className={styles.scenarioButton} onClick={() => scenarioDialog.current?.showModal()}><Settings2 aria-hidden />Tình huống bắt đầu</button>
      </div>
      <p className={styles.scenarioSummary} role="status">{scenarioSummary} · Mốc {checkpoint.id}{ready ? ' · Đã có đủ luồng' : ''} · {guide.mode === 'sample' ? 'Mẫu có hướng dẫn' : 'Bài tự làm'}</p>
    </div>
    {!ready && <div className={styles.availability} role="status"><strong>Mốc {checkpoint.id} chưa đủ luồng {flow.title}.</strong>{explorePartial !== `${flow.id}:${checkpoint.id}` && <span>Đã có {flow.events.filter(item => eventAvailable(checkpoint, item)).length} sự kiện; phần mờ còn thiếu. Đổi mốc sẽ khởi tạo lại form preview; dữ liệu đã lưu được giữ.</span>}<div>{target && <button onClick={() => onCheckpoint(target.id)}>Đến mốc {target.id} để theo đủ luồng →</button>}<button aria-pressed={explorePartial === `${flow.id}:${checkpoint.id}`} onClick={() => setExplorePartial(`${flow.id}:${checkpoint.id}`)}>Khám phá phần đã có</button></div></div>}
    <nav className={styles.controls} aria-label="Điều khiển event">
      {adapter?.comparison&&<div className={styles.comparisonLine}><label><input type="checkbox" checked={comparing} onChange={e=>{setSelectedEdge('');onSelection({compareChanges:e.target.checked})}}/>Xem thay đổi so với Chặng 1</label><span>{flow.changeKind&&changeLabel[flow.changeKind]} · Chặng 1 / {adapter.comparison.baseline.id} → Chặng 2 / {adapter.comparison.target.id}</span></div>}
      {comparing&&<><button disabled={!points.length} onClick={()=>changePoint(-1)}>Điểm thay đổi trước</button><button disabled={!points.length} onClick={()=>changePoint(1)}>Điểm thay đổi tiếp</button><small>{pointIndex+1}/{points.length} · Nhãn vàng: thay đổi · ✓ xanh: đường đã đi · viền đen: đang chọn</small></>}
      <button onClick={() => setPath([flow.events[0].id])}>{path.length > 1 || event.id !== flow.events[0].id ? 'Bắt đầu lại' : 'Bắt đầu theo luồng'}</button>
      <button disabled={path.length < 2} onClick={() => setPath(path.slice(0, -1))}><ArrowLeft aria-hidden />Sự kiện trước</button>
      <button className={waiting ? styles.choosePrompt : styles.continue} disabled={!available || (!waiting && !canContinue)} onClick={() => { if (waiting) focusBranches(); else if (resolved) take(resolved) }}>{waiting ? 'Chọn nhánh' : 'Tiếp tục'}<ArrowRight aria-hidden /></button>
      <button aria-label="Mở danh sách sự kiện" onClick={() => eventsDialog.current?.showModal()}><List aria-hidden /><span>Danh sách</span></button>
      <div className={styles.position} aria-live="polite"><strong>Lượt {path.length} · {event.title}</strong><small>{waiting ? 'Đang chờ lựa chọn nhánh' : nextEvent ? `Tiếp: ${nextEvent.title}${!canContinue ? ' · chưa hình thành' : ''}` : 'Kết thúc đoạn đang đọc'}</small></div>
      <button className={styles.regionToggle} aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(!inspectorOpen)}>{inspectorOpen ? 'Xem sơ đồ' : 'Chi tiết sự kiện'}</button>
      {expanded && <button data-overlay-close onClick={() => setExpanded(false)}>Thoát toàn màn hình</button>}
    </nav>
    <div className={`${styles.workspace} ${inspectorOpen ? styles.showInspector : ''}`}>
      <div className={styles.graphColumn}>
        <div ref={canvas} className={styles.branchGraph} aria-label={`Sơ đồ có nhánh ${flow.title}`}>
          <div className={styles.graphTools}><button onClick={viewport.fit} title="Fit View toàn graph khi bạn yêu cầu"><Scan aria-hidden />Toàn luồng</button><button onClick={viewport.reveal}><LocateFixed aria-hidden />Đến sự kiện</button><button aria-pressed={viewport.following} onClick={viewport.toggleFollow}>{viewport.following ? 'Theo sự kiện' : 'Theo tiếp sự kiện'}</button><button aria-label={expanded ? 'Thu sơ đồ' : 'Toàn màn hình'} onClick={() => setExpanded(!expanded)}><Maximize2 aria-hidden /></button></div>
          <ReactFlow<EventNode> key={flow.id} defaultViewport={viewport.defaultViewport} onInit={viewport.onInit} onMoveStart={viewport.onMoveStart} onMoveEnd={viewport.onMoveEnd} autoPanOnNodeFocus={false} nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} deleteKeyCode={null} minZoom={0.15} maxZoom={1.5} onEdgeClick={(_, item) => { if(comparing){const edge=flow.edges.find(e=>e.id===item.id);if(edge){selectEvent(edge.to);setSelectedEdge(edge.id)}return} const branch = flow.edges.find(e => e.id === item.id); if (branch) take(branch, true) }}><Background /><Controls showInteractive={false} showFitView={false} onZoomIn={viewport.pause} onZoomOut={viewport.pause} /></ReactFlow>
        </div>
      </div>
      <aside ref={inspector} className={styles.inspector} aria-label="Inspector event" data-testid="flow-inspector">
        {choices.length > 1 && <section ref={branchPanel} tabIndex={-1} className={styles.branches} aria-label="Chọn nhánh"><h3>Bạn muốn theo tình huống nào?</h3><p>{waiting ? 'Chọn một nhánh để tiếp tục diễn giải.' : inputRule ? `Đường xác định bởi trường/state: ${resolved?.label}` : `Theo tình huống bắt đầu: ${resolved?.label}`}</p>{choices.map(branch => {
          const destination = flow.events.find(item => item.id === branch.to)!
          const exists = available && eventAvailable(checkpoint, destination)
          const birth = checkpoints.find(cp => eventAvailable(cp, event) && eventAvailable(cp, destination))
          const ruledOut = inputRule && resolved?.id !== branch.id
          return <article key={branch.id} className={styles.branchCard} data-selected={resolved?.id === branch.id}><strong>{branch.label}</strong><small>Điều kiện: {branch.label}</small><span>Tiếp: {destination.title}</span><small>{!exists ? `Chưa hình thành ở mốc ${checkpoint.id}` : ruledOut ? 'Không phù hợp trường/state hiện tại' : resolved?.id === branch.id ? 'Đang theo tình huống này' : 'Có thể chọn'}</small><button data-branch={branch.id} disabled={!exists || ruledOut} aria-pressed={resolved?.id === branch.id} onClick={() => take(branch, true)}>Theo nhánh này<span className={styles.srOnly}>: {branch.label}</span></button>{!exists && birth && <button onClick={() => onCheckpoint(birth.id)}>Đến mốc {birth.id}</button>}</article>
        })}</section>}
        {followed && choices.length < 2 && <div className={styles.branchSummary}><span>Nhánh đang theo: <strong>{followed.label}</strong></span><button onClick={backToFork}>Đổi nhánh</button></div>}
        <span className={styles.eyebrow}>{event.kind} · Lượt đọc {path.length}</span><h2>{event.title}</h2>
        <div className={styles.eventActions}>{onBuild && event.sources[0] && <button onClick={() => onBuild(event.sources[0].since)}>Xem cách xây</button>}{followed && choices.length > 1 && <button onClick={backToFork}>Đổi nhánh trước</button>}</div>
        {!available && <p className={styles.missing}>{event.change?.kind==='removed'?'Thành phần đã loại khỏi đường chạy hiện hành. Chỉ xem source trước và lý do thay thế trong chế độ so sánh.':`Sự kiện này chưa hình thành tại checkpoint ${checkpoint.id}. Selection và lịch sử được giữ để đối chiếu; chỉ diễn giải phần source hiện có. Chọn sự kiện không tự đổi checkpoint.`}</p>}
        <dl><dt>Dữ liệu vào</dt><dd>{event.input}</dd><dt>Dữ liệu ra / cập nhật</dt><dd>{event.output}{flow.id === 'input-edit' && event.id === 'render' && <p>{editResult}</p>}</dd><dt>Nhánh và điều kiện dừng</dt><dd>{event.branches}</dd><dt>Render / async / thứ tự chạy</dt><dd>{event.timing}</dd></dl>
        <section className={styles.uiLink} aria-label="Liên hệ với UI"><h3>Liên hệ với UI</h3><strong>{event.ui.kind === 'origin' ? 'Phát sinh từ UI' : event.ui.kind === 'result' ? 'Có kết quả hiển thị trên UI' : 'Xử lý nội bộ, không có phần tử UI riêng'}</strong>{event.ui.kind !== 'internal' && <>{uiAvailable ? <button onClick={() => { if (uiTarget) guide.point(uiTarget) }}>Chỉ trên preview</button> : <p role="status">{guide.mode !== 'sample' ? 'Bài người học: chưa xác minh checkpoint/source, không áp mapping của mẫu.' : !available ? 'UI cho event chưa hình thành tại checkpoint này.' : 'Phần tử chưa tồn tại trên màn hình/trạng thái preview hiện tại. Hãy chuẩn bị theo hướng dẫn; không highlight vùng thay thế.'}</p>}</>}<details><summary>Cách tự thử nhánh này</summary><p>{event.ui.try}</p></details></section>
        {adapter?.comparison&&(edgeChange??event.change)&&<ChangeInspector comparison={adapter.comparison} change={(edgeChange??event.change) as ComponentChange}/>}
        <h3>Source tại checkpoint đang học</h3><ul className={styles.sources}>{eventSources.map(item => {
          const range = findSymbol(checkpoint.id, item.file, item.symbol), exists = flowSourceAvailable(checkpoint, item), birth = checkpoints.find(cp => flowSourceAvailable(cp, item))
          return <li key={`${item.file}:${item.symbol}`}><strong>{item.symbol}</strong><span>{item.file}</span>{exists && range ? <><small>Mốc {checkpoint.id} · dòng {range.start}–{range.end}</small><button onClick={() => setSource(item)}>Xem đúng đoạn {item.symbol}</button><button onClick={() => onCode ? onCode(item.file, item.symbol) : onFile(item.file)}>Mở đoạn trong Xây từng bước →</button></> : <><small>Chưa hình thành{birth ? `; có từ ${birth.id}` : '; chưa có range phù hợp'}.</small>{birth && <button onClick={() => onCheckpoint(birth.id)}>Đến mốc {birth.id}</button>}</>}</li>
        })}</ul>
        {source && flowSourceAvailable(checkpoint, source) && <FlowCode checkpoint={checkpoint} source={source} />}
      </aside>
    </div>
    <dialog ref={scenarioDialog} className={styles.dialog} aria-label="Tình huống bắt đầu">
      <header><h2>Tình huống bắt đầu · {flow.title}</h2><button autoFocus onClick={() => scenarioDialog.current?.close()}>Đóng tình huống</button></header>
      <p>Chỉ đổi diễn giải. Chọn sự kiện hoặc đọc inspector giữ nguyên tình huống.</p>
      {flow.id === 'input-edit' ? <><div className={styles.scenarioCards} role="group" aria-label="State trước thao tác">{[false, true].map(value => <button key={String(value)} aria-pressed={selection.runtimeHadPremium === value} onClick={() => changeExample({ runtimeHadPremium: value })}>{value ? 'Đã có phí' : 'Chưa có phí'}</button>)}</div><label className={styles.picker}>Trường đang sửa<select aria-label="Trường đang sửa" value={selection.runtimeField} onChange={e => changeExample({ runtimeField: e.target.value })}>{Object.entries(fieldNames).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><p>{editResult}</p></> : scenarioItems.length ? <div className={styles.scenarioCards} role="group" aria-label="Tình huống minh họa">{scenarioItems.map(([id, title]) => <button key={id} aria-pressed={selection.runtimeScenario === id} onClick={() => changeExample({ runtimeScenario: id })}>{title}</button>)}</div> : <p>Chọn tình huống trực tiếp tại điểm rẽ trong inspector.</p>}
      {flow.id === 'save' && <p>“Thành công” và “request lỗi” là đường diễn giải giả định khi đầu vào đã đủ điều kiện. Sau retry, kết quả của lần gửi mới cần được chọn lại.</p>}
    </dialog>
    <dialog ref={eventsDialog} className={styles.dialog} aria-label="Danh sách sự kiện và lịch sử">
      <header><h2>Sự kiện · {flow.title}</h2><button autoFocus onClick={() => eventsDialog.current?.close()}>Đóng danh sách</button></header>
      <label className={styles.picker}>Đến sự kiện<select aria-label="Chọn event" value={event.id} onChange={e => { selectEvent(e.target.value); eventsDialog.current?.close() }}>{flow.events.map(item => <option key={item.id} value={item.id}>{item.title}{eventAvailable(checkpoint, item) ? '' : ' · chưa hình thành'}</option>)}</select></label>
      <h3>Lịch sử đường đã đi · {path.length} lượt</h3><ol className={styles.history}>{path.map((id, index) => <li key={`${index}:${id}`}><button aria-current={index === path.length - 1 ? 'step' : undefined} onClick={() => { setPath(path.slice(0, index + 1)); eventsDialog.current?.close() }}>{index + 1}. {flow.events.find(item => item.id === id)?.title}</button></li>)}</ol><p>Mỗi dòng là một lượt qua node; retry có thể lặp node. Chọn sự kiện ngoài đường hiện tại bắt đầu đoạn đọc mới.</p>
    </dialog>
    <dialog ref={infoDialog} className={styles.dialog} aria-label="Thông tin về flow">
      <header><h2>Thông tin về flow</h2><button autoFocus onClick={() => infoDialog.current?.close()}>Đóng thông tin</button></header>
      <p>{flow.premise}</p><p>Đường xanh là đường đang diễn giải từ source. Chọn event/nhánh chỉ thay diễn giải. Dùng “Chỉ trên preview” hoặc “Cách tự thử” để liên hệ với ứng dụng.</p><p>Bo tròn: bắt đầu/kết thúc · Viền tím: quyết định · Cạnh ghi điều kiện · Nét đứt: tương tác mới.</p>
      <h3>Mốc {checkpoint.id} · phần đã có</h3><ul>{flow.events.filter(item => eventAvailable(checkpoint, item)).map(item => <li key={item.id}>{item.title}</li>)}</ul>
    {!ready && <><h3>Phần chưa có</h3><ul>{flow.events.filter(item => !eventAvailable(checkpoint, item)).map(item => <li key={item.id}>{item.title}</li>)}</ul></>}
    </dialog>
  </section>
}
