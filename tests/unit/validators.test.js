import { describe, it, expect } from 'vitest'
import { validateExplanation, sanitizeInput } from '@/lib/validators.js'

describe('validators', () => {
  describe('validateExplanation', () => {
    it('should return valid for explanation with exactly 10 characters', () => {
      const result = validateExplanation('1234567890')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid for explanation with more than 10 characters', () => {
      const result = validateExplanation('This is a valid explanation with more than 10 chars')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for explanation with less than 10 characters', () => {
      const result = validateExplanation('short')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Explanation must be at least 10 characters')
    })

    it('should return invalid for empty string', () => {
      const result = validateExplanation('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Explanation must be at least 10 characters')
    })

    it('should return invalid for explanation with only whitespace', () => {
      const result = validateExplanation('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Explanation must be at least 10 characters')
    })

    it('should trim whitespace and validate length', () => {
      const result = validateExplanation('  valid text  ')
      expect(result.valid).toBe(true)
    })

    it('should return invalid if trimmed length is less than 10', () => {
      const result = validateExplanation('  short  ')
      expect(result.valid).toBe(false)
    })

    it('should accept vague responses like "idk I just like it"', () => {
      const result = validateExplanation('idk I just like it')
      expect(result.valid).toBe(true)
    })

    it('should reject explanation longer than 500 characters', () => {
      const longText = 'a'.repeat(501)
      const result = validateExplanation(longText)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Explanation must be less than 500 characters')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace from input', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello')
    })

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
    })

    it('should preserve safe text content', () => {
      expect(sanitizeInput('I like the colors')).toBe('I like the colors')
    })

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('should handle strings with special characters', () => {
      expect(sanitizeInput('I love the "modern" style!')).toBe('I love the "modern" style!')
    })
  })
})
