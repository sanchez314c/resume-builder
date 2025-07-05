# Quick Start

Zero to running in under 10 minutes.

## Prerequisites

- Node.js 18+ (`node --version`)
- Miniconda or Anaconda (`conda --version`)
- Git

## Steps

### 1. Clone and install Node deps

```bash
git clone https://github.com/sanchez314c/resume-builder.git
cd resume-builder
npm install
```

### 2. Set up the Python environment (one-time)

```bash
./scripts/setup-conda.sh
```

This creates a conda env named `resume-builder` with all NLP dependencies (spaCy, Transformers, BERTopic). Takes 3-5 minutes the first time.

### 3. Start the app

```bash
./run-source-linux.sh
```

This starts both the Electron frontend and the Python NLP sidecar. The launcher handles port management and conda activation automatically.

**Linux sandbox issue?** If Electron fails to open:

```bash
./run-source-linux.sh --no-sandbox
```

### 4. Import your conversations

1. Click **Import** in the top navigation
2. Drop your `conversations.json` file (exported from ChatGPT or Claude)
3. The app auto-detects the format and parses it

**To export from ChatGPT**: Settings > Data Controls > Export Data > Download. The zip contains `conversations.json`.

**To export from Claude**: claude.ai > Settings > Privacy > Export Data.

### 5. Run NLP analysis

1. Click **Analyze** after import completes
2. The Python sidecar extracts skills, achievements, and topics
3. Results appear in the Analysis dashboard with charts

### 6. Match against jobs (optional)

1. Click **Jobs**
2. Paste a job description
3. Click **Analyze Match** to see skill overlap and gaps

### 7. Build and export your resume

1. Click **Resume** to see the auto-populated sections
2. Edit any section content
3. Click **Export** and choose PDF or DOCX

---

## What each service does

| Service | Port | What it is |
|---------|------|------------|
| Electron frontend | 53291 | The app window |
| Python NLP sidecar | 49372 | FastAPI server, handles analysis |

---

## Troubleshooting

**Conda env not found**: Run `./scripts/setup-conda.sh` again.

**Node modules missing**: Run `npm install`.

**Backend not responding**: Check `./run-source-linux.sh --status` to see if port 49372 is free.

**First analysis is slow**: The NLP models load on first use. Subsequent runs are faster. Use `--preload` flag on the Python sidecar to pre-warm models: `cd src/python && python run.py --preload`.

See [INSTALLATION.md](INSTALLATION.md) for full platform-specific setup and [DEVELOPMENT.md](DEVELOPMENT.md) for the complete developer guide.
