import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
const workspace = (page: Page) => page.getByLabel('Phiên chạy Chặng 1', { exact: true })
const preview = (page: Page) => page.frameLocator('iframe[title^="Phiên chạy mẫu"]')
const url = (scenario: string, step: number, sub: number, mode = 'demo', mark = '') => `/?run=${scenario}&runMode=${mode}#journey=2&step=${step}&sub=${sub}&tab=build${mark ? `&mark=${mark}` : ''}`
async function complete(page: Page) { await expect(workspace(page)).toHaveAttribute('data-status', 'done', { timeout: 40000 }) }
async function posts(page: Page) { return preview(page).locator('body').evaluate(() => window.__workshopRun?.network.filter(item => item.kind === 'request' && item.method === 'POST').length ?? 0) }
async function openHistory(page: Page) { await page.getByRole('button', { name: 'Lịch sử quan sát', exact: true }).click(); return page.getByRole('dialog', { name: 'Lịch sử quan sát phiên chạy', exact: true }) }

test('Field A–F đúng mốc: contract / định nghĩa / nơi dùng, chỉ đọc và range thật', async ({ page }) => {
  const ids = ['01-field-contract','01-field-example','01-field-first','01-field-customer','01-field-asset','03-fields']
  for (const [index, mark] of ids.entries()) {
    await page.goto(url('field',1,2,'demo',mark))
    await expect(page.locator(`iframe[title="Phiên chạy mẫu ${mark}"]`)).toHaveCount(1)
    await complete(page)
    const frame = preview(page)
    await expect(frame.locator('#root input, #root textarea')).toHaveCount([0,1,1,3,6,8][index])
    expect(await frame.locator('#root input, #root textarea').evaluateAll(elements => elements.every(el => (el as HTMLInputElement).readOnly || (el as HTMLInputElement).disabled || el.closest('fieldset[disabled]')))).toBe(true)
    const code = workspace(page).getByLabel('Code liên quan phiên chạy', { exact: true })
    await expect(code.locator('[data-explained="true"]').first()).toBeAttached()
    await expect(code).toHaveAttribute('data-file','pages/CreateQuotation.tsx')
    const graph = workspace(page).getByLabel('Flow của phiên chạy',{exact:true})
    if (!index) await expect(graph).toContainText('Định nghĩa Field · chưa hình thành')
    else {
      const usage = graph.locator('.react-flow__node[data-id="usage"] button')
      if (index === 2) { await usage.focus(); await page.keyboard.press('Enter') }
      else await usage.click()
      await expect(code.locator('[data-explained="true"]').first()).toBeInViewport()
    }
    const history = await openHistory(page)
    await expect(history).toContainText(`${[0,1,1,3,6,8][index]} input`)
    await expect(history.getByRole('button').filter({ hasText: 'Input DOM' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('progressbar')).toHaveAttribute('value','0')
  }
})

test('UI thật: nhập, validation lỗi, tính đúng phí, mất hiệu lực/khóa lưu rồi tính lại', async ({ page }) => {
  for (const [scenario, step, sub] of [['input',2,2],['validation',3,1],['calculate',3,4],['invalidate',4,1]] as const) {
    await page.goto(url(scenario,step,sub))
    await complete(page)
    const frame = preview(page)
    if (scenario === 'input') await expect(frame.locator('#customerName')).toHaveValue('Học thử Chặng 1')
    if (scenario === 'validation') await expect(frame.locator('#customerName-error')).toContainText('Vui lòng nhập tên khách hàng')
    if (scenario === 'calculate') await expect(frame.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
    if (scenario === 'invalidate') {
      await expect(frame.locator('[aria-labelledby="premium-heading"]')).toContainText('2.200.000')
      await expect(frame.locator('#sumInsured')).toHaveValue('2000000000')
      const history = await openHistory(page)
      await expect(history).toContainText('Phí hết hiệu lực · Lưu bị khóa')
      await page.keyboard.press('Escape')
    }
    const history = await openHistory(page)
    await expect(history).toContainText('Đã quan sát')
    // Internal React events are explanations, never fabricated journal entries.
    await expect(history.locator('li').filter({ hasText: 'setPremium(' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    expect(await posts(page)).toBe(0)
  }
})

test('hướng dẫn chờ người học; checkpoint thiếu không tự báo thành công', async ({ page }) => {
  await page.goto(url('input',2,2,'guided','02-inputs'))
  const frame = preview(page)
  await expect(frame.locator('[data-run-highlight="customerName"]')).toBeVisible({timeout:30000})
  await expect(workspace(page)).toHaveAttribute('data-status','waiting')
  await expect(frame.locator('#customerName')).toHaveValue('')
  await frame.locator('#customerName').fill('Người học tự nhập')
  await complete(page)
  await expect(frame.locator('#customerName')).toHaveValue('Người học tự nhập')
  await page.getByRole('button',{name:'Thoát phiên chạy',exact:true}).click()
  await page.getByLabel('Mốc nhỏ trong sub-step',{exact:true}).selectOption('02-draft')
  await page.getByRole('button',{name:'Chạy thử',exact:true}).click()
  await page.getByLabel('Kịch bản chạy thử',{exact:true}).selectOption('input')
  await expect(page.getByRole('button',{name:'Tự thao tác có hướng dẫn',exact:true})).toBeDisabled()
  await expect(page.getByRole('dialog')).toContainText('chưa hỗ trợ')
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('02-draft')
})

test('lưu lỗi: HTTP thực, dữ liệu giữ nguyên, đọc lại không POST, retry bắt buộc người học', async ({ page }) => {
  await page.goto(url('save-retry',5,5))
  await expect(workspace(page)).toHaveAttribute('data-step','4',{timeout:40000})
  const frame = preview(page)
  await expect(frame.locator('[data-run-highlight="save"]')).toBeVisible()
  await expect(frame.locator('form [role="alert"]')).toContainText('Lỗi lưu có chủ đích')
  await expect(frame.locator('#customerName')).toHaveValue('Công ty TNHH Mộc An Demo')
  await expect(frame.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
  expect(await posts(page)).toBe(1)
  const history = await openHistory(page)
  await expect(history).toContainText('MSW phản hồi 500')
  await history.locator('li button').first().click()
  expect(await posts(page)).toBe(1)
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  await page.getByRole('button',{name:'Tiếp bước',exact:true}).click()
  expect(await posts(page)).toBe(1)
  await frame.getByRole('button',{name:'Lưu bản chào',exact:true}).click()
  await complete(page)
  expect(await posts(page)).toBe(2)
  await openHistory(page)
  await page.getByRole('button',{name:'Theo kết quả mới nhất',exact:true}).click()
  await expect(frame.getByRole('heading',{name:'Đã lưu bản chào thành công',exact:true})).toBeVisible()
  const finalHistory = await openHistory(page)
  await expect(finalHistory).toContainText('MSW phản hồi 201')
  await finalHistory.locator('li button').first().click()
  expect(await posts(page)).toBe(2)
})

test('phiên riêng, resize/chế độ/source/history và thoát khôi phục iframe review/progress', async ({ page }) => {
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/#journey=2&step=3&sub=4&tab=build')
  const review = page.frameLocator('iframe[title="Preview mẫu checkpoint 05"]')
  await review.locator('#customerName').fill('Dữ liệu review cần giữ')
  const origin = await review.locator('body').evaluate(() => performance.timeOrigin)
  const hash = new URL(page.url()).hash
  const progress = await page.evaluate(() => localStorage.getItem('quotation-workshop.behaviors.v2'))
  const oldCode = page.getByLabel('Source mẫu',{exact:true}).getByTestId('code-scroll')
  await oldCode.waitFor(); await oldCode.evaluate(el => { el.scrollTop=300 })
  const oldScroll = await oldCode.evaluate(el=>el.scrollTop)
  await page.getByRole('button',{name:'Chạy thử',exact:true}).click()
  await page.getByLabel('Kịch bản chạy thử',{exact:true}).selectOption('calculate')
  await page.getByRole('button',{name:'Xem chạy mẫu',exact:true}).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await complete(page)
  const frame = preview(page), sessionOrigin = await frame.locator('body').evaluate(()=>performance.timeOrigin)
  for (const mode of ['code','preview','compare']) {
    await page.getByLabel('Chế độ làm việc',{exact:true}).selectOption(mode)
    expect(await frame.locator('body').evaluate(()=>performance.timeOrigin)).toBe(sessionOrigin)
  }
  const separator = page.getByRole('separator',{name:'Kéo độ rộng preview',exact:true})
  await separator.focus(); await page.keyboard.press('ArrowLeft')
  await page.getByRole('tab',{name:'Flow phiên chạy',exact:true}).click()
  await page.getByRole('tab',{name:'Code liên quan',exact:true}).click()
  await page.getByLabel('Theo vùng',{exact:true}).selectOption('code')
  const code = workspace(page).getByTestId('code-scroll')
  await code.hover(); await page.mouse.wheel(0,300)
  await expect(page.getByRole('button',{name:'Theo tiếp',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Theo tiếp',exact:true}).click()
  await page.getByLabel('Theo vùng',{exact:true}).selectOption('ui')
  await frame.locator('#customerName').hover(); await page.mouse.wheel(0,200)
  await expect(page.getByRole('button',{name:'Theo tiếp',exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(1440)
  await page.getByRole('button',{name:'Thoát phiên chạy',exact:true}).click()
  expect(new URL(page.url()).hash).toBe(hash)
  expect(await review.locator('body').evaluate(()=>performance.timeOrigin)).toBe(origin)
  await expect(review.locator('#customerName')).toHaveValue('Dữ liệu review cần giữ')
  expect(await oldCode.evaluate(el=>el.scrollTop)).toBe(oldScroll)
  expect(await page.evaluate(()=>localStorage.getItem('quotation-workshop.behaviors.v2'))).toBe(progress)
})

test('pause trước thao tác, request đang gửi vẫn xong; restart/thoát không nhận phiên cũ', async ({ page }) => {
  await page.goto(url('save',5,5))
  const frame = preview(page)
  await frame.locator('form').evaluate(form=>{
    // Pause in the same DOM turn that exposes pending. Several Playwright round
    // trips can exceed the real mock's 650 ms response; do not extend that delay.
    const observer=new MutationObserver(()=>{
      if(form.getAttribute('aria-busy')!=='true')return
      observer.disconnect()
      const pause=parent.document.querySelector<HTMLButtonElement>('button[aria-label="Tạm dừng"]')!
      pause.click()
      requestAnimationFrame(()=>{
        parent.document.documentElement.dataset.qaPauseStatus=parent.document.querySelector('[data-session][data-status]')?.getAttribute('data-status')??''
        parent.document.documentElement.dataset.qaPauseBusy=form.getAttribute('aria-busy')??''
      })
    })
    observer.observe(form,{attributes:true,attributeFilter:['aria-busy']})
  })
  await expect(page.locator('html')).toHaveAttribute('data-qa-pause-status','paused',{timeout:40000})
  await expect(page.locator('html')).toHaveAttribute('data-qa-pause-busy','true')
  const oldId = await workspace(page).getAttribute('data-session')
  await page.getByRole('button',{name:'Chạy lại phiên',exact:true}).click()
  await expect(workspace(page)).not.toHaveAttribute('data-session',oldId!)
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  await expect(preview(page).locator('#customerName')).toBeVisible()
  await expect(workspace(page)).toHaveAttribute('data-status','paused')
  await page.waitForTimeout(1000) // Negative race assertion: let the old mock response arrive.
  expect(await posts(page)).toBe(0)
  const history = await openHistory(page)
  await expect(history.locator('li')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Thoát phiên chạy',exact:true}).click()
  await expect(workspace(page)).toHaveCount(0)
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('09')
})

for (const [width,height] of [[1440,900],[1920,1080],[1152,720],[1536,864],[390,900],[320,900]]) test(`phiên chạy ${width}×${height}: diện tích, bàn phím và điều khiển luôn tới được`, async ({page}) => {
  await page.setViewportSize({width,height})
  await page.goto(url('calculate',3,4))
  await complete(page)
  await expect(page.getByRole('button',{name:'Thoát phiên chạy',exact:true})).toBeInViewport()
  if (width > 700) {
    expect((await workspace(page).getByTestId('code-scroll').boundingBox())!.height/height).toBeGreaterThan(.60)
    expect((await page.locator('iframe[title^="Phiên chạy mẫu"]').boundingBox())!.height/height).toBeGreaterThan(.75)
  } else {
    await page.getByRole('tab',{name:'Hướng dẫn',exact:true}).click()
    await expect(workspace(page)).toBeVisible()
    await expect(workspace(page).getByLabel('Code liên quan phiên chạy',{exact:true}).locator('[data-explained="true"]').first()).toBeInViewport()
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  await page.getByRole('button',{name:'Thông tin phiên chạy',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Thông tin phiên chạy',exact:true})).toContainText('Chưa instrument hàm')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button',{name:'Thông tin phiên chạy',exact:true})).toBeFocused()
  await page.screenshot({path:`.verification/run-session-20261031/run-${width}.png`})
})

test('lỗi điều kiện thực dừng, cho quan sát lại, không thành công do thời gian', async ({ page }) => {
  await page.addInitScript(()=>{
    if(window!==parent)return
    // Observe creation from the parent: init scripts are not consistently run
    // for this service-worker-controlled iframe navigation in Chrome.
    const attached=new WeakSet<HTMLIFrameElement>()
    const observeFrames=()=>document.querySelectorAll<HTMLIFrameElement>('iframe[src*="workshopRun="]').forEach(frame=>{
      if(attached.has(frame))return
      attached.add(frame)
      const block=()=>{
        const doc=frame.contentDocument,win=frame.contentWindow;if(!doc||!win)return
        const disable=()=>{const button=[...doc.querySelectorAll('button')].find(button=>button.textContent?.trim()==='Tính phí');if(button)button.disabled=true}
        const observer=new MutationObserver(disable)
        observer.observe(doc,{subtree:true,childList:true});disable()
        win.addEventListener('qa:restore-calculate',()=>observer.disconnect(),{once:true})
      }
      frame.addEventListener('load',block);block()
    })
    new MutationObserver(observeFrames).observe(document,{subtree:true,childList:true})
  })
  await page.goto(url('validation',3,1))
  const frame = preview(page)
  await expect(workspace(page)).toHaveAttribute('data-status','failed',{timeout:30000})
  await page.getByRole('button',{name:'Thông tin phiên chạy',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Thông tin phiên chạy',exact:true})).toContainText('Nút bị khóa')
  await page.keyboard.press('Escape')
  await frame.getByRole('button',{name:'Tính phí',exact:true}).evaluate(el => { window.dispatchEvent(new Event('qa:restore-calculate')); (el as HTMLButtonElement).disabled = false })
  await page.getByRole('button',{name:'Quan sát lại bước lỗi',exact:true}).click()
  await frame.getByRole('button',{name:'Tính phí',exact:true}).click()
  await complete(page)
  await expect(frame.locator('#customerName-error')).toBeVisible()
})

test('đổi URL sang checkpoint chưa đủ dừng phiên cũ; source raw không bị instrument', async ({ page, request }) => {
  const raw = await request.get('/checkpoints/09/_workshop/environment.ts?raw')
  expect(raw.status()).toBe(200)
  expect(await raw.text()).not.toContain('runEnvironment')
  await page.goto(url('calculate',3,4))
  await complete(page)
  await page.goto(url('calculate',3,1))
  await expect(workspace(page)).toHaveCount(0)
  await expect(page.getByLabel('Checkpoint mẫu',{exact:true})).toHaveValue('04')
  await expect(page.getByRole('status').filter({hasText:'chưa hỗ trợ'})).toContainText('Mốc 04')
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0')
})

test('pause trong lúc đợi iframe; Tiếp bước chỉ làm một thao tác thật', async ({ page }) => {
  let release: (() => Promise<void>) | undefined
  await page.route(/\/checkpoints\/05\/index\.html\?workshopRun=/, route => new Promise<void>(resolve => {
    release = async () => { await route.continue(); resolve() }
  }))
  await page.goto(url('calculate',3,4))
  await expect(workspace(page)).toHaveAttribute('data-status','loading')
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  await expect.poll(()=>Boolean(release)).toBe(true)
  await release!()
  const frame = preview(page)
  await expect(frame.locator('#customerName')).toBeVisible()
  await expect(workspace(page)).toHaveAttribute('data-status','paused')
  await expect(frame.locator('#customerName')).toHaveValue('')
  await page.getByRole('button',{name:'Tiếp bước',exact:true}).click()
  await expect(workspace(page)).toHaveAttribute('data-step','1')
  await expect(workspace(page)).toHaveAttribute('data-status','paused')
  await expect(frame.locator('#customerName')).toHaveValue('Công ty TNHH Mộc An Demo')
  await expect(frame.locator('[aria-labelledby="premium-heading"]')).toContainText('Chưa có kết quả phí')
  expect(await posts(page)).toBe(0)
  await page.getByRole('button',{name:'Thoát phiên chạy',exact:true}).click()
  await expect(workspace(page)).toHaveCount(0)
})
