import { expect,test } from '@playwright/test'
import type { Page } from '@playwright/test'
const url=(id='s2-r2-complete',run='')=>`/?stage=2&version=2${run?'&run='+run+'&runMode=demo':''}#checkpoint=${id}`
const frame=(page:Page)=>page.frameLocator('iframe[title="Preview mẫu checkpoint s2-r2-complete"]')
test('khung chung: 5 bước lớn/sub-step, Code/Trước/Sau/Diff, Flow trong Tổng thể; giữ iframe',async({page})=>{
  await page.goto(url());await expect(page.locator('[data-workspace="shared"][data-stage="2"]')).toBeVisible({timeout:30000})
  await expect(page.getByLabel('Các bước thực hành',{exact:true}).getByRole('button')).toHaveCount(5)
  await expect(page.getByLabel('Tiến trình sub-step',{exact:true})).toBeVisible()
  const preview=frame(page);await preview.getByRole('link',{name:'Tạo bản chào Tài sản mở rộng',exact:true}).click();await preview.locator('#customerName').fill('Không remount iframe')
  const time=await preview.locator('body').evaluate(()=>performance.timeOrigin)
  await page.getByRole('button',{name:'Diff',exact:true}).click();await expect(page.getByLabel('Source mẫu',{exact:true})).toContainText('Diff')
  await page.getByRole('button',{name:'Sau',exact:true}).click()
  await page.getByRole('tab',{name:'Tổng thể',exact:true}).click();await page.getByRole('button',{name:'Theo một thao tác',exact:true}).click();await page.getByLabel('Thao tác cần theo',{exact:true}).selectOption('calculate');await expect(page.getByTestId('runtime-flow')).toContainText('Có lỗi')
  await page.getByRole('tab',{name:'Xây từng bước',exact:true}).click();await page.getByLabel('Chế độ làm việc',{exact:true}).selectOption('code');await page.getByLabel('Chế độ làm việc',{exact:true}).selectOption('compare')
  expect(await preview.locator('body').evaluate(()=>performance.timeOrigin)).toBe(time);await expect(preview.locator('#customerName')).toHaveValue('Không remount iframe')
  await page.getByRole('button',{name:'Hành trình phát triển',exact:true}).click();await expect(page.getByRole('heading',{name:'Hành trình phát triển',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'So sánh UI trước/sau',exact:true}).click();await expect(page.frameLocator('iframe[title="So sánh UI trước Chặng 1"]').locator('#customerName')).toBeVisible();await expect(page.frameLocator('iframe[title="So sánh UI sau Chặng 2"]').getByRole('heading',{name:'Chọn sản phẩm',exact:true})).toBeVisible()
  const beforeKey=await page.frameLocator('iframe[title="So sánh UI trước Chặng 1"]').locator('body').evaluate(()=>window.__workshopRun?.storageKey)
  const afterKey=await page.frameLocator('iframe[title="So sánh UI sau Chặng 2"]').locator('body').evaluate(()=>window.__workshopRun?.storageKey);expect(beforeKey).not.toBe(afterKey)
  await page.getByRole('button',{name:'Xem diff code',exact:true}).click();await expect(page.getByLabel('Source so sánh',{exact:true})).toContainText('QuotationEntry')
  await page.getByRole('button',{name:'Quay lại workspace',exact:true}).click();expect(await preview.locator('body').evaluate(()=>performance.timeOrigin)).toBe(time);await expect(preview.locator('#customerName')).toHaveValue('Không remount iframe')
})
for(const scenario of ['select-product','a-save','b-save','switch','retry-save','legacy-read'])test(`phiên quan sát mới: ${scenario}`,async({page})=>{
  test.setTimeout(110000)
  await page.goto(url('s2-r2-complete',scenario));const root=page.locator('[data-stage="2"][data-workspace="shared"]')
  await page.getByLabel('Tốc độ trình diễn',{exact:true}).selectOption('2')
  const running=page.frameLocator('iframe[title="Phiên chạy mẫu s2-r2-complete"]')
  if(scenario==='retry-save'){await expect(root).toHaveAttribute('data-run-step','5',{timeout:60000});await expect(running.getByRole('alert')).toContainText('Lỗi lưu');await running.getByRole('button',{name:'Lưu bản chào',exact:true}).click()}
  await expect(root).toHaveAttribute('data-run-status','done',{timeout:90000})
  if(scenario==='b-save')await expect(running.locator('[aria-labelledby="premium-heading"]')).toContainText('813.699')
  if(scenario==='legacy-read')await expect(running.locator('main')).toContainText('Bản chào A gốc')
  await page.getByRole('button',{name:'Lịch sử quan sát',exact:true}).click();const history=page.getByRole('dialog',{name:'Lịch sử quan sát phiên chạy',exact:true});await expect(history).toContainText('Đã quan sát')
  const posts=()=>running.locator('body').evaluate(()=>window.__workshopRun?.network.filter(e=>e.kind==='request'&&e.method==='POST').length)
  const count=await posts();await history.locator('li button').first().click();expect(await posts()).toBe(count)
  await page.getByRole('button',{name:'Thoát phiên chạy',exact:true}).click();await expect(root).not.toHaveAttribute('data-run-status')
})
for(const [width,height]of [[1440,900],[1920,1080],[390,900]])test(`workspace chung ${width}×${height}, bàn phím và source rộng`,async({page})=>{
  await page.setViewportSize({width,height});await page.goto(url());await expect(page.getByTestId('code-scroll')).toBeVisible()
  expect((await page.getByTestId('code-scroll').boundingBox())!.height/height).toBeGreaterThan(.6)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  await page.getByRole('button',{name:'Tùy chọn explorer',exact:true}).click();await page.getByRole('button',{name:'Cây thư mục vật lý',exact:true}).click();await page.keyboard.press('Escape')
  if(width>700){const separator=page.getByRole('separator',{name:'Kéo độ rộng preview',exact:true});await separator.focus();await page.keyboard.press('ArrowLeft')}
  await page.screenshot({path:`.verification/redesign/workshop-${width}.png`})
})
