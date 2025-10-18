/**
 * E2E tests for LLM Analysis flow
 * Tests the complete user journey with and without API key
 */

import { test, expect } from '@playwright/test'

test.describe('LLM Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('should complete discovery flow without API key using keyword extraction', async ({ page }) => {
    // Wait for app to load
    await expect(page.locator('.typeform-image-pair')).toBeVisible({ timeout: 10000 })

    // Make a choice
    await page.locator('[data-choice="A"]').click()

    // Wait for explanation form
    await expect(page.locator('#explanation')).toBeVisible()

    // Enter explanation
    await page.locator('#explanation').fill('I love the bright modern colors and open space')

    // Submit explanation
    await page.locator('#submit-explanation').click()

    // Should show "Analyzing..." briefly
    await expect(page.locator('#submit-explanation')).toHaveText(/Analyzing\.\.\./, { timeout: 2000 })

    // Should proceed to next round (keyword extraction is fast)
    await expect(page.locator('.round-number')).toContainText('Round 2', { timeout: 5000 })
  })

  test('should open settings modal and allow API key input', async ({ page }) => {
    // Wait for app to load
    await expect(page.locator('.settings-btn')).toBeVisible({ timeout: 10000 })

    // Click settings button
    await page.locator('.settings-btn').click()

    // Settings modal should appear
    await expect(page.locator('.settings-modal')).toBeVisible()
    await expect(page.locator('.settings-modal-header h2')).toContainText('Settings')

    // Should have API key input
    await expect(page.locator('#api-key-input')).toBeVisible()

    // Enter mock API key
    const mockApiKey = 'sk-ant-test-key-12345'
    await page.locator('#api-key-input').fill(mockApiKey)

    // Click save button
    await page.locator('#save-api-key').click()

    // Should show success message
    await expect(page.locator('.settings-status')).toContainText('API key saved successfully')

    // Verify API key is stored in localStorage
    const storedKey = await page.evaluate(() => {
      return localStorage.getItem('interior-designer-claude-api-key')
    })
    expect(storedKey).toBe(mockApiKey)

    // Modal should close automatically
    await expect(page.locator('.settings-modal')).not.toBeVisible({ timeout: 3000 })
  })

  test('should reject invalid API key format', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open settings
    await page.locator('.settings-btn').click()
    await expect(page.locator('.settings-modal')).toBeVisible()

    // Enter invalid API key (doesn't start with sk-ant-)
    await page.locator('#api-key-input').fill('invalid-api-key')

    // Try to save
    await page.locator('#save-api-key').click()

    // Should show error
    await expect(page.locator('#api-key-error')).toBeVisible()
    await expect(page.locator('#api-key-error')).toContainText('Invalid API key format')

    // Modal should stay open
    await expect(page.locator('.settings-modal')).toBeVisible()
  })

  test('should remove API key from localStorage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Set API key in localStorage
    await page.evaluate(() => {
      localStorage.setItem('interior-designer-claude-api-key', 'sk-ant-test-key-12345')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Open settings
    await page.locator('.settings-btn').click()
    await expect(page.locator('.settings-modal')).toBeVisible()

    // Should show "Update" button since key exists
    await expect(page.locator('#save-api-key')).toContainText('Update')

    // Should have remove button
    await expect(page.locator('#remove-api-key')).toBeVisible()

    // Click remove
    await page.locator('#remove-api-key').click()

    // Should show success message
    await expect(page.locator('.settings-status')).toContainText('API key removed')

    // Verify API key is removed from localStorage
    const storedKey = await page.evaluate(() => {
      return localStorage.getItem('interior-designer-claude-api-key')
    })
    expect(storedKey).toBeNull()
  })

  test('should close settings modal with Escape key', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open settings
    await page.locator('.settings-btn').click()
    await expect(page.locator('.settings-modal')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.locator('.settings-modal')).not.toBeVisible()
  })

  test('should close settings modal by clicking outside', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open settings
    await page.locator('.settings-btn').click()
    await expect(page.locator('.settings-modal')).toBeVisible()

    // Click on modal overlay (outside content)
    await page.locator('.settings-modal').click({ position: { x: 10, y: 10 } })

    // Modal should close
    await expect(page.locator('.settings-modal')).not.toBeVisible()
  })

  test('should use keyboard to access settings button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Tab to settings button (may need multiple tabs depending on page structure)
    await page.keyboard.press('Tab')

    // Check if settings button is focused
    const settingsBtn = page.locator('.settings-btn')
    await expect(settingsBtn).toBeFocused()

    // Press Enter to open settings
    await page.keyboard.press('Enter')

    // Settings modal should open
    await expect(page.locator('.settings-modal')).toBeVisible()
  })

  test('should show analysis source in session data', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for images to load
    await expect(page.locator('.typeform-image-pair')).toBeVisible({ timeout: 10000 })

    // Make a choice
    await page.locator('[data-choice="A"]').click()

    // Enter explanation
    await page.locator('#explanation').fill('I love the bright modern colors')
    await page.locator('#submit-explanation').click()

    // Wait for processing
    await page.waitForTimeout(1000)

    // Check session data in localStorage
    const sessionData = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interior-designer-session'))
      return session?.choices?.[0]
    })

    // Should have analysisSource field
    expect(sessionData).toBeTruthy()
    expect(sessionData.analysisSource).toBe('keyword_extraction')
    expect(sessionData.keywords).toBeTruthy()
    expect(Array.isArray(sessionData.keywords)).toBe(true)
  })

  test('should handle complete discovery flow with settings button visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Settings button should be visible on discovery phase
    await expect(page.locator('.settings-btn')).toBeVisible()

    // Complete multiple rounds
    for (let i = 0; i < 3; i++) {
      // Wait for images
      await expect(page.locator('.typeform-image-pair')).toBeVisible({ timeout: 10000 })

      // Settings button should remain visible
      await expect(page.locator('.settings-btn')).toBeVisible()

      // Make choice
      await page.locator('[data-choice="A"]').click()

      // Enter explanation
      await page.locator('#explanation').fill('I like the colors and the style here')
      await page.locator('#submit-explanation').click()

      // Wait for next round
      await page.waitForTimeout(1000)
    }

    // Settings button should still be visible after multiple rounds
    await expect(page.locator('.settings-btn')).toBeVisible()
  })
})
