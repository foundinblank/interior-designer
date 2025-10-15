import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createSession,
  loadSession,
  saveSession,
  isSessionValid,
  addChoice,
  clearSession,
} from '@/services/sessionManager.js'

describe('sessionManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a new session with default values', () => {
      const session = createSession()

      expect(session).toHaveProperty('id')
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) // UUID v4 format
      expect(session.startTime).toBeTypeOf('number')
      expect(session.currentRound).toBe(1)
      expect(session.phase).toBe('discovery')
      expect(session.choices).toEqual([])
      expect(session.styleScores).toEqual({})
      expect(session.recommendedStyle).toBeNull()
      expect(session.secondBestStyle).toBeNull()
      expect(session.isValid).toBe(true)
    })

    it('should create session with startTime as current timestamp', () => {
      const beforeTime = Date.now()
      const session = createSession()
      const afterTime = Date.now()

      expect(session.startTime).toBeGreaterThanOrEqual(beforeTime)
      expect(session.startTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const session = createSession()
      const result = saveSession(session)

      expect(result).toBe(true)
      expect(localStorage.getItem('interiorDesignSession')).not.toBeNull()
    })

    it('should serialize session as JSON', () => {
      const session = createSession()
      saveSession(session)

      const stored = localStorage.getItem('interiorDesignSession')
      const parsed = JSON.parse(stored)

      expect(parsed.id).toBe(session.id)
      expect(parsed.startTime).toBe(session.startTime)
      expect(parsed.phase).toBe(session.phase)
    })

    it('should return false if localStorage is unavailable', () => {
      const session = createSession()
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      const result = saveSession(session)
      expect(result).toBe(false)
    })
  })

  describe('loadSession', () => {
    it('should load session from localStorage', () => {
      const session = createSession()
      saveSession(session)

      const loaded = loadSession()
      expect(loaded).toEqual(session)
    })

    it('should return null if no session exists', () => {
      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    it('should return null if session is invalid (>24 hours old)', () => {
      const oldSession = createSession()
      oldSession.startTime = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      saveSession(oldSession)

      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    it('should return null if localStorage data is corrupted', () => {
      localStorage.setItem('interiorDesignSession', 'invalid json')

      const loaded = loadSession()
      expect(loaded).toBeNull()
    })
  })

  describe('isSessionValid', () => {
    it('should return true for session less than 24 hours old', () => {
      const session = createSession()
      expect(isSessionValid(session)).toBe(true)
    })

    it('should return false for session more than 24 hours old', () => {
      const session = createSession()
      session.startTime = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      expect(isSessionValid(session)).toBe(false)
    })

    it('should return false for session exactly 24 hours old', () => {
      const session = createSession()
      session.startTime = Date.now() - (24 * 60 * 60 * 1000)
      expect(isSessionValid(session)).toBe(false)
    })

    it('should return true for session 23 hours old', () => {
      const session = createSession()
      session.startTime = Date.now() - (23 * 60 * 60 * 1000)
      expect(isSessionValid(session)).toBe(true)
    })
  })

  describe('addChoice', () => {
    it('should add choice to session and increment round', () => {
      const session = createSession()
      const choice = {
        round: 1,
        selectedImageId: 'modern-001',
        rejectedImageId: 'traditional-005',
        selectedImageStyles: ['modern', 'minimalist'],
        explanation: 'I prefer the clean lines',
        keywords: ['clean'],
        timestamp: Date.now(),
      }

      const updated = addChoice(session, choice)

      expect(updated.choices).toHaveLength(1)
      expect(updated.choices[0]).toEqual(choice)
      expect(updated.currentRound).toBe(2)
    })

    it('should not mutate original session', () => {
      const session = createSession()
      const originalRound = session.currentRound
      const choice = {
        round: 1,
        selectedImageId: 'modern-001',
        rejectedImageId: 'traditional-005',
        selectedImageStyles: ['modern'],
        explanation: 'I like this style',
        keywords: [],
        timestamp: Date.now(),
      }

      addChoice(session, choice)

      expect(session.currentRound).toBe(originalRound)
      expect(session.choices).toHaveLength(0)
    })

    it('should maintain choices array order', () => {
      let session = createSession()

      const choice1 = {
        round: 1,
        selectedImageId: 'modern-001',
        rejectedImageId: 'traditional-005',
        selectedImageStyles: ['modern'],
        explanation: 'First choice explanation',
        keywords: [],
        timestamp: Date.now(),
      }

      const choice2 = {
        round: 2,
        selectedImageId: 'minimalist-003',
        rejectedImageId: 'bohemian-007',
        selectedImageStyles: ['minimalist'],
        explanation: 'Second choice explanation',
        keywords: [],
        timestamp: Date.now(),
      }

      session = addChoice(session, choice1)
      session = addChoice(session, choice2)

      expect(session.choices[0]).toEqual(choice1)
      expect(session.choices[1]).toEqual(choice2)
      expect(session.currentRound).toBe(3)
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      const session = createSession()
      saveSession(session)

      clearSession()

      expect(localStorage.getItem('interiorDesignSession')).toBeNull()
    })

    it('should not throw if no session exists', () => {
      expect(() => clearSession()).not.toThrow()
    })
  })
})
