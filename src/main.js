/**
 * Main entry point for Interior Style Discovery App
 */

import { createSession, loadSession, saveSession, addChoice } from './services/sessionManager.js'
import { calculateStyleScores, isConfidentRecommendation, getTopStyles, extractKeywords, generateRecommendationSet, getSecondBestStyle } from './services/recommendationEngine.js'
import { validateExplanation } from './lib/validators.js'
import { analyzeExplanation } from './services/llmAnalyzer.js'
import { showSettingsModal } from './components/SettingsModal.js'
import { showConfirmModal } from './components/ConfirmModal.js'
import { getApiKey } from './lib/apiKeyStorage.js'

// Import app data as modules (Vite handles this)
import stylesData from './data/styles.json'
import imagesData from './data/images.json'

const styles = stylesData.styles
const images = imagesData.images

// Initialize or load session
let session = loadSession() || createSession()

// App state
let currentImagePair = null

// Filter out broken/invalid images on startup
let validImages = []

// Initialize app
init()

async function init() {
  // Validate images before starting
  validImages = await validateImages(images)
  console.log(`Loaded ${validImages.length} valid images out of ${images.length}`)

  if (validImages.length < 2) {
    document.getElementById('app-content').innerHTML = `
      <div class="error-state">
        <h1>⚠️ Not enough images available</h1>
        <p>We need at least 2 valid images to run the style discovery. Please check the image URLs in images.json</p>
      </div>
    `
    return
  }

  renderApp()
  setupKeyboardShortcuts()
}

async function validateImages(imagesToValidate) {
  const validationPromises = imagesToValidate.map(async (img) => {
    try {
      await new Promise((resolve, reject) => {
        const testImg = new Image()
        testImg.onload = () => resolve()
        testImg.onerror = () => reject(new Error(`Failed to load: ${img.url}`))
        testImg.src = img.url

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Timeout')), 5000)
      })
      return img
    } catch (error) {
      console.warn(`Image validation failed for ${img.id}:`, error.message)
      return null
    }
  })

  const results = await Promise.all(validationPromises)
  return results.filter(img => img !== null)
}

function renderApp() {
  const appContent = document.getElementById('app-content')

  if (session.phase === 'discovery') {
    renderDiscoveryPhase(appContent)
  } else if (session.phase === 'recommendations') {
    renderRecommendationsPhase(appContent)
  } else if (session.phase === 'alternatives') {
    renderAlternativesPhase(appContent)
  } else if (session.phase === 'complete') {
    renderCompletePhase(appContent)
  }
}

function renderDiscoveryPhase(container) {
  // Get two random images
  currentImagePair = getRandomImagePair()

  // Calculate progress (6-15 rounds expected)
  const progress = Math.min((session.currentRound / 12) * 100, 100)

  container.innerHTML = `
    <!-- Settings button -->
    <button id="settings-btn" class="settings-btn" aria-label="Settings" title="Configure API key for enhanced analysis">
      ⚙️
    </button>

    <!-- Progress bar -->
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>

    <!-- Round number -->
    <div class="round-number">Round ${session.currentRound} of ~12</div>

    <!-- Question -->
    <div class="question-container" id="image-selection-container">
      <div class="question-text">
        Which living room speaks to you?
        <div class="question-subtitle">Press A or B, or click to choose</div>
      </div>

      <div class="typeform-image-pair">
        <button class="typeform-image-option" data-choice="A" data-image-id="${currentImagePair.imageA.id}">
          <div class="typeform-image-label">A</div>
          <img src="${currentImagePair.imageA.url}" alt="${currentImagePair.imageA.alt || 'Living room option A'}" loading="lazy" />
          <div class="typeform-image-hint">Press A or click</div>
        </button>

        <button class="typeform-image-option" data-choice="B" data-image-id="${currentImagePair.imageB.id}">
          <div class="typeform-image-label">B</div>
          <img src="${currentImagePair.imageB.url}" alt="${currentImagePair.imageB.alt || 'Living room option B'}" loading="lazy" />
          <div class="typeform-image-hint">Press B or click</div>
        </button>
      </div>
    </div>

    <!-- Explanation form (hidden initially) -->
    <div class="question-container question-container-hidden" id="explanation-container">
      <div class="question-text">
        What drew you to that choice?
        <div class="question-subtitle">Tell us what caught your eye (at least 10 characters)</div>
      </div>

      <div class="typeform-explanation">
        <textarea
          id="explanation"
          class="typeform-textarea"
          placeholder="I like the colors, the lighting, the open space..."
          autofocus
        ></textarea>
        <div class="typeform-hint">✨ Tip: Press Shift+Enter to submit</div>
        <div id="explanation-error" class="typeform-error" style="display: none;"></div>
        <br>
        <button id="submit-explanation" class="typeform-submit">
          Continue →
        </button>
      </div>
    </div>
  `

  // Add event listeners
  document.querySelectorAll('.typeform-image-option').forEach(btn => {
    btn.addEventListener('click', () => handleImageSelection(btn))
  })

  document.getElementById('submit-explanation')?.addEventListener('click', handleSubmitExplanation)
  document.getElementById('settings-btn')?.addEventListener('click', showSettingsModal)
}

function handleImageSelection(button) {
  const choice = button.dataset.choice
  const imageId = button.dataset.imageId

  // Store selected image info
  currentImagePair.selectedChoice = choice
  currentImagePair.selectedImageId = imageId
  currentImagePair.rejectedImageId = choice === 'A' ? currentImagePair.imageB.id : currentImagePair.imageA.id

  // Hide image selection and show explanation in one smooth transition
  const imageContainer = document.getElementById('image-selection-container')
  const explanationContainer = document.getElementById('explanation-container')

  // Add fade-out class to image container
  imageContainer.classList.add('question-container-hidden')

  setTimeout(() => {
    // Remove fade-out class from explanation container to show it
    explanationContainer.classList.remove('question-container-hidden')

    // Focus on textarea
    setTimeout(() => {
      document.getElementById('explanation')?.focus()
    }, 100)
  }, 400)
}

async function handleSubmitExplanation() {
  const explanationEl = document.getElementById('explanation')
  const errorEl = document.getElementById('explanation-error')
  const submitBtn = document.getElementById('submit-explanation')
  const explanation = explanationEl.value

  // Validate
  const validation = validateExplanation(explanation)
  if (!validation.valid) {
    errorEl.textContent = validation.error
    errorEl.style.display = 'block'
    return
  }

  errorEl.style.display = 'none'

  // Disable submit button during analysis
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = 'Analyzing...'
  }

  try {
    // Get API key if available
    const apiKey = getApiKey()

    // Use LLM analyzer (with automatic fallback to keywords if no API key)
    const analysis = await analyzeExplanation(explanation, apiKey)

    // Extract keywords and enhanced data
    const keywords = analysis.keywords
    const emotions = analysis.emotions || []
    const styleIndicators = analysis.style_indicators || []

    // Get selected image
    const selectedImage = images.find(img => img.id === currentImagePair.selectedImageId)

    // Create choice with enhanced analysis
    const choice = {
      round: session.currentRound,
      selectedImageId: currentImagePair.selectedImageId,
      rejectedImageId: currentImagePair.rejectedImageId,
      selectedImageStyles: [selectedImage.primaryStyle, ...selectedImage.secondaryStyles],
      explanation,
      keywords,
      emotions, // Enhanced by LLM
      styleIndicators, // Enhanced by LLM
      analysisSource: analysis.source, // Track whether LLM or keyword extraction was used
      timestamp: Date.now(),
    }

    // Add choice to session
    session = addChoice(session, choice)

    // Calculate scores
    session.styleScores = calculateStyleScores(session.choices)

    // Check if ready for recommendation
    if (isConfidentRecommendation(session.styleScores, session.currentRound - 1)) {
      const topStyles = getTopStyles(session.styleScores, 2)
      session.recommendedStyle = topStyles[0]
      session.secondBestStyle = topStyles[1]
      session.phase = 'recommendations'
    }

    // Save session
    saveSession(session)

    // Re-render
    renderApp()
  } catch (error) {
    console.error('Error analyzing explanation:', error)
    errorEl.textContent = 'An error occurred. Please try again.'
    errorEl.style.display = 'block'

    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = 'Continue →'
    }
  }
}

function renderRecommendationsPhase(container) {
  const style = styles.find(s => s.id === session.recommendedStyle)

  // Get images already shown during discovery
  const shownImageIds = session.choices.map(c => c.selectedImageId)

  // Generate recommendation set using the new function
  const recommendedImages = generateRecommendationSet(
    session.recommendedStyle,
    shownImageIds,
    10,
    validImages
  )

  container.innerHTML = `
    <div class="recommendations-phase">
      <h1>Your Style: ${style?.displayName}</h1>
      <p>${style?.description}</p>

      <div class="recommendation-grid">
        ${recommendedImages.map(img => `
          <div class="recommendation-image">
            <img src="${img.url}" alt="${img.alt || 'Recommended living room'}" loading="lazy" />
          </div>
        `).join('')}
      </div>

      <div class="confirmation-prompt">
        <p>Does this match your style?</p>
        <button id="confirm-style" class="btn btn-primary">Yes, this is perfect!</button>
        <button id="reject-style" class="btn btn-secondary">Not quite</button>
      </div>
    </div>
  `

  document.getElementById('confirm-style')?.addEventListener('click', () => {
    session.phase = 'complete'
    saveSession(session)
    renderApp()
  })

  document.getElementById('reject-style')?.addEventListener('click', () => {
    handleRejection()
  })
}

async function handleRejection() {
  // Get second best style
  const alternativeStyle = getSecondBestStyle(session.styleScores)

  if (alternativeStyle) {
    // Show alternative style
    session.recommendedStyle = alternativeStyle
    session.phase = 'alternatives'
    saveSession(session)
    renderAlternativesPhase(document.getElementById('app-content'))
  } else {
    // No alternative available, offer restart
    const confirmed = await showConfirmModal({
      title: 'No Alternative Styles',
      message: 'We don\'t have enough data to suggest an alternative style. Would you like to start over and discover your style again?',
      confirmText: 'Start Over',
      cancelText: 'Stay Here',
      type: 'info'
    })

    if (confirmed) {
      session = createSession()
      saveSession(session)
      renderApp()
    }
  }
}

function renderAlternativesPhase(container) {
  const style = styles.find(s => s.id === session.recommendedStyle)

  // Get images already shown
  const shownImageIds = session.choices.map(c => c.selectedImageId)

  // Generate alternative recommendations
  const recommendedImages = generateRecommendationSet(
    session.recommendedStyle,
    shownImageIds,
    10,
    validImages
  )

  container.innerHTML = `
    <div class="recommendations-phase">
      <h1>How about: ${style?.displayName}?</h1>
      <p>${style?.description}</p>

      <div class="recommendation-grid">
        ${recommendedImages.map(img => `
          <div class="recommendation-image">
            <img src="${img.url}" alt="${img.alt || 'Alternative living room recommendation'}" loading="lazy" />
          </div>
        `).join('')}
      </div>

      <div class="confirmation-prompt">
        <p>Is this more your style?</p>
        <button id="confirm-alternative" class="btn btn-primary">Yes, I love it!</button>
        <button id="restart-from-alternatives" class="btn btn-secondary">Start Over</button>
      </div>
    </div>
  `

  document.getElementById('confirm-alternative')?.addEventListener('click', () => {
    session.phase = 'complete'
    saveSession(session)
    renderApp()
  })

  document.getElementById('restart-from-alternatives')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
      title: 'Start Over?',
      message: 'Are you sure you want to restart the style discovery process? Your current progress will be lost.',
      confirmText: 'Start Over',
      cancelText: 'Cancel',
      type: 'warning'
    })

    if (confirmed) {
      session = createSession()
      saveSession(session)
      renderApp()
    }
  })
}

function renderCompletePhase(container) {
  const style = styles.find(s => s.id === session.recommendedStyle)

  container.innerHTML = `
    <div class="question-container">
      <div class="complete-phase">
        <h1 style="color: white; font-size: 3rem; margin-bottom: var(--spacing-lg);">✓ Style Discovered!</h1>
        <p style="color: white; font-size: 1.5rem; margin-bottom: var(--spacing-md);">
          Your interior design style is: <strong>${style?.displayName}</strong>
        </p>
        <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.125rem; margin-bottom: var(--spacing-xxl); max-width: 600px;">
          ${style?.description}
        </p>
        <button id="restart" class="typeform-submit">Start Over</button>
      </div>
    </div>
  `

  document.getElementById('restart')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
      title: 'Start a New Discovery?',
      message: 'Would you like to discover another style? Your current results will be cleared.',
      confirmText: 'Yes, Start Over',
      cancelText: 'Stay Here',
      type: 'info'
    })

    if (confirmed) {
      session = createSession()
      saveSession(session)
      renderApp()
    }
  })
}

function getRandomImagePair() {
  if (validImages.length < 2) {
    throw new Error('Not enough images available')
  }

  // Get two different random images from valid images only
  const shuffled = [...validImages].sort(() => Math.random() - 0.5)
  return {
    imageA: shuffled[0],
    imageB: shuffled[1],
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when user is typing in a text field
    const isTyping = e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT'

    // Shift+Enter to submit explanation
    if (e.key === 'Enter' && e.shiftKey) {
      const submitBtn = document.getElementById('submit-explanation')
      if (submitBtn && isTyping) {
        e.preventDefault()
        submitBtn.click()
        return
      }
    }

    // Don't process other shortcuts while typing
    if (isTyping && e.key !== 'Escape') {
      return
    }

    // A/B shortcuts for image selection (only when not typing)
    if (e.key === 'a' || e.key === 'A') {
      document.querySelector('[data-choice="A"]')?.click()
    } else if (e.key === 'b' || e.key === 'B') {
      document.querySelector('[data-choice="B"]')?.click()
    } else if (e.key === 'Escape') {
      // Escape to cancel
      const explanationForm = document.querySelector('.explanation-form')
      if (explanationForm && explanationForm.style.display !== 'none') {
        explanationForm.style.display = 'none'
        document.querySelector('.image-pair').style.opacity = '1'
        document.getElementById('explanation').value = ''
      }
    }
  })
}
