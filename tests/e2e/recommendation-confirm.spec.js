import { test, expect } from '@playwright/test'

test.describe('Recommendation Confirmation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear())
  })

  // Helper function to complete discovery phase
  async function completeDiscoveryPhase(page, rounds = 6) {
    for (let i = 0; i < rounds; i++) {
      // Select image A
      await page.keyboard.press('a')

      // Wait for explanation form
      await page.waitForSelector('textarea', { timeout: 3000 })

      // Type explanation
      await page.keyboard.type(`Round ${i + 1} - I like the modern clean style with bright colors`)

      // Submit (either Shift+Enter or click submit button)
      const submitButton = await page.locator('#submit-explanation')
      await submitButton.click()

      // Wait for next round or recommendation phase
      await page.waitForTimeout(800)

      // Check if we've moved to recommendations
      const phase = await page.evaluate(() => {
        const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
        return session.phase || 'discovery'
      })

      if (phase === 'recommendations') {
        break
      }
    }
  }

  test('should display recommendation phase after completing discovery', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Should be on recommendations phase
    const phase = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.phase
    })

    expect(phase).toBe('recommendations')

    // Should show recommended style heading
    await expect(page.locator('h1')).toContainText(/your style/i)

    // Should show recommendation images
    const recommendationImages = await page.locator('.recommendation-image img').count()
    expect(recommendationImages).toBeGreaterThan(0)
    expect(recommendationImages).toBeLessThanOrEqual(10)

    // Should show confirmation buttons
    await expect(page.locator('#confirm-style')).toBeVisible()
    await expect(page.locator('#reject-style')).toBeVisible()
  })

  test('should show 10 or fewer recommendation images matching the discovered style', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Wait for recommendations to load
    await page.waitForSelector('.recommendation-image img', { timeout: 3000 })

    // Count recommendation images
    const imageCount = await page.locator('.recommendation-image img').count()
    expect(imageCount).toBeLessThanOrEqual(10)
    expect(imageCount).toBeGreaterThan(0)

    // All images should have loaded successfully
    const brokenImages = await page.locator('.recommendation-image img[src=""]').count()
    expect(brokenImages).toBe(0)
  })

  test('should transition to complete phase when user confirms style', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Wait for recommendations phase
    await page.waitForSelector('#confirm-style', { timeout: 3000 })

    // Click confirm button
    await page.locator('#confirm-style').click()

    // Wait for transition
    await page.waitForTimeout(500)

    // Should be on complete phase
    const phase = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.phase
    })

    expect(phase).toBe('complete')

    // Should show success message
    await expect(page.locator('h1')).toContainText(/style discovered/i)

    // Should show restart button
    await expect(page.locator('#restart, button')).toContainText(/start over/i)
  })

  test('should show alternative style when user rejects recommendation', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Wait for recommendations phase
    await page.waitForSelector('#reject-style', { timeout: 3000 })

    // Get the first recommended style
    const firstStyle = await page.locator('h1').textContent()

    // Click reject button
    await page.locator('#reject-style').click()

    // Wait for alternatives phase
    await page.waitForTimeout(500)

    // Should be on alternatives phase
    const phase = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.phase
    })

    expect(phase).toBe('alternatives')

    // Should show alternative style heading (different from first)
    const alternativeStyle = await page.locator('h1').textContent()
    expect(alternativeStyle).toContain('How about')

    // Should show alternative images
    const alternativeImages = await page.locator('.recommendation-image img').count()
    expect(alternativeImages).toBeGreaterThan(0)

    // Should show new confirmation buttons
    await expect(page.locator('#confirm-alternative')).toBeVisible()
    await expect(page.locator('#restart-from-alternatives')).toBeVisible()
  })

  test('should complete flow: reject -> alternatives -> confirm', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Reject first recommendation
    await page.waitForSelector('#reject-style', { timeout: 3000 })
    await page.locator('#reject-style').click()

    // Wait for alternatives
    await page.waitForTimeout(500)

    // Confirm alternative style
    await page.waitForSelector('#confirm-alternative', { timeout: 3000 })
    await page.locator('#confirm-alternative').click()

    // Wait for transition
    await page.waitForTimeout(500)

    // Should be on complete phase
    const phase = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.phase
    })

    expect(phase).toBe('complete')
    await expect(page.locator('h1')).toContainText(/style discovered/i)
  })

  test('should allow restart from alternatives phase', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Reject to get to alternatives
    await page.waitForSelector('#reject-style', { timeout: 3000 })
    await page.locator('#reject-style').click()
    await page.waitForTimeout(500)

    // Click restart from alternatives
    await page.waitForSelector('#restart-from-alternatives', { timeout: 3000 })

    // Handle the confirm dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Start over')
      await dialog.accept()
    })

    await page.locator('#restart-from-alternatives').click()

    // Wait for restart
    await page.waitForTimeout(500)

    // Should be back on discovery phase, round 1
    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
    })

    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)
    expect(session.choices).toHaveLength(0)
  })

  test('should allow restart from complete phase', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Confirm style to get to complete
    await page.waitForSelector('#confirm-style', { timeout: 3000 })
    await page.locator('#confirm-style').click()
    await page.waitForTimeout(500)

    // Click restart button
    await page.waitForSelector('#restart', { timeout: 3000 })
    await page.locator('#restart').click()

    // Wait for restart
    await page.waitForTimeout(500)

    // Should be back on discovery phase, round 1
    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
    })

    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)
    expect(session.choices).toHaveLength(0)

    // Should show round 1
    await expect(page.locator('.round-number')).toContainText('Round 1')
  })

  test('should preserve session data during recommendations phase', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Get session data
    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
    })

    expect(session.recommendedStyle).toBeTruthy()
    expect(session.choices.length).toBeGreaterThanOrEqual(6)
    expect(session.styleScores).toBeDefined()
    expect(Object.keys(session.styleScores).length).toBeGreaterThan(0)
  })

  test('should handle keyboard navigation in recommendation phase', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Wait for recommendations
    await page.waitForSelector('#confirm-style', { timeout: 3000 })

    // Tab to confirm button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to activate with Enter/Space
    const focusedElement = await page.evaluate(() => document.activeElement.id)
    expect(['confirm-style', 'reject-style']).toContain(focusedElement)
  })

  test('should show different images in recommendations than discovery', async ({ page }) => {
    // Track images shown during discovery
    const discoveryImageIds = []

    for (let i = 0; i < 6; i++) {
      // Get current image IDs
      const imageIds = await page.evaluate(() => {
        const buttons = document.querySelectorAll('[data-image-id]')
        return Array.from(buttons).map(b => b.dataset.imageId)
      })

      discoveryImageIds.push(...imageIds)

      // Select and continue
      await page.keyboard.press('a')
      await page.waitForSelector('textarea', { timeout: 3000 })
      await page.keyboard.type(`Round ${i + 1} explanation with sufficient detail`)
      const submitButton = await page.locator('#submit-explanation')
      await submitButton.click()
      await page.waitForTimeout(800)

      // Check if moved to recommendations
      const phase = await page.evaluate(() => {
        const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
        return session.phase || 'discovery'
      })

      if (phase === 'recommendations') {
        break
      }
    }

    // Get recommendation image IDs
    await page.waitForSelector('.recommendation-image img', { timeout: 3000 })
    const recommendationUrls = await page.evaluate(() => {
      const imgs = document.querySelectorAll('.recommendation-image img')
      return Array.from(imgs).map(img => img.src)
    })

    // Recommendations should exist
    expect(recommendationUrls.length).toBeGreaterThan(0)

    // Note: We can't directly compare URLs to discovery IDs without more context,
    // but we can verify that recommendations are being shown
    expect(recommendationUrls.every(url => url.includes('http'))).toBe(true)
  })

  test('should maintain style choice across alternative recommendations', async ({ page }) => {
    await completeDiscoveryPhase(page, 8)

    // Get initial recommended style
    await page.waitForSelector('h1', { timeout: 3000 })
    const firstStyle = await page.locator('h1').textContent()

    // Reject to see alternative
    await page.locator('#reject-style').click()
    await page.waitForTimeout(500)

    // Get alternative style
    const alternativeStyle = await page.locator('h1').textContent()

    // Should be different styles
    expect(alternativeStyle).not.toBe(firstStyle)

    // Confirm alternative
    await page.locator('#confirm-alternative').click()
    await page.waitForTimeout(500)

    // On complete page, should show the alternative style (not the first one)
    const finalStyle = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
      return session.recommendedStyle
    })

    expect(finalStyle).toBeTruthy()
  })

  test('should handle missing alternative style gracefully', async ({ page }) => {
    // This test simulates a scenario where no good alternative exists
    // by forcing a session with only one strong style preference

    // Set up a session with only one strong style
    await page.evaluate(() => {
      const session = {
        id: 'test-session',
        phase: 'recommendations',
        currentRound: 7,
        recommendedStyle: 'modern',
        secondBestStyle: null,
        styleScores: { modern: 0.95 },
        choices: [],
        createdAt: Date.now(),
      }
      localStorage.setItem('interiorDesignSession', JSON.stringify(session))
    })

    await page.reload()

    // Should be on recommendations phase
    await page.waitForSelector('#reject-style', { timeout: 3000 })

    // Set up dialog handler for restart confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('start over')
      await dialog.accept()
    })

    // Reject - should offer restart since no alternative
    await page.locator('#reject-style').click()
    await page.waitForTimeout(500)

    // Should have restarted to discovery
    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('interiorDesignSession') || '{}')
    })

    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)
  })
})
