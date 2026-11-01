// Workshop-only host; not a component of the product.
import { storageKey, checkpointId } from './environment'
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
  const legacy = document.createElement('button')
  legacy.textContent = 'Mở bản chào A cũ'
  legacy.onclick = () => {
    if (!storageKey.startsWith('quotation-workshop.run.')) {
      status.textContent =
        'Chỉ chuẩn bị fixture A cũ trong phiên chạy riêng.'
      return
    }
    try {
      const raw = localStorage.getItem(storageKey)
      const stored =
        raw === null ? { version: 1, quotations: [] } : JSON.parse(raw)
      if (stored.version !== 1 || !Array.isArray(stored.quotations))
        throw new Error('Dữ liệu phiên không hợp lệ, giữ nguyên.')
      if (
        !stored.quotations.some(
          (item: { id?: string }) => item?.id === 'legacy-basic-v1',
        )
      )
        stored.quotations.push({
          type: 'NORMAL',
          line: 'PROPERTY',
          currency: 'VND',
          id: 'legacy-basic-v1',
          number: 'Q-2026-000041',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'CREATED',
          customer: { name: 'Bản chào A gốc', phone: '', email: '' },
          asset: {
            name: 'Kho gốc',
            address: 'Địa chỉ mô phỏng',
            sumInsured: 1000000000,
          },
          period: { startDate: '2026-01-01', endDate: '2027-01-01' },
          premium: {
            days: 365,
            annualRate: 0.001,
            taxRate: 0.1,
            net: 1000000,
            tax: 100000,
            total: 1100000,
            installmentAmount: 1100000,
          },
        })
      localStorage.setItem(storageKey, JSON.stringify(stored))
      status.textContent =
        'Đã chuẩn bị fixture A gốc trong phiên riêng; GET sẽ đọc bằng adapter.'
      location.hash = '/quotations/legacy-basic-v1'
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : 'Không mở được A cũ.'
    }
  }
  host.append(button, fail, legacy, status)
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
