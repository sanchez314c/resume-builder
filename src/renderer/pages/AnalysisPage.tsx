/**
 * Analysis Page
 *
 * Skills analysis and insights dashboard.
 * Wired to useNlpAnalysis hook for real NLP processing.
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  Calendar,
  Play,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { TerminalLog } from '../components/ui/terminal-log';
import { useAppStore } from '../stores/app-store';
import { useLogStore, logger } from '../stores/log-store';
import { useNlpAnalysis } from '../hooks/use-nlp-analysis';
import { api } from '../services/api';
import { cn } from '../lib/utils';

// =============================================================================
// Mock Data (used when no real analysis is available)
// =============================================================================

const mockSkills = [
  { name: 'Python', category: 'Programming', confidence: 0.95, mentions: 127 },
  { name: 'JavaScript', category: 'Programming', confidence: 0.92, mentions: 98 },
  { name: 'React', category: 'Framework', confidence: 0.88, mentions: 76 },
  { name: 'TypeScript', category: 'Programming', confidence: 0.85, mentions: 64 },
  { name: 'Node.js', category: 'Runtime', confidence: 0.82, mentions: 53 },
  { name: 'SQL', category: 'Database', confidence: 0.78, mentions: 45 },
  { name: 'Docker', category: 'DevOps', confidence: 0.75, mentions: 38 },
  { name: 'AWS', category: 'Cloud', confidence: 0.72, mentions: 32 },
  { name: 'Machine Learning', category: 'AI/ML', confidence: 0.68, mentions: 28 },
  { name: 'Git', category: 'Tools', confidence: 0.95, mentions: 89 },
];

const mockAchievements = [
  {
    id: '1',
    text: 'Built a full-stack e-commerce platform with 10k+ active users',
    category: 'Project',
    keywords: ['e-commerce', 'full-stack', 'scalability'],
  },
  {
    id: '2',
    text: 'Reduced API response time by 60% through caching optimization',
    category: 'Performance',
    keywords: ['optimization', 'caching', 'API'],
  },
  {
    id: '3',
    text: 'Led migration of legacy system to microservices architecture',
    category: 'Leadership',
    keywords: ['microservices', 'architecture', 'migration'],
  },
  {
    id: '4',
    text: 'Implemented CI/CD pipeline reducing deployment time by 75%',
    category: 'DevOps',
    keywords: ['CI/CD', 'automation', 'deployment'],
  },
];

const mockTopics = [
  { name: 'Web Development', weight: 0.35 },
  { name: 'Backend Architecture', weight: 0.25 },
  { name: 'Data Engineering', weight: 0.18 },
  { name: 'DevOps & Cloud', weight: 0.15 },
  { name: 'Machine Learning', weight: 0.07 },
];

// =============================================================================
// Category Colors
// =============================================================================

const categoryColors: Record<string, string> = {
  Programming: 'bg-blue-500',
  Framework: 'bg-purple-500',
  Runtime: 'bg-green-500',
  Database: 'bg-orange-500',
  DevOps: 'bg-cyan-500',
  Cloud: 'bg-yellow-500',
  'AI/ML': 'bg-pink-500',
  Tools: 'bg-gray-500',
  programming: 'bg-blue-500',
  'data-science': 'bg-pink-500',
  'web-mobile': 'bg-purple-500',
  'devops-cloud': 'bg-cyan-500',
  'soft-skills': 'bg-green-500',
  other: 'bg-gray-500',
};

// =============================================================================
// Component
// =============================================================================

export const AnalysisPage: React.FC = () => {
  // Store access
  const {
    currentProject,
    analysisResult: storeAnalysisResult,
    isAnalyzing: storeIsAnalyzing,
    setCurrentPage,
  } = useAppStore();

  // Log store for terminal output
  const { logs, clearLogs } = useLogStore();

  // Local state for pre-analysis phase (loading files, etc.)
  const [isPreparingAnalysis, setIsPreparingAnalysis] = useState(false);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  // NLP analysis hook
  const { isAnalyzing, error, progress, analyze, reset } = useNlpAnalysis({
    onProgress: (_p) => {
      // Progress tracked via progress state
    },
    onComplete: (_result) => {
      // Completion handled by store update
    },
    onError: (err) => {
      console.error('Analysis error:', err);
    },
  });

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleRunAnalysis = useCallback(async () => {
    if (!currentProject) {
      logger.error('No project selected for analysis', { stage: 'INIT' });
      return;
    }

    // Clear any previous preparation error and set loading state
    setPreparationError(null);
    setIsPreparingAnalysis(true);
    clearLogs();

    logger.info('═══════════════════════════════════════════════════════════', { stage: 'INIT' });
    logger.info('   MASTER CONTROL - ANALYSIS PROTOCOL INITIATED', { stage: 'INIT' });
    logger.info('═══════════════════════════════════════════════════════════', { stage: 'INIT' });

    try {
      // Get project data path and load parsed conversations
      const dataPath = await api.getDataPath(currentProject.name);
      const conversationsPath = `${dataPath}/parsed-conversations.json`;

      logger.info(`Loading conversations from ${conversationsPath}`, { stage: 'INIT' });

      const readResult = await api.readFile(conversationsPath);

      if (!readResult.success) {
        const errorMsg =
          'Parsed conversations file not found. Please delete this project and re-import your files.';
        logger.error(`Failed to load conversations: ${readResult.error.message}`, {
          stage: 'INIT',
        });
        logger.warning('═══════════════════════════════════════════════════════════', {
          stage: 'INIT',
        });
        logger.warning('   PARSED CONVERSATIONS FILE NOT FOUND', { stage: 'INIT' });
        logger.warning('   Please delete this project and re-import your files.', {
          stage: 'INIT',
        });
        logger.warning('   The new import will save conversations for analysis.', {
          stage: 'INIT',
        });
        logger.warning('═══════════════════════════════════════════════════════════', {
          stage: 'INIT',
        });
        setPreparationError(errorMsg);
        setIsPreparingAnalysis(false);
        return;
      }

      // Parse the stored conversation data
      const storedData = JSON.parse(readResult.data);
      const messages = storedData.messages || [];

      if (messages.length === 0) {
        const errorMsg = 'No messages found in stored data.';
        logger.error(errorMsg, { stage: 'INIT' });
        setPreparationError(errorMsg);
        setIsPreparingAnalysis(false);
        return;
      }

      logger.success(
        `Loaded ${messages.length} messages from ${storedData.conversations?.length || 0} conversations`,
        { stage: 'INIT' }
      );
      logger.info('Sending data to NLP pipeline...', { stage: 'INIT' });

      // Preparation complete, now NLP analysis takes over
      setIsPreparingAnalysis(false);

      // Run analysis on real messages
      await analyze(
        messages.map((m: { id: string; role: string; content: string; timestamp?: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }))
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(`Failed to run analysis: ${error.message}`, { stage: 'ERROR' });
      setPreparationError(error.message);
      setIsPreparingAnalysis(false);
    }
  }, [analyze, currentProject, clearLogs]);

  const handleGoToResume = useCallback(() => {
    setCurrentPage('resume');
  }, [setCurrentPage]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  // Use real data if available, otherwise mock data for demonstration
  const skills = useMemo(() => {
    if (storeAnalysisResult?.skills && storeAnalysisResult.skills.length > 0) {
      return storeAnalysisResult.skills;
    }
    return mockSkills;
  }, [storeAnalysisResult]);

  const achievements = useMemo(() => {
    if (storeAnalysisResult?.achievements && storeAnalysisResult.achievements.length > 0) {
      return storeAnalysisResult.achievements;
    }
    return mockAchievements;
  }, [storeAnalysisResult]);

  const topics = useMemo(() => {
    if (storeAnalysisResult?.topics && storeAnalysisResult.topics.length > 0) {
      return storeAnalysisResult.topics;
    }
    return mockTopics;
  }, [storeAnalysisResult]);

  const hasRealData = Boolean(storeAnalysisResult);
  // Check if project has any files (completed OR processing - save may have succeeded even if status wasn't updated)
  const hasData =
    currentProject?.files.some((f) => f.status === 'completed' || f.status === 'processing') ||
    (currentProject?.files.length ?? 0) > 0;

  // ==========================================================================
  // Auto-start Analysis on Resume
  // ==========================================================================

  // Track if we've already auto-started to prevent re-triggering
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    // Auto-start analysis when:
    // - Project has completed files (hasData)
    // - No existing analysis results (hasRealData is false)
    // - Not currently analyzing
    // - No error state
    // - Haven't already auto-started this session
    if (
      hasData &&
      !hasRealData &&
      !isAnalyzing &&
      !storeIsAnalyzing &&
      !error &&
      !hasAutoStarted.current
    ) {
      hasAutoStarted.current = true;
      handleRunAnalysis();
    }
  }, [hasData, hasRealData, isAnalyzing, storeIsAnalyzing, error, handleRunAnalysis]);

  // Reset auto-start flag when project changes
  useEffect(() => {
    hasAutoStarted.current = false;
  }, [currentProject?.id]);

  // ==========================================================================
  // Render - No Project
  // ==========================================================================

  if (!currentProject) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Import conversation data to see your analysis
            </p>
            <Button className="mt-4" onClick={() => setCurrentPage('import')}>
              Go to Import
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================================================
  // Render - No Data
  // ==========================================================================

  if (!hasData) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Data Analyzed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Import and process files to generate analysis
            </p>
            <Button className="mt-4" onClick={() => setCurrentPage('import')}>
              Import Files
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================================================
  // Render - Preparing Analysis (loading files)
  // ==========================================================================

  if (isPreparingAnalysis) {
    return (
      <div className="page-container flex h-full flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-[#00d2be]" />
            <h3 className="mt-4 text-lg font-medium text-[--color-text-primary]">
              Preparing Analysis...
            </h3>
            <p className="mt-2 text-sm text-[--color-text-muted]">
              Loading conversation data from project files
            </p>
          </CardContent>
        </Card>

        {/* Terminal Log - Fills remaining height */}
        <TerminalLog
          logs={logs}
          title="Initialization Log"
          fillHeight={true}
          autoScroll={true}
          showTimestamp={true}
          showLevel={true}
          onClear={clearLogs}
        />
      </div>
    );
  }

  // ==========================================================================
  // Render - Preparation Error (missing files, etc.)
  // ==========================================================================

  if (preparationError) {
    return (
      <div className="page-container flex h-full flex-col gap-4">
        <Card className="flex-shrink-0 border-[--color-error]">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-[--color-error]" />
            <h3 className="mt-4 text-lg font-medium text-[--color-error]">Preparation Failed</h3>
            <p className="mt-2 max-w-md text-center text-sm text-[--color-text-muted]">
              {preparationError}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPreparationError(null);
                  clearLogs();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={() => setCurrentPage('projects')}>Go to Projects</Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Log - Fills remaining height */}
        <TerminalLog
          logs={logs}
          title="Error Log"
          fillHeight={true}
          autoScroll={false}
          showTimestamp={true}
          showLevel={true}
          onClear={clearLogs}
        />
      </div>
    );
  }

  // ==========================================================================
  // Render - Analysis in Progress
  // ==========================================================================

  if (isAnalyzing || storeIsAnalyzing) {
    return (
      <div className="page-container flex h-full flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-[#00d2be]" />
            <h3 className="mt-4 text-lg font-medium text-[--color-text-primary]">
              Analyzing Conversations...
            </h3>
            <p className="mt-2 text-sm text-[--color-text-muted]">
              {progress.message || 'Processing your data through NLP pipeline'}
            </p>
            <Progress value={progress.percentage} className="mt-4 w-full max-w-md" showLabel />
            <div className="mt-3 flex items-center gap-4 text-xs text-[--color-text-muted]">
              <span className="rounded bg-[rgba(0,210,190,0.1)] px-2 py-1 font-mono text-[#00d2be]">
                {progress.stage.toUpperCase()}
              </span>
              <span>
                Progress: {progress.current}/{progress.total}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Log - Fills remaining height */}
        <TerminalLog
          logs={logs}
          title="NLP Pipeline Output"
          fillHeight={true}
          autoScroll={true}
          showTimestamp={true}
          showLevel={true}
          onClear={clearLogs}
        />
      </div>
    );
  }

  // ==========================================================================
  // Render - Error
  // ==========================================================================

  if (error) {
    return (
      <div className="page-container flex h-full flex-col gap-4">
        <Card className="flex-shrink-0 border-[--color-error]">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-[--color-error]" />
            <h3 className="mt-4 text-lg font-medium text-[--color-error]">Analysis Failed</h3>
            <p className="mt-2 text-sm text-[--color-text-muted]">{error.message}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleRunAnalysis}>
                <Play className="mr-2 h-4 w-4" />
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Log - Fills remaining height */}
        <TerminalLog
          logs={logs}
          title="Error Log"
          fillHeight={true}
          autoScroll={false}
          showTimestamp={true}
          showLevel={true}
          onClear={clearLogs}
        />
      </div>
    );
  }

  // ==========================================================================
  // Render - Main Content
  // ==========================================================================

  return (
    <div className="page-container">
      {/* Demo Banner */}
      {!hasRealData && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">Demo Data</p>
                <p className="text-sm text-muted-foreground">
                  Showing sample data. Run analysis on your imported files for real results.
                </p>
              </div>
            </div>
            <Button onClick={handleRunAnalysis}>
              <Play className="mr-2 h-4 w-4" />
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{skills.length}</p>
              <p className="text-sm text-muted-foreground">Skills Identified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-success/10 flex h-12 w-12 items-center justify-center rounded-full">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{achievements.length}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-warning/10 flex h-12 w-12 items-center justify-center rounded-full">
              <Lightbulb className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{topics.length}</p>
              <p className="text-sm text-muted-foreground">Focus Areas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-info/10 flex h-12 w-12 items-center justify-center rounded-full">
              <TrendingUp className="text-info h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round(
                  (skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) * 100
                )}
                %
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {!hasRealData && (
          <Button variant="outline" onClick={handleRunAnalysis}>
            <Play className="mr-2 h-4 w-4" />
            Analyze Files
          </Button>
        )}
        <Button onClick={handleGoToResume}>Build Resume</Button>
      </div>

      {/* Terminal Log (collapsed by default, shows last run) */}
      {logs.length > 0 && (
        <TerminalLog
          logs={logs}
          title="Last Analysis Log"
          maxHeight="250px"
          autoScroll={false}
          showTimestamp={true}
          showLevel={true}
          collapsible={true}
          defaultCollapsed={true}
          onClear={clearLogs}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="topics">Topic Modeling</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Extracted</CardTitle>
              <CardDescription>
                Skills identified from your conversation history with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">{skill.category}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'absolute h-full rounded-full transition-all',
                              categoryColors[skill.category] || 'bg-primary'
                            )}
                            style={{ width: `${skill.confidence * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {Math.round(skill.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-muted-foreground">
                      {skill.mentions} mentions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievements Identified</CardTitle>
              <CardDescription>
                Accomplishments and notable work extracted from conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{achievement.text}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {achievement.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="status-badge status-info">{achievement.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topic Distribution</CardTitle>
              <CardDescription>
                Main areas of expertise based on conversation topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topics.map((topic, index) => (
                  <div key={topic.name}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{topic.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(topic.weight * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={topic.weight * 100}
                      variant={index === 0 ? 'default' : index === 1 ? 'success' : 'warning'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Your conversation activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Timeline visualization will be displayed here
                  </p>
                  <p className="text-xs text-muted-foreground">(Recharts integration pending)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisPage;
