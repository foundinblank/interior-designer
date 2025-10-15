import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateStyleScores,
  isConfidentRecommendation,
  getTopStyles,
  extractKeywords,
} from '@/services/recommendationEngine.js'

describe('recommendationEngine', () => {
  describe('extractKeywords', () => {
    it('should extract design-related keywords from explanation', () => {
      const explanation = 'I like the modern furniture and bright colors'
      const keywords = extractKeywords(explanation)

      expect(keywords).toContain('modern')
      expect(keywords).toContain('furniture')
      expect(keywords).toContain('bright')
      expect(keywords).toContain('colors')
    })

    it('should convert keywords to lowercase', () => {
      const explanation = 'I LOVE the MODERN style'
      const keywords = extractKeywords(explanation)

      expect(keywords).toContain('modern')
      expect(keywords).not.toContain('MODERN')
    })

    it('should return empty array if no keywords found', () => {
      const explanation = 'Just because okay'
      const keywords = extractKeywords(explanation)

      expect(keywords).toEqual([])
    })

    it('should handle vague responses', () => {
      const explanation = 'idk I just like it'
      const keywords = extractKeywords(explanation)

      // Should not error, may return empty or minimal keywords
      expect(Array.isArray(keywords)).toBe(true)
    })

    it('should extract common design keywords', () => {
      const explanation = 'The space feels airy with natural lighting and wood texture'
      const keywords = extractKeywords(explanation)

      expect(keywords).toContain('space')
      expect(keywords).toContain('airy')
      expect(keywords).toContain('lighting')
      expect(keywords).toContain('wood')
      expect(keywords).toContain('texture')
    })

    it('should not extract non-design words', () => {
      const explanation = 'I think maybe perhaps the room looks nice'
      const keywords = extractKeywords(explanation)

      expect(keywords).not.toContain('think')
      expect(keywords).not.toContain('maybe')
      expect(keywords).not.toContain('perhaps')
    })
  })

  describe('calculateStyleScores', () => {
    it('should return scores for all styles based on choices', () => {
      const choices = [
        {
          round: 1,
          selectedImageId: 'modern-001',
          rejectedImageId: 'traditional-005',
          selectedImageStyles: ['modern', 'minimalist'],
          explanation: 'I prefer the clean lines',
          keywords: ['clean'],
          timestamp: Date.now(),
        },
        {
          round: 2,
          selectedImageId: 'scandinavian-003',
          rejectedImageId: 'bohemian-007',
          selectedImageStyles: ['scandinavian', 'minimalist'],
          explanation: 'Light colors feel calming',
          keywords: ['light'],
          timestamp: Date.now(),
        },
      ]

      const scores = calculateStyleScores(choices)

      expect(scores).toHaveProperty('modern')
      expect(scores).toHaveProperty('scandinavian')
      expect(scores).toHaveProperty('minimalist')
      expect(scores.modern).toBeGreaterThan(0)
      expect(scores.scandinavian).toBeGreaterThan(0)
      expect(scores.minimalist).toBeGreaterThan(0)
    })

    it('should weight primary styles higher than secondary', () => {
      const choices = [
        {
          round: 1,
          selectedImageId: 'modern-001',
          rejectedImageId: 'traditional-005',
          selectedImageStyles: ['modern', 'minimalist'], // modern is primary
          explanation: 'Clean and simple',
          keywords: ['clean', 'simple'],
          timestamp: Date.now(),
        },
      ]

      const scores = calculateStyleScores(choices)

      // Modern should have higher score as primary style
      expect(scores.modern).toBeGreaterThan(scores.minimalist || 0)
    })

    it('should normalize scores between 0 and 1', () => {
      const choices = [
        {
          round: 1,
          selectedImageId: 'modern-001',
          rejectedImageId: 'traditional-005',
          selectedImageStyles: ['modern'],
          explanation: 'I like this',
          keywords: [],
          timestamp: Date.now(),
        },
      ]

      const scores = calculateStyleScores(choices)

      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })
    })

    it('should return empty object for empty choices array', () => {
      const scores = calculateStyleScores([])
      expect(scores).toEqual({})
    })

    it('should accumulate scores across multiple rounds', () => {
      const choices = [
        {
          round: 1,
          selectedImageId: 'modern-001',
          rejectedImageId: 'traditional-005',
          selectedImageStyles: ['modern'],
          explanation: 'Clean lines',
          keywords: ['clean'],
          timestamp: Date.now(),
        },
        {
          round: 2,
          selectedImageId: 'modern-002',
          rejectedImageId: 'bohemian-003',
          selectedImageStyles: ['modern'],
          explanation: 'Simple design',
          keywords: ['simple'],
          timestamp: Date.now(),
        },
      ]

      const scores = calculateStyleScores(choices)

      // Modern selected twice, should have high confidence
      expect(scores.modern).toBeGreaterThan(0.5)
    })

    it('should consider keyword matching from explanations', () => {
      const choices = [
        {
          round: 1,
          selectedImageId: 'modern-001',
          rejectedImageId: 'traditional-005',
          selectedImageStyles: ['modern'],
          explanation: 'I love modern furniture and contemporary style',
          keywords: ['modern', 'furniture', 'contemporary'],
          timestamp: Date.now(),
        },
      ]

      const scores = calculateStyleScores(choices)

      // Score should be boosted by keyword matching
      expect(scores.modern).toBeGreaterThan(0)
    })
  })

  describe('isConfidentRecommendation', () => {
    it('should return true if top score exceeds threshold after min rounds', () => {
      const styleScores = {
        modern: 0.75,
        traditional: 0.15,
        minimalist: 0.10,
      }

      const result = isConfidentRecommendation(styleScores, 6)
      expect(result).toBe(true)
    })

    it('should return false if below minimum rounds', () => {
      const styleScores = {
        modern: 0.85,
        traditional: 0.10,
      }

      const result = isConfidentRecommendation(styleScores, 3) // Only 3 rounds
      expect(result).toBe(false)
    })

    it('should return false if no clear winner (scores too close)', () => {
      const styleScores = {
        modern: 0.45,
        traditional: 0.43,
        minimalist: 0.12,
      }

      const result = isConfidentRecommendation(styleScores, 8)
      expect(result).toBe(false)
    })

    it('should return true after max rounds even with low confidence', () => {
      const styleScores = {
        modern: 0.35,
        traditional: 0.33,
        minimalist: 0.32,
      }

      const result = isConfidentRecommendation(styleScores, 15) // Max rounds
      expect(result).toBe(true)
    })

    it('should use default minRounds of 6 if not provided', () => {
      const styleScores = {
        modern: 0.80,
        traditional: 0.20,
      }

      const result = isConfidentRecommendation(styleScores)
      expect(result).toBe(true)
    })

    it('should return false for empty style scores', () => {
      const result = isConfidentRecommendation({}, 10)
      expect(result).toBe(false)
    })
  })

  describe('getTopStyles', () => {
    it('should return top N styles by score', () => {
      const styleScores = {
        modern: 0.75,
        traditional: 0.15,
        minimalist: 0.60,
        bohemian: 0.05,
        industrial: 0.30,
      }

      const topStyles = getTopStyles(styleScores, 2)

      expect(topStyles).toHaveLength(2)
      expect(topStyles[0]).toBe('modern') // Highest score
      expect(topStyles[1]).toBe('minimalist') // Second highest
    })

    it('should return all styles if count exceeds available styles', () => {
      const styleScores = {
        modern: 0.80,
        traditional: 0.20,
      }

      const topStyles = getTopStyles(styleScores, 5)

      expect(topStyles).toHaveLength(2)
      expect(topStyles).toContain('modern')
      expect(topStyles).toContain('traditional')
    })

    it('should handle single style', () => {
      const styleScores = {
        modern: 0.90,
      }

      const topStyles = getTopStyles(styleScores, 1)

      expect(topStyles).toHaveLength(1)
      expect(topStyles[0]).toBe('modern')
    })

    it('should default to top 2 styles if count not provided', () => {
      const styleScores = {
        modern: 0.75,
        traditional: 0.15,
        minimalist: 0.10,
      }

      const topStyles = getTopStyles(styleScores)

      expect(topStyles).toHaveLength(2)
      expect(topStyles[0]).toBe('modern')
      expect(topStyles[1]).toBe('traditional')
    })

    it('should return empty array for empty scores', () => {
      const topStyles = getTopStyles({}, 2)
      expect(topStyles).toEqual([])
    })

    it('should maintain correct order (descending by score)', () => {
      const styleScores = {
        modern: 0.25,
        traditional: 0.85,
        minimalist: 0.60,
        bohemian: 0.40,
      }

      const topStyles = getTopStyles(styleScores, 4)

      expect(topStyles[0]).toBe('traditional') // 0.85
      expect(topStyles[1]).toBe('minimalist') // 0.60
      expect(topStyles[2]).toBe('bohemian') // 0.40
      expect(topStyles[3]).toBe('modern') // 0.25
    })
  })
})
