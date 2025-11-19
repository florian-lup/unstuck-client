/**
 * API Error Handling Utilities
 * Centralized error handling logic for API responses
 */

import { ApiErrorResponse, SubscriptionError } from '../types/api-types'

/**
 * Handle API error responses with consistent error messages
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiErrorResponse | null = null

  // Try to parse error response
  try {
    errorData = (await response.json()) as ApiErrorResponse
  } catch {
    // If JSON parsing fails, use status text
    throw new Error(`Request failed: ${response.statusText}`)
  }

  // Extract message from either flat or nested structure
  const message = errorData.detail?.message ?? errorData.message

  // Check if it's a subscription error
  const errorCode = errorData.detail?.error ?? errorData.error
  if (
    errorCode === 'feature_access_denied' ||
    errorCode === 'request_limit_exceeded' ||
    errorCode === 'monthly_request_limit_exceeded'
  ) {
    throw new SubscriptionError(message)
  }

  // Handle specific HTTP status codes with descriptive messages
  switch (response.status) {
    case 401:
      throw new Error('Authentication failed. Please sign in again.')
    case 403:
      throw new Error(
        message || 'Access denied. Please check your permissions.'
      )
    case 404:
      throw new Error(message || 'Resource not found.')
    case 429:
      throw new Error(
        message || 'Rate limit exceeded. Please wait a moment and try again.'
      )
    case 500:
    case 502:
    case 503:
    case 504:
      throw new Error('Server error. Please try again later.')
    default:
      throw new Error(
        message || `Request failed: ${response.statusText || response.status}`
      )
  }
}

/**
 * Handle network errors (connection issues, timeouts, etc.)
 */
export function handleNetworkError(error: unknown): never {
  // Check if it's a fetch error (network issues)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new Error(
      'Connection failed. Please check your internet connection and try again.'
    )
  }

  // Re-throw other errors as-is
  throw error
}

/**
 * Validate basic response structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateResponse<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  for (const field of requiredFields) {
    // eslint-disable-next-line security/detect-object-injection
    if (data[field] === undefined || data[field] === null) {
      throw new Error('Invalid response format from server')
    }
  }
}

