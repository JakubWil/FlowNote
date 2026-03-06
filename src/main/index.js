/**
 * FlowNote — Main Process
 *
 * This is the "backend" of the Electron app.
 * It runs in Node.js and controls:
 *   - App lifecycle (start, quit)
 *   - Native OS features (global shortcuts, tray icon)
 *   - Window creation and management
 *   - IPC (communication between main and renderer)
 *
 * Think of this as your server-side code.
 */

const { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { initDatabase } = require('./database');
const { registerShortcuts, unregisterShortcuts } = require('./shortcuts');
const { setupIpcHandlers } = require('./ipc');

// ─── Dev vs Production ────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';
const RENDERER_URL = 'http://localhost:5173';

// ─── Window References ────────────────────────────────────────────────────────
// We keep references to windows so they don't get garbage collected
let mainWindow = null;
let overlayWindow = null;

// ─── Create Main Window (Notes Library) ──────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset', // macOS native look with traffic lights
    backgroundColor: '#0F0F13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Security: renderer can't access Node directly
      nodeIntegration: false,   // Security: always false in modern Electron
    },
  });

  if (isDev) {
    mainWindow.loadURL(`${RENDERER_URL}?window=main`);
    mainWindow.webContents.openDevTools(); // Auto-open DevTools in development
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      query: { window: 'main' }
    });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
  return mainWindow;
}

// ─── Create Overlay Window (Voice Recording UI) ───────────────────────────────
// This is the Siri-style bubble that appears on shortcut press
function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 380,
    height: 120,
    frame: false,           // No window chrome (title bar, borders)
    transparent: true,      // Allows rounded corners with CSS
    alwaysOnTop: true,      // Must appear above all other apps
    resizable: false,
    movable: false,
    skipTaskbar: true,      // Don't show in Dock
    show: false,            // Start hidden — shown on shortcut
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    overlayWindow.loadURL(`${RENDERER_URL}?window=overlay`);
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      query: { window: 'overlay' }
    });
  }

  // Position at bottom-center of screen
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  overlayWindow.setPosition(
    Math.round(width / 2 - 190),
    Math.round(height - 180)
  );

  return overlayWindow;
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 1. Initialize local SQLite database
  await initDatabase();

  // 2. Setup IPC handlers (communication between main and renderer)
  setupIpcHandlers(ipcMain, { getMainWindow: () => mainWindow, getOverlayWindow: () => overlayWindow });

  // 3. Create windows
  createMainWindow();
  createOverlayWindow();

  // 4. Register global keyboard shortcuts
  registerShortcuts(globalShortcut, overlayWindow);

  // 5. macOS: re-create window if app is activated with no windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up shortcuts before quitting
app.on('will-quit', () => {
  unregisterShortcuts(globalShortcut);
});
