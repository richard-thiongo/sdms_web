/**
 * src/utils/errorUtils.js
 * Centralized error sanitization utility.
 * Prevents raw backend error messages containing system details
 * (endpoints, DB syntax, roles, config) from being exposed directly to users.
 */

const VULNERABILITY_KEYWORDS = [
  'endpoint',
  'api',
  'accessed by',
  'database',
  'sql',
  'syntax',
  'orm',
  'connection',
  'server',
  'internal',
  'route',
  'token',
  'jwt',
  'bearer',
  'undefined',
  'null',
  'network',
  'cors',
  'fetch',
  'config',
  'schema'
];

/**
 * Sanitizes backend error messages before they reach the user interface.
 * 
 * @param {string} rawMessage - The raw error message (usually result.message or error.message)
 * @param {string} defaultMessage - The fallback safe message if rawMessage is invalid or flagged
 * @returns {string} - A safe, user-friendly error message
 */
export const sanitizeErrorMessage = (rawMessage, defaultMessage = 'An unexpected error occurred. Please try again.') => {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return defaultMessage;
  }

  const rawLower = rawMessage.toLowerCase();

  // 1. Specific string mapping for known poor error messages mentioned by user
  if (rawLower.includes('this endpoint can only be accessed by')) {
    return 'You do not have permission to perform this action.';
  }

  if (rawLower.includes('token')) {
    return 'Your session has expired or is invalid. Please log in again.';
  }

  // 2. Keyword blacklist check
  const isVulnerable = VULNERABILITY_KEYWORDS.some(keyword => rawLower.includes(keyword));

  if (isVulnerable) {
    // Return a safe generic message instead of exposing backend architecture
    return defaultMessage;
  }

  // If the message is short and doesn't trigger the blacklist, it's likely a safe validation message
  // (e.g. "Email already in use", "Invalid password")
  return rawMessage;
};
