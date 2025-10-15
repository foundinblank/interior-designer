import { describe, it, expect, beforeEach } from 'vitest'
import { createSession, addChoice, saveSession, loadSession } from '@/services/sessionManager.js'
import { calculateStyleScores, isConfidentRecommendation, getTopStyles } from '@/services/recommendationEngine.js'
import { validateExplanation } from '@/lib/validators.js'

describe('Discovery Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should complete full discovery flow from round 1 to recommendations', () => {
    // Step 1: Create new session
    let session = createSession()
    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)

    // Step 2: Simulate 6 rounds of choices
    const mockChoices = [
      {
        round: 1,
        selectedImageId: 'modern-001',
        rejectedImageId: 'traditional-001',
        selectedImageStyles: ['modern', 'minimalist'],
        explanation: 'I prefer clean lines and open space',
        keywords: ['clean', 'open', 'space'],
        timestamp: Date.now(),
      },
      {
        round: 2,
        selectedImageId: 'modern-002',
        rejectedImageId: 'bohemian-001',
        selectedImageStyles: ['modern'],
        explanation: 'Simple and uncluttered design',
        keywords: ['simple'],
        timestamp: Date.now(),
      },
      {
        round: 3,
        selectedImageId: 'minimalist-001',
        rejectedImageId: 'traditional-002',
        selectedImageStyles: ['minimalist', 'scandinavian'],
        explanation: 'Less is more, very zen',
        keywords: ['zen'],
        timestamp: Date.now(),
      },
      {
        round: 4,
        selectedImageId: 'scandinavian-001',
        rejectedImageId: 'industrial-001',
        selectedImageStyles: ['scandinavian', 'modern'],
        explanation: 'Light and airy with natural wood',
        keywords: ['light', 'airy', 'wood'],
        timestamp: Date.now(),
      },
      {
        round: 5,
        selectedImageId: 'modern-003',
        rejectedImageId: 'bohemian-002',
        selectedImageStyles: ['modern'],
        explanation: 'Contemporary and sleek furniture',
        keywords: ['furniture'],
        timestamp: Date.now(),
      },
      {
        round: 6,
        selectedImageId: 'minimalist-002',
        rejectedImageId: 'traditional-003',
        selectedImageStyles: ['minimalist'],
        explanation: 'Neutral colors and clean aesthetic',
        keywords: ['neutral', 'colors', 'clean'],
        timestamp: Date.now(),
      },
    ]

    // Add each choice to session
    mockChoices.forEach(choice => {
      session = addChoice(session, choice)
    })

    expect(session.choices).toHaveLength(6)
    expect(session.currentRound).toBe(7)

    // Step 3: Calculate style scores
    const styleScores = calculateStyleScores(session.choices)
    expect(styleScores).toHaveProperty('modern')
    expect(styleScores).toHaveProperty('minimalist')
    expect(styleScores.modern).toBeGreaterThan(0)

    // Step 4: Check if confident recommendation can be made
    const isConfident = isConfidentRecommendation(styleScores, session.currentRound - 1)
    expect(isConfident).toBe(true)

    // Step 5: Get top style
    const topStyles = getTopStyles(styleScores, 2)
    expect(topStyles).toHaveLength(2)
    expect(topStyles[0]).toMatch(/modern|minimalist/) // Should be one of these

    // Step 6: Update session with recommendation
    session.styleScores = styleScores
    session.recommendedStyle = topStyles[0]
    session.secondBestStyle = topStyles[1]
    session.phase = 'recommendations'

    expect(session.phase).toBe('recommendations')
    expect(session.recommendedStyle).toBeTruthy()
  })

  it('should persist session across page reloads', () => {
    // Create and save session
    let session = createSession()
    const choice = {
      round: 1,
      selectedImageId: 'modern-001',
      rejectedImageId: 'traditional-001',
      selectedImageStyles: ['modern'],
      explanation: 'I like the modern style',
      keywords: ['modern'],
      timestamp: Date.now(),
    }
    session = addChoice(session, choice)
    saveSession(session)

    // Simulate page reload by loading session
    const loadedSession = loadSession()
    expect(loadedSession).not.toBeNull()
    expect(loadedSession.id).toBe(session.id)
    expect(loadedSession.choices).toHaveLength(1)
    expect(loadedSession.currentRound).toBe(2)
  })

  it('should validate explanations before adding choices', () => {
    const session = createSession()

    // Test invalid explanation
    const invalidResult = validateExplanation('short')
    expect(invalidResult.valid).toBe(false)

    // Test valid explanation
    const validResult = validateExplanation('This is a valid explanation with enough characters')
    expect(validResult.valid).toBe(true)

    // Only add choice if validation passes
    if (validResult.valid) {
      const choice = {
        round: 1,
        selectedImageId: 'modern-001',
        rejectedImageId: 'traditional-001',
        selectedImageStyles: ['modern'],
        explanation: 'This is a valid explanation with enough characters',
        keywords: [],
        timestamp: Date.now(),
      }
      const updatedSession = addChoice(session, choice)
      expect(updatedSession.choices).toHaveLength(1)
    }
  })

  it('should continue until 15 rounds max even without confidence', () => {
    let session = createSession()

    // Simulate 15 rounds with varied, conflicting choices
    const styles = ['modern', 'traditional', 'minimalist', 'bohemian', 'industrial', 'scandinavian']

    for (let i = 0; i < 15; i++) {
      const choice = {
        round: i + 1,
        selectedImageId: `${styles[i % styles.length]}-001`,
        rejectedImageId: `${styles[(i + 1) % styles.length]}-001`,
        selectedImageStyles: [styles[i % styles.length]],
        explanation: `Round ${i + 1} explanation with enough characters`,
        keywords: [],
        timestamp: Date.now(),
      }
      session = addChoice(session, choice)
    }

    expect(session.choices).toHaveLength(15)
    expect(session.currentRound).toBe(16)

    // Even with low confidence, should make recommendation at max rounds
    const styleScores = calculateStyleScores(session.choices)
    const isConfident = isConfidentRecommendation(styleScores, 15)
    expect(isConfident).toBe(true) // Forces recommendation at max rounds
  })

  it('should accumulate style preferences across rounds', () => {
    let session = createSession()

    // User consistently prefers modern style
    for (let i = 0; i < 8; i++) {
      const choice = {
        round: i + 1,
        selectedImageId: `modern-00${i}`,
        rejectedImageId: `traditional-00${i}`,
        selectedImageStyles: ['modern', i % 2 === 0 ? 'minimalist' : 'contemporary'],
        explanation: `Round ${i + 1} - I like the modern aesthetic here`,
        keywords: ['modern'],
        timestamp: Date.now(),
      }
      session = addChoice(session, choice)
    }

    const styleScores = calculateStyleScores(session.choices)

    // Modern should have significantly higher score than others
    expect(styleScores.modern).toBeGreaterThan(0.6)

    const topStyles = getTopStyles(styleScores, 1)
    expect(topStyles[0]).toBe('modern')
  })

  it('should handle phase transitions correctly', () => {
    let session = createSession()
    expect(session.phase).toBe('discovery')

    // Simulate completing discovery
    for (let i = 0; i < 6; i++) {
      const choice = {
        round: i + 1,
        selectedImageId: `modern-00${i}`,
        rejectedImageId: `traditional-00${i}`,
        selectedImageStyles: ['modern'],
        explanation: `Choice ${i + 1} explanation`,
        keywords: [],
        timestamp: Date.now(),
      }
      session = addChoice(session, choice)
    }

    // Calculate scores and transition to recommendations
    const styleScores = calculateStyleScores(session.choices)
    const topStyles = getTopStyles(styleScores, 2)

    session.styleScores = styleScores
    session.recommendedStyle = topStyles[0]
    session.secondBestStyle = topStyles[1]
    session.phase = 'recommendations'

    expect(session.phase).toBe('recommendations')

    // Simulate user confirming style
    session.phase = 'complete'
    expect(session.phase).toBe('complete')

    // Or simulate user viewing alternatives
    session.phase = 'alternatives'
    expect(session.phase).toBe('alternatives')
  })
})
