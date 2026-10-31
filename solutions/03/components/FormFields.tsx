import type { ChangeEvent, ReactNode } from 'react'
import type { FieldErrors, QuotationDraft } from '../quotation/types'
import styles from '../practice.module.css'

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && (
        <span id={`${name}-error`} className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  )
}

export function FormFields({
  draft,
  errors,
  onChange,
}: {
  draft: QuotationDraft
  errors: FieldErrors
  onChange: (next: QuotationDraft) => void
}) {
  function bind(name: keyof QuotationDraft) {
    return {
      id: name,
      name,
      value: draft[name],
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...draft, [name]: event.target.value }),
    }
  }
  return (
    <>
      <section className={styles.card}>
        <h2>01 · Khách hàng</h2>
        <Field name="customerName" label="Tên khách hàng *" error={errors.customerName}>
          <input {...bind('customerName')} required maxLength={150} autoComplete="organization" />
        </Field>
        <div className={styles.grid}>
          <Field name="phone" label="Điện thoại (không bắt buộc)" error={errors.phone}>
            <input {...bind('phone')} type="tel" autoComplete="tel" />
          </Field>
          <Field name="email" label="Email (không bắt buộc)" error={errors.email}>
            <input {...bind('email')} type="email" autoComplete="email" />
          </Field>
        </div>
      </section>
      <section className={styles.card}>
        <h2>02 · Tài sản</h2>
        <Field name="assetName" label="Tên/mô tả tài sản *" error={errors.assetName}>
          <input {...bind('assetName')} required maxLength={200} />
        </Field>
        <Field name="address" label="Địa chỉ tài sản *" error={errors.address}>
          <textarea {...bind('address')} required maxLength={300} rows={2} />
        </Field>
        <Field name="sumInsured" label="Số tiền bảo hiểm (VND) *" error={errors.sumInsured}>
          <input {...bind('sumInsured')} required inputMode="numeric" placeholder="1000000000" />
        </Field>
        <small>Nhập chữ số, không dấu phân cách. Từ 1.000.000 đến 100.000.000.000 VND.</small>
      </section>
      <section className={styles.card}>
        <h2>03 · Thời hạn</h2>
        <div className={styles.grid}>
          <Field name="startDate" label="Ngày bắt đầu *" error={errors.startDate}>
            <input {...bind('startDate')} type="date" required />
          </Field>
          <Field name="endDate" label="Ngày kết thúc *" error={errors.endDate}>
            <input {...bind('endDate')} type="date" required />
          </Field>
        </div>
      </section>
    </>
  )
}
