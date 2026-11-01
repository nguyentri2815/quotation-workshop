import type { Checkpoint } from '../workshop/catalog'
import { findSymbol, symbolsAt } from '../workshop/source'
import { lessonAt } from './revision'

export interface ProvenanceLink { label: string; file: string; symbol: string }
export interface Provenance { explanation: string; links: ProvenanceLink[]; ui?: string }
// Resolve declarations/imports/sites against this checkpoint's AST. Semantic
// symbols are stable; paths and line numbers are never copied from a later CP.
const normalize = (path: string) => {
  const result: string[] = []
  for (const piece of path.split('/')) { if (piece === '..') result.pop(); else if (piece && piece !== '.') result.push(piece) }
  return result.join('/')
}
export function provenanceFor(cp: Checkpoint): Provenance | undefined {
  const lesson = lessonAt(cp), kind = lesson.provenance
  if (!kind) return
  const product = cp.files.find(f => findSymbol(cp.id, f.path, 'propertyProducts') || findSymbol(cp.id, f.path, 'basicProperty'))
  const definition = (symbol: string) => {
    const file = cp.files.find(f => findSymbol(cp.id, f.path, symbol))?.path
    return file ? { label: 'Định nghĩa', file, symbol } : undefined
  }
  const groups: Record<string, [string, string, string, string]> = {
    single: ['basicProperty', 'SelectProduct', 'SelectProduct', 'productCards'],
    catalog: ['propertyProducts', 'SelectProduct', 'SelectProduct.catalog-map', 'productCards'],
    route: ['propertyProducts', 'QuotationEntry', 'QuotationEntry.product', 'productSelection'],
    props: ['CreateQuotation.product', 'CreateQuotation', 'CreateQuotation.props.ProductInformation', 'productInfo'],
    panel: ['ProductInformation.panel', 'ProductInformation', 'ProductInformation.jsx.textButton', 'productPanel'],
    candidate: ['ProductInformation.candidate', 'ProductInformation', 'ProductInformation.catalog-map', 'productPanel'],
    change: ['CreateQuotation.changeProduct', 'ProductInformation', 'ProductInformation.jsx.dialogActions', 'productInfo'],
    validation: ['getPropertyProduct', 'validateDraft', 'MIN_SUM_INSURED', 'sumInsured'],
    validator: ['validateDraft', 'validateAndBuildInput', 'validateAndBuildInput.errors', 'validationErrors'],
    errors: ['validateDraft', 'CreateQuotation.validatedInput', 'CreateQuotation.inputProps', 'validationErrors'],
    formula: ['calculatePremium', 'CreateQuotation.calculate', 'CreateQuotation.calculate.result', 'premium'],
    premium: ['calculatePremium', 'CreateQuotation.calculate', 'CreateQuotation.props.PremiumSummary', 'premium'],
    receipt: ['calculateDraftPremium', 'CreateQuotation.calculate', 'CreateQuotation.currentPremium', 'premium'],
    record: ['Quotation', 'createQuotation', 'parseQuotation', 'readData'],
    api: ['request', 'quotationsApi', 'quotationsApi.listResult', 'readData'],
    read: ['parseQuotation', 'QuotationDetail', 'QuotationDetail', 'readData'],
    save: ['quotationsApi', 'CreateQuotation.save', 'CreateQuotation.save.success', 'savedResult'],
  }
  const [symbol, owner, use, ui] = groups[kind]
  const def = definition(symbol), consumer = definition(owner), usage = definition(use)
  const imports = consumer && def && symbolsAt(cp.id, consumer.file).find(range => {
    if (range.kind !== 'Import' || !range.name.startsWith('.')) return false
    const resolved = normalize(consumer.file.split('/').slice(0, -1).join('/') + '/' + range.name)
    return def.file.replace(/\.tsx?$/, '') === resolved
  })
  const links: ProvenanceLink[] = [
    ...(def ? [def] : []),
    ...(imports && consumer ? [{ label: 'Import', file: consumer.file, symbol: imports.qualified }] : []),
    ...(usage ? [{ ...usage, label: 'Nơi dùng' }] : consumer ? [{ ...consumer, label: 'Nơi dùng' }] : []),
  ]
  const explanation = kind === 'catalog' && product && consumer
    ? `propertyProducts là catalog runtime được khai báo trong ${product.path}; ${owner} import và duyệt danh sách để render thẻ. React không tự sinh danh sách này.`
    : kind === 'single' && product
      ? `basicProperty là object A được export trong ${product.path}; SelectProduct import rồi đọc name/description trong JSX. Chưa có sản phẩm B.`
      : `${lesson.origin} ${lesson.consumer}`
  return { explanation, links, ui }
}
