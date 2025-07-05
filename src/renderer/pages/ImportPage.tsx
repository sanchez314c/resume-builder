/**
 * Import Page
 *
 * File import and management interface.
 * Wired to useFileImport hook for real file operations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  FileUp,
  FileJson,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  FolderOpen,
  Play,
  RefreshCw,
} from 'lucide-react';
import { cn, formatFileSize } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { TerminalLog } from '../components/ui/terminal-log';
import { useAppStore, ImportedFile } from '../stores/app-store';
import { useLogStore } from '../stores/log-store';
import { useFileImport } from '../hooks/use-file-import';
import { api } from '../services/api';

// =============================================================================
// Icon Mappings
// =============================================================================

const formatIcons: Record<string, React.ReactNode> = {
  chatgpt: <FileJson className="h-5 w-5 text-green-500" />,
  claude: <FileJson className="h-5 w-5 text-purple-500" />,
  unknown: <FileJson className="h-5 w-5 text-muted-foreground" />,
};

const statusIcons: Record<ImportedFile['status'], React.ReactNode> = {
  pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
  processing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  completed: <CheckCircle className="h-4 w-4 text-success" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

// =============================================================================
// Component
// =============================================================================

export const ImportPage: React.FC = () => {
  // Store access
  const { currentProject, createProject, removeFileFromProject, setCurrentPage } = useAppStore();

  // Log store for terminal output
  const { logs, clearLogs } = useLogStore();

  // File import hook
  const {
    isLoading,
    error: importError,
    progress,
    lastResult,
    importFile,
    importFromFiles,
    reset: resetImport,
  } = useFileImport({
    multiple: true,
    onProgress: (_p) => {
      // Progress tracked via progress state
    },
    onComplete: (_result) => {
      // Completion handled by store update
    },
    onError: (err) => {
      console.error('Import error:', err);
    },
  });

  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isElectron, setIsElectron] = useState(false);

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(api.isElectron());
  }, []);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!currentProject) {
        setShowNewProjectDialog(true);
        return;
      }

      // Process dropped files
      await importFromFiles(e.dataTransfer.files);
    },
    [currentProject, importFromFiles]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        if (!currentProject) {
          setShowNewProjectDialog(true);
          return;
        }
        await importFromFiles(e.target.files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [currentProject, importFromFiles]
  );

  const handleImportClick = useCallback(async () => {
    if (!currentProject) {
      setShowNewProjectDialog(true);
      return;
    }

    if (isElectron) {
      // Use native file dialog in Electron
      await importFile();
    } else {
      // Trigger file input in browser
      document.getElementById('file-input')?.click();
    }
  }, [currentProject, isElectron, importFile]);

  const handleCreateProject = useCallback(() => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectDialog(false);
    }
  }, [newProjectName, createProject]);

  const handleGoToAnalysis = useCallback(() => {
    setCurrentPage('analysis');
  }, [setCurrentPage]);

  // ==========================================================================
  // Computed values
  // ==========================================================================

  const completedFiles = currentProject?.files.filter((f) => f.status === 'completed') || [];
  const processingFiles = currentProject?.files.filter((f) => f.status === 'processing') || [];
  const errorFiles = currentProject?.files.filter((f) => f.status === 'error') || [];

  const progressPercentage = currentProject?.files.length
    ? (completedFiles.length / currentProject.files.length) * 100
    : 0;

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="page-container">
      {/* Error Display */}
      {importError && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Import Error</p>
              <p className="text-sm text-muted-foreground">{importError.message}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetImport}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Selection */}
      {!currentProject && (
        <Card>
          <CardHeader>
            <CardTitle>Create or Select a Project</CardTitle>
            <CardDescription>Start a new project to import your conversation data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowNewProjectDialog(true)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Import Conversation Files</CardTitle>
          <CardDescription>
            {isElectron
              ? 'Click to browse or drag and drop JSON exports from ChatGPT or Claude'
              : 'Drag and drop JSON exports from ChatGPT or Claude'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'drop-zone cursor-pointer transition-all',
              isDragging && 'drop-zone-active ring-2 ring-primary',
              !currentProject && 'pointer-events-none opacity-50',
              isLoading && 'pointer-events-none'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && handleImportClick()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".json"
              multiple
              onChange={handleFileSelect}
              disabled={!currentProject || isLoading}
            />

            {isLoading ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h3 className="mt-4 text-lg font-medium">{progress.message || 'Processing...'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {progress.stage === 'parsing' && progress.fileName
                    ? `Parsing ${progress.fileName}...`
                    : `Stage: ${progress.stage}`}
                </p>
                {progress.total > 0 && (
                  <Progress
                    value={(progress.current / progress.total) * 100}
                    className="mt-4 w-full max-w-xs"
                  />
                )}
              </>
            ) : (
              <>
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Supports ChatGPT and Claude conversation exports (JSON format)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {lastResult && lastResult.conversations.length > 0 && (
        <Card className="bg-success/5 border-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Import Successful</p>
                  <p className="text-sm text-muted-foreground">
                    {lastResult.stats.conversationsImported} conversation(s) with{' '}
                    {lastResult.stats.messagesTotal} messages imported
                  </p>
                </div>
              </div>
              <Button onClick={handleGoToAnalysis}>
                <Play className="mr-2 h-4 w-4" />
                Analyze Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Log - Show during and after import */}
      {(isLoading || logs.length > 0) && (
        <TerminalLog
          logs={logs}
          title="Import Log"
          maxHeight="300px"
          autoScroll={true}
          showTimestamp={true}
          showLevel={true}
          collapsible={!isLoading}
          defaultCollapsed={false}
          onClear={clearLogs}
        />
      )}

      {/* File List */}
      {currentProject && currentProject.files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Imported Files</CardTitle>
              <CardDescription>
                {completedFiles.length} of {currentProject.files.length} processed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {errorFiles.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetImport}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Failed
                </Button>
              )}
              {completedFiles.length > 0 && (
                <Button onClick={handleGoToAnalysis}>Analyze ({completedFiles.length})</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(processingFiles.length > 0 || isLoading) && (
              <div className="mb-4">
                <Progress value={progressPercentage} showLabel />
              </div>
            )}
            <div className="space-y-2">
              {currentProject.files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-[rgba(0,210,190,0.12)] bg-[rgba(26,29,36,0.4)] p-3 transition-all duration-200',
                    file.status === 'error' && 'bg-[--color-error]/5 border-[--color-error]',
                    file.status === 'completed' &&
                      'hover:border-[rgba(0,210,190,0.3)] hover:bg-[rgba(0,210,190,0.05)]'
                  )}
                >
                  {formatIcons[file.format]}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="capitalize">{file.format}</span>
                      {file.errorMessage && (
                        <span className="text-destructive">{file.errorMessage}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcons[file.status]}
                    <span
                      className={cn(
                        'text-sm capitalize',
                        file.status === 'completed' && 'text-success',
                        file.status === 'error' && 'text-destructive'
                      )}
                    >
                      {file.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFileFromProject(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[rgba(0,210,190,0.18)] bg-[rgba(26,29,36,0.5)] p-4 backdrop-blur-sm transition-all duration-200 hover:border-[rgba(0,210,190,0.3)]">
              <div className="flex items-center gap-2">
                {formatIcons.chatgpt}
                <h4 className="font-medium text-[--color-text-primary]">ChatGPT Export</h4>
              </div>
              <p className="mt-2 text-sm text-[--color-text-muted]">
                Export from ChatGPT: Settings &rarr; Data Controls &rarr; Export Data
              </p>
              <code className="mt-2 block rounded-lg bg-[rgba(10,10,15,0.6)] p-2 font-mono text-xs text-[#00d2be]">
                conversations.json
              </code>
            </div>
            <div className="rounded-xl border border-[rgba(0,210,190,0.18)] bg-[rgba(26,29,36,0.5)] p-4 backdrop-blur-sm transition-all duration-200 hover:border-[rgba(0,210,190,0.3)]">
              <div className="flex items-center gap-2">
                {formatIcons.claude}
                <h4 className="font-medium text-[--color-text-primary]">Claude Export</h4>
              </div>
              <p className="mt-2 text-sm text-[--color-text-muted]">
                Export from Claude: Account Settings &rarr; Export Conversations
              </p>
              <code className="mt-2 block rounded-lg bg-[rgba(10,10,15,0.6)] p-2 font-mono text-xs text-[#00d2be]">
                claude-conversations.json
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Enter a name for your new resume project</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportPage;
