import { propertyProducts } from '../quotation/products'
import type { PropertyProduct } from '../quotation/products'
import { formatMoney, formatRate } from '../quotation/format'
import styles from './ui.module.css'

export function ProductInformation({ product, onProductChange, disabled = false }: {
  product: PropertyProduct
  onProductChange?: (code: string) => void
  disabled?: boolean
}) {
  return (
    <section id="product-info" className={`${styles.card} ${styles.productCard}`} aria-labelledby="product-heading" data-product={product.code}>
      <div className={styles.cardHeading}>
        <div><span className={styles.eyebrow}>NORMAL · TÀI SẢN · VND</span><h2 id="product-heading">Sản phẩm bảo hiểm</h2></div>
        {onProductChange && <label className={styles.productPicker} htmlFor="productCode">Chọn sản phẩm
          <select id="productCode" aria-label="Chọn sản phẩm" value={product.code} disabled={disabled} onChange={event => onProductChange(event.target.value)}>
            {propertyProducts.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </label>}
      </div>
      <div className={styles.productBody} aria-live="polite">
        <div><strong data-product-name>{product.name}</strong><span className={styles.productVersion}>Phiên bản {product.version} · {product.code}</span></div>
        <p>{product.description}</p>
        <dl className={styles.productRules}>
          <div><dt>Số tiền bảo hiểm</dt><dd>{formatMoney(product.minSumInsured)} – {formatMoney(product.maxSumInsured)}</dd></div>
          <div><dt>Thời hạn</dt><dd>{product.minDays}–{product.maxDays} ngày</dd></div>
          <div><dt>Tỷ lệ năm</dt><dd>{formatRate(product.annualRate)}</dd></div>
          <div><dt>Thuế demo</dt><dd>{formatRate(product.taxRate)}</dd></div>
        </dl>
        <p className={styles.demoNote}>Dữ liệu demo phục vụ học tập, không phải quy tắc bảo hiểm thực tế.</p>
      </div>
    </section>
  )
}
