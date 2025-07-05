# Performance Guide

## Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Import 100MB JSON | <60s | ~45s |
| NLP Analysis (1000 msgs) | <120s | ~90s |
| PDF Generation | <5s | ~2s |
| Dashboard Load | <2s | ~1s |

## Optimization Strategies

### Large File Handling
- **Streaming parser**: Process JSON in chunks, not all-at-once
- **Worker threads**: Offload parsing to background threads
- **Progress indicators**: Show real-time progress to user

### ML Model Loading
- **Lazy loading**: Load models only when needed
- **Model caching**: Keep models in memory between analyses
- **Device selection**: Auto-select GPU (CUDA/MPS) when available

### Memory Management
- **Pagination**: Limit displayed items to 100 per page
- **Virtualization**: Use react-window for long lists
- **Cleanup**: Clear caches when switching projects

### Database
- **Indexing**: Indexed columns on frequently queried fields
- **Batching**: Batch inserts/updates for large datasets
- **Connection pooling**: Reuse SQLite connections

## Profiling

### Renderer Performance
```bash
# Chrome DevTools built-in
Ctrl+Shift+I → Performance tab → Record
```

### Main Process
```bash
# Electron performance monitor
DEBUG=* npm run dev
```

### Python Sidecar
```python
import cProfile
cProfile.run('analyze_conversations()', 'profile.stats')
```

## Known Bottlenecks

1. **ChatGPT tree traversal**: Recursive parsing can be slow on deeply nested trees
2. **BERTopic**: Topic modeling is CPU-intensive; consider caching results
3. **PDF generation**: Large resumes with charts take longer

## Monitoring

Add performance logging:
```typescript
const start = performance.now();
await operation();
console.log(`Operation took ${performance.now() - start}ms`);
```
