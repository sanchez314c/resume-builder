/**
 * Python Bridge
 *
 * Manages the Python NLP sidecar process. Handles spawning,
 * health checking, request forwarding, and graceful shutdown.
 */

/* eslint-disable no-console -- Main process logging is intentional */
import { spawn, execFileSync, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as http from 'http';
import { app } from 'electron';
import { API_CONFIG } from '../common/constants';
import { Progress, Result, AnalysisResult } from '../common/types';

// =============================================================================
// Types
// =============================================================================

export interface PythonBridgeConfig {
  port: number;
  host: string;
  pythonPath?: string;
  scriptPath?: string;
  timeout: number;
  maxRetries: number;
  healthCheckInterval: number;
}

export interface RequestOptions {
  endpoint: string;
  method: 'GET' | 'POST';
  data?: unknown;
  timeout?: number;
}

// Event types for the Python bridge
// ready: Process is ready
// error: Error occurred
// progress: Progress update
// crashed: Process crashed with exit code
// restarting: Process is restarting
// stopped: Process has stopped

// =============================================================================
// Python Bridge Class
// =============================================================================

export class PythonBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: PythonBridgeConfig;
  private isShuttingDown = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private restartAttempts = 0;
  private readonly maxRestartAttempts = 3;

  constructor(config: Partial<PythonBridgeConfig> = {}) {
    super();
    this.config = {
      port: config.port || API_CONFIG.DEFAULT_PORT,
      host: config.host || '127.0.0.1',
      pythonPath: config.pythonPath || this.detectPythonPath(),
      scriptPath: config.scriptPath || this.getDefaultScriptPath(),
      timeout: config.timeout || API_CONFIG.TIMEOUT,
      maxRetries: config.maxRetries || API_CONFIG.MAX_RETRIES,
      healthCheckInterval: config.healthCheckInterval || 30000,
    };
  }

  // ===========================================================================
  // Lifecycle Management
  // ===========================================================================

  /**
   * Spawns the Python sidecar process (or connects to existing one)
   */
  async spawn(): Promise<Result<void>> {
    // First, check if there's already a backend running on the port
    // (e.g., started by the launch script)
    const existingHealth = await this.healthCheck();
    if (existingHealth) {
      console.log(`Python backend already running on port ${this.config.port}`);
      this.restartAttempts = 0;
      this.startHealthCheck();
      this.emit('ready');
      return { success: true, data: undefined };
    }

    if (this.process && this.isRunning()) {
      return { success: true, data: undefined };
    }

    this.isShuttingDown = false;

    try {
      const pythonArgs = [
        '-m',
        'uvicorn',
        'main:app',
        '--host',
        this.config.host,
        '--port',
        String(this.config.port),
        '--log-level',
        'info',
      ];

      const cwd = path.dirname(this.config.scriptPath || '');

      this.process = spawn(this.config.pythonPath || 'python', pythonArgs, {
        cwd: cwd || undefined,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.setupProcessHandlers();

      // Wait for the server to be ready
      const ready = await this.waitForReady();
      if (!ready) {
        this.stop();
        return {
          success: false,
          error: new Error('Python sidecar failed to start within timeout'),
        };
      }

      this.restartAttempts = 0;
      this.startHealthCheck();
      this.emit('ready');

      return { success: true, data: undefined };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  /**
   * Gracefully stops the Python sidecar
   */
  async stop(): Promise<void> {
    this.isShuttingDown = true;
    this.stopHealthCheck();

    const proc = this.process;
    if (!proc) {
      this.emit('stopped');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        if (proc && !proc.killed) {
          proc.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      proc.once('exit', () => {
        clearTimeout(timeout);
        this.process = null;
        this.emit('stopped');
        resolve();
      });

      // Send graceful shutdown signal
      proc.kill('SIGTERM');
    });
  }

  /**
   * Checks if the sidecar process is running
   */
  /**
   * Checks if backend is running (either spawned by us or external)
   * Note: For immediate checks, use healthCheck() for accurate status
   */
  isRunning(): boolean {
    // If we spawned it, check the process
    if (this.process !== null && !this.process.killed) {
      return true;
    }
    // Otherwise, we might be connected to an external backend
    // Return true optimistically - actual health is checked via healthCheck()
    return false;
  }

  /**
   * Async check if backend is actually responding
   */
  async isBackendReady(): Promise<boolean> {
    return this.healthCheck();
  }

  // ===========================================================================
  // HTTP Communication
  // ===========================================================================

  /**
   * Makes an HTTP request to the Python sidecar
   */
  async request<T>(options: RequestOptions): Promise<Result<T>> {
    const { endpoint, method, data, timeout = this.config.timeout } = options;

    return new Promise((resolve) => {
      const url = `http://${this.config.host}:${this.config.port}${endpoint}`;
      const urlObj = new URL(url);

      const requestOptions: http.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout,
      };

      const req = http.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = responseData ? JSON.parse(responseData) : null;
              resolve({ success: true, data: parsed as T });
            } else {
              resolve({
                success: false,
                error: new Error(`HTTP ${res.statusCode}: ${responseData || 'Unknown error'}`),
              });
            }
          } catch (err) {
            resolve({
              success: false,
              error: new Error(`Failed to parse response: ${String(err)}`),
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          error: new Error(`Request failed: ${err.message}`),
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: new Error('Request timeout'),
        });
      });

      if (data && method === 'POST') {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Performs a health check on the sidecar
   */
  async healthCheck(): Promise<boolean> {
    const result = await this.request<{ status: string }>({
      endpoint: API_CONFIG.HEALTH_ENDPOINT,
      method: 'GET',
      timeout: 5000,
    });

    // Python backend returns "healthy", not "ok"
    return result.success && (result.data?.status === 'healthy' || result.data?.status === 'ok');
  }

  // ===========================================================================
  // NLP Operations
  // ===========================================================================

  /**
   * Analyzes conversation data through the NLP pipeline
   */
  async analyze(
    data: { messages: Array<{ role: string; content: string }> },
    onProgress?: (progress: Progress) => void
  ): Promise<Result<AnalysisResult>> {
    // Transform messages into the conversation format expected by Python backend
    const now = new Date().toISOString();
    const transformedData = {
      conversations: [
        {
          id: `conv-${Date.now()}`,
          title: 'Analysis Session',
          createdAt: now,
          updatedAt: now,
          source: 'generic',
          messages: data.messages.map((msg, idx) => ({
            id: `msg-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: now,
          })),
        },
      ],
      options: {},
    };

    // Set up progress listener if callback provided
    if (onProgress) {
      const progressHandler = (progress: Progress) => {
        onProgress(progress);
      };
      this.on('progress', progressHandler);

      const result = await this.request<AnalysisResult>({
        endpoint: API_CONFIG.ANALYZE_ENDPOINT,
        method: 'POST',
        data: transformedData,
        timeout: API_CONFIG.ANALYSIS_TIMEOUT, // 15 min for heavy NLP
      });

      this.off('progress', progressHandler);
      return result;
    }

    return this.request<AnalysisResult>({
      endpoint: API_CONFIG.ANALYZE_ENDPOINT,
      method: 'POST',
      data: transformedData,
      timeout: API_CONFIG.ANALYSIS_TIMEOUT, // 15 min for heavy NLP
    });
  }

  /**
   * Enhances resume content with AI.
   * Python `/enhance` returns `{ enhanced_content, suggestions, processing_time_ms }`,
   * so we type the raw response and let the caller read `enhanced_content`.
   */
  async enhanceResume(
    content: string
  ): Promise<
    Result<{ enhanced_content: string; suggestions: string[]; processing_time_ms: number }>
  > {
    return this.request({
      endpoint: API_CONFIG.ENHANCE_ENDPOINT,
      method: 'POST',
      data: { content },
    });
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private setupProcessHandlers(): void {
    if (!this.process) return;

    const proc = this.process;

    proc.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log('[Python]', output.trim());

      // Parse progress updates from stdout
      const progressMatch = output.match(/PROGRESS:(\{.*\})/);
      if (progressMatch) {
        try {
          const progress = JSON.parse(progressMatch[1]) as Progress;
          this.emit('progress', progress);
        } catch {
          // Ignore parse errors
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      console.error('[Python Error]', data.toString().trim());
    });

    this.process.on('exit', (code) => {
      this.process = null;
      this.stopHealthCheck();

      if (!this.isShuttingDown) {
        console.error(`Python sidecar exited with code ${code}`);
        this.emit('crashed', code);
        this.attemptRestart();
      }
    });

    this.process.on('error', (err) => {
      console.error('Failed to spawn Python process:', err);
      this.emit('error', err);
    });
  }

  private async waitForReady(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 500;

    while (Date.now() - startTime < timeout) {
      const healthy = await this.healthCheck();
      if (healthy) {
        return true;
      }
      await this.sleep(checkInterval);
    }

    return false;
  }

  private async attemptRestart(): Promise<void> {
    if (this.isShuttingDown || this.restartAttempts >= this.maxRestartAttempts) {
      console.error('Max restart attempts reached, giving up');
      return;
    }

    this.restartAttempts++;
    this.emit('restarting');
    console.log(`Attempting restart ${this.restartAttempts}/${this.maxRestartAttempts}...`);

    await this.sleep(2000 * this.restartAttempts);
    await this.spawn();
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      if (this.isShuttingDown) return;

      const healthy = await this.healthCheck();
      if (!healthy) {
        if (this.process !== null) {
          // We own the process — stop it and try to restart
          console.error('Health check failed, restarting spawned sidecar...');
          this.emit('crashed', null);
          await this.stop();
          await this.attemptRestart();
        } else {
          // External backend — emit error but do not attempt restart
          console.error('External backend unreachable (health check failed)');
          this.emit('error', new Error('External backend unreachable'));
        }
      }
    }, this.config.healthCheckInterval);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private detectPythonPath(): string {
    // Check for common Python installations in order of preference
    const candidates = ['python3', 'python', '/usr/bin/python3', '/usr/local/bin/python3'];

    for (const candidate of candidates) {
      try {
        // execFileSync does NOT use a shell, so no command injection risk
        execFileSync(candidate, ['--version'], { stdio: 'ignore', timeout: 2000 });
        return candidate;
      } catch {
        // Not found, try next
      }
    }

    // Fall back to 'python3' and let the spawn fail with a clear error
    console.warn('Could not locate a working Python executable; defaulting to python3');
    return 'python3';
  }

  private getDefaultScriptPath(): string {
    if (app.isPackaged) {
      // Production: Python bundled in resources
      return path.join(process.resourcesPath, 'python', 'main.py');
    } else {
      // Development: Python in project src
      return path.join(app.getAppPath(), 'src', 'python', 'main.py');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let bridgeInstance: PythonBridge | null = null;

/**
 * Gets the singleton Python bridge instance
 */
export function getPythonBridge(): PythonBridge {
  if (!bridgeInstance) {
    bridgeInstance = new PythonBridge();
  }
  return bridgeInstance;
}

/**
 * Destroys the singleton instance
 */
export async function destroyPythonBridge(): Promise<void> {
  if (bridgeInstance) {
    await bridgeInstance.stop();
    bridgeInstance = null;
  }
}
