import { useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import type { Node, NodeProps, ReactFlowInstance } from '@xyflow/react'
import {
  Workflow,
  Braces,
  PanelsTopLeft,
  ShieldCheck,
  Calculator,
  Radio,
  Database,
  Server,
  List,
  Maximize2,
  PanelRightOpen,
  X,
  Link2,
  ArrowRight,
} from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { parts as baselineParts, partById as baselinePartById, partStatus as baselinePartStatus, statusText } from './catalog'
import type { Checkpoint, ComponentId, Part } from './catalog'
import { SourceTree } from './SourceTree'
import { findSymbol } from './source'
import { PointOnPreview } from './PreviewGuide'
import type { RuntimeAdapter } from './RuntimeFlow'
import { RuntimeFlow } from './RuntimeFlow'
import type { FlowSelection } from './runtime-flows'
import flowStyles from './runtime-flow.module.css'
import styles from './workshop.module.css'
import type { ComponentChange, StageComparison } from './change-model'
import { ChangeInspector } from './ChangeInspector'

const icons = {
  entry: Workflow,
  model: Braces,
  catalog: Braces,
  form: PanelsTopLeft,
  validation: ShieldCheck,
  pricing: Calculator,
  client: Radio,
  storage: Database,
  mock: Server,
  read: List,
}
type ResponsibilityNode = Node<
  {
    id: ComponentId
    title: string
    status: string
    kind: string
    selected: boolean
    delta?:string; impacted?:boolean;
    select: () => void
  },
  'responsibility'
>
function ResponsibilityNodeView({ data }: NodeProps<ResponsibilityNode>) {
  const Icon = icons[data.id]
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <button
        aria-label={`Thành phần ${data.title}`}
        aria-pressed={data.selected}
        data-change={data.delta} data-impacted={data.impacted} className={`${styles.graphNode} ${styles[data.kind]} ${data.selected ? styles.graphSelected : ''}`}
        onClick={data.select}
      >
        <Icon aria-hidden />
        <strong>{data.title}</strong>
        <span>{data.status}</span>{data.delta&&data.delta!=='Kế thừa, không đổi'&&<small title="Thay đổi so với Chặng 1">{data.delta==='Kế thừa, có thay đổi'?'Thay đổi':data.delta==='Mới ở Chặng 2'?'Mới':data.delta}</small>}
      </button>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
const nodeTypes = { responsibility: ResponsibilityNodeView }
export type OverviewRelation = {
  from: ComponentId
  to: ComponentId
  label: string
  meaning: string
  flow: string[]
  change?: string
  requirements?:string[]
  available?:boolean
}
export const baselineRelations: OverviewRelation[] = [
  {
    from: 'entry',
    to: 'form',
    label: 'route tạo',
    meaning: 'Router gắn CreateQuotation vào URL tạo mới.',
    flow: [],
  },
  {
    from: 'entry',
    to: 'read',
    label: 'URL / ID',
    meaning: 'Router cấp ID để trang chi tiết có thể tải lại bằng URL.',
    flow: ['save'],
  },
  {
    from: 'model',
    to: 'form',
    label: 'types',
    meaning: 'Form giữ QuotationDraft; dữ liệu gửi dùng QuotationInput.',
    flow: [],
  },
  {
    from: 'form',
    to: 'validation',
    label: 'validate',
    meaning: 'Form yêu cầu kiểm tra draft trước khi tính hoặc gửi.',
    flow: ['calculate', 'save'],
  },
  {
    from: 'pricing',
    to: 'validation',
    label: 'dùng calendarDays',
    meaning: 'calculatePremium dùng helper calendarDays cùng module rules; validation không gọi hàm tính phí.',
    flow: ['calculate'],
  },
  {
    from: 'form',
    to: 'pricing',
    label: 'gọi calculatePremium',
    meaning: 'calculate của form gọi hàm thuần rồi giữ Premium trong state; JSX truyền phí tới PremiumSummary.',
    flow: ['calculate'],
  },
  {
    from: 'form',
    to: 'client',
    label: 'create(input)',
    meaning:
      'save chờ Promise từ client; chỉ điều hướng khi response thành công.',
    flow: ['save'],
  },
  {
    from: 'read',
    to: 'client',
    label: 'GET theo ID',
    meaning: 'Danh sách/chi tiết dùng GET thay vì lấy dữ liệu từ form cũ.',
    flow: ['save'],
  },
  {
    from: 'client',
    to: 'mock',
    label: 'HTTP ↔ response',
    meaning: 'Fetch gửi contract, MSW trả status và dữ liệu đã kiểm tra.',
    flow: ['save'],
  },
  {
    from: 'mock',
    to: 'storage',
    label: 'persist',
    meaning: 'Handler kiểm tra input rồi yêu cầu storage lưu dữ liệu.',
    flow: ['save'],
  },
  {
    from: 'storage',
    to: 'pricing',
    label: 'tính lại phí',
    meaning:
      'createQuotation tính lại Premium trước khi persist; không tin tổng client.',
    flow: ['save'],
  },
]
export interface OverviewAdapter {
  comparison?:StageComparison; componentChange?:(part:Part)=>ComponentChange|undefined
  parts:Part[]; relations:OverviewRelation[];runtime:RuntimeAdapter
  status:(part:Part,cp:Checkpoint)=>'future'|'current'|'existing'
  changes:Partial<Record<ComponentId,string>>
  requirements:Array<{id:string;title:string;before:string;after:string;reason:string;nodes:ComponentId[];checkpoint:string;file:string;symbol:string}>
  positions:Partial<Record<ComponentId,{x:number;y:number}>>
  preview:Partial<Record<ComponentId,string>>
}
const structureViews=new Map<string,{x:number;y:number;zoom:number}>()
export function Overview({
  checkpoint,
  selected,
  selectedFile,
  collapsed,
  onCollapse,
  onSelect,
  onFile,
  onCheckpoint,
  active = true,
  onCode,
  onBuild,
  flowSelection,
  onFlowSelection, adapter, requirement = '', onRequirement,
}: {
  adapter?:OverviewAdapter;requirement?:string;onRequirement?:(id:string)=>void
  checkpoint: Checkpoint
  selected: ComponentId
  selectedFile: string
  collapsed: string[]
  onCollapse: (value: string[]) => void
  onSelect: (id: ComponentId) => void
  onFile: (file: string) => void
  onCheckpoint: (id: string) => void
  active?: boolean
  onCode?: (file: string, symbol: string) => void
  onBuild?: (id: string) => void
  flowSelection?: FlowSelection
  onFlowSelection?: (patch: Partial<FlowSelection>) => void
}) {
  const parts=adapter?.parts??baselineParts, relations=adapter?.relations??baselineRelations
  const partById=(id:ComponentId)=>parts.find(part=>part.id===id)??baselinePartById(id)
  const partStatus=adapter?.status??baselinePartStatus
  const currentStatus=(part:Part)=>adapter?({future:'Chưa hình thành',current:'Đang bổ sung',existing:'Đã có'}[partStatus(part,checkpoint)]):statusText[partStatus(part,checkpoint)]
  const request=adapter?.requirements.find(item=>item.id===requirement)
  const viewKey=adapter?'stage2':'stage1', savedView=structureViews.get(viewKey)
  const [localFlowSelection, setLocalFlowSelection] = useState<FlowSelection>({ overviewMode: 'structure', runtimeFlow: 'input-edit', runtimeEvent: 'input', runtimeScenario: 'choose', runtimeField: 'customerName', runtimeHadPremium: false, runtimePath: 'input' })
  const currentFlowSelection = flowSelection ?? localFlowSelection
  function changeFlowSelection(patch: Partial<FlowSelection>) {
    setLocalFlowSelection(previous => ({ ...previous, ...patch }))
    onFlowSelection?.(patch)
  }
  const instance = useRef<ReactFlowInstance<ResponsibilityNode> | null>(null)
  const inspector = useRef<HTMLElement>(null)
  const [drawer, setDrawer] = useState(false)
  const [runtimeVisited, setRuntimeVisited] = useState(currentFlowSelection.overviewMode === 'runtime')
  useEffect(() => { if (currentFlowSelection.overviewMode === 'runtime') setRuntimeVisited(true) }, [currentFlowSelection.overviewMode])
  const part = partById(selected)
  useEffect(() => {
    if (inspector.current) inspector.current.scrollTop = 0
  }, [selected])
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const select = (id: ComponentId) => {
    onSelect(id)
    setDrawer(true)
  }
  const positions: Record<ComponentId, { x: number; y: number }> = {
    entry: { x: 0, y: 0 },
    model: { x: 240, y: 0 },
    catalog: { x: 480, y: 0 },
    form: { x: 0, y: 112 },
    validation: { x: 240, y: 112 },
    pricing: { x: 0, y: 224 },
    client: { x: 240, y: 224 },
    storage: { x: 0, y: 336 },
    mock: { x: 240, y: 336 },
    read: { x: 120, y: 448 },
  }
  const nodes: ResponsibilityNode[] = parts.map((item) => ({
    id: item.id,
    type: 'responsibility',
    position: adapter?.positions[item.id]??positions[item.id],
    focusable:false,selectable:false,
    selected: selected === item.id,
    data: {
      id: item.id,
      title: item.title,
      kind: partStatus(item, checkpoint),
      status: currentStatus(item),
      delta:adapter?.changes[item.id],impacted:request?.nodes.includes(item.id),
      selected: selected === item.id,
      select: () => select(item.id),
    },
  }))
  const edges = relations.filter(relation => adapter || relation.from === selected || relation.to === selected).map((relation, index) => {
    const related = relation.from === selected || relation.to === selected
    const active = related
    const impacted=Boolean(request&&relation.requirements?.includes(request.id))
    const color = impacted?'#7c3aed':adapter?(relation.change==='Mới ở Chặng 2'?'#15803d':['Thay đổi ở Chặng 2','Kế thừa, có thay đổi'].includes(relation.change??'')?'#b45309':'#94a3b8'):active||related?'#087EA4':'#CBD5E1'
    return {
      id: String(index),
      source: relation.from,
      target: relation.to,
      type: 'smoothstep',
      label: adapter?`${relation.label}${relation.change==='Mới ở Chặng 2'?' · Mới':['Thay đổi ở Chặng 2','Kế thừa, có thay đổi'].includes(relation.change??'')?' · Thay đổi':''}${relation.available===false?' · chưa nối':''}`:active?relation.label:undefined,
      animated: false,
      style: {
        stroke: color,
        strokeWidth: impacted?4:active||related?2:1,
        strokeDasharray:adapter&&(relation.change==='Mới ở Chặng 2'||relation.available===false)?'5 3':undefined,
        opacity:request&&!impacted ? .65 : 1,
      },
      labelStyle: { fontSize: 11, fill: '#111827' },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    }
  })
  return (
    <section className={styles.overview} aria-label="Sơ đồ và inspector">
      <div className={flowStyles.modeBar} role="group" aria-label="Chế độ tổng thể">
        <button aria-pressed={currentFlowSelection.overviewMode === 'structure'} onClick={() => changeFlowSelection({ overviewMode: 'structure' })}>Cấu trúc tính năng</button>
        <button aria-pressed={currentFlowSelection.overviewMode === 'runtime'} onClick={() => changeFlowSelection({ overviewMode: 'runtime' })}>Theo một thao tác</button>
      </div>
      <div className={flowStyles.runtimeHost} hidden={currentFlowSelection.overviewMode !== 'runtime'}>{runtimeVisited && <RuntimeFlow adapter={adapter?.runtime} active={active && currentFlowSelection.overviewMode === 'runtime'} checkpoint={checkpoint} selection={currentFlowSelection} onSelection={changeFlowSelection} onCode={onCode} onBuild={onBuild} onFile={onFile} onCheckpoint={onCheckpoint} />}</div>
      <div className={flowStyles.structure} hidden={currentFlowSelection.overviewMode !== 'structure'}>
      <div className={styles.graphToolbar}>
        {adapter&&<label className={styles.requirementPicker}>Yêu cầu<select aria-label="Yêu cầu tác động" value={requirement} onChange={event=>onRequirement?.(event.target.value)}><option value="">Toàn bộ yêu cầu</option>{adapter.requirements.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}{request&&<button onClick={()=>onRequirement?.('')}>Bỏ lọc yêu cầu</button>}
        <p hidden={Boolean(adapter)}>Quan hệ cấu trúc quanh phần đang chọn: gọi, dùng kiểu, render hoặc phụ thuộc. Mũi tên không chỉ thứ tự runtime.</p>
        <button
          onClick={() =>
            void instance.current?.fitView({ padding: 0.08, duration: 150 })
          }
        >
          <Maximize2 aria-hidden />
          Fit View
        </button>
        <button
          className={styles.drawerToggle}
          aria-expanded={drawer}
          onClick={() => setDrawer(!drawer)}
        >
          <PanelRightOpen aria-hidden />
          Chi tiết
        </button>
      </div>
      <div className={styles.overviewWorkspace}>
        <div className={styles.graphColumn}>
          <div className={styles.graph} data-testid="responsibility-graph">
            <ReactFlow<ResponsibilityNode>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onInit={(value) => {
                instance.current = value
              }}
              fitView={!savedView}
              defaultViewport={savedView}
              onMoveEnd={(_,view)=>structureViews.set(viewKey,view)}
              fitViewOptions={{ padding: 0.08 }}
              nodesDraggable={false}
              nodesConnectable={false}
              autoPanOnNodeFocus={false}
              deleteKeyCode={null}
              preventScrolling={false}
              zoomOnScroll={false}
              minZoom={0.4}
              maxZoom={1.6}
            >
              <Background color="#D8E2EB" gap={20} />
              <Controls showInteractive={false} showFitView={false} />
            </ReactFlow>
          </div>
          <div className={styles.legend}>
            <span>✓ Đã có</span>
            <span>{adapter?'＋ Mới ở Chặng 2':'＋ Bước này'}</span>
            <span>{adapter?'Δ Thay đổi ở Chặng 2':'○ Bước sau'}</span>{adapter&&<span>Viền xanh: selection · viền tím: tác động yêu cầu</span>}
            <span>Mô tả từ source</span>
          </div>
        </div>
        {drawer && (
          <button
            className={styles.drawerBackdrop}
            aria-label="Đóng inspector"
            onClick={() => setDrawer(false)}
          />
        )}
        <aside
          ref={inspector}
          className={`${styles.inspector} ${drawer ? styles.inspectorOpen : ''}`}
          aria-label="Inspector thành phần"
          data-testid="inspector"
        >
          <div className={styles.inspectorHeading}>
            <h2>{part.title}</h2>
            <button
              className={styles.drawerClose}
              aria-label="Đóng chi tiết"
              onClick={() => setDrawer(false)}
            >
              <X aria-hidden />
            </button>
          </div>
          {request&&<section aria-label="Tác động yêu cầu" className={styles.requirementDetails}><h3>{request.title}</h3><p><b>Trước:</b> {request.before}</p><p><b>Sau:</b> {request.after}</p><p><b>Lý do:</b> {request.reason}</p><p>{request.nodes.includes(selected)?'Thành phần đang chọn chịu tác động.':'Thành phần đang chọn giữ vai trò ngữ cảnh.'}</p><button onClick={()=>onCode?.(request.file,request.symbol)}>Xem source yêu cầu tại mốc này</button><button onClick={()=>onBuild?.(request.checkpoint)}>Học cách xây yêu cầu</button></section>}
          <span className={styles.badge}>
            {currentStatus(part)}
          </span>
          {adapter&&<p>{adapter.changes[part.id]}</p>}<h3>Trách nhiệm</h3>
          <p>{part.role}</p>{adapter?.comparison&&adapter.componentChange?.(part)&&<ChangeInspector comparison={adapter.comparison} change={adapter.componentChange(part)!}/>}{adapter&&<><PointOnPreview target={adapter.preview[part.id]} />{part.files.flatMap(file=>file.symbols.map(symbol=>{const range=findSymbol(checkpoint.id,file.path,symbol);return <div key={file.path+symbol}>{range?<button title={file.path+' · '+symbol} onClick={()=>onCode?.(file.path,symbol)}>Xem source · {symbol} · {range.start}–{range.end}</button>:<small>{symbol} · chưa hình thành</small>}</div>}))}</>}
          <dl className={styles.inspectorData}>
            <dt>Dữ liệu vào</dt>
            <dd>{part.input}</dd>
            <dt>Dữ liệu ra</dt>
            <dd>{part.output}</dd>
          </dl>
          <details>
            <summary>
              <Link2 aria-hidden />
              Phối hợp với thành phần khác
            </summary>
            <ul>
              {relations
                .filter(
                  (relation) =>
                    relation.from === selected || relation.to === selected,
                )
                .map((relation) => (
                  <li key={relation.from + relation.to}>
                    <strong>
                      {
                        partById(
                          relation.from === selected
                            ? relation.to
                            : relation.from,
                        ).title
                      }
                    </strong>
                    <p>{relation.meaning}</p>
                  </li>
                ))}
            </ul>
          </details>
          <div className={styles.formation}>
            <span>
              Bước {part.step} · mốc {part.birth}
            </span>
            <button onClick={() => onCheckpoint(part.birth)}>
              Đến bước
              <ArrowRight aria-hidden />
            </button>
            {onBuild && <button onClick={() => onBuild(part.birth)}>Xem cách xây</button>}
          </div>
          <div className={styles.treeLegend}>
            <span>
              <Link2 aria-hidden />
              Liên quan node
            </span>
            <span className={styles.selectedLegend}>File đang chọn</span>
          </div>
          <SourceTree
            checkpoint={checkpoint}
            active={active && currentFlowSelection.overviewMode === 'structure'}
            selectedFile={selectedFile}
            related={part.files.map((file) => file.path)}
            collapsed={collapsed}
            onCollapse={onCollapse}
            onSelect={onFile}
          />
        </aside>
      </div>
      </div>
    </section>
  )
}
