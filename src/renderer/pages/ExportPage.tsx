/**
 * Export Page
 *
 * Document export with format selection and options.
 * Supports two export types:
 * 1. Resume - Traditional resume document
 * 2. Assessment Report - Analysis data report (skills, achievements, topics)
 */

import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  FileType,
  Code,
  FileJson,
  Settings,
  CheckCircle,
  Loader2,
  ExternalLink,
  FolderOpen,
  AlertCircle,
  FileBarChart,
  User,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { useAppStore } from '../stores/app-store';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { logger } from '../stores/log-store';

// =============================================================================
// Types & Constants
// =============================================================================

type ExportType = 'resume' | 'assessment';

interface ExportTypeOption {
  id: ExportType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const exportTypes: ExportTypeOption[] = [
  {
    id: 'resume',
    name: 'Resume',
    icon: <User className="h-5 w-5" />,
    description: 'Professional resume document for job applications',
  },
  {
    id: 'assessment',
    name: 'Assessment Report',
    icon: <FileBarChart className="h-5 w-5" />,
    description: 'Detailed analysis report with skills, achievements & insights',
  },
];

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  supportedTypes: ExportType[];
}

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    extension: '.pdf',
    icon: <FileText className="h-6 w-6" />,
    description: 'Standard PDF format, best for sharing and printing',
    available: true,
    supportedTypes: ['resume', 'assessment'],
  },
  {
    id: 'docx',
    name: 'Word Document',
    extension: '.docx',
    icon: <FileType className="h-6 w-6" />,
    description: 'Microsoft Word format for easy editing',
    available: true,
    supportedTypes: ['resume'],
  },
  {
    id: 'html',
    name: 'HTML Page',
    extension: '.html',
    icon: <Code className="h-6 w-6" />,
    description: 'Web page format for online portfolios',
    available: true,
    supportedTypes: ['resume', 'assessment'],
  },
  {
    id: 'md',
    name: 'Markdown',
    extension: '.md',
    icon: <FileJson className="h-6 w-6" />,
    description: 'Plain text with formatting, great for developers',
    available: true,
    supportedTypes: ['resume', 'assessment'],
  },
  {
    id: 'txt',
    name: 'Plain Text',
    extension: '.txt',
    icon: <FileText className="h-6 w-6" />,
    description: 'Simple text format for ATS systems',
    available: true,
    supportedTypes: ['resume'],
  },
  {
    id: 'json',
    name: 'JSON Data',
    extension: '.json',
    icon: <FileJson className="h-6 w-6" />,
    description: 'Structured data format for developers',
    available: true,
    supportedTypes: ['resume', 'assessment'],
  },
];

interface ExportHistory {
  id: string;
  filename: string;
  format: string;
  exportedAt: number;
  size: string;
  path: string;
}

export const ExportPage: React.FC = () => {
  const { currentProject, analysisResult } = useAppStore();
  const [exportType, setExportType] = useState<ExportType>('resume');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [filename, setFilename] = useState('resume');

  // Update filename when export type changes
  useEffect(() => {
    setFilename(exportType === 'resume' ? 'resume' : 'assessment-report');
  }, [exportType]);

  // Filter formats based on export type
  const availableFormats = exportFormats.filter((f) => f.supportedTypes.includes(exportType));

  // Reset format selection if current format doesn't support new export type
  useEffect(() => {
    const currentFormatSupported = availableFormats.some((f) => f.id === selectedFormat);
    if (!currentFormatSupported && availableFormats.length > 0) {
      setSelectedFormat(availableFormats[0].id);
    }
  }, [exportType, availableFormats, selectedFormat]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [exportedPath, setExportedPath] = useState('');
  const [exportsPath, setExportsPath] = useState('');
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedFormatData =
    availableFormats.find((f) => f.id === selectedFormat) ||
    exportFormats.find((f) => f.id === selectedFormat);

  // Load exports path on mount
  useEffect(() => {
    api.getExportsPath().then(setExportsPath);
  }, []);

  // Generate resume content based on analysis results
  const generateResumeContent = (format: string): string => {
    const skills = analysisResult?.skills || [];
    const achievements = analysisResult?.achievements || [];
    const experience = analysisResult?.experience || [];

    const skillsList = skills.map((s) => s.name).join(', ');
    const achievementsList = achievements
      .map((a, i) => `${i + 1}. ${typeof a === 'string' ? a : a.text}`)
      .join('\n');
    const experienceList = experience
      .map(
        (e) =>
          `• ${e.title}${e.description ? ` - ${e.description}` : ''}${e.duration ? ` (${e.duration})` : ''}`
      )
      .join('\n');

    if (format === 'json') {
      return JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          skills,
          achievements,
          experience,
        },
        null,
        2
      );
    }

    if (format === 'md') {
      return `# Resume

## Skills
${skillsList || 'No skills extracted yet. Import a conversation to analyze.'}

## Achievements
${achievementsList || 'No achievements extracted yet.'}

## Experience
${experienceList || 'No experience extracted yet.'}

---
*Generated by Resume Builder on ${new Date().toLocaleDateString()}*
`;
    }

    if (format === 'html') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #10a37f; }
    h2 { color: #444; margin-top: 20px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill { background: #e8f5e9; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Resume</h1>
  <h2>Skills</h2>
  <div class="skills">
    ${skills.map((s) => `<span class="skill">${s.name}</span>`).join('\n    ')}
  </div>
  <h2>Achievements</h2>
  <ul>
    ${achievements.map((a) => `<li>${typeof a === 'string' ? a : a.text}</li>`).join('\n    ')}
  </ul>
  <h2>Experience</h2>
  <ul>
    ${experience.map((e) => `<li><strong>${e.title}</strong>${e.description ? ` - ${e.description}` : ''}${e.duration ? ` (${e.duration})` : ''}</li>`).join('\n    ')}
  </ul>
  <footer>
    <p><em>Generated by Resume Builder on ${new Date().toLocaleDateString()}</em></p>
  </footer>
</body>
</html>`;
    }

    // Default plain text format
    return `RESUME
======

SKILLS
------
${skillsList || 'No skills extracted yet.'}

ACHIEVEMENTS
------------
${achievementsList || 'No achievements extracted yet.'}

EXPERIENCE
----------
${experienceList || 'No experience extracted yet.'}

---
Generated by Resume Builder on ${new Date().toLocaleDateString()}
`;
  };

  // Generate assessment report content based on analysis results
  const generateAssessmentContent = (format: string): string => {
    const skills = analysisResult?.skills || [];
    const achievements = analysisResult?.achievements || [];
    const topics = analysisResult?.topics || [];
    const experience = analysisResult?.experience || [];

    const projectName = currentProject?.name || 'Unknown Project';
    const generatedDate = new Date().toLocaleDateString();
    const generatedTime = new Date().toLocaleTimeString();

    // Group skills by category
    const skillsByCategory = skills.reduce(
      (acc, skill) => {
        const cat = skill.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
      },
      {} as Record<string, typeof skills>
    );

    // Calculate summary stats
    const totalSkills = skills.length;
    const totalAchievements = achievements.length;
    const avgConfidence =
      skills.length > 0
        ? Math.round((skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) * 100)
        : 0;
    const totalMentions = skills.reduce((sum, s) => sum + (s.mentions || 0), 0);

    if (format === 'json') {
      return JSON.stringify(
        {
          reportType: 'Assessment Report',
          generatedAt: new Date().toISOString(),
          project: projectName,
          summary: {
            totalSkills,
            totalAchievements,
            totalTopics: topics.length,
            averageConfidence: avgConfidence,
            totalMentions,
          },
          skills,
          skillsByCategory,
          achievements,
          topics,
          experience,
        },
        null,
        2
      );
    }

    if (format === 'md') {
      const skillsTable =
        skills.length > 0
          ? `| Skill | Category | Confidence | Mentions |
|-------|----------|------------|----------|
${skills.map((s) => `| ${s.name} | ${s.category || 'Other'} | ${Math.round(s.confidence * 100)}% | ${s.mentions || 0} |`).join('\n')}`
          : 'No skills analyzed yet.';

      const topicsSection =
        topics.length > 0
          ? topics.map((t) => `- **${t.name}**: ${Math.round(t.weight * 100)}%`).join('\n')
          : 'No topics identified yet.';

      const achievementsSection =
        achievements.length > 0
          ? achievements
              .map((a, i) => {
                const text = typeof a === 'string' ? a : a.text;
                const category = typeof a === 'object' ? a.category : '';
                const keywords = typeof a === 'object' && a.keywords ? a.keywords.join(', ') : '';
                return `### ${i + 1}. ${text}\n${category ? `**Category:** ${category}` : ''}${keywords ? `\n**Keywords:** ${keywords}` : ''}`;
              })
              .join('\n\n')
          : 'No achievements identified yet.';

      return `# Assessment Report

**Project:** ${projectName}
**Generated:** ${generatedDate} at ${generatedTime}

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Skills | ${totalSkills} |
| Total Achievements | ${totalAchievements} |
| Focus Areas | ${topics.length} |
| Average Confidence | ${avgConfidence}% |
| Total Skill Mentions | ${totalMentions} |

---

## Skills Analysis

${skillsTable}

### Skills by Category

${Object.entries(skillsByCategory)
  .map(
    ([category, catSkills]) =>
      `#### ${category}\n${catSkills.map((s) => `- ${s.name} (${Math.round(s.confidence * 100)}%)`).join('\n')}`
  )
  .join('\n\n')}

---

## Topic Distribution

${topicsSection}

---

## Achievements Identified

${achievementsSection}

---

## Experience & Projects

${
  experience.length > 0
    ? experience
        .map(
          (e) =>
            `- **${e.title}**${e.description ? `: ${e.description}` : ''}${e.skills?.length ? `\n  *Skills:* ${e.skills.join(', ')}` : ''}`
        )
        .join('\n')
    : 'No experience entries identified yet.'
}

---

*Generated by Resume Builder Assessment Engine*
*${generatedDate}*
`;
    }

    if (format === 'html') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Report - ${projectName}</title>
  <style>
    :root {
      --primary: #10a37f;
      --primary-light: #e8f5e9;
      --dark: #1a1a2e;
      --darker: #16213e;
      --text: #e8e8e8;
      --text-muted: #a0a0a0;
      --border: #2a2a4a;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--dark);
      color: var(--text);
      line-height: 1.6;
      padding: 40px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      border-bottom: 3px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 { color: var(--primary); font-size: 2.5rem; margin-bottom: 8px; }
    .meta { color: var(--text-muted); font-size: 0.9rem; }
    h2 {
      color: var(--primary);
      font-size: 1.5rem;
      margin: 30px 0 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }
    h3 { color: var(--text); font-size: 1.1rem; margin: 20px 0 10px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: var(--darker);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: var(--primary); }
    .stat-label { font-size: 0.85rem; color: var(--text-muted); margin-top: 5px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      background: var(--darker);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: var(--dark); color: var(--primary); font-weight: 600; }
    tr:last-child td { border-bottom: none; }
    .progress-bar {
      background: var(--border);
      border-radius: 10px;
      height: 20px;
      overflow: hidden;
      margin: 5px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d2be, #00a896);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    .topic-item { margin: 15px 0; }
    .topic-name { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .achievement-card {
      background: var(--darker);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
    }
    .achievement-text { font-size: 1.05rem; margin-bottom: 10px; }
    .achievement-meta { display: flex; gap: 10px; flex-wrap: wrap; }
    .tag {
      background: var(--dark);
      color: var(--text-muted);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .tag.category { background: var(--primary); color: white; }
    .skill-badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--dark);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      margin: 4px;
    }
    .category-section { margin: 20px 0; }
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    @media print {
      body { background: white; color: black; }
      .stat-card, .achievement-card, table { border-color: #ddd; }
      .stat-value, h1, h2 { color: #10a37f; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Assessment Report</h1>
      <p class="meta"><strong>Project:</strong> ${projectName}</p>
      <p class="meta"><strong>Generated:</strong> ${generatedDate} at ${generatedTime}</p>
    </div>

    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value">${totalSkills}</div>
        <div class="stat-label">Skills Identified</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalAchievements}</div>
        <div class="stat-label">Achievements</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${topics.length}</div>
        <div class="stat-label">Focus Areas</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgConfidence}%</div>
        <div class="stat-label">Avg Confidence</div>
      </div>
    </div>

    <h2>Skills Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Skill</th>
          <th>Category</th>
          <th>Confidence</th>
          <th>Mentions</th>
        </tr>
      </thead>
      <tbody>
        ${skills
          .map(
            (s) => `
        <tr>
          <td>${s.name}</td>
          <td>${s.category || 'Other'}</td>
          <td>${Math.round(s.confidence * 100)}%</td>
          <td>${s.mentions || 0}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h3>Skills by Category</h3>
    ${Object.entries(skillsByCategory)
      .map(
        ([category, catSkills]) => `
    <div class="category-section">
      <h4>${category}</h4>
      <div>
        ${catSkills.map((s) => `<span class="skill-badge">${s.name}</span>`).join('')}
      </div>
    </div>`
      )
      .join('')}

    <h2>Topic Distribution</h2>
    ${topics
      .map(
        (t) => `
    <div class="topic-item">
      <div class="topic-name">
        <span>${t.name}</span>
        <span>${Math.round(t.weight * 100)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${t.weight * 100}%"></div>
      </div>
    </div>`
      )
      .join('')}

    <h2>Achievements Identified</h2>
    ${achievements
      .map((a) => {
        const text = typeof a === 'string' ? a : a.text;
        const category = typeof a === 'object' ? a.category : '';
        const keywords = typeof a === 'object' && a.keywords ? a.keywords : [];
        return `
    <div class="achievement-card">
      <p class="achievement-text">${text}</p>
      <div class="achievement-meta">
        ${category ? `<span class="tag category">${category}</span>` : ''}
        ${keywords.map((k) => `<span class="tag">${k}</span>`).join('')}
      </div>
    </div>`;
      })
      .join('')}

    <h2>Experience & Projects</h2>
    ${
      experience.length > 0
        ? experience
            .map(
              (e) => `
    <div class="achievement-card">
      <p class="achievement-text"><strong>${e.title}</strong>${e.description ? `: ${e.description}` : ''}</p>
      ${
        e.skills?.length
          ? `
      <div class="achievement-meta">
        ${e.skills.map((s) => `<span class="tag">${s}</span>`).join('')}
      </div>`
          : ''
      }
    </div>`
            )
            .join('')
        : '<p>No experience entries identified yet.</p>'
    }

    <footer>
      <p>Generated by Resume Builder Assessment Engine</p>
      <p>${generatedDate}</p>
    </footer>
  </div>
</body>
</html>`;
    }

    // Default - should not reach here for assessment, but return JSON as fallback
    return JSON.stringify(
      {
        reportType: 'Assessment Report',
        generatedAt: new Date().toISOString(),
        project: projectName,
        skills,
        achievements,
        topics,
      },
      null,
      2
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const format = selectedFormatData;
      if (!format) {
        throw new Error('No format selected');
      }

      const exportTypeName = exportType === 'resume' ? 'Resume' : 'Assessment Report';
      logger.info(`Starting ${exportTypeName} export: ${filename}${format.extension}`, {
        stage: 'EXPORT',
      });
      setExportProgress(10);

      // For PDF and DOCX resumes, use the backend generators
      if (exportType === 'resume' && (format.id === 'pdf' || format.id === 'docx')) {
        setExportProgress(20);

        // Prepare resume data
        const sections = [
          {
            id: 'skills',
            type: 'skills',
            title: 'Skills',
            content: (analysisResult?.skills || []).map((s) => s.name).join(', '),
            visible: true,
          },
          {
            id: 'achievements',
            type: 'achievements',
            title: 'Achievements',
            content: (analysisResult?.achievements || [])
              .map((a) => (typeof a === 'string' ? a : a.text))
              .join('\n'),
            visible: true,
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experience',
            content: (analysisResult?.experience || [])
              .map(
                (e) =>
                  `${e.title}${e.description ? ` - ${e.description}` : ''}${e.duration ? ` (${e.duration})` : ''}`
              )
              .join('\n'),
            visible: true,
          },
        ];

        setExportProgress(40);

        // Generate document
        const generateFn = format.id === 'pdf' ? api.resume.generatePdf : api.resume.generateDocx;

        const result = await generateFn({ sections, template: 'default' });

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate document');
        }

        setExportProgress(60);

        // Convert Uint8Array to base64 for saving binary content
        const uint8Array = result.data;
        const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('');

        // Show save dialog
        const saveResult = await api.saveFile({
          content: binaryString,
          filters: [{ name: format.name, extensions: [format.id] }],
        });

        if (!saveResult.success) {
          if (saveResult.error?.message?.includes('cancelled')) {
            setIsExporting(false);
            return;
          }
          throw new Error(saveResult.error?.message || 'Failed to save file');
        }

        setExportProgress(100);
        setExportedPath(saveResult.data);
      } else if (exportType === 'assessment' && format.id === 'pdf') {
        // Assessment PDF - use proper PDF generation
        setExportProgress(20);

        // Prepare assessment data
        const skills = analysisResult?.skills || [];
        const achievements = analysisResult?.achievements || [];
        const topics = analysisResult?.topics || [];
        const experience = analysisResult?.experience || [];

        const assessmentData = {
          projectName: currentProject?.name || 'Assessment Report',
          skills: skills.map((s) => ({
            name: s.name,
            category: s.category || 'Other',
            confidence: s.confidence,
            mentions: s.mentions || 0,
          })),
          achievements: achievements.map((a, i) => ({
            id: typeof a === 'object' && a.id ? a.id : `ach-${i}`,
            text: typeof a === 'string' ? a : a.text,
            category: typeof a === 'object' ? a.category || '' : '',
            keywords: typeof a === 'object' && a.keywords ? a.keywords : [],
          })),
          topics: topics.map((t) => ({
            name: t.name,
            weight: t.weight,
          })),
          experience: experience.map((e, i) => ({
            id: e.id || `exp-${i}`,
            title: e.title,
            description: e.description || '',
            duration: e.duration,
            skills: e.skills || [],
          })),
        };

        setExportProgress(40);

        // Generate PDF
        const result = await api.assessment.generatePdf(assessmentData);

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate assessment PDF');
        }

        setExportProgress(60);

        // Convert Uint8Array to binary string for saving
        const uint8Array = result.data;
        const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('');

        // Show save dialog
        const saveResult = await api.saveFile({
          content: binaryString,
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
        });

        if (!saveResult.success) {
          if (saveResult.error?.message?.includes('cancelled')) {
            setIsExporting(false);
            return;
          }
          throw new Error(saveResult.error?.message || 'Failed to save file');
        }

        setExportProgress(100);
        setExportedPath(saveResult.data);
      } else {
        // Text-based formats (txt, md, json, html)
        setExportProgress(30);

        const content =
          exportType === 'resume'
            ? generateResumeContent(format.id)
            : generateAssessmentContent(format.id);

        setExportProgress(50);

        // Show save dialog
        const saveResult = await api.saveFile({
          content,
          filters: [{ name: format.name, extensions: [format.id] }],
        });

        if (!saveResult.success) {
          if (saveResult.error?.message?.includes('cancelled')) {
            setIsExporting(false);
            return;
          }
          throw new Error(saveResult.error?.message || 'Failed to save file');
        }

        setExportProgress(100);
        setExportedPath(saveResult.data);
      }

      // Add to export history
      const newExport: ExportHistory = {
        id: Date.now().toString(),
        filename: filename,
        format: format.id,
        exportedAt: Date.now(),
        size: 'N/A',
        path: exportedPath,
      };
      setExportHistory((prev) => [newExport, ...prev].slice(0, 10));

      logger.success(`Export complete: ${exportedPath}`, { stage: 'EXPORT' });
      setShowSuccessDialog(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Export failed: ${message}`, { stage: 'EXPORT' });
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenExportsFolder = async () => {
    if (exportsPath) {
      const result = await api.openPath(exportsPath);
      if (!result.success) {
        logger.error(`Failed to open exports folder: ${result.error?.message}`, {
          stage: 'EXPORT',
        });
      }
    }
  };

  const handleOpenFile = async (filePath: string) => {
    const result = await api.showItemInFolder(filePath);
    if (!result.success) {
      logger.error(`Failed to show file: ${result.error?.message}`, { stage: 'EXPORT' });
    }
  };

  const handleOpenExportedFile = async () => {
    if (exportedPath) {
      await handleOpenFile(exportedPath);
      setShowSuccessDialog(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Download className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a resume to export it</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Options */}
        <div className="space-y-6 lg:col-span-2">
          {/* Export Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Export Type</CardTitle>
              <CardDescription>Choose what you want to export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {exportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setExportType(type.id)}
                    className={cn(
                      'flex items-start gap-4 rounded-lg border p-4 text-left transition-all',
                      exportType === type.id
                        ? 'bg-primary/5 border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        exportType === type.id
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{type.name}</p>
                        {exportType === type.id && <CheckCircle className="h-5 w-5 text-primary" />}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>
                Choose the format for your{' '}
                {exportType === 'resume' ? 'resume' : 'assessment report'} export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {availableFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    disabled={!format.available}
                    className={cn(
                      'flex flex-col items-start rounded-lg border p-4 text-left transition-all',
                      selectedFormat === format.id
                        ? 'bg-primary/5 border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50',
                      !format.available && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className={cn(
                          'rounded-lg p-2',
                          selectedFormat === format.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {format.icon}
                      </div>
                      {selectedFormat === format.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-medium">{format.name}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure your export options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Filename</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename"
                  />
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                    {selectedFormatData?.extension}
                  </div>
                </div>
              </div>

              {selectedFormat === 'pdf' && (
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="font-medium">PDF Options</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Page Size</label>
                      <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Letter (8.5 x 11 in)</option>
                        <option>A4 (210 x 297 mm)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Margins</label>
                      <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Normal (1 inch)</option>
                        <option>Narrow (0.5 inch)</option>
                        <option>Wide (1.5 inch)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}

              {exportError && (
                <div className="border-destructive/50 bg-destructive/10 flex items-center gap-2 rounded-lg border p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{exportError}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleExport}
                disabled={isExporting || !filename.trim()}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Exporting {exportType === 'resume' ? 'Resume' : 'Report'}...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Export {exportType === 'resume' ? 'Resume' : 'Assessment'} as{' '}
                    {selectedFormatData?.name}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenExportsFolder}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Export Folder
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Settings className="mr-2 h-4 w-4" />
                Export Preferences
              </Button>
              {exportsPath && (
                <p className="truncate text-xs text-muted-foreground" title={exportsPath}>
                  {exportsPath}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent>
              {exportHistory.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No exports yet</p>
              ) : (
                <div className="space-y-3">
                  {exportHistory.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.filename}.{item.format}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.exportedAt).toLocaleDateString()} &bull; {item.size}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenFile(item.path)}
                        title="Show in folder"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {exportType === 'resume' ? (
                <>
                  <p>
                    <strong className="text-foreground">PDF</strong> is recommended for job
                    applications - it preserves formatting across all devices.
                  </p>
                  <p>
                    <strong className="text-foreground">DOCX</strong> allows recruiters to easily
                    edit and annotate your resume.
                  </p>
                  <p>
                    <strong className="text-foreground">Plain Text</strong> works best with
                    Applicant Tracking Systems (ATS).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-foreground">PDF</strong> exports as HTML - open in
                    browser and use Print {'>'} Save as PDF.
                  </p>
                  <p>
                    <strong className="text-foreground">HTML</strong> creates a styled report you
                    can view in any browser.
                  </p>
                  <p>
                    <strong className="text-foreground">Markdown</strong> is great for sharing in
                    technical documentation.
                  </p>
                  <p>
                    <strong className="text-foreground">JSON</strong> exports raw data for
                    integration with other tools.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Export Complete
            </DialogTitle>
            <DialogDescription>
              Your {exportType === 'resume' ? 'resume' : 'assessment report'} has been exported
              successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Saved to:</p>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={exportedPath}>
                {exportedPath}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
            <Button onClick={handleOpenExportedFile}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Show in Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
