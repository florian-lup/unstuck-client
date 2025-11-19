import { BrowserWindow, Tray } from 'electron'
import { AuthWindowManager } from './auth-window-manager'
import { OverlayWindowManager } from './overlay-window-manager'
import { TrayManager } from './tray-manager'

export class WindowManager {
  private authWindowManager: AuthWindowManager
  private overlayWindowManager: OverlayWindowManager
  private trayManager: TrayManager

  constructor(
    private readonly rendererDist: string,
    private readonly vitePublic: string,
    private readonly preloadPath: string,
    private readonly viteDevServerUrl?: string
  ) {
    this.authWindowManager = new AuthWindowManager(
      this.rendererDist,
      this.vitePublic,
      this.preloadPath,
      this.viteDevServerUrl
    )

    this.overlayWindowManager = new OverlayWindowManager(
      this.rendererDist,
      this.vitePublic,
      this.preloadPath,
      this.viteDevServerUrl
    )

    this.trayManager = new TrayManager(
      this.vitePublic,
      () => this.overlayWindowManager.get(),
      () => { this.overlayWindowManager.ensureOnTop(); }
    )
  }

  // Auth Window Methods
  createAuthWindow(): BrowserWindow {
    return this.authWindowManager.create()
  }

  getAuthWindow(): BrowserWindow | null {
    return this.authWindowManager.get()
  }

  closeAuthWindow(): void {
    this.authWindowManager.close()
  }

  focusAuthWindow(): void {
    this.authWindowManager.focus()
  }

  // Overlay Window Methods
  createOverlayWindow(): BrowserWindow {
    return this.overlayWindowManager.create()
  }

  getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindowManager.get()
  }

  closeOverlayWindow(): void {
    this.overlayWindowManager.close()
  }

  ensureOverlayOnTop(): void {
    this.overlayWindowManager.ensureOnTop()
  }

  setOverlayMouseEvents(
    ignore: boolean,
    options?: { forward?: boolean }
  ): void {
    this.overlayWindowManager.setMouseEvents(ignore, options)
  }

  setOverlayOpacity(opacity: number): void {
    this.overlayWindowManager.setOpacity(opacity)
  }

  // System Tray Methods
  createSystemTray(): Tray {
    return this.trayManager.create()
  }

  getTray(): Tray | null {
    return this.trayManager.get()
  }

  destroyTray(): void {
    this.trayManager.destroy()
  }

  updateTrayVisibility(overlayVisible: boolean): void {
    this.trayManager.updateVisibility(overlayVisible)
  }
}
