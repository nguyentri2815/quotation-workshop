import type { RunBridge, NetworkEvidence } from './preview-adapter'
import { outcomeFlow } from './model'
import type { RunPlan, RunTask, RunMode, RunRecord } from './model'

type Evidence = Omit<RunRecord, 'id' | 'session' | 'order' | 'at' | 'step'>
type Callbacks = { record: (value: Evidence) => void; stage: (text: string) => void; gate: () => Promise<void>; followUI: () => boolean; explored: () => void; speed: () => number }
export function abortError() { return new DOMException('Phiên đã kết thúc.', 'AbortError') }
export function waitFor<T>(read: () => T | undefined | false | null, signal: AbortSignal, timeout = 16000): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>
    const deadline = Date.now() + timeout
    const finish = (value?: T, error?: unknown) => { clearTimeout(timer); signal.removeEventListener('abort', cancel); if (error) reject(error); else resolve(value!) }
    const cancel = () => finish(undefined, abortError())
    const tick = () => {
      if (signal.aborted) { cancel(); return }
      try {
        const value = read()
        if (value !== undefined && value !== false && value !== null) { finish(value); return }
        if (Date.now() >= deadline) { finish(undefined, new Error('Hết thời gian chờ điều kiện thực tế; chưa xác nhận đạt.')); return }
        timer = setTimeout(tick, 60)
      } catch (error) { finish(undefined, error) }
    }
    signal.addEventListener('abort', cancel, { once: true }); tick()
  })
}
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
const button = (doc: Document, label: string) => [...doc.querySelectorAll<HTMLButtonElement>('button')].find(el => {
  const copy = el.cloneNode(true) as HTMLButtonElement
  copy.querySelectorAll('[aria-hidden="true"],svg').forEach(icon => icon.remove())
  return text(copy) === label
}) ?? null
export function runTarget(doc: Document, target: string): HTMLElement | null {
  const root = doc.getElementById('root')
  if (target === 'root') return root
  const labels: Record<string, string> = { calculate: 'Tính phí', fill: 'Điền dữ liệu mẫu', save: 'Lưu bản chào', armError: 'Gây lỗi lần lưu kế tiếp' }
  if (labels[target]) return button(doc, labels[target])
  if (['customer','asset','period','premium'].includes(target)) return root?.querySelector(`[aria-labelledby="${target}-heading"]`) ?? null
  if (target === 'validationErrors') return root?.querySelector('[id$="-error"]') ?? null
  if (target === 'saveError') return root?.querySelector('form [role="alert"]') ?? null
  if (target === 'saved') return root?.querySelector('[aria-labelledby="detail-customer"]') ?? [...root?.querySelectorAll<HTMLElement>('[role="status"]') ?? []].find(el => /Đã lưu|ID:/.test(text(el))) ?? null
  if (target === 'toolStatus') return doc.querySelector('body > details [role="status"]')
  return doc.getElementById(target)
}
export function snapshot(doc: Document) {
  const values = Object.fromEntries([...doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#root input, #root textarea')].map(el => [el.id, el.value]))
  const premium = text(runTarget(doc, 'premium'))
  return { values, count: Object.keys(values).length, premium, invalid: Boolean(doc.querySelector('#root [id$="-error"]')), error: text(runTarget(doc, 'saveError')), saving: doc.querySelector('form')?.getAttribute('aria-busy') === 'true', saved: Boolean(runTarget(doc, 'saved')), saveDisabled: button(doc, 'Lưu bản chào')?.disabled, toolStatus: text(runTarget(doc, 'toolStatus')), root: text(doc.getElementById('root')).slice(0, 1400) }
}

export class RunDriver {
  private removeHighlight = () => {}
  private networkCursor = 0
  private sent = new Set<string>()
  private taskNetwork = new Map<string, number>()
  private cleanups: (() => void)[] = []
  constructor(readonly frame: HTMLIFrameElement, readonly session: string, readonly plan: RunPlan, readonly signal: AbortSignal, readonly callbacks: Callbacks) {}
  private get document() {
    const url = new URL(this.frame.src, location.href)
    if (url.origin !== location.origin || url.searchParams.get('workshopRun') !== this.session || !url.pathname.startsWith(`/checkpoints/${this.plan.checkpoint.id}/`)) throw new Error('Iframe không khớp phiên/checkpoint/origin.')
    const doc = this.frame.contentDocument, bridge = this.frame.contentWindow?.__workshopRun
    if (!doc || !bridge || bridge.version !== 1 || bridge.session !== this.session || bridge.checkpoint !== this.plan.checkpoint.id || !Array.isArray(bridge.network)) return
    return doc
  }
  async ready() {
    const doc = await waitFor(() => {
      const doc = this.document
      return doc?.querySelector('#root h1') && !/Không khởi động được|Không mở được/.test(text(doc.getElementById('root'))) ? doc : undefined
    }, this.signal, 30000)
    const manual = (event: Event) => { if (event.isTrusted) this.callbacks.explored() }
    doc.addEventListener('wheel', manual, { passive: true }); doc.addEventListener('touchmove', manual, { passive: true })
    const keys = (event: KeyboardEvent) => { if (['PageUp','PageDown','Home','End'].includes(event.key) && !['INPUT','TEXTAREA'].includes((event.target as Element)?.tagName)) manual(event) }
    doc.addEventListener('keydown', keys)
    this.cleanups.push(() => { doc.removeEventListener('wheel', manual); doc.removeEventListener('touchmove', manual); doc.removeEventListener('keydown', keys) })
  }
  highlight(targetId: string, label: string, scroll = this.callbacks.followUI()) {
    const doc = this.document, win = this.frame.contentWindow
    if (!doc || !win) return
    this.removeHighlight()
    const target = runTarget(doc, targetId)
    if (!target) return
    if (scroll) target.scrollIntoView({ block: 'center', behavior: 'instant' })
    const outline = doc.createElement('div'), caption = doc.createElement('div')
    outline.dataset.runHighlight = targetId
    outline.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;border:3px solid #0e7490;border-radius:7px;background:#0891b212;box-sizing:border-box;'
    caption.dataset.runCaption = this.session
    caption.textContent = label
    caption.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;bottom:8px;left:8px;right:8px;padding:8px 10px;background:#164e63;color:white;border-radius:6px;font:13px/1.45 system-ui;box-shadow:0 2px 8px #0003;'
    doc.body.append(outline, caption)
    const position = () => { const rect = target.getBoundingClientRect(); Object.assign(outline.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }) }
    position(); win.addEventListener('scroll', position, true); win.addEventListener('resize', position)
    this.removeHighlight = () => { outline.remove(); caption.remove(); win.removeEventListener('scroll', position, true); win.removeEventListener('resize', position) }
  }
  private network(task: RunTask) {
    const bridge = this.frame.contentWindow?.__workshopRun
    if (!bridge) return
    for (const item of bridge.network.slice(this.networkCursor)) {
      if (item.session !== this.session || !Number.isInteger(item.order) || !['request','response','network-error'].includes(item.kind) || typeof item.url !== 'string' || typeof item.method !== 'string') continue
      this.callbacks.record({ action: task.title, kind: item.kind === 'request' ? 'request' : 'response', title: item.kind === 'request' ? `${item.method} gửi tới mock` : `MSW phản hồi ${item.status ?? 'lỗi'}`, detail: `${item.method} ${new URL(item.url).pathname}${item.status ? ` · HTTP ${item.status}` : ''} · request ${item.requestId}`, sources: task.sources, ui: task.resultTarget, flow: item.method === 'POST' ? 'save' : undefined, event: item.method === 'POST' ? item.kind === 'request' ? 'post' : item.status && item.status >= 400 ? 'failure' : 'response' : undefined, explanation: 'Đã quan sát ở MSW. Bằng chứng HTTP không xác nhận React state, lời gọi hàm hoặc transaction lưu trữ.' })
    }
    this.networkCursor = bridge.network.length
  }
  async execute(task: RunTask, mode: RunMode, retryObserve = false) {
    const doc = this.document
    if (!doc) throw new Error('Iframe chưa sẵn sàng.')
    const before = snapshot(doc), bridge = this.frame.contentWindow!.__workshopRun as RunBridge
    if (!this.taskNetwork.has(task.id)) this.taskNetwork.set(task.id, bridge.network.length)
    const initialNetwork = this.taskNetwork.get(task.id)!
    let interacted = task.kind === 'inspect', capturedBusy = false
    const target = await waitFor(() => runTarget(doc, task.target), this.signal)
    if (task.kind === 'arm-error') target.closest('details')?.setAttribute('open', '')
    const input = (event: Event) => {
      const el = event.target as HTMLInputElement
      const matching = task.kind === 'input' || task.kind === 'edit' ? event.type === 'input' && el.id === task.target : event.type === 'click' && (el === target || target.contains(el))
      if (!matching || (task.manual && !event.isTrusted)) return
      interacted = true
      if (event.type === 'click') this.sent.add(task.id)
      this.callbacks.record({ kind: 'dom', action: task.title, title: event.type === 'input' ? `Input DOM: ${el.id}` : `Bấm ${text(target)}`, detail: `${event.isTrusted ? 'Người học' : 'Trình diễn'} · ${event.type}${event.type === 'input' ? ` · ${el.value}` : ''}`, sources: task.sources, ui: task.target, flow: ['input','edit'].includes(task.kind) ? 'input-edit' : ['invalid','calculate'].includes(task.kind) ? 'calculate' : ['save','save-error','retry'].includes(task.kind) ? 'save' : undefined, event: ['input','edit'].includes(task.kind) ? 'input' : ['invalid','calculate'].includes(task.kind) ? 'calculate' : ['save','save-error','retry'].includes(task.kind) ? 'submit' : undefined, explanation: task.explanation })
    }
    doc.addEventListener('click', input, true); doc.addEventListener('input', input, true)
    this.callbacks.stage(task.manual || mode === 'guided' ? 'Chờ bạn thao tác trên preview' : 'Chỉ dẫn trước thao tác')
    this.highlight(task.target, task.instruction)
    const monitor = setInterval(() => {
      if (this.signal.aborted) return
      this.network(task)
      if (!capturedBusy && doc.querySelector('form')?.getAttribute('aria-busy') === 'true') {
        capturedBusy = true
        this.callbacks.record({ kind: 'ui', action: task.title, title: 'UI đang lưu', detail: 'form aria-busy=true; kiểm tra disabled của nút trên DOM.', sources: task.sources, ui: 'save', flow: 'save', event: 'pending', explanation: 'Đã quan sát thuộc tính UI; setSaving/ref bên trong chưa được đo.' })
      }
    }, 40)
    try {
      if (mode === 'demo' && !task.manual && !retryObserve) {
        const delay = Math.max(0, 950 / this.callbacks.speed())
        const until = Date.now() + delay
        await waitFor(() => Date.now() >= until ? true : undefined, this.signal, delay + 1000)
        await this.callbacks.gate()
        if (this.signal.aborted) throw abortError()
        if (this.document !== doc || !doc.contains(target)) throw new Error('Preview đã tải lại hoặc vùng thao tác đã thay đổi; dừng để tránh tác động vào DOM cũ.')
        if (task.kind === 'inspect') {
          // The subsequent DOM predicate, never this cue timer, confirms UI.
        } else if (['input','edit'].includes(task.kind)) {
          const field = target as HTMLInputElement
          if (field.readOnly || field.disabled) throw new Error('Input chỉ đọc/bị khóa; không giả lập nhập thành công.')
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set
          if (!setter) throw new Error('Không có setter DOM tin cậy cho input này.')
          setter.call(field, task.kind === 'edit' ? '2000000000' : 'Học thử Chặng 1')
          field.dispatchEvent(new Event('input', { bubbles: true }))
        } else {
          if (target instanceof HTMLButtonElement && target.disabled || (target as HTMLButtonElement).disabled) throw new Error('Nút bị khóa ở trạng thái thực tế; chưa thực hiện thao tác.')
          this.sent.add(task.id)
          target.click()
        }
      } else if (retryObserve) interacted = this.sent.has(task.id)
      const after = await waitFor(() => {
        if (this.document !== doc) throw new Error('Preview đã tải lại; Chạy lại để mở phiên có ngữ cảnh mới.')
        if (!['save','save-error','retry'].includes(task.kind) && !doc.defaultView?.location.hash.startsWith('#/quotations/new')) throw new Error('Bạn đã rời form của kịch bản; phiên dừng, không xác nhận đạt.')
        this.network(task)
        const now = snapshot(doc)
        if (!interacted) return
        if (task.kind === 'inspect') {
          const inputs = [...doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#root input, #root textarea')]
          const labels = [...doc.querySelectorAll<HTMLLabelElement>('#root label')]
          return now.count === task.count && inputs.every(el => (el.readOnly || el.disabled || Boolean(el.closest('fieldset[disabled]'))) && labels.some(label => label.htmlFor === el.id && text(label))) ? now : undefined
        }
        if (task.kind === 'input') return now.values.customerName?.trim() && now.values.customerName !== before.values.customerName ? now : undefined
        if (task.kind === 'fill') return now.values.customerName === 'Công ty TNHH Mộc An Demo' && now.values.sumInsured === '1000000000' ? now : undefined
        if (task.kind === 'invalid' || task.kind === 'calculate') return now.invalid || now.premium.includes('Đã tính phí') ? now : undefined
        if (task.kind === 'edit') return now.values.sumInsured !== before.values.sumInsured && now.premium.includes('Cần tính lại phí') && now.saveDisabled ? now : undefined
        if (task.kind === 'arm-error') return now.toolStatus.includes('Đã bật lỗi một lần') ? now : undefined
        const responses = bridge.network.slice(initialNetwork).filter((e: NetworkEvidence) => e.kind === 'response' && e.method === 'POST')
        return responses.length && (now.saved || !now.saving && now.error) ? now : undefined
      }, this.signal, task.manual || mode === 'guided' ? Infinity : 18000)
      // Let the current browser event and React commit finish. This is not a
      // simulated business delay or a timer-based success condition.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      if (this.signal.aborted) throw abortError()
      const stable = snapshot(doc)
      const result = stable.saved ? 'saved' : ['save','save-error','retry'].includes(task.kind) ? 'error' : stable.invalid ? 'invalid' : stable.premium.includes('Cần tính lại phí') ? 'stale' : 'valid'
      this.callbacks.record({ kind: 'ui', action: task.title, title: task.kind === 'inspect' ? `${after.count} input · chỉ đọc/scaffold` : result === 'saved' ? 'UI đã lưu bản chào' : result === 'error' ? 'UI hiện lỗi, giữ form' : result === 'invalid' ? 'UI hiện lỗi validation' : result === 'stale' ? 'Phí hết hiệu lực · Lưu bị khóa' : task.kind === 'input' ? 'Giá trị mới đang hiển thị' : task.kind === 'arm-error' ? 'Mock đã bật lỗi một lần' : task.kind === 'fill' ? 'Dữ liệu mẫu đang hiển thị' : 'UI đã hiển thị phí', detail: task.kind === 'inspect' ? `${after.count} input tại mốc ${this.plan.checkpoint.id}. ${task.instruction}` : task.kind === 'input' ? stable.values.customerName : task.kind === 'fill' ? `${stable.values.customerName} · ${stable.values.sumInsured}` : task.kind === 'arm-error' ? stable.toolStatus : result === 'error' ? `${stable.error} · tên: ${stable.values.customerName} · phí còn: ${stable.premium.includes('Đã tính phí')}` : result === 'invalid' ? text(runTarget(doc, 'validationErrors')) : result === 'saved' ? doc.defaultView?.location.hash ?? '' : stable.premium, sources: task.sources, ui: task.resultTarget, ...outcomeFlow(task.kind, result, this.plan.checkpoint), explanation: task.explanation })
      this.highlight(task.resultTarget, `Đã quan sát: ${task.title}`)
      if (task.kind === 'invalid' && !stable.invalid) throw new Error('UI thực tế không đi nhánh lỗi mong đợi. Đã ghi kết quả thực, dừng tại đây.')
      if (task.kind === 'calculate') {
        const days = (Date.parse(stable.values.endDate) - Date.parse(stable.values.startDate)) / 86400000
        const net = Math.round(Number(stable.values.sumInsured) * .001 * days / 365), total = net + Math.round(net * .1)
        if (stable.invalid || !stable.premium.includes(new Intl.NumberFormat('vi-VN').format(total))) throw new Error('Phí hiển thị chưa khớp đầu vào/công thức từ source. Chưa xác nhận đạt.')
      }
      if (task.kind === 'save-error' && (!stable.error || stable.values.customerName !== before.values.customerName || !stable.premium.includes('Đã tính phí') || !bridge.network.slice(initialNetwork).some(e => e.kind === 'response' && e.status === 500))) throw new Error('Chưa quan sát đủ HTTP 500, lỗi UI và dữ liệu/phí được giữ. Không tự gửi lại POST.')
      if (['save','retry'].includes(task.kind) && (!stable.saved || !bridge.network.slice(initialNetwork).some(item => item.kind === 'response' && item.method === 'POST' && item.status && item.status >= 200 && item.status < 300))) throw new Error('Chưa có đủ response thành công và UI đã lưu. Không tự thử lại POST.')
      if (mode === 'demo' && !task.manual) {
        const until = Date.now() + 700 / this.callbacks.speed()
        await waitFor(() => Date.now() >= until ? true : undefined, this.signal, 3000)
      }
    } finally {
      clearInterval(monitor); doc.removeEventListener('click', input, true); doc.removeEventListener('input', input, true)
    }
  }
  diagnostic() { const doc = this.document; return doc ? JSON.stringify(snapshot(doc)) : 'Iframe/adapter chưa sẵn sàng hoặc không khớp phiên.' }
  dispose() { this.removeHighlight(); this.cleanups.forEach(cleanup => cleanup()); this.cleanups = [] }
}
