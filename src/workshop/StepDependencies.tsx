import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useOverlayFocus } from './useOverlayFocus'
import { ChevronDown, ChevronRight, Link2, Braces, Settings2, PanelRightOpen } from 'lucide-react'
import { checkpoints, fileMeaning, selectionForCheckpoint } from './catalog'
import type { Checkpoint } from './catalog'
import { findSymbol } from './source'
import { dependencyGraph } from './dependencies'
import { definitionsAt, selectedDefinition, relationsAt, definitionBirth, incomingLabel } from './dependency-tree.model'
import type { TreeDefinition, TreeRelation } from './dependency-tree.model'
import { rangeStatus, roleStatusLabel, useRoleSources } from './FunctionalTree.model'
import { FlowCode } from './RuntimeFlow'
import { SourceTree } from './SourceTree'
import type { Selection } from './navigation'
import { lessons } from './steps'
import styles from './dependency-tree.module.css'

type ReadingPosition = Pick<Selection, 'file' | 'symbol' | 'dependencyNode' | 'dependencyRelation' | 'dependencyLocation'>
const ancestors = (file: string) => file.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/'))
const add = (values: string[], extra: string[]) => [...new Set([...values, ...extra])]

export function StepDependencies({ checkpoint, selection, onChange, onCheckpoint, active = true, toolbarHost }: {
  checkpoint: Checkpoint; selection: Selection; onChange: (patch: Partial<Selection>) => void
  onCheckpoint: (id: string, file?: string, symbol?: string) => void; active?: boolean; toolbarHost?: HTMLElement | null
}) {
  const [future, setFuture] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [openSymbols, setOpenSymbols] = useState<string[]>([])
  const [allSymbols, setAllSymbols] = useState<string[]>([])
  const [history, setHistory] = useState<ReadingPosition[]>([])
  const [query, setQuery] = useState('')
  const [showInspector, setShowInspector] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const workspace = useRef<HTMLElement>(null)
  const inspector = useRef<HTMLElement>(null)
  const options = useRef<HTMLDialogElement>(null)
  useOverlayFocus(narrow && drawer, inspector, () => setDrawer(false))
  useEffect(() => {
    if (!workspace.current) return
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 800))
    observer.observe(workspace.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => { if (!active) { setDrawer(false); options.current?.close() } }, [active])
  const host = useRef<HTMLDivElement>(null)
  const lastContext = useRef(''), lastTarget = useRef(''), pending = useRef(false)
  const all = useMemo(() => definitionsAt(checkpoint, true), [checkpoint])
  const definitions = useMemo(() => all.filter(item => item.actual || future), [all, future])
  const relations = useMemo(() => relationsAt(checkpoint, all, future), [checkpoint, all, future])
  const item = selectedDefinition(all, selection, checkpoint)
  const selectedFile = item?.file ?? selection.file
  const selectedKey = item?.key ?? ''
  const scope = dependencyGraph(selection.step, selection.sub, selection.dependencyScope)
  const relatedKeys = new Set(all.filter(item => item.node && scope.nodes.some(node => node.id === item.node?.id)).map(item => item.key))
  const relatedFiles = [...new Set(all.filter(item => relatedKeys.has(item.key)).map(item => item.file))]
  const outgoing = relations.filter(edge => edge.source.key === item?.key)
  const incoming = relations.filter(edge => edge.target.key === item?.key)
  const relation = relations.find(edge => edge.key === selection.dependencyRelation)
  const location = relation?.sites[Math.min(selection.dependencyLocation, relation.sites.length - 1)]
  const requests = active ? add(openFiles, item ? [item.file] : []).flatMap(file => [checkpoint, ...checkpoints.filter(cp => cp.id === checkpoint.previous)].filter(cp => cp.files.some(item => item.path === file)).map(cp => ({ checkpoint: cp.id, file }))) : []
  const { sources, error } = useRoleSources(requests)
  const context = `${checkpoint.id}:${selection.step}:${selection.sub}:${selection.mark}:${selection.dependencyScope}`

  // Reveal a selected definition only after navigation. Resizing never resets disclosure or scroll.
  useLayoutEffect(() => {
    if (!active) return
    if (lastContext.current !== context) {
      lastContext.current = context
      const files = add(relatedFiles, [selectedFile])
      const folders = [...new Set(checkpoint.files.flatMap(file => ancestors(file.path)))]
      setCollapsed(folders.filter(folder => !files.some(file => ancestors(file).includes(folder))))
      setOpenFiles(files)
      setOpenSymbols(add(item ? [item.key] : [], [...incoming.filter(edge => relatedKeys.has(edge.source.key)).map(edge => edge.source.key), ...outgoing.filter(edge => edge.kind === 'Truyền props' && relatedKeys.has(edge.target.key)).map(edge => edge.target.key)]))
      setAllSymbols([])
      setHistory([])
      pending.current = true
      return
    }
    const target = `${context}:${selectedFile}:${selectedKey}:${future}`
    if (lastTarget.current !== target) {
      lastTarget.current = target
      pending.current = true
      const parents = ancestors(selectedFile)
      if (collapsed.some(folder => parents.includes(folder))) setCollapsed(old => old.filter(folder => !parents.includes(folder)))
      if (!openFiles.includes(selectedFile)) setOpenFiles(old => add(old, [selectedFile]))
      if (item && !openSymbols.includes(item.key)) setOpenSymbols(old => add(old, [item.key]))
    }
    const scroll = host.current?.querySelector<HTMLElement>('[data-testid="tree-scroll"]')
    const targetElement = scroll?.querySelector<HTMLElement>(item ? '[data-dependency-selected="true"]' : '[data-selected="true"]')
    if (pending.current && scroll && targetElement && scroll.clientHeight) {
      const outer = scroll.getBoundingClientRect(), target = targetElement.getBoundingClientRect()
      scroll.scrollTop += target.top - outer.top - (scroll.clientHeight - target.height) / 2
      pending.current = false
    }
  }, [active, context, item, selectedFile, selectedKey, future, openFiles, openSymbols, collapsed, checkpoint, relatedFiles, incoming, relatedKeys])

  function position(): ReadingPosition { return { file: selection.file, symbol: selection.symbol, dependencyNode: selection.dependencyNode, dependencyRelation: selection.dependencyRelation, dependencyLocation: selection.dependencyLocation } }
  function visit(target: TreeDefinition, edge = '') {
    if (target.key !== selectedKey || edge !== selection.dependencyRelation) setHistory(old => [...old, position()].slice(-80))
    onChange({ file: target.file, symbol: target.symbol, dependencyNode: target.key, dependencyRelation: edge, dependencyLocation: 0 })
    setQuery('')
  }
  function visitFile(file: string) {
    if (file !== selection.file || selection.symbol) setHistory(old => [...old, position()].slice(-80))
    setOpenFiles(old => add(old, [file]))
    onChange({ file, symbol: '', section: '', position: 0 })
  }
  function back() {
    const previous = history.at(-1)
    if (previous) { setHistory(old => old.slice(0, -1)); onChange(previous) }
  }
  function selectRelation(edge: TreeRelation, index = 0) { onChange({ dependencyRelation: edge.key, dependencyLocation: index }); if (narrow) setDrawer(true); else setShowInspector(true) }
  function openCode(target: TreeDefinition, symbol = target.symbol, edge = '') {
    onChange({ buildView: 'code', file: target.file, symbol, dependencyNode: target.key, dependencyRelation: edge, dependencyLocation: selection.dependencyLocation, section: '', position: 0 })
  }
  function toggleSymbol(key: string) { setOpenSymbols(old => old.includes(key) ? old.filter(item => item !== key) : [...old, key]) }
  function edgeRow(edge: TreeRelation, reverse = false) {
    const target = reverse ? edge.source : edge.target
    return <li key={edge.key} className={styles.relation} data-relation={edge.key} data-relation-selected={relation?.key === edge.key}>
      <span className={styles.relationKind}>{reverse ? incomingLabel[edge.kind] : edge.kind} {reverse ? '←' : '→'}</span>
      <button className={styles.target} data-relation-to={target.node?.id ?? target.key} title={`Mở ${target.file} · ${target.symbol}`} onClick={() => visit(target, edge.key)}><Link2 aria-hidden /><span>{target.title} <code>{target.range.name}</code><small>{target.file}</small></span></button>
      {!edge.ready && <small className={styles.future}>Chưa hình thành{edge.birth && ` · từ mốc ${edge.birth.id}`}</small>}
      <button className={styles.smallButton} aria-pressed={relation?.key === edge.key} onClick={() => selectRelation(edge)}>Xem quan hệ{edge.sites.length > 1 ? ` · ${edge.sites.length} vị trí` : ''}</button>
      {edge.sites.length > 1 && <details className={styles.positions}><summary>Chọn vị trí tham chiếu ({edge.sites.length})</summary><ul>{edge.sites.map((site, index) => {
        const range = findSymbol(checkpoint.id, site.file, site.symbol)
        return <li key={site.symbol}><button onClick={() => selectRelation(edge, index)}>{index + 1}. {range?.name} · dòng {range?.start}–{range?.end}</button></li>
      })}</ul></details>}
    </li>
  }
  function symbols(file: string) {
    const entries = definitions.filter(item => item.file === file)
    if (!entries.length) return <li className={styles.empty}>File có tại mốc; chưa có nhóm symbol được lập chỉ mục.</li>
    const main = entries.filter(entry => entry.key === selectedKey || relatedKeys.has(entry.key))
    const visible = main.length && !allSymbols.includes(file) ? main : entries
    return <>{visible.map(entry => {
      const links = relations.filter(edge => edge.source.key === entry.key).sort((a, b) => Number(b.kind === 'Truyền props') - Number(a.kind === 'Truyền props'))
      const selected = entry.key === selectedKey, expanded = openSymbols.includes(entry.key)
      const status = entry.actual ? rangeStatus(checkpoint, entry.file, entry.symbol, sources) : 'future'
      return <li key={entry.key} data-definition={entry.key} data-dependency-node={entry.node?.id}>
        <div className={styles.symbolRow}>
          <button className={styles.disclose} aria-label={`Quan hệ của ${entry.symbol}`} aria-expanded={expanded} onClick={() => toggleSymbol(entry.key)}>{expanded ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}</button>
          <button className={styles.symbol} data-dependency-selected={selected} aria-pressed={selected} onClick={() => visit(entry)}><Braces aria-hidden /><span><strong>{entry.title}</strong><code>{entry.symbol}</code><span className={styles.badges}>{selected && <small className={styles.viewing}>Đang xem</small>}{relatedKeys.has(entry.key) && <small>Liên quan</small>}{status && status !== 'available' && <small className={status === 'future' ? styles.future : styles.changed}>{status === 'new' ? 'Mới tại mốc' : status === 'modified' ? 'Đã sửa tại mốc' : 'Chưa hình thành'}</small>}</span></span></button>
        </div>
        {expanded && <ul className={styles.links} aria-label={`Quan hệ từ ${entry.symbol}`}>{links.length ? links.map(edge => edgeRow(edge)) : <li className={styles.empty}>Chưa có quan hệ ra được biên soạn tại mốc này.</li>}{selected && incoming.length > 0 && <li><details><summary>Quan hệ vào ({incoming.length})</summary><ul>{incoming.map(edge => edgeRow(edge, true))}</ul></details></li>}</ul>}
      </li>
    })}{main.length > 0 && main.length < entries.length && <li><button className={styles.moreSymbols} aria-expanded={allSymbols.includes(file)} onClick={() => setAllSymbols(old => old.includes(file) ? old.filter(item => item !== file) : [...old, file])}>{allSymbols.includes(file) ? 'Thu các symbol khác' : `Hiện thêm ${entries.length - main.length} symbol trong file`}</button></li>}</>
  }
  const birth = item ? definitionBirth(item) : undefined
  const birthPosition = birth && selectionForCheckpoint(birth.id)
  const results = query.trim() ? definitions.filter(entry => `${entry.title} ${entry.symbol} ${entry.file}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 30) : []
  const toolbar = (<div className={styles.toolbar} hidden={!active}>
      <select className={styles.scope} aria-label="Phạm vi dependency" value={selection.dependencyScope} onChange={e => onChange({ dependencyScope: e.target.value === 'step' ? 'step' : 'current' })}><option value="step">Toàn bước {selection.step}</option><option value="current">Sub-step {selection.step}.{selection.sub + 1}</option></select>
      <div className={styles.search}><input type="search" aria-label="Tìm symbol trên cây" placeholder="Tìm symbol…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery(''); if (e.key === 'ArrowDown') { e.preventDefault(); workspace.current?.querySelector<HTMLElement>('[data-search-result]')?.focus() }; if (e.key === 'Enter' && results[0]) visit(results[0]) }} />{query && <div className={styles.results} aria-label="Kết quả tìm symbol">{results.length ? results.map(entry => <button key={entry.key} data-search-result={entry.node?.id ?? entry.key} onClick={() => visit(entry)}>{entry.title}<code>{entry.symbol} · {entry.file}</code></button>) : <p role="status">Không tìm thấy symbol tại phạm vi source đang xem. Có thể mở phần chưa hình thành trong Tùy chọn.</p>}</div>}</div>
      <button className={styles.historyBack} title="Quay lại lựa chọn trước" aria-label="Quay lại lựa chọn trước" disabled={!history.length} onClick={back}>←</button>
      <button className={styles.inspectorToggle} aria-label={narrow ? 'Chi tiết' : showInspector ? 'Thu chi tiết' : 'Mở chi tiết'} title="Thu/mở chi tiết dependency" aria-expanded={narrow ? drawer : showInspector} onClick={() => narrow ? setDrawer(!drawer) : setShowInspector(!showInspector)}><PanelRightOpen aria-hidden /></button>
      <button aria-label="Tùy chọn" title="Tùy chọn cây phụ thuộc" onClick={() => options.current?.showModal()}><Settings2 aria-hidden /></button>
    </div>)
  return <section ref={workspace} className={styles.dependency} aria-label="Phụ thuộc của bước" data-testid="step-dependencies">
    {toolbarHost ? createPortal(toolbar, toolbarHost) : toolbar}
    {error && <p role="alert">{error}</p>}
    {item && !item.actual && !future && <p className={styles.missing}>Symbol được yêu cầu chưa hình thành tại {checkpoint.id}. <button onClick={() => setFuture(true)}>Hiện vị trí tương lai trên cây</button></p>}
    <Group id="dependency-workspace" className={`${styles.panes} ${narrow || !showInspector ? styles.treeOnly : ''}`} defaultLayout={{ 'dependency-tree-panel': 65, 'dependency-inspector-panel': 35 }} disabled={narrow || !showInspector}>
      <Panel id="dependency-tree-panel" minSize="40%" className={styles.treePanel}><div ref={host} className={styles.treeHost}>
        <SourceTree compact checkpoint={checkpoint} selectedFile={selectedFile} related={relatedFiles} collapsed={collapsed} onCollapse={setCollapsed} active={false} future={future} label={`Cây phụ thuộc checkpoint ${checkpoint.id}`} expandedFiles={openFiles} onExpandFile={file => setOpenFiles(old => old.includes(file) ? old.filter(item => item !== file) : [...old, file])} onSelect={visitFile} renderSymbols={symbols} />
      </div></Panel>
      <Separator className={styles.separator} aria-label="Kéo độ rộng chi tiết dependency" />
      <Panel id="dependency-inspector-panel" minSize="250px" className={styles.inspectorPanel}>
      {narrow && drawer && <button className={styles.backdrop} aria-label="Đóng chi tiết dependency" onClick={() => setDrawer(false)} />}
      <aside ref={inspector} className={`${styles.inspector} ${narrow ? styles.drawer : ''} ${narrow && drawer ? styles.drawerOpen : ''}`} role={narrow && drawer ? 'dialog' : undefined} aria-modal={narrow && drawer || undefined} aria-label="Chi tiết dependency">
        {narrow && <button data-overlay-close onClick={() => setDrawer(false)}>Đóng chi tiết</button>}
        {item ? <><h2>{item.title}</h2><p className={styles.role}>{item.role}</p>
        <h3>Quan hệ ra ({outgoing.length})</h3><ul className={styles.compact}>{outgoing.map(edge => <li key={edge.key}><button onClick={() => visit(edge.target, edge.key)}>{edge.kind} → {edge.target.title}</button></li>)}</ul>
        <details><summary>Quan hệ vào ({incoming.length})</summary><ul className={styles.compact}>{incoming.map(edge => <li key={edge.key}><button onClick={() => visit(edge.source, edge.key)}>{incomingLabel[edge.kind]} ← {edge.source.title}</button></li>)}</ul></details>
        <details className={styles.metadata}><summary>File / symbol · mốc {checkpoint.id}</summary><dl><dt>File / symbol tại checkpoint {checkpoint.id}</dt><dd>{item.file}<code>{item.symbol}</code>{item.actual ? `Dòng ${item.range.start}–${item.range.end}` : 'Chưa hình thành'}</dd><dt>Bước hình thành code</dt><dd>{birth && birthPosition ? `${birthPosition.step}.${birthPosition.sub + 1} · mốc ${birth.id}` : 'Chưa có mốc'}</dd><dt>Trạng thái</dt><dd>{item.actual ? roleStatusLabel[rangeStatus(checkpoint, item.file, item.symbol, sources) ?? 'available'] : 'Chưa hình thành tại checkpoint này'}</dd></dl></details>
        {item.actual && <><button onClick={() => openCode(item)}>Mở đúng file/range trong Code</button><details className={styles.source}><summary>Xem source symbol</summary><FlowCode checkpoint={checkpoint} source={item} /></details></>}
        {!item.actual && birth && <button onClick={() => onCheckpoint(birth.id, item.file, item.symbol)}>Đến bước hình thành {birthPosition?.step}.{(birthPosition?.sub ?? 0) + 1} · {birth.id}</button>}</> : <><h2>{selectedFile.split('/').at(-1)}</h2><p>{fileMeaning(selectedFile)}</p><code>{selectedFile}</code><p>{selection.symbol ? `Không tìm thấy symbol “${selection.symbol}” trong mapping tại mốc ${checkpoint.id}.` : `Đang chọn file tại mốc ${checkpoint.id}. Mở một symbol trên cây để đọc trách nhiệm và quan hệ.`}</p><button onClick={() => onChange({ buildView: 'code' })}>Xem source file</button></>}
        {relation && <section className={styles.edgeInspector} aria-label="Quan hệ đang chọn"><h3>{relation.source.title} → {relation.kind} → {relation.target.title}</h3><p>{relation.kind === 'Truyền props' && relation.from === 'props' ? 'Truyền dữ liệu premium và stale; không truyền callback. React render component từ props.' : relation.kind === 'Phụ thuộc type' ? 'Tham chiếu kiểu dữ liệu ở compile time; không gọi hàm khi runtime.' : relation.kind === 'Gọi' ? 'Lời gọi tại các vị trí source bên dưới; kết quả và đối số xem đúng đoạn code.' : relation.note ?? 'Liên kết có hướng từ nơi tham chiếu đến định nghĩa đích.'}</p>
          <button onClick={() => visit(relation.source, relation.key)}>Chọn nguồn trên cây</button><button onClick={() => visit(relation.target, relation.key)}>Chọn đích trên cây</button>
          {relation.ready && location ? <><label>Vị trí code nguồn<select aria-label="Vị trí code nguồn" value={Math.min(selection.dependencyLocation, relation.sites.length - 1)} onChange={e => selectRelation(relation, Number(e.target.value))}>{relation.sites.map((site, index) => { const range = findSymbol(checkpoint.id, site.file, site.symbol); return <option key={site.symbol} value={index}>{index + 1}. {range?.name} · {range?.start}–{range?.end}</option> })}</select></label><button onClick={() => openCode(relation.source, location.symbol, relation.key)}>Xem code nguồn</button><button onClick={() => openCode(relation.target, relation.target.symbol, relation.key)}>Xem code đích</button><FlowCode checkpoint={checkpoint} source={location} /></> : <p className={styles.missing}>Quan hệ chưa hình thành tại {checkpoint.id}.{relation.birth && <button onClick={() => onCheckpoint(relation.birth!.id, relation.source.file, relation.source.symbol)}>Đến mốc {relation.birth.id}</button>}</p>}
        </section>}
      </aside>
      </Panel>
    </Group>
    <dialog ref={options} className={styles.options} aria-label="Tùy chọn cây phụ thuộc"><header><h2>Tùy chọn cây phụ thuộc</h2><button autoFocus onClick={() => options.current?.close()}>Đóng tùy chọn</button></header>
      <label>Phạm vi<select aria-label="Phạm vi trong tùy chọn" value={selection.dependencyScope} onChange={e => onChange({ dependencyScope: e.target.value === 'step' ? 'step' : 'current' })}><option value="step">Toàn bước {selection.step}</option><option value="current">Sub-step {selection.step}.{selection.sub + 1}</option></select></label>
      <button disabled={!history.length} onClick={() => { back(); options.current?.close() }}>Quay lại lựa chọn trước trên cây</button>
      <button onClick={() => { options.current?.close(); if (narrow) setDrawer(true); else setShowInspector(true) }}>Mở inspector của symbol</button>
      <label className={styles.checkbox}><input type="checkbox" checked={future} onChange={e => setFuture(e.target.checked)} />Xem phần chưa hình thành</label>
      <details className={styles.help}><summary>Cách đọc cây · checkpoint {checkpoint.id}</summary><p>Folder/file/symbol ở vị trí thật. Mũi tên là liên kết chéo; mỗi đích chỉ có một định nghĩa. Phụ thuộc type không phải lời gọi runtime. Đang xem khác Liên quan; Mới/Đã sửa so với checkpoint trước. _workshop và index.html là phần nhúng riêng. Quan hệ được biên soạn cho bài học, không phải toàn bộ dependency tự suy ra.</p></details>
      {selection.dependencyScope === 'step' && <details className={styles.help}><summary>Các phần hình thành và điểm ghép của bước</summary><ol>{lessons[selection.step].tasks.map((task, index) => <li key={task.title}>{selection.step}.{index + 1} · {task.title} — {task.change}</li>)}</ol></details>}
    </dialog>
  </section>
}
