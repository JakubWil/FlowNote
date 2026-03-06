const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null
let overlayWindow = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173?window=main')
    mainWindow.webContents.openDevTools()
  }
}

function createOverlayWindow() {
  const { screen } = require('electron')

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 130,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173?window=overlay')
  }

  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize
  overlayWindow.setPosition(
    Math.round(width / 2 - 210),
    Math.round(height - 200)
  )
}

app.whenReady().then(() => {
  createMainWindow()
  createOverlayWindow()

  // Globalny skrót — odpala overlay
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!overlayWindow) return
    if (overlayWindow.isVisible()) {
      overlayWindow.hide()
    } else {
      overlayWindow.show()
      overlayWindow.focus()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})