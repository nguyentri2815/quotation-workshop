import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import manifest from '../../stage2/revision-4.json' with { type: 'json' }
const url=(id='catalog',extra='')=>`/?stage=2&version=4#checkpoint=s2-r4-${id}&tab=build${extra}`
const preview=(p:Page,id:string)=>p.frameLocator(`iframe[title="Preview mẫu checkpoint s2-r4-${id}"]`)

test('đi tuần tự 26 sub-step: source focus và UI chỉ xuất hiện sau khi được xây',async({page})=>{
 test.setTimeout(180000)
 await page.goto(url('00'))
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 for(const [i,cp]of manifest.checkpoints.entries()){
  const id=cp.id.slice(6),app=preview(page,id)
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue(cp.id)
  await expect(page.getByRole('region',{name:'Source mẫu',exact:true})).toHaveAttribute('data-file',cp.focus[0])
  await expect(page.getByTestId('code-scroll').filter({visible:true}).locator('[data-explained="true"]').first()).toBeVisible()
  if(i<3){await expect(app.locator('#customerName')).toBeVisible();await expect(app.locator('#root article')).toHaveCount(0)}
  else{
   await expect(app.locator('#root article')).toHaveCount(id==='page'?1:2)
   if(i<5)await expect(app.getByRole('heading',{name:'Chọn sản phẩm',exact:true})).toHaveCount(0)
   else await expect(app.getByRole('heading',{name:'Chọn sản phẩm',exact:true})).toBeVisible()
   if(i<8)await expect(app.getByRole('button',{name:/Tạo bản chào/})).toHaveCount(0)
   if(id==='actions')await expect(app.getByRole('button',{name:'Tạo bản chào Tài sản mở rộng',exact:true})).toBeDisabled()
   if(i>=9){
    await app.getByRole('link',{name:'Tạo bản chào Tài sản mở rộng',exact:true}).click()
    if(id==='route'){
     await expect(app.getByRole('heading',{name:'Tài sản mở rộng',exact:true})).toBeVisible()
     await expect(app.locator('#customerName')).toHaveCount(0)
     await expect(app.getByRole('button',{name:'Tạo bản chào',exact:true})).toBeDisabled()
    }else{
     await expect(app.locator('#product-info')).toHaveAttribute('data-product','EXTENDED_PROPERTY')
     await expect(app.locator('#customerName')).toBeVisible()
     if(id==='entry')await expect(app.getByRole('button',{name:'Đổi sản phẩm',exact:true})).toHaveCount(0)
     if(['panel-open','candidate'].includes(id)){
      await app.getByRole('button',{name:'Đổi sản phẩm',exact:true}).click()
      const panel=app.getByRole('dialog',{name:'Đổi sản phẩm',exact:true})
      await expect(panel.locator('input[type="radio"]')).toHaveCount(id==='panel-open'?0:2)
      await expect(panel.getByRole('button',{name:'Xác nhận đổi sản phẩm',exact:true})).toBeDisabled()
      await panel.getByRole('button',{name:'Giữ sản phẩm hiện tại',exact:true}).click()
     }
    }
   }
  }
  await expect(app.locator('#productCode, form article')).toHaveCount(0)
  if(i<manifest.checkpoints.length-1)await page.getByRole('button',{name:'Sub-step tiếp',exact:true}).click()
 }
 expect(errors).toEqual([])
})

test('Định nghĩa → Import → Nơi dùng → UI mở đúng range và không điều hướng nghiệp vụ',async({page})=>{
 await page.goto(url())
 const region=page.getByRole('region',{name:'Source mẫu',exact:true})
 for(const [label,file,symbol]of [['Định nghĩa','quotation/products.ts','propertyProducts'],['Import','pages/SelectProduct.tsx','import:../quotation/products'],['Nơi dùng','pages/SelectProduct.tsx','SelectProduct.catalog-map']]){
  await page.getByRole('button',{name:'Nguồn gốc dữ liệu',exact:true}).click()
  const dialog=page.getByRole('dialog',{name:'Nguồn gốc dữ liệu',exact:true})
  await expect(dialog).toContainText('catalog runtime được khai báo trong quotation/products.ts')
  await dialog.getByRole('button',{name:new RegExp('^'+label)}).click()
  await expect(region).toHaveAttribute('data-file',file)
  await expect(page.getByLabel('Symbol',{exact:true})).toHaveValue(symbol)
  await expect(region.locator('[data-explained="true"]').first()).toBeVisible()
 }
 await page.getByRole('button',{name:'Nguồn gốc dữ liệu',exact:true}).click()
 await page.getByRole('button',{name:'UI · Chỉ vùng được tạo',exact:true}).click()
 const app=preview(page,'catalog')
 await expect(app.locator('[data-workshop-highlight="productCards"]')).toBeVisible()
 await expect(app.locator('#root article')).toHaveCount(2)
 await page.getByRole('button',{name:'Chi tiết nhiệm vụ',exact:true}).click()
 const task=page.getByRole('dialog',{name:'Chi tiết nhiệm vụ',exact:true})
 for(const text of ['Vì sao cần?','Dữ liệu/thành phần đến từ đâu?','Tạo/sửa ở đâu?','Phần nào dùng?','Source thay đổi gì?','UI tại mốc này'])await expect(task).toContainText(text)
})

test('wrap giữ nguyên source, số dòng, copy, highlight và hỗ trợ Diff; gutter cố định khi không wrap',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write'])
 await page.goto(url('entry','&file=pages%2FCreateQuotation.tsx&symbol=CreateQuotation&side=after'))
 const region=page.getByRole('region',{name:'Source mẫu',exact:true}),raw=readFileSync('checkpoints/s2-r4-entry/pages/CreateQuotation.tsx','utf8')
 const scroll=region.getByTestId('code-scroll')
 await expect(region.locator('[data-ready="true"]')).toBeVisible()
 await expect(page.getByRole('button',{name:'Ngắt dòng dài',exact:true})).toHaveAttribute('aria-pressed','true')
 expect(await region.getByTestId('source-line').allTextContents()).toEqual(raw.trimEnd().split('\n'))
 expect(await region.locator('[data-line]').evaluateAll(es=>es.map(e=>Number(e.getAttribute('data-line'))))).toEqual(raw.trimEnd().split('\n').map((_,i)=>i+1))
 expect(await scroll.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1)
 const wrapped=await region.locator('[data-explained="true"]').evaluateAll(es=>es.some(e=>e.getBoundingClientRect().height>24))
 expect(wrapped).toBe(true)
 await page.evaluate(()=>{const clipboard=navigator.clipboard,write=clipboard.writeText.bind(clipboard);clipboard.writeText=async text=>{(window as unknown as {copiedSource:string}).copiedSource=text;await write(text)}})
 await page.getByRole('button',{name:'Thông tin kỹ thuật',exact:true}).click()
 await page.getByRole('button',{name:'Chép',exact:true}).click()
 expect(await page.evaluate(()=>(window as unknown as {copiedSource:string}).copiedSource)).toBe(raw)
 expect((await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n')).toBe(raw)
 await page.getByRole('button',{name:'Đóng thông tin source',exact:true}).click()
 await page.getByRole('button',{name:'Diff',exact:true}).click()
 await expect(region.locator('[data-ready="true"]')).toBeVisible()
 expect(await scroll.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1)
 const before=readFileSync('checkpoints/s2-r4-route/pages/CreateQuotation.tsx','utf8').trimEnd().split('\n')
 for(const row of await region.locator('[data-old-line],[data-new-line]').evaluateAll(es=>es.map(e=>({old:Number(e.getAttribute('data-old-line')),next:Number(e.getAttribute('data-new-line')),text:e.querySelector('code')!.textContent})))){
  if(row.old)expect(row.text).toBe(before[row.old-1])
  if(row.next)expect(row.text).toBe(raw.trimEnd().split('\n')[row.next-1])
 }
 // Historical source stays byte-identical; the shared viewer can wrap its long JSX.
 await page.goto('/?stage=2&version=3#checkpoint=s2-r3-catalog&tab=build&file=pages%2FSelectProduct.tsx&symbol=SelectProduct&side=diff')
 const old=page.getByRole('region',{name:'Source mẫu',exact:true})
 await expect(old.locator('[data-ready="true"]')).toBeVisible()
 await page.getByRole('button',{name:'Ngắt dòng dài',exact:true}).click()
 const oldScroll=old.getByTestId('code-scroll'),gutter=old.locator('[data-new-line] > span').first()
 const x=(await gutter.boundingBox())!.x
 await oldScroll.evaluate(e=>e.scrollLeft=600)
 expect((await gutter.boundingBox())!.x).toBeCloseTo(x,0)
 await page.goto('/#journey=2&step=1&sub=2&tab=build')
 await expect(page.getByRole('button',{name:'Ngắt dòng dài',exact:true})).toHaveAttribute('aria-pressed','false')
 await page.getByRole('button',{name:'Ngắt dòng dài',exact:true}).click()
})

test('route thiếu/sai mã và panel xác nhận ở mốc hình thành đúng',async({page})=>{
 await page.goto('/checkpoints/s2-r4-route/index.html#/quotations/new?product=UNKNOWN')
 await expect(page.getByRole('alert')).toContainText('Không tìm thấy sản phẩm')
 await page.goto('/checkpoints/s2-r4-route/index.html#/quotations/new')
 await expect(page.getByRole('heading',{name:'Chọn sản phẩm',exact:true})).toBeVisible()
 await page.goto(url('panel'))
 const app=preview(page,'panel')
 await app.getByRole('link',{name:'Tạo bản chào Tài sản cơ bản',exact:true}).click()
 await app.getByRole('button',{name:'Điền dữ liệu mẫu',exact:true}).click()
 await app.getByRole('button',{name:'Tính phí',exact:true}).click()
 await expect(app.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
 const values=()=>app.locator('#root input:not([type="radio"]),#root textarea').evaluateAll(es=>es.map(e=>(e as HTMLInputElement).value)),before=await values()
 await app.getByRole('button',{name:'Đổi sản phẩm',exact:true}).click()
 const panel=app.getByRole('dialog',{name:'Đổi sản phẩm',exact:true})
 await panel.locator('input[value="EXTENDED_PROPERTY"]').check()
 await panel.getByRole('button',{name:'Giữ sản phẩm hiện tại',exact:true}).click()
 await expect(app.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
 await app.getByRole('button',{name:'Đổi sản phẩm',exact:true}).click()
 await expect(panel.locator('input[value="BASIC_PROPERTY"]')).toBeChecked()
 await panel.locator('input[value="EXTENDED_PROPERTY"]').check()
 await panel.getByRole('button',{name:'Xác nhận đổi sản phẩm',exact:true}).click()
 expect(await values()).toEqual(before)
 await expect(app.locator('#product-info')).toHaveAttribute('data-product','EXTENDED_PROPERTY')
 await expect(app.locator('[aria-labelledby="premium-heading"]')).toContainText('Cần tính lại phí')
})

test('URL v3 lưu source/tiến độ; chuyển sang v4 không tự hoàn thành',async({page})=>{
 await page.goto('/?stage=2&version=3#checkpoint=s2-r3-catalog&tab=build')
 await expect(page.getByText('Phiên bản bài học cũ',{exact:false}).first()).toBeVisible()
 await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-r3-catalog')
 await page.evaluate(()=>localStorage.setItem('quotation-workshop.stage2.progress.v3',JSON.stringify({checked:[0,1,2,3,4],notes:{0:'Giữ lịch sử'}})))
 await page.getByRole('link',{name:'Chuyển tới mốc mới tương ứng',exact:true}).click()
 await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-r4-actions')
 await expect(page.getByLabel('Các bước thực hành',{exact:true}).locator('svg')).toHaveCount(0)
 expect(await page.evaluate(()=>localStorage.getItem('quotation-workshop.stage2.progress.v4'))).toBeNull()
 expect(await page.evaluate(()=>localStorage.getItem('quotation-workshop.stage2.progress.v3'))).toContain('Giữ lịch sử')
})

test('source đã format vẫn cô lập API/storage phiên Chạy thử khỏi preview',async({page})=>{
 test.setTimeout(90000)
 const base='quotation-workshop.stage2.checkpoint.s2-r4-complete.v1'
 await page.goto(url('complete'))
 await page.evaluate(key=>localStorage.setItem(key,'sentinel preserved'),base)
 await page.goto('/?stage=2&version=4&run=a-save&runMode=demo#checkpoint=s2-r4-complete')
 await page.getByLabel('Tốc độ trình diễn',{exact:true}).selectOption('2')
 await expect(page.locator('[data-stage="2"][data-workspace="shared"]')).toHaveAttribute('data-run-status','done',{timeout:75000})
 expect(await page.evaluate(key=>localStorage.getItem(key),base)).toBe('sentinel preserved')
 const frame=page.frameLocator('iframe[title="Phiên chạy mẫu s2-r4-complete"]')
 const bridge=await frame.locator('body').evaluate(()=>{
  const b=window.__workshopRun!
  return {key:b.storageKey,api:b.apiBase,requests:b.network.filter(e=>e.kind==='request').map(e=>e.url)}
 })
 expect(bridge.key).toMatch(/^quotation-workshop\.run\..+\.s2-r4-complete\.v1$/)
 expect(bridge.requests.length).toBeGreaterThan(1)
 for(const request of bridge.requests)expect(new URL(request).pathname.startsWith(bridge.api)).toBe(true)
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).quotations.length,bridge.key)).toBe(3)
})

test('điểm thay đổi tính phí mở source r4 sau format, giữ graph và draft khi đọc',async({page})=>{
 await page.goto('/?stage=2&version=4#checkpoint=s2-r4-complete&tab=overview&overviewMode=runtime&runtimeFlow=calculate&runtimeEvent=validate&compareChanges=true')
 const app=preview(page,'complete')
 await app.getByRole('link',{name:'Tạo bản chào Tài sản cơ bản',exact:true}).click()
 await app.locator('#customerName').fill('Đọc graph không đổi draft')
 await expect(page.getByTestId('flow-inspector')).toContainText('Source sau · s2-r4-complete')
 const details=page.getByTestId('flow-inspector').locator('[data-change-id] details')
 await details.first().locator('summary').click()
 await expect(details.first().locator('pre')).toBeVisible()
 await page.getByRole('button',{name:'Toàn luồng',exact:true}).click()
 const viewport=page.locator('.react-flow__viewport').filter({visible:true}).first(),position=await viewport.getAttribute('style')
 await page.getByRole('button',{name:'Điểm thay đổi tiếp',exact:true}).click()
 expect(await viewport.getAttribute('style')).toBe(position)
 await expect(page.getByTestId('flow-inspector')).toContainText('Source trước · 12')
 await expect(page.getByTestId('flow-inspector')).toContainText('Source sau · s2-r4-complete')
 await expect(app.locator('#customerName')).toHaveValue('Đọc graph không đổi draft')
 const behaviors=page.getByLabel('Thao tác cần theo',{exact:true})
 await expect(behaviors.locator('option[value="calculate"]')).toContainText('Kế thừa, có thay đổi')
 await expect(behaviors.locator('option[value="product"]')).toContainText('Mới ở Chặng 2')
})

for(const [id,scenario]of [['page','catalog'],['actions','catalog'],['entry','select-product'],['panel','switch'],['validation','b-validation'],['receipt','b-calculate'],['complete','b-save']])test(`Chạy thử ${id} / ${scenario}`,async({page})=>{
 test.setTimeout(100000)
 await page.goto(`/?stage=2&version=4&run=${scenario}&runMode=demo#checkpoint=s2-r4-${id}`)
 await page.getByLabel('Tốc độ trình diễn',{exact:true}).selectOption('2')
 await expect(page.locator('[data-stage="2"][data-workspace="shared"]')).toHaveAttribute('data-run-status','done',{timeout:85000})
})

for(const [width,height]of [[1440,900],[390,844]])test(`code và điều hướng truy cập được ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height})
 await page.goto(url('entry','&file=pages%2FSelectProduct.tsx&symbol=SelectProduct'))
 if(width<=700)await page.getByRole('tab',{name:'Preview',exact:true}).click()
 await expect(preview(page,'entry').locator('#root article')).toHaveCount(2,{timeout:20000})
 if(width<=700){await page.screenshot({path:'.verification/r4-mobile-preview.png'});await page.getByRole('tab',{name:'Hướng dẫn',exact:true}).click()}
 await expect(page.getByTestId('code-scroll').filter({visible:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Sub-step tiếp',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Ngắt dòng dài',exact:true})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1)
 const code=page.getByTestId('code-scroll').filter({visible:true})
 expect(await code.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1)
 await page.screenshot({path:`.verification/r4-${width}x${height}.png`})
})

// Use Chrome's actual browser zoom in a disposable profile, not CSS zoom,
// device emulation or a pinch scale. Settings cannot open in an incognito context.
test('Chrome zoom thật125% ở1440x900 vẫn đọc code và điều hướng được',async({playwright})=>{
 test.setTimeout(60000)
 const context=await playwright.chromium.launchPersistentContext('.verification/zoom-125-'+Date.now(),{channel:'chrome',headless:true,viewport:{width:1440,height:900}})
 try{
  const settings=await context.newPage();await settings.goto('chrome://settings/appearance')
  await settings.evaluate(()=>new Promise<void>(resolve=>{
   const chrome=(window as unknown as {chrome:{settingsPrivate:{setDefaultZoom:(factor:number,callback:()=>void)=>void}}}).chrome
   chrome.settingsPrivate.setDefaultZoom(1.25,resolve)
  }))
  const page=await context.newPage();await page.goto('http://localhost:3181'+url('entry','&file=pages%2FSelectProduct.tsx&symbol=SelectProduct'))
  await expect(preview(page,'entry').locator('#root article')).toHaveCount(2,{timeout:20000})
  expect(await page.evaluate(()=>devicePixelRatio)).toBe(1.25)
  expect(await page.evaluate(()=>innerWidth)).toBe(1152)
  const code=page.getByTestId('code-scroll').filter({visible:true})
  await expect(code).toBeVisible()
  await expect(page.getByRole('button',{name:'Sub-step tiếp',exact:true})).toBeVisible()
  expect(await code.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({path:'.verification/r4-chrome-zoom125.png'})
 }finally{await context.close()}
})

test('sub-step presentation tự focus đúng phần JSX mới; snapshot tính phí chưa nối lưu không báo có thể lưu',async({page})=>{
 await page.goto(url('heading'))
 for(const [id,symbol]of [['heading','pageHeading'],['cards','card'],['layout','productGrid'],['actions','primaryButton']]){
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-r4-'+id)
  await expect(page.getByLabel('Symbol',{exact:true})).toHaveValue('SelectProduct.jsx.'+symbol)
  await expect(page.getByRole('region',{name:'Source mẫu',exact:true}).locator('[data-explained="true"]').first()).toBeVisible()
  if(id!=='actions')await page.getByRole('button',{name:'Sub-step tiếp',exact:true}).click()
 }
 await page.goto(url('summary'))
 await expect(page.getByLabel('Symbol',{exact:true})).toHaveValue('PremiumSummary.receipt-identity')
 await page.goto(url('entry'))
 const app=preview(page,'entry')
 await app.getByRole('link',{name:'Tạo bản chào Tài sản cơ bản',exact:true}).click()
 await app.getByRole('button',{name:'Điền dữ liệu mẫu',exact:true}).click()
 await app.getByRole('button',{name:'Tính phí',exact:true}).click()
 await expect(app.getByRole('button',{name:'Lưu bản chào',exact:true})).toBeDisabled()
 await expect(app.locator('form [role="status"]')).toHaveText('Đã tính phí.')
})

test('hash và Back từ archive2 sang r4 giữ nguyên ID, không bị codec cũ thay source',async({page})=>{
 await page.goto('/?stage=2&version=2#checkpoint=s2-02-selection&tab=build')
 await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-02-selection')
 await page.evaluate(()=>location.hash='#checkpoint=s2-r4-catalog&tab=build')
 await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-r4-catalog')
 await expect(page.getByText('Phiên bản bài học cũ',{exact:false})).toHaveCount(0)
 await page.goBack()
 await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('s2-02-selection')
 await expect(page.getByText('Phiên bản bài học cũ',{exact:false}).first()).toBeVisible()
})
