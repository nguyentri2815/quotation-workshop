import { useEffect, useRef, useState } from 'react'
import type { ReactNode, FocusEvent } from 'react'
import { ReactFlow, Background, Controls, MarkerType, Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { Info, List, LocateFixed } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { runtimeFlows } from '../runtime-flows'
import { useFlowViewport } from '../useFlowViewport'
import { CodeBlock } from '../CodeBlock'
import { findSymbol, readSource, sourceRows } from '../source'
import type { SourceLink, RunRecord } from './model'
import type { RunController, RunSession } from './useRunSession'
import styles from './run.module.css'

type TraceNode = Node<{ label: ReactNode; read?: () => void; focus?: (event: FocusEvent<HTMLButtonElement>) => void }, 'trace'>
function TraceNodeView({ data }: NodeProps<TraceNode>) {
  return <><Handle type="target" position={Position.Top} /><button className={`${styles.nodeButton} nodrag nopan`} disabled={!data.read} onClick={data.read} onFocus={data.focus}>{data.label}</button><Handle type="source" position={Position.Bottom} /></>
}
const nodeTypes = { trace: TraceNodeView }

function RunGraph({ run, record, controller, onSource }: { run: RunSession; record?: RunRecord; controller: RunController; onSource: (source: SourceLink) => void }) {
  const eligible = run.records.filter(item => item.order <= (record?.order ?? Infinity))
  const flowId = record?.flow ?? eligible.filter(item => item.flow).at(-1)?.flow ?? (run.plan.scenario === 'field' ? undefined : ['input','invalidate'].includes(run.plan.scenario) ? 'input-edit' : run.plan.scenario.startsWith('save') ? 'save' : 'calculate')
  const flow = runtimeFlows.find(flow => flow.id === flowId)
  const path = eligible.filter(item => item.flow === flow?.id && item.path).at(-1)?.path ?? []
  const observed = new Set(eligible.filter(item => item.flow === flow?.id).map(item => item.event))
  const current = flow?.events.find(item => item.id === record?.event) ?? flow?.events.find(item => item.id === path.at(-1)) ?? flow?.events[0] ?? runtimeFlows[0].events[0]
  const formFile = 'pages/CreateQuotation.tsx'
  const definition = findSymbol(run.plan.checkpoint.id, formFile, 'Field.render') ?? findSymbol(run.plan.checkpoint.id, formFile, 'Field')
  const contract = findSymbol(run.plan.checkpoint.id, formFile, 'FieldProps')
  const fieldSources: Record<string, SourceLink | undefined> = { contract: contract ? { file: formFile, symbol: contract.qualified } : definition ? { file: formFile, symbol: definition.qualified } : undefined, definition: definition ? { file: formFile, symbol: definition.qualified } : undefined, usage: definition ? run.plan.tasks[0]?.sources[0] : undefined, ui: { file: formFile, symbol: 'CreateQuotation' } }
  const canvas = useRef<HTMLDivElement>(null)
  const initialView = useRef(true)
  const viewport = useFlowViewport<Node>(`run:${run.id}:${flow?.id ?? 'field'}`, current, canvas, run.follow === 'ui' && run.following)
  useEffect(() => { if (run.following && !viewport.following) viewport.toggleFollow() }, [run.following])
  useEffect(() => {
    initialView.current = true
    const host = canvas.current
    if (!host || !flow) return
    const reveal = () => {
      if (initialView.current && host.clientWidth && host.clientHeight && viewport.instance.current) {
        viewport.reveal(); initialView.current = false
      }
    }
    const observer = new ResizeObserver(reveal)
    observer.observe(host); reveal()
    return () => observer.disconnect()
  }, [run.id, flow?.id])
  const nodes: Node[] = flow ? flow.events.map(event => ({ id: event.id, position: { x: event.x * 320, y: event.y * 190 }, data: { label: <><strong>{event.title}</strong><small>{observed.has(event.id) ? 'Đã quan sát · DOM/UI/HTTP' : path.includes(event.id) ? 'Diễn giải từ source' : 'Nhánh khác / chưa có bằng chứng'}</small></> }, className: styles.node, style: { width: 220, minHeight: 100, border: `${path.includes(event.id) ? 3 : 1}px ${observed.has(event.id) ? 'solid' : 'dashed'} ${current.id === event.id ? '#0369a1' : observed.has(event.id) ? '#0f766e' : '#94a3b8'}`, background: current.id === event.id ? '#e0f2fe' : observed.has(event.id) ? '#ecfdf5' : 'white' }, selected: current.id === event.id })) : [
    { id: 'contract', position: { x: 0, y: 0 }, data: { label: `${contract ? 'FieldProps' : 'Contract inline của Field'} · TypeScript, không chạy runtime` } },
    { id: 'definition', position: { x: 0, y: 160 }, data: { label: definition ? 'Định nghĩa Field · diễn giải source' : 'Định nghĩa Field · chưa hình thành' }, style: { borderStyle: 'dashed' } },
    { id: 'usage', position: { x: 0, y: 320 }, data: { label: !definition ? 'Nơi dùng · chưa hình thành' : run.plan.checkpoint.id === '01-field-example' ? 'Nơi dùng minh họa · chưa ghép form' : 'Nơi dùng thật / props · diễn giải source' }, style: { borderStyle: 'dashed' } },
    { id: 'ui', position: { x: 0, y: 480 }, data: { label: `${run.plan.checkpoint.id} · ${eligible.some(item => item.kind === 'ui') ? `${run.plan.tasks[0]?.count ?? 0} input đã quan sát` : 'chưa có bằng chứng UI'}` }, style: { background: eligible.some(item => item.kind === 'ui') ? '#ecfdf5' : 'white', borderStyle: eligible.some(item => item.kind === 'ui') ? 'solid' : 'dashed' } },
  ]
  const edges = flow ? flow.edges.map(edge => ({ id: edge.id, source: edge.from, target: edge.to, label: edge.label, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: path.some((id, index) => id === edge.from && path[index + 1] === edge.to) ? '#0284c7' : '#cbd5e1', strokeWidth: path.some((id, index) => id === edge.from && path[index + 1] === edge.to) ? 3 : 1 } })) : ['contract','definition','usage'].map((id, index, items) => ({ id: id + '-next', source: id, target: items[index + 1] ?? 'ui', label: 'Diễn giải source', style: { strokeDasharray: '5 4' } }))
  const manualView = () => { viewport.pause(); controller.exploreUI() }
  const readableNodes: Node[] = nodes.map(node => {
    const source = flow ? flow.events.find(event => event.id === node.id)?.sources.find(source => findSymbol(run.plan.checkpoint.id, source.file, source.symbol)) : fieldSources[node.id]
    return { ...node, type: 'trace', className: styles.node, focusable: false, selectable: false, data: { ...node.data, read: source ? () => onSource(source) : undefined, focus: (event: FocusEvent<HTMLButtonElement>) => {
      const host = canvas.current, view = viewport.instance.current
      if (!host || !view || !event.currentTarget.matches(':focus-visible')) return
      const area = host.getBoundingClientRect(), target = event.currentTarget.getBoundingClientRect()
      if (target.left < area.left || target.right > area.right || target.top < area.top || target.bottom > area.bottom) { manualView(); void view.setCenter(node.position.x + 110, node.position.y + 50, { zoom: Math.max(.65, view.getZoom()), duration: 0 }) }
    } } }
  })
  const initView = (view: NonNullable<typeof viewport.instance.current>) => { if (flow) viewport.onInit(view); else viewport.instance.current = view }
  const revealView = () => { if (flow) viewport.reveal(); else void viewport.instance.current?.setCenter(75, 520, { zoom: .85, duration: 0 }) }
  return <section className={styles.graph} aria-label="Flow của phiên chạy"><div className={styles.graphTools}><span>{flow?.title ?? 'Field tại mốc hiện tại'}</span><button aria-label={flow ? 'Đến sự kiện phiên chạy' : 'Đến UI của mốc Field'} title={flow ? 'Đến sự kiện phiên chạy' : 'Đến UI của mốc Field'} onClick={revealView}><LocateFixed aria-hidden /></button><button onClick={() => { manualView(); viewport.fit() }}>Toàn luồng</button></div><div ref={canvas} className={styles.canvas}><ReactFlow nodes={readableNodes} nodeTypes={nodeTypes} edges={edges} onInit={initView} defaultViewport={flow ? viewport.defaultViewport : { x: 20, y: 50, zoom: .85 }} onMoveStart={event => { viewport.onMoveStart(event); if (event) controller.exploreUI() }} onMoveEnd={viewport.onMoveEnd} nodesDraggable={false} minZoom={.2} maxZoom={1.3}><Background /><Controls showInteractive={false} onZoomIn={manualView} onZoomOut={manualView} onFitView={manualView} /></ReactFlow></div><p className={styles.graphLegend}>Viền liền: có bằng chứng DOM/UI/HTTP gắn tại node. Viền đứt: diễn giải source. Đường xanh giải thích nhánh theo kết quả thực; chưa đo mọi lời gọi.</p></section>
}

function RunCode({ run, record, source, controller, jump }: { run: RunSession; record?: RunRecord; source?: SourceLink; controller: RunController; jump: number }) {
  const [loaded, setLoaded] = useState({ code: '', error: '' })
  const checkpoint = run.plan.checkpoint.id
  useEffect(() => {
    let active = true
    setLoaded({ code: '', error: '' })
    if (source) readSource(checkpoint, source.file).then(code => { if (active) setLoaded({ code, error: '' }) }).catch(error => { if (active) setLoaded({ code: '', error: String(error) }) })
    return () => { active = false }
  }, [checkpoint, source?.file])
  const range = source && findSymbol(checkpoint, source.file, source.symbol)
  return <section className={styles.code} aria-label="Code liên quan phiên chạy" data-file={source?.file}>
    <div className={styles.file}><strong title={source?.file}>{source?.file ?? 'Chưa có mapping source'}</strong><span>{range ? `Dòng ${range.start}–${range.end}` : ''}</span></div>
    <div className={styles.sourceMeaning} title={record?.explanation}>Diễn giải từ source · {source?.symbol ?? 'Chưa đo lời gọi bên trong'}</div>
    {loaded.error ? <p role="alert">{loaded.error}</p> : !source || !range ? <p>Chưa đủ mapping source ở mốc này; không thay bằng code mốc khác.</p> : loaded.code ? <CodeBlock rows={sourceRows(loaded.code)} path={source.file} range={range} targetKey={`${checkpoint}:${source.file}:${source.symbol}`} autoFollow={run.follow === 'code' && run.following} onUserExplore={controller.exploreCode} jump={jump} /> : <p role="status">Đang đọc source thật…</p>}
  </section>
}

export function RunWorkspace({ controller }: { controller: RunController }) {
  const run = controller.session!, task = run.plan.tasks[run.index]
  const record = run.records.find(item => item.id === run.readId) ?? (run.live ? run.records.at(-1) : undefined)
  const [override, setOverride] = useState<{ record: string; source: SourceLink } | null>(null)
  const [jump, setJump] = useState(0)
  const info = useRef<HTMLDialogElement>(null), history = useRef<HTMLDialogElement>(null)
  const baseSources = record?.sources.length && (!run.live || record.step === run.index) ? record.sources : task.sources
  const extra = override?.record === (record?.id ?? '') ? override.source : undefined
  const sources = extra && !baseSources.some(item => item.file === extra.file && item.symbol === extra.symbol) ? [extra, ...baseSources] : baseSources
  const source = override?.record === (record?.id ?? '') ? override.source : sources[0]
  function selectSource(source: SourceLink) { setOverride({ record: record?.id ?? '', source }); setJump(value => value + 1) }
  return <section className={styles.workspace} aria-label="Phiên chạy Chặng 1" data-session={run.id} data-status={run.status} data-step={run.index}>
    <button className={styles.instruction} aria-label="Chi tiết bước trình diễn" title={run.error || (!run.live && record ? record.detail : task.instruction)} onClick={() => info.current?.showModal()}><strong>{!run.live && record ? `Đọc lại #${record.order}: ${record.title}` : run.status === 'done' && record ? `Đã quan sát: ${record.title}` : task.title}</strong> · {run.error || (!run.live && record ? record.detail : task.instruction)}<span role="status"> · {run.stage}</span></button>
    <div className={styles.workbar}>
      <div role="tablist" aria-label="Cách đọc phiên chạy"><button role="tab" aria-selected={run.pane === 'flow'} onClick={() => controller.pane('flow')}>Flow</button><button role="tab" aria-selected={run.pane === 'code'} onClick={() => controller.pane('code')}>Code</button></div>
      <select aria-label="Theo vùng" value={run.follow} onChange={event => controller.follow(event.target.value as 'ui' | 'code')}><option value="ui">Theo UI</option><option value="code">Theo code</option></select>
      {!run.following && <button aria-label="Theo tiếp" title="Theo tiếp vùng đang chọn" onClick={controller.resumeFollow}><LocateFixed aria-hidden /><span>Theo tiếp</span></button>}
      {!run.live && <button aria-label="Trở về kết quả mới" title="Trở về kết quả mới; không chạy lại thao tác" onClick={controller.live}>↪</button>}
      <select className={styles.sourceSelect} aria-label="Nhóm code liên quan" value={source ? `${source.file}#${source.symbol}` : ''} onChange={event => { const item = sources.find(item => `${item.file}#${item.symbol}` === event.target.value); if (item) selectSource(item) }}>{sources.map(item => <option key={item.file + item.symbol} value={`${item.file}#${item.symbol}`}>{item.symbol}</option>)}</select>
      <button className={styles.jump} aria-label="Đến code liên quan" title="Đến code liên quan" onClick={() => setJump(value => value + 1)}><LocateFixed aria-hidden /></button>
      <button aria-label="Lịch sử quan sát" title="Lịch sử quan sát" onClick={() => history.current?.showModal()}><List aria-hidden /><span>{run.records.length}</span></button>
      <button aria-label="Thông tin phiên chạy" title="Thông tin phiên chạy" onClick={() => info.current?.showModal()}><Info aria-hidden /></button>
    </div>
    <div className={`${styles.panes} ${run.pane === 'flow' ? styles.showFlow : styles.showCode}`}>
      <RunGraph run={run} record={record} controller={controller} onSource={source => { selectSource(source); controller.pane('code') }} />
      <RunCode run={run} record={record} source={source} controller={controller} jump={jump} />
    </div>
    <dialog ref={history} className={styles.dialog} aria-label="Lịch sử quan sát phiên chạy"><header><strong>Nhật ký bằng chứng · phiên {run.id.slice(0, 8)}</strong><button autoFocus onClick={() => history.current?.close()}>Đóng lịch sử</button></header><p>Đọc lại chỉ thay vùng đọc, không nhập liệu, bấm nút hoặc gửi lại POST. Bước trình diễn có thể sinh nhiều sự kiện DOM/HTTP/UI liên tiếp.</p><button onClick={() => { controller.live(); history.current?.close() }}>Theo kết quả mới nhất</button><ol>{run.records.map(item => <li key={item.id}><button aria-current={record?.id === item.id ? 'true' : undefined} onClick={() => { controller.read(item.id); history.current?.close() }}><b>{item.order}. {item.kind === 'diagnostic' ? 'Chưa xác nhận' : 'Đã quan sát'} · {item.title}</b><small>Bước trình diễn {item.step + 1} · {item.kind} · {item.detail}</small></button></li>)}</ol></dialog>
    <dialog ref={info} className={styles.dialog} aria-label="Thông tin phiên chạy"><header><strong>{run.plan.title} · mốc {run.plan.checkpoint.id}</strong><button autoFocus onClick={() => info.current?.close()}>Đóng thông tin phiên</button></header><p><b>{task.title}:</b> {task.instruction}</p><p role="status">{run.error || run.stage}</p>{record && <><h3>{record.kind === 'diagnostic' ? 'Chưa xác nhận' : 'Đã quan sát'} · {record.title}</h3><p>{record.detail}</p><h3>Diễn giải từ source</h3><p>{record.explanation}</p></>}<div aria-label="Source của quan sát">{sources.map(item => { const range = findSymbol(run.plan.checkpoint.id, item.file, item.symbol); return <button key={item.file + item.symbol} onClick={() => { selectSource(item); controller.pane('code'); info.current?.close() }}>{item.file} · {item.symbol} · dòng {range?.start}–{range?.end}</button> })}</div><p>DOM/input/click, thuộc tính UI và MSW request/response được quan sát trực tiếp. Chưa instrument hàm, React state, render hay storage. Viền/màu luôn có nhãn chữ; không chèn delay vào nghiệp vụ.</p><p>Phiên {run.id} có API và khóa dữ liệu riêng; iframe review được giữ. Chạy lại mở phiên mới, hủy hàng đợi cũ. Request đã gửi có thể hoàn tất trong namespace cũ. Tạm dừng chỉ chặn trước thao tác kế tiếp. Retry lưu luôn do bạn bấm.</p><p>Thoát để quay về ngữ cảnh học/chọn checkpoint khác. Không xác nhận hoàn thành bài. Bài tôi đang làm chưa có adapter/mapping đủ tin cậy, chỉ mở thủ công trong preview thường.</p><label>Link phiên mới<input readOnly aria-label="Link mở phiên chạy" value={`${location.origin}/?run=${run.plan.scenario}&runMode=${run.mode}${location.hash}`} /></label></dialog>
  </section>
}
