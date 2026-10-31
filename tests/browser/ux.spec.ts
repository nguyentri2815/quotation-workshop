import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

for (const width of [1440, 1920]) {
  test(`sơ đồ / inspector ${width}: chọn node, cây đầy đủ, giữ viewport và iframe`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 1080 })
    await page.goto('/#step=6&sub=1&tab=overview')
    const inspector = page.getByTestId('inspector')
    const viewport = page.locator('.react-flow__viewport')
    await expect(inspector).toBeVisible()
    const frame = page.frameLocator('iframe[title="Preview mẫu checkpoint 06"]')
    await frame
      .getByLabel('Tên khách hàng', { exact: false })
      .fill('Giữ nguyên khi chuyển tab')
    const origin = await frame
      .locator('body')
      .evaluate(() => performance.timeOrigin)
    const initialTransform = await viewport.getAttribute('style')
    await page.locator('.react-flow__controls-zoomout').click()
    await expect
      .poll(() => viewport.getAttribute('style'))
      .not.toBe(initialTransform)
    // React Flow animates the control zoom for 200 ms.
    await page.waitForTimeout(250)
    const transform = await viewport.getAttribute('style')
    for (const name of [
      'Điểm vào & điều hướng',
      'Validation',
      'Tính phí & nhất quán',
    ]) {
      await page
        .getByRole('button', { name: `Thành phần ${name}`, exact: true })
        .click()
      await expect(
        inspector.getByRole('heading', { name, exact: true }),
      ).toBeVisible()
      expect(await viewport.getAttribute('style')).toBe(transform)
      expect(await page.evaluate(() => window.scrollY)).toBe(0)
      await expect(
        page.getByLabel('Checkpoint mẫu', { exact: true }),
      ).toHaveValue('06')
    }
    await page
      .getByRole('button', {
        name: 'Thành phần Điểm vào & điều hướng',
        exact: true,
      })
      .click()
    await expect(inspector.locator('button[data-file]')).toHaveCount(21)
    await expect(inspector.locator('[data-file="main.tsx"]')).toHaveAttribute(
      'data-related',
      'true',
    )
    await expect(
      inspector.locator('[data-file="App.tsx"]'),
    ).toHaveAttribute('data-related', 'true')
    await inspector.getByRole('button', { name: 'api', exact: true }).click()
    await inspector.locator('[data-file="App.tsx"]').click()
    await expect(
      page.getByRole('tab', { name: 'Xây từng bước', exact: true }),
    ).toHaveAttribute('aria-selected', 'true')
    await expect(
      page.getByLabel('Source mẫu', { exact: true }),
    ).toHaveAttribute('data-file', 'App.tsx')
    await expect(page.locator('[data-explained="true"]').first()).toBeVisible()
    await page.getByRole('tab', { name: 'Tổng thể', exact: true }).click()
    expect(await viewport.getAttribute('style')).toBe(transform)
    await expect(
      inspector.getByRole('button', { name: 'api', exact: true }),
    ).toHaveAttribute('aria-expanded', 'false')
    await expect(
      inspector.getByRole('heading', {
        name: 'Điểm vào & điều hướng',
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      frame.getByLabel('Tên khách hàng', { exact: false }),
    ).toHaveValue('Giữ nguyên khi chuyển tab')
    expect(
      await frame.locator('body').evaluate(() => performance.timeOrigin),
    ).toBe(origin)
    await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
    await page.screenshot({ path: `test-results/overview-${width}.png` })
  })
}

test('tạo / nối / sửa: trước sau, diff, số dòng và checkpoint đồng bộ', async ({
  page,
}) => {
  await page.goto('/#step=3&sub=1&tab=source')
  const panel = page.getByLabel('Source mẫu', { exact: true })
  await expect(panel).toHaveAttribute('data-file', 'components/PremiumSummary.tsx')
  await panel.getByRole('button', { name: 'Trước', exact: true }).click()
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '05-rules',
  )
  await expect(panel).toContainText('File chưa hình thành')
  await panel.getByRole('button', { name: 'Diff', exact: true }).click()
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '03-summary',
  )
  await expect(panel.locator('[data-new-line="1"]')).toBeVisible()
  await expect(page.getByTestId('preview-side')).toContainText('Sau')
  await page.getByLabel('Thao tác trong bước', { exact: true }).getByRole('button', { name: /Nối presentation phí/ }).click()
  await expect(panel).toHaveAttribute(
    'data-file',
    'components/PremiumSummary.tsx',
  )
  await page.getByLabel('Checkpoint mẫu', { exact: true }).selectOption('03')
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '03',
  )
  await expect(
    page
      .frameLocator('iframe[title="Preview mẫu checkpoint 03"]')
      .getByLabel('Tên khách hàng', { exact: false }),
  ).toBeVisible()
  await page
    .getByLabel('Checkpoint mẫu', { exact: true })
    .selectOption('04-rules')
  await expect(panel).toHaveAttribute('data-file', 'quotation/rules.ts')
  const raw = (
    await readFile('checkpoints/04-rules/quotation/rules.ts', 'utf8')
  ).split(/\r?\n/)
  const rows = panel.locator('[data-line]')
  await expect(rows.first()).toBeVisible()
  const first = Number(await rows.first().getAttribute('data-line'))
  expect(first).toBe(1)
  for (const row of await rows.all()) {
    const line = Number(await row.getAttribute('data-line'))
    expect(await row.getByTestId('source-line').textContent()).toBe(
      raw[line - 1],
    )
  }
  await expect(panel.locator('[data-line="1"]')).toBeVisible()
  const scrollBefore = await page
    .locator('[class*="buildSession"]')
    .evaluate((el) => el.scrollTop)
  await panel
    .getByRole('button', { name: 'Đến đoạn liên quan', exact: true })
    .click()
  expect(
    await page
      .locator('[class*="buildSession"]')
      .evaluate((el) => el.scrollTop),
  ).toBe(scrollBefore)
  expect(
    await panel.getByTestId('code-scroll').evaluate((el) => el.scrollTop),
  ).toBeGreaterThan(0)
  await panel.getByRole('button', { name: 'Diff', exact: true }).click()
  const old = (
    await readFile('checkpoints/03/quotation/rules.ts', 'utf8')
  ).split(/\r?\n/)
  for (const row of await panel
    .locator('[data-old-line], [data-new-line]')
    .all()) {
    const oldLine = Number(await row.getAttribute('data-old-line'))
    const newLine = Number(await row.getAttribute('data-new-line'))
    const text = await row.getByTestId('source-line').textContent()
    if (oldLine) expect(text).toBe(old[oldLine - 1])
    if (newLine) expect(text).toBe(raw[newLine - 1])
  }
  await page.screenshot({ path: 'test-results/build-diff.png' })
})

test('symbol tương lai không fallback; URL cũ và Back/Forward giữ đúng mốc', async ({
  page,
}) => {
  await page.goto(
    '/#step=5&sub=1&tab=source&file=quotation%2Frules.ts&symbol=pricingInputsChanged',
  )
  const panel = page.getByLabel('Source mẫu', { exact: true })
  await expect(panel).toContainText('Chưa hình thành ở checkpoint này: pricingInputsChanged')
  await expect(panel.locator('[data-explained="true"]')).toHaveCount(0)
  expect(
    await page
      .getByLabel('Symbol', { exact: true })
      .locator('option')
      .allTextContents(),
  ).not.toContain('pricingInputsChanged')
  await expect(panel.locator('[data-line="1"]')).toBeVisible()
  await panel
    .getByRole('button', { name: 'Đến mốc 06-rules', exact: true })
    .click()
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '06-rules',
  )
  await expect(page.getByLabel('Symbol', { exact: true })).toHaveValue(
    'pricingInputsChanged',
  )
  await page.goBack()
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '05',
  )
  await expect(panel).toContainText('Chưa hình thành ở checkpoint này: pricingInputsChanged')
  await page.goForward()
  await expect(page.getByLabel('Checkpoint mẫu', { exact: true })).toHaveValue(
    '06-rules',
  )
})

test('tiến độ cũ, gợi ý, lời giải và bài thực hành độc lập', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('quotation-workshop.guide.v1'))
      localStorage.setItem(
        'quotation-workshop.guide.v1',
        JSON.stringify({
          version: 1,
          started: true,
          current: 3,
          visited: [0, 3],
          checked: [0],
          notes: { 3: 'Ghi chú đã có' },
        }),
      )
  })
  await page.goto('/#step=3&sub=2&tab=execute')
  const legacy = await page.evaluate(() => localStorage.getItem('quotation-workshop.guide.v1'))
  await page.getByText('Tiến độ hành trình cũ', { exact: true }).click()
  await expect(page.getByText(/Ghi chú đã có/)).toBeVisible()
  await page.getByRole('button', {name:'Chạy thử',exact:true}).click()
  await expect(
    page.getByRole('tab', { name: 'Xây từng bước', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await page
    .getByText('Giải thích, ghi chú & phạm vi kiểm tra', { exact: true })
    .click()
  await expect(page.locator('#reflection')).toHaveValue('')
  await page.locator('#reflection').fill('Ghi chú hành vi mới')
  await page.getByRole('button', { name: 'Gợi ý cấp 1', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý cấp 2', exact: true }).click()
  await page.getByRole('button', { name: 'Lời giải', exact: true }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
  await expect(page.getByRole('progressbar')).toHaveAttribute('max', '6')
  await page
    .getByRole('button', { name: 'Thử bài tôi đang làm', exact: true })
    .click()
  const mine = page.frameLocator('iframe[title="Bài tôi đang làm · HMR"]')
  await expect(mine.getByTestId('starter-empty')).toBeVisible()
  const origin = await mine
    .locator('body')
    .evaluate(() => performance.timeOrigin)
  await page.getByRole('tab', { name: 'Tổng thể', exact: true }).click()
  await page.getByRole('tab', { name: 'Xây từng bước', exact: true }).click()
  expect(
    await mine.locator('body').evaluate(() => performance.timeOrigin),
  ).toBe(origin)
  await page.getByRole('button', {name:'Chạy thử',exact:true}).click()
  await page
    .getByRole('button', { name: 'Tự xác nhận cả bước', exact: true })
    .click()
  await page.reload()
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '1')
  await page.getByRole('button', {name:'Chạy thử',exact:true}).click()
  await page
    .getByText('Giải thích, ghi chú & phạm vi kiểm tra', { exact: true })
    .click()
  await expect(page.locator('#reflection')).toHaveValue('Ghi chú hành vi mới')
  const stored = await page.evaluate(() => ({
    legacy: localStorage.getItem('quotation-workshop.guide.v1'),
    current: JSON.parse(localStorage.getItem('quotation-workshop.behaviors.v2')!),
  }))
  expect(stored.legacy).toBe(legacy)
  expect(stored.current.version).toBe(2)
  expect(stored.current.checked).toHaveLength(1)
  expect(stored.current.current).toBeLessThanOrEqual(6)
  await page.getByRole('button', {name:'Đóng panel nhiệm vụ',exact:true}).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: /Làm lại tiến độ/ }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
  expect(await page.evaluate(() => localStorage.getItem('quotation-workshop.guide.v1'))).toBe(legacy)
})

test('màn hình nhỏ: drawer, source và preview không tràn ngang', async ({
  page,
}) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/#step=6&sub=1&tab=overview')
    await page.getByRole('tab', { name: 'Hướng dẫn', exact: true }).click()
    await page.getByRole('button', { name: 'Chi tiết', exact: true }).click()
    await expect(page.getByTestId('inspector')).toBeVisible()
    await page
      .getByRole('button', { name: 'Đóng chi tiết', exact: true })
      .click()
    await expect(page.getByTestId('inspector')).not.toBeVisible()
    await page.getByRole('tab', { name: 'Xây từng bước', exact: true }).click()
    await expect(page.getByLabel('Source mẫu', { exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await page.screenshot({
      path: `test-results/mobile-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('tab', { name: 'Preview', exact: true }).click()
    await expect(
      page
        .frameLocator('iframe[title="Preview mẫu checkpoint 06"]')
        .getByLabel('Tên khách hàng', { exact: false }),
    ).toBeVisible()
  }
})
