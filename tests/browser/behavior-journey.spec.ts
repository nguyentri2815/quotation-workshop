import { selectFlowEvent, selectScenario } from './workspace-helpers'
import { test, expect } from '@playwright/test'
import { lessons } from '../../src/workshop/steps'
import { readFileSync } from 'node:fs'
const manifest: {substepCheckpoints: string[][]} = JSON.parse(readFileSync('checkpoints/manifest.json','utf8'))

test('toàn bộ sáu bước và từng bước con dùng cùng code, checkpoint và preview', async ({page}) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const lesson of lessons) {
    await page.goto(`/#journey=2&step=${lesson.id}&sub=0&tab=build`)
    await expect(page.getByRole('heading', {level:1})).toHaveText(lesson.title)
    for (const [sub, task] of lesson.tasks.entries()) {
      await page.getByLabel('Thao tác trong bước', {exact:true}).getByRole('button', {name:`${lesson.id}.${sub+1} ${task.title}`,exact:true}).click()
      const id=manifest.substepCheckpoints[lesson.id][sub]
      if ((lesson.id === 1 || lesson.id === 2) && sub === 2) await page.getByLabel('Checkpoint mẫu',{exact:true}).selectOption(id)
      await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue(id)
      const panel=page.getByLabel('Source mẫu',{exact:true})
      await expect(panel).toHaveAttribute('data-checkpoint',id)
      await expect(panel.locator('[data-explained="true"]').first()).toBeVisible()
      const frame=page.frameLocator(`iframe[title="Preview mẫu checkpoint ${id}"]`)
      await expect(frame.locator('#root')).not.toBeEmpty()
      await expect(frame.locator('vite-error-overlay')).toHaveCount(0)
      if (lesson.id <= 1 && sub < 2) await expect(frame.getByTestId('starter-empty')).toBeVisible()
      else if (['03-fields','02'].includes(id)) await expect(frame.getByLabel('Tên khách hàng',{exact:false})).toBeDisabled()
      else if (lesson.id > 1) {
        await frame.getByLabel('Tên khách hàng',{exact:false}).fill(`Thử ${lesson.id}.${sub+1}`)
        await expect(frame.getByLabel('Tên khách hàng',{exact:false})).toHaveValue(`Thử ${lesson.id}.${sub+1}`)
      }
      await expect(page.getByRole('progressbar')).toHaveAttribute('value','0')
    }
  }
  expect(errors).toEqual([])
})

test('Nối validation: intent ↔ rules ↔ errors ↔ presentation, preview và luồng có thứ tự', async ({page}) => {
  test.setTimeout(60_000)
  await page.goto('/#journey=2&step=3&sub=1&tab=build')
  const tree=page.getByLabel('Cấu trúc tính năng checkpoint 04',{exact:true})
  const panel=page.getByLabel('Source mẫu',{exact:true})
  const frame=page.frameLocator('iframe[title="Preview mẫu checkpoint 04"]')
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await expect(frame.getByText('Vui lòng nhập tên khách hàng.')).toBeVisible()
  await expect(frame.getByLabel('Tên khách hàng',{exact:false})).toBeFocused()
  const origin=await frame.locator('body').evaluate(()=>performance.timeOrigin)
  for (const [file,section] of [['pages/CreateQuotation.tsx','calculate'],['quotation/rules.ts','build'],['pages/CreateQuotation.tsx','errors'],['pages/CreateQuotation.tsx','actions']]) {
    const item=tree.locator(`[data-file="${file}"][data-section="${section}"]`)
    const group=item.locator('xpath=ancestor::details[@data-group]')
    if (!(await group.evaluate(el => el.hasAttribute('open')))) await group.locator(':scope > summary').click()
    if (!(await item.evaluate(el => el.hasAttribute('open')))) await item.locator(':scope > summary').click()
    await item.getByRole('button',{name:/Xem trong code/}).first().click()
    await expect(panel).toHaveAttribute('data-file',file)
    await expect(panel.locator('[data-explained="true"]').first()).toBeVisible()
    expect(await panel.locator('[data-explained="true"]').count()).toBeLessThan(90)
  }
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('04')
  await page.getByRole('tab',{name:'Tổng thể',exact:true}).click()
  await page.getByRole('button',{name:'Theo một thao tác',exact:true}).click()
  await page.getByLabel('Thao tác cần theo').selectOption('calculate')
  await expect(page.getByTestId('runtime-flow')).toContainText('Mốc 04 chưa đủ luồng')
  await selectScenario(page, 'Dữ liệu có lỗi')
  for(const id of ['calculate','validate','stop','invalid-render']) {
    await selectFlowEvent(page, id)
    await expect(page.locator(`[data-event="${id}"]`)).toHaveAttribute('aria-current','step')
    await expect(page.getByTestId('flow-inspector')).toContainText('Dữ liệu vào')
  }
  await page.getByRole('button',{name:'Bắt đầu lại',exact:true}).click()
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Tiếp tục',exact:true}).click()
  await page.getByRole('button',{name:'Sự kiện trước',exact:true}).click()
  await expect(page.locator('[data-event="stop"]')).toHaveAttribute('aria-pressed','true')
  await page.goBack()
  await expect(page.locator('[data-event="invalid-render"]')).toHaveAttribute('aria-pressed','true')
  await page.getByRole('tab',{name:'Xây từng bước',exact:true}).click()
  await expect(frame.getByText('Vui lòng nhập tên khách hàng.')).toBeVisible()
  expect(await frame.locator('body').evaluate(()=>performance.timeOrigin)).toBe(origin)
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0')
  await page.screenshot({path:'test-results/behavior-validation.png',fullPage:true})
})

test('luồng chưa hình thành không đổi checkpoint; nhập đã có trước nhánh nhất quán phí', async ({page}) => {
  await page.goto('/#journey=2&step=2&sub=2&tab=overview&overviewMode=runtime&runtimeFlow=input-edit&runtimeEvent=render')
  await expect(page.getByTestId('runtime-flow')).toContainText('Mốc 03 chưa đủ luồng')
  await page.getByLabel('Thao tác cần theo').selectOption('save')
  await expect(page.getByTestId('runtime-flow')).toContainText('chưa đủ luồng')
  await selectFlowEvent(page, 'persist')
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('03')
  await page.getByRole('button',{name:'Đến mốc 09 để theo đủ luồng',exact:false}).click()
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('09')
  await expect(page.locator('[data-event="persist"]')).toHaveAttribute('aria-current','step')
})

test('Nối lưu: source luồng thành công/lỗi, khóa gửi lặp và biên nhận POST xác thực', async ({page}) => {
  await page.goto('/#journey=2&step=5&sub=5&tab=overview&overviewMode=runtime&runtimeFlow=save-success')
  const flow=page.getByTestId('runtime-flow')
  await expect(flow).toContainText('Đã có đủ luồng')
  for(const id of ['submit','pending','post','handler','persist','response','navigate']) {
    await selectFlowEvent(page, id)
    const inspector=page.getByTestId('flow-inspector')
    await inspector.getByRole('button',{name:/Xem đúng đoạn/}).first().click()
    await expect(inspector.locator('pre')).toBeVisible()
  }
  await page.getByLabel('Thao tác cần theo').selectOption('save')
  for(const id of ['failure','catch','retry']) await selectFlowEvent(page, id)
  await expect(page.getByTestId('flow-inspector')).toContainText('Không có tự retry')
  const frame=page.frameLocator('iframe[title="Preview mẫu checkpoint 09"]')
  await frame.getByRole('button',{name:'Điền dữ liệu mẫu'}).click()
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await frame.getByText('Công cụ riêng workshop · không thuộc source sản phẩm',{exact:true}).click()
  await frame.getByRole('button',{name:'Gây lỗi lần lưu kế tiếp'}).click()
  await frame.getByRole('button',{name:'Lưu bản chào'}).click()
  await expect(frame.getByRole('alert')).toContainText('Lỗi lưu có chủ đích')
  await expect(frame.getByLabel('Tên khách hàng',{exact:false})).toHaveValue('Công ty TNHH Mộc An Demo')
  let posts=0
  page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/api/checkpoints/09/')) posts++})
  await frame.getByRole('button',{name:'Lưu bản chào'}).click()
  await expect(frame.getByRole('button',{name:'Đang lưu'})).toBeDisabled()
  await frame.locator('form').evaluate(form=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
  await expect(frame.getByRole('heading',{name:'Đã lưu bản chào thành công'})).toBeVisible()
  expect(posts).toBe(1)
  await expect(frame.locator('#root [role="status"]')).toContainText('1.100.000')
  await expect(frame.locator('#root [role="status"]')).toContainText('ID:')
  await page.screenshot({path:'test-results/behavior-save.png',fullPage:true})
})

test('mobile: cây tính năng, luồng và source có thể dùng ở 390 và 320px', async ({page}) => {
  for(const width of [390,320]) {
    await page.setViewportSize({width,height:900})
    await page.goto('/#journey=2&step=3&sub=1&tab=build')
    const explorer = page.getByRole('button',{name:'Explorer',exact:true})
    if (await explorer.getAttribute('aria-expanded') === 'false') await explorer.click()
    await expect(page.getByLabel('Cấu trúc tính năng checkpoint 04',{exact:true})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.getByRole('tab',{name:'Tổng thể',exact:true}).click()
    await page.getByRole('button',{name:'Theo một thao tác',exact:true}).click()
    await page.getByLabel('Thao tác cần theo').selectOption('calculate')
    await selectFlowEvent(page, 'invalid-render')
    await expect(page.getByTestId('flow-inspector')).toContainText('Hiện lỗi và focus trường sai')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.screenshot({path:`test-results/behavior-mobile-${width}.png`,fullPage:true})
  }
})

test('mock trả 400/422; storage lỗi thực không trả thành công và retry giữ bản ghi cũ', async ({page}) => {
  await page.goto('/checkpoints/09/index.html#/quotations/new')
  await page.getByRole('button',{name:'Điền dữ liệu mẫu'}).click()
  const responses=await page.evaluate(async()=>{
    const endpoint='/api/checkpoints/09/quotations'
    const malformed=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})
    const invalid=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    const existing=await fetch(endpoint)
    return {malformed:malformed.status,invalid:invalid.status,existing:existing.status}
  })
  expect(responses).toEqual({malformed:400,invalid:422,existing:200})
  const before=await page.evaluate(()=>localStorage.getItem('quotation-workshop.checkpoint.09.v1'))
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem
    Storage.prototype.setItem=function(key:string,value:string){
      if(key==='quotation-workshop.checkpoint.09.v1') {
        Storage.prototype.setItem=original
        throw new DOMException('QA quota failure','QuotaExceededError')
      }
      return original.call(this,key,value)
    }
  })
  await page.getByRole('button',{name:'Tính phí',exact:true}).click()
  await page.getByRole('button',{name:'Lưu bản chào'}).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Tên khách hàng',{exact:false})).toHaveValue('Công ty TNHH Mộc An Demo')
  expect(await page.evaluate(()=>localStorage.getItem('quotation-workshop.checkpoint.09.v1'))).toBe(before)
  await expect(page.getByRole('button',{name:'Lưu bản chào'})).toBeEnabled()
  await page.getByRole('button',{name:'Lưu bản chào'}).click()
  await expect(page.getByRole('heading',{name:'Đã lưu bản chào thành công'})).toBeVisible()
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('quotation-workshop.checkpoint.09.v1')!).quotations.length)
  expect(count).toBe(JSON.parse(before!).quotations.length+1)
})
