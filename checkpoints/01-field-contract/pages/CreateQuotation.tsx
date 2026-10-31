import type { ReactNode } from 'react'
export type FieldProps = {
  id: string
  label: string
  children: ReactNode
}
export function CreateQuotation() { return <section data-testid="starter-empty"><h1>Biểu mẫu chưa được xây</h1><p>Scaffold có sẵn; xem các bước tiếp theo.</p></section> }
