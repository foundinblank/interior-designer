/**
 * Confirm Modal component for user confirmations
 * Reusable modal for confirm/cancel actions
 */

let modalElement = null
let resolveCallback = null

/**
 * Shows a confirmation modal
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {string} options.type - Modal type: "warning", "info", "danger" (default: "warning")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(options = {}) {
  const {
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
  } = options

  return new Promise((resolve) => {
    resolveCallback = resolve

    // Remove existing modal if any
    if (modalElement) {
      modalElement.remove()
    }

    // Create modal HTML
    const modal = document.createElement('div')
    modal.id = 'confirm-modal'
    modal.className = 'confirm-modal'
    modal.innerHTML = `
      <div class="confirm-modal-content ${type}">
        <div class="confirm-modal-header">
          <h2>${getIcon(type)} ${title}</h2>
        </div>

        <div class="confirm-modal-body">
          <p>${message}</p>
        </div>

        <div class="confirm-modal-actions">
          <button id="confirm-cancel" class="btn btn-secondary">
            ${cancelText}
          </button>
          <button id="confirm-ok" class="btn btn-primary ${type === 'danger' ? 'btn-danger' : ''}">
            ${confirmText}
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    modalElement = modal

    // Set up event listeners
    setupEventListeners()

    // Show modal with animation
    requestAnimationFrame(() => {
      modal.style.display = 'flex'
      // Focus on cancel button by default
      modal.querySelector('#confirm-cancel')?.focus()
    })
  })
}

/**
 * Hides the confirmation modal
 */
function hideConfirmModal(confirmed) {
  if (modalElement) {
    modalElement.style.display = 'none'
    modalElement.remove()
    modalElement = null
  }

  if (resolveCallback) {
    resolveCallback(confirmed)
    resolveCallback = null
  }
}

/**
 * Sets up event listeners for the modal
 */
function setupEventListeners() {
  if (!modalElement) return

  // Confirm button
  modalElement.querySelector('#confirm-ok')?.addEventListener('click', () => {
    hideConfirmModal(true)
  })

  // Cancel button
  modalElement.querySelector('#confirm-cancel')?.addEventListener('click', () => {
    hideConfirmModal(false)
  })

  // Click outside modal to cancel
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
      hideConfirmModal(false)
    }
  })

  // Keyboard shortcuts
  const handleKeydown = (e) => {
    if (modalElement?.style.display === 'flex') {
      if (e.key === 'Escape') {
        e.preventDefault()
        hideConfirmModal(false)
      } else if (e.key === 'Enter' && e.target.id !== 'confirm-cancel') {
        e.preventDefault()
        hideConfirmModal(true)
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)

  // Clean up listener when modal is hidden
  const originalHide = hideConfirmModal
  hideConfirmModal = (...args) => {
    document.removeEventListener('keydown', handleKeydown)
    originalHide(...args)
  }
}

/**
 * Gets icon for modal type
 * @param {string} type - Modal type
 * @returns {string} - Icon emoji
 */
function getIcon(type) {
  switch (type) {
    case 'warning':
      return '⚠️'
    case 'danger':
      return '⛔'
    case 'info':
      return 'ℹ️'
    case 'success':
      return '✓'
    default:
      return '❓'
  }
}
