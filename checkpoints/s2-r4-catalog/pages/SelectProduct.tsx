import { propertyProducts } from '../quotation/products'
export function SelectProduct() {
  return (
    <div>
      {propertyProducts.map((product) => (
        <article key={product.code}>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
        </article>
      ))}
    </div>
  )
}
