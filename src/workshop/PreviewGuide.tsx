import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const fields: Record<string, string> = { fieldExample: 'Field minh họa', customerName: 'Tên khách hàng', phone: 'Điện thoại', email: 'Email', assetName: 'Tên tài sản', address: 'Địa chỉ tài sản', sumInsured: 'Số tiền bảo hiểm', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc' }
const areas: Record<string, string> = { customer: 'Nhóm khách hàng', asset: 'Nhóm tài sản', period: 'Nhóm thời hạn', premium: 'Kết quả phí' }
const eventAreas: Record<string, string> = { premiumEmpty: 'Chưa có kết quả phí', detailNotFound: 'Không tìm thấy ID', calculate: 'Nút Tính phí', save: 'Nút Lưu bản chào', saving: 'Đang lưu', validationErrors: 'Lỗi tại trường nhập', premiumResult: 'Phí đã tính', premiumStale: 'Phí cần tính lại', saveError: 'Phản hồi lỗi trên form', savedResult: 'Kết quả đã lưu', readPage: 'Trang đọc dữ liệu', readData: 'Dữ liệu đã tải', emptyList: 'Danh sách rỗng', readError: 'Lỗi tải dữ liệu', readRetry: 'Thử lại GET', cancel: 'Nút Hủy', discardDialog: 'Xác nhận rời form', discardStay: 'Tiếp tục nhập', discardConfirm: 'Bỏ dữ liệu' }
function locate(doc: Document, id: string) {
  if (id in fields) return doc.getElementById(id)?.closest('div') ?? null
  if (id in areas) return doc.querySelector(`[aria-labelledby="${id}-heading"]`)
  const root = doc.getElementById('root')
  if (!root) return null
  const button = (text: string, host: ParentNode = root) => [...host.querySelectorAll('button')].find(el => el.textContent?.trim() === text) ?? null
  const form = root.querySelector('form')
  const premium = root.querySelector('[aria-labelledby="premium-heading"]')
  const dialog = root.querySelector('dialog[open][aria-labelledby="discard-title"]')
  const screen = doc.defaultView?.location.hash.split('?')[0]
  const creating = screen === '#/quotations/new'
  const reading = screen === '#/quotations' || Boolean(screen?.startsWith('#/quotations/') && !creating)
  switch (id) {
    case 'calculate': return creating && form ? button('Tính phí', form) : null
    case 'save': return creating ? form?.querySelector('button[type="submit"]') ?? null : null
    case 'cancel': return creating && form ? button('Hủy', form) : null
    case 'saving': return creating && form?.getAttribute('aria-busy') === 'true' ? form.querySelector('button[type="submit"]') : null
    case 'validationErrors': return creating ? form?.querySelector('[id$="-error"]') ?? null : null
    case 'premiumResult': return creating && premium?.querySelector('dl') && premium.textContent?.includes('Đã tính phí') ? premium : null
    case 'premiumStale': return creating && premium?.textContent?.includes('Cần tính lại phí') ? premium : null
    case 'premiumEmpty': return creating && premium?.textContent?.includes('Chưa có kết quả phí') ? premium : null
    case 'saveError': {
      const alert = creating ? form?.querySelector('[role="alert"]') : null
      return alert && !/Vui lòng kiểm tra các trường|Vui lòng tính phí|Thao tác lưu chưa/.test(alert.textContent ?? '') ? alert : null
    }
    case 'savedResult': return reading ? [...root.querySelectorAll('[role="status"]')].find(el => /Đã lưu|ID:/.test(el.textContent ?? '')) ?? root.querySelector('[aria-labelledby="detail-customer"]') : null
    case 'detailNotFound': return reading && screen !== '#/quotations' && root.textContent?.includes('Bản chào có thể nằm') ? root.querySelector('[role="alert"]') : null
    case 'readPage': return reading ? root.querySelector('[aria-labelledby="list-heading"]') ?? root.querySelector('[aria-labelledby="detail-customer"]') : null
    case 'readData': return reading ? root.querySelector('table') ?? root.querySelector('[aria-labelledby="detail-customer"]') : null
    case 'emptyList': return reading ? [...root.querySelectorAll('h3')].find(el => el.textContent === 'Chưa có bản chào nào')?.parentElement ?? null : null
    case 'readError': return reading ? root.querySelector('[role="alert"]') : null
    case 'readRetry': return reading ? button('Thử lại') : null
    case 'discardDialog': return dialog
    case 'discardStay': return dialog ? button('Tiếp tục nhập', dialog) : null
    case 'discardConfirm': return dialog ? button('Bỏ dữ liệu', dialog) : null
  }
  return null
}
export function previewTarget(file: string, symbol: string): string | undefined {
  if (file === 'components/PremiumSummary.tsx' && symbol.startsWith('PremiumSummary')) return 'premium'
  if (file !== 'pages/CreateQuotation.tsx') return
  if (symbol === 'Field' || symbol === 'Field.render') return 'fieldExample'
  const field = symbol.match(/^CreateQuotation\.field\.(\w+)$/)?.[1]
  if (field && field in fields) return field
  const area = symbol.match(/^CreateQuotation\.jsx\.(\w+)-heading$/)?.[1]
  return area && area in areas ? area : undefined
}
interface Guide { attach: (frame: HTMLIFrameElement | null) => void; available: string[]; point: (id: string) => void; mode: string }
const Context = createContext<Guide>({ attach: () => undefined, available: [], point: () => undefined, mode: 'sample' })
export const usePreviewGuide = () => useContext(Context)
// Host-only learning overlay. No message protocol, business handlers, input focus or data mutations.
export function PreviewGuideProvider({ children, mode, onReveal }: { children: ReactNode; mode: string; onReveal: () => void }) {
  const [attachment, setAttachment] = useState<{ frame: HTMLIFrameElement | null }>({ frame: null })
  const attach = useCallback((frame: HTMLIFrameElement | null) => setAttachment({ frame }), [])
  const { frame } = attachment
  const [available, setAvailable] = useState<string[]>([])
  const cleanup = useRef<() => void>(() => undefined)
  useEffect(() => {
    cleanup.current()
    if (!frame || mode !== 'sample' || new URL(frame.src, window.location.href).origin !== window.location.origin) { setAvailable([]); return }
    const doc = frame.contentDocument
    if (!doc) { setAvailable([]); return }
    const inspect = () => {
      const next = [...Object.keys(fields), ...Object.keys(areas), ...Object.keys(eventAreas)].filter(id => locate(doc, id))
      setAvailable(old => old.join() === next.join() ? old : next)
    }
    const observer = new MutationObserver(inspect)
    observer.observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy', 'aria-invalid', 'open'] })
    frame.contentWindow?.addEventListener('hashchange', inspect)
    inspect()
    return () => { observer.disconnect(); frame.contentWindow?.removeEventListener('hashchange', inspect); cleanup.current() }
  }, [attachment, frame, mode])
  const point = useCallback((id: string) => {
    if (!frame || mode !== 'sample' || !available.includes(id) || new URL(frame.src, window.location.href).origin !== window.location.origin) return
    const doc = frame.contentDocument, win = frame.contentWindow
    if (!doc || !win) return
    const target = locate(doc, id)
    if (!target) return
    cleanup.current()
    onReveal()
    // Wait for a mobile preview pane to become visible before measuring.
    const tick = window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'instant' })
      const overlay = doc.createElement('div')
      overlay.dataset.workshopHighlight = id
      overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:3px solid #0284c7;border-radius:8px;background:#0ea5e914;box-sizing:border-box;'
      const label = doc.createElement('span')
      label.textContent = fields[id] ?? areas[id] ?? eventAreas[id]
      label.style.cssText = 'position:absolute;left:0;top:0;background:#075985;color:white;padding:3px 7px;border-radius:0 0 5px 0;font:12px system-ui;'
      overlay.append(label); doc.body.append(overlay)
      const position = () => { const r = target.getBoundingClientRect(); Object.assign(overlay.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` }) }
      position(); win.addEventListener('scroll', position, true); win.addEventListener('resize', position)
      const timeout = window.setTimeout(() => cleanup.current(), 3500)
      cleanup.current = () => { window.clearTimeout(timeout); overlay.remove(); win.removeEventListener('scroll', position, true); win.removeEventListener('resize', position) }
    })
    cleanup.current = () => window.cancelAnimationFrame(tick)
  }, [frame, mode, available, onReveal])
  return <Context.Provider value={{ attach, available, point, mode }}>{children}</Context.Provider>
}
export function PointOnPreview({ target, compact = false }: { target?: string; compact?: boolean }) {
  const guide = usePreviewGuide()
  return target && guide.available.includes(target) ? <button aria-label="Chỉ trên preview" title="Chỉ trên preview" onClick={() => guide.point(target)}>{compact ? '◎' : 'Chỉ trên preview'}</button> : null
}
