# Frequently Asked Questions

## General

**Q: Is my conversation data sent to the cloud?**
A: No. All NLP processing runs locally on your machine. The only optional cloud feature is Claude API integration for resume enhancement, which requires explicit API key input.

**Q: What conversation formats are supported?**
A: ChatGPT JSON exports (from chatgpt.com) and Claude conversation exports (from claude.ai). Generic role/message JSON formats may also work.

**Q: Can I use this without Python installed?**
A: No. The NLP sidecar requires Python 3.11+. The installer will guide you through setup.

## Usage

**Q: How large of a conversation file can I import?**
A: The app can handle files up to 500MB. Very large files (>1000 messages) may take several minutes to analyze.

**Q: Can I edit the extracted skills and achievements?**
A: Yes. All analysis results are fully editable in the Resume builder page.

**Q: Can I create multiple resumes from one analysis?**
A: Yes. You can create unlimited resume variations from the same project.

**Q: Do I need an API key to use this app?**
A: No. All core features work offline. Claude API key is optional for AI-enhanced resume writing.

## Technical

**Q: Why does the app need Python?**
A: The NLP pipeline (spaCy, Transformers, BERTopic) requires Python's ML ecosystem. These don't have JavaScript equivalents.

**Q: Can I disable the GPU acceleration?**
A: Yes. Set `DISABLE_GPU=1` environment variable before launching.

**Q: Will this work on Apple Silicon Macs?**
A: Yes. The Python sidecar auto-detects MPS (Metal Performance Shaders) acceleration.

## Privacy

**Q: Are my conversations stored anywhere?**
A: All data is stored locally in your user data directory. Nothing is sent to external servers except optional Claude API calls.

**Q: Can I delete my data?**
A: Yes. Your project data is in your user data directory. Delete the folder to remove all data.

## Licensing

**Q: Can I use this commercially?**
A: Yes. This is MIT-licensed. You can use, modify, and distribute freely.
