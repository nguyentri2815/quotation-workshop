import { expect, test } from '@playwright/test'
const url = (id: string, run = '') => `/?stage=2&version=1${run ? '&run=product-switch&runMode=' + run : ''}#checkpoint=${id}`
for (const cp of ['s2-04-validation','s2-05-pricing','s2-06-consistency']) test(`${cp}: source, preview và khả năng đúng mốc`, async ({ page }) => {
  await page.goto(url(cp))
  const frame = page.frameLocator(`iframe[title="Preview mẫu checkpoint ${cp}"]`)
  await frame.getByRole('button',{name:'Điền dữ liệu mẫu'}).click()
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  const premium = frame.locator('[aria-labelledby="premium-heading"]')
  await expect(premium).toContainText('1.100.000')
  await frame.locator('#productCode').selectOption('EXTENDED_PROPERTY')
  await expect(premium).toContainText('Cần tính lại phí')
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await expect(frame.locator('#endDate-error')).toContainText('180')
  await expect(premium).not.toContainText('Đã tính phí')
  const start = await frame.locator('#startDate').inputValue()
  const end = new Date(Date.parse(start + 'T00:00:00Z') + 180 * 86400000).toISOString().slice(0,10)
  await frame.locator('#endDate').fill(end)
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  if (cp === 's2-04-validation') {
    await expect(frame.getByRole('alert')).toContainText('Chưa nối tính phí')
    await expect(premium).not.toContainText('Đã tính phí')
  } else {
    for (const text of ['EXTENDED_PROPERTY / v1','0,15%','180 ngày','739.726','73.973','813.699']) await expect(premium).toContainText(text)
    await expect(frame.getByRole('button',{name:'Lưu bản chào',exact:true})).toBeDisabled()
    await frame.locator('form').evaluate(el=>el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
    await expect(frame.getByRole('alert')).toContainText('Lưu sản phẩm B được bổ sung ở mốc tiếp theo')
  }
  await frame.locator('#sumInsured').fill('1000000')
  if (cp !== 's2-06-consistency') await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await expect(frame.locator('#sumInsured-error')).toContainText('10.000.000')
  if (cp === 's2-06-consistency') {
    await frame.locator('#productCode').selectOption('BASIC_PROPERTY')
    await expect(frame.locator('#sumInsured-error')).toHaveCount(0)
    await expect(frame.getByRole('button',{name:'Lưu bản chào',exact:true})).toBeDisabled()
  }
  const time = await frame.locator('body').evaluate(()=>performance.timeOrigin)
  await page.getByRole('button',{name:'Diff',exact:true}).click()
  await expect(page.getByLabel('Source mẫu',{exact:true}).getByTestId('code-scroll')).toBeVisible()
  await expect(page.getByLabel('Source mẫu',{exact:true})).toContainText('Diff')
  await page.getByRole('tab',{name:'Tổng thể',exact:true}).click()
  await page.getByRole('button',{name:'Theo một thao tác',exact:true}).click()
  await page.getByLabel('Thao tác cần theo',{exact:true}).selectOption('calculate')
  const flow=page.getByTestId('runtime-flow')
  await flow.getByRole('button',{name:'Mở danh sách sự kiện',exact:true}).click()
  await page.getByLabel('Chọn event',{exact:true}).selectOption('validate')
  await flow.locator('li').filter({hasText:/^validateDraft/}).getByRole('button',{name:'Mở đoạn trong Xây từng bước →',exact:true}).click()
  await expect(page.getByLabel('Symbol',{exact:true})).toHaveValue('validateDraft')
  expect(await frame.locator('body').evaluate(()=>performance.timeOrigin)).toBe(time)
})

for (const cp of ['s2-04-validation','s2-05-pricing','s2-06-consistency']) test(`${cp}: phiên thật có nhánh lỗi/hợp lệ, history không chạy lại`, async ({ page }) => {
  await page.goto(url(cp,'demo'))
  await page.getByLabel('Tốc độ trình diễn',{exact:true}).selectOption('2')
  const shell = page.locator('[data-stage="2"]')
  await expect(shell).toHaveAttribute('data-run-status','done',{timeout:90000})
  const frame = page.frameLocator('iframe[title^="Phiên chạy mẫu s2-"]')
  const postCount = () => frame.locator('body').evaluate(()=>window.__workshopRun?.network.filter(e=>e.kind==='request' && e.method==='POST').length)
  expect(await postCount()).toBe(0)
  await page.getByRole('button',{name:'Lịch sử quan sát',exact:true}).click()
  const history = page.getByRole('dialog',{name:'Lịch sử quan sát phiên chạy',exact:true})
  await expect(history).toContainText('180 ngày')
  await expect(history).toContainText('10.000.000')
  if (cp !== 's2-04-validation') {
    await expect(history).toContainText('813.699')
    await expect(history).toContainText('Lưu disabled=true')
  }
  await history.locator('li button').first().click()
  expect(await postCount()).toBe(0)
  await expect(shell).toHaveAttribute('data-run-status','done')
})

test('Preview 2 mobile: bàn phím, code rộng và iframe giữ nguyên khi đổi view/resize', async ({ page }) => {
  await page.setViewportSize({width:390,height:900})
  await page.goto(url('s2-06-consistency'))
  await expect(page.getByLabel('Source mẫu',{exact:true}).getByTestId('code-scroll')).toBeVisible()
  expect((await page.getByTestId('code-scroll').boundingBox())!.height /900).toBeGreaterThan(.60)
  await page.getByRole('tab',{name:'Preview',exact:true}).click()
  const frame = page.frameLocator('iframe[title="Preview mẫu checkpoint s2-06-consistency"]')
  await frame.getByRole('button',{name:'Điền dữ liệu mẫu'}).click()
  const select = frame.locator('#productCode')
  await select.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter')
  await expect(select).toHaveValue('EXTENDED_PROPERTY')
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await expect(frame.locator('#endDate-error')).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({path:'.verification/preview2-mobile.png'})
})

test('Preview 2: catalog → validation/công thức → handler → state → presentation có range thật', async ({ page }) => {
  await page.goto(url('s2-06-consistency'))
  const frame = page.frameLocator('iframe[title="Preview mẫu checkpoint s2-06-consistency"]')
  await frame.locator('#customerName').fill('Draft giữ khi đọc cây')
  const origin = await frame.locator('body').evaluate(()=>performance.timeOrigin)
  await page.getByRole('tab',{name:'Phụ thuộc của bước',exact:true}).click()
  const tree=page.getByTestId('step-dependencies'),source=page.getByLabel('Source mẫu',{exact:true})
  for(const [id,symbol,file,code] of [
    ['lookup','getPropertyProduct','quotation/products.ts','getPropertyProduct'],
    ['validate','validateDraft','quotation/rules.ts','validateDraft'],
    ['validated','CreateQuotation.validatedInput','pages/CreateQuotation.tsx','validatedInput'],
    ['calculate','CreateQuotation.calculate','pages/CreateQuotation.tsx','function calculate'],
    ['receipt','calculateDraftPremium','quotation/rules.ts','calculateDraftPremium'],
    ['result','CreateQuotation.premium','pages/CreateQuotation.tsx','useState<CalculatedPremium'],
    ['matches','premiumMatchesDraft','quotation/rules.ts','premiumMatchesDraft'],
    ['current','CreateQuotation.currentPremium','pages/CreateQuotation.tsx','currentPremium'],
    ['summary','PremiumSummary','components/PremiumSummary.tsx','PremiumSummary'],
  ]) {
    await page.getByLabel('Tìm symbol trên cây',{exact:true}).fill(symbol)
    await page.locator('[data-search-result="'+id+'"]').click()
    await expect(tree.locator('[data-dependency-selected="true"]')).toBeInViewport()
    await tree.getByRole('button',{name:'Mở đúng file/range trong Code',exact:true}).click()
    await expect(source).toHaveAttribute('data-file',file)
    await expect(source.locator('[data-explained="true"]')).toContainText([code])
    await page.getByRole('tab',{name:'Phụ thuộc của bước',exact:true}).click()
  }
  expect(await frame.locator('body').evaluate(()=>performance.timeOrigin)).toBe(origin)
  await expect(frame.locator('#customerName')).toHaveValue('Draft giữ khi đọc cây')
  await page.screenshot({path:'.verification/preview2-desktop.png'})
})
