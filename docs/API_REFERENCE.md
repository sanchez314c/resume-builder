# API Reference

## IPC API (Renderer ↔ Main)

All IPC channels defined in `src/common/constants.ts`.

### File Operations

#### file:select
Open native file dialog for JSON import.

```typescript
const filePaths = await window.api.file.select({
  filters: [{ name: 'JSON', extensions: ['json'] }],
  properties: ['openFile', 'multiSelections']
});
// Returns: string[]
```

#### file:read
Read file contents from path.

```typescript
const content = await window.api.file.read(path);
// Returns: string (JSON content)
```

### NLP Operations

#### nlp:analyze
Run full NLP pipeline on conversations.

```typescript
const result = await window.api.nlp.analyze({
  conversations: Conversation[],
  options: {
    extractSkills: true,
    extractAchievements: true,
    topicModeling: true,
    sentimentAnalysis: true
  }
});
// Returns: AnalysisResult
```

#### nlp:matchJobs
Match skills against job descriptions.

```typescript
const matches = await window.api.nlp.matchJobs({
  skills: string[],
  jobDescriptions: string[]
});
// Returns: JobMatch[]
```

#### nlp:progress
Subscribe to progress updates (event-based).

```typescript
window.api.nlp.onProgress((progress) => {
  console.log(`${progress.stage}: ${progress.current}/${progress.total}`);
});
// Returns: Progress { stage, current, total, message }
```

### Resume Operations

#### resume:generate-pdf
Generate PDF from resume object.

```typescript
const pdfBytes = await window.api.resume.generatePdf(resume);
// Returns: Uint8Array
```

#### resume:enhance
Enhance resume content via Claude API.

```typescript
const enhanced = await window.api.resume.enhance({
  content: string,
  context: string  // job description or target role
});
// Returns: string (improved content)
```

### Database Operations

#### db:get-projects
List all projects.

```typescript
const projects = await window.api.db.getProjects();
// Returns: Project[]
```

#### db:save-project
Save or update project.

```typescript
await window.api.db.saveProject(project);
// Returns: void
```

## Python Sidecar API (FastAPI)

Default: `http://127.0.0.1:8765`

### GET /health
Check if sidecar is running.

```bash
curl http://127.0.0.1:8765/health
# Returns: { "status": "ok", "models": [...], "device": "cuda" }
```

### POST /analyze
Full NLP pipeline.

```bash
curl -X POST http://127.0.0.1:8765/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "conversations": [...],
    "options": {
      "extract_skills": true,
      "extract_achievements": true,
      "topic_modeling": true
    }
  }'
```

### POST /skills
Skill extraction only.

```bash
curl -X POST http://127.0.0.1:8765/skills \
  -H "Content-Type: application/json" \
  -d '{ "conversations": [...] }'
```

### POST /match-jobs
Job matching.

```bash
curl -X POST http://127.0.0.1:8765/match-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["python", "ml"],
    "job_descriptions": ["Job description text..."]
  }'
```

## Type Definitions

See `src/common/types.ts` and `src/common/api-types.ts` for complete TypeScript interfaces.
