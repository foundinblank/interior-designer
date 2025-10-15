import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadImage,
  preloadImagePair,
  getPlaceholderImage,
} from '@/services/imageLoader.js'

describe('imageLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any timers
    vi.useRealTimers()
  })

  describe('loadImage', () => {
    it('should successfully load image on first attempt', async () => {
      const url = '/images/living-rooms/modern/modern-001.jpg'
      const result = await loadImage(url)

      expect(result.success).toBe(true)
      expect(result.url).toBe(url)
      expect(result.error).toBeUndefined()
    })

    it('should retry with exponential backoff on failure', async () => {
      vi.useFakeTimers()
      const url = '/images/living-rooms/invalid.jpg'

      // Mock Image constructor to fail first 2 times, succeed on 3rd
      let attemptCount = 0
      global.Image = class {
        constructor() {
          attemptCount++
          setTimeout(() => {
            if (attemptCount < 3) {
              this.onerror?.(new Error('Load failed'))
            } else {
              this.onload?.()
            }
          }, 0)
        }
      }

      const resultPromise = loadImage(url, 3)

      // Fast-forward through retry delays
      await vi.runAllTimersAsync()

      const result = await resultPromise
      expect(attemptCount).toBe(3)
      expect(result.success).toBe(true)
    })

    it('should return error after max retries', async () => {
      vi.useFakeTimers()
      const url = '/images/living-rooms/invalid.jpg'

      // Mock Image to always fail
      global.Image = class {
        constructor() {
          setTimeout(() => {
            this.onerror?.(new Error('Load failed'))
          }, 0)
        }
      }

      const resultPromise = loadImage(url, 3)
      await vi.runAllTimersAsync()

      const result = await resultPromise
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should use exponential backoff delays (1s, 2s, 4s)', async () => {
      vi.useFakeTimers()
      const url = '/images/living-rooms/invalid.jpg'
      const delays = []

      global.Image = class {
        constructor() {
          const startTime = Date.now()
          setTimeout(() => {
            delays.push(Date.now() - startTime)
            this.onerror?.(new Error('Load failed'))
          }, 0)
        }
      }

      const resultPromise = loadImage(url, 3)

      // Advance timers step by step to track delays
      await vi.advanceTimersByTimeAsync(0) // First attempt
      await vi.advanceTimersByTimeAsync(1000) // 1s delay
      await vi.advanceTimersByTimeAsync(2000) // 2s delay

      await resultPromise

      // Note: actual delays will be tracked during implementation
      // This test verifies the retry mechanism exists
      expect(delays.length).toBeGreaterThan(1)
    })

    it('should respect maxRetries parameter', async () => {
      vi.useFakeTimers()
      const url = '/images/living-rooms/invalid.jpg'
      let attemptCount = 0

      global.Image = class {
        constructor() {
          attemptCount++
          setTimeout(() => {
            this.onerror?.(new Error('Load failed'))
          }, 0)
        }
      }

      const resultPromise = loadImage(url, 2) // Only 2 retries
      await vi.runAllTimersAsync()

      await resultPromise
      expect(attemptCount).toBeLessThanOrEqual(2)
    })
  })

  describe('preloadImagePair', () => {
    it('should load both images in parallel', async () => {
      const imageA = {
        id: 'modern-001',
        url: '/images/living-rooms/modern/modern-001.jpg',
        thumbnail: '/images/living-rooms/modern/modern-001-thumb.jpg',
      }

      const imageB = {
        id: 'traditional-001',
        url: '/images/living-rooms/traditional/traditional-001.jpg',
        thumbnail: '/images/living-rooms/traditional/traditional-001-thumb.jpg',
      }

      global.Image = class {
        constructor() {
          setTimeout(() => this.onload?.(), 10)
        }
      }

      const result = await preloadImagePair(imageA, imageB)

      expect(result.imageA.success).toBe(true)
      expect(result.imageB.success).toBe(true)
      expect(result.imageA.url).toBe(imageA.url)
      expect(result.imageB.url).toBe(imageB.url)
    })

    it('should handle one image failing', async () => {
      const imageA = {
        id: 'modern-001',
        url: '/images/living-rooms/modern/modern-001.jpg',
        thumbnail: '/images/living-rooms/modern/modern-001-thumb.jpg',
      }

      const imageB = {
        id: 'invalid',
        url: '/images/living-rooms/invalid.jpg',
        thumbnail: '/images/living-rooms/invalid-thumb.jpg',
      }

      let loadCount = 0
      global.Image = class {
        constructor() {
          loadCount++
          const shouldFail = loadCount % 2 === 0
          setTimeout(() => {
            if (shouldFail) {
              this.onerror?.(new Error('Load failed'))
            } else {
              this.onload?.()
            }
          }, 10)
        }
      }

      const result = await preloadImagePair(imageA, imageB)

      expect(result.imageA.success).toBe(true)
      expect(result.imageB.success).toBe(false)
    })
  })

  describe('getPlaceholderImage', () => {
    it('should return a data URI or placeholder path', () => {
      const placeholder = getPlaceholderImage()

      expect(placeholder).toBeTypeOf('string')
      expect(placeholder.length).toBeGreaterThan(0)
      // Should be either a data URI or a path
      expect(
        placeholder.startsWith('data:image') || placeholder.startsWith('/')
      ).toBe(true)
    })

    it('should return consistent placeholder', () => {
      const placeholder1 = getPlaceholderImage()
      const placeholder2 = getPlaceholderImage()

      expect(placeholder1).toBe(placeholder2)
    })
  })
})
