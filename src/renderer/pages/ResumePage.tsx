/**
 * Resume Page
 *
 * Resume builder with section editor and preview.
 * Wired to useResumeGenerator hook for real generation.
 */

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Eye,
  Layout,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Download,
  FileType,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import { useAppStore } from '../stores/app-store';
import { useResumeGenerator, HeaderContent } from '../hooks/use-resume-generator';
import { cn } from '../lib/utils';

// =============================================================================
// Component
// =============================================================================

export const ResumePage: React.FC = () => {
  // Store access
  const { currentProject, analysisResult, setCurrentPage } = useAppStore();

  // Resume generator hook
  const {
    sections,
    orderedSections,
    selectedTemplate,
    isGenerating,
    isEnhancing,
    progress,
    error,
    lastResult,
    templates,
    setSelectedTemplate,
    updateSection,
    toggleSectionVisibility,
    addSection,
    removeSection,
    populateFromAnalysis,
    generatePdf,
    generateDocx,
    enhanceSection,
    reset,
  } = useResumeGenerator({
    defaultTemplate: 'modern',
    onComplete: (_result) => {
      // Completion handled by store/UI update
    },
    onError: (err) => {
      console.error('Generation error:', err);
    },
  });

  // Local state
  const [activeSection, setActiveSection] = useState<string | null>('header');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['header', 'summary', 'experience', 'skills'])
  );
  const [enhancingSection, setEnhancingSection] = useState<string | null>(null);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const toggleExpanded = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      toggleExpanded(sectionId);
    },
    [toggleExpanded]
  );

  const handleContentChange = useCallback(
    (sectionId: string, content: string) => {
      updateSection(sectionId, content);
    },
    [updateSection]
  );

  const handleHeaderChange = useCallback(
    (field: keyof HeaderContent, value: string) => {
      const headerSection = sections.find((s) => s.type === 'header');
      if (headerSection) {
        const currentContent = (headerSection.content as HeaderContent) || {
          fullName: '',
          email: '',
          phone: '',
          location: '',
        };
        updateSection('header', { ...currentContent, [field]: value });
      }
    },
    [sections, updateSection]
  );

  const handleEnhanceSection = useCallback(
    async (sectionId: string) => {
      setEnhancingSection(sectionId);
      await enhanceSection(sectionId);
      setEnhancingSection(null);
    },
    [enhanceSection]
  );

  const handlePopulateFromAnalysis = useCallback(() => {
    populateFromAnalysis();
  }, [populateFromAnalysis]);

  const handleGeneratePdf = useCallback(async () => {
    await generatePdf();
  }, [generatePdf]);

  const handleGenerateDocx = useCallback(async () => {
    await generateDocx();
  }, [generateDocx]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const headerContent = (sections.find((s) => s.type === 'header')?.content as HeaderContent) || {
    fullName: '',
    email: '',
    phone: '',
    location: '',
  };

  const hasAnalysisData = Boolean(analysisResult);

  // ==========================================================================
  // Render - No Project
  // ==========================================================================

  if (!currentProject) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Import conversation data to build your resume
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
  // Render - Main Content
  // ==========================================================================

  return (
    <div className="page-container">
      {/* Generation Status */}
      {isGenerating && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="flex-1">
              <p className="font-medium">{progress.message || 'Generating resume...'}</p>
              <p className="text-sm text-muted-foreground">Stage: {progress.stage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {lastResult?.success && (
        <Card className="bg-success/5 border-success">
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle className="h-6 w-6 text-success" />
            <div className="flex-1">
              <p className="font-medium text-success">Resume Generated Successfully</p>
              <p className="text-sm text-muted-foreground">
                {lastResult.format.toUpperCase()} file ready{' '}
                {lastResult.filePath && `at ${lastResult.filePath}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-destructive/5 border-destructive">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Generation Failed</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Integration Banner */}
      {hasAnalysisData && (
        <Card className="border-info bg-info/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Wand2 className="text-info h-5 w-5" />
              <div>
                <p className="font-medium">Analysis Data Available</p>
                <p className="text-sm text-muted-foreground">
                  Auto-populate your resume with extracted skills and achievements
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handlePopulateFromAnalysis}>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Fill
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-4">
          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Template</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-all',
                      selectedTemplate === template.id
                        ? 'bg-primary/5 border-primary'
                        : 'hover:border-primary/50'
                    )}
                  >
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Resume Sections</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => addSection('experience')}>
                      Work Experience
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addSection('education')}>
                      Education
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addSection('projects')}>
                      Projects
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addSection('skills')}>Skills</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addSection('certifications')}>
                      Certifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addSection('custom')}>
                      Custom Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderedSections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    'rounded-lg border transition-all',
                    activeSection === section.id && 'ring-2 ring-primary',
                    !section.visible && 'opacity-50'
                  )}
                >
                  <div
                    className="flex cursor-pointer items-center gap-2 p-3"
                    onClick={() => handleSectionClick(section.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{section.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionVisibility(section.id);
                      }}
                    >
                      {section.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                    {section.type !== 'header' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                  {expandedSections.has(section.id) && (
                    <div className="border-t p-3">
                      {section.type === 'header' ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            placeholder="Full Name"
                            value={headerContent.fullName}
                            onChange={(e) => handleHeaderChange('fullName', e.target.value)}
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={headerContent.email}
                            onChange={(e) => handleHeaderChange('email', e.target.value)}
                          />
                          <Input
                            placeholder="Phone"
                            type="tel"
                            value={headerContent.phone}
                            onChange={(e) => handleHeaderChange('phone', e.target.value)}
                          />
                          <Input
                            placeholder="Location"
                            value={headerContent.location}
                            onChange={(e) => handleHeaderChange('location', e.target.value)}
                          />
                          <Input
                            placeholder="LinkedIn URL"
                            className="md:col-span-2"
                            value={headerContent.linkedin || ''}
                            onChange={(e) => handleHeaderChange('linkedin', e.target.value)}
                          />
                        </div>
                      ) : section.type === 'skills' ? (
                        <div>
                          <Textarea
                            placeholder="Enter skills separated by commas (e.g., Python, JavaScript, React)"
                            className="min-h-[100px]"
                            value={
                              Array.isArray(section.content)
                                ? (section.content as string[]).join(', ')
                                : String(section.content || '')
                            }
                            onChange={(e) => {
                              const skills = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              updateSection(section.id, skills);
                            }}
                          />
                        </div>
                      ) : (
                        <Textarea
                          placeholder={`Enter your ${section.title.toLowerCase()}...`}
                          className="min-h-[100px]"
                          value={typeof section.content === 'string' ? section.content : ''}
                          onChange={(e) => handleContentChange(section.id, e.target.value)}
                        />
                      )}
                      {section.type !== 'header' && section.type !== 'skills' && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnhanceSection(section.id)}
                            disabled={
                              isEnhancing || typeof section.content !== 'string' || !section.content
                            }
                          >
                            {enhancingSection === section.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enhancing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                AI Enhance
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isGenerating}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleGeneratePdf}>
                        <FileType className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleGenerateDocx}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as DOCX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Resume Preview */}
              <div className="aspect-[8.5/11] overflow-hidden rounded-lg border bg-white p-6 shadow-inner">
                <div className="h-full overflow-auto">
                  {/* Live Preview Content */}
                  <div className="space-y-4 text-sm">
                    {/* Header */}
                    <div className="border-b pb-4 text-center">
                      <h1 className="text-xl font-bold text-gray-900">
                        {headerContent.fullName || 'Your Name'}
                      </h1>
                      <p className="text-gray-600">
                        {[headerContent.email, headerContent.phone, headerContent.location]
                          .filter(Boolean)
                          .join(' | ') || 'email@example.com | (555) 123-4567 | City, State'}
                      </p>
                      {headerContent.linkedin && (
                        <p className="text-primary">{headerContent.linkedin}</p>
                      )}
                    </div>

                    {/* Visible Sections */}
                    {orderedSections
                      .filter((s) => s.visible && s.type !== 'header')
                      .map((section) => (
                        <div key={section.id}>
                          <h2 className="mb-2 font-bold uppercase text-gray-800">
                            {section.title}
                          </h2>
                          {section.type === 'skills' ? (
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(section.content)
                                ? (section.content as string[])
                                : []
                              ).map((skill, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                >
                                  {skill}
                                </span>
                              ))}
                              {(!section.content ||
                                (Array.isArray(section.content) &&
                                  section.content.length === 0)) && (
                                <span className="italic text-gray-400">Add skills above...</span>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-gray-600">
                              {typeof section.content === 'string' && section.content
                                ? section.content
                                : `Enter ${section.title.toLowerCase()} content...`}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Preview uses the {templates.find((t) => t.id === selectedTemplate)?.name} template
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;
