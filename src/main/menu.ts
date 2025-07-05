/**
 * Application Menu
 *
 * Dock menu for macOS.
 */

import { Menu, BrowserWindow } from 'electron';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sends a menu action to the renderer process
 */
function sendToRenderer(channel: string, ...args: unknown[]): void {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

// =============================================================================
// Dock Menu (macOS only)
// =============================================================================

/**
 * Creates the macOS dock menu
 */
export function createDockMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'New Project',
      click: () => sendToRenderer('menu:new-project'),
    },
  ]);
}
