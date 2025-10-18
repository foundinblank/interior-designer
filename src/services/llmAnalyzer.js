/**
 * LLM Analyzer service for Interior Style Discovery App
 * Provides Claude API integration with graceful fallback to keyword extraction
 */

import { extractKeywords } from './recommendationEngine.js'

// Default timeout for LLM API calls (5 seconds)
const DEFAULT_TIMEOUT = 5000

/**
 * Analyzes user explanation using Claude AI or falls back to keyword extraction
 * @param {string} explanation - User's explanation text
 * @param {string|null} apiKey - Claude API key (optional)
 * @param {number} timeout - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<AnalysisResult>} Analysis result with keywords, emotions, and style indicators
 */
export async function analyzeExplanation(explanation, apiKey = null, timeout = DEFAULT_TIMEOUT) {
  // If no API key provided, use keyword extraction fallback
  if (!apiKey || apiKey.trim() === '') {
    return fallbackAnalysis(explanation)
  }

  try {
    // Attempt LLM analysis with timeout
    const result = await Promise.race([
      analyzewithClaude(explanation, apiKey),
      timeoutPromise(timeout)
    ])

    return result
  } catch (error) {
    console.warn('LLM analysis failed, falling back to keyword extraction:', error.message)
    return fallbackAnalysis(explanation)
  }
}

/**
 * Analyzes explanation using Claude API
 * @param {string} explanation - User's explanation text
 * @param {string} apiKey - Claude API key
 * @returns {Promise<AnalysisResult>} LLM analysis result
 */
async function analyzewithClaude(explanation, apiKey) {
  const endpoint = 'https://api.anthropic.com/v1/messages'

  const prompt = `Analyze this interior design preference explanation and extract:
1. Design-related keywords (colors, styles, materials, feelings)
2. Emotional responses (what emotions does the user express?)
3. Style indicators (modern, traditional, minimalist, etc.)

User explanation: "${explanation}"

Respond in JSON format:
{
  "keywords": ["keyword1", "keyword2", ...],
  "emotions": ["emotion1", "emotion2", ...],
  "style_indicators": ["indicator1", "indicator2", ...]
}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Cost-efficient model
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  const parsed = JSON.parse(content)

  return {
    keywords: parsed.keywords || [],
    emotions: parsed.emotions || [],
    style_indicators: parsed.style_indicators || [],
    source: 'llm'
  }
}

/**
 * Fallback analysis using keyword extraction
 * @param {string} explanation - User's explanation text
 * @returns {AnalysisResult} Fallback analysis result
 */
function fallbackAnalysis(explanation) {
  const keywords = extractKeywords(explanation)

  return {
    keywords,
    emotions: [],
    style_indicators: [],
    source: 'keyword_extraction'
  }
}

/**
 * Creates a timeout promise that rejects after specified duration
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Promise that rejects after timeout
 */
function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('LLM request timeout')), ms)
  })
}

/**
 * @typedef {Object} AnalysisResult
 * @property {string[]} keywords - Extracted design keywords
 * @property {string[]} emotions - Detected emotional responses
 * @property {string[]} style_indicators - Identified style indicators
 * @property {string} source - Analysis source ('llm' or 'keyword_extraction')
 */
