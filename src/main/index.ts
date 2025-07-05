/**
 * Electron Main Process
 *
 * Entry point for the main process. Handles:
 * - Application lifecycle
 * - Window management
 * - IPC communication
 * - Native system integration
 * - Security configuration
 */

/* eslint-disable no-console -- Main process logging is intentional */
import { app, BrowserWindow, session, Menu, shell } from 'electron';
import * as path from 'path';
import { createMainWindow, getMainWindow, focusMainWindow } from './window';
import { createDockMenu } from './menu';
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc-handlers';
import { destroyPythonBridge } from './python-bridge';

// =============================================================================
// Security Configuration
// =============================================================================

/**
 * Configures Content Security Policy for the application
 */
function configureCSP(): void {
  const isDev = !app.isPackaged;

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Production CSP drops unsafe-eval entirely; dev needs it for Vite HMR
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'"; // unsafe-inline kept for React JSX runtime chunks

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            scriptSrc,
            "style-src 'self' 'unsafe-inline'", // Tailwind needs inline styles
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* ws://localhost:*", // Python sidecar + HMR
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        ],
      },
    });
  });
}

/**
 * Applies security restrictions for the app
 */
function applySecurityRestrictions(): void {
  // Disable navigation to unknown protocols
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      // Allow localhost during development and file:// in production
      const allowedOrigins = ['http://localhost:', 'http://127.0.0.1:', 'file://'];

      const isAllowed = allowedOrigins.some((origin) => navigationUrl.startsWith(origin));

      if (!isAllowed) {
        event.preventDefault();
        console.warn(`Blocked navigation to: ${navigationUrl}`);
      }
    });

    // Block new window creation — only open safe protocols externally
    contents.setWindowOpenHandler(({ url }) => {
      try {
        const parsed = new URL(url);
        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
          shell.openExternal(url);
        } else {
          console.warn(`Blocked external open with disallowed protocol: ${parsed.protocol}`);
        }
      } catch {
        console.warn(`Blocked external open with invalid URL: ${url}`);
      }
      return { action: 'deny' };
    });
  });
}

// =============================================================================
// Linux Sandbox Configuration
// =============================================================================

/**
 * Logs the active sandbox configuration on Linux for diagnostics.
 * Sandbox is disabled at module-level via commandLine flags; this function
 * only reports the state — it does not change it.
 */
function handleLinuxSandbox(): void {
  if (process.platform !== 'linux') return;

  const sandboxDisabled =
    process.env.ELECTRON_NO_SANDBOX === '1' || process.argv.includes('--no-sandbox');

  if (sandboxDisabled) {
    console.log('Running with sandbox disabled (Linux compatibility mode)');
  } else {
    console.log('Running with Chromium sandbox enabled');
  }
}

// =============================================================================
// Single Instance Lock
// =============================================================================

// =============================================================================
// Linux Chromium Flags (must be set before app.whenReady)
// =============================================================================

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  // Prevent shared memory access errors in restricted environments (containers, RAID mounts)
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is running
  app.quit();
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    focusMainWindow();
  });
}

// =============================================================================
// Application Lifecycle
// =============================================================================

// App is ready
app.whenReady().then(async () => {
  console.log(`Starting ${app.name} v${app.getVersion()}`);

  // Handle Linux sandbox before anything else
  handleLinuxSandbox();

  // Apply security measures
  configureCSP();
  applySecurityRestrictions();

  // Remove default menu bar (File, Edit, View, etc.)
  Menu.setApplicationMenu(null);

  // Set up dock menu (macOS)
  if (process.platform === 'darwin') {
    app.dock?.setMenu(createDockMenu());
  }

  // Register IPC handlers before creating window
  registerIpcHandlers();

  // Create the main window
  createMainWindow();

  // Handle activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      focusMainWindow();
    }
  });
});

// All windows closed
app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// App will quit
app.on('will-quit', async (event) => {
  // Prevent immediate quit to clean up
  event.preventDefault();

  console.log('Cleaning up before quit...');

  try {
    // Clean up IPC handlers
    unregisterIpcHandlers();

    // Stop Python bridge
    await destroyPythonBridge();
  } catch (err) {
    console.error('Cleanup error:', err);
  }

  // Now actually quit
  app.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // In production, you might want to show an error dialog
  // and gracefully restart or quit the app
});

// =============================================================================
// GPU Configuration
// =============================================================================

// Disable GPU acceleration if needed (can help with some Linux issues)
if (process.env.DISABLE_GPU === '1') {
  app.disableHardwareAcceleration();
}

// =============================================================================
// Protocol Registration
// =============================================================================

// Register custom protocol for deep linking (optional)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('resume-builder', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('resume-builder');
}

// Handle protocol URLs
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('Received protocol URL:', url);

  // Validate the URL is using our registered protocol
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'resume-builder:') {
      console.warn(`Blocked deep-link with unexpected protocol: ${parsed.protocol}`);
      return;
    }
  } catch {
    console.warn(`Blocked deep-link with invalid URL: ${url}`);
    return;
  }

  // Handle deep link - e.g., resume-builder://open/project/123
  focusMainWindow();
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('deep-link', url);
  }
});

// Handle file open (macOS)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  console.log('Received file open:', filePath);

  // Validate file path is absolute (macOS sends absolute paths)
  if (!filePath || !path.isAbsolute(filePath)) {
    console.warn(`Blocked file open with invalid path: ${filePath}`);
    return;
  }

  focusMainWindow();
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('open-file', filePath);
  }
});
