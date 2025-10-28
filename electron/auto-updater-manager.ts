import fs from 'fs'
import path from 'path'
import { BrowserWindow, ipcMain, app } from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Manages automatic updates for the application
 * - Checks for updates on app start
 * - Downloads and installs updates automatically without user interaction
 * - Uses GitHub releases as the update source
 */
export class AutoUpdaterManager {
  private isUpdateDownloaded = false
  private logFile: string

  constructor() {
    // Setup log file in user data directory
    this.logFile = path.join(app.getPath('userData'), 'updater.log')
    this.log('=== Auto-Updater Initialized ===')
    this.log(`App version: ${app.getVersion()}`)
    this.log(`Log file: ${this.logFile}`)

    this.configureAutoUpdater()
    this.setupEventHandlers()
    this.registerIPCHandlers()
  }

  /**
   * Write to log file (always enabled, even in production)
   */
  private log(message: string, data?: unknown): void {
    const timestamp = new Date().toISOString()
    const logMessage = data
      ? `[${timestamp}] ${message} ${JSON.stringify(data)}`
      : `[${timestamp}] ${message}`

    // Write to file
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.appendFileSync(this.logFile, logMessage + '\n')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  /**
   * Configure auto-updater settings
   */
  private configureAutoUpdater(): void {
    this.log('Configuring auto-updater...')

    // Disable auto-download to control the flow manually
    // We'll trigger download immediately when update is available
    autoUpdater.autoDownload = false

    // Install update immediately after download without asking
    autoUpdater.autoInstallOnAppQuit = true

    // Allow downgrade (useful for testing or rolling back)
    autoUpdater.allowDowngrade = false

    // Check for pre-release versions only if specified
    autoUpdater.allowPrerelease = false

    // Configure electron-updater's internal logger
    autoUpdater.logger = {
      info: (msg) => { this.log(`[electron-updater] ${msg}`); },
      warn: (msg) => { this.log(`[electron-updater WARN] ${msg}`); },
      error: (msg) => { this.log(`[electron-updater ERROR] ${msg}`); },
      debug: (msg) => { this.log(`[electron-updater DEBUG] ${msg}`); },
    }

    if (process.env.NODE_ENV === 'development') {
      autoUpdater.forceDevUpdateConfig = true
    }

    this.log('Auto-updater configured', {
      autoDownload: autoUpdater.autoDownload,
      autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
      allowDowngrade: autoUpdater.allowDowngrade,
      allowPrerelease: autoUpdater.allowPrerelease,
    })
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
      this.log('Checking for updates...')
    })

    // Event: Update available
    autoUpdater.on('update-available', (info) => {
      this.log('Update available!', {
        version: info.version,
        releaseDate: info.releaseDate,
        files: info.files.map((f) => ({ url: f.url, size: f.size })),
      })
      // Immediately start downloading the update
      this.log('Starting download...')
      autoUpdater.downloadUpdate().catch((error: unknown) => {
        this.log('Error downloading update', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    })

    // Event: No update available
    autoUpdater.on('update-not-available', (info) => {
      this.log('No update available - app is up to date', {
        currentVersion: info.version,
      })
    })

    // Event: Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      this.log(
        `Download progress: ${progressObj.percent.toFixed(1)}% (${(progressObj.transferred / 1024 / 1024).toFixed(1)}MB / ${(progressObj.total / 1024 / 1024).toFixed(1)}MB)`
      )
      // Send progress to renderer
      this.sendStatusToWindow('download-progress', progressObj)
    })

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      this.isUpdateDownloaded = true
      this.log('Update downloaded successfully!', {
        version: info.version,
        releaseDate: info.releaseDate,
      })

      // Notify renderer that update is ready
      this.sendStatusToWindow('update-ready', info.version)

      // Update will be installed when user quits the app (autoInstallOnAppQuit = true)
      this.log('Update will be installed on next app restart')
    })

    // Event: Error occurred
    autoUpdater.on('error', (error) => {
      this.log('Auto-updater error occurred', {
        message: error.message,
        stack: error.stack,
      })
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
      this.log('Skipping update check - running in development mode')
      return
    }

    this.log('=== Starting update check ===')
    this.log(`Current app version: ${app.getVersion()}`)
    this.log(`Update feed URL: ${autoUpdater.getFeedURL()}`)

    try {
      // Check for updates
      const result = await autoUpdater.checkForUpdates()
      this.log('Update check completed', {
        updateInfo: result?.updateInfo.version,
        cancellationToken: result?.cancellationToken ? 'present' : 'none',
      })
    } catch (error) {
      this.log('Failed to check for updates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
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
   */
  public quitAndInstall(): void {
    if (this.isUpdateDownloaded) {
      autoUpdater.quitAndInstall(false, true)
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
