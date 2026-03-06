/**
 * FlowNote — Global Keyboard Shortcuts
 *
 * Global shortcuts work even when FlowNote is not in focus.
 * This is what makes the app feel like Spotlight/Siri — instant from anywhere.
 *
 * Default: Cmd+Shift+Space
 */

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Space';

function registerShortcuts(globalShortcut, overlayWindow) {
  const shortcut = DEFAULT_SHORTCUT; // TODO: read from user settings

  const success = globalShortcut.register(shortcut, () => {
    if (!overlayWindow) return;

    if (overlayWindow.isVisible()) {
      overlayWindow.webContents.send('overlay:hide');
      setTimeout(() => overlayWindow.hide(), 200); // Wait for animation
    } else {
      overlayWindow.show();
      overlayWindow.webContents.send('overlay:show');
      overlayWindow.focus();
    }
  });

  if (!success) {
    console.error(`[Shortcuts] Failed to register shortcut: ${shortcut}`);
    console.error('[Shortcuts] Another app may be using this shortcut.');
  } else {
    console.log(`[Shortcuts] Registered: ${shortcut}`);
  }
}

function unregisterShortcuts(globalShortcut) {
  globalShortcut.unregisterAll();
  console.log('[Shortcuts] All shortcuts unregistered');
}

module.exports = { registerShortcuts, unregisterShortcuts };
