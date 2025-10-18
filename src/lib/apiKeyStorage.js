/**
 * API Key Storage helpers for Interior Style Discovery App
 * Manages secure storage and retrieval of Claude API keys in localStorage
 */

const API_KEY_STORAGE_KEY = 'interior-designer-claude-api-key'

/**
 * Saves Claude API key to localStorage
 * @param {string} apiKey - The API key to store
 * @returns {boolean} True if saved successfully
 */
export function saveApiKey(apiKey) {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key')
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim())
    return true
  } catch (error) {
    console.error('Failed to save API key:', error)
    return false
  }
}

/**
 * Retrieves Claude API key from localStorage
 * @returns {string|null} The stored API key or null if not found
 */
export function getApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to retrieve API key:', error)
    return null
  }
}

/**
 * Removes Claude API key from localStorage
 * @returns {boolean} True if removed successfully
 */
export function removeApiKey() {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to remove API key:', error)
    return false
  }
}

/**
 * Checks if API key exists in localStorage
 * @returns {boolean} True if API key exists
 */
export function hasApiKey() {
  try {
    const key = localStorage.getItem(API_KEY_STORAGE_KEY)
    return key !== null && key.trim() !== ''
  } catch (error) {
    console.error('Failed to check for API key:', error)
    return false
  }
}
