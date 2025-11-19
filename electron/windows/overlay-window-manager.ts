import path from 'node:path'
import { BrowserWindow, screen, shell, Menu } from 'electron'

export class OverlayWindowManager {
  private overlayWindow: BrowserWindow | null = null
  private readonly windowWidth = 650
  private readonly windowHeight = 850
  private readonly zoomFactor = 1.25

  constructor(
    private readonly rendererDist: string,
    private readonly vitePublic: string,
    private readonly preloadPath: string,
    private readonly viteDevServerUrl?: string
  ) {}

  create(): BrowserWindow {
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

    this.overlayWindow = new BrowserWindow({
      title: 'Unstuck',
      icon: path.join(this.vitePublic, 'unstuck-logo.ico'),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      width: this.windowWidth,
      height: this.windowHeight,
      minWidth: this.windowWidth,
      minHeight: this.windowHeight,
      maxWidth: this.windowWidth,
      maxHeight: this.windowHeight,
      x: Math.round((screenWidth - this.windowWidth) / 2),
      y: 20,
      webPreferences: {
        preload: this.preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        devTools: process.env.NODE_ENV === 'development',
        webSecurity: true,
        spellcheck: false,
        offscreen: false,
        webgl: false,
        plugins: false,
        zoomFactor: this.zoomFactor,
      },
    })

    this.setupSecurity()
    this.setupEvents()
    this.load()

    // Make window click-through by default
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })

    return this.overlayWindow
  }

  private setupSecurity(): void {
    if (!this.overlayWindow) return

    this.overlayWindow.webContents.on(
      'will-navigate',
      (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)

        if (
          parsedUrl.origin !== 'http://localhost:5173' &&
          parsedUrl.origin !== 'file://' &&
          !navigationUrl.includes('index.html')
        ) {
          event.preventDefault()
        }
      }
    )

    this.overlayWindow.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  private setupEvents(): void {
    if (!this.overlayWindow) return

    this.overlayWindow.on('resize', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        const bounds = this.overlayWindow.getBounds()

        if (
          bounds.width !== this.windowWidth ||
          bounds.height !== this.windowHeight
        ) {
          this.overlayWindow.setSize(this.windowWidth, this.windowHeight, false)
        }
      }
    })

    this.overlayWindow.on('blur', () => {
      this.ensureOnTop()
    })

    this.overlayWindow.on('focus', () => {
      this.ensureOnTop()
    })

    this.overlayWindow.on('show', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
        this.overlayWindow.focus()
      }
    })

    this.overlayWindow.webContents.on('did-finish-load', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.webContents.setZoomFactor(this.zoomFactor)
      }

      this.overlayWindow?.webContents.send(
        'main-process-message',
        new Date().toLocaleString()
      )
    })

    this.overlayWindow.webContents.on('zoom-changed', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.webContents.setZoomFactor(this.zoomFactor)
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.overlayWindow.webContents.on('context-menu', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: 'Open DevTools',
            click: () => {
              this.overlayWindow?.webContents.openDevTools({ mode: 'detach' })
            },
          },
          {
            label: 'Close DevTools',
            click: () => {
              this.overlayWindow?.webContents.closeDevTools()
            },
          },
          { type: 'separator' },
          {
            label: 'Reload',
            click: () => {
              this.overlayWindow?.webContents.reload()
            },
          },
        ])
        menu.popup()
      })
    }
  }

  private load(): void {
    if (!this.overlayWindow) return

    if (this.viteDevServerUrl) {
      void this.overlayWindow.loadURL(this.viteDevServerUrl)
    } else {
      void this.overlayWindow.loadFile(
        path.join(this.rendererDist, 'index.html')
      )
    }
  }

  get(): BrowserWindow | null {
    return this.overlayWindow
  }

  close(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.close()
      this.overlayWindow = null
    }
  }

  ensureOnTop(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
      this.overlayWindow.moveTop()
    }
  }

  setMouseEvents(ignore: boolean, options?: { forward?: boolean }): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setIgnoreMouseEvents(
        ignore,
        options ?? { forward: true }
      )
    }
  }

  setOpacity(opacity: number): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity))
      this.overlayWindow.setOpacity(clampedOpacity)
    }
  }
}

