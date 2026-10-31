import type { Premium } from '../quotation/types'
import styles from '../practice.module.css'

export function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRate(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(
    value,
  )
}

export function PremiumPanel({ premium, stale }: { premium: Premium | null; stale?: boolean }) {
  return (
    <section className={`${styles.card} ${styles.premium}`} aria-live="polite">
      <h2>Kết quả phí</h2>
      {premium ? (
        <>
          <dl>
            <div>
              <dt>Thời hạn</dt>
              <dd>{premium.days} ngày</dd>
            </div>
            <div>
              <dt>Tỷ lệ phí năm</dt>
              <dd>{formatRate(premium.annualRate)}</dd>
            </div>
            <div>
              <dt>Phí trước thuế</dt>
              <dd>{formatMoney(premium.net)}</dd>
            </div>
            <div>
              <dt>Thuế ({formatRate(premium.taxRate)})</dt>
              <dd>{formatMoney(premium.tax)}</dd>
            </div>
          </dl>
          <div className={styles.total}>
            Tổng phí<strong>{formatMoney(premium.total)}</strong>
          </div>
          <p>
            Thanh toán một kỳ: <b>{formatMoney(premium.installmentAmount)}</b>
          </p>
        </>
      ) : (
        <p>
          {stale
            ? 'Cần tính lại phí: số tiền hoặc thời hạn đã thay đổi.'
            : 'Chưa có kết quả phí. Nhập thông tin rồi chọn Tính phí.'}
        </p>
      )}
    </section>
  )
}
