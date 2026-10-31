import ts from 'typescript'

// Reconstructed teaching stages, not Git history. AST edits preserve untouched bytes.
function parsed(code) {
  const source = ts.createSourceFile('sample.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  if (source.parseDiagnostics.length) throw new Error('Invalid sample source')
  return source
}
function editNodes(code, select) {
  const source = parsed(code)
  const edits = []
  function visit(node) {
    const replacement = select(node, source)
    if (replacement !== undefined) edits.push([node.getStart(source), node.end + (replacement === '' && code[node.end] === ',' ? 1 : 0), replacement])
    else ts.forEachChild(node, visit)
  }
  visit(source)
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + text + code.slice(end)
  return code
}
function exact(code, from, to) {
  if (!code.includes(from)) throw new Error(`Missing adapter anchor: ${from}`)
  return code.replaceAll(from, to)
}
const pendingPremium = `<section className={styles.card} aria-labelledby="premium-heading"><h2 id="premium-heading">Kết quả phí</h2><p>Chưa có kết quả phí. Vùng trình bày và tính phí được xây ở bước 3.</p></section>`

function staticForm(original) {
  const source = parsed(original)
  const field = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'Field')
  const form = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'CreateQuotation')
  const view = form.body.statements.find(ts.isReturnStatement).expression.getText(source)
  const code = `import type { ReactNode } from 'react'\nimport { Link } from 'react-router-dom'\nimport { FixedInformation } from '../components/FixedInformation'\nimport { Icon } from '../components/Icon'\nimport styles from '../components/ui.module.css'\n${field.getText(source)}\nexport function CreateQuotation() { return ${view} }\n`
  return editNodes(code, node => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'dialog') return ''
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText() === 'PremiumSummary') return pendingPremium
    if (ts.isJsxSpreadAttribute(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText() === 'inputProps') {
      const key = node.expression.arguments[0].text
      return `id="${key}" name="${key}" readOnly`
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText()
      if (['ref', 'onSubmit', 'onClick', 'aria-busy', 'error'].includes(name)) return ''
      if (name === 'disabled') return 'disabled'
      if (name === 'hint') return 'hint="Từ 1.000.000 đến 100.000.000.000 VND."'
    }
    if (ts.isJsxExpression(node)) {
      const expression = node.expression?.getText() ?? ''
      if (expression.startsWith('message &&')) return ''
      if (expression === 'notice') return 'Màn hình tĩnh: đủ trường và vùng phí; nhập liệu bắt đầu ở bước 2.'
      if (expression.startsWith('saving ?')) return 'Lưu bản chào'
    }
  })
}

export function stageForm(original, stage, { summary = true } = {}) {
  if (stage >= 11) return original
  if (stage === 'static') return staticForm(original)
  if (stage < 3) return `export function CreateQuotation() { return <section data-testid="starter-empty"><h1>Biểu mẫu chưa được xây</h1><p>Scaffold có sẵn; xem các bước tiếp theo.</p></section> }\n`
  let code = editNodes(original, (node) => {
    if (ts.isImportDeclaration(node)) {
      const module = node.moduleSpecifier.text
      if (module === 'react' && !node.importClause?.isTypeOnly) return "import { useRef, useState } from 'react'"
      if (module === 'react-router-dom') return "import { Link, useNavigate } from 'react-router-dom'"
      if (module === '../api/quotations' && stage < 9) return ''
      if (module === '../components/PremiumSummary' && !summary) return ''
      if (module === '../quotation/rules') {
        const names = [...(stage >= 4 ? ['validateAndBuildInput', 'validateDraft'] : []), ...(stage >= 5 ? ['calculatePremium'] : []), ...(stage >= 6 ? ['pricingInputsChanged'] : [])]
        return names.length ? `import { ${names.join(', ')} } from '../quotation/rules'` : ''
      }
    }
    if (ts.isVariableStatement(node)) {
      const name = node.declarationList.declarations[0].name.getText()
      if (['allowLeave', 'dialogRef', 'dirty', 'blocker'].includes(name)) return ''
      if (stage < 9 && name === 'saveInFlight') return ''
      if (stage < 4 && name === 'formRef') return ''
      if (stage < 5 && name === '[premium, setPremium]') return 'const [premium] = useState<Premium | null>(null)'
      if (!summary && name === '[calculatedBefore, setCalculatedBefore]') return ''
      if (stage < 5 && name === '[calculatedBefore, setCalculatedBefore]') return 'const [calculatedBefore] = useState(false)'
      if (stage < 9 && name === '[saving, setSaving]') return 'const [saving] = useState(false)'
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText() === 'useEffect') return ''
    if (ts.isExpressionStatement(node) && node.getText().startsWith('allowLeave.current =')) return ''
    if (ts.isIfStatement(node) && node.expression.getText().startsWith('pricingInputsChanged') && stage < 6) return ''
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'onBlur' && stage < 4) return ''
    if (ts.isFunctionDeclaration(node)) {
      if (node.name?.text === 'validatedInput' && stage < 4) return ''
      if (node.name?.text === 'calculate' && stage < 5) return stage < 4
        ? "function calculate() { setMessage('Chưa xây kiểm tra và tính phí; tiếp tục bước 3.') }"
        : "function calculate() { if (validatedInput()) setMessage('Dữ liệu hợp lệ; tiếp tục nối công thức và trình bày phí trong bước 3.') }"
      if (node.name?.text === 'save' && stage < 9) return "async function save() { setMessage('Thao tác lưu chưa được xây; tiếp tục bước 5.') }"
    }
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'dialog') return ''
    if (!summary && ts.isJsxSelfClosingElement(node) && node.tagName.getText() === 'PremiumSummary') return pendingPremium
    if (ts.isJsxAttribute(node) && node.name.getText() === 'ref' && node.initializer?.getText() === '{formRef}' && stage < 4) return ''
  })
  if (stage < 4) code = exact(code, "import { useRef, useState } from 'react'", "import { useState } from 'react'")
  // Before the detail page exists, the confirmed POST response is an acknowledgment.
  if (stage === 9) code = exact(code, 'state: { created: true }', 'state: { created: true, receipt: quotation }')
  return code
}
export function stageRules(original, stage) {
  if (stage < 4) return 'export {}\n'
  if (stage >= 7) return original
  return editNodes(original, node => {
    if (ts.isImportDeclaration(node)) return `import type { FieldErrors, QuotationDraft, ValidationResult${stage >= 5 ? ', Premium' : ''} } from './types'`
    if (ts.isFunctionDeclaration(node)) {
      const name = node.name?.text
      if (['isRecord', 'parseQuotationInput', 'parseQuotation'].includes(name)) return ''
      if (name === 'calculatePremium' && stage < 5) return ''
      if (name === 'pricingInputsChanged' && stage < 6) return ''
    }
  })
}
export const environment = `// Workshop-only embedding adapter. No business feature switches.\nconst match = window.location.pathname.match(/^\\/checkpoints\\/([^/]+)\\//)\nexport const checkpointId = match?.[1] ?? 'reference'\nexport const apiBase = match ? '/api/checkpoints/' + checkpointId + '/quotations' : '/api/reference/quotations'\nexport const storageKey = match ? 'quotation-workshop.checkpoint.' + checkpointId + '.v1' : 'quotation-workshop.reference.v1'\nexport const workerOptions = { quiet: true, onUnhandledFrame: 'bypass' as const, serviceWorker: { url: '/mockServiceWorker.js?' + checkpointId, options: { scope: match ? '/checkpoints/' + checkpointId + '/' : '/reference.html' } } }\n`
export function adapt(path, original) {
  let code = original
  if (path === 'App.tsx') code = exact(code, 'createBrowserRouter', 'createHashRouter')
  if (path === 'main.tsx') {
    code = "import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n" + code
    code = exact(code, "{ quiet: true, onUnhandledFrame: 'bypass' }", 'workerOptions')
    code = exact(code, "const { router } = await import('./App')", "mountTools()\n  const { router } = await import('./App')")
  }
  if ((path === 'api/quotations.ts' || path === 'mocks/handlers.ts') && code.includes('/api/quotations')) {
    code = "import { apiBase } from '../_workshop/environment'\n" + code
    code = code.replaceAll("'/api/quotations'", 'apiBase').replaceAll("'/api/quotations/:id'", "apiBase + '/:id'").replaceAll('`/api/quotations/${', '`${apiBase}/${')
  }
  if (path === 'mocks/storage.ts' && code.includes('quotation-product.demo.v1'))
    code = "import { storageKey } from '../_workshop/environment'\n" + exact(code, "'quotation-product.demo.v1'", 'storageKey')
  return code
}
export const placeholderPage = (name, title) => `import { Link } from 'react-router-dom'\nexport function ${name}() { return <section><h1>${title}</h1><Link to="/quotations/new">Tạo bản chào</Link></section> }\n`
export const saveAcknowledgment = `// Temporary teaching acknowledgment; full GET detail is introduced at checkpoint 10.
import { Link, useLocation, useParams } from 'react-router-dom'
import { isRecord, parseQuotation } from '../quotation/rules'
import { formatMoney } from '../quotation/format'
export function QuotationDetail() {
  const { id } = useParams()
  const state: unknown = useLocation().state
  const receipt = isRecord(state) && state.created === true ? parseQuotation(state.receipt) : null
  const confirmed = receipt && receipt.id === id ? receipt : null
  return <section>
    <h1>{confirmed ? 'Đã lưu bản chào thành công' : 'Trang chi tiết chưa được xây'}</h1>
    {confirmed ? <div role="status"><p>Số bản chào: {confirmed.number}</p><p>ID: {confirmed.id}</p><p>Khách hàng: {confirmed.customer.name}</p><p>Tổng phí: {formatMoney(confirmed.premium.total)}</p><p>Trạng thái: Đã tạo</p></div> : <p>Không có response tạo được xác nhận cho URL này.</p>}
    <p>Đây là xác nhận từ response POST. Đọc lại độc lập bằng GET và reload được xây ở bước 6. Mỗi checkpoint có dữ liệu demo riêng.</p>
    <Link to="/quotations/new">Tạo bản chào mới</Link>{' · '}<Link to="/quotations">Danh sách</Link>
  </section>
}
`
export const pendingHandlers = `import { http, HttpResponse } from 'msw'\nexport const handlers = [http.all('/api/quotations', () => HttpResponse.json({ message: 'Mock nghiệp vụ chưa được xây.' }, { status: 501 })), http.all('/api/quotations/:id', () => HttpResponse.json({ message: 'Mock nghiệp vụ chưa được xây.' }, { status: 501 }))]\n`
export function toolsSource(probe) {
  return `// Workshop-only host; not a component of the product.\nimport { checkpointId } from './environment'\n${probe ? "import { quotationsApi, ApiError } from '../api/quotations'\nimport { sampleDraft } from '../quotation/types'\nimport { validateAndBuildInput } from '../quotation/rules'\nimport { http, HttpResponse } from 'msw'\nimport { apiBase } from './environment'\n" : ''}
export function mountTools() {
  const host = document.createElement('details')
  host.style.cssText = 'padding:8px;background:#eff6ff;font:13px system-ui;position:relative;z-index:1'
  const summary = document.createElement('summary')
  summary.textContent = 'Công cụ riêng workshop · không thuộc source sản phẩm'
  host.append(summary)
  const identity = document.createElement('div')
  identity.style.cssText = 'padding:4px 8px;background:#eff6ff;font:12px system-ui'
  identity.textContent = checkpointId === 'reference' ? 'BẢN HOÀN CHỈNH THAM CHIẾU · source sản phẩm mẫu' : 'Source sản phẩm mẫu · checkpoint ' + checkpointId
  document.body.prepend(identity)
  ${probe ? `const button = document.createElement('button')
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  button.textContent = 'Thử tạo qua API'
  button.onclick = () => { void probe(button, status) }
  const fail = document.createElement('button')
  fail.textContent = 'Gây lỗi lần lưu kế tiếp'
  fail.onclick = async () => {
    try {
      const { worker } = await import('../mocks/browser')
      worker.use(http.post(apiBase, () => HttpResponse.json({ message: 'Lỗi lưu có chủ đích từ công cụ workshop.' }, { status: 500 }), { once: true }))
      status.textContent = 'Đã bật lỗi một lần.'
    } catch (error: unknown) { status.textContent = error instanceof Error ? error.message : 'Không bật được lỗi thử nghiệm.' }
  }
  host.append(button, fail, status)` : ''}
  document.body.prepend(host)
}
${probe ? `export async function probe(button: HTMLButtonElement, status: HTMLElement) {
  const result = validateAndBuildInput(sampleDraft())
  if (!result.success) { status.textContent = result.message; return }
  button.disabled = true
  try { const saved = await quotationsApi.create(result.data); status.textContent = 'API đã tạo ' + saved.number }
  catch (error: unknown) { status.textContent = error instanceof ApiError ? 'HTTP ' + error.status + ': ' + error.message : 'Không gửi được yêu cầu.' }
  finally { button.disabled = false }
}` : ''}\n`
}
