/**
 * Input validation functions for Interior Style Discovery App
 */

/**
 * Validates user explanation meets minimum length requirement
 * @param {string} text - The explanation text to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateExplanation(text) {
  const trimmed = text.trim()

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Explanation must be at least 10 characters',
    }
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      error: 'Explanation must be less than 500 characters',
    }
  }

  return {
    valid: true,
  }
}

/**
 * Sanitizes user input by trimming whitespace and removing HTML tags
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeInput(text) {
  // Trim whitespace
  const trimmed = text.trim()

  // Remove HTML tags using a simple regex
  // This is basic XSS prevention - in production, consider using DOMPurify
  const withoutHtml = trimmed.replace(/<[^>]*>/g, '')

  return withoutHtml
}

/**
 * Validates image ID exists in available images
 * @param {string} imageId - The image ID to validate
 * @param {Array} availableImages - Array of available images
 * @returns {boolean} True if image ID exists
 */
export function validateImageId(imageId, availableImages) {
  return availableImages.some(img => img.id === imageId)
}
