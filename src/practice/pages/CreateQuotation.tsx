import styles from '../practice.module.css'
// TODO WS03: thay khung này bằng biểu mẫu dùng React state.
export function CreateQuotation() {
  return (
    <section className={styles.empty} data-testid="starter-empty">
      <span className={styles.emptyMark}>＋</span>
      <h1>Biểu mẫu chưa được xây</h1>
      <p>Đây là khung chạy được của bạn. Đến bước 3 để thêm input và state.</p>
      <code>src/practice/pages/CreateQuotation.tsx · TODO WS03</code>
    </section>
  )
}
