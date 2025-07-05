# Troubleshooting Guide

## Common Issues

### Python Sidecar Won't Start

**Symptom**: "NLP backend not connected" in status bar

**Solutions**:
1. Check Python 3.11+ is installed: `python3 --version`
2. Install dependencies: `pip install -r src/python/requirements.txt`
3. Download spaCy model: `python -m spacy download en_core_web_trf`
4. Check port conflicts: `lsof -i :8765` (or configured port)
5. Verify in terminal: `curl http://127.0.0.1:8765/health`

### Sandbox Error on Linux

**Symptom**: `The SUID sandbox helper binary was found but is not configured correctly`

**Solution**:
```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

Or run with `--no-sandbox` flag (already in `run-source-linux.sh`)

### PDF Generation Fails

**Symptom**: Export button produces no file or error

**Solutions**:
1. Check Documents folder permissions
2. Verify pdf-lib installed: `npm list pdf-lib`
3. Check console for renderer errors (DevTools: Ctrl+Shift+I)

### ChatGPT Import Shows "Invalid Format"

**Symptom**: ChatGPT JSON rejected as malformed

**Solutions**:
1. Ensure export is from ChatGPT web UI (Export data → JSON)
2. Check file contains "mapping" key (tree structure)
3. Validate JSON: `jq . conversation.json`
4. Try re-exporting from ChatGPT

### High Memory Usage

**Symptom**: App uses >2GB RAM during analysis

**Solutions**:
1. Reduce conversation batch size
2. Close other projects before importing large files
3. Use CPU instead of GPU for ML models (set in Python config)

### Models Won't Download

**Symptom**: spaCy or Transformers download failures

**Solutions**:
1. Check internet connection
2. Use mirror: `pip install -i https://pypi.tuna.tsinghua.edu.cn/simple`
3. Download manually: `huggingface-cli download`

## Debug Mode

Enable verbose logging:

```bash
DEBUG=resume-builder:* npm run dev
```

Check Python logs:
```bash
# Logs written to
~/.config/resume-builder/nlp.log
```

## Getting Help

1. Check [GitHub Issues](https://github.com/sanchez314c/resume-builder/issues)
2. Search existing error messages
3. Create new issue with:
   - OS and version
   - App version
   - Error message or screenshot
   - Steps to reproduce
