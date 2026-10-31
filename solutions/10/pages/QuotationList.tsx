import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { quotationsApi } from '../api/quotations'
import type { Quotation } from '../quotation/types'
import { formatMoney } from '../components/PremiumPanel'
import styles from '../practice.module.css'

export function QuotationList() {
  const [items, setItems] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    quotationsApi
      .list()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không tải được danh sách.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt])
  return (
    <>
      <div className={styles.heading}>
        <h1>Bản chào bảo hiểm</h1>
        <Link className={styles.button} to="/quotations/new">
          Tạo bản chào
        </Link>
      </div>
      {loading && <p role="status">Đang tải bản chào…</p>}
      {error && (
        <div role="alert" className={styles.error}>
          {error}
          <button onClick={() => setAttempt(attempt + 1)}>Thử lại</button>
        </div>
      )}
      {!loading &&
        !error &&
        (items.length ? (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Số bản chào</th>
                  <th>Khách hàng</th>
                  <th>Tài sản</th>
                  <th>Tổng phí</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={(event) => {
                      if (event.target instanceof Element && !event.target.closest('a'))
                        event.currentTarget.querySelector('a')?.click()
                    }}
                  >
                    <td>
                      <Link to={'/quotations/' + item.id}>{item.number}</Link>
                    </td>
                    <td>{item.customer.name}</td>
                    <td>{item.asset.name}</td>
                    <td>{formatMoney(item.premium.total)}</td>
                    <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className={styles.empty}>
            <h2>Chưa có bản chào nào</h2>
            <p>Tạo bản chào đầu tiên cho một khách hàng và một tài sản.</p>
            <Link to="/quotations/new">Tạo bản chào</Link>
          </section>
        ))}
    </>
  )
}
