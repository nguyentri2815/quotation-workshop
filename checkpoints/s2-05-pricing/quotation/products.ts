// Learning demo only. These are not real insurance rules or tariffs.
export type PropertyProductCode = 'BASIC_PROPERTY' | 'EXTENDED_PROPERTY'

export interface PropertyProduct {
  code: PropertyProductCode
  version: 1
  name: string
  description: string
  minSumInsured: number
  maxSumInsured: number
  minDays: number
  maxDays: number
  annualRate: number
  taxRate: number
}

export const propertyProducts: readonly PropertyProduct[] = [
  {
    code: 'BASIC_PROPERTY', version: 1, name: 'Tài sản cơ bản',
    description: 'Phương án tài sản cơ bản trong bài học, giữ hành trình tính và lưu của Chặng 1.',
    minSumInsured: 1_000_000, maxSumInsured: 100_000_000_000,
    minDays: 1, maxDays: 365, annualRate: 0.001, taxRate: 0.1,
  },
  {
    code: 'EXTENDED_PROPERTY', version: 1, name: 'Tài sản mở rộng',
    description: 'Phương án minh họa với giới hạn và tỷ lệ khác, để học cách phối hợp dữ liệu sản phẩm và giao diện.',
    minSumInsured: 10_000_000, maxSumInsured: 50_000_000_000,
    minDays: 1, maxDays: 180, annualRate: 0.0015, taxRate: 0.1,
  },
]

export function getPropertyProduct(code: string): PropertyProduct {
  const product = propertyProducts.find(item => item.code === code)
  if (!product) throw new RangeError(`Mã sản phẩm không được hỗ trợ: ${code}`)
  return product
}
