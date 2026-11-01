import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const journey = (page: Page) =>
  page.getByRole('dialog', { name: 'Hành trình cả bước', exact: true })
const workspace = (page: Page) => page.locator('[data-workspace="shared"]')
async function begin(page: Page) {
  await expect(journey(page)).toBeVisible({ timeout: 30000 })
  await journey(page).getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click()
  await page.getByLabel('Tốc độ trình diễn', { exact: true }).selectOption('2')
}

test('switching from a retry-capable step keeps the next whole-step runnable', async ({ page }) => {
  await page.goto('/#journey=2&step=5&sub=0&tab=build')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Chạy thử và tự kiểm tra', exact: true })
  await drawer.getByLabel('Phạm vi chạy thử', { exact: true }).selectOption('step')
  await drawer.getByLabel('Hành trình cả bước', { exact: true }).selectOption('retry')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Giữ tính nhất quán khi sửa/ }).click()
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await drawer.getByLabel('Phạm vi chạy thử', { exact: true }).selectOption('step')
  await expect(drawer).toContainText('Checkpoint sẽ chạy: 06')
  await expect(drawer.getByRole('button', { name: 'Xem chạy mẫu', exact: true })).toBeEnabled()
})

test('whole-step queues one permitted action until iframe readiness', async ({ page }) => {
  test.setTimeout(90000)
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/checkpoints/05/index.html?workshopRun=*', async (route) => {
    await gate
    await route.continue()
  })
  try {
    await page.goto('/?run=step&runScope=step#journey=2&step=3&sub=0')
    await begin(page)
    await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
    await page.getByRole('button', { name: 'Tiếp bước', exact: true }).click()
    release()
    const frame = page.frameLocator('iframe[title="Phiên chạy mẫu 05"]')
    await expect(frame.locator('#customerName-error')).toBeVisible({ timeout: 30000 })
    await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
    await expect(workspace(page)).toHaveAttribute('data-run-status', 'paused')
    await expect(frame.locator('#customerName')).toHaveValue('')
  } finally {
    release()
  }
})

test('stage 1 whole-step guided pricing: invalid → fix → real calculated result', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.goto('/?run=step&runScope=step&runMode=guided#journey=2&step=3&sub=2')
  await begin(page)
  const frame = page.frameLocator('iframe[title="Phiên chạy mẫu 05"]')
  await expect(workspace(page)).toHaveAttribute('data-run-step', '0')
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
  await expect(frame.locator('#customerName-error')).toBeVisible()
  await frame.getByRole('button', { name: 'Điền dữ liệu mẫu', exact: false }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-step', '2')
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-status', 'done')
  await expect(frame.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
  await expect(journey(page)).toContainText('1.100.000')
  await journey(page).getByRole('button', { name: 'Tự thử lại từ đầu', exact: true }).click()
  await expect(journey(page)).toContainText('Dữ liệu khởi đầu')
  await expect(page.locator('iframe[title="Phiên chạy mẫu 05"]').locator('..')).toContainText(
    'Tự thao tác',
  )
})

for (const sub of [0, 2, 4])
  test(`stage 1 pricing scope from sub-step ${sub}`, async ({ page }) => {
    await page.goto(`/#journey=2&step=3&sub=${sub}&tab=build`)
    await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Chạy thử và tự kiểm tra', exact: true })
    await drawer.getByLabel('Phạm vi chạy thử', { exact: true }).selectOption('step')
    await expect(drawer).toContainText('Checkpoint sẽ chạy: 05')
    await drawer.getByRole('button', { name: 'Xem chạy mẫu', exact: true }).click()
    await expect(journey(page)).toContainText('Checkpoint đầu ra: 05')
    await begin(page)
    await page.getByRole('button', { name: 'Thoát phiên chạy', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Chạy thử', exact: true })).toBeVisible()
  })

for (const checkpoint of ['s2-r4-contract', 's2-r4-cards', 's2-r4-entry'])
  test(`scope from ${checkpoint} always runs catalog output`, async ({ page }) => {
    test.setTimeout(90000)
    await page.goto(`/?stage=2&version=4#checkpoint=${checkpoint}`)
    await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Chạy thử và tự kiểm tra', exact: true })
    await drawer.getByLabel('Phạm vi chạy thử', { exact: true }).selectOption('step')
    await expect(drawer).toContainText('Checkpoint sẽ chạy: s2-r4-entry')
    await drawer.getByRole('button', { name: 'Xem chạy mẫu', exact: true }).click()
    await expect(journey(page)).toContainText('s2-r4-entry')
    await begin(page)
    await expect(workspace(page)).toHaveAttribute('data-run-status', 'done', { timeout: 60000 })
    const frame = page.frameLocator('iframe[title="Phiên chạy mẫu s2-r4-entry"]')
    await expect(frame.locator('#product-info')).toHaveAttribute(
      'data-product',
      'EXTENDED_PROPERTY',
    )
    await expect(frame.getByRole('button', { name: 'Đổi sản phẩm', exact: true })).toHaveCount(0)
    await expect(journey(page)).toContainText('Kết quả quan sát được')
    await journey(page).getByRole('button', { name: 'Quay về bài học', exact: true }).click()
    await expect(page.getByLabel('Source mẫu', { exact: true })).toHaveAttribute(
      'data-checkpoint',
      checkpoint,
    )
  })

const runs: Array<[number, number, string, string, string?]> = [
  [1, 1, '03-fields', '#journey=2&step=1&sub=0'],
  [1, 2, '03', '#journey=2&step=2&sub=0'],
  [1, 3, '05', '#journey=2&step=3&sub=0'],
  [1, 4, '06', '#journey=2&step=4&sub=0'],
  [1, 5, '09', '#journey=2&step=5&sub=0'],
  [1, 5, '09', '#journey=2&step=5&sub=0', 'retry'],
  [1, 6, '12', '#journey=2&step=6&sub=0'],
  [2, 0, 's2-r4-00', '#checkpoint=s2-r4-00'],
  [2, 2, 's2-r4-panel', '#checkpoint=s2-r4-panel-open'],
  [2, 3, 's2-r4-summary', '#checkpoint=s2-r4-rule-source'],
  [2, 4, 's2-r4-complete', '#checkpoint=s2-r4-record'],
  [2, 4, 's2-r4-complete', '#checkpoint=s2-r4-record', 'retry'],
  [2, 4, 's2-r4-complete', '#checkpoint=s2-r4-record', 'legacy'],
]
for (const [stage, step, cp, hash, variant = 'success'] of runs)
  test(`demo journey ${stage}/${step}/${variant} at ${cp}`, async ({ page }) => {
    test.setTimeout(150000)
    await page.goto(
      `/?${stage === 2 ? 'stage=2&version=4&' : ''}run=step&runScope=step&runVariant=${variant}&runMode=demo${hash}`,
    )
    await begin(page)
    const frame = page.frameLocator(`iframe[title="Phiên chạy mẫu ${cp}"]`)
    if (variant === 'retry') {
      await expect(frame.locator('form [role="alert"]')).toContainText('lưu', { timeout: 60000 })
      await expect(workspace(page)).toHaveAttribute('data-run-status', 'waiting')
      await frame.getByRole('button', { name: 'Lưu bản chào', exact: true }).click()
    }
    await expect(workspace(page)).toHaveAttribute('data-run-status', /done|failed/, {
      timeout: 100000,
    })
    await expect(workspace(page)).toHaveAttribute('data-run-status', 'done')
    await expect(journey(page)).toContainText('Kết quả quan sát được')
  })

test('guided catalog: construction peek preserves iframe, source revisions, progress and position', async ({
  page,
}) => {
  test.setTimeout(120000)
  let posts = 0
  page.on('request', (r) => {
    if (r.method() === 'POST') posts++
  })
  await page.goto(
    '/?stage=2&version=4&run=step&runScope=step&runMode=guided#checkpoint=s2-r4-contract',
  )
  const progress = await page.evaluate(() =>
    localStorage.getItem('quotation-workshop.stage2.progress.v4'),
  )
  await begin(page)
  await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
  const frame = page.frameLocator('iframe[title="Phiên chạy mẫu s2-r4-entry"]')
  const time = await frame.locator('body').evaluate(() => performance.timeOrigin)
  await page.getByRole('button', { name: 'Hành trình cả bước', exact: true }).click()
  await journey(page).getByRole('button', { name: 'Xem cách xây:', exact: false }).first().click()
  const peek = page.getByLabel('Xem cách xây', { exact: true })
  await expect(peek).toHaveAttribute('data-checkpoint', 's2-r4-contract')
  await expect(peek).toContainText('checkpoint phiên s2-r4-entry')
  await expect(
    page.getByLabel('Source cách xây', { exact: true }).locator('[data-explained="true"]').first(),
  ).toBeVisible()
  await peek.getByRole('button', { name: 'Diff', exact: true }).click()
  await peek.getByLabel('File cách xây', { exact: true }).selectOption('quotation/products.ts')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Hướng dẫn', exact: true }).click()
  await expect(
    peek.getByRole('button', { name: 'Trở lại phiên chạy cả bước', exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: '.verification/step-run-mobile-peek.png' })
  await peek.getByRole('button', { name: 'Trở lại phiên chạy cả bước', exact: true }).click()
  await page.setViewportSize({ width: 1440, height: 900 })
  expect(await frame.locator('body').evaluate(() => performance.timeOrigin)).toBe(time)
  await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
  expect(posts).toBe(0)
  await page.getByRole('button', { name: 'Chạy', exact: true }).click()
  await frame.getByRole('link', { name: 'Tạo bản chào Tài sản cơ bản', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-step', '2')
  await frame.getByRole('link', { name: 'Danh sách bản chào', exact: true }).click()
  await frame.getByRole('link', { name: 'Tạo bản chào', exact: true }).first().click()
  await expect(workspace(page)).toHaveAttribute('data-run-step', '3')
  await frame.getByRole('link', { name: 'Tạo bản chào Tài sản mở rộng', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-status', 'done')
  await journey(page).getByRole('button', { name: 'Đóng hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Lịch sử quan sát', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Lịch sử quan sát phiên chạy', exact: true })
    .locator('li button')
    .first()
    .click()
  await page.getByRole('tab', { name: 'Flow', exact: true }).click()
  expect(await frame.locator('body').evaluate(() => performance.timeOrigin)).toBe(time)
  expect(posts).toBe(0)
  await page.getByRole('button', { name: 'Thoát phiên chạy', exact: true }).click()
  expect(
    await page.evaluate(() => localStorage.getItem('quotation-workshop.stage2.progress.v4')),
  ).toBe(progress)
})

test('whole-step retry: reading construction/history never repeats POST, restart aborts queued actions', async ({
  page,
}) => {
  test.setTimeout(120000)
  const sent = new Map<string, number>()
  page.on('request', (request) => {
    const id = new URL(request.url()).pathname.match(/\/run\/([^/]+)\//)?.[1]
    if (id && request.method() === 'POST') sent.set(id, (sent.get(id) ?? 0) + 1)
  })
  await page.goto(
    '/?stage=2&version=4&run=step&runScope=step&runVariant=retry#checkpoint=s2-r4-record',
  )
  await begin(page)
  const frame = page.frameLocator('iframe[title="Phiên chạy mẫu s2-r4-complete"]')
  const posts = async () =>
    sent.get((await workspace(page).getAttribute('data-run-session')) ?? '') ?? 0
  await expect(frame.locator('form [role="alert"]')).toBeVisible({ timeout: 60000 })
  await expect(workspace(page)).toHaveAttribute('data-run-status', 'waiting')
  expect(await posts()).toBe(1)
  const time = await frame.locator('body').evaluate(() => performance.timeOrigin)
  await page.getByRole('button', { name: 'Hành trình cả bước', exact: true }).click()
  await journey(page)
    .locator('li')
    .last()
    .getByRole('button', { name: 'Xem cách xây:', exact: false })
    .first()
    .click()
  await expect(page.getByLabel('Xem cách xây', { exact: true })).toHaveAttribute(
    'data-checkpoint',
    's2-r4-record',
  )
  await expect(page.getByLabel('Source cách xây', { exact: true })).toHaveAttribute(
    'data-file',
    'quotation/types.ts',
  )
  await page.getByLabel('File cách xây', { exact: true }).selectOption('quotation/records.ts')
  await page.getByRole('button', { name: 'Trở lại phiên chạy cả bước', exact: true }).click()
  await page.getByRole('button', { name: 'Lịch sử quan sát', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Lịch sử quan sát phiên chạy', exact: true })
    .locator('li button')
    .first()
    .click()
  expect(await posts()).toBe(1)
  expect(await frame.locator('body').evaluate(() => performance.timeOrigin)).toBe(time)
  await page.getByRole('button', { name: 'Chạy', exact: true }).click()
  await frame.getByRole('button', { name: 'Lưu bản chào', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-status', 'done', { timeout: 40000 })
  expect(await posts()).toBe(2)
  await journey(page).getByRole('button', { name: 'Đóng hành trình', exact: true }).click()
  const previous = await workspace(page).getAttribute('data-run-session')
  await page.getByRole('button', { name: 'Chạy lại phiên', exact: true }).click()
  await expect(workspace(page)).not.toHaveAttribute('data-run-session', previous!)
  await expect(journey(page)).toBeVisible()
  // Intro gates the new namespace before any action; the old session cannot emit more.
  await journey(page).getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
  await expect(workspace(page)).toHaveAttribute('data-run-status', 'paused')
  expect(await posts()).toBe(0)
  await page.getByRole('button', { name: 'Thoát phiên chạy', exact: true }).click()
  await expect(page.getByLabel('Source mẫu', { exact: true })).toHaveAttribute(
    'data-checkpoint',
    's2-r4-record',
  )
})

for (const width of [1440, 390])
  test(`whole-step intro/flow/source at ${width}`, async ({ page }) => {
    test.setTimeout(60000)
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 })
    await page.goto(
      '/?stage=2&version=4&run=step&runScope=step&runMode=guided#checkpoint=s2-r4-contract',
    )
    await begin(page)
    await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
    if (width === 390) await page.getByRole('tab', { name: 'Hướng dẫn', exact: true }).click()
    await page.getByRole('button', { name: 'Hành trình cả bước', exact: true }).click()
    await journey(page)
      .getByRole('button', { name: 'Xem flow · product · s2-r4-entry', exact: true })
      .first()
      .click()
    await expect(page.getByLabel('Flow của phiên chạy', { exact: true })).toBeVisible()
    await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `.verification/step-run-${width}.png` })
    await page.getByRole('button', { name: 'Thoát phiên chạy', exact: true }).click()
  })

test('whole-step restores collapsed preview, code scroll and independent review draft', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.goto('/#journey=2&step=3&sub=4&tab=build')
  const review = page.frameLocator('iframe[title="Preview mẫu checkpoint 05"]')
  await review.locator('#customerName').fill('Review giữ nguyên')
  const time = await review.locator('body').evaluate(() => performance.timeOrigin)
  const scroll = page.getByLabel('Source mẫu', { exact: true }).getByTestId('code-scroll')
  await scroll.evaluate((e) => {
    e.scrollTop = 250
  })
  await page.getByLabel('Chế độ làm việc', { exact: true }).selectOption('code')
  const position = await scroll.evaluate(
    (e) =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(e.scrollTop))),
      ),
  )
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Chạy thử và tự kiểm tra', exact: true })
  await drawer.getByLabel('Phạm vi chạy thử', { exact: true }).selectOption('step')
  await drawer.getByRole('button', { name: 'Tự thao tác có hướng dẫn', exact: true }).click()
  await begin(page)
  await expect(page.getByLabel('Chế độ làm việc', { exact: true })).toHaveValue('compare')
  await page.getByLabel('Chế độ làm việc', { exact: true }).selectOption('preview')
  await page.getByRole('button', { name: 'Thoát phiên chạy', exact: true }).click()
  await expect(page.getByLabel('Chế độ làm việc', { exact: true })).toHaveValue('code')
  expect(await review.locator('body').evaluate(() => performance.timeOrigin)).toBe(time)
  await expect(review.locator('#customerName')).toHaveValue('Review giữ nguyên')
  expect(await scroll.evaluate((e) => e.scrollTop)).toBe(position)
})

test('whole-step actual Chrome zoom 125% preserves controls and checkpoint', async ({
  playwright,
}) => {
  test.setTimeout(90000)
  const context = await playwright.chromium.launchPersistentContext(
    '.verification/step-zoom-' + Date.now(),
    { channel: 'chrome', headless: true, viewport: { width: 1440, height: 900 } },
  )
  try {
    const settings = await context.newPage()
    await settings.goto('chrome://settings/appearance')
    await settings.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const chrome = (
            window as unknown as {
              chrome: {
                settingsPrivate: { setDefaultZoom: (factor: number, callback: () => void) => void }
              }
            }
          ).chrome
          chrome.settingsPrivate.setDefaultZoom(1.25, resolve)
        }),
    )
    const page = await context.newPage()
    await page.goto(
      'http://localhost:3181/?stage=2&version=4&run=step&runScope=step&runMode=guided#checkpoint=s2-r4-contract',
    )
    await begin(page)
    await expect(workspace(page)).toHaveAttribute('data-run-step', '1')
    if (await page.getByRole('tab', { name: 'Hướng dẫn', exact: true }).isVisible())
      await page.getByRole('tab', { name: 'Hướng dẫn', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Hành trình cả bước', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Thoát phiên chạy', exact: true })).toBeVisible()
    expect(await page.evaluate(() => devicePixelRatio)).toBe(1.25)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1)
    await page.screenshot({ path: '.verification/step-run-zoom125.png' })
  } finally {
    await context.close()
  }
})
