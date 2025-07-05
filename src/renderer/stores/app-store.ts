/**
 * Application Store
 *
 * Zustand store for global application state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ImportedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  format: 'chatgpt' | 'claude' | 'unknown';
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  importedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  files: ImportedFile[];
  analysisComplete: boolean;
}

export interface AnalysisResult {
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
  experience: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string;
    skills: string[];
  }>;
  topics: Array<{
    name: string;
    weight: number;
  }>;
}

export interface AppError {
  id: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

interface AppState {
  // Current project
  currentProject: Project | null;
  projects: Project[];

  // Analysis
  analysisResult: AnalysisResult | null;
  analysisProgress: number;
  isAnalyzing: boolean;

  // NLP Backend Status
  isNlpConnected: boolean;

  // UI State
  sidebarCollapsed: boolean;
  currentPage: 'projects' | 'import' | 'analysis' | 'jobs' | 'resume' | 'export';

  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Errors
  errors: AppError[];

  // Actions
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string) => Project;
  deleteProject: (id: string) => void;
  addFileToProject: (file: Omit<ImportedFile, 'id' | 'importedAt'>) => void;
  updateFileStatus: (fileId: string, status: ImportedFile['status'], errorMessage?: string) => void;
  removeFileFromProject: (fileId: string) => void;

  setAnalysisResult: (result: AnalysisResult | null) => void;
  setAnalysisProgress: (progress: number) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCurrentPage: (page: AppState['currentPage']) => void;

  setLoading: (isLoading: boolean, message?: string) => void;

  addError: (message: string) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;

  setNlpConnected: (connected: boolean) => void;

  reset: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const initialState = {
  currentProject: null,
  projects: [],
  analysisResult: null,
  analysisProgress: 0,
  isAnalyzing: false,
  isNlpConnected: false,
  sidebarCollapsed: false,
  currentPage: 'import' as const,
  isLoading: false,
  loadingMessage: '',
  errors: [],
};

// Export page type for use in other components
export type PageId = AppState['currentPage'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentProject: (project) => set({ currentProject: project }),

      createProject: (name) => {
        const project: Project = {
          id: generateId(),
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: [],
          analysisComplete: false,
        };
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        }));
        return project;
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      addFileToProject: (file) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const newFile: ImportedFile = {
          ...file,
          id: generateId(),
          importedAt: Date.now(),
        };

        set((state) => {
          if (!state.currentProject) return state;

          const updatedProject = {
            ...state.currentProject,
            files: [...state.currentProject.files, newFile],
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          };
        });
      },

      updateFileStatus: (fileId, status, errorMessage) => {
        set((state) => {
          if (!state.currentProject) return state;

          const updatedProject = {
            ...state.currentProject,
            files: state.currentProject.files.map((f) =>
              f.id === fileId ? { ...f, status, errorMessage } : f
            ),
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          };
        });
      },

      removeFileFromProject: (fileId) => {
        set((state) => {
          if (!state.currentProject) return state;

          const updatedProject = {
            ...state.currentProject,
            files: state.currentProject.files.filter((f) => f.id !== fileId),
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          };
        });
      },

      setAnalysisResult: (result) => set({ analysisResult: result }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCurrentPage: (page) => set({ currentPage: page }),

      setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),

      addError: (message) => {
        const error: AppError = {
          id: generateId(),
          message,
          timestamp: Date.now(),
          dismissed: false,
        };
        set((state) => ({ errors: [...state.errors, error] }));
      },

      dismissError: (id) => {
        set((state) => ({
          errors: state.errors.map((e) => (e.id === id ? { ...e, dismissed: true } : e)),
        }));
      },

      clearErrors: () => set({ errors: [] }),

      setNlpConnected: (connected) => set({ isNlpConnected: connected }),

      reset: () => set(initialState),
    }),
    {
      name: 'resume-builder-storage',
      partialize: (state) => ({
        projects: state.projects,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
