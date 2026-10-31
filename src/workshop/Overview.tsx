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
import { parts, partById, partStatus, statusText } from './catalog'
import type { Checkpoint, ComponentId } from './catalog'
import { SourceTree } from './SourceTree'
import { RuntimeFlow } from './RuntimeFlow'
import type { FlowSelection } from './runtime-flows'
import flowStyles from './runtime-flow.module.css'
import styles from './workshop.module.css'

const icons = {
  entry: Workflow,
  model: Braces,
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
        className={`${styles.graphNode} ${styles[data.kind]} ${data.selected ? styles.graphSelected : ''}`}
        onClick={data.select}
      >
        <Icon aria-hidden />
        <strong>{data.title}</strong>
        <span>{data.status}</span>
      </button>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
const nodeTypes = { responsibility: ResponsibilityNodeView }
const relations: Array<{
  from: ComponentId
  to: ComponentId
  label: string
  meaning: string
  flow: string[]
}> = [
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
  flowSelection,
  onFlowSelection,
}: {
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
  flowSelection?: FlowSelection
  onFlowSelection?: (patch: Partial<FlowSelection>) => void
}) {
  const [localFlowSelection, setLocalFlowSelection] = useState<FlowSelection>({ overviewMode: 'structure', runtimeFlow: 'input-edit', runtimeEvent: 'input', runtimeScenario: 'choose', runtimeField: 'customerName', runtimeHadPremium: false, runtimePath: 'input' })
  const currentFlowSelection = flowSelection ?? localFlowSelection
  function changeFlowSelection(patch: Partial<FlowSelection>) {
    setLocalFlowSelection(previous => ({ ...previous, ...patch }))
    onFlowSelection?.(patch)
  }
  const instance = useRef<ReactFlowInstance<ResponsibilityNode> | null>(null)
  const inspector = useRef<HTMLElement>(null)
  const [drawer, setDrawer] = useState(false)
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
    position: positions[item.id],
    selected: selected === item.id,
    data: {
      id: item.id,
      title: item.title,
      kind: partStatus(item, checkpoint),
      status: statusText[partStatus(item, checkpoint)],
      selected: selected === item.id,
      select: () => select(item.id),
    },
  }))
  const edges = relations.filter(relation => relation.from === selected || relation.to === selected).map((relation, index) => {
    const related = relation.from === selected || relation.to === selected
    const active = related
    const color = active || related ? '#087EA4' : '#CBD5E1'
    return {
      id: String(index),
      source: relation.from,
      target: relation.to,
      type: 'smoothstep',
      label: active ? relation.label : undefined,
      animated: false,
      style: {
        stroke: color,
        strokeWidth: active || related ? 2 : 1,
        opacity: 1,
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
      {currentFlowSelection.overviewMode === 'runtime' && <RuntimeFlow checkpoint={checkpoint} selection={currentFlowSelection} onSelection={changeFlowSelection} onCode={onCode} onFile={onFile} onCheckpoint={onCheckpoint} />}
      <div className={flowStyles.structure} hidden={currentFlowSelection.overviewMode !== 'structure'}>
      <div className={styles.graphToolbar}>
        <p>Quan hệ cấu trúc quanh phần đang chọn: gọi, dùng kiểu, render hoặc phụ thuộc. Mũi tên không chỉ thứ tự runtime.</p>
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
              fitView
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
            <span>＋ Bước này</span>
            <span>○ Bước sau</span>
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
          <span className={styles.badge}>
            {statusText[partStatus(part, checkpoint)]}
          </span>
          <h3>Trách nhiệm</h3>
          <p>{part.role}</p>
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
