/**
 * Main Application Component
 *
 * Root component with routing and layout.
 */

import React, { useEffect } from 'react';
import { MainLayout } from './components/layout';
import { ThemeProvider } from './components/ThemeProvider';
import { ProjectsPage, ImportPage, AnalysisPage, JobsPage, ResumePage, ExportPage } from './pages';
import { useAppStore } from './stores/app-store';
import { api } from './services/api';

/**
 * Simple router based on app store state
 * In a larger app, consider react-router-dom
 */
const PageRouter: React.FC = () => {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case 'projects':
      return <ProjectsPage />;
    case 'import':
      return <ImportPage />;
    case 'analysis':
      return <AnalysisPage />;
    case 'jobs':
      return <JobsPage />;
    case 'resume':
      return <ResumePage />;
    case 'export':
      return <ExportPage />;
    default:
      return <ProjectsPage />;
  }
};

/**
 * Error Boundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              An unexpected error occurred. Please refresh the page or restart the application.
            </p>
            {this.state.error && (
              <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-left text-xs">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="hover:bg-primary/90 mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * NLP Backend Health Monitor
 */
const useNlpHealthCheck = () => {
  const setNlpConnected = useAppStore((state) => state.setNlpConnected);

  useEffect(() => {
    // Initial check
    const checkHealth = async () => {
      const isConnected = await api.health.checkNlpBackend();
      setNlpConnected(isConnected);
    };

    checkHealth();

    // Poll every 10 seconds
    const interval = setInterval(checkHealth, 10000);

    return () => clearInterval(interval);
  }, [setNlpConnected]);
};

/**
 * Main App Component
 */
export const App: React.FC = () => {
  // Start NLP health monitoring
  useNlpHealthCheck();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MainLayout>
          <PageRouter />
        </MainLayout>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
