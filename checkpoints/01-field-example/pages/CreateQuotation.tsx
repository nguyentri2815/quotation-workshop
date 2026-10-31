import type { ReactNode } from 'react'
import styles from '../components/ui.module.css'
export type FieldProps = {
  id: string
  label: string
  children: ReactNode
}
function Field({ id, label, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}{' '}
        
      </label>
      {children}
      
      
    </div>
  )
}
export function CreateQuotation() {
  return <section aria-labelledby="field-example"><h1 id="field-example">Minh họa Field · chưa ghép vào form</h1>
    <p>Một định nghĩa nhận label và children. Input chỉ đọc; bước 2 mới nối state.</p>
    <Field id="fieldExample" label="Trường minh họa"><input id="fieldExample" readOnly placeholder="Chưa nối dữ liệu" /></Field>
  </section>
}
