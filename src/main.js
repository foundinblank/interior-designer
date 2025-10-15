/**
 * Main entry point for Interior Style Discovery App
 */

import { createSession, loadSession, saveSession, addChoice } from './services/sessionManager.js'
import { calculateStyleScores, isConfidentRecommendation, getTopStyles, extractKeywords } from './services/recommendationEngine.js'
import { validateExplanation } from './lib/validators.js'

// Load app data
const stylesData = await fetch('./data/styles.json').then(r => r.json())
const imagesData = await fetch('./data/images.json').then(r => r.json())

const styles = stylesData.styles
const images = imagesData.images

// Initialize or load session
let session = loadSession() || createSession()

// App state
let currentImagePair = null

// Initialize app
init()

function init() {
  renderApp()
  setupKeyboardShortcuts()
}

function renderApp() {
  const appContent = document.getElementById('app-content')

  if (session.phase === 'discovery') {
    renderDiscoveryPhase(appContent)
  } else if (session.phase === 'recommendations') {
    renderRecommendationsPhase(appContent)
  } else if (session.phase === 'complete') {
    renderCompletePhase(appContent)
  }
}

function renderDiscoveryPhase(container) {
  // Get two random images
  currentImagePair = getRandomImagePair()

  container.innerHTML = `
    <div class="discovery-phase">
      <h1>Round ${session.currentRound}</h1>
      <p class="text-muted">Choose the style you prefer</p>

      <div class="image-pair">
        <button class="image-option" data-choice="A" data-image-id="${currentImagePair.imageA.id}">
          <div class="image-label">A</div>
          <img src="${currentImagePair.imageA.url}" alt="${currentImagePair.imageA.alt || 'Living room option A'}" />
        </button>

        <button class="image-option" data-choice="B" data-image-id="${currentImagePair.imageB.id}">
          <div class="image-label">B</div>
          <img src="${currentImagePair.imageB.url}" alt="${currentImagePair.imageB.alt || 'Living room option B'}" />
        </button>
      </div>

      <div class="explanation-form" style="display: none;">
        <label for="explanation">Why did you choose this option?</label>
        <textarea id="explanation" rows="3" placeholder="Tell us what you liked (at least 10 characters)"></textarea>
        <div class="error-text" id="explanation-error" style="display: none;"></div>
        <button id="submit-explanation" class="btn btn-primary">Next Round</button>
      </div>
    </div>
  `

  // Add event listeners
  document.querySelectorAll('.image-option').forEach(btn => {
    btn.addEventListener('click', () => handleImageSelection(btn))
  })

  document.getElementById('submit-explanation')?.addEventListener('click', handleSubmitExplanation)
}

function handleImageSelection(button) {
  const choice = button.dataset.choice
  const imageId = button.dataset.imageId

  // Show explanation form
  const explanationForm = document.querySelector('.explanation-form')
  explanationForm.style.display = 'block'

  // Hide image pair
  document.querySelector('.image-pair').style.opacity = '0.5'

  // Store selected image info
  currentImagePair.selectedChoice = choice
  currentImagePair.selectedImageId = imageId
  currentImagePair.rejectedImageId = choice === 'A' ? currentImagePair.imageB.id : currentImagePair.imageA.id

  // Focus on textarea
  document.getElementById('explanation')?.focus()
}

function handleSubmitExplanation() {
  const explanationEl = document.getElementById('explanation')
  const errorEl = document.getElementById('explanation-error')
  const explanation = explanationEl.value

  // Validate
  const validation = validateExplanation(explanation)
  if (!validation.valid) {
    errorEl.textContent = validation.error
    errorEl.style.display = 'block'
    return
  }

  errorEl.style.display = 'none'

  // Extract keywords
  const keywords = extractKeywords(explanation)

  // Get selected image
  const selectedImage = images.find(img => img.id === currentImagePair.selectedImageId)

  // Create choice
  const choice = {
    round: session.currentRound,
    selectedImageId: currentImagePair.selectedImageId,
    rejectedImageId: currentImagePair.rejectedImageId,
    selectedImageStyles: [selectedImage.primaryStyle, ...selectedImage.secondaryStyles],
    explanation,
    keywords,
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
}

function renderRecommendationsPhase(container) {
  const style = styles.find(s => s.id === session.recommendedStyle)
  const recommendedImages = images.filter(img =>
    img.primaryStyle === session.recommendedStyle ||
    img.secondaryStyles.includes(session.recommendedStyle)
  ).slice(0, 10)

  container.innerHTML = `
    <div class="recommendations-phase">
      <h1>Your Style: ${style?.displayName}</h1>
      <p>${style?.description}</p>

      <div class="recommendation-grid">
        ${recommendedImages.map(img => `
          <div class="recommendation-image">
            <img src="${img.url}" alt="${img.alt || 'Recommended living room'}" />
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
    alert('Alternative styles or restart functionality would be implemented here (Phase 4)')
  })
}

function renderCompletePhase(container) {
  const style = styles.find(s => s.id === session.recommendedStyle)

  container.innerHTML = `
    <div class="complete-phase">
      <h1>✓ Style Discovered!</h1>
      <p>Your interior design style is: <strong>${style?.displayName}</strong></p>
      <p>${style?.description}</p>
      <button id="restart" class="btn btn-primary">Discover Another Style</button>
    </div>
  `

  document.getElementById('restart')?.addEventListener('click', () => {
    session = createSession()
    saveSession(session)
    renderApp()
  })
}

function getRandomImagePair() {
  if (images.length < 2) {
    throw new Error('Not enough images available')
  }

  // Get two different random images
  const shuffled = [...images].sort(() => Math.random() - 0.5)
  return {
    imageA: shuffled[0],
    imageB: shuffled[1],
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // A/B shortcuts for image selection
    if (e.key === 'a' || e.key === 'A') {
      document.querySelector('[data-choice="A"]')?.click()
    } else if (e.key === 'b' || e.key === 'B') {
      document.querySelector('[data-choice="B"]')?.click()
    } else if (e.key === 'Escape') {
      // Escape to cancel (basic implementation)
      const explanationForm = document.querySelector('.explanation-form')
      if (explanationForm && explanationForm.style.display !== 'none') {
        explanationForm.style.display = 'none'
        document.querySelector('.image-pair').style.opacity = '1'
      }
    }
  })
}
