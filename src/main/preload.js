/**
 * FlowNote — Preload Script
 *
 * WHY THIS FILE EXISTS:
 * Electron has two worlds: "main" (Node.js/backend) and "renderer" (browser/React).
 * For security, the renderer can't directly call Node.js APIs.
 * The preload script is the SECURE BRIDGE between them.
 *
 * It runs before the renderer loads and exposes ONLY the specific functions
 * we choose to expose — nothing more. This is called "contextBridge".
 *
 * Rule: Never expose raw ipcRenderer — always wrap in named functions.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe "flownote" API to the renderer (React app)
contextBridge.exposeInMainWorld('flownote', {

  // ─── Notes ─────────────────────────────────────────────────────────────────
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getById: (id) => ipcRenderer.invoke('notes:getById', id),
    save: (note) => ipcRenderer.invoke('notes:save', note),
    update: (id, data) => ipcRenderer.invoke('notes:update', id, data),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
    search: (query) => ipcRenderer.invoke('notes:search', query),
  },

  // ─── AI Processing ─────────────────────────────────────────────────────────
  ai: {
    transcribe: (audioBlob) => ipcRenderer.invoke('ai:transcribe', audioBlob),
    structure: (transcript) => ipcRenderer.invoke('ai:structure', transcript),
  },

  // ─── Overlay Control ───────────────────────────────────────────────────────
  overlay: {
    hide: () => ipcRenderer.invoke('overlay:hide'),
    showResult: (note) => ipcRenderer.invoke('overlay:showResult', note),
    // Listen for overlay trigger from main process
    onShow: (callback) => ipcRenderer.on('overlay:show', callback),
    onHide: (callback) => ipcRenderer.on('overlay:hide', callback),
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  // ─── Clipboard ─────────────────────────────────────────────────────────────
  clipboard: {
    write: (text) => ipcRenderer.invoke('clipboard:write', text),
  },

  // ─── App Info ──────────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
  },
});
