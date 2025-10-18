import { describe, it, expect, beforeEach } from 'vitest'
import { createSession, addChoice, saveSession } from '@/services/sessionManager.js'
import { calculateStyleScores, getTopStyles, generateRecommendationSet, getSecondBestStyle } from '@/services/recommendationEngine.js'

// Mock image data for testing
const mockImages = [
  { id: 'modern-001', url: 'https://example.com/modern-001.jpg', primaryStyle: 'modern', secondaryStyles: ['minimalist'], alt: 'Modern room 1' },
  { id: 'modern-002', url: 'https://example.com/modern-002.jpg', primaryStyle: 'modern', secondaryStyles: [], alt: 'Modern room 2' },
  { id: 'modern-003', url: 'https://example.com/modern-003.jpg', primaryStyle: 'modern', secondaryStyles: ['industrial'], alt: 'Modern room 3' },
  { id: 'modern-004', url: 'https://example.com/modern-004.jpg', primaryStyle: 'modern', secondaryStyles: [], alt: 'Modern room 4' },
  { id: 'traditional-001', url: 'https://example.com/traditional-001.jpg', primaryStyle: 'traditional', secondaryStyles: [], alt: 'Traditional room 1' },
  { id: 'traditional-002', url: 'https://example.com/traditional-002.jpg', primaryStyle: 'traditional', secondaryStyles: [], alt: 'Traditional room 2' },
  { id: 'minimalist-001', url: 'https://example.com/minimalist-001.jpg', primaryStyle: 'minimalist', secondaryStyles: ['modern'], alt: 'Minimalist room 1' },
  { id: 'minimalist-002', url: 'https://example.com/minimalist-002.jpg', primaryStyle: 'minimalist', secondaryStyles: ['scandinavian'], alt: 'Minimalist room 2' },
  { id: 'bohemian-001', url: 'https://example.com/bohemian-001.jpg', primaryStyle: 'bohemian', secondaryStyles: [], alt: 'Bohemian room 1' },
  { id: 'industrial-001', url: 'https://example.com/industrial-001.jpg', primaryStyle: 'industrial', secondaryStyles: ['modern'], alt: 'Industrial room 1' },
  { id: 'scandinavian-001', url: 'https://example.com/scandinavian-001.jpg', primaryStyle: 'scandinavian', secondaryStyles: ['minimalist'], alt: 'Scandinavian room 1' },
  { id: 'scandinavian-002', url: 'https://example.com/scandinavian-002.jpg', primaryStyle: 'scandinavian', secondaryStyles: [], alt: 'Scandinavian room 2' },
]

describe('Recommendation Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should generate 10 recommendations matching the discovered style', () => {
    // Step 1: Create session and simulate discovery completion
    let session = createSession()

    // Add 6 choices favoring modern style
    const mockChoices = [
      { round: 1, selectedImageId: 'modern-001', rejectedImageId: 'traditional-001', selectedImageStyles: ['modern', 'minimalist'], explanation: 'Clean lines', keywords: ['clean'], timestamp: Date.now() },
      { round: 2, selectedImageId: 'modern-002', rejectedImageId: 'bohemian-001', selectedImageStyles: ['modern'], explanation: 'Simple design', keywords: ['simple'], timestamp: Date.now() },
      { round: 3, selectedImageId: 'minimalist-001', rejectedImageId: 'traditional-002', selectedImageStyles: ['minimalist', 'modern'], explanation: 'Less is more', keywords: [], timestamp: Date.now() },
      { round: 4, selectedImageId: 'modern-003', rejectedImageId: 'industrial-001', selectedImageStyles: ['modern', 'industrial'], explanation: 'Contemporary', keywords: [], timestamp: Date.now() },
      { round: 5, selectedImageId: 'modern-004', rejectedImageId: 'scandinavian-001', selectedImageStyles: ['modern'], explanation: 'Sleek furniture', keywords: ['furniture'], timestamp: Date.now() },
      { round: 6, selectedImageId: 'minimalist-002', rejectedImageId: 'bohemian-002', selectedImageStyles: ['minimalist', 'scandinavian'], explanation: 'Neutral colors', keywords: ['neutral', 'colors'], timestamp: Date.now() },
    ]

    mockChoices.forEach(choice => {
      session = addChoice(session, choice)
    })

    // Step 2: Calculate style scores and determine recommended style
    session.styleScores = calculateStyleScores(session.choices)
    const topStyles = getTopStyles(session.styleScores, 2)
    session.recommendedStyle = topStyles[0]
    session.secondBestStyle = topStyles[1]
    session.phase = 'recommendations'

    // Step 3: Generate recommendation set
    const shownImageIds = session.choices.map(c => c.selectedImageId)
    const recommendations = generateRecommendationSet(session.recommendedStyle, shownImageIds, 10, mockImages)

    // Assertions
    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations)).toBe(true)
    expect(recommendations.length).toBeLessThanOrEqual(10)

    // All recommendations should match the discovered style
    recommendations.forEach(img => {
      const isMatch = img.primaryStyle === session.recommendedStyle || img.secondaryStyles.includes(session.recommendedStyle)
      expect(isMatch).toBe(true)
    })

    // Should not include images already shown during discovery
    recommendations.forEach(img => {
      expect(shownImageIds).not.toContain(img.id)
    })
  })

  it('should handle confirm flow - transition from recommendations to complete', () => {
    // Setup: Session in recommendations phase
    let session = createSession()
    session.phase = 'recommendations'
    session.recommendedStyle = 'modern'
    session.styleScores = { modern: 0.85, minimalist: 0.60, traditional: 0.20 }

    // User confirms the style
    session.phase = 'complete'
    saveSession(session)

    // Verify phase transition
    expect(session.phase).toBe('complete')
    expect(session.recommendedStyle).toBe('modern')
  })

  it('should handle reject flow - show alternative style recommendations', () => {
    // Setup: Session in recommendations phase
    let session = createSession()
    session.phase = 'recommendations'
    session.recommendedStyle = 'modern'
    session.styleScores = { modern: 0.75, minimalist: 0.60, traditional: 0.20, bohemian: 0.15 }

    // User rejects the recommendation
    const alternativeStyle = getSecondBestStyle(session.styleScores)
    expect(alternativeStyle).toBe('minimalist')

    // Transition to alternatives phase
    session.recommendedStyle = alternativeStyle
    session.phase = 'alternatives'
    saveSession(session)

    // Verify alternative recommendations
    const shownImageIds = []
    const alternativeRecommendations = generateRecommendationSet(session.recommendedStyle, shownImageIds, 10, mockImages)

    expect(session.phase).toBe('alternatives')
    expect(session.recommendedStyle).toBe('minimalist')
    expect(alternativeRecommendations.length).toBeGreaterThan(0)

    // All alternative recommendations should match the alternative style
    alternativeRecommendations.forEach(img => {
      const isMatch = img.primaryStyle === 'minimalist' || img.secondaryStyles.includes('minimalist')
      expect(isMatch).toBe(true)
    })
  })

  it('should handle reject flow when no alternative style available', () => {
    // Setup: Session with only one style having significant score
    let session = createSession()
    session.phase = 'recommendations'
    session.recommendedStyle = 'modern'
    session.styleScores = { modern: 0.95 } // Only one style

    // Try to get alternative
    const alternativeStyle = getSecondBestStyle(session.styleScores)
    expect(alternativeStyle).toBeNull()

    // When no alternative, should offer restart
    if (!alternativeStyle) {
      // Simulate user choosing to restart
      session = createSession()
      session.phase = 'discovery'
      session.currentRound = 1
    }

    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)
    expect(session.choices).toHaveLength(0)
  })

  it('should handle full flow: discovery -> recommendations -> reject -> alternatives -> confirm', () => {
    // Step 1: Discovery phase - 6 choices
    let session = createSession()
    expect(session.phase).toBe('discovery')

    const mockChoices = [
      { round: 1, selectedImageId: 'modern-001', rejectedImageId: 'traditional-001', selectedImageStyles: ['modern'], explanation: 'Modern look', keywords: ['modern'], timestamp: Date.now() },
      { round: 2, selectedImageId: 'modern-002', rejectedImageId: 'bohemian-001', selectedImageStyles: ['modern'], explanation: 'Clean style', keywords: ['clean'], timestamp: Date.now() },
      { round: 3, selectedImageId: 'minimalist-001', rejectedImageId: 'industrial-001', selectedImageStyles: ['minimalist', 'modern'], explanation: 'Minimal design', keywords: [], timestamp: Date.now() },
      { round: 4, selectedImageId: 'scandinavian-001', rejectedImageId: 'traditional-002', selectedImageStyles: ['scandinavian', 'minimalist'], explanation: 'Light wood', keywords: ['light', 'wood'], timestamp: Date.now() },
      { round: 5, selectedImageId: 'minimalist-002', rejectedImageId: 'bohemian-002', selectedImageStyles: ['minimalist', 'scandinavian'], explanation: 'Simple and clean', keywords: ['simple', 'clean'], timestamp: Date.now() },
      { round: 6, selectedImageId: 'scandinavian-002', rejectedImageId: 'industrial-002', selectedImageStyles: ['scandinavian'], explanation: 'Cozy feeling', keywords: ['cozy'], timestamp: Date.now() },
    ]

    mockChoices.forEach(choice => {
      session = addChoice(session, choice)
    })

    // Step 2: Calculate scores and transition to recommendations
    session.styleScores = calculateStyleScores(session.choices)
    const topStyles = getTopStyles(session.styleScores, 2)
    session.recommendedStyle = topStyles[0]
    session.secondBestStyle = topStyles[1]
    session.phase = 'recommendations'

    expect(session.phase).toBe('recommendations')
    expect(session.recommendedStyle).toBeTruthy()

    // Step 3: User rejects recommendation -> alternatives
    const alternativeStyle = getSecondBestStyle(session.styleScores)
    expect(alternativeStyle).toBeTruthy()

    session.recommendedStyle = alternativeStyle
    session.phase = 'alternatives'

    expect(session.phase).toBe('alternatives')

    // Step 4: User confirms alternative -> complete
    session.phase = 'complete'

    expect(session.phase).toBe('complete')
    expect(session.recommendedStyle).toBe(alternativeStyle)
  })

  it('should exclude discovery images from recommendations', () => {
    // Setup session with some discovery choices
    let session = createSession()

    const mockChoices = [
      { round: 1, selectedImageId: 'modern-001', rejectedImageId: 'traditional-001', selectedImageStyles: ['modern'], explanation: 'Test', keywords: [], timestamp: Date.now() },
      { round: 2, selectedImageId: 'modern-002', rejectedImageId: 'traditional-002', selectedImageStyles: ['modern'], explanation: 'Test', keywords: [], timestamp: Date.now() },
    ]

    mockChoices.forEach(choice => {
      session = addChoice(session, choice)
    })

    // Generate recommendations
    const shownImageIds = session.choices.map(c => c.selectedImageId)
    const recommendations = generateRecommendationSet('modern', shownImageIds, 10, mockImages)

    // Verify no overlap
    recommendations.forEach(img => {
      expect(shownImageIds).not.toContain(img.id)
    })

    expect(recommendations).not.toContainEqual(expect.objectContaining({ id: 'modern-001' }))
    expect(recommendations).not.toContainEqual(expect.objectContaining({ id: 'modern-002' }))
  })

  it('should handle restart from alternatives phase', () => {
    // Setup: Session in alternatives phase
    let session = createSession()
    session.phase = 'alternatives'
    session.recommendedStyle = 'minimalist'
    session.styleScores = { modern: 0.75, minimalist: 0.60 }
    session.choices = [
      { round: 1, selectedImageId: 'modern-001', rejectedImageId: 'traditional-001', selectedImageStyles: ['modern'], explanation: 'Test', keywords: [], timestamp: Date.now() },
    ]

    // User chooses to restart
    session = createSession()
    saveSession(session)

    // Verify fresh start
    expect(session.phase).toBe('discovery')
    expect(session.currentRound).toBe(1)
    expect(session.choices).toHaveLength(0)
    expect(session.recommendedStyle).toBeNull()
    expect(session.styleScores).toEqual({})
  })

  it('should maintain data consistency across phase transitions', () => {
    let session = createSession()
    const originalSessionId = session.id

    // Add choices
    session = addChoice(session, {
      round: 1,
      selectedImageId: 'modern-001',
      rejectedImageId: 'traditional-001',
      selectedImageStyles: ['modern'],
      explanation: 'Clean lines',
      keywords: ['clean'],
      timestamp: Date.now(),
    })

    // Transition through phases
    session.phase = 'recommendations'
    session.recommendedStyle = 'modern'
    session.styleScores = { modern: 0.85 }
    saveSession(session)

    // Session ID should remain constant
    expect(session.id).toBe(originalSessionId)

    session.phase = 'alternatives'
    session.recommendedStyle = 'minimalist'
    saveSession(session)

    expect(session.id).toBe(originalSessionId)

    session.phase = 'complete'
    saveSession(session)

    expect(session.id).toBe(originalSessionId)
    expect(session.choices).toHaveLength(1)
  })
})
