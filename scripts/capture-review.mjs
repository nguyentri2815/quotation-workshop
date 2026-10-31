import { mkdir } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

// Read-only visual review in a fresh browser context; no learner profile.
await mkdir('.verification/review-screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const base = process.env.WORKSHOP_URL || 'http://localhost:3181'
  await page.goto(base + '/#step=11&tab=build&file=pages/CreateQuotation.tsx&section=save')
  await page.getByRole('button', { name: 'Bên trong file', exact: true }).click()
  const inside = page.getByRole('complementary', { name: 'Bên trong file' })
  await expect(inside.locator('[data-section="save"]')).toHaveAttribute('data-active', 'true')
  await inside.evaluate(el => {
    const target = el.querySelector('[data-section="save"]')
    if (target) el.scrollTop += target.getBoundingClientRect().top - el.getBoundingClientRect().top - 42
  })
  await page.screenshot({ path: '.verification/review-screenshots/inside-file-wide.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(base + '/#step=11&tab=build&file=pages/CreateQuotation.tsx&section=dialog')
  await expect(page.getByLabel('Source mẫu', { exact: true }).locator('[data-explained="true"]').first()).toBeVisible()
  await page.screenshot({ path: '.verification/review-screenshots/inside-file-mobile.png', fullPage: true })
  console.log('Saved wide/mobile review screenshots in .verification/review-screenshots')
} finally { await browser.close() }
