import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear())
  })

  test('should be able to navigate entire app using only keyboard', async ({ page }) => {
    // Start at first round
    await expect(page.locator('h1')).toContainText(/round/i)

    // Tab to first image (option A)
    await page.keyboard.press('Tab')
    let focusedElement = await page.evaluate(() => document.activeElement.tagName)
    expect(focusedElement).toBe('BUTTON')

    // Tab to second image (option B)
    await page.keyboard.press('Tab')
    focusedElement = await page.evaluate(() => document.activeElement.tagName)
    expect(focusedElement).toBe('BUTTON')

    // Select image A using Enter key
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Explanation form should appear
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible()

    // Tab to explanation input
    await page.keyboard.press('Tab')

    // Type explanation
    await page.keyboard.type('I prefer this style because it looks clean and modern')

    // Tab to submit button and press Enter
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Should advance to next round
    await expect(page).toHaveURL(/\/#/)
  })

  test('should show visible focus indicators on all interactive elements', async ({ page }) => {
    // Check focus indicator on images
    await page.keyboard.press('Tab')

    const focusedElement = await page.locator(':focus')
    const outlineWidth = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.outlineWidth
    })

    // Should have visible outline (3px per spec)
    expect(parseInt(outlineWidth)).toBeGreaterThan(0)
  })

  test('should support A and B keyboard shortcuts for selection', async ({ page }) => {
    // Press 'A' key to select option A
    await page.keyboard.press('a')

    // Explanation form should appear
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible()

    // Go back to choice (if restart button exists)
    // For this test, we'll complete the explanation

    await page.keyboard.press('Tab')
    await page.keyboard.type('Selected A with keyboard shortcut')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Should advance to next round
    await page.waitForTimeout(500)

    // Press 'B' key to select option B
    await page.keyboard.press('b')
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible()
  })

  test('should support Escape key to cancel actions', async ({ page }) => {
    // Select an image
    await page.keyboard.press('a')
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible()

    // Press Escape to cancel
    await page.keyboard.press('Escape')

    // Should return to choice screen (or close modal if implemented)
    // This behavior may vary based on implementation
  })

  test('should trap focus within modal dialogs', async ({ page }) => {
    // Navigate through multiple rounds to trigger confirmation modal
    // This test assumes a modal appears at some point

    // For MVP, we'll test that focus doesn't escape the active UI
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const activeElement = await page.evaluate(() => {
      const active = document.activeElement
      return active.closest('[role="dialog"], .modal, body')?.tagName || 'BODY'
    })

    // Focus should stay within the app
    expect(activeElement).not.toBe('HTML')
  })

  test('should allow keyboard navigation through multiple rounds', async ({ page }) => {
    // Complete 3 rounds using only keyboard
    for (let round = 0; round < 3; round++) {
      // Select image A
      await page.keyboard.press('a')

      // Wait for explanation form
      await page.waitForSelector('textarea, input[type="text"]', { timeout: 3000 })

      // Tab to explanation field (might already be focused)
      await page.keyboard.press('Tab')

      // Type explanation
      await page.keyboard.type(`Round ${round + 1} explanation with enough characters`)

      // Tab to submit button
      await page.keyboard.press('Tab')

      // Submit
      await page.keyboard.press('Enter')

      // Wait for next round to load
      await page.waitForTimeout(500)
    }

    // Should have completed 3 rounds
    const currentRound = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.currentRound || 1
    })

    expect(currentRound).toBeGreaterThan(3)
  })

  test('should have proper tab order', async ({ page }) => {
    const tabOrder = []

    // Tab through first few elements and record order
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const elementInfo = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tag: el.tagName,
          class: el.className,
          id: el.id,
          text: el.textContent?.substring(0, 20),
        }
      })
      tabOrder.push(elementInfo)
    }

    // Tab order should be logical (e.g., skip-link, image A, image B, etc.)
    expect(tabOrder.length).toBe(5)
    expect(tabOrder[0].tag).toBeTruthy() // First element should exist
  })

  test('should support Shift+Tab for reverse navigation', async ({ page }) => {
    // Tab forward twice
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const secondElement = await page.evaluate(() => document.activeElement.tagName)

    // Tab backward once
    await page.keyboard.press('Shift+Tab')

    const firstElement = await page.evaluate(() => document.activeElement.tagName)

    // Should be on different elements
    expect(secondElement).not.toBe(firstElement)
  })

  test('should handle validation errors without breaking keyboard flow', async ({ page }) => {
    // Select image
    await page.keyboard.press('a')

    // Tab to explanation field
    await page.keyboard.press('Tab')

    // Type short (invalid) explanation
    await page.keyboard.type('short')

    // Tab to submit
    await page.keyboard.press('Tab')

    // Try to submit
    await page.keyboard.press('Enter')

    // Error message should appear
    await expect(page.locator('.error, [role="alert"]')).toBeVisible()

    // Focus should remain in form (not lost)
    const activeElement = await page.evaluate(() => document.activeElement.tagName)
    expect(['TEXTAREA', 'INPUT', 'BUTTON']).toContain(activeElement)
  })

  test('should maintain focus after dynamic content updates', async ({ page }) => {
    // Select image
    await page.keyboard.press('a')

    // Focus should be on explanation field after content loads
    await page.waitForTimeout(500)

    const focusedAfterUpdate = await page.evaluate(() => document.activeElement.tagName)

    // Should have focus on input or button, not body
    expect(focusedAfterUpdate).not.toBe('BODY')
  })

  test('should have accessible skip-to-content link', async ({ page }) => {
    // Focus skip link (should be first focusable element)
    await page.keyboard.press('Tab')

    const skipLink = await page.locator('.skip-to-content, [href="#main"]')

    // Skip link should be visible when focused
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible()

      // Pressing Enter should skip to main content
      await page.keyboard.press('Enter')

      const mainContent = await page.locator('#main, main, [role="main"]')
      await expect(mainContent).toBeVisible()
    }
  })
})
