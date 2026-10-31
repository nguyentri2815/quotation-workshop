import { useEffect, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react'
import type { Node, NodeProps, ReactFlowInstance } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Checkpoint } from './catalog'
import { checkpoints } from './catalog'
import { findSymbol, readSource, sourceRows } from './source'
import { eventAvailable, flowCheckpoint, flowSourceAvailable, runtimeFlows, outgoing, explainedEdge } from './runtime-flows'
import type { FlowSelection, FlowSource, FlowEdge } from './runtime-flows'
import { usePreviewGuide } from './PreviewGuide'
import styles from './runtime-flow.module.css'

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
type EventNode = Node<{ title: string; kind: string; available: boolean; active: boolean; visited: boolean; shape?: string; select: () => void }, 'event'>
function EventNodeView({ id, data }: NodeProps<EventNode>) {
  return <><Handle type="target" position={Position.Top} /><button data-event={id} className={styles.graphEvent} data-kind={data.kind} data-shape={data.shape} data-visited={data.visited} aria-current={data.active ? 'step' : undefined} aria-pressed={data.active} onClick={data.select}><small>{data.shape === 'start' ? 'Bắt đầu' : data.shape === 'end' ? 'Kết thúc' : data.kind}</small><strong>{data.title}</strong><small>{data.available ? 'Đã hình thành' : 'Chưa hình thành'}</small></button><Handle type="source" position={Position.Bottom} /></>
}
const nodeTypes = { event: EventNodeView }
const fieldNames: Record<string, string> = { customerName: 'Tên khách hàng', phone: 'Điện thoại', email: 'Email', assetName: 'Tên tài sản', address: 'Địa chỉ tài sản', sumInsured: 'Số tiền bảo hiểm', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc' }

export function RuntimeFlow({ checkpoint, selection, onSelection, onCode, onFile, onCheckpoint }: {
  checkpoint: Checkpoint; selection: FlowSelection; onSelection: (patch: Partial<FlowSelection>) => void
  onCode?: (file: string, symbol: string) => void; onFile: (file: string) => void; onCheckpoint: (id: string) => void
}) {
  const flow = runtimeFlows.find(item => item.id === selection.runtimeFlow) ?? runtimeFlows[0]
  const event = flow.events.find(item => item.id === selection.runtimeEvent) ?? flow.events[0]
  const path = selection.runtimePath.split(',').filter(id => flow.events.some(item => item.id === id))
  const available = eventAvailable(checkpoint, event)
  const ready = flow.events.every(item => eventAvailable(checkpoint, item))
  const target = flowCheckpoint(flow)
  const guide = usePreviewGuide()
  const [source, setSource] = useState<FlowSource | null>(null)
  const inspector = useRef<HTMLElement>(null)
  const branchPanel = useRef<HTMLElement>(null)
  const graphView = useRef<ReactFlowInstance<EventNode>>(null)
  const [expanded, setExpanded] = useState(false)
  const choices = outgoing(flow, event.id)
  const resolved = explainedEdge(flow, event.id, selection, checkpoint)
  const waiting = choices.length > 1 && !resolved
  const inputRule = flow.id === 'input-edit' && ['draft', 'compare'].includes(event.id)
  const pricingField = ['sumInsured', 'startDate', 'endDate'].includes(selection.runtimeField)
  const consistency = checkpoint.order >= (checkpoints.find(cp => cp.id === '06')?.order ?? Infinity)
  const editResult = !selection.runtimeHadPremium ? 'Chưa từng có phí → vẫn chưa có kết quả phí.' : consistency && pricingField ? 'Đã có phí + sửa đầu vào phí → xóa premium, Cần tính lại phí.' : consistency ? 'Đã có phí + sửa trường không ảnh hưởng phí → giữ kết quả.' : 'Checkpoint này chưa có quy tắc mất hiệu lực; phí hiện tại được giữ.'
  const uiTarget = event.ui.target === '$field' ? selection.runtimeField : event.ui.target === '$editResult' ? (selection.runtimeHadPremium ? consistency && pricingField ? 'premiumStale' : 'premiumResult' : 'premiumEmpty') : event.ui.target
  const uiAvailable = available && Boolean(uiTarget && guide.available.includes(uiTarget))
  const eventSources: FlowSource[] = flow.id === 'input-edit' && ['input', 'render'].includes(event.id)
    ? [{ file: 'pages/CreateQuotation.tsx', symbol: `CreateQuotation.field.${selection.runtimeField}`, since: '02-inputs' }, ...event.sources]
    : event.sources
  useEffect(() => { setSource(null); if (inspector.current) inspector.current.scrollTop = 0 }, [flow.id, event.id, checkpoint.id])
  function setPath(next: string[], patch: Partial<FlowSelection> = {}) {
    onSelection({ runtimeFlow: flow.id, runtimeEvent: next.at(-1) ?? flow.events[0].id, runtimePath: next.slice(-120).join(','), ...patch })
  }
  function selectEvent(id: string) {
    const index = path.lastIndexOf(id)
    setPath(index >= 0 ? path.slice(0, index + 1) : [id])
  }
  function take(branch: FlowEdge, manual = false) {
    const destination = flow.events.find(item => item.id === branch.to)
    if (!destination || !eventAvailable(checkpoint, destination)) return
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
    if (at >= 0) setPath(path.slice(0, at + 1), { runtimeScenario: 'choose' })
  }
  const visitedEdges = new Set(path.slice(1).map((id, index) => `${path[index]}~${id}`))
  const nodes: EventNode[] = flow.events.map(item => ({ id: item.id, type: 'event', position: { x: item.x * 320, y: item.y * 190 }, data: { title: item.title, kind: outgoing(flow, item.id).length > 1 ? 'Nhánh' : item.kind, available: eventAvailable(checkpoint, item), active: event.id === item.id, visited: path.includes(item.id), shape: item.shape, select: () => selectEvent(item.id) } }))
  const edges = flow.edges.map(item => ({ id: item.id, source: item.from, target: item.to, type: item.loop ? 'default' : 'smoothstep', label: item.label, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: visitedEdges.has(item.id) ? '#0369a1' : '#94a3b8', strokeWidth: visitedEdges.has(item.id) ? 3 : 1.5, strokeDasharray: item.loop ? '6 4' : undefined }, labelStyle: { fontSize: 12 }, interactionWidth: 24 }))
  return <section className={styles.runtime} aria-label="Theo một thao tác" data-testid="runtime-flow">
    <div className={styles.intro}>
      <label className={styles.picker}>Thao tác cần theo<select value={flow.id} onChange={e => { const next = runtimeFlows.find(item => item.id === e.target.value); if (next) onSelection({ runtimeFlow: next.id, runtimeEvent: next.events[0].id, runtimePath: next.events[0].id, runtimeScenario: 'choose' }) }}>{runtimeFlows.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <details className={styles.readingHelp}><summary>Giả định và cách đọc sơ đồ</summary><p>{flow.premise}</p><p className={styles.note}>Đường xanh = đường đang diễn giải từ source, không phải bằng chứng runtime. Chọn event/nhánh không bấm nút, điền form, gửi request hoặc bật lỗi trên preview.</p></details>
      {flow.id === 'input-edit' ? <div className={styles.example}><label>Trường đang sửa<select aria-label="Trường đang sửa" value={selection.runtimeField} onChange={e => changeExample({ runtimeField: e.target.value })}>{Object.entries(fieldNames).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><label>State trước thao tác<select aria-label="State trước thao tác" value={String(selection.runtimeHadPremium)} onChange={e => changeExample({ runtimeHadPremium: e.target.value === 'true' })}><option value="false">Chưa từng có phí</option><option value="true">Đã có kết quả phí</option></select></label><p role="status">{editResult}</p></div> : ['calculate', 'save'].includes(flow.id) && <label className={styles.picker}>Tình huống minh họa<select aria-label="Tình huống minh họa" value={selection.runtimeScenario} onChange={e => changeExample({ runtimeScenario: e.target.value })}><option value="choose">Chọn tại điểm rẽ</option>{flow.id === 'calculate' ? <><option value="invalid">Dữ liệu sai</option><option value="valid">Dữ liệu hợp lệ</option></> : <><option value="success">Đủ điều kiện, response thành công</option><option value="request-error">Đủ điều kiện, request lỗi</option><option value="busy">Đang gửi</option><option value="invalid">Dữ liệu có lỗi</option><option value="no-premium">Chưa có phí / mất hiệu lực</option></>}</select></label>}
      <div className={styles.availability} role="status"><span>{ready ? `Luồng đã có đủ tại mốc ${checkpoint.id}.` : `Chưa hình thành đủ luồng tại mốc ${checkpoint.id}; vẫn có thể đọc từng event.`}</span>{!ready && target && <button onClick={() => onCheckpoint(target.id)}>Đến mốc {target.id} để theo đủ luồng →</button>}</div>
    </div>
    <nav className={styles.controls} aria-label="Điều khiển event">
      <button onClick={() => setPath([flow.events[0].id])}>Bắt đầu</button>
      <button disabled={path.length < 2} onClick={() => setPath(path.slice(0, -1))}>Quay lại</button>
      <button disabled={!resolved || !eventAvailable(checkpoint, flow.events.find(item => item.id === resolved.to)!)} onClick={() => { if (resolved) take(resolved) }}>Tiếp sự kiện →</button>
      <button disabled={!path.slice(0, -1).some(id => outgoing(flow, id).length > 1)} onClick={backToFork}>Quay lại điểm rẽ / Thử nhánh khác</button>
      <label>Chọn event <select aria-label="Chọn event" value={event.id} onChange={e => selectEvent(e.target.value)}>{flow.events.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {waiting && <button className={styles.choosePrompt} onClick={() => branchPanel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}>Chọn tình huống để tiếp tục ↓</button>}
    </nav>
    <div className={styles.workspace}>
      <div className={styles.graphColumn}>
        <div className={`${styles.branchGraph} ${expanded ? styles.graphExpanded : ''}`} aria-label={`Sơ đồ có nhánh ${flow.title}`}>
          <div className={styles.graphTools}><button onClick={() => { setExpanded(!expanded); window.requestAnimationFrame(() => void graphView.current?.fitView({ padding: 0.15 })) }}>{expanded ? 'Thu sơ đồ' : 'Mở rộng sơ đồ'}</button><button onClick={() => void graphView.current?.setCenter(event.x * 320 + 110, event.y * 190 + 48, { zoom: 0.85, duration: 180 })}>Đọc quanh event đang chọn</button></div>
          <ReactFlow<EventNode> key={flow.id} onInit={view => { graphView.current = view }} nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} minZoom={0.15} maxZoom={1.5} fitView fitViewOptions={{ padding: 0.18 }} onEdgeClick={(_, item) => { const branch = flow.edges.find(e => e.id === item.id); if (branch) take(branch, true) }}><Background /><Controls showInteractive={false} /></ReactFlow>
        </div>
        <p className={styles.note}>Bo tròn: bắt đầu/kết thúc · Viền tím: quyết định · Cạnh ghi điều kiện · Nét đứt: tương tác mới. Chọn node để xem; chọn cạnh hoặc thẻ để theo nhánh.</p>
        <details className={styles.history}><summary>Lịch sử lượt đọc ({path.length})</summary><ol>{path.map((id, index) => <li key={`${index}:${id}`}><button onClick={() => setPath(path.slice(0, index + 1))}>{index + 1}. {flow.events.find(item => item.id === id)?.title}</button></li>)}</ol><p>Mỗi dòng là một lượt đi qua node; retry có thể lặp cùng node. Chọn event ngoài đường hiện tại bắt đầu một đoạn đọc mới.</p></details>
      </div>
      <aside ref={inspector} className={styles.inspector} aria-label="Inspector event" data-testid="flow-inspector">
        <span className={styles.eyebrow}>{event.kind} · Lượt đọc {path.length}</span><h2>{event.title}</h2>
        {!available && <p className={styles.missing}>Chưa hình thành tại checkpoint {checkpoint.id}; chỉ đang đọc diễn giải mốc sau. Chọn event không tự đổi checkpoint.</p>}
        {choices.length > 1 && <section ref={branchPanel} className={styles.branches} aria-label="Chọn nhánh"><strong role="status">{waiting ? 'Chọn tình huống để tiếp tục' : inputRule ? `Đường đã xác định bởi trường/state và checkpoint: ${resolved?.label}` : `Đường theo tình huống minh họa: ${resolved?.label}`}</strong>{choices.map(branch => {
          const destination = flow.events.find(item => item.id === branch.to)!
          const exists = eventAvailable(checkpoint, destination)
          const birth = checkpoints.find(cp => eventAvailable(cp, destination))
          const ruledOut = inputRule && resolved?.id !== branch.id
          return <div key={branch.id}><button data-branch={branch.id} disabled={!exists || ruledOut} aria-pressed={resolved?.id === branch.id} onClick={() => take(branch, true)}>{branch.label} → {destination.title}</button>{!exists && <span>Chưa hình thành. {birth && <button onClick={() => onCheckpoint(birth.id)}>Đến mốc {birth.id}</button>}</span>}{ruledOut && <small>Đổi trường hoặc state ở trên để thử đường khác.</small>}</div>
        })}</section>}
        <dl><dt>Dữ liệu vào</dt><dd>{event.input}</dd><dt>Dữ liệu ra / cập nhật</dt><dd>{event.output}{flow.id === 'input-edit' && event.id === 'render' && <p>{editResult}</p>}</dd><dt>Nhánh và điều kiện dừng</dt><dd>{event.branches}</dd><dt>Render / async / thứ tự chạy</dt><dd>{event.timing}</dd></dl>
        <section className={styles.uiLink} aria-label="Liên hệ với UI"><h3>Liên hệ với UI</h3><strong>{event.ui.kind === 'origin' ? 'Phát sinh từ UI' : event.ui.kind === 'result' ? 'Có kết quả hiển thị trên UI' : 'Xử lý nội bộ, không có phần tử UI riêng'}</strong>{event.ui.kind !== 'internal' && <>{uiAvailable ? <button onClick={() => { if (uiTarget) guide.point(uiTarget) }}>Chỉ trên preview</button> : <p role="status">{guide.mode !== 'sample' ? 'Bài người học: chưa xác minh checkpoint/source, không áp mapping của mẫu.' : !available ? 'UI cho event chưa hình thành tại checkpoint này.' : 'Phần tử chưa tồn tại trên màn hình/trạng thái preview hiện tại. Hãy chuẩn bị theo hướng dẫn; không highlight vùng thay thế.'}</p>}</>}<details><summary>Cách tự thử nhánh này</summary><p>{event.ui.try}</p></details></section>
        <h3>Source của event</h3><ul className={styles.sources}>{eventSources.map(item => {
          const range = findSymbol(checkpoint.id, item.file, item.symbol), exists = flowSourceAvailable(checkpoint, item), birth = checkpoints.find(cp => flowSourceAvailable(cp, item))
          return <li key={`${item.file}:${item.symbol}`}><strong>{item.symbol}</strong><span>{item.file}</span>{exists && range ? <><small>Mốc {checkpoint.id} · dòng {range.start}–{range.end}</small><button onClick={() => setSource(item)}>Xem đúng đoạn {item.symbol}</button><button onClick={() => onCode ? onCode(item.file, item.symbol) : onFile(item.file)}>Mở đoạn trong Xây từng bước →</button></> : <><small>Chưa hình thành{birth ? `; có từ ${birth.id}` : '; chưa có range phù hợp'}.</small>{birth && <button onClick={() => onCheckpoint(birth.id)}>Đến mốc {birth.id}</button>}</>}</li>
        })}</ul>
        {source && flowSourceAvailable(checkpoint, source) && <FlowCode checkpoint={checkpoint} source={source} />}
      </aside>
    </div>
  </section>
}
