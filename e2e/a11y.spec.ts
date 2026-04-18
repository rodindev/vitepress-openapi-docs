import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * vitepress-openapi-docs components only — we can't vouch for VitePress's
 * default theme (which has its own known axe findings around the sidebar
 * caret and search input). Each target specifies the root selector(s) of
 * our generated DOM on that page.
 */
const TARGETS = [
  {
    name: 'endpoint page',
    path: 'api/mock/listUsers',
    selectors: ['.vod-endpoint', '.vod-snippets', '.vod-auth'],
  },
  {
    name: 'schema page',
    path: 'schemas/mock/User',
    selectors: ['.vod-schema'],
  },
  {
    name: 'changelog page',
    path: 'changelog/mock',
    selectors: ['.vod-changelog'],
  },
  {
    name: 'mock landing (full spec render)',
    path: 'api/mock/',
    selectors: ['.vod-spec'],
  },
]

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

for (const target of TARGETS) {
  test(`${target.name} — no critical or serious axe violations`, async ({ page }) => {
    await page.goto(target.path, { waitUntil: 'networkidle' })

    let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
    for (const selector of target.selectors) {
      builder = builder.include(selector)
    }
    const results = await builder.analyze()

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    if (blocking.length > 0) {
      console.error(
        blocking
          .map(
            (v) => `${v.id} [${v.impact}] ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`
          )
          .join('\n---\n')
      )
    }
    expect(blocking, `${blocking.length} critical/serious violation(s) in vod components`).toEqual(
      []
    )
  })
}

test('Cmd+K operation jumper dialog is accessible', async ({ page }) => {
  await page.goto('api/mock/', { waitUntil: 'networkidle' })
  await page.keyboard.press('Meta+K')
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 })

  const results = await new AxeBuilder({ page })
    .include('[role="dialog"][aria-modal="true"]')
    .withTags(WCAG_TAGS)
    .analyze()
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )
  if (blocking.length > 0) {
    console.error(
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`).join('\n')
    )
  }
  expect(blocking, `${blocking.length} critical/serious violation(s) in operation jumper`).toEqual(
    []
  )
})
