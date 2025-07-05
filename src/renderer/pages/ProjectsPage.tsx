/**
 * Projects Page — Neo-Noir Glass Monitor
 *
 * Manage resume projects - view, create, resume, and delete.
 */

import React, { useState, useCallback } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Play,
  FileJson,
  Calendar,
  BarChart3,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { useAppStore, type Project } from '../stores/app-store';
import { cn } from '../lib/utils';

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(timestamp);
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return 'Just now';
};

// =============================================================================
// Component
// =============================================================================

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    deleteProject,
    setCurrentPage,
  } = useAppStore();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = useCallback(() => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectDialog(false);
      setCurrentPage('import');
    }
  }, [newProjectName, createProject, setCurrentPage]);

  const handleResumeProject = useCallback(
    (project: Project) => {
      setCurrentProject(project);
      const completedFiles = project.files.filter((f) => f.status === 'completed');
      if (completedFiles.length > 0) {
        setCurrentPage('analysis');
      } else {
        setCurrentPage('import');
      }
    },
    [setCurrentProject, setCurrentPage]
  );

  const handleDeleteClick = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      setShowDeleteDialog(false);
    }
  }, [projectToDelete, deleteProject]);

  const handleCancelDelete = useCallback(() => {
    setProjectToDelete(null);
    setShowDeleteDialog(false);
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[--color-text-primary]">Your Projects</h2>
          <p className="mt-1 text-sm text-[--color-text-muted]">
            {projects.length === 0
              ? 'Create your first project to get started'
              : `${projects.length} project${projects.length === 1 ? '' : 's'} total`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNewProjectDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'rgba(0, 210, 190, 0.1)',
                border: '1px solid rgba(0, 210, 190, 0.2)',
              }}
            >
              <FolderKanban style={{ width: '40px', height: '40px', color: '#00d2be' }} />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[--color-text-primary]">
              No Projects Yet
            </h3>
            <p className="mt-2 max-w-md text-center text-[--color-text-muted]">
              Create your first project to start building your AI-powered resume. Import your
              ChatGPT or Claude conversation exports and let the system extract your skills and
              achievements.
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => setShowNewProjectDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const completedFiles = project.files.filter((f) => f.status === 'completed').length;
            const totalFiles = project.files.length;

            return (
              <Card
                key={project.id}
                className={cn(
                  'group relative overflow-hidden',
                  isActive && 'ring-1 ring-[rgba(0,210,190,0.3)]'
                )}
                style={{
                  borderColor: isActive ? 'rgba(0, 210, 190, 0.4)' : undefined,
                  boxShadow: isActive
                    ? '0 0 30px rgba(0, 210, 190, 0.12), 0 8px 32px rgba(0, 0, 0, 0.6)'
                    : undefined,
                }}
              >
                {/* Active accent bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: 'linear-gradient(180deg, #00d2be, #00a896)',
                      borderRadius: '1rem 0 0 1rem',
                    }}
                  />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isActive
                            ? 'rgba(0, 210, 190, 0.2)'
                            : 'rgba(0, 210, 190, 0.1)',
                          border: '1px solid rgba(0, 210, 190, 0.2)',
                          transition: 'all 200ms ease',
                          flexShrink: 0,
                        }}
                      >
                        <FolderOpen
                          style={{
                            width: '20px',
                            height: '20px',
                            color: isActive ? '#00d2be' : 'rgba(0, 210, 190, 0.7)',
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base text-[--color-text-primary]">
                          {project.name}
                        </CardTitle>
                        {isActive && (
                          <span style={{ fontSize: '11px', color: '#00d2be', fontWeight: 600 }}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[--color-text-muted] opacity-0 transition-opacity hover:bg-[rgba(248,81,73,0.1)] hover:text-[--color-error] group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(project);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-[--color-text-muted]">
                      <Calendar className="h-4 w-4" />
                      <span>{formatRelativeTime(project.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[--color-text-muted]">
                      <FileJson className="h-4 w-4" />
                      <span>
                        {totalFiles} file{totalFiles === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Analysis Status */}
                  <div className="flex items-center gap-2">
                    {project.analysisComplete ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '24px',
                          padding: '0 10px',
                          borderRadius: '9999px',
                          background: 'rgba(0, 210, 190, 0.12)',
                          border: '1px solid rgba(0, 210, 190, 0.2)',
                        }}
                      >
                        <BarChart3 style={{ width: '14px', height: '14px', color: '#00d2be' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#00d2be' }}>
                          Analysis Complete
                        </span>
                      </div>
                    ) : totalFiles > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '24px',
                          padding: '0 10px',
                          borderRadius: '9999px',
                          background: 'rgba(210, 153, 34, 0.12)',
                          border: '1px solid rgba(210, 153, 34, 0.2)',
                        }}
                      >
                        <AlertCircle style={{ width: '14px', height: '14px', color: '#d29922' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#d29922' }}>
                          Pending Analysis
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '24px',
                          padding: '0 10px',
                          borderRadius: '9999px',
                          background: 'rgba(139, 148, 158, 0.1)',
                          border: '1px solid rgba(139, 148, 158, 0.15)',
                        }}
                      >
                        <FileJson style={{ width: '14px', height: '14px', color: '#8b949e' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e' }}>
                          No Files Imported
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Files Progress */}
                  {totalFiles > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[--color-text-muted]">Files Processed</span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: '#00d2be',
                            fontWeight: 600,
                          }}
                        >
                          {completedFiles}/{totalFiles}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '9999px',
                          background: 'rgba(0, 210, 190, 0.1)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            background: 'linear-gradient(90deg, #00d2be, #00a896)',
                            width: `${(completedFiles / totalFiles) * 100}%`,
                            transition: 'width 500ms ease',
                            boxShadow:
                              completedFiles > 0 ? '0 0 8px rgba(0, 210, 190, 0.5)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant={isActive ? 'primary' : 'default'}
                    className="w-full"
                    onClick={() => handleResumeProject(project)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isActive ? 'Continue' : 'Resume'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      {projects.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                {
                  icon: FolderKanban,
                  value: projects.length,
                  label: 'Total Projects',
                  color: '#00d2be',
                  bg: 'rgba(0, 210, 190, 0.1)',
                },
                {
                  icon: FileJson,
                  value: projects.reduce((acc, p) => acc + p.files.length, 0),
                  label: 'Total Files',
                  color: '#00d2be',
                  bg: 'rgba(0, 210, 190, 0.1)',
                },
                {
                  icon: BarChart3,
                  value: projects.filter((p) => p.analysisComplete).length,
                  label: 'Analyzed',
                  color: '#00d2be',
                  bg: 'rgba(0, 210, 190, 0.1)',
                },
                {
                  icon: AlertCircle,
                  value: projects.filter((p) => p.files.length > 0 && !p.analysisComplete).length,
                  label: 'Pending',
                  color: '#d29922',
                  bg: 'rgba(210, 153, 34, 0.1)',
                },
              ].map(({ icon: Icon, value, label, color, bg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: bg,
                      border: `1px solid ${color}30`,
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '20px', height: '20px', color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[--color-text-primary]">{value}</p>
                    <p className="text-xs text-[--color-text-muted]">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new resume project. You can import conversation files and build
              your resume after creating the project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project name (e.g., 'Software Engineer Resume')"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewProjectName('');
                setShowNewProjectDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[--color-error]">
              <AlertCircle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[--color-text-primary]">
                {projectToDelete?.name}
              </span>
              ? This action cannot be undone and all imported files and analysis data will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
