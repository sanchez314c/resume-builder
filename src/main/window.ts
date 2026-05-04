/**
 * Window Management
 *
 * Handles main window creation, state persistence,
 * and window-related events.
 */

import { BrowserWindow, screen, app, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WINDOW_CONFIG } from '../common/constants';

// =============================================================================
// Types
// =============================================================================

interface WindowState {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
  isMaximized: boolean;
}

// =============================================================================
// Window State Persistence
// =============================================================================

const STATE_FILE = 'window-state.json';

/**
 * Gets the path to the window state file
 */
function getStatePath(): string {
  return path.join(app.getPath('userData'), STATE_FILE);
}

/**
 * Loads saved window state from disk
 */
function loadWindowState(): WindowState | null {
  try {
    const statePath = getStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(data) as WindowState;
    }
  } catch (err) {
    console.error('Failed to load window state:', err);
  }
  return null;
}

/**
 * Saves window state to disk
 */
function saveWindowState(state: WindowState): void {
  try {
    const statePath = getStatePath();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

/**
 * Validates that saved window state is within current display bounds
 */
function validateWindowState(state: WindowState): WindowState {
  const displays = screen.getAllDisplays();

  // Check if the window position is visible on any display
  const isVisible = displays.some((display) => {
    const bounds = display.bounds;
    return (
      state.x !== undefined &&
      state.y !== undefined &&
      state.x >= bounds.x - state.width / 2 &&
      state.x <= bounds.x + bounds.width - state.width / 2 &&
      state.y >= bounds.y &&
      state.y <= bounds.y + bounds.height - 100
    );
  });

  if (!isVisible) {
    // Reset position to center of primary display
    return {
      x: undefined,
      y: undefined,
      width: state.width,
      height: state.height,
      isMaximized: state.isMaximized,
    };
  }

  return state;
}

// =============================================================================
// Window Creation
// =============================================================================

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window
 */
export function createMainWindow(): BrowserWindow {
  // Load or create default state
  let state = loadWindowState();
  if (state) {
    state = validateWindowState(state);
  } else {
    state = {
      x: undefined,
      y: undefined,
      width: WINDOW_CONFIG.DEFAULT_WIDTH,
      height: WINDOW_CONFIG.DEFAULT_HEIGHT,
      isMaximized: false,
    };
  }

  // Determine preload script path
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');

  // Check for Linux sandbox issues
  const isLinux = process.platform === 'linux';
  const disableSandbox =
    process.env.ELECTRON_NO_SANDBOX === '1' ||
    process.env.ELECTRON_DISABLE_SANDBOX === '1' ||
    process.argv.includes('--no-sandbox');

  // Create the browser window
  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    title: WINDOW_CONFIG.TITLE,
    show: false, // Don't show until ready
    // Neo-Noir Glass Monitor: frameless, transparent, floating
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    roundedCorners: true,
    resizable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: isLinux ? !disableSandbox : true, // Disable sandbox on Linux if needed
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
    },
    autoHideMenuBar: true,
    // Icon (platform-specific)
    icon: getIconPath(),
  });

  // Restore maximized state
  if (state.isMaximized) {
    mainWindow.maximize();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Set up state persistence
  setupStateTracking(mainWindow);

  // Set up window event handlers
  setupWindowEvents(mainWindow);

  // Load the application
  loadContent(mainWindow);

  return mainWindow;
}

/**
 * Gets the main window instance
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Focuses or creates the main window
 */
export function focusMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

// =============================================================================
// Private Helpers
// =============================================================================

/**
 * Sets up window state tracking for persistence
 */
function setupStateTracking(window: BrowserWindow): void {
  let saveTimeout: NodeJS.Timeout | null = null;

  const saveState = () => {
    if (!window || window.isDestroyed()) return;

    const bounds = window.getNormalBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: window.isMaximized(),
    };
    saveWindowState(state);
  };

  // Debounced save on resize/move
  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(saveState, 500);
  };

  window.on('resize', debouncedSave);
  window.on('move', debouncedSave);
  window.on('maximize', saveState);
  window.on('unmaximize', saveState);
  window.on('close', saveState);
}

/**
 * Sets up window event handlers
 */
function setupWindowEvents(window: BrowserWindow): void {
  // Handle window closed
  window.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation away from app
  window.webContents.on('will-navigate', (event, url) => {
    const appUrl = getAppUrl();
    if (!url.startsWith(appUrl) && !url.startsWith('devtools://')) {
      event.preventDefault();
      console.warn('Prevented navigation to:', url);
    }
  });

  // Block new windows — only open safe protocols in the system browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url);
      } else {
        console.warn(`Blocked window open with disallowed protocol: ${parsed.protocol}`);
      }
    } catch {
      console.warn(`Blocked window open with invalid URL: ${url}`);
    }
    return { action: 'deny' };
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'detach' });
  }

  // Handle page title updates
  window.webContents.on('page-title-updated', (event) => {
    // Prevent default title changes
    event.preventDefault();
  });
}

/**
 * Loads the application content
 */
function loadContent(window: BrowserWindow): void {
  // Prefer Vite dev server when its URL is in env (electron-vite dev sets this).
  // Otherwise load the built renderer from dist — handles both packaged builds
  // AND running compiled output from source via `npm run start`.
  const devUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    window.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    window.loadFile(indexPath);
  }
}

/**
 * Gets the application URL for navigation checks
 */
function getAppUrl(): string {
  const devUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  return devUrl || 'file://';
}

/**
 * Gets the application icon path based on platform
 */
function getIconPath(): string | undefined {
  const iconName =
    process.platform === 'win32'
      ? 'icon.ico'
      : process.platform === 'darwin'
        ? 'icon.icns'
        : 'icon.png';

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', 'icons', iconName);
  }

  const devIconPath = path.join(app.getAppPath(), 'assets', 'icons', iconName);
  if (fs.existsSync(devIconPath)) {
    return devIconPath;
  }

  return undefined;
}
