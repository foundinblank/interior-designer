/**
 * Session management for Interior Style Discovery App
 * Handles localStorage persistence and session lifecycle
 */

import { generateUUID } from '@/lib/utils.js'

const STORAGE_KEY = 'interiorDesignSession'
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Creates a new session with default values
 * @returns {Session} New session object
 */
export function createSession() {
  return {
    id: generateUUID(),
    startTime: Date.now(),
    currentRound: 1,
    phase: 'discovery',
    choices: [],
    styleScores: {},
    recommendedStyle: null,
    secondBestStyle: null,
    isValid: true,
  }
}

/**
 * Saves session to localStorage
 * @param {Session} session - Session object to save
 * @returns {boolean} True if save successful, false otherwise
 */
export function saveSession(session) {
  try {
    const json = JSON.stringify(session)
    localStorage.setItem(STORAGE_KEY, json)
    return true
  } catch (error) {
    console.error('Failed to save session:', error)
    return false
  }
}

/**
 * Loads session from localStorage
 * @returns {Session|null} Session object or null if not found/invalid
 */
export function loadSession() {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) {
      return null
    }

    const session = JSON.parse(json)

    // Validate session is not expired
    if (!isSessionValid(session)) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to load session:', error)
    return null
  }
}

/**
 * Checks if session is valid (less than 24 hours old)
 * @param {Session} session - Session to validate
 * @returns {boolean} True if session is valid
 */
export function isSessionValid(session) {
  const age = Date.now() - session.startTime
  return age < SESSION_TIMEOUT_MS
}

/**
 * Adds a choice to the session and increments round
 * @param {Session} session - Current session
 * @param {Choice} choice - Choice to add
 * @returns {Session} New session object with updated state
 */
export function addChoice(session, choice) {
  // Return new session object (immutable update)
  return {
    ...session,
    choices: [...session.choices, choice],
    currentRound: session.currentRound + 1,
  }
}

/**
 * Clears session from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Updates session phase
 * @param {Session} session - Current session
 * @param {string} newPhase - New phase ('discovery', 'recommendations', 'alternatives', 'complete')
 * @returns {Session} New session object with updated phase
 */
export function updatePhase(session, newPhase) {
  return {
    ...session,
    phase: newPhase,
  }
}

/**
 * Updates session with style scores and recommendations
 * @param {Session} session - Current session
 * @param {Object} styleScores - Style scores object
 * @param {string} recommendedStyle - Top recommended style ID
 * @param {string} secondBestStyle - Second-best style ID
 * @returns {Session} New session object with updated recommendations
 */
export function updateRecommendations(session, styleScores, recommendedStyle, secondBestStyle) {
  return {
    ...session,
    styleScores,
    recommendedStyle,
    secondBestStyle,
  }
}
