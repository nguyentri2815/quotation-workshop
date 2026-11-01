import { useEffect, useRef, useState } from 'react'
import type { GroupImperativeHandle, Layout, LayoutChangedMeta } from 'react-resizable-panels'

export type WorkMode = 'compare' | 'code' | 'preview'
export function validLayout(value: unknown): Layout {
  if (typeof value !== 'object' || value === null || !('version' in value) || value.version !== 1 || !('code' in value) || !('preview' in value)) return { code: 70, preview: 30 }
  const { code, preview } = value
  if (typeof code !== 'number' || typeof preview !== 'number' || !Number.isFinite(code) || !Number.isFinite(preview) || code < 0 || preview < 0 || Math.abs(code + preview - 100) > 0.1) return { code: 70, preview: 30 }
  if (preview === 0) return { code: 100, preview: 0 }
  const size = Math.min(60, Math.max(25, preview))
  return { code: 100 - size, preview: size }
}
function loadLayout(key: string) {
  try { return validLayout(JSON.parse(localStorage.getItem(key) ?? 'null')) }
  catch { return validLayout(null) }
}
export function useSplitLayout(key = 'quotation-workshop.layout.v1') {
  const [initial] = useState(() => loadLayout(key))
  const group = useRef<GroupImperativeHandle>(null)
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 1050px)').matches)
  const [collapsed, setCollapsed] = useState(initial.preview === 0)
  const [workMode, setWorkMode] = useState<WorkMode>(initial.preview === 0 ? 'code' : initial.preview >= 50 ? 'preview' : 'compare')
  const comparison = useRef(initial.preview > 0 && initial.preview < 50 ? initial : { code: 70, preview: 30 })
  const [dragging, setDragging] = useState(false)
  const [warning, setWarning] = useState('')
  const previous = useRef(initial.preview || 30)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1050px)')
    const change = () => { setSmall(query.matches); setDragging(false) }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!dragging) return
    const stop = () => setDragging(false)
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') stop() }
    window.addEventListener('pointerup', stop, true)
    window.addEventListener('pointercancel', stop, true)
    window.addEventListener('blur', stop)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('pointerup', stop, true); window.removeEventListener('pointercancel', stop, true); window.removeEventListener('blur', stop); window.removeEventListener('keydown', escape) }
  }, [dragging])
  function remember(layout: Layout) {
    const next = validLayout({ version: 1, ...layout })
    if (next.preview > 0) previous.current = next.preview
    setCollapsed(next.preview === 0)
    try { localStorage.setItem(key, JSON.stringify({ version: 1, ...next })); setWarning('') }
    catch { setWarning('Không lưu được độ rộng; vẫn có thể kéo trong phiên này.') }
  }
  function apply(layout: Layout) { const actual = group.current?.setLayout(layout); remember(actual ?? layout) }
  function changed(layout: Layout, meta: LayoutChangedMeta) {
    setCollapsed(layout.preview === 0)
    if (meta.isUserInteraction && !small) {
      remember(meta.requestedLayout ?? layout)
      setWorkMode(layout.preview === 0 ? 'code' : layout.preview >= 50 ? 'preview' : 'compare')
      if (layout.preview > 0 && layout.preview < 50) comparison.current = layout
    }
  }
  function reveal() {
    if (collapsed) { apply({ code: 100 - previous.current, preview: previous.current }); setWorkMode(previous.current >= 50 ? 'preview' : 'compare') }
  }
  function mode(value: WorkMode) { setWorkMode(value); apply(value === 'code' ? { code: 100, preview: 0 } : value === 'preview' ? { code: 45, preview: 55 } : comparison.current) }
  return { initial, group, small,
    capture: () => ({ layout: group.current?.getLayout() ?? initial, workMode }),
    restore: (view: { layout: Layout; workMode: WorkMode }) => { setWorkMode(view.workMode); apply(view.layout) }, collapsed, workMode, mode, dragging, warning, changed, reveal,
    toggle: () => collapsed ? reveal() : mode('code'),
    preset: (value: string) => { setWorkMode(value === 'preview' ? 'preview' : 'compare'); const next = value === 'code' ? { code: 75, preview: 25 } : value === 'preview' ? { code: 45, preview: 55 } : { code: 70, preview: 30 }; if (value !== 'preview') comparison.current = next; apply(next) },
    startDrag: () => { if (!small) setDragging(true) },
  }
}
