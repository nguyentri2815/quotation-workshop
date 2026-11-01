import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const root=resolve(import.meta.dirname,'..'), hash=v=>createHash('sha256').update(v).digest('hex')
async function tree(dir,prefix='') {
  const result={}
  for(const e of await readdir(dir,{withFileTypes:true})) {
    const path=prefix+e.name
    if(e.isDirectory())Object.assign(result,await tree(resolve(dir,e.name),path+'/'))
    else if(!path.includes('.test.')&&/\.(tsx?|css)$/.test(path))result[path]=await readFile(resolve(dir,e.name),'utf8')
  }
  return result
}
async function write(path,code){const target=resolve(root,path);try{if(await readFile(target,'utf8')===code)return}catch(e){if(e.code!=='ENOENT')throw e}await mkdir(dirname(target),{recursive:true});await writeFile(target,code)}
// Pin the actual working tree, including uncommitted Product changes, once.
// Subsequent materialization reads only this pin and verifies every existing ID.
let pin
try{pin=JSON.parse(await readFile(resolve(root,'stage2/product-r3.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
if(!pin){
  const productRoot=resolve(root,'../quotation-product'),files=await tree(resolve(productRoot,'src'))
  const git=arg=>execFileSync('git',arg,{cwd:productRoot,encoding:'utf8'}).trim()
  pin={stage:2,revision:3,pinnedAt:new Date().toISOString(),authorization:'Current Product is the comparison target per user instruction; tests/completion do not imply user approval.',commit:git(['rev-parse','HEAD']),workingTree:git(['status','--short']),files:Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([path,code])=>({path,sha256:hash(code)}))}
  pin.sha256=hash(JSON.stringify(pin.files))
  for(const [path,code]of Object.entries(files))await write('stage2/product-r3/'+path,code)
  await write('stage2/product-r3.json',JSON.stringify(pin,null,2)+'\n')
}
const product=await tree(resolve(root,'stage2/product-r3'))
for(const f of pin.files)if(hash(product[f.path])!==f.sha256)throw new Error('Product pin changed: '+f.path)
const base=JSON.parse(await readFile(resolve(root,'stage2/manifest.json'),'utf8')).checkpoints[0]
const baseline=Object.fromEntries(await Promise.all(base.files.map(async f=>[f.path,await readFile(resolve(root,'checkpoints',base.id,f.path),'utf8')])))
const scaffold=Object.fromEntries(Object.entries(baseline).filter(([p])=>p.startsWith('_workshop/')||p==='index.html'))
scaffold['_workshop/tools.ts']=await readFile(resolve(root,'checkpoints/s2-r2-complete/_workshop/tools.ts'),'utf8')
function embed(path,code){
 if(path==='App.tsx')return code.replaceAll('createBrowserRouter','createHashRouter')
 if(path==='main.tsx')return "import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n"+code.replace("worker.start({ quiet: true, onUnhandledFrame: 'bypass' })",'worker.start(workerOptions)').replace("const { router } = await import('./App')","mountTools()\n  const { router } = await import('./App')")
 if(path==='api/quotations.ts'||path==='mocks/handlers.ts')return "import { apiBase } from '../_workshop/environment'\n"+code.replaceAll("'/api/quotations/:id'","apiBase + '/:id'").replaceAll('`/api/quotations/${','`${apiBase}/${').replaceAll("'/api/quotations'",'apiBase')
 if(path==='mocks/storage.ts')return "import { storageKey } from '../_workshop/environment'\n"+code.replace("STORAGE_KEY = 'quotation-product.demo.v1'",'STORAGE_KEY = storageKey')
 return code
}
const target=Object.fromEntries(Object.entries(product).map(([p,c])=>[p,embed(p,c)]))
const ids=['s2-r3-00','s2-r3-catalog','s2-r3-entry','s2-r3-panel','s2-r3-validation','s2-r3-pricing','s2-r3-complete']
const titles=['Baseline Chặng 1 hoàn chỉnh','Catalog và trang chọn sản phẩm','Chọn sản phẩm → đúng form / ngữ cảnh','Panel đổi sản phẩm · hủy / xác nhận','Validation theo sản phẩm','Tính phí và hiệu lực theo sản phẩm / phiên bản','Lưu / đọc sản phẩm và phiên bản']
const ui=['Chặng 1 được giữ nguyên làm điểm xuất phát.','/products hiển thị catalog; nút tạo chưa nối. Form A cũ vẫn dùng được.','/products → form theo mã; ngữ cảnh gọn, chưa có đổi sản phẩm. A tính được; B và lưu chưa nối.','Panel chọn ứng viên, hủy giữ nguyên; xác nhận giữ draft và bỏ phí. B và lưu chưa nối.','Validation A/B dùng giới hạn catalog; B365 báo lỗi. Công thức B và lưu chưa nối.','A365 = 1.100.000; B180 = 813.699; receipt so mã/phiên bản/đầu vào. Lưu chưa nối.','Khớp Product ghim qua adapter nhúng: A/B lưu, đọc/reload; snapshot lịch sử và adapter A cũ.']
let existing
try{existing=JSON.parse(await readFile(resolve(root,'stage2/revision-3.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
if(existing)for(const cp of existing.checkpoints)for(const f of cp.files)if(hash(await readFile(resolve(root,'checkpoints',cp.id,f.path)))!==f.sha256)throw new Error('Immutable checkpoint edited: '+cp.id+'/'+f.path)
let previous={}
const manifest={stage:2,version:3,baseline:'12',productPin:'stage2/product-r3.json',productHash:pin.sha256,checkpoints:[]}
for(const [order,id]of ids.entries()){
 let source={...baseline}
 if(order>=1){
   for(const p of ['quotation/products.ts','quotation/format.ts','components/ui.module.css'])source[p]=target[p]
   source['pages/SelectProduct.tsx']=target['pages/SelectProduct.tsx']
   source['App.tsx']=target['App.tsx']
   if(order===1){
     source['pages/SelectProduct.tsx']=source['pages/SelectProduct.tsx'].split('export function QuotationEntry')[0].replace("import { Link, Navigate, useSearchParams } from 'react-router-dom'\n",'').replace("import { CreateQuotation } from './CreateQuotation'\n",'').replace(/<Link className=\{styles.primaryButton\} to=\{`\/quotations\/new\?product=\$\{product.code\}`\}>/,'<button type="button" className={styles.primaryButton} disabled>').replace('</Link>','</button>')
     source['App.tsx']=source['App.tsx'].replace('QuotationEntry, SelectProduct','SelectProduct').replace("import { QuotationDetail }", "import { CreateQuotation } from './pages/CreateQuotation'\nimport { QuotationDetail }").replace('<QuotationEntry />','<CreateQuotation />')
   }
 }
 if(order>=2&&order<6){
   let form=target['pages/CreateQuotation.tsx']
   // Keep persistence out until the actual product contract/readers arrive together.
   form=form.replace("import { ApiError, quotationsApi } from '../api/quotations'\n",'').replace('const [saving, setSaving] = useState(false)','const saving = false').replace('  const saveInFlight = useRef(false)\n','')
   form=form.replace(/  async function save\(\) \{[\s\S]*?\n  return \(/,'  async function save() { return }\n\n  return (').replace('disabled={saving || !currentPremium}','disabled')
   if(order<5){
     form=form.replace('  calculateDraftPremium,\n  premiumMatchesDraft,','  calculatePremium,').replace('FieldErrors, CalculatedPremium,','FieldErrors, Premium,').replace('useState<CalculatedPremium | null>','useState<Premium | null>').replace('premiumMatchesDraft(premium, draft, productCode) ? premium : null','premium')
     form=form.replace('setPremium(calculateDraftPremium(draft, productCode))','setPremium(calculatePremium(Number(draft.sumInsured), draft.startDate, draft.endDate))').replace('    setPremium(calculatePremium','    if (productCode !== \'BASIC_PROPERTY\') return\n    setPremium(calculatePremium')
     form=form.replace('onClick={calculate} disabled={saving}','onClick={calculate} disabled={saving || productCode !== \'BASIC_PROPERTY\'}')
     // At the validation milestone B can validate, but cannot calculate yet.
     if(order===4)form=form.replace("disabled={saving || productCode !== 'BASIC_PROPERTY'}",'disabled={saving}')
     form=form.replace(' annualRate={product.annualRate} taxRate={product.taxRate}','')
   }
   if(order<4){
     form=form.replace('  const [validated, setValidated] = useState(false)\n','').replace(/    if \(validated\) setErrors\(validateDraft\((next|draft), (productCode|next.code)\)\)\n/g,'').replaceAll('validateDraft(draft, productCode)','validateDraft(draft)').replace('validateAndBuildInput(draft, productCode)','validateAndBuildInput(draft)').replace('        if (!validated) setErrors','        setErrors').replaceAll('        setValidated(true)\n','').replaceAll('    setValidated(true)\n','')
   }
   let info=target['components/ProductInformation.tsx']
   if(order===2){
     form=form.replace('[productCode, setProductCode]','[productCode]').replace(/  function changeProduct\(code: string\) \{[\s\S]*?\n  function inputProps/,'  function inputProps').replace(' onProductChange={changeProduct}','')
     info=info.replace("import { useRef, useState } from 'react'\n",'').replace("import { propertyProducts } from '../quotation/products'\n",'').replace('product, onProductChange, disabled = false','product').replace('  const panel = useRef<HTMLDialogElement>(null)\n  const [candidate, setCandidate] = useState(product.code)\n','').replace(/      \{onProductChange && <button[\s\S]*?<\/button>\}\n/,'').replace(/    <dialog[\s\S]*?<\/dialog>\n/,'')
   }
   source['pages/CreateQuotation.tsx']=form
   source['components/ProductInformation.tsx']=info
 }
 if(order>=4&&order<6){
   source['quotation/types.ts']="import type { PropertyProductCode } from './products'\n"+baseline['quotation/types.ts'].replace('export type ValidationResult =','export type ProductInput = Omit<QuotationInput, \'product\'> & { product: PropertyProductCode; productVersion: number }\nexport interface CalculatedPremium extends Premium { productCode: PropertyProductCode; productVersion: number; productName: string; inputs: Pick<QuotationDraft, \'sumInsured\' | \'startDate\' | \'endDate\'> }\nexport type ValidationResult<Input = QuotationInput> =').replace('data: QuotationInput','data: Input')
   const prefix=product['quotation/rules.ts'].split('export function calculatePremium')[0].replace('Premium, QuotationDraft','Premium, Quotation, QuotationInput, QuotationDraft').replace("= 'BASIC_PROPERTY'): ValidationResult<ProductInput>","= 'BASIC_PROPERTY'): ValidationResult<QuotationInput | ProductInput>")
   const legacy=baseline['quotation/rules.ts']
   const formula=(order===4?legacy:product['quotation/rules.ts']).split('export function calculatePremium')[1].split('export function pricingInputsChanged')[0]
   source['quotation/rules.ts']=prefix+'export function calculatePremium'+formula+legacy.slice(legacy.indexOf('export function pricingInputsChanged'))
   if(order===4)source['quotation/rules.ts']=source['quotation/rules.ts'].replace('CalculatedPremium, ','')
   if(order===5){
     source['quotation/rules.ts']+='\n'+product['quotation/rules.ts'].slice(product['quotation/rules.ts'].indexOf('// Pricing receipt'))
     source['components/PremiumSummary.tsx']=target['components/PremiumSummary.tsx']
   }
 }
 if(order===6)source={...target,...scaffold}
 const files=[]
 for(const [path,code]of Object.entries(source).sort(([a],[b])=>a.localeCompare(b))){
   const old=existing?.checkpoints[order]?.files.find(f=>f.path===path)
   if(old&&old.sha256!==hash(code))throw new Error('Use a new revision instead of changing '+id+'/'+path)
   await write('checkpoints/'+id+'/'+path,code)
   files.push({path,sha256:hash(code),status:previous[path]===code?'unchanged':previous[path]===undefined?'new':'modified',origin:path.startsWith('_workshop/')||path==='index.html'?'workshop':['App.tsx','main.tsx','api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(path)?'adapted':'product',first:manifest.checkpoints.find(cp=>cp.files.some(f=>f.path===path))?.id??id,lastStep:order,scaffold:false,lines:code.trimEnd().split('\n').length})
 }
 manifest.checkpoints.push({id,order,step:[0,1,1,2,3,3,4][order],kind:'ui',title:titles[order],ui:ui[order],previous:ids[order-1],files})
 previous=source
}
await write('stage2/revision-3.json',JSON.stringify(manifest,null,2)+'\n')
console.log('Pinned Product '+pin.sha256+'; verified/authored 7 revision 3 checkpoints. Historical IDs untouched.')
