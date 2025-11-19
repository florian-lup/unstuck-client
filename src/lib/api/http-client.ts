/**
 * HTTP Client with Timeout Support
 * Base client for making HTTP requests with automatic timeout handling
 */

import { handleApiError, handleNetworkError } from './api-error-handler'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  accessToken?: string
  body?: unknown
  timeout: number
}

/**
 * Base HTTP Client
 * Handles fetch requests with timeout, error handling, and response parsing
 */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your internet connection and try again.'
        )
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Make an API request with automatic error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`
    }

    try {
      const fetchOptions: RequestInit = {
        method: options.method,
        headers,
      }

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body)
      }

      const response = await this.fetchWithTimeout(
        url,
        fetchOptions,
        options.timeout
      )

      // Handle non-200 responses
      if (!response.ok) {
        await handleApiError(response)
      }

      // Parse successful response (if there's a body)
      if (options.method === 'DELETE' && response.status === 204) {
        return {} as T
      }

      try {
        const data = (await response.json()) as T
        return data
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Failed to parse server response')
      }
    } catch (error) {
      handleNetworkError(error)
    }
  }
}

