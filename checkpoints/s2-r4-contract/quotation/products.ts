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
