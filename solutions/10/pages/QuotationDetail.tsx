import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { quotationsApi } from '../api/quotations'
import type { Quotation } from '../quotation/types'
import { formatMoney, PremiumPanel } from '../components/PremiumPanel'
import styles from '../practice.module.css'

export function QuotationDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    quotationsApi
      .get(id ?? '')
      .then((data) => {
        if (active) setQuotation(data)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không đọc được bản chào.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, attempt])
  return (
    <>
      <Link to="/quotations">← Về danh sách</Link>
      {loading && <p role="status">Đang tải chi tiết…</p>}
      {error && (
        <div role="alert" className={styles.error}>
          {error}
          <button onClick={() => setAttempt(attempt + 1)}>Thử lại</button>
        </div>
      )}
      {!loading && !error && quotation && (
        <>
          {location.state &&
            typeof location.state === 'object' &&
            'created' in location.state &&
            location.state.created === true && (
              <p className={styles.success} role="status">
                Đã lưu bản chào thành công.
              </p>
            )}
          <h1>{quotation.number}</h1>
          <p>
            Ngày tạo: {new Date(quotation.createdAt).toLocaleString('vi-VN')} ·{' '}
            <strong>Đã tạo</strong>
          </p>
          <p className={styles.fixed}>Thông thường (Normal) · Tài sản · Tài sản cơ bản · VND</p>
          <section className={styles.card}>
            <h2>Khách hàng</h2>
            <dl>
              <div>
                <dt>Tên</dt>
                <dd>{quotation.customer.name}</dd>
              </div>
              <div>
                <dt>Điện thoại</dt>
                <dd>{quotation.customer.phone || 'Không cung cấp'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{quotation.customer.email || 'Không cung cấp'}</dd>
              </div>
            </dl>
          </section>
          <section className={styles.card}>
            <h2>Tài sản</h2>
            <dl>
              <div>
                <dt>Tên/mô tả</dt>
                <dd>{quotation.asset.name}</dd>
              </div>
              <div>
                <dt>Địa chỉ</dt>
                <dd>{quotation.asset.address}</dd>
              </div>
              <div>
                <dt>Số tiền bảo hiểm</dt>
                <dd>{formatMoney(quotation.asset.sumInsured)}</dd>
              </div>
              <div>
                <dt>Thời hạn</dt>
                <dd>
                  {quotation.period.startDate.split('-').reverse().join('/')} –{' '}
                  {quotation.period.endDate.split('-').reverse().join('/')}
                </dd>
              </div>
            </dl>
          </section>
          <PremiumPanel premium={quotation.premium} />
          <p>Bản chào chưa phải hợp đồng bảo hiểm.</p>
          <Link className={styles.button} to="/quotations/new">
            Tạo bản chào mới
          </Link>
        </>
      )}
    </>
  )
}
