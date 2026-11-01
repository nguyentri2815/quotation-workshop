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
  if (target === 'product') return doc.getElementById('productCode')
  if (target === 'productInfo') return doc.getElementById('product-info') ?? root
  const labels: Record<string, string> = { calculate: 'Tính phí', fill: 'Điền dữ liệu mẫu', save: 'Lưu bản chào', armError: 'Gây lỗi lần lưu kế tiếp', legacyRecord:'Mở bản chào A cũ' }
  if (labels[target]) return button(doc, labels[target])
  if (['customer','asset','period','premium'].includes(target)) return root?.querySelector(`[aria-labelledby="${target}-heading"]`) ?? null
  if (target === 'validationErrors') return root?.querySelector('[id$="-error"]') ?? null
  if (target === 'saveError') return root?.querySelector('form [role="alert"]') ?? null
  if (target === 'saved') return root?.querySelector('[aria-labelledby="detail-customer"]') ?? [...root?.querySelectorAll<HTMLElement>('[role="status"]') ?? []].find(el => /Đã lưu|ID:/.test(text(el))) ?? null
  if (target === 'toolStatus') return doc.querySelector('body > details [role="status"]')
  return doc.getElementById(target)
}
export function snapshot(doc: Document) {
  const values = Object.fromEntries([...doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#root input:not([type="radio"]), #root textarea')].map(el => [el.id, el.value]))
  const premium = text(runTarget(doc, 'premium'))
  const savedProduct = text([...doc.querySelectorAll('dt')].find(el => text(el) === 'Sản phẩm')?.nextElementSibling)
  const productName = text(doc.querySelector('[data-product-name]'))
  const productVersion = text(runTarget(doc, 'productInfo')).match(/phiên bản\s+(\d+)/)?.[1] ?? ''
  return { savedProduct, productName, productVersion, values, count: Object.keys(values).length, premium, productCode: (doc.getElementById('productCode') as HTMLSelectElement | null)?.value ?? doc.getElementById('product-info')?.dataset.product ?? 'BASIC_PROPERTY', productInfo: text(runTarget(doc, 'productInfo')), calculateDisabled: button(doc, 'Tính phí')?.disabled, invalid: Boolean(doc.querySelector('#root [id$="-error"]')), error: text(runTarget(doc, 'saveError')), saving: doc.querySelector('form')?.getAttribute('aria-busy') === 'true', saved: Boolean(runTarget(doc, 'saved')), saveDisabled: button(doc, 'Lưu bản chào')?.disabled, toolStatus: text(runTarget(doc, 'toolStatus')), root: text(doc.getElementById('root')).slice(0, 1400) }
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
      return doc?.querySelector('#root h1, #root article') && !/Không khởi động được|Không mở được/.test(text(doc.getElementById('root'))) ? doc : undefined
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
    if (['back-products','open-product','reload-record','reopen','legacy-record','inspect-catalog'].includes(task.kind)) return this.executeNavigation(task,mode,retryObserve)
    if (!this.document?.getElementById('productCode') && ['switch-product','return-product','cancel-product'].includes(task.kind)) return this.executePanel(task,mode,retryObserve)
    if (['set-period','set-amount','inspect-save-lock'].includes(task.kind)) return this.executePricingInput(task, mode, retryObserve)
    if (['product-info','switch-product','return-product'].includes(task.kind)) return this.executeProduct(task, mode, retryObserve)
    if (task.kind === 'observe') {
      const doc = this.document; if (!doc) throw new Error('Preview chưa sẵn sàng.')
      await this.callbacks.gate()
      const target = await waitFor(() => runTarget(doc, task.target), this.signal)
      this.highlight(task.target, task.instruction)
      this.callbacks.record({kind:'ui', action:task.title, title:task.title, detail:text(target), sources:task.sources, ui:task.target, explanation:task.explanation})
      return
    }
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
          setter.call(field, task.value ?? (task.kind === 'edit' ? '2000000000' : 'Học thử Chặng 1'))
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
        if (task.kind === 'input') return now.values[task.target]?.trim() && now.values[task.target] !== before.values[task.target] ? now : undefined
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
      if (task.preservePremium && (!before.premium.includes('Đã tính phí') || stable.premium !== before.premium)) throw new Error('Sửa trường không liên quan đã thay đổi phí.')
      if (task.kind === 'invalid' && !stable.invalid) throw new Error('UI thực tế không đi nhánh lỗi mong đợi. Đã ghi kết quả thực, dừng tại đây.')
      if (task.kind === 'calculate') {
        if (task.expected === 'invalid') {
          const error = doc.getElementById(`${task.expectedField}-error`)
          if (!stable.invalid || !text(error) || stable.premium.includes('Đã tính phí')) throw new Error('Chưa thấy lỗi đúng trường hoặc phí cũ còn hợp lệ.')
          return
        }
        const days = (Date.parse(stable.values.endDate) - Date.parse(stable.values.startDate)) / 86400000
        const net = Math.round(Number(stable.values.sumInsured) * .001 * days / 365), total = net + Math.round(net * .1)
        if (stable.invalid || !stable.premium.includes(new Intl.NumberFormat('vi-VN').format(task.expectedTotal ?? total))) throw new Error('Phí hiển thị chưa khớp mẫu kiểm chứng/đầu vào từ source. Chưa xác nhận đạt.')
      }
      if (task.kind === 'save-error' && (!stable.error || stable.values.customerName !== before.values.customerName || !stable.premium.includes('Đã tính phí') || !bridge.network.slice(initialNetwork).some(e => e.kind === 'response' && e.status === 500))) throw new Error('Chưa quan sát đủ HTTP 500, lỗi UI và dữ liệu/phí được giữ. Không tự gửi lại POST.')
      if (['save','retry'].includes(task.kind) && stable.saved && this.plan.journey?.stage === 2 && stable.savedProduct !== `${before.productName} · v${before.productVersion}`) throw new Error('Sản phẩm/phiên bản hiển thị sau lưu không khớp ngữ cảnh trước lưu.')
      if (['save','retry'].includes(task.kind) && (!stable.saved || !bridge.network.slice(initialNetwork).some(item => item.kind === 'response' && item.method === 'POST' && item.status && item.status >= 200 && item.status < 300))) throw new Error('Chưa có đủ response thành công và UI đã lưu. Không tự thử lại POST.')
      if (mode === 'demo' && !task.manual) {
        const until = Date.now() + 700 / this.callbacks.speed()
        await waitFor(() => Date.now() >= until ? true : undefined, this.signal, 3000)
      }
    } finally {
      clearInterval(monitor); doc.removeEventListener('click', input, true); doc.removeEventListener('input', input, true)
    }
  }
  private async cue(task:RunTask,mode:RunMode,action:()=>void) {
    this.callbacks.stage(task.instruction); this.highlight(task.target,task.instruction)
    if(mode==='demo'&&!task.manual){const until=Date.now()+700/this.callbacks.speed();await waitFor(()=>Date.now()>=until,this.signal,3000);await this.callbacks.gate();if(this.signal.aborted)throw abortError();action()}
  }
  private async executePanel(task:RunTask,mode:RunMode,retryObserve:boolean) {
    const doc=this.document;if(!doc)throw new Error('Preview chưa sẵn sàng.')
    const before=snapshot(doc),bridge=this.frame.contentWindow!.__workshopRun!,network=bridge.network.length
    const cancel=task.kind==='cancel-product'
    const code=task.kind==='return-product'?'BASIC_PROPERTY':'EXTENDED_PROPERTY'
    await this.cue(task,retryObserve?'guided':mode,()=>button(doc,'Đổi sản phẩm')?.click())
    const dialog=await waitFor(()=>doc.querySelector<HTMLDialogElement>('dialog[open]'),this.signal,mode==='guided'?Infinity:18000)
    if(mode==='demo'&&!retryObserve){const radio=dialog.querySelector<HTMLInputElement>(`input[value="${code}"]`);if(!radio)throw new Error('Không có lựa chọn sản phẩm.');await this.callbacks.gate();if(this.signal.aborted)throw abortError();radio.click();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));await this.callbacks.gate();if(this.signal.aborted)throw abortError();button(doc,cancel?'Giữ sản phẩm hiện tại':'Xác nhận đổi sản phẩm')?.click()}
    const after=await waitFor(()=>{const now=snapshot(doc);return cancel?(now.productCode===before.productCode&&!dialog.open&&now.premium===before.premium?now:undefined):now.productCode===code&&!dialog.open&&now.premium.includes('Cần tính lại phí')&&now.saveDisabled?now:undefined},this.signal,mode==='guided'?Infinity:18000)
    if(JSON.stringify(before.values)!==JSON.stringify(after.values)||bridge.network.slice(network).some(e=>e.method==='POST'))throw new Error('Đổi sản phẩm đã sửa draft hoặc gửi POST.')
    this.callbacks.record({kind:'ui',action:task.title,title:cancel?'Hủy panel · giữ sản phẩm/draft/phí':'Xác nhận đổi sản phẩm · giữ draft · phí hết hiệu lực',detail:`${code} · ${after.premium}`,sources:task.sources,ui:task.resultTarget,flow:'product',event:cancel?'cancel':'invalidate',explanation:task.explanation});this.highlight(task.resultTarget,task.title)
  }
  private async executeNavigation(task:RunTask,mode:RunMode,retryObserve:boolean) {
    let doc=this.document;if(!doc)throw new Error('Preview chưa sẵn sàng.')
    const before=snapshot(doc),number=text(doc.querySelector('#root h1')),total=text(runTarget(doc,'premium'))
    if(task.kind==='back-products') {
      const back=[...doc.querySelectorAll<HTMLAnchorElement>('a')].find(a=>['Danh sách bản chào','Về danh sách'].includes(text(a)))
      if(!back)throw new Error('Không có điều hướng Danh sách bản chào.')
      await this.cue(task,retryObserve?'guided':mode,()=>back.click())
      await waitFor(()=>this.document?.defaultView?.location.hash==='#/quotations',this.signal,mode==='guided'?Infinity:18000)
      const listing=this.document!
      const create=await waitFor(()=>[...listing.querySelectorAll<HTMLAnchorElement>('a')].find(a=>a.hash==='#/products'||a.hash==='#/quotations/new'),this.signal)
      this.callbacks.stage('Tại danh sách: bấm Tạo bản chào để về /products')
      if(mode==='demo'&&!retryObserve){await this.callbacks.gate();if(this.signal.aborted)throw abortError();create.click()}
      await waitFor(()=>this.document?.defaultView?.location.hash==='#/products'&&this.document.querySelectorAll('article').length===2,this.signal,mode==='guided'?Infinity:18000)
      this.network(task)
      this.callbacks.record({kind:'ui',action:task.title,title:'Đã trở lại catalog qua điều hướng thật',detail:'Form → danh sách → /products; cùng phiên/checkpoint.',sources:task.sources,ui:'root',explanation:task.explanation})
      return
    }
    if(task.kind==='inspect-catalog') {
      if(doc.defaultView?.location.hash!=='#/products'||doc.querySelectorAll('#root article').length!==(task.count??2))throw new Error(`Chưa có ${task.count??2} sản phẩm trên /products tại mốc này.`)
    } else if(task.kind==='open-product') {
      const link=[...doc.querySelectorAll<HTMLAnchorElement>('#root a')].find(a=>a.hash.includes(`product=${task.value}`))
      if(!link)throw new Error('Không thấy thẻ sản phẩm cần tạo.')
      await this.cue(task,retryObserve?'guided':mode,()=>link.click())
      await waitFor(()=>{const now=snapshot(doc!);return doc!.querySelector('#customerName')&&now.productCode===task.value&&(!this.plan.journey || now.productName===(task.value==='BASIC_PROPERTY'?'Tài sản cơ bản':'Tài sản mở rộng')&&now.productVersion)?now:undefined},this.signal,mode==='guided'?Infinity:18000)
    } else if(task.kind==='legacy-record') {
      const target=runTarget(doc,'legacyRecord');if(!target)throw new Error('Công cụ A cũ chưa có.');target.closest('details')?.setAttribute('open','')
      await this.cue(task,retryObserve?'guided':mode,()=>target.click())
      await waitFor(()=>snapshot(doc!).saved&&text(doc!.getElementById('root')).includes('Bản chào A gốc'),this.signal,mode==='guided'?Infinity:18000)
      this.network(task)
    } else if(task.kind==='reload-record') {
      const old=doc
      await this.cue(task,retryObserve?'guided':mode,()=>this.frame.contentWindow?.location.reload())
      doc=await waitFor(()=>{const next=this.document;return next&&next!==old&&snapshot(next).saved?next:undefined},this.signal,mode==='guided'?Infinity:30000)
      this.networkCursor=0;await this.ready();this.network(task)
      if(text(doc.querySelector('#root h1'))!==number||text(runTarget(doc,'premium'))!==total)throw new Error('Reload thay bản chào hoặc phí lịch sử.')
    } else {
      await this.cue(task,retryObserve?'guided':mode,()=>{const link=[...doc!.querySelectorAll<HTMLAnchorElement>('#root a')].find(a=>text(a)==='Về danh sách');if(!link)throw new Error('Thiếu link danh sách.');link.click()})
      const link=await waitFor(()=>[...doc!.querySelectorAll<HTMLAnchorElement>('#root a')].find(a=>text(a)===number),this.signal,mode==='guided'?Infinity:18000)
      if(mode==='demo'&&!retryObserve){await this.callbacks.gate();if(this.signal.aborted)throw abortError();link.click()}
      await waitFor(()=>snapshot(doc!).saved&&text(doc!.querySelector('#root h1'))===number,this.signal,mode==='guided'?Infinity:18000)
      this.network(task);if(text(runTarget(doc,'premium'))!==total)throw new Error('Mở lại thay phí đã lưu.')
    }
    if(before.saved && snapshot(doc).saved && before.savedProduct !== snapshot(doc).savedProduct) throw new Error('Đọc lại đổi sản phẩm/phiên bản đã lưu.')
    this.callbacks.record({kind:'ui',action:task.title,title:task.title,detail:task.kind==='open-product'?snapshot(doc).productInfo:text(doc.getElementById('root')).slice(0,1600),sources:task.sources,ui:task.resultTarget,flow:task.kind==='inspect-catalog'?undefined:task.kind==='open-product'?'input-edit':'read',event:task.kind==='inspect-catalog'?undefined:task.kind==='open-product'?'select':'read',explanation:task.explanation})
    if(before.saved&&task.kind!=='open-product'&&!snapshot(doc).saved)throw new Error('Chưa mở được bản chào.')
    this.highlight(task.resultTarget,task.title)
  }
  private async executeProduct(task: RunTask, mode: RunMode, retryObserve: boolean) {
    const doc = this.document
    if (!doc) throw new Error('Iframe chưa sẵn sàng.')
    const before = snapshot(doc), bridge = this.frame.contentWindow!.__workshopRun!
    const initialNetwork = bridge.network.length
    const target = await waitFor(() => runTarget(doc, task.target), this.signal)
    this.callbacks.stage(mode === 'guided' && task.kind !== 'product-info' ? task.instruction : 'Quan sát thông tin và thao tác thật trên preview')
    this.highlight(task.target, task.instruction)
    const changed = (event: Event) => {
      if (event.target !== target) return
      this.callbacks.record({ kind: 'dom', action: task.title, title: 'Đổi lựa chọn sản phẩm trên DOM', detail: `${event.isTrusted ? 'Người học' : 'Trình diễn'} · change · ${(target as HTMLSelectElement).value}`, sources: task.sources, ui: task.target, explanation: task.explanation })
    }
    doc.addEventListener('change', changed, true)
    try {
      if (mode === 'demo' && !retryObserve && task.kind !== 'product-info') {
        const until = Date.now() + 950 / this.callbacks.speed()
        await waitFor(() => Date.now() >= until ? true : undefined, this.signal, 3000)
        await this.callbacks.gate()
        if (this.signal.aborted) throw abortError()
        if (this.document !== doc || !doc.contains(target)) throw new Error('Preview đã đổi ngữ cảnh; không thực hiện thao tác cũ.')
        const select = target as HTMLSelectElement
        if (select.tagName !== 'SELECT' || select.disabled) throw new Error('Selector chưa có hoặc đang bị khóa.')
        select.value = task.kind === 'switch-product' ? 'EXTENDED_PROPERTY' : 'BASIC_PROPERTY'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
      const after = await waitFor(() => {
        if (this.document !== doc) throw new Error('Preview đã tải lại; mở phiên mới để thử.')
        const now = snapshot(doc)
        if (task.kind === 'product-info') return now.productInfo.includes('Tài sản cơ bản') ? now : undefined
        const switching = task.kind === 'switch-product'
        if (now.productCode !== (switching ? 'EXTENDED_PROPERTY' : 'BASIC_PROPERTY')) return
        if (!now.productInfo.includes(switching ? 'Tài sản mở rộng' : 'Tài sản cơ bản')) return
        if (switching && (!now.productInfo.includes('180') || !now.productInfo.includes('0,15%') || (this.plan.checkpoint.order < 4 ? !now.calculateDisabled : now.calculateDisabled) || !now.saveDisabled)) return
        if (this.plan.checkpoint.order >= 4 && before.premium.includes('Đã tính phí') && (!now.premium.includes('Cần tính lại phí') || !now.saveDisabled)) return
        if (this.plan.checkpoint.id === 's2-03-switch' && (!now.premium.includes('Cần tính lại phí') || !now.saveDisabled || !switching && now.calculateDisabled)) return
        return now
      }, this.signal, mode === 'guided' ? Infinity : 18000)
      if (JSON.stringify(after.values) !== JSON.stringify(before.values)) throw new Error('Draft đã thay đổi khi chọn sản phẩm; chưa xác nhận đạt.')
      if (bridge.network.slice(initialNetwork).some(item => item.kind === 'request' && item.method === 'POST')) throw new Error('Có POST không mong đợi khi đổi sản phẩm.')
      this.callbacks.record({ kind: 'ui', action: task.title, title: task.title, detail: `${after.productInfo.slice(0, 650)} · draft được giữ · Tính phí khóa=${after.calculateDisabled} · Lưu khóa=${after.saveDisabled}${after.premium.includes('Cần tính lại phí') ? ' · Phí cũ hết hiệu lực' : ''}`, sources: task.sources, ui: task.resultTarget, explanation: task.explanation })
      this.highlight(task.resultTarget, `Đã quan sát: ${task.title}`)
    } finally { doc.removeEventListener('change', changed, true) }
  }
  private async executePricingInput(task: RunTask, mode: RunMode, retryObserve: boolean) {
    const doc = this.document
    if (!doc) throw new Error('Preview chưa sẵn sàng.')
    const before = snapshot(doc), bridge = this.frame.contentWindow!.__workshopRun!
    const initialNetwork = bridge.network.length
    this.highlight(task.target, task.instruction)
    this.callbacks.stage(task.instruction)
    if (task.kind === 'inspect-save-lock') {
      const note = text(doc.getElementById('product-action-note'))
      if (before.productCode !== 'EXTENDED_PROPERTY' || !before.premium.includes('Đã tính phí') || !before.saveDisabled || !note.includes('Lưu sản phẩm B được bổ sung ở mốc tiếp theo')) throw new Error('Chưa quan sát đủ phí B, khóa Lưu và giải thích.')
      this.callbacks.record({ kind:'ui', action:task.title, title:task.title, detail:before.premium + ' · ' + note + ' · Lưu disabled=true', sources:task.sources, ui:task.resultTarget, flow:'save', event:'guard', path:['submit','guard','stop'], explanation:task.explanation })
      this.highlight(task.resultTarget, task.title)
      return
    }
    const target = runTarget(doc, task.target) as HTMLInputElement | null
    if (!target || target.disabled || target.readOnly) throw new Error('Input không có hoặc bị khóa.')
    const value = task.kind === 'set-period' ? new Date(Date.parse(before.values.startDate + 'T00:00:00Z') + task.days! * 86400000).toISOString().slice(0,10) : task.value!
    let interacted = false
    const changed = (event: Event) => {
      if (event.target !== target) return
      interacted = true
      this.callbacks.record({ kind:'dom', action:task.title, title:`Input DOM: ${target.id}`, detail:target.value, sources:task.sources, ui:task.target, flow:'input-edit', event:'input', explanation:task.explanation })
    }
    doc.addEventListener('input', changed, true); doc.addEventListener('change', changed, true)
    try {
      if (mode === 'demo' && !retryObserve) {
        const until = Date.now() + 700 / this.callbacks.speed()
        await waitFor(() => Date.now() >= until, this.signal, 3000); await this.callbacks.gate()
        if (this.signal.aborted) throw abortError()
        if (this.document !== doc || !doc.contains(target)) throw new Error('Preview đã thay đổi ngữ cảnh.')
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), 'value')!.set!.call(target, value)
        target.dispatchEvent(new Event('input', { bubbles:true })); target.dispatchEvent(new Event('change', { bubbles:true }))
      }
      const after = await waitFor(() => {
        if (this.document !== doc) throw new Error('Preview đã tải lại.')
        const now = snapshot(doc)
        if (!interacted || now.values[task.target] !== value) return
        if (before.premium.includes('Đã tính phí') && (!now.premium.includes('Cần tính lại phí') || !now.saveDisabled)) return
        return now
      }, this.signal, mode === 'guided' ? Infinity : 18000)
      if (bridge.network.slice(initialNetwork).some(e => e.method === 'POST')) throw new Error('Có POST khi chỉ sửa dữ liệu.')
      this.callbacks.record({ kind:'ui', action:task.title, title:before.premium.includes('Đã tính phí') ? 'Phí hết hiệu lực · cần tính lại' : task.title, detail:`${task.target}=${after.values[task.target]} · ${after.premium}`, sources:task.sources, ui:task.resultTarget, flow:'input-edit', event:'render', path:['input','draft','compare','invalidate','update','render'], explanation:task.explanation })
      this.highlight(task.resultTarget, task.title)
    } finally { doc.removeEventListener('input',changed,true); doc.removeEventListener('change',changed,true) }
  }
  diagnostic() { const doc = this.document; return doc ? JSON.stringify(snapshot(doc)) : 'Iframe/adapter chưa sẵn sàng hoặc không khớp phiên.' }
  dispose() { this.removeHighlight(); this.cleanups.forEach(cleanup => cleanup()); this.cleanups = [] }
}
