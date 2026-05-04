/**
 * NLP Analysis Hook
 *
 * Handles NLP analysis workflow:
 * 1. Submit conversation data to Python sidecar
 * 2. Track progress through analysis stages
 * 3. Return results when complete
 * 4. Handle errors gracefully
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../stores/app-store';
import { logger } from '../stores/log-store';
import { API_CONFIG } from '@common/constants';
import type { AnalysisResult, Progress, Message } from '@common/types';

// =============================================================================
// Types
// =============================================================================

export type AnalysisStage =
  | 'idle'
  | 'starting'
  | 'skill-extraction'
  | 'achievement-detection'
  | 'topic-modeling'
  | 'sentiment-analysis'
  | 'timeline-generation'
  | 'complete'
  | 'error';

export interface AnalysisProgress {
  stage: AnalysisStage;
  current: number;
  total: number;
  message: string;
  percentage: number;
}

export interface AnalysisOptions {
  /** Skip skills extraction */
  skipSkills?: boolean;
  /** Skip achievement detection */
  skipAchievements?: boolean;
  /** Skip topic modeling */
  skipTopics?: boolean;
  /** Skip sentiment analysis */
  skipSentiment?: boolean;
  /** Custom NLP options */
  nlpOptions?: {
    minSkillConfidence?: number;
    maxTopics?: number;
    batchSize?: number;
  };
}

export interface UseNlpAnalysisOptions {
  /** Auto-analyze when messages change */
  autoAnalyze?: boolean;
  /** Callback on progress update */
  onProgress?: (progress: AnalysisProgress) => void;
  /** Callback on completion */
  onComplete?: (result: AnalysisResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

// =============================================================================
// Constants
// =============================================================================

const initialProgress: AnalysisProgress = {
  stage: 'idle',
  current: 0,
  total: 0,
  message: '',
  percentage: 0,
};

const STAGE_WEIGHTS: Record<AnalysisStage, number> = {
  idle: 0,
  starting: 5,
  'skill-extraction': 25,
  'achievement-detection': 20,
  'topic-modeling': 25,
  'sentiment-analysis': 15,
  'timeline-generation': 10,
  complete: 100,
  error: 0,
};

// =============================================================================
// Hook Implementation
// =============================================================================

export function useNlpAnalysis(options: UseNlpAnalysisOptions = {}) {
  const { onProgress, onComplete, onError } = options;

  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>(initialProgress);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Store access
  const {
    currentProject,
    setAnalysisResult,
    setAnalysisProgress: setStoreProgress,
    setIsAnalyzing: setStoreAnalyzing,
    addError: addStoreError,
  } = useAppStore();

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeProgressRef = useRef<(() => void) | null>(null);

  /**
   * Updates progress and syncs with store
   */
  const updateProgress = useCallback(
    (update: Partial<AnalysisProgress>) => {
      setProgress((prev) => {
        const newProgress = { ...prev, ...update };

        // Calculate percentage based on stage weights
        let percentage = 0;
        const stages = Object.keys(STAGE_WEIGHTS) as AnalysisStage[];
        const currentIndex = stages.indexOf(newProgress.stage);

        if (currentIndex > 0) {
          // Sum weights of completed stages
          for (let i = 0; i < currentIndex; i++) {
            percentage += STAGE_WEIGHTS[stages[i]];
          }

          // Add partial progress within current stage
          const stageWeight = STAGE_WEIGHTS[newProgress.stage];
          if (newProgress.total > 0) {
            percentage += (newProgress.current / newProgress.total) * stageWeight;
          }
        }

        newProgress.percentage = Math.min(Math.round(percentage), 100);

        // Sync with store
        setStoreProgress(newProgress.percentage);

        // Call callback
        onProgress?.(newProgress);

        return newProgress;
      });
    },
    [setStoreProgress, onProgress]
  );

  /**
   * Handles progress events from the Python sidecar
   */
  const handleSidecarProgress = useCallback(
    (sidecarProgress: Progress) => {
      // Map sidecar stage names to our stages
      const stageMap: Record<string, AnalysisStage> = {
        starting: 'starting',
        skills: 'skill-extraction',
        achievements: 'achievement-detection',
        topics: 'topic-modeling',
        sentiment: 'sentiment-analysis',
        timeline: 'timeline-generation',
        complete: 'complete',
      };

      const stage = stageMap[sidecarProgress.stage] || 'starting';

      // Emit detailed log entry
      const stageDisplayNames: Record<string, string> = {
        starting: 'INIT',
        skills: 'SKILLS',
        achievements: 'ACHIEVEMENTS',
        topics: 'TOPICS',
        sentiment: 'SENTIMENT',
        timeline: 'TIMELINE',
        complete: 'COMPLETE',
      };

      logger.info(sidecarProgress.message, {
        stage: stageDisplayNames[sidecarProgress.stage] || sidecarProgress.stage.toUpperCase(),
        details: `${sidecarProgress.current}/${sidecarProgress.total}`,
      });

      updateProgress({
        stage,
        current: sidecarProgress.current,
        total: sidecarProgress.total,
        message: sidecarProgress.message,
      });
    },
    [updateProgress]
  );

  /**
   * Prepares messages for analysis
   */
  const prepareMessages = useCallback(
    (messages: Message[]): Array<{ role: string; content: string }> => {
      return messages
        .filter((msg) => msg.content && msg.content.trim().length > 0)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
    },
    []
  );

  /**
   * Main analysis function
   */
  const analyze = useCallback(
    async (
      messages: Message[],
      _analysisOptions: AnalysisOptions = {}
    ): Promise<AnalysisResult | null> => {
      // Validation
      if (!messages || messages.length === 0) {
        const err = new Error('No messages provided for analysis');
        setError(err);
        logger.error('No messages provided for analysis', { stage: 'INIT' });
        onError?.(err);
        return null;
      }

      // Reset state
      setIsAnalyzing(true);
      setStoreAnalyzing(true);
      setError(null);
      setResult(null);
      abortControllerRef.current = new AbortController();

      // Clear previous logs and start fresh
      logger.clear();
      logger.system('═══════════════════════════════════════════════════════════', {
        stage: 'NLP',
      });
      logger.system('   NLP ANALYSIS PIPELINE INITIALIZED', { stage: 'NLP' });
      logger.system('═══════════════════════════════════════════════════════════', {
        stage: 'NLP',
      });

      // WebSocket for real-time progress (defined outside try for cleanup access)
      let progressWs: WebSocket | null = null;

      try {
        // Subscribe to progress updates via IPC (legacy)
        unsubscribeProgressRef.current = api.nlp.onProgress(handleSidecarProgress);

        // ALSO connect directly to Python WebSocket for real-time progress
        try {
          progressWs = new WebSocket(`ws://127.0.0.1:${API_CONFIG.DEFAULT_PORT}/ws/progress`);
          progressWs.onmessage = (event) => {
            try {
              const progress = JSON.parse(event.data);
              handleSidecarProgress(progress);
            } catch (e) {
              console.warn('Failed to parse WebSocket progress:', e);
            }
          };
          progressWs.onerror = (e) => console.warn('WebSocket progress error:', e);
          progressWs.onopen = () => logger.info('WebSocket progress connected', { stage: 'INIT' });
        } catch (e) {
          console.warn('WebSocket connection failed, using IPC only:', e);
        }

        logger.info('Connecting to NLP backend...', { stage: 'INIT' });

        updateProgress({
          stage: 'starting',
          current: 0,
          total: messages.length,
          message: 'Preparing analysis...',
        });

        // Prepare messages
        const preparedMessages = prepareMessages(messages);
        logger.info(`Prepared ${preparedMessages.length} messages for analysis`, { stage: 'INIT' });

        if (preparedMessages.length === 0) {
          throw new Error('No valid messages to analyze after filtering');
        }

        logger.info(`Starting NLP pipeline on ${preparedMessages.length} messages...`, {
          stage: 'INIT',
        });
        logger.debug('Message roles: ' + preparedMessages.map((m) => m.role).join(', '), {
          stage: 'INIT',
        });

        updateProgress({
          message: `Analyzing ${preparedMessages.length} messages...`,
        });

        // Call NLP service
        logger.info('Sending data to Python sidecar...', { stage: 'NLP' });
        const analysisResult = await api.analyzeConversation(preparedMessages);

        if (!analysisResult.success) {
          logger.error(`NLP backend error: ${analysisResult.error.message}`, { stage: 'NLP' });
          throw new Error(analysisResult.error.message);
        }

        // Log results summary
        logger.success('NLP pipeline completed successfully', { stage: 'COMPLETE' });
        logger.system('───────────────────────────────────────────────────────────', {
          stage: 'RESULTS',
        });
        logger.info(`Skills extracted: ${analysisResult.data.skills?.length || 0}`, {
          stage: 'RESULTS',
        });
        logger.info(`Achievements found: ${analysisResult.data.achievements?.length || 0}`, {
          stage: 'RESULTS',
        });
        logger.info(`Topics identified: ${analysisResult.data.topics?.length || 0}`, {
          stage: 'RESULTS',
        });
        logger.system('───────────────────────────────────────────────────────────', {
          stage: 'RESULTS',
        });

        // Log top skills
        if (analysisResult.data.skills && analysisResult.data.skills.length > 0) {
          logger.debug('Top skills:', { stage: 'SKILLS' });
          analysisResult.data.skills.slice(0, 5).forEach((skill) => {
            logger.debug(`  • ${skill.name} (${Math.round(skill.confidence * 100)}% confidence)`, {
              stage: 'SKILLS',
            });
          });
        }

        // Update completion
        updateProgress({
          stage: 'complete',
          current: preparedMessages.length,
          total: preparedMessages.length,
          message: 'Analysis complete',
          percentage: 100,
        });

        // Store result
        setResult(analysisResult.data);
        setAnalysisResult({
          skills: analysisResult.data.skills.map((s) => ({
            name: s.name,
            category: s.category,
            confidence: s.confidence,
            mentions: s.frequency,
          })),
          achievements: analysisResult.data.achievements.map((a) => ({
            id: a.id,
            text: a.description,
            category: 'achievement',
            keywords: a.skills,
          })),
          experience: [],
          topics: analysisResult.data.topics.map((t) => ({
            name: t.name,
            weight: t.count,
          })),
        });

        logger.success('Analysis results stored in application state', { stage: 'COMPLETE' });

        onComplete?.(analysisResult.data);
        return analysisResult.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        logger.error('═══════════════════════════════════════════════════════════', {
          stage: 'ERROR',
        });
        logger.error(`   ANALYSIS FAILED: ${error.message}`, { stage: 'ERROR' });
        logger.error('═══════════════════════════════════════════════════════════', {
          stage: 'ERROR',
        });
        logger.debug(`Stack trace: ${error.stack || 'N/A'}`, { stage: 'ERROR' });

        setError(error);
        updateProgress({
          stage: 'error',
          message: error.message,
        });

        addStoreError(`Analysis failed: ${error.message}`);
        onError?.(error);

        return null;
      } finally {
        setIsAnalyzing(false);
        setStoreAnalyzing(false);

        // Cleanup subscriptions
        unsubscribeProgressRef.current?.();
        unsubscribeProgressRef.current = null;
        abortControllerRef.current = null;

        // Cleanup WebSocket
        if (progressWs && progressWs.readyState === WebSocket.OPEN) {
          progressWs.close();
        }
      }
    },
    [
      handleSidecarProgress,
      prepareMessages,
      updateProgress,
      setAnalysisResult,
      setStoreAnalyzing,
      addStoreError,
      onComplete,
      onError,
    ]
  );

  /**
   * Analyzes conversations from the current project.
   * DEFERRED: AnalysisPage uses the `analyze()` path directly (reads parsed-conversations.json
   * then calls analyze() with the message array). This function is a future convenience wrapper
   * for callers that only have a project reference — not needed until a second call site exists.
   */
  const analyzeCurrentProject = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!currentProject) {
      const err = new Error('No project selected');
      setError(err);
      onError?.(err);
      return null;
    }

    // Not yet wired — use analyze() with messages loaded from parsed-conversations.json instead.
    addStoreError('analyzeCurrentProject not yet implemented — use analyze() directly');
    return null;
  }, [currentProject, addStoreError, onError]);

  /**
   * Extracts skills from text (quick analysis)
   */
  const extractSkillsFromText = useCallback(
    async (text: string): Promise<Array<{ name: string; confidence: number }> | null> => {
      try {
        const result = await api.extractSkills(text);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      }
    },
    [onError]
  );

  /**
   * Cancels the current analysis
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    unsubscribeProgressRef.current?.();
    setIsAnalyzing(false);
    setStoreAnalyzing(false);
    updateProgress({
      stage: 'idle',
      message: 'Analysis cancelled',
    });
  }, [setStoreAnalyzing, updateProgress]);

  /**
   * Resets the hook state
   */
  const reset = useCallback(() => {
    cancel();
    setError(null);
    setResult(null);
    setProgress(initialProgress);
    setAnalysisResult(null);
  }, [cancel, setAnalysisResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeProgressRef.current?.();
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    // State
    isAnalyzing,
    error,
    progress,
    result,

    // Actions
    analyze,
    analyzeCurrentProject,
    extractSkillsFromText,
    cancel,
    reset,
  };
}

export default useNlpAnalysis;
