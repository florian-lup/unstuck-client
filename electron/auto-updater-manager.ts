import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { logger } from './utils/logger'

/**
 * Manages automatic updates for the application
 * - Checks for updates on app start
 * - Downloads and installs updates automatically without user interaction
 * - Uses GitHub releases as the update source
 */
export class AutoUpdaterManager {
  private isUpdateDownloaded = false

  constructor() {
    this.configureAutoUpdater()
    this.setupEventHandlers()
    this.registerIPCHandlers()
  }

  /**
   * Configure auto-updater settings
   */
  private configureAutoUpdater(): void {
    // Disable auto-download to control the flow manually
    // We'll trigger download immediately when update is available
    autoUpdater.autoDownload = false

    // Install update immediately after download without asking
    autoUpdater.autoInstallOnAppQuit = true

    // Allow downgrade (useful for testing or rolling back)
    autoUpdater.allowDowngrade = false

    // Check for pre-release versions only if specified
    autoUpdater.allowPrerelease = false

    // Set update check interval (optional, only for periodic checks)
    // autoUpdater.checkForUpdatesAndNotify() handles this, but we do manual checks

    // Configure logging
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.logger = logger
      autoUpdater.forceDevUpdateConfig = true
    }
  }

  /**
   * Register IPC handlers for update actions
   */
  private registerIPCHandlers(): void {
    // Handle restart request from renderer
    ipcMain.handle('updater:restart-and-install', () => {
      this.quitAndInstall()
      return { success: true }
    })
  }

  /**
   * Setup event handlers for auto-updater
   */
  private setupEventHandlers(): void {
    // Event: Checking for updates
    autoUpdater.on('checking-for-update', () => {
      // Checking for updates
    })

    // Event: Update available
    autoUpdater.on('update-available', () => {
      // Immediately start downloading the update
      autoUpdater.downloadUpdate().catch(() => {
        // Error downloading update
      })
    })

    // Event: No update available
    autoUpdater.on('update-not-available', () => {
      // No updates available
    })

    // Event: Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      // Send progress to renderer
      this.sendStatusToWindow('download-progress', progressObj)
    })

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      this.isUpdateDownloaded = true

      // Notify renderer that update is ready
      this.sendStatusToWindow('update-ready', info.version)

      // Update will be installed when user quits the app (autoInstallOnAppQuit = true)
    })

    // Event: Error occurred
    autoUpdater.on('error', () => {
      // Don't crash the app on update errors
    })
  }

  /**
   * Check for updates
   * Call this when the app starts or when you want to manually check for updates
   */
  public async checkForUpdates(): Promise<void> {
    // Skip update checks in development
    if (process.env.NODE_ENV === 'development') {
      return
    }

    try {
      // Check for updates
      await autoUpdater.checkForUpdates()
    } catch {
      // Don't throw - we don't want to block app startup if update check fails
    }
  }

  /**
   * Send status updates to renderer windows
   */
  private sendStatusToWindow(channel: string, data: unknown): void {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`updater:${channel}`, data)
      }
    })
  }

  /**
   * Check if an update has been downloaded
   */
  public isUpdateReady(): boolean {
    return this.isUpdateDownloaded
  }

  /**
   * Manually trigger quit and install
   * Useful if you want to provide a "Restart Now" button in your app
   * Updates install silently without showing the installer UI
   */
  public quitAndInstall(): void {
    if (this.isUpdateDownloaded) {
      // isSilent: true = don't show installer UI for updates
      // isForceRunAfter: true = restart app after update
      autoUpdater.quitAndInstall(true, true)
    }
  }

  /**
   * Cleanup method for proper shutdown
   */
  public cleanup(): void {
    // Remove IPC handlers
    ipcMain.removeHandler('updater:restart-and-install')

    // Remove all event listeners
    autoUpdater.removeAllListeners()
  }
}
