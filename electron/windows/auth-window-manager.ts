import path from 'node:path'
import { BrowserWindow, shell, Menu } from 'electron'

export class AuthWindowManager {
  private authWindow: BrowserWindow | null = null

  constructor(
    private readonly rendererDist: string,
    private readonly vitePublic: string,
    private readonly preloadPath: string,
    private readonly viteDevServerUrl?: string
  ) {}

  create(): BrowserWindow {
    this.authWindow = new BrowserWindow({
      title: 'Get Unstuck - Authentication',
      icon: path.join(this.vitePublic, 'unstuck-logo.ico'),
      width: 500,
      height: 600,
      center: true,
      resizable: false,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      show: false,
      backgroundColor: '#0a0a0a',
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
      },
    })

    this.setupSecurity()
    this.setupEvents()
    this.load()

    return this.authWindow
  }

  private setupSecurity(): void {
    if (!this.authWindow) return

    this.authWindow.setMenuBarVisibility(false)

    this.authWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)

      if (
        parsedUrl.origin !== 'http://localhost:5173' &&
        parsedUrl.origin !== 'file://' &&
        !navigationUrl.includes('auth.html')
      ) {
        event.preventDefault()
      }
    })

    this.authWindow.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  private setupEvents(): void {
    if (!this.authWindow) return

    this.authWindow.once('ready-to-show', () => {
      if (this.authWindow && !this.authWindow.isDestroyed()) {
        this.authWindow.show()
      }
    })

    this.authWindow.on('closed', () => {
      this.authWindow = null
    })

    if (process.env.NODE_ENV === 'development') {
      this.authWindow.webContents.on('context-menu', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: 'Open DevTools',
            click: () => {
              this.authWindow?.webContents.openDevTools({ mode: 'detach' })
            },
          },
          {
            label: 'Close DevTools',
            click: () => {
              this.authWindow?.webContents.closeDevTools()
            },
          },
          { type: 'separator' },
          {
            label: 'Reload',
            click: () => {
              this.authWindow?.webContents.reload()
            },
          },
        ])
        menu.popup()
      })
    }
  }

  private load(): void {
    if (!this.authWindow) return

    if (this.viteDevServerUrl) {
      void this.authWindow.loadURL(`${this.viteDevServerUrl}/auth.html`)
    } else {
      void this.authWindow.loadFile(path.join(this.rendererDist, 'auth.html'))
    }
  }

  get(): BrowserWindow | null {
    return this.authWindow
  }

  close(): void {
    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.close()
      this.authWindow = null
    }
  }

  focus(): void {
    if (this.authWindow) {
      if (this.authWindow.isMinimized()) {
        this.authWindow.restore()
      }
      this.authWindow.focus()
    }
  }
}

