import { readFile,writeFile,readdir,mkdir } from 'node:fs/promises'
import { resolve,dirname } from 'node:path'
import { createHash } from 'node:crypto'
const root=resolve(import.meta.dirname,'..'), sha=value=>createHash('sha256').update(value).digest('hex')
const old=JSON.parse(await readFile(resolve(root,'stage2/manifest.json'),'utf8'))
for(const cp of old.checkpoints) for(const file of cp.files) if(sha(await readFile(resolve(root,'checkpoints',cp.id,file.path)))!==file.sha256) throw new Error('Published checkpoint changed: '+cp.id+'/'+file.path)
async function sources(dir,prefix='') { const result={}; for(const e of await readdir(dir,{withFileTypes:true})) { const path=prefix+e.name; if(e.isDirectory()) Object.assign(result,await sources(resolve(dir,e.name),path+'/')); else if(!path.includes('.test.')&&/\.(tsx?|css)$/.test(path))result[path]=await readFile(resolve(dir,e.name),'utf8') }return result }
function embed(path,code) {
  if(path==='App.tsx')return code.replaceAll('createBrowserRouter','createHashRouter')
  if(path==='main.tsx')return "import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n"+code.replace("worker.start({ quiet: true, onUnhandledFrame: 'bypass' })",'worker.start(workerOptions)').replace("const { router } = await import('./App')","mountTools()\n  const { router } = await import('./App')")
  if(path==='api/quotations.ts'||path==='mocks/handlers.ts')return "import { apiBase } from '../_workshop/environment'\n"+code.replaceAll("'/api/quotations/:id'","apiBase + '/:id'").replaceAll('`/api/quotations/${','`${apiBase}/${').replaceAll("'/api/quotations'",'apiBase')
  if(path==='mocks/storage.ts')return "import { storageKey } from '../_workshop/environment'\n"+code.replace("STORAGE_KEY = 'quotation-product.demo.v1'",'STORAGE_KEY = storageKey')
  return code
}
const environment=await readFile(resolve(root,'checkpoints/s2-06-consistency/_workshop/environment.ts'),'utf8')
const scaffold={ '_workshop/environment.ts':environment, '_workshop/tools.ts':await readFile(resolve(root,'checkpoints/s2-06-consistency/_workshop/tools.ts'),'utf8'), 'index.html':await readFile(resolve(root,'checkpoints/s2-06-consistency/index.html'),'utf8') }
const legacyTools = scaffold['_workshop/tools.ts'].replace("import { checkpointId }", "import { storageKey, checkpointId }").replace('  host.append(button, fail, status)', `  const legacy = document.createElement('button')
  legacy.textContent = 'Mở bản chào A cũ'
  legacy.onclick = () => {
    if (!storageKey.startsWith('quotation-workshop.run.')) { status.textContent = 'Chỉ chuẩn bị fixture A cũ trong phiên chạy riêng.'; return }
    try {
      const raw = localStorage.getItem(storageKey)
      const stored = raw === null ? { version:1, quotations:[] } : JSON.parse(raw)
      if (stored.version !== 1 || !Array.isArray(stored.quotations)) throw new Error('Dữ liệu phiên không hợp lệ, giữ nguyên.')
      if (!stored.quotations.some((item: {id?:string}) => item?.id === 'legacy-basic-v1')) stored.quotations.push({
        type:'NORMAL',line:'PROPERTY',currency:'VND',id:'legacy-basic-v1',number:'Q-2026-000041',createdAt:'2026-01-01T00:00:00Z',status:'CREATED',
        customer:{name:'Bản chào A gốc',phone:'',email:''},asset:{name:'Kho gốc',address:'Địa chỉ mô phỏng',sumInsured:1000000000},period:{startDate:'2026-01-01',endDate:'2027-01-01'},
        premium:{days:365,annualRate:0.001,taxRate:0.1,net:1000000,tax:100000,total:1100000,installmentAmount:1100000}
      })
      localStorage.setItem(storageKey,JSON.stringify(stored))
      status.textContent = 'Đã chuẩn bị fixture A gốc trong phiên riêng; GET sẽ đọc bằng adapter.'
      location.hash = '/quotations/legacy-basic-v1'
    } catch(error) { status.textContent = error instanceof Error ? error.message : 'Không mở được A cũ.' }
  }
  host.append(button, fail, legacy, status)`)
let existing
try { existing=JSON.parse(await readFile(resolve(root,'stage2/revision-2.json'),'utf8')) } catch(e) {if(e.code!=='ENOENT')throw e}
if(existing)for(const cp of existing.checkpoints)for(const file of cp.files)if(sha(await readFile(resolve(root,'checkpoints',cp.id,file.path)))!==file.sha256)throw new Error('Authored snapshot edited: '+cp.id+'/'+file.path)
const manifest={stage:2,version:2,baseline:'s2-06-consistency',authorship:'Learning checkpoints, not Git commit history',checkpoints:[]}
let previous=Object.fromEntries(await Promise.all(old.checkpoints.at(-1).files.map(async f=>[f.path,await readFile(resolve(root,'checkpoints/s2-06-consistency',f.path),'utf8')])) )
for(const [index,id]of ['s2-r2-ui','s2-r2-complete'].entries()) {
  if(index===0&&existing) { const cp=existing.checkpoints[0];manifest.checkpoints.push(cp);previous=Object.fromEntries(await Promise.all(cp.files.map(async f=>[f.path,await readFile(resolve(root,'checkpoints',cp.id,f.path),'utf8')])));continue }
  const input=await sources(resolve(root,index===0?'.verification/redesign/product-ui':'../quotation-product/src'))
  const source={...Object.fromEntries(Object.entries(input).map(([p,c])=>[p,embed(p,c)])),...scaffold}
  if(index===1)source['_workshop/tools.ts']=legacyTools
  const files=[]
  for(const [path,code] of Object.entries(source).sort(([a],[b])=>a.localeCompare(b))) {
    const target=resolve(root,'checkpoints',id,path);await mkdir(dirname(target),{recursive:true});let current;try{current=await readFile(target,'utf8')}catch(e){if(e.code!=='ENOENT')throw e}if(current!==code)await writeFile(target,code)
    files.push({path,sha256:sha(code),status:previous[path]===code?'unchanged':previous[path]===undefined?'new':'modified',origin:path.startsWith('_workshop/')||path==='index.html'?'workshop':['App.tsx','main.tsx','api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(path)?'adapted':'product',first:old.checkpoints.at(-1).files.find(f=>f.path===path)?.first??id,lastStep:index+7,scaffold:false,lines:code.trimEnd().split('\n').length})
  }
  manifest.checkpoints.push({id,order:index+7,step:index===0?3:4,kind:'ui',title:index===0?'Refactor UX · hành vi tương đương Preview 2':'Lưu/đọc A và B · phiên bản và lịch sử',ui:index===0?'Chọn sản phẩm trước form; panel xác nhận đổi. Giữ tính A/B, lưu A; B chưa lưu tại mốc chuyển tiếp này.':'Cả A/B tính, lưu, đọc lại. POST tra mã/phiên bản; GET dùng snapshot đã phát hành, adapter hẹp cho A cũ.',previous:index===0?'s2-06-consistency':'s2-r2-ui',files})
  previous=source
}
await writeFile(resolve(root,'stage2/revision-2.json'),JSON.stringify(manifest,null,2)+'\n')
console.log('Verified 7 published checkpoints; authored revision 2 with 2 transition snapshots.')
