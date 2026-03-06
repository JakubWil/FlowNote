/**
 * FlowNote — IPC Handlers
 *
 * IPC = Inter-Process Communication
 * This is how the React app (renderer) talks to the Node.js backend (main).
 *
 * Flow:
 *   Renderer calls: window.flownote.notes.save(note)
 *   → preload.js sends: ipcRenderer.invoke('notes:save', note)
 *   → main process receives it here and handles it
 *   → returns result back to renderer
 *
 * Think of these as your API endpoints, but local.
 */

const { clipboard, app, shell } = require('electron');
const { noteQueries } = require('./database');
const { transcribeAudio, structureNote } = require('./ai');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

function setupIpcHandlers(ipcMain, { getMainWindow, getOverlayWindow }) {

  // ─── Notes ─────────────────────────────────────────────────────────────────

  ipcMain.handle('notes:getAll', async () => {
    try {
      return { success: true, data: noteQueries.getAll() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notes:getById', async (_, id) => {
    try {
      return { success: true, data: noteQueries.getById(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notes:save', async (_, note) => {
    try {
      const newNote = { ...note, id: uuidv4(), tags: JSON.stringify(note.tags || []) };
      noteQueries.save(newNote);
      return { success: true, data: newNote };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notes:update', async (_, id, data) => {
    try {
      noteQueries.update(id, { ...data, tags: JSON.stringify(data.tags || []) });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notes:delete', async (_, id) => {
    try {
      noteQueries.delete(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notes:search', async (_, query) => {
    try {
      return { success: true, data: noteQueries.search(query) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── AI Processing ─────────────────────────────────────────────────────────

  ipcMain.handle('ai:transcribe', async (_, audioBuffer) => {
    try {
      const transcript = await transcribeAudio(audioBuffer);
      return { success: true, data: transcript };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:structure', async (_, transcript) => {
    try {
      const structured = await structureNote(transcript);
      return { success: true, data: structured };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── Overlay ───────────────────────────────────────────────────────────────

  ipcMain.handle('overlay:hide', () => {
    const overlay = getOverlayWindow();
    if (overlay) {
      setTimeout(() => overlay.hide(), 200);
    }
  });

  ipcMain.handle('overlay:showResult', (_, note) => {
    const main = getMainWindow();
    if (main) {
      main.webContents.send('notes:newNote', note);
    }
  });

  // ─── Settings ──────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get', async (_, key) => {
    try {
      const Store = require('electron-store');
      const store = new Store();
      return { success: true, data: store.get(key) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    try {
      const Store = require('electron-store');
      const store = new Store();
      store.set(key, value);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── Clipboard ─────────────────────────────────────────────────────────────

  ipcMain.handle('clipboard:write', (_, text) => {
    clipboard.writeText(text);
    return { success: true };
  });

  // ─── App ───────────────────────────────────────────────────────────────────

  ipcMain.handle('app:getVersion', () => {
    return { success: true, data: app.getVersion() };
  });

  ipcMain.handle('app:openDataFolder', () => {
    shell.openPath(app.getPath('userData'));
    return { success: true };
  });
}

module.exports = { setupIpcHandlers };
