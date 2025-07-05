/**
 * Hooks Index
 *
 * Barrel export for all custom hooks.
 */

// Theme hook (re-exports from ThemeProvider)
export { useTheme, ThemeProvider, themeScript } from './useTheme';
export type { Theme, ResolvedTheme } from './useTheme';

// File import hook
export { useFileImport } from './use-file-import';
export type {
  ImportedConversation,
  ImportProgress,
  ImportResult,
  UseFileImportOptions,
} from './use-file-import';

// NLP analysis hook
export { useNlpAnalysis } from './use-nlp-analysis';
export type {
  AnalysisStage,
  AnalysisProgress,
  AnalysisOptions,
  UseNlpAnalysisOptions,
} from './use-nlp-analysis';

// Resume generator hook
export { useResumeGenerator, RESUME_TEMPLATES } from './use-resume-generator';
export type {
  ResumeFormat,
  ResumeSectionType,
  HeaderContent,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  ResumeSectionData,
  ResumeTemplate,
  GenerationProgress,
  GenerationResult,
  UseResumeGeneratorOptions,
} from './use-resume-generator';
