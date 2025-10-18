/**
 * Settings Modal component for API key management
 * Allows users to input and save their Claude API key for enhanced analysis
 */

import { saveApiKey, getApiKey, removeApiKey, hasApiKey } from '../lib/apiKeyStorage.js'

let modalElement = null

/**
 * Initializes and shows the settings modal
 */
export function showSettingsModal() {
  if (modalElement) {
    modalElement.style.display = 'flex'
    return
  }

  // Create modal HTML
  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.className = 'settings-modal'
  modal.innerHTML = `
    <div class="settings-modal-content">
      <div class="settings-modal-header">
        <h2>⚙️ Settings</h2>
        <button class="settings-close" aria-label="Close settings">&times;</button>
      </div>

      <div class="settings-modal-body">
        <div class="settings-section">
          <h3>Claude API Key (Optional)</h3>
          <p class="settings-description">
            Add your Claude API key to enable AI-powered analysis of your explanations.
            This provides more accurate style recommendations.
          </p>
          <p class="settings-note">
            <strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers.
            Without an API key, the app uses keyword extraction (which works well too!).
          </p>

          <div class="settings-input-group">
            <label for="api-key-input">Claude API Key</label>
            <input
              type="password"
              id="api-key-input"
              class="settings-input"
              placeholder="sk-ant-..."
              value="${getApiKey() || ''}"
            />
            <div id="api-key-error" class="settings-error" style="display: none;"></div>
          </div>

          <div class="settings-actions">
            <button id="save-api-key" class="btn btn-primary">
              ${hasApiKey() ? 'Update' : 'Save'} API Key
            </button>
            ${hasApiKey() ? '<button id="remove-api-key" class="btn btn-secondary">Remove API Key</button>' : ''}
          </div>

          <div class="settings-status" id="settings-status" style="display: none;"></div>
        </div>

        <div class="settings-section">
          <h3>How to get a Claude API Key</h3>
          <ol class="settings-instructions">
            <li>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></li>
            <li>Sign up or log in to your account</li>
            <li>Navigate to API Keys section</li>
            <li>Create a new API key</li>
            <li>Copy and paste it above</li>
          </ol>
          <p class="settings-note">
            <strong>Cost:</strong> Claude Haiku (used by this app) costs ~$0.25 per million input tokens.
            Each explanation analysis costs less than $0.001.
          </p>
        </div>
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
  })
}

/**
 * Hides the settings modal
 */
export function hideSettingsModal() {
  if (modalElement) {
    modalElement.style.display = 'none'
  }
}

/**
 * Sets up event listeners for the modal
 */
function setupEventListeners() {
  if (!modalElement) return

  // Close button
  modalElement.querySelector('.settings-close')?.addEventListener('click', hideSettingsModal)

  // Click outside modal to close
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
      hideSettingsModal()
    }
  })

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalElement?.style.display === 'flex') {
      hideSettingsModal()
    }
  })

  // Save API key button
  modalElement.querySelector('#save-api-key')?.addEventListener('click', handleSaveApiKey)

  // Remove API key button
  modalElement.querySelector('#remove-api-key')?.addEventListener('click', handleRemoveApiKey)
}

/**
 * Handles saving the API key
 */
function handleSaveApiKey() {
  const input = modalElement.querySelector('#api-key-input')
  const errorEl = modalElement.querySelector('#api-key-error')
  const statusEl = modalElement.querySelector('#settings-status')
  const apiKey = input.value.trim()

  // Validate
  if (!apiKey) {
    showError(errorEl, 'Please enter an API key')
    return
  }

  if (!apiKey.startsWith('sk-ant-')) {
    showError(errorEl, 'Invalid API key format. Claude API keys start with "sk-ant-"')
    return
  }

  // Save
  const success = saveApiKey(apiKey)

  if (success) {
    errorEl.style.display = 'none'
    showStatus(statusEl, '✓ API key saved successfully!', 'success')

    // Update button text
    const saveBtn = modalElement.querySelector('#save-api-key')
    if (saveBtn) {
      saveBtn.textContent = 'Update API Key'
    }

    // Add remove button if it doesn't exist
    if (!modalElement.querySelector('#remove-api-key')) {
      const actionsDiv = modalElement.querySelector('.settings-actions')
      const removeBtn = document.createElement('button')
      removeBtn.id = 'remove-api-key'
      removeBtn.className = 'btn btn-secondary'
      removeBtn.textContent = 'Remove API Key'
      removeBtn.addEventListener('click', handleRemoveApiKey)
      actionsDiv.appendChild(removeBtn)
    }

    // Close modal after 1.5 seconds
    setTimeout(() => {
      hideSettingsModal()
    }, 1500)
  } else {
    showError(errorEl, 'Failed to save API key. Please try again.')
  }
}

/**
 * Handles removing the API key
 */
function handleRemoveApiKey() {
  const statusEl = modalElement.querySelector('#settings-status')
  const input = modalElement.querySelector('#api-key-input')

  const success = removeApiKey()

  if (success) {
    showStatus(statusEl, '✓ API key removed', 'success')
    input.value = ''

    // Update button text
    const saveBtn = modalElement.querySelector('#save-api-key')
    if (saveBtn) {
      saveBtn.textContent = 'Save API Key'
    }

    // Remove the remove button
    const removeBtn = modalElement.querySelector('#remove-api-key')
    if (removeBtn) {
      removeBtn.remove()
    }

    // Close modal after 1.5 seconds
    setTimeout(() => {
      hideSettingsModal()
    }, 1500)
  } else {
    showStatus(statusEl, '✗ Failed to remove API key', 'error')
  }
}

/**
 * Shows an error message
 */
function showError(errorEl, message) {
  if (errorEl) {
    errorEl.textContent = message
    errorEl.style.display = 'block'
  }
}

/**
 * Shows a status message
 */
function showStatus(statusEl, message, type = 'success') {
  if (statusEl) {
    statusEl.textContent = message
    statusEl.className = `settings-status ${type}`
    statusEl.style.display = 'block'

    // Hide after 3 seconds
    setTimeout(() => {
      statusEl.style.display = 'none'
    }, 3000)
  }
}
