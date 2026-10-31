import { Link } from 'react-router-dom'
import styles from '../practice.module.css'
// TODO WS10-LIST: tải danh sách qua quotationsApi.list().
export function QuotationList() {
  return (
    <section className={styles.empty}>
      <h1>Danh sách chưa được xây</h1>
      <p>Khung thực hành đang rỗng có chủ đích. Bạn sẽ tự nối API ở bước 10.</p>
      <Link to="/quotations/new" className={styles.button}>
        Mở vùng tạo bản chào
      </Link>
    </section>
  )
}
