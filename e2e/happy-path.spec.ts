import { expect, test } from '@playwright/test'

test('full interaction chain: navigate → jumper → operation → try-it', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle(/VitePress OpenAPI Docs/)

  // Navigate to a live demo page
  await page.goto('api/mock/', { waitUntil: 'networkidle' })
  await expect(page.locator('.vod-spec')).toBeVisible()

  // Open Cmd+K jumper
  await page.keyboard.press('Meta+K')
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  await expect(dialog).toBeVisible({ timeout: 5000 })

  // Type a query and verify results appear
  const jumperInput = dialog.locator('input[type="search"]')
  await jumperInput.fill('listUsers')
  const results = dialog.locator('[role="option"]')
  await expect(results.first()).toBeVisible({ timeout: 3000 })

  // Choose the first result
  await results.first().click()

  // Should land on the operation page
  await expect(page.locator('.vod-endpoint')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.vod-endpoint__path')).toBeVisible()

  // Verify SDK snippets are rendered
  await expect(page.locator('.vod-snippets')).toBeVisible()

  // Verify the try-it panel (Playground) is rendered
  const playground = page.locator('.vap-playground')
  await expect(playground).toBeVisible()

  // Submit a request via the try-it panel
  const sendButton = playground.locator('button:has-text("Send")')
  if (await sendButton.isVisible()) {
    await sendButton.click()

    // Wait for a response to appear (any response panel or status indicator)
    const response = playground.locator('.vap-response')
    await expect(response).toBeVisible({ timeout: 15000 })
  }
})

test('schema page renders property table', async ({ page }) => {
  await page.goto('schemas/mock/User', { waitUntil: 'networkidle' })
  const schema = page.locator('.vod-schema')
  await expect(schema).toBeVisible({ timeout: 5000 })
})

test('changelog page renders', async ({ page }) => {
  await page.goto('changelog/mock', { waitUntil: 'networkidle' })
  const changelog = page.locator('.vod-changelog')
  await expect(changelog).toBeVisible({ timeout: 5000 })
})

test('auth controls persist across navigation', async ({ page }) => {
  // Go to an operation page
  await page.goto('api/mock/listUsers', { waitUntil: 'networkidle' })
  const authInput = page.locator('.vod-auth__input')
  if (await authInput.isVisible()) {
    // Enter a credential
    await authInput.fill('test-token-123')
    await authInput.blur()

    // Navigate away and back
    await page.goto('api/mock/', { waitUntil: 'networkidle' })
    await page.goto('api/mock/listUsers', { waitUntil: 'networkidle' })

    // Credential should be restored
    const restoredInput = page.locator('.vod-auth__input')
    if (await restoredInput.isVisible()) {
      await expect(restoredInput).toHaveValue('test-token-123')
    }
  }
})
