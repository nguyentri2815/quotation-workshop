// Workshop-only host; not a component of the product.
import { checkpointId } from './environment'
import { quotationsApi, ApiError } from '../api/quotations'
import { sampleDraft } from '../quotation/types'
import { validateAndBuildInput } from '../quotation/rules'
import { http, HttpResponse } from 'msw'
import { apiBase } from './environment'

export function mountTools() {
  const host = document.createElement('details')
  host.style.cssText =
    'padding:8px;background:#eff6ff;font:13px system-ui;position:relative;z-index:1'
  const summary = document.createElement('summary')
  summary.textContent =
    'Công cụ riêng workshop · không thuộc source sản phẩm'
  host.append(summary)
  const identity = document.createElement('div')
  identity.style.cssText =
    'padding:4px 8px;background:#eff6ff;font:12px system-ui'
  identity.textContent =
    checkpointId === 'reference'
      ? 'BẢN HOÀN CHỈNH THAM CHIẾU · source sản phẩm mẫu'
      : 'Source sản phẩm mẫu · checkpoint ' + checkpointId
  document.body.prepend(identity)
  const button = document.createElement('button')
  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  button.textContent = 'Thử tạo qua API'
  button.onclick = () => {
    void probe(button, status)
  }
  const fail = document.createElement('button')
  fail.textContent = 'Gây lỗi lần lưu kế tiếp'
  fail.onclick = async () => {
    try {
      const { worker } = await import('../mocks/browser')
      worker.use(
        http.post(
          apiBase,
          () =>
            HttpResponse.json(
              { message: 'Lỗi lưu có chủ đích từ công cụ workshop.' },
              { status: 500 },
            ),
          { once: true },
        ),
      )
      status.textContent = 'Đã bật lỗi một lần.'
    } catch (error: unknown) {
      status.textContent =
        error instanceof Error
          ? error.message
          : 'Không bật được lỗi thử nghiệm.'
    }
  }
  host.append(button, fail, status)
  document.body.prepend(host)
}
export async function probe(
  button: HTMLButtonElement,
  status: HTMLElement,
) {
  const result = validateAndBuildInput(sampleDraft())
  if (!result.success) {
    status.textContent = result.message
    return
  }
  button.disabled = true
  try {
    const saved = await quotationsApi.create(result.data)
    status.textContent = 'API đã tạo ' + saved.number
  } catch (error: unknown) {
    status.textContent =
      error instanceof ApiError
        ? 'HTTP ' + error.status + ': ' + error.message
        : 'Không gửi được yêu cầu.'
  } finally {
    button.disabled = false
  }
}
