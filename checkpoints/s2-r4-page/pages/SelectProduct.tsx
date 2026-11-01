import { basicProperty } from '../quotation/products'
export function SelectProduct() {
  return (
    <article>
      <h2>{basicProperty.name}</h2>
      <p>{basicProperty.description}</p>
    </article>
  )
}
