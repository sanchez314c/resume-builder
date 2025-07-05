/**
 * Resume Generator Hook
 *
 * Handles the complete resume generation workflow:
 * 1. Collect resume section data
 * 2. Apply template formatting
 * 3. Generate PDF/DOCX output
 * 4. Handle file saving
 * 5. AI content enhancement
 */

import { useState, useCallback, useMemo } from 'react';
import { api, ResumeData, ResumeSection } from '../services/api';
import { useAppStore } from '../stores/app-store';
import type { Result } from '@common/types';

// =============================================================================
// Types
// =============================================================================

export type ResumeFormat = 'pdf' | 'docx';

export type ResumeSectionType =
  | 'header'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'custom';

export interface HeaderContent {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  achievements: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
  honors?: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  highlights: string[];
}

export interface ResumeSectionData {
  id: string;
  type: ResumeSectionType;
  title: string;
  content:
    | HeaderContent
    | string
    | ExperienceEntry[]
    | EducationEntry[]
    | ProjectEntry[]
    | string[];
  visible: boolean;
  order: number;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

export interface GenerationProgress {
  stage: 'idle' | 'preparing' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
}

export interface GenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  format: ResumeFormat;
  size?: number;
}

export interface UseResumeGeneratorOptions {
  /** Default template to use */
  defaultTemplate?: string;
  /** Auto-save after generation */
  autoSave?: boolean;
  /** Callback on generation complete */
  onComplete?: (result: GenerationResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

// =============================================================================
// Templates
// =============================================================================

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with subtle colors',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional layout',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with focus on content',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative professionals',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Optimized for technical roles with skill emphasis',
  },
];

// =============================================================================
// Default Sections
// =============================================================================

const createDefaultSections = (): ResumeSectionData[] => [
  {
    id: 'header',
    type: 'header',
    title: 'Personal Information',
    content: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
    } as HeaderContent,
    visible: true,
    order: 0,
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'Professional Summary',
    content: '',
    visible: true,
    order: 1,
  },
  {
    id: 'experience',
    type: 'experience',
    title: 'Work Experience',
    content: [] as ExperienceEntry[],
    visible: true,
    order: 2,
  },
  {
    id: 'skills',
    type: 'skills',
    title: 'Skills',
    content: [] as string[],
    visible: true,
    order: 3,
  },
  {
    id: 'education',
    type: 'education',
    title: 'Education',
    content: [] as EducationEntry[],
    visible: true,
    order: 4,
  },
  {
    id: 'projects',
    type: 'projects',
    title: 'Projects',
    content: [] as ProjectEntry[],
    visible: false,
    order: 5,
  },
];

// =============================================================================
// Hook Implementation
// =============================================================================

export function useResumeGenerator(options: UseResumeGeneratorOptions = {}) {
  const { defaultTemplate = 'modern', autoSave = false, onComplete, onError } = options;

  // State
  const [sections, setSections] = useState<ResumeSectionData[]>(createDefaultSections);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({ stage: 'idle', message: '' });
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);

  // Store access
  const { analysisResult, addError: addStoreError } = useAppStore();

  /**
   * Sorted sections by order
   */
  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );

  /**
   * Visible sections only
   */
  const visibleSections = useMemo(
    () => orderedSections.filter((s) => s.visible),
    [orderedSections]
  );

  /**
   * Updates a section's content
   */
  const updateSection = useCallback(
    <T extends ResumeSectionData['content']>(sectionId: string, content: T) => {
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, content } : s)));
    },
    []
  );

  /**
   * Updates section visibility
   */
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, visible: !s.visible } : s))
    );
  }, []);

  /**
   * Reorders sections
   */
  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setSections((prev) => {
      const newSections = [...prev];
      const [removed] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, removed);

      // Update order values
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  /**
   * Adds a new section
   */
  const addSection = useCallback(
    (type: ResumeSectionType, title?: string) => {
      const newSection: ResumeSectionData = {
        id: `${type}-${Date.now()}`,
        type,
        title: title || type.charAt(0).toUpperCase() + type.slice(1),
        content: type === 'skills' ? [] : '',
        visible: true,
        order: sections.length,
      };

      setSections((prev) => [...prev, newSection]);
      return newSection;
    },
    [sections.length]
  );

  /**
   * Removes a section
   */
  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  /**
   * Populates sections from analysis result
   */
  const populateFromAnalysis = useCallback(() => {
    if (!analysisResult) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.type === 'skills' && analysisResult.skills.length > 0) {
          return {
            ...section,
            content: analysisResult.skills.map((s) => s.name),
          };
        }
        return section;
      })
    );
  }, [analysisResult]);

  /**
   * Prepares resume data for generation
   */
  const prepareResumeData = useCallback((): ResumeData => {
    const resumeSections: ResumeSection[] = visibleSections.map((section) => ({
      id: section.id,
      type: section.type,
      title: section.title,
      content: section.content,
      visible: section.visible,
    }));

    return {
      sections: resumeSections,
      template: selectedTemplate,
    };
  }, [visibleSections, selectedTemplate]);

  /**
   * Generates the resume in specified format
   */
  const generate = useCallback(
    async (format: ResumeFormat = 'pdf'): Promise<GenerationResult | null> => {
      setIsGenerating(true);
      setError(null);
      setProgress({ stage: 'preparing', message: 'Preparing resume data...' });

      try {
        const resumeData = prepareResumeData();

        setProgress({ stage: 'generating', message: `Generating ${format.toUpperCase()}...` });

        let result: Result<Uint8Array>;

        if (format === 'pdf') {
          result = await api.resume.generatePdf(resumeData);
        } else {
          result = await api.resume.generateDocx(resumeData);
        }

        if (!result.success) {
          throw new Error(result.error.message);
        }

        const generationResult: GenerationResult = {
          success: true,
          format,
          size: result.data.length,
        };

        // Auto-save if enabled
        if (autoSave) {
          setProgress({ stage: 'saving', message: 'Saving file...' });

          const saveResult = await api.file.saveFile({
            content: Buffer.from(result.data).toString('base64'),
            filters: [
              {
                name: format === 'pdf' ? 'PDF Files' : 'Word Documents',
                extensions: [format],
              },
            ],
          });

          if (saveResult.success) {
            generationResult.filePath = saveResult.data;
          }
        }

        setProgress({ stage: 'complete', message: 'Resume generated successfully' });
        setLastResult(generationResult);
        onComplete?.(generationResult);

        return generationResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        setError(error);
        setProgress({ stage: 'error', message: error.message });
        addStoreError(`Resume generation failed: ${error.message}`);

        const failResult: GenerationResult = {
          success: false,
          error: error.message,
          format,
        };

        setLastResult(failResult);
        onError?.(error);

        return failResult;
      } finally {
        setIsGenerating(false);
      }
    },
    [prepareResumeData, autoSave, addStoreError, onComplete, onError]
  );

  /**
   * Generates and saves PDF
   */
  const generatePdf = useCallback(() => generate('pdf'), [generate]);

  /**
   * Generates and saves DOCX
   */
  const generateDocx = useCallback(() => generate('docx'), [generate]);

  /**
   * Enhances section content with AI
   */
  const enhanceSection = useCallback(
    async (sectionId: string): Promise<string | null> => {
      const section = sections.find((s) => s.id === sectionId);

      if (!section || typeof section.content !== 'string') {
        return null;
      }

      setIsEnhancing(true);

      try {
        const result = await api.resume.enhanceText(section.content);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        // Update section with enhanced content
        updateSection(sectionId, result.data);

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        addStoreError(`Enhancement failed: ${error.message}`);
        onError?.(error);
        return null;
      } finally {
        setIsEnhancing(false);
      }
    },
    [sections, updateSection, addStoreError, onError]
  );

  /**
   * Exports resume data as JSON
   */
  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        sections,
        template: selectedTemplate,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [sections, selectedTemplate]);

  /**
   * Imports resume data from JSON
   */
  const importData = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);

      if (data.sections && Array.isArray(data.sections)) {
        setSections(data.sections);
      }

      if (data.template) {
        setSelectedTemplate(data.template);
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Resets to default state
   */
  const reset = useCallback(() => {
    setSections(createDefaultSections());
    setSelectedTemplate(defaultTemplate);
    setError(null);
    setProgress({ stage: 'idle', message: '' });
    setLastResult(null);
  }, [defaultTemplate]);

  return {
    // State
    sections,
    orderedSections,
    visibleSections,
    selectedTemplate,
    isGenerating,
    isEnhancing,
    progress,
    error,
    lastResult,

    // Template management
    templates: RESUME_TEMPLATES,
    setSelectedTemplate,

    // Section management
    updateSection,
    toggleSectionVisibility,
    reorderSections,
    addSection,
    removeSection,

    // Data population
    populateFromAnalysis,

    // Generation
    generate,
    generatePdf,
    generateDocx,

    // AI Enhancement
    enhanceSection,

    // Import/Export
    exportData,
    importData,

    // Reset
    reset,
  };
}

export default useResumeGenerator;
