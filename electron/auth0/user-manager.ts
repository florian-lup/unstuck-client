/**
 * User Management Service
 * Handles fetching user info from Auth0 and creating users in backend database
 */
import { SecureStorage } from './secure-storage'
import { Auth0User } from './types'

export class UserManager {
  private domain: string
  private secureStorage: SecureStorage

  constructor(domain: string, secureStorage: SecureStorage) {
    this.domain = domain
    this.secureStorage = secureStorage
  }

  /**
   * Get user information from Auth0
   */
  async getUserInfo(accessToken: string): Promise<Auth0User> {
    const userInfoEndpoint = `${this.domain}/userinfo`

    const response = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`User info request failed: ${response.statusText}`)
    }

    return (await response.json()) as Auth0User
  }

  /**
   * Create user in backend database
   * Called once per user after successful Auth0 authentication
   */
  async createUserInDatabase(user: Auth0User): Promise<void> {
    try {
      // Check if we've already created this user
      const createdUsersKey = 'created_users'
      const createdUsersData =
        await this.secureStorage.getItem(createdUsersKey)
      const createdUsers: Set<string> = createdUsersData
        ? new Set(JSON.parse(createdUsersData) as string[])
        : new Set()

      // If user already created, skip
      if (createdUsers.has(user.sub)) {
        return
      }

      // Call the create-user endpoint
      const response = await fetch(
        'https://unstuck-backend-production-d9c1.up.railway.app/api/v1/auth/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth0_user_id: user.sub,
            email: user.email,
            username: user.name,
          }),
        }
      )

      if (response.ok) {
        const data = (await response.json()) as {
          success: boolean
          user_id: string
          is_new_user: boolean
          message: string
        }

        if (data.success) {
          // Mark user as created
          createdUsers.add(user.sub)
          await this.secureStorage.setItem(
            createdUsersKey,
            JSON.stringify(Array.from(createdUsers))
          )
        }
      }
      // Silently fail if user creation fails - authentication should still succeed
    } catch {
      // Silently fail - don't block authentication if user creation fails
    }
  }
}

