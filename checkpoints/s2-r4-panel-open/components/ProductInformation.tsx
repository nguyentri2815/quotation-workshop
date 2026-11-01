import { useRef } from 'react'
import type { PropertyProduct } from '../quotation/products'
import { formatMoney, formatRate } from '../quotation/format'
import styles from './ui.module.css'

export function ProductInformation({
  product,
  onProductChange,
  disabled = false,
}: {
  product: PropertyProduct
  onProductChange?: (code: string) => void
  disabled?: boolean
}) {
  const panel = useRef<HTMLDialogElement>(null)
  return (
    <section
      id="product-info"
      className={styles.productContext}
      aria-label="Ngữ cảnh bản chào"
      data-product={product.code}
    >
      <div>
        <strong data-product-name>{product.name}</strong>
        <p>
          Tài sản <span>·</span> Normal <span>·</span> VND
        </p>
      </div>
      <div className={styles.contextActions}>
        {onProductChange && (
          <button
            type="button"
            className={styles.textButton}
            disabled={disabled}
            onClick={() => {
              panel.current?.showModal()
            }}
          >
            Đổi sản phẩm
          </button>
        )}
        <details className={styles.productDetails}>
          <summary>Chi tiết sản phẩm</summary>
          <p>{product.description}</p>
          <p>
            {product.code} / phiên bản {product.version}
          </p>
          <dl>
            <dt>Số tiền bảo hiểm</dt>
            <dd>
              {formatMoney(product.minSumInsured)} –{' '}
              {formatMoney(product.maxSumInsured)}
            </dd>
            <dt>Thời hạn</dt>
            <dd>
              {product.minDays}–{product.maxDays} ngày
            </dd>
            <dt>Tỷ lệ năm / Thuế</dt>
            <dd>
              {formatRate(product.annualRate)} /{' '}
              {formatRate(product.taxRate)}
            </dd>
          </dl>
        </details>
      </div>
      <dialog
        ref={panel}
        className={styles.dialog}
        aria-labelledby="change-product-title"
      >
        <h2 id="change-product-title">Đổi sản phẩm</h2>
        <p>
          Thông tin đang nhập được giữ nguyên. Sản phẩm mới có thể có giới
          hạn khác; phí cũ hết hiệu lực và bạn cần tính lại.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            autoFocus
            onClick={() => panel.current?.close()}
          >
            Giữ sản phẩm hiện tại
          </button>
          <button type="button" className={styles.primaryButton} disabled>
            Xác nhận đổi sản phẩm
          </button>
        </div>
      </dialog>
    </section>
  )
}
