import type { PropertyProduct } from '../quotation/products'
import { formatMoney, formatRate } from '../quotation/format'
import styles from './ui.module.css'

export function ProductInformation({ product }: {
  product: PropertyProduct
  onProductChange?: (code: string) => void
  disabled?: boolean
}) {
  return <section id="product-info" className={styles.productContext} aria-label="Ngữ cảnh bản chào" data-product={product.code}>
    <div><strong data-product-name>{product.name}</strong><p>Tài sản <span>·</span> Normal <span>·</span> VND</p></div>
    <div className={styles.contextActions}>
      <details className={styles.productDetails}><summary>Chi tiết sản phẩm</summary><p>{product.description}</p><p>{product.code} / phiên bản {product.version}</p><dl><dt>Số tiền bảo hiểm</dt><dd>{formatMoney(product.minSumInsured)} – {formatMoney(product.maxSumInsured)}</dd><dt>Thời hạn</dt><dd>{product.minDays}–{product.maxDays} ngày</dd><dt>Tỷ lệ năm / Thuế</dt><dd>{formatRate(product.annualRate)} / {formatRate(product.taxRate)}</dd></dl></details>
    </div>
  </section>
}
