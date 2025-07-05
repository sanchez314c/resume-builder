# Product Requirements Document (PRD)
# Resume Builder - Electron Application

**Version:** 1.0.0
**Date:** 2026-02-02
**Author:** Master Control
**Status:** Draft - Pending User Review

---

## 1. Overview

### 1.1 Product Vision
Resume Builder is a cross-platform desktop application that transforms personal data from AI conversation histories into professional resumes and career analytics. The application uses NLP and GenAI to extract skills, achievements, and work history, then maps them to industry job titles and helps users build tailored resumes and cover letters.

### 1.2 Problem Statement
Professionals accumulate valuable career information through AI assistant conversations (ChatGPT, Claude) but lack tools to:
- Extract and organize this data into career-relevant formats
- Identify skills and achievements from unstructured text
- Match their experience to industry job titles
- Generate professional documents from this analysis

### 1.3 Target Users
- Job seekers using AI assistants for work tasks
- Professionals wanting to document AI-assisted accomplishments
- Career changers analyzing transferable skills
- Recruiters/HR analyzing candidate conversation exports

---

## 2. Product Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ELECTRON APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         RENDERER PROCESS                                │ │
│  │                    React 18 + TypeScript + Tailwind                     │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   Import     │ │   Analysis   │ │   Resume     │ │   Export     │  │ │
│  │  │   Wizard     │ │   Dashboard  │ │   Builder    │ │   Center     │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │ IPC                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          MAIN PROCESS                                   │ │
│  │                         Node.js + Electron                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │    File      │ │   Python     │ │    PDF       │ │   Data       │  │ │
│  │  │   Service    │ │   Bridge     │ │   Service    │ │   Store      │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │ child_process                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PYTHON SIDECAR                                  │ │
│  │                      FastAPI + NLP Pipeline                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   spaCy      │ │   BERT       │ │  Sentiment   │ │   Topic      │  │ │
│  │  │   NER        │ │  Embeddings  │ │  Analysis    │ │   Modeling   │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Desktop Framework | Electron 28+ | Cross-platform, native integration |
| UI Framework | React 18 | Component ecosystem, hooks |
| Language | TypeScript 5+ | Type safety, maintainability |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, accessible components |
| State Management | Zustand | Lightweight, TypeScript-first |
| Data Fetching | TanStack Query | Caching, async state |
| Build Tool | Vite | Fast HMR, modern bundling |
| Testing | Vitest + Playwright | Unit and E2E coverage |
| PDF Generation | pdf-lib | Pure JS, no native deps |
| Charts | Recharts | React-native, composable |
| NLP Runtime | Python 3.10+ sidecar | ML library ecosystem |
| ML Models | spaCy, Transformers, NLTK | Proven NLP stack |
| GenAI | Anthropic Claude API | Resume refinement |
| Local Database | SQLite + Drizzle ORM | Typed, embedded |

---

## 3. Functional Requirements

### 3.1 Data Import Module

#### FR-1.1: File Import
- **FR-1.1.1**: Accept JSON files via native file dialog
- **FR-1.1.2**: Accept JSON files via drag-and-drop
- **FR-1.1.3**: Support multi-file batch import
- **FR-1.1.4**: Support folder import with recursive scanning

#### FR-1.2: Format Detection & Parsing
- **FR-1.2.1**: Auto-detect ChatGPT export format (mapping tree structure)
- **FR-1.2.2**: Auto-detect Claude export format
- **FR-1.2.3**: Auto-detect generic role/content format
- **FR-1.2.4**: Handle malformed JSON with graceful error recovery
- **FR-1.2.5**: Parse conversation tree into flat message array

#### FR-1.3: Data Validation
- **FR-1.3.1**: Validate JSON schema
- **FR-1.3.2**: Detect and report missing required fields
- **FR-1.3.3**: Auto-repair common format issues
- **FR-1.3.4**: Show import statistics (messages, date range, etc.)

### 3.2 NLP Analysis Module

#### FR-2.1: Skill Extraction
- **FR-2.1.1**: Extract technical skills via regex patterns
- **FR-2.1.2**: Extract skills via Named Entity Recognition (NER)
- **FR-2.1.3**: Expand skill keywords with synonyms (WordNet)
- **FR-2.1.4**: Categorize skills (AI/ML, Programming, Cloud, etc.)
- **FR-2.1.5**: Track skill frequency across conversations
- **FR-2.1.6**: Support custom skill dictionaries

#### FR-2.2: Achievement Detection
- **FR-2.2.1**: Detect achievement sentences via pattern matching
- **FR-2.2.2**: Score achievements using sentiment analysis
- **FR-2.2.3**: Extract context for each achievement
- **FR-2.2.4**: Rank achievements by relevance/impact

#### FR-2.3: Timeline Generation
- **FR-2.3.1**: Parse timestamps from conversation data
- **FR-2.3.2**: Categorize events (development, deployment, etc.)
- **FR-2.3.3**: Generate chronological skill evolution
- **FR-2.3.4**: Visualize activity over time

#### FR-2.4: Semantic Analysis
- **FR-2.4.1**: Generate sentence embeddings for content
- **FR-2.4.2**: Perform topic modeling (BERTopic)
- **FR-2.4.3**: Cluster related skills
- **FR-2.4.4**: Calculate semantic similarity scores

### 3.3 Job Matching Module

#### FR-3.1: Job Description Analysis
- **FR-3.1.1**: Parse job descriptions from text input
- **FR-3.1.2**: Extract required skills from job descriptions
- **FR-3.1.3**: Calculate semantic match score
- **FR-3.1.4**: Identify skill gaps

#### FR-3.2: Job Title Mapping
- **FR-3.2.1**: Maintain industry job title database
- **FR-3.2.2**: Match user skills to job titles
- **FR-3.2.3**: Rank job titles by match percentage
- **FR-3.2.4**: Show required vs. present skills per title

### 3.4 Resume Builder Module

#### FR-4.1: Content Organization
- **FR-4.1.1**: Auto-organize extracted data into resume sections
- **FR-4.1.2**: Allow manual editing of all content
- **FR-4.1.3**: Support drag-and-drop reordering
- **FR-4.1.4**: Save multiple resume versions

#### FR-4.2: GenAI Enhancement
- **FR-4.2.1**: Integrate Claude API for content refinement
- **FR-4.2.2**: Suggest improved achievement phrasing
- **FR-4.2.3**: Generate professional summary
- **FR-4.2.4**: Tailor content to specific job descriptions

#### FR-4.3: Templates
- **FR-4.3.1**: Provide multiple resume templates
- **FR-4.3.2**: Support custom template creation
- **FR-4.3.3**: Allow template customization (colors, fonts)

### 3.5 Export Module

#### FR-5.1: Document Export
- **FR-5.1.1**: Export to PDF format
- **FR-5.1.2**: Export to DOCX format
- **FR-5.1.3**: Export to HTML format
- **FR-5.1.4**: Export to Markdown format

#### FR-5.2: Data Export
- **FR-5.2.1**: Export extracted skills as JSON/CSV
- **FR-5.2.2**: Export analysis results
- **FR-5.2.3**: Export visualizations as PNG

### 3.6 Analytics Dashboard

#### FR-6.1: Visualizations
- **FR-6.1.1**: Skills distribution chart
- **FR-6.1.2**: Skill evolution over time
- **FR-6.1.3**: Job match scores comparison
- **FR-6.1.4**: Topic cluster visualization
- **FR-6.1.5**: Sentiment analysis timeline

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1**: Process 100MB JSON file in < 60 seconds
- **NFR-1.2**: UI must remain responsive during processing
- **NFR-1.3**: PDF generation in < 5 seconds
- **NFR-1.4**: Dashboard renders in < 2 seconds

### 4.2 Scalability
- **NFR-2.1**: Handle files up to 500MB
- **NFR-2.2**: Support 10,000+ conversation entries
- **NFR-2.3**: Efficient memory usage (< 2GB for typical workloads)

### 4.3 Reliability
- **NFR-3.1**: Graceful error handling with user feedback
- **NFR-3.2**: Auto-save work in progress
- **NFR-3.3**: Crash recovery with data preservation

### 4.4 Security
- **NFR-4.1**: All data processed locally by default
- **NFR-4.2**: API keys stored in secure OS keychain
- **NFR-4.3**: No telemetry or data collection
- **NFR-4.4**: Optional cloud features require explicit consent

### 4.5 Usability
- **NFR-5.1**: Intuitive wizard-based import flow
- **NFR-5.2**: Real-time processing progress indicators
- **NFR-5.3**: Keyboard navigation support
- **NFR-5.4**: Dark/light theme support

### 4.6 Platform Support
- **NFR-6.1**: Linux (Ubuntu 20.04+, Debian 11+)
- **NFR-6.2**: Windows 10/11
- **NFR-6.3**: macOS 12+ (Intel and Apple Silicon)

---

## 5. Data Models

### 5.1 Core Entities

```typescript
// Conversation data
interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  source: 'chatgpt' | 'claude' | 'generic';
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | null;
}

// Extracted data
interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  frequency: number;
  confidence: number;
  sources: string[]; // message IDs
}

interface ExtractedAchievement {
  description: string;
  context: string;
  sentimentScore: number;
  date: Date | null;
  skills: string[];
}

interface TimelineEvent {
  date: Date;
  event: string;
  type: 'development' | 'deployment' | 'achievement' | 'learning';
}

// Job matching
interface JobMatch {
  title: string;
  description: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

// Resume
interface Resume {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  targetJob: string | null;
  sections: ResumeSection[];
  template: string;
}

interface ResumeSection {
  type: 'summary' | 'skills' | 'experience' | 'achievements' | 'education';
  title: string;
  content: any;
  order: number;
  visible: boolean;
}
```

### 5.2 Database Schema (SQLite)

```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT,
  source TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER,
  raw_data TEXT NOT NULL
);

-- Extracted Skills
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  category TEXT,
  frequency INTEGER NOT NULL,
  confidence REAL
);

-- Resumes
CREATE TABLE resumes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 6. API Specifications

### 6.1 IPC API (Main <-> Renderer)

```typescript
// File operations
interface FileAPI {
  'file:select': () => Promise<string[]>;
  'file:read': (path: string) => Promise<string>;
  'file:save': (path: string, content: string) => Promise<void>;
}

// NLP operations
interface NLPAPI {
  'nlp:analyze': (data: Conversation[]) => Promise<AnalysisResult>;
  'nlp:extract-skills': (text: string) => Promise<ExtractedSkill[]>;
  'nlp:match-jobs': (skills: string[], jobs: string[]) => Promise<JobMatch[]>;
  'nlp:progress': (callback: (progress: Progress) => void) => void;
}

// Resume operations
interface ResumeAPI {
  'resume:generate-pdf': (resume: Resume) => Promise<Uint8Array>;
  'resume:generate-docx': (resume: Resume) => Promise<Uint8Array>;
  'resume:enhance': (content: string, context: string) => Promise<string>;
}
```

### 6.2 Python Sidecar API (FastAPI)

```python
# POST /analyze
{
  "conversations": [...],
  "options": {
    "extract_skills": true,
    "extract_achievements": true,
    "topic_modeling": true,
    "sentiment_analysis": true
  }
}

# Response
{
  "skills": [{"name": "python", "frequency": 42, "category": "programming"}],
  "achievements": [...],
  "topics": [...],
  "sentiments": [...],
  "timeline": [...]
}

# POST /match-jobs
{
  "skills": ["python", "machine learning"],
  "job_descriptions": [...]
}

# Response
{
  "matches": [
    {"title": "ML Engineer", "score": 0.85, "matched": [...], "missing": [...]}
  ]
}

# POST /enhance (Claude API passthrough)
{
  "content": "Original achievement text",
  "context": "job description or target role"
}

# Response
{
  "enhanced": "Improved achievement text"
}
```

---

## 7. User Interface Specifications

### 7.1 Main Navigation
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] Resume Builder          [Settings] [Theme Toggle] [─] [□] [×]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Import  │  │ Analyze │  │  Jobs   │  │ Resume  │  │ Export  │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Key Screens

1. **Import Wizard**: File selection, format preview, validation
2. **Analysis Dashboard**: Skills, achievements, timeline, topics
3. **Job Matcher**: Job description input, match scores, gap analysis
4. **Resume Editor**: Section editor, preview, template selection
5. **Export Center**: Format selection, options, download

### 7.3 Design System
- Color palette: Dark theme default (ChatGPT-inspired)
- Typography: Inter (UI), JetBrains Mono (code)
- Components: shadcn/ui base components
- Icons: Lucide React
- Spacing: 4px grid system

---

## 8. Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Electron + Vite + React + TypeScript setup
- [ ] Tailwind CSS + shadcn/ui integration
- [ ] Basic window management
- [ ] File dialog integration
- [ ] SQLite + Drizzle setup

### Phase 2: Data Import (Weeks 3-4)
- [ ] ChatGPT JSON parser (tree traversal)
- [ ] Claude format parser
- [ ] Generic format parser
- [ ] Import wizard UI
- [ ] Validation and error handling

### Phase 3: Python Sidecar (Weeks 5-6)
- [ ] FastAPI server setup
- [ ] spaCy NER integration
- [ ] Sentence Transformers integration
- [ ] IPC bridge from Electron
- [ ] Progress streaming

### Phase 4: NLP Analysis (Weeks 7-8)
- [ ] Skill extraction pipeline
- [ ] Achievement detection
- [ ] Timeline generation
- [ ] Topic modeling
- [ ] Analysis dashboard UI

### Phase 5: Job Matching (Weeks 9-10)
- [ ] Semantic similarity calculation
- [ ] Job title database
- [ ] Gap analysis
- [ ] Job matcher UI

### Phase 6: Resume Builder (Weeks 11-12)
- [ ] Section editor component
- [ ] Template system
- [ ] Claude API integration
- [ ] Content enhancement

### Phase 7: Export (Week 13)
- [ ] PDF generation (pdf-lib)
- [ ] DOCX generation
- [ ] HTML/Markdown export
- [ ] Export center UI

### Phase 8: Polish (Weeks 14-16)
- [ ] Performance optimization
- [ ] Error handling refinement
- [ ] Accessibility audit
- [ ] Cross-platform testing
- [ ] Documentation

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first resume | < 5 minutes |
| Skills extraction accuracy | > 85% |
| Job match relevance | > 80% user satisfaction |
| PDF generation success rate | > 99% |
| App crash rate | < 0.1% |
| Cross-platform parity | 100% feature support |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large file processing OOM | HIGH | Streaming parser, chunked processing |
| Python sidecar startup time | MEDIUM | Lazy loading, prewarming |
| ChatGPT format changes | MEDIUM | Adaptive parser, version detection |
| Claude API rate limits | LOW | Local caching, retry logic |
| Cross-platform ML performance | MEDIUM | CPU fallback, ONNX runtime |

---

## 11. Open Questions

1. **Offline mode**: Should GenAI features work offline with local models?
2. **Cloud sync**: Should we support syncing projects across devices?
3. **Collaboration**: Should multiple users be able to share projects?
4. **Pricing model**: Free/Pro/Enterprise tiers?
5. **Auto-update**: Silent updates or user-controlled?

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| NER | Named Entity Recognition - ML technique to identify entities |
| Embedding | Vector representation of text for semantic comparison |
| Sidecar | Background process running alongside main application |
| IPC | Inter-Process Communication between Electron processes |

---

## Appendix B: References

- [Electron Documentation](https://www.electronjs.org/docs)
- [React 18 Documentation](https://react.dev)
- [spaCy Documentation](https://spacy.io/api)
- [Anthropic API Reference](https://docs.anthropic.com)
- [pdf-lib Documentation](https://pdf-lib.js.org)

---

**Document Status:** DRAFT
**Next Review:** After User feedback
**Approvals Required:** User (Product Owner)
