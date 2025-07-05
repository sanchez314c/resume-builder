# Legacy Codebase Audit Summary

**Audit Date:** 2026-02-02
**Auditor:** Master Control
**Repositories Analyzed:** 8
**Total Python Files:** 35+
**Total Lines of Code:** ~8,000+

---

## Executive Summary

The legacy codebase consists of 8 Python repositories implementing an AI-powered resume generation system. The system extracts professional skills, achievements, and career data from ChatGPT/Claude conversation exports using NLP and generates PDF resumes with interactive analytics dashboards.

### Critical Findings

| Finding | Severity | Impact |
|---------|----------|--------|
| ChatGPT format mismatch in viewers | CRITICAL | Viewers cannot parse actual exports |
| `generate_resume()` undefined in v03-v05 | CRITICAL | Runtime crashes |
| MPS device syntax invalid (`mps:0`) | HIGH | Crashes on Apple Silicon |
| macOS-only dependencies | HIGH | Won't run on Linux |
| v04 and v05 are identical | MEDIUM | Version control artifact |
| NLP backend disconnected from frontend | MEDIUM | Features not integrated |
| NLTK `punkt_tab` missing | MEDIUM | Keyword extraction broken |

### Recommended Canonical Sources

| Component | Best Version | Reason |
|-----------|--------------|--------|
| JSON Format Detection | `resume-builder-v00/v06-enhanced` | Multi-format support |
| NLP Pipeline | `resume-builder-v04-advanced/rev4` | Multi-GPU, memory management |
| PDF Generation | `resume-builder-v04-advanced/improved` | Clean architecture |
| Skills Extraction | `resume-builder-v04-advanced/nlp-skills-extractor` | Standalone utility |
| Job Market Analysis | `job-market-analyzer-v00` | Claude API integration |
| CSS Theme | `data-console-v00/styles.css` | ChatGPT-like dark theme |

---

## Repository Analysis Summary

### 1. data-console-v00
**Purpose:** ChatGPT conversation viewer
**Status:** BROKEN - format mismatch
**Reusable:** CSS theme, markdown renderer

### 2. data-insights-portal-v00
**Purpose:** Conversation viewer + NLP search
**Status:** BROKEN - same format mismatch, Flask backend disconnected
**Reusable:** CSS theme, tree walker algorithm

### 3. job-market-analyzer-v00
**Purpose:** AI job market intelligence via web scraping + Claude API
**Status:** PARTIALLY WORKING - NLTK punkt_tab bug
**Reusable:** Search queries, sentiment aggregation, Claude prompts, job templates

### 4. resume-builder-v00 (6 versions)
**Purpose:** Core resume generation from conversations
**Status:** v06-enhanced is BEST, v04/v05 BROKEN
**Reusable:** JSON converters, skill patterns, PDF templates

### 5. resume-builder-v01
**Purpose:** MPS-accelerated chat-to-resume processor
**Status:** macOS ONLY (TensorFlow-Metal)
**Reusable:** Manager/Processor patterns, skill regex, achievement patterns

### 6. resume-builder-v02-o1
**Purpose:** Conversation mining with clustering
**Status:** v2 BROKEN - missing function definition
**Reusable:** Tree traversal, keyword correlation

### 7. resume-builder-v03
**Purpose:** Full NLP resume builder with Dash dashboard
**Status:** REAL_DEAL_NLP_RESUME.py CORRUPTED (/etc/hosts embedded)
**Reusable:** NLP_resume_builder_rev2.py (clean version)

### 8. resume-builder-v04-advanced (6 revisions)
**Purpose:** Most advanced - multi-GPU parallel processing
**Status:** rev4/rev5 BROKEN (undefined method), improved.py BEST
**Reusable:** GPUManager, ParallelProcessor, all NLP pipelines

---

## Consolidated Feature Matrix

| Feature | Source | Migration Priority |
|---------|--------|-------------------|
| ChatGPT JSON parsing | v04-advanced | P0 - CRITICAL |
| Skill extraction (regex) | v01, v04-advanced | P0 - CRITICAL |
| Achievement detection | v03, v04-advanced | P1 - HIGH |
| Sentiment analysis | All | P1 - HIGH |
| PDF resume generation | v04-advanced | P1 - HIGH |
| Job semantic matching | v04-advanced | P2 - MEDIUM |
| Skill clustering | v03, v04-advanced | P2 - MEDIUM |
| Topic modeling | v04-advanced | P3 - LOW |
| Interactive dashboard | v03, v04-advanced | P3 - LOW |
| Job market analysis | job-market-analyzer | P3 - LOW |

---

## Technology Consolidation

### Python Dependencies to Keep (Sidecar)
```
torch>=2.0.0
spacy>=3.8.0
transformers>=4.30.0
sentence-transformers>=3.0.0
nltk>=3.9.0
scikit-learn>=1.5.0
bertopic>=0.15.0
```

### Python Dependencies to Remove
```
tensorflow-macos (macOS only)
tensorflow-metal (macOS only)
dash (replace with React)
plotly (replace with Recharts)
tkinter (replace with Electron)
```

### TypeScript Replacements
| Python | TypeScript/Node |
|--------|-----------------|
| BeautifulSoup | cheerio |
| requests | axios/fetch |
| reportlab | pdf-lib/pdfmake |
| matplotlib | recharts/chart.js |
| pandas | danfojs (optional) |
| tkinter | Electron dialog API |
| Flask/Dash | React + Electron IPC |

---

## Critical Algorithms to Port

### 1. ChatGPT Tree Traversal
```typescript
function extractMessages(
  mapping: Record<string, MappingNode>,
  currentId: string
): Message[] {
  const messages: Message[] = [];
  const node = mapping[currentId];

  if (node?.message?.content?.parts) {
    messages.push({
      role: node.message.author.role,
      content: node.message.content.parts.join('\n'),
      timestamp: node.message.create_time
    });
  }

  for (const childId of node?.children || []) {
    messages.push(...extractMessages(mapping, childId));
  }

  return messages;
}
```

### 2. Skill Extraction Pattern
```typescript
const SKILLS_PATTERN = /\b(python|javascript|typescript|react|vue|angular|node\.js|sql|mongodb|aws|azure|docker|kubernetes|ci\/cd|git|agile|scrum|machine learning|deep learning|nlp|computer vision|data science|api|rest|graphql|testing|devops|security)\b/gi;

function extractSkills(text: string): Map<string, number> {
  const skills = new Map<string, number>();
  const matches = text.matchAll(SKILLS_PATTERN);

  for (const match of matches) {
    const skill = match[0].toLowerCase();
    skills.set(skill, (skills.get(skill) || 0) + 1);
  }

  return skills;
}
```

### 3. Achievement Detection
```typescript
const ACHIEVEMENT_PATTERNS = [
  /implement(?:ed|ing)?/gi,
  /develop(?:ed|ing)?/gi,
  /creat(?:ed|ing)?/gi,
  /build(?:ing|t)?/gi,
  /design(?:ed|ing)?/gi,
  /optimi(?:zed|zing)/gi,
  /improv(?:ed|ing)/gi,
  /accomplish(?:ed|ing|ment)?/gi,
  /achiev(?:ed|ing|ement)?/gi
];
```

---

## Estimated Migration Effort

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1 | Electron + React scaffold | 1 week |
| Phase 2 | ChatGPT parser + file handling | 1 week |
| Phase 3 | Python sidecar + IPC | 1 week |
| Phase 4 | Core NLP integration | 2 weeks |
| Phase 5 | PDF generation | 1 week |
| Phase 6 | Dashboard UI | 2 weeks |
| Phase 7 | Polish + testing | 2 weeks |
| **TOTAL** | | **10 weeks** |

---

## Next Steps

1. Review this summary with User
2. Finalize tech stack decisions
3. Create detailed PRD
4. Begin Phase 1 implementation
