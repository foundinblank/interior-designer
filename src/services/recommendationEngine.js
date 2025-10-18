/**
 * Recommendation engine for Interior Style Discovery App
 * Analyzes user choices and calculates style preferences
 */

// Design-related keywords for extraction
const DESIGN_KEYWORDS = [
  'color', 'colors', 'bright', 'dark', 'neutral', 'vibrant',
  'style', 'modern', 'traditional', 'minimalist', 'cozy', 'contemporary',
  'furniture', 'sofa', 'table', 'chair', 'lighting',
  'space', 'open', 'compact', 'airy', 'cluttered',
  'texture', 'wood', 'metal', 'fabric', 'glass',
  'clean', 'simple', 'elegant', 'ornate', 'sleek',
  'light', 'natural', 'warm', 'cool',
]

/**
 * Extracts design-related keywords from user explanation
 * @param {string} explanation - User's explanation text
 * @returns {string[]} Array of extracted keywords
 */
export function extractKeywords(explanation) {
  const words = explanation.toLowerCase().split(/\s+/)
  return words.filter(word => DESIGN_KEYWORDS.includes(word))
}

/**
 * Calculates weighted style scores based on user choices
 * @param {Choice[]} choices - Array of user choices
 * @returns {Object} Map of style ID to confidence score (0-1)
 */
export function calculateStyleScores(choices) {
  if (!choices || choices.length === 0) {
    return {}
  }

  const styleCounts = {}
  const keywordCounts = {}

  // Count style selections and keyword occurrences
  choices.forEach(choice => {
    const { selectedImageStyles, keywords } = choice

    // Primary style (first in array) gets higher weight
    const primaryStyle = selectedImageStyles[0]
    if (primaryStyle) {
      styleCounts[primaryStyle] = (styleCounts[primaryStyle] || 0) + 2.0
    }

    // Secondary styles get lower weight
    selectedImageStyles.slice(1).forEach(style => {
      styleCounts[style] = (styleCounts[style] || 0) + 1.0
    })

    // Count keywords
    keywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
    })
  })

  // Boost scores based on keyword matching (simple heuristic)
  Object.keys(styleCounts).forEach(style => {
    const styleKeywords = DESIGN_KEYWORDS.filter(kw => kw.includes(style) || style.includes(kw))
    const matchingKeywordCount = styleKeywords.reduce((sum, kw) => {
      return sum + (keywordCounts[kw] || 0)
    }, 0)

    // Boost score by keyword matches (up to 20% boost)
    styleCounts[style] += matchingKeywordCount * 0.1
  })

  // Normalize scores to 0-1 range
  const maxScore = Math.max(...Object.values(styleCounts))
  const normalizedScores = {}

  Object.keys(styleCounts).forEach(style => {
    normalizedScores[style] = styleCounts[style] / maxScore
  })

  return normalizedScores
}

/**
 * Determines if recommendation can be made with confidence
 * @param {Object} styleScores - Map of style to confidence score
 * @param {number} minRounds - Minimum rounds before recommendation (default: 6)
 * @returns {boolean} True if confident recommendation can be made
 */
export function isConfidentRecommendation(styleScores, minRounds = 6) {
  if (!styleScores || Object.keys(styleScores).length === 0) {
    return false
  }

  // At max rounds (15), always make a recommendation (graceful degradation)
  if (minRounds >= 15) {
    return true
  }

  // Need at least 6 rounds
  if (minRounds < 6) {
    return false
  }

  // Get top 2 scores
  const scores = Object.values(styleScores).sort((a, b) => b - a)
  const topScore = scores[0]
  const secondScore = scores[1] || 0

  // Confidence threshold: top score must be significantly higher than second
  // At least 0.6 confidence AND 20% gap from second place
  const hasHighConfidence = topScore >= 0.6
  const hasClearWinner = topScore - secondScore >= 0.2

  return hasHighConfidence && hasClearWinner
}

/**
 * Gets top N styles by score
 * @param {Object} styleScores - Map of style to confidence score
 * @param {number} count - Number of top styles to return (default: 2)
 * @returns {string[]} Array of style IDs sorted by score (descending)
 */
export function getTopStyles(styleScores, count = 2) {
  if (!styleScores || Object.keys(styleScores).length === 0) {
    return []
  }

  return Object.entries(styleScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .slice(0, count)
    .map(([style]) => style)
}

/**
 * Gets the second best style (fallback/alternative recommendation)
 * @param {Object} styleScores - Map of style to confidence score
 * @returns {string|null} Second best style ID or null if not available
 */
export function getSecondBestStyle(styleScores) {
  const topTwo = getTopStyles(styleScores, 2)
  return topTwo.length >= 2 ? topTwo[1] : null
}

/**
 * Generates a recommendation set for a given style
 * @param {string} styleId - Style ID to generate recommendations for
 * @param {string[]} excludeImageIds - Image IDs to exclude (already shown)
 * @param {number} count - Number of recommendations to generate (default: 10)
 * @param {Image[]} allImages - All available images
 * @returns {Image[]} Array of recommended images
 */
export function generateRecommendationSet(styleId, excludeImageIds = [], count = 10, allImages) {
  // Filter images matching the style (primary or secondary)
  // Separate primary and secondary matches for prioritization
  const primaryMatches = []
  const secondaryMatches = []

  allImages.forEach(img => {
    const notExcluded = !excludeImageIds.includes(img.id)
    if (!notExcluded) return

    if (img.primaryStyle === styleId) {
      primaryMatches.push(img)
    } else if (img.secondaryStyles.includes(styleId)) {
      secondaryMatches.push(img)
    }
  })

  // Shuffle primary and secondary separately, then concatenate
  // This ensures primary matches appear first
  const shuffledPrimary = shuffleArray(primaryMatches)
  const shuffledSecondary = shuffleArray(secondaryMatches)

  // Combine and take top N
  const selectedImages = [...shuffledPrimary, ...shuffledSecondary].slice(0, count)

  return selectedImages
}

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Calculates estimated remaining rounds based on current confidence
 * @param {Session} session - Current session object
 * @returns {number} Estimated remaining rounds (or null if unknown)
 */
export function calculateEstimatedRounds(session) {
  const { currentRound, styleScores } = session

  if (currentRound < 3) {
    return null // Too early to estimate
  }

  if (!styleScores || Object.keys(styleScores).length === 0) {
    return 10 // Default estimate if no scores yet
  }

  // Get top score
  const topScore = Math.max(...Object.values(styleScores))

  // Estimate based on confidence
  if (topScore >= 0.7) {
    return Math.max(0, 8 - currentRound) // ~2-3 more rounds
  } else if (topScore >= 0.5) {
    return Math.max(0, 10 - currentRound) // ~4-5 more rounds
  } else {
    return Math.max(0, 12 - currentRound) // ~6-8 more rounds
  }
}

/**
 * Formats progress message for display
 * @param {number} currentRound - Current round number
 * @param {number|null} estimatedRemaining - Estimated rounds remaining
 * @returns {string} Progress message
 */
export function getProgressMessage(currentRound, estimatedRemaining) {
  if (estimatedRemaining === null) {
    return `Round ${currentRound}`
  }

  if (estimatedRemaining === 0) {
    return `Round ${currentRound} - Almost there!`
  }

  if (estimatedRemaining <= 3) {
    return `Round ${currentRound} - About ${estimatedRemaining} more ${estimatedRemaining === 1 ? 'round' : 'rounds'}`
  }

  // Range estimate for more than 3 rounds
  const min = Math.max(1, estimatedRemaining - 2)
  const max = estimatedRemaining + 2
  return `Round ${currentRound} - About ${min}-${max} more rounds`
}
