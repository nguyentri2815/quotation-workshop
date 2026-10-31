import { useState } from 'react'
import { ApiError, quotationsApi } from '../api/quotations'
import { validateAndBuildInput } from '../quotation/rules'
import { sampleDraft } from '../quotation/types'
import styles from '../practice.module.css'

export function ApiProbe() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function probe() {
    const result = validateAndBuildInput(sampleDraft())
    if (!result.success) {
      setMessage(result.message)
      return
    }
    setBusy(true)
    try {
      const saved = await quotationsApi.create(result.data)
      setMessage(`API đã tạo ${saved.number}; ID: ${saved.id}. Kiểm tra danh sách từ bước 10.`)
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? `HTTP ${error.status}: ${error.message}`
          : 'Không gửi được yêu cầu.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className={styles.debug}>
      <summary>Thử contract trực tiếp · bước 7–8</summary>
      <p>
        Gửi dữ liệu mẫu độc lập với biểu mẫu bên trên. Khi mock đã hoàn thành, thao tác này tạo một
        bản chào thật trong dữ liệu thực hành.
      </p>
      <button disabled={busy} onClick={() => void probe()}>
        {busy ? 'Đang gửi contract…' : 'Thử tạo qua API'}
      </button>
      <p role="status">{message}</p>
    </details>
  )
}
