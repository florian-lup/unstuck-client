import path from 'node:path'
import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'

export class TrayManager {
  private tray: Tray | null = null

  constructor(
    private readonly vitePublic: string,
    private readonly getOverlayWindow: () => BrowserWindow | null,
    private readonly ensureOverlayOnTop: () => void
  ) {}

  create(): Tray {
    const iconPath = path.join(this.vitePublic, 'unstuck-logo.ico')
    this.tray = new Tray(nativeImage.createFromPath(iconPath))
    this.tray.setToolTip('Unstuck')

    this.setupMenu()
    this.setupEvents()

    return this.tray
  }

  private setupMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Overlay',
        type: 'normal',
        click: () => {
          const overlayWindow = this.getOverlayWindow()
          if (overlayWindow) {
            if (overlayWindow.isVisible()) {
              overlayWindow.focus()
            } else {
              overlayWindow.show()
            }
            this.ensureOverlayOnTop()
          }
        },
      },
      {
        label: 'Hide Overlay',
        type: 'normal',
        click: () => {
          const overlayWindow = this.getOverlayWindow()
          if (overlayWindow?.isVisible()) {
            overlayWindow.hide()
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'normal',
        click: () => {
          const overlayWindow = this.getOverlayWindow()
          if (overlayWindow) {
            overlayWindow.show()
            overlayWindow.focus()
            this.ensureOverlayOnTop()
            overlayWindow.webContents.send('open-settings-menu')
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Unstuck',
        type: 'normal',
        click: () => {
          app.quit()
        },
      },
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private setupEvents(): void {
    if (!this.tray) return

    this.tray.on('click', () => {
      const overlayWindow = this.getOverlayWindow()
      if (overlayWindow) {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        } else {
          overlayWindow.show()
          overlayWindow.focus()
          this.ensureOverlayOnTop()
        }
      }
    })

    this.tray.on('double-click', () => {
      const overlayWindow = this.getOverlayWindow()
      if (overlayWindow) {
        overlayWindow.show()
        overlayWindow.focus()
        this.ensureOverlayOnTop()
      }
    })
  }

  updateVisibility(overlayVisible: boolean): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: overlayVisible ? 'Hide Overlay' : 'Show Overlay',
        type: 'normal',
        click: () => {
          const overlayWindow = this.getOverlayWindow()
          if (overlayWindow) {
            if (overlayVisible) {
              overlayWindow.hide()
            } else {
              overlayWindow.show()
              overlayWindow.focus()
              this.ensureOverlayOnTop()
            }
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'normal',
        click: () => {
          const overlayWindow = this.getOverlayWindow()
          if (overlayWindow) {
            overlayWindow.show()
            overlayWindow.focus()
            this.ensureOverlayOnTop()
            overlayWindow.webContents.send('open-settings-menu')
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Unstuck',
        type: 'normal',
        click: () => {
          app.quit()
        },
      },
    ])

    this.tray.setContextMenu(contextMenu)
  }

  get(): Tray | null {
    return this.tray
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}

