import { propertyProducts } from '../quotation/products'
import styles from '../components/ui.module.css'
export function SelectProduct() {
  return <><div className={styles.pageHeading}><div><p className={styles.eyebrow}>BẢN CHÀO MỚI</p><h1>Chọn sản phẩm</h1><p className={styles.subtitle}>Chọn sản phẩm phù hợp để bắt đầu bản chào tài sản.</p></div></div><div className={styles.productGrid}>{propertyProducts.map(product => <article key={product.code} className={styles.card}><h2>{product.name}</h2><p>{product.description}</p><button type="button" className={styles.primaryButton} disabled>Tạo bản chào <span className={styles.srOnly}>{product.name}</span></button></article>)}</div></>
}
