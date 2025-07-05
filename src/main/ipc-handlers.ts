/**
 * IPC Handlers
 *
 * Registers all IPC handlers for communication between
 * the main and renderer processes.
 */

/* eslint-disable no-console -- Main process logging is intentional */
import { ipcMain, shell, app, BrowserWindow } from 'electron';
import * as path from 'path';
import { IPC } from '../common/constants';
import { Result, FileSelection, AnalysisResult, Progress } from '../common/types';
import * as fileService from './file-service';
import { getPythonBridge } from './python-bridge';

// =============================================================================
// Handler Registration
// =============================================================================

/**
 * Registers all IPC handlers
 */
export function registerIpcHandlers(): void {
  // Window Control Operations (Neo-Noir Glass Monitor)
  registerWindowControlHandlers();

  // File Operations
  registerFileHandlers();

  // App Operations
  registerAppHandlers();

  // NLP Operations
  registerNlpHandlers();

  // Resume Operations
  registerResumeHandlers();

  // Assessment Operations
  registerAssessmentHandlers();

  console.log('IPC handlers registered');
}

/**
 * Window control channel names (registered outside IPC constants for frameless window support)
 */
const WINDOW_CONTROL_CHANNELS = [
  'window-minimize',
  'window-maximize',
  'window-close',
  'open-external',
] as const;

/**
 * Removes all IPC handlers (for cleanup)
 */
export function unregisterIpcHandlers(): void {
  // Remove standard IPC handlers
  Object.values(IPC).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
  // Remove window control handlers that live outside IPC constants
  WINDOW_CONTROL_CHANNELS.forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
  console.log('IPC handlers unregistered');
}

// =============================================================================
// Window Control Handlers (Neo-Noir Glass Monitor frameless window)
// =============================================================================

function registerWindowControlHandlers(): void {
  ipcMain.handle('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  ipcMain.handle('open-external', async (_event, url: string): Promise<void> => {
    try {
      const parsed = new URL(url);
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        await shell.openExternal(url);
      }
    } catch {
      // invalid URL — ignore
    }
  });
}

// =============================================================================
// File Handlers
// =============================================================================

function registerFileHandlers(): void {
  // Select files via native dialog
  ipcMain.handle(
    IPC.FILE_SELECT,
    async (
      _event,
      options?: { filters?: fileService.FileFilter[]; multiSelect?: boolean }
    ): Promise<FileSelection> => {
      return fileService.selectFiles({
        filters: options?.filters || [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        multiSelect: options?.multiSelect || false,
      });
    }
  );

  // Read file contents
  ipcMain.handle(IPC.FILE_READ, async (_event, filePath: string): Promise<Result<string>> => {
    if (typeof filePath !== 'string' || filePath.trim().length === 0) {
      return { success: false, error: new Error('Invalid file path: must be a non-empty string') };
    }
    return fileService.readFile(filePath);
  });

  // Save file contents
  ipcMain.handle(
    IPC.FILE_SAVE,
    async (
      _event,
      options: { filePath?: string; content: string; filters?: fileService.FileFilter[] }
    ): Promise<Result<string>> => {
      if (!options || typeof options.content !== 'string') {
        return { success: false, error: new Error('Invalid input: content must be a string') };
      }

      let targetPath = options.filePath;

      // If no path provided, show save dialog
      if (!targetPath) {
        const savePath = await fileService.selectSaveLocation({
          filters: options.filters,
        });

        if (!savePath) {
          return {
            success: false,
            error: new Error('Save cancelled by user'),
          };
        }
        targetPath = savePath;
      }

      const result = await fileService.saveFile(targetPath, options.content);
      if (result.success) {
        return { success: true, data: targetPath };
      }
      return result as Result<string>;
    }
  );

  // Copy file to destination
  ipcMain.handle(
    IPC.FILE_COPY,
    async (_event, options: { sourcePath: string; destPath: string }): Promise<Result<string>> => {
      if (
        !options ||
        typeof options.sourcePath !== 'string' ||
        typeof options.destPath !== 'string'
      ) {
        return {
          success: false,
          error: new Error('Invalid input: sourcePath and destPath must be strings'),
        };
      }
      return fileService.copyFile(options.sourcePath, options.destPath);
    }
  );

  // Ensure directory exists
  ipcMain.handle(IPC.FILE_ENSURE_DIR, async (_event, dirPath: string): Promise<Result<string>> => {
    if (typeof dirPath !== 'string' || dirPath.trim().length === 0) {
      return {
        success: false,
        error: new Error('Invalid directory path: must be a non-empty string'),
      };
    }
    return fileService.ensureDir(dirPath);
  });

  // Get project data path
  ipcMain.handle(IPC.FILE_GET_DATA_PATH, async (_event, projectName: string): Promise<string> => {
    if (typeof projectName !== 'string' || projectName.trim().length === 0) {
      throw new Error('Invalid project name: must be a non-empty string');
    }
    const appPath = app.getAppPath();
    return fileService.getProjectDataPath(appPath, projectName);
  });
}

// =============================================================================
// App Handlers
// =============================================================================

function registerAppHandlers(): void {
  // Open external URL in browser
  ipcMain.handle(IPC.APP_OPEN_EXTERNAL, async (_event, url: string): Promise<Result<void>> => {
    try {
      // Validate URL
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return {
          success: false,
          error: new Error(`Invalid URL protocol: ${parsed.protocol}`),
        };
      }

      await shell.openExternal(url);
      return { success: true, data: undefined };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  });

  // Open a file or folder in the system's default application
  ipcMain.handle(IPC.APP_OPEN_PATH, async (_event, filePath: string): Promise<Result<void>> => {
    try {
      // Validate input type
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return {
          success: false,
          error: new Error('Invalid file path: must be a non-empty string'),
        };
      }

      // Restrict to absolute paths to prevent relative path abuse
      if (!path.isAbsolute(filePath)) {
        return { success: false, error: new Error('File path must be absolute') };
      }

      const errorMessage = await shell.openPath(filePath);
      if (errorMessage) {
        return {
          success: false,
          error: new Error(errorMessage),
        };
      }
      return { success: true, data: undefined };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  });

  // Show a file in the file manager (with the file selected)
  ipcMain.handle(
    IPC.APP_SHOW_ITEM_IN_FOLDER,
    async (_event, filePath: string): Promise<Result<void>> => {
      try {
        // Validate input type
        if (typeof filePath !== 'string' || filePath.trim().length === 0) {
          return {
            success: false,
            error: new Error('Invalid file path: must be a non-empty string'),
          };
        }

        // Restrict to absolute paths
        if (!path.isAbsolute(filePath)) {
          return { success: false, error: new Error('File path must be absolute') };
        }

        shell.showItemInFolder(filePath);
        return { success: true, data: undefined };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  );

  // Get the exports directory path
  ipcMain.handle(IPC.APP_GET_EXPORTS_PATH, async (): Promise<string> => {
    const documentsPath = app.getPath('documents');
    const exportsPath = `${documentsPath}/Resume Builder Exports`;

    // Ensure the directory exists
    await fileService.ensureDir(exportsPath);

    return exportsPath;
  });
}

// =============================================================================
// NLP Handlers
// =============================================================================

function registerNlpHandlers(): void {
  const bridge = getPythonBridge();

  // Analyze conversation data
  ipcMain.handle(
    IPC.NLP_ANALYZE,
    async (
      event,
      data: { messages: Array<{ role: string; content: string }> }
    ): Promise<Result<AnalysisResult>> => {
      // Validate input shape
      if (!data || !Array.isArray(data.messages)) {
        return {
          success: false,
          error: new Error('Invalid input: data.messages must be an array'),
        };
      }
      for (let i = 0; i < Math.min(data.messages.length, 5); i++) {
        const msg = data.messages[i];
        if (typeof msg?.role !== 'string' || typeof msg?.content !== 'string') {
          return {
            success: false,
            error: new Error(`Invalid message at index ${i}: role and content must be strings`),
          };
        }
      }

      const sender = event.sender;

      // Set up progress forwarding
      const progressHandler = (progress: Progress) => {
        if (!sender.isDestroyed()) {
          sender.send(IPC.NLP_PROGRESS, progress);
        }
      };

      bridge.on('progress', progressHandler);

      try {
        // Ensure Python bridge is running
        if (!bridge.isRunning()) {
          const spawnResult = await bridge.spawn();
          if (!spawnResult.success) {
            return spawnResult as Result<AnalysisResult>;
          }
        }

        const result = await bridge.analyze(data);
        return result;
      } finally {
        bridge.off('progress', progressHandler);
      }
    }
  );

  // Extract skills from text
  ipcMain.handle(
    IPC.NLP_EXTRACT_SKILLS,
    async (_event, text: string): Promise<Result<Array<{ name: string; confidence: number }>>> => {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return {
          success: false,
          error: new Error('Invalid input: text must be a non-empty string'),
        };
      }

      const bridge = getPythonBridge();

      if (!bridge.isRunning()) {
        const spawnResult = await bridge.spawn();
        if (!spawnResult.success) {
          return spawnResult as Result<Array<{ name: string; confidence: number }>>;
        }
      }

      return bridge.request({
        endpoint: '/extract-skills',
        method: 'POST',
        data: { text },
      });
    }
  );
}

// =============================================================================
// Resume Handlers
// =============================================================================

function registerResumeHandlers(): void {
  // Generate PDF resume
  ipcMain.handle(
    IPC.RESUME_GENERATE_PDF,
    async (_event, resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>> => {
      try {
        const pdfContent = await generatePdfResume(resume);
        return { success: true, data: pdfContent };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  );

  // Generate DOCX resume
  ipcMain.handle(
    IPC.RESUME_GENERATE_DOCX,
    async (_event, resume: { sections: unknown[]; template: string }): Promise<Result<Buffer>> => {
      try {
        const docxContent = await generateDocxResume(resume);
        return { success: true, data: docxContent };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  );

  // Enhance resume content with AI
  ipcMain.handle(IPC.RESUME_ENHANCE, async (_event, content: string): Promise<Result<string>> => {
    if (typeof content !== 'string' || content.trim().length === 0) {
      return {
        success: false,
        error: new Error('Invalid input: content must be a non-empty string'),
      };
    }

    const bridge = getPythonBridge();

    if (!bridge.isRunning()) {
      const spawnResult = await bridge.spawn();
      if (!spawnResult.success) {
        return spawnResult as Result<string>;
      }
    }

    const result = await bridge.enhanceResume(content);
    if (result.success) {
      return { success: true, data: result.data.enhanced_content };
    }
    return result as Result<string>;
  });
}

// =============================================================================
// Assessment Handlers
// =============================================================================

interface AssessmentData {
  projectName: string;
  skills: Array<{
    name: string;
    category: string;
    confidence: number;
    mentions: number;
  }>;
  achievements: Array<{
    id: string;
    text: string;
    category: string;
    keywords: string[];
  }>;
  topics: Array<{
    name: string;
    weight: number;
  }>;
  experience: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string;
    skills: string[];
  }>;
}

function registerAssessmentHandlers(): void {
  // Generate PDF assessment report
  ipcMain.handle(
    IPC.ASSESSMENT_GENERATE_PDF,
    async (_event, data: AssessmentData): Promise<Result<Buffer>> => {
      try {
        const pdfContent = await generatePdfAssessment(data);
        return { success: true, data: pdfContent };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  );
}

/**
 * Generates a PDF assessment report from analysis data
 * Uses pdf-lib for PDF creation
 */
async function generatePdfAssessment(data: AssessmentData): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.063, 0.639, 0.498); // #10a37f
  const textColor = rgb(0.2, 0.2, 0.2);
  const mutedColor = rgb(0.5, 0.5, 0.5);

  // Page setup
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let yPos = pageHeight - margin;

  // Add first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos - requiredSpace < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - margin;
    }
  };

  // Helper to wrap text
  const wrapText = (
    text: string,
    maxWidth: number,
    font: typeof helvetica,
    size: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // === HEADER ===
  page.drawText('ASSESSMENT REPORT', {
    x: margin,
    y: yPos,
    size: 24,
    font: helveticaBold,
    color: primaryColor,
  });
  yPos -= 30;

  // Project name and date
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  page.drawText(`Project: ${data.projectName}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: helvetica,
    color: mutedColor,
  });
  yPos -= 14;
  page.drawText(`Generated: ${generatedDate}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: helvetica,
    color: mutedColor,
  });
  yPos -= 25;

  // Divider line
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: pageWidth - margin, y: yPos },
    thickness: 2,
    color: primaryColor,
  });
  yPos -= 30;

  // === EXECUTIVE SUMMARY ===
  checkPageBreak(120);
  page.drawText('EXECUTIVE SUMMARY', {
    x: margin,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });
  yPos -= 25;

  // Calculate stats
  const totalSkills = data.skills.length;
  const totalAchievements = data.achievements.length;
  const avgConfidence =
    totalSkills > 0
      ? Math.round((data.skills.reduce((sum, s) => sum + s.confidence, 0) / totalSkills) * 100)
      : 0;
  const totalMentions = data.skills.reduce((sum, s) => sum + (s.mentions || 0), 0);

  // Stats in a row (5 columns)
  const stats = [
    { label: 'Skills', value: totalSkills.toString() },
    { label: 'Achievements', value: totalAchievements.toString() },
    { label: 'Focus Areas', value: data.topics.length.toString() },
    { label: 'Confidence', value: `${avgConfidence}%` },
    { label: 'Mentions', value: totalMentions.toString() },
  ];

  const statWidth = contentWidth / stats.length;
  stats.forEach((stat, i) => {
    const xOffset = margin + i * statWidth;
    page.drawText(stat.value, {
      x: xOffset + 10,
      y: yPos,
      size: 20,
      font: helveticaBold,
      color: primaryColor,
    });
    page.drawText(stat.label, {
      x: xOffset + 10,
      y: yPos - 18,
      size: 9,
      font: helvetica,
      color: mutedColor,
    });
  });
  yPos -= 50;

  // === SKILLS ANALYSIS ===
  checkPageBreak(100);
  page.drawText('SKILLS ANALYSIS', {
    x: margin,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });
  yPos -= 25;

  // Skills table header
  const colWidths = [150, 100, 80, 80];
  const headers = ['Skill', 'Category', 'Confidence', 'Mentions'];

  let xOffset = margin;
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: xOffset,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: textColor,
    });
    xOffset += colWidths[i];
  });
  yPos -= 5;

  // Header underline
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: margin + colWidths.reduce((a, b) => a + b, 0), y: yPos },
    thickness: 1,
    color: mutedColor,
  });
  yPos -= 15;

  // Skills rows
  for (const skill of data.skills.slice(0, 20)) {
    checkPageBreak(20);
    xOffset = margin;

    page.drawText(skill.name.substring(0, 25), {
      x: xOffset,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });
    xOffset += colWidths[0];

    page.drawText((skill.category || 'Other').substring(0, 15), {
      x: xOffset,
      y: yPos,
      size: 9,
      font: helvetica,
      color: mutedColor,
    });
    xOffset += colWidths[1];

    page.drawText(`${Math.round(skill.confidence * 100)}%`, {
      x: xOffset,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });
    xOffset += colWidths[2];

    page.drawText(String(skill.mentions || 0), {
      x: xOffset,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });

    yPos -= 16;
  }

  if (data.skills.length > 20) {
    page.drawText(`... and ${data.skills.length - 20} more skills`, {
      x: margin,
      y: yPos,
      size: 9,
      font: helvetica,
      color: mutedColor,
    });
    yPos -= 16;
  }
  yPos -= 20;

  // === TOPIC DISTRIBUTION ===
  checkPageBreak(100);
  page.drawText('TOPIC DISTRIBUTION', {
    x: margin,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });
  yPos -= 25;

  for (const topic of data.topics) {
    checkPageBreak(25);

    // Topic name and percentage
    page.drawText(topic.name, {
      x: margin,
      y: yPos,
      size: 10,
      font: helvetica,
      color: textColor,
    });

    const percentage = `${Math.round(topic.weight * 100)}%`;
    page.drawText(percentage, {
      x: pageWidth - margin - 40,
      y: yPos,
      size: 10,
      font: helvetica,
      color: textColor,
    });
    yPos -= 12;

    // Progress bar background
    const barWidth = contentWidth - 50;
    const barHeight = 8;
    page.drawRectangle({
      x: margin,
      y: yPos - barHeight,
      width: barWidth,
      height: barHeight,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Progress bar fill
    page.drawRectangle({
      x: margin,
      y: yPos - barHeight,
      width: barWidth * topic.weight,
      height: barHeight,
      color: primaryColor,
    });

    yPos -= 22;
  }
  yPos -= 10;

  // === ACHIEVEMENTS ===
  checkPageBreak(100);
  page.drawText('ACHIEVEMENTS IDENTIFIED', {
    x: margin,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });
  yPos -= 25;

  for (const achievement of data.achievements.slice(0, 10)) {
    checkPageBreak(50);

    // Achievement text (wrapped)
    const achievementText = typeof achievement === 'string' ? achievement : achievement.text;
    const lines = wrapText(achievementText, contentWidth - 20, helvetica, 10);

    for (let i = 0; i < lines.length; i++) {
      page.drawText(i === 0 ? `• ${lines[i]}` : `  ${lines[i]}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: helvetica,
        color: textColor,
      });
      yPos -= 14;
    }

    // Category badge
    if (typeof achievement === 'object' && achievement.category) {
      page.drawText(`[${achievement.category}]`, {
        x: margin + 10,
        y: yPos,
        size: 8,
        font: helvetica,
        color: primaryColor,
      });
      yPos -= 12;
    }
    yPos -= 5;
  }

  if (data.achievements.length > 10) {
    page.drawText(`... and ${data.achievements.length - 10} more achievements`, {
      x: margin,
      y: yPos,
      size: 9,
      font: helvetica,
      color: mutedColor,
    });
    yPos -= 16;
  }
  yPos -= 20;

  // === EXPERIENCE & PROJECTS ===
  if (data.experience && data.experience.length > 0) {
    checkPageBreak(100);
    page.drawText('EXPERIENCE & PROJECTS', {
      x: margin,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: textColor,
    });
    yPos -= 25;

    for (const exp of data.experience.slice(0, 10)) {
      checkPageBreak(60);

      // Title
      page.drawText(`• ${exp.title}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });
      yPos -= 14;

      // Description (wrapped)
      if (exp.description) {
        const descLines = wrapText(exp.description, contentWidth - 20, helvetica, 9);
        for (const line of descLines.slice(0, 3)) {
          page.drawText(`  ${line}`, {
            x: margin,
            y: yPos,
            size: 9,
            font: helvetica,
            color: textColor,
          });
          yPos -= 12;
        }
      }

      // Duration
      if (exp.duration) {
        page.drawText(`  Duration: ${exp.duration}`, {
          x: margin,
          y: yPos,
          size: 8,
          font: helvetica,
          color: mutedColor,
        });
        yPos -= 12;
      }

      // Skills used
      if (exp.skills && exp.skills.length > 0) {
        page.drawText(
          `  Skills: ${exp.skills.slice(0, 5).join(', ')}${exp.skills.length > 5 ? '...' : ''}`,
          {
            x: margin,
            y: yPos,
            size: 8,
            font: helvetica,
            color: primaryColor,
          }
        );
        yPos -= 12;
      }

      yPos -= 8;
    }

    if (data.experience.length > 10) {
      page.drawText(`... and ${data.experience.length - 10} more entries`, {
        x: margin,
        y: yPos,
        size: 9,
        font: helvetica,
        color: mutedColor,
      });
      yPos -= 16;
    }
  }

  // === FOOTER on last page ===
  page.drawLine({
    start: { x: margin, y: margin + 20 },
    end: { x: pageWidth - margin, y: margin + 20 },
    thickness: 0.5,
    color: mutedColor,
  });
  page.drawText('Generated by Resume Builder Assessment Engine', {
    x: margin,
    y: margin + 8,
    size: 8,
    font: helvetica,
    color: mutedColor,
  });

  // Serialize to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// =============================================================================
// PDF/DOCX Generation Helpers
// =============================================================================

/**
 * Generates a PDF resume from section data
 * Uses pdf-lib for PDF creation
 */
async function generatePdfResume(resume: {
  sections: unknown[];
  template: string;
}): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Add a page — declared with let so we can reassign on page breaks
  let page = pdfDoc.addPage([612, 792]); // US Letter size
  const { height } = page.getSize();

  let yPosition = height - 50;
  const margin = 50;
  const fontSize = 12;
  const headerSize = 16;
  const lineHeight = 18;

  // Process sections
  for (const section of resume.sections as Array<{
    type: string;
    title: string;
    content: unknown;
    visible?: boolean;
  }>) {
    if (section.visible === false) continue;

    // Draw section title
    page.drawText(section.title.toUpperCase(), {
      x: margin,
      y: yPosition,
      size: headerSize,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight * 1.5;

    // Draw section content (simplified - actual implementation would be more complex)
    const content =
      typeof section.content === 'string' ? section.content : JSON.stringify(section.content);

    const lines = content.split('\n');
    for (const line of lines) {
      if (yPosition < margin) {
        // Add new page if needed and continue drawing on it
        page = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }

      page.drawText(line.substring(0, 80), {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    yPosition -= lineHeight; // Extra space between sections
  }

  // Serialize to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates a DOCX resume from section data
 * Currently returns a basic implementation
 */
async function generateDocxResume(resume: {
  sections: unknown[];
  template: string;
}): Promise<Buffer> {
  // DOCX generation would use a library like docx
  // For now, create a simple XML-based DOCX structure
  const content = (resume.sections as Array<{ title: string; content: unknown }>)
    .map((s) => `${s.title}\n${JSON.stringify(s.content)}`)
    .join('\n\n');

  // Return as plain text buffer for now
  // Full DOCX implementation would create proper Office Open XML
  return Buffer.from(content, 'utf-8');
}
