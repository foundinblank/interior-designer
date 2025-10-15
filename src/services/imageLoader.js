/**
 * Image loading service with retry logic and exponential backoff
 */

/**
 * Loads an image with retry logic and exponential backoff
 * @param {string} url - Image URL to load
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<{success: boolean, url: string, error?: string}>}
 */
export async function loadImage(url, maxRetries = 3) {
  let lastError = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before retry (exponential backoff: 1s, 2s, 4s)
      if (attempt > 0) {
        const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
        await sleep(delay)
      }

      // Attempt to load image
      await loadImagePromise(url)

      return {
        success: true,
        url,
      }
    } catch (error) {
      lastError = error
      console.warn(`Image load attempt ${attempt + 1}/${maxRetries} failed for ${url}:`, error)
    }
  }

  // All retries failed
  return {
    success: false,
    url,
    error: lastError?.message || 'Failed to load image after retries',
  }
}

/**
 * Loads image and returns a promise
 * @param {string} url - Image URL
 * @returns {Promise<void>}
 */
function loadImagePromise(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve()
    img.onerror = (error) => reject(new Error(`Failed to load: ${url}`))

    img.src = url
  })
}

/**
 * Sleeps for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Preloads both images in an image pair in parallel
 * @param {Object} imageA - First image object
 * @param {Object} imageB - Second image object
 * @returns {Promise<{imageA: Object, imageB: Object}>}
 */
export async function preloadImagePair(imageA, imageB) {
  const [resultA, resultB] = await Promise.all([
    loadImage(imageA.url),
    loadImage(imageB.url),
  ])

  return {
    imageA: resultA,
    imageB: resultB,
  }
}

/**
 * Returns a placeholder image data URI or path
 * @returns {string} Placeholder image data URI
 */
export function getPlaceholderImage() {
  // Simple gray placeholder as data URI (1x1 gray pixel)
  // In production, this could be a proper placeholder image
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial,sans-serif" font-size="16" fill="%23757575" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E'
}

/**
 * Preloads next image pair while user types explanation
 * @param {Object} imageA - First image object
 * @param {Object} imageB - Second image object
 */
export function preloadNextPair(imageA, imageB) {
  // Non-blocking preload (fire and forget)
  preloadImagePair(imageA, imageB).catch(error => {
    console.warn('Preload failed (non-critical):', error)
  })
}
