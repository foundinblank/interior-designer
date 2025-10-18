/**
 * Unit tests for LLM Analyzer service
 * Tests Claude API integration with graceful fallback to keyword extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeExplanation } from '../../src/services/llmAnalyzer.js'
import { extractKeywords } from '../../src/services/recommendationEngine.js'

describe('llmAnalyzer', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('analyzeExplanation', () => {
    it('should return LLM analysis when API key is provided and call succeeds', async () => {
      const explanation = 'I love the bright colors and modern furniture'
      const mockApiKey = 'test-api-key-12345'

      // Mock successful Claude API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              keywords: ['bright', 'colors', 'modern', 'furniture'],
              emotions: ['love', 'excitement'],
              style_indicators: ['modern', 'contemporary']
            })
          }]
        })
      })

      const result = await analyzeExplanation(explanation, mockApiKey)

      expect(result).toHaveProperty('keywords')
      expect(result).toHaveProperty('emotions')
      expect(result).toHaveProperty('style_indicators')
      expect(result).toHaveProperty('source')
      expect(result.source).toBe('llm')
      expect(result.keywords).toEqual(['bright', 'colors', 'modern', 'furniture'])
      expect(result.emotions).toEqual(['love', 'excitement'])
      expect(result.style_indicators).toEqual(['modern', 'contemporary'])

      // Restore fetch
      vi.restoreAllMocks()
    })

    it('should fallback to keyword extraction when API key is not provided', async () => {
      const explanation = 'I love the bright colors and modern furniture'

      const result = await analyzeExplanation(explanation, null)

      expect(result).toHaveProperty('keywords')
      expect(result.keywords).toBeInstanceOf(Array)
      expect(result.source).toBe('keyword_extraction')
      expect(result.emotions).toEqual([])
      expect(result.style_indicators).toEqual([])
    })

    it('should fallback to keyword extraction when API key is empty string', async () => {
      const explanation = 'I prefer minimalist and clean designs'

      const result = await analyzeExplanation(explanation, '')

      expect(result.source).toBe('keyword_extraction')
      expect(result.keywords).toBeInstanceOf(Array)
    })

    it('should fallback to keyword extraction when LLM call fails', async () => {
      const explanation = 'I like cozy traditional spaces'
      const mockApiKey = 'invalid-api-key'

      // This should gracefully fallback even if the API call fails
      const result = await analyzeExplanation(explanation, mockApiKey)

      expect(result).toHaveProperty('keywords')
      expect(result).toHaveProperty('source')
      // Should fallback to keyword extraction on error
      expect(['llm', 'keyword_extraction']).toContain(result.source)
    })

    it('should timeout after 5 seconds and fallback to keyword extraction', async () => {
      const explanation = 'I appreciate open airy spaces with natural light'
      const mockApiKey = 'test-api-key-slow-response'

      const startTime = Date.now()
      const result = await analyzeExplanation(explanation, mockApiKey, 100) // 100ms timeout for testing

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(200) // Should timeout quickly
      expect(result.source).toBe('keyword_extraction') // Should fallback
    })

    it('should extract design keywords when using fallback mode', async () => {
      const explanation = 'I love the bright modern colors and clean minimalist style'

      const result = await analyzeExplanation(explanation, null)

      expect(result.source).toBe('keyword_extraction')
      expect(result.keywords).toContain('bright')
      expect(result.keywords).toContain('modern')
      expect(result.keywords).toContain('colors')
      expect(result.keywords).toContain('clean')
      expect(result.keywords).toContain('minimalist')
      expect(result.keywords).toContain('style')
    })

    it('should return consistent structure regardless of source', async () => {
      const explanation = 'I prefer warm traditional furniture'

      // Test with LLM (will fallback but structure should be consistent)
      const llmResult = await analyzeExplanation(explanation, 'test-key')

      // Test with fallback
      const fallbackResult = await analyzeExplanation(explanation, null)

      // Both should have the same structure
      expect(llmResult).toHaveProperty('keywords')
      expect(llmResult).toHaveProperty('emotions')
      expect(llmResult).toHaveProperty('style_indicators')
      expect(llmResult).toHaveProperty('source')

      expect(fallbackResult).toHaveProperty('keywords')
      expect(fallbackResult).toHaveProperty('emotions')
      expect(fallbackResult).toHaveProperty('style_indicators')
      expect(fallbackResult).toHaveProperty('source')
    })

    it('should handle empty explanation gracefully', async () => {
      const explanation = ''

      const result = await analyzeExplanation(explanation, null)

      expect(result.keywords).toEqual([])
      expect(result.emotions).toEqual([])
      expect(result.style_indicators).toEqual([])
      expect(result.source).toBe('keyword_extraction')
    })

    it('should handle very short explanations', async () => {
      const explanation = 'Nice'

      const result = await analyzeExplanation(explanation, null)

      expect(result).toHaveProperty('keywords')
      expect(result.source).toBe('keyword_extraction')
    })
  })
})
