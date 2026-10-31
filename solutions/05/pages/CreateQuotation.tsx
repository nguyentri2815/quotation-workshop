import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FieldErrors, Premium, QuotationDraft } from '../quotation/types'
import { emptyDraft, sampleDraft } from '../quotation/types'
import { validateAndBuildInput, calculatePremium } from '../quotation/rules'

import { FormFields } from '../components/FormFields'
import { PremiumPanel } from '../components/PremiumPanel'
import { ApiProbe } from '../components/ApiProbe'
import styles from '../practice.module.css'

export function CreateQuotation() {
  const [draft, setDraft] = useState<QuotationDraft>({ ...emptyDraft })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [premium, setPremium] = useState<Premium | null>(null)
  const [calculatedBefore, setCalculatedBefore] = useState(false)
  const [message, setMessage] = useState('')
  const saving = false
  const navigate = useNavigate()
  // TODO WS11: bảo vệ dữ liệu chưa lưu khi điều hướng và reload.

  function updateDraft(next: QuotationDraft) {
    // TODO WS06: chỉ xóa premium nếu số tiền hoặc một trong hai ngày thay đổi.
    setDraft(next)
    setErrors({})
    setMessage('')
  }
  function validatedInput() {
    const result = validateAndBuildInput(draft)
    if (!result.success) {
      setErrors(result.errors)
      setMessage(result.message)
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      )
      return null
    }
    setErrors({})
    setMessage('')
    return result.data
  }
  function calculate() {
    const input = validatedInput()
    if (!input) return
    setPremium(
      calculatePremium(input.asset.sumInsured, input.period.startDate, input.period.endDate),
    )
    setCalculatedBefore(true)
  }
  function save() {
    // TODO WS09: gửi API; chỉ điều hướng sau response thành công.
    setMessage('Thao tác lưu chưa được xây. Tiếp tục bước 9; chưa có dữ liệu nào được lưu.')
  }

  return (
    <>
      <Link to="/quotations">← Về danh sách</Link>
      <h1>Tạo bản chào bảo hiểm</h1>
      <p className={styles.fixed}>Thông thường (Normal) · Tài sản · Tài sản cơ bản · VND</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
        aria-busy={saving}
      >
        <fieldset disabled={saving} className={styles.fieldset}>
          <legend className={styles.srOnly}>Thông tin bản chào</legend>
          <FormFields draft={draft} errors={errors} onChange={updateDraft} />
          <PremiumPanel premium={premium} stale={calculatedBefore && !premium} />
          {message && (
            <p role="alert" className={styles.error}>
              {message}
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => {
                setDraft(sampleDraft())
                setPremium(null)
                setCalculatedBefore(false)
                setErrors({})
                setMessage('')
              }}
            >
              Điền dữ liệu mẫu
            </button>
            <button type="button" onClick={calculate}>
              Tính phí
            </button>
            <button type="submit" className={styles.primary} disabled={!premium || saving}>
              {saving ? 'Đang lưu…' : 'Lưu bản chào'}
            </button>
            <button type="button" onClick={() => void navigate('/quotations')}>
              Hủy
            </button>
          </div>
        </fieldset>
      </form>
      <details className={styles.debug}>
        <summary>Quan sát state thật của biểu mẫu</summary>
        <p>Chỉ hiển thị state React trong trang tạo này; chưa phải dữ liệu đã lưu.</p>
        <pre data-testid="draft-state">{JSON.stringify(draft, null, 2)}</pre>
      </details>
      <ApiProbe />
    </>
  )
}
