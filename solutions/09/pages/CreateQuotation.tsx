import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FieldErrors, Premium, QuotationDraft } from '../quotation/types'
import { emptyDraft, sampleDraft } from '../quotation/types'
import { validateAndBuildInput, calculatePremium, pricingInputsChanged } from '../quotation/rules'
import { ApiError, quotationsApi } from '../api/quotations'
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
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)
  const navigate = useNavigate()
  // TODO WS11: bảo vệ dữ liệu chưa lưu khi điều hướng và reload.

  function updateDraft(next: QuotationDraft) {
    if (pricingInputsChanged(draft, next)) setPremium(null)
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
  async function save() {
    if (inFlight.current) return
    const input = validatedInput()
    if (!input) return
    if (!premium) {
      setMessage('Vui lòng tính lại phí trước khi lưu.')
      return
    }
    inFlight.current = true
    setSaving(true)
    try {
      const quotation = await quotationsApi.create(input)

      await navigate('/quotations/' + quotation.id, { replace: true, state: { created: true } })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Chưa lưu được bản chào.')
      if (error instanceof ApiError) setErrors(error.errors)
      inFlight.current = false
      setSaving(false)
    }
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
