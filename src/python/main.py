"""
FastAPI Entry Point for Resume Builder NLP Sidecar

Provides REST API endpoints for NLP analysis, skill extraction,
job matching, and content enhancement. Includes WebSocket support
for real-time progress updates.
"""

import json
import os
import sys
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    UploadFile,
    File,
    Form,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from loguru import logger

from config import configure_logging, get_optimal_device, settings
from models import (
    AnalyzeRequest,
    AnalyzeResponse,
    EnhanceRequest,
    EnhanceResponse,
    ErrorResponse,
    HealthStatus,
    JobMatchRequest,
    JobMatchResponse,
    Message,
    ProgressEvent,
    SkillExtractionRequest,
    SkillExtractionResponse,
)
from nlp.pipeline import AnalysisPipeline


# =============================================================================
# Global State
# =============================================================================

# Start time for uptime calculation
_start_time: float = 0.0

# Analysis pipeline (lazy loaded)
_pipeline: AnalysisPipeline | None = None

# WebSocket connections for progress updates
_ws_connections: set[WebSocket] = set()


def get_pipeline() -> AnalysisPipeline:
    """Get or create the analysis pipeline (lazy loading)."""
    global _pipeline
    if _pipeline is None:
        logger.info("Initializing analysis pipeline...")
        _pipeline = AnalysisPipeline()
    return _pipeline


# =============================================================================
# Application Lifecycle
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""
    global _start_time

    # Startup
    configure_logging()
    _start_time = time.time()
    device = get_optimal_device()
    logger.info(
        f"Resume Builder NLP Sidecar starting on {settings.host}:{settings.port}"
    )
    logger.info(f"Compute device: {device}")

    yield

    # Shutdown
    logger.info("Shutting down NLP Sidecar...")
    global _pipeline
    if _pipeline is not None:
        del _pipeline
        _pipeline = None


# =============================================================================
# Application Setup
# =============================================================================

app = FastAPI(
    title="Resume Builder NLP Sidecar",
    description="NLP processing backend for Resume Builder Electron application",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for Electron — restrict to localhost origins only
# The sidecar only serves the local Electron app; wildcard origins are not acceptable
_FRONTEND_PORT = int(os.environ.get("VITE_DEV_SERVER_PORT", "63263"))
_ALLOWED_ORIGINS = [
    "http://127.0.0.1",
    "http://localhost",
    f"http://127.0.0.1:{settings.port}",
    f"http://localhost:{settings.port}",
    f"http://localhost:{_FRONTEND_PORT}",
    f"http://127.0.0.1:{_FRONTEND_PORT}",
    "file://",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


# =============================================================================
# WebSocket Progress Manager
# =============================================================================


async def broadcast_progress(event: ProgressEvent) -> None:
    """Broadcast progress event to all connected WebSocket clients."""
    if not _ws_connections:
        return

    message = event.model_dump_json()
    disconnected = set()

    for ws in _ws_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)

    # Clean up disconnected clients
    _ws_connections.difference_update(disconnected)


# =============================================================================
# Health Check Endpoint
# =============================================================================


@app.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """
    Health check endpoint.

    Returns server status, device info, and model loading state.
    """
    device = get_optimal_device()
    uptime = time.time() - _start_time

    # Check which models are loaded
    models_loaded = {
        "spacy": False,
        "sentence_transformer": False,
        "sentiment": False,
        "bertopic": False,
    }

    if _pipeline is not None:
        models_loaded["spacy"] = _pipeline.skill_extractor is not None
        models_loaded["sentence_transformer"] = _pipeline.job_matcher is not None
        models_loaded["sentiment"] = _pipeline.sentiment_analyzer is not None
        models_loaded["bertopic"] = _pipeline.topic_modeler is not None

    return HealthStatus(
        status="healthy",
        version="0.1.0",
        device=device,
        models_loaded=models_loaded,
        uptime_seconds=uptime,
    )


# =============================================================================
# Analysis Endpoints
# =============================================================================


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Full NLP analysis pipeline.

    Processes all conversations and returns skills, achievements,
    timeline events, topics, and sentiment data.
    """
    start_time = time.time()

    try:
        pipeline = get_pipeline()

        # Flatten messages from all conversations
        all_messages = []
        for conv in request.conversations:
            all_messages.extend(conv.messages)

        total_messages = len(all_messages)
        total_conversations = len(request.conversations)

        logger.info(
            f"Starting analysis: {total_conversations} conversations, {total_messages} messages"
        )

        # Run the full pipeline with progress callbacks
        async def progress_callback(stage: str, current: int, total: int, message: str):
            event = ProgressEvent(
                stage=stage,
                current=current,
                total=total,
                message=message,
                percentage=(current / total * 100) if total > 0 else 0,
            )
            # Send via WebSocket for web clients
            await broadcast_progress(event)
            # ALSO print to stdout for Electron IPC bridge
            progress_json = json.dumps(
                {
                    "stage": stage,
                    "current": current,
                    "total": total,
                    "message": message,
                    "percentage": event.percentage,
                }
            )
            print(f"PROGRESS:{progress_json}", flush=True)
            sys.stdout.flush()

        result = await pipeline.analyze(
            messages=all_messages,
            options=request.options or {},
            progress_callback=progress_callback,
        )

        processing_time = (time.time() - start_time) * 1000

        logger.info(f"Analysis complete in {processing_time:.2f}ms")

        return AnalyzeResponse(
            result=result,
            total_messages=total_messages,
            total_conversations=total_conversations,
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@app.post("/extract-skills", response_model=SkillExtractionResponse)
async def extract_skills(request: SkillExtractionRequest) -> SkillExtractionResponse:
    """
    Skill extraction only.

    Extracts skills from messages without running full pipeline.
    """
    start_time = time.time()

    try:
        pipeline = get_pipeline()

        logger.info(f"Extracting skills from {len(request.messages)} messages")

        skills = await pipeline.extract_skills_only(
            messages=request.messages,
            min_confidence=request.min_confidence,
            min_frequency=request.min_frequency,
            max_skills=request.max_skills,
        )

        processing_time = (time.time() - start_time) * 1000

        return SkillExtractionResponse(
            skills=skills,
            total_messages_processed=len(request.messages),
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Skill extraction failed")


# =============================================================================
# File Import Endpoint (PDF, MD, TXT, CSV)
# =============================================================================

# Max file size for uploads and path-based reads (10 MB)
_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text content from various file formats."""
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "pdf":
        try:
            import pdfplumber
            import io

            text_parts = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    elif ext in ("txt", "md", "markdown"):
        # Plain text or markdown - just decode
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")

    elif ext == "csv":
        # CSV - join all cells
        try:
            import csv
            import io

            text = content.decode("utf-8")
            reader = csv.reader(io.StringIO(text))
            rows = [" ".join(row) for row in reader]
            return "\n".join(rows)
        except Exception as e:
            logger.error(f"CSV extraction failed: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    else:
        # Try as plain text
        try:
            return content.decode("utf-8")
        except (UnicodeDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=400, detail=f"Unsupported file type: {ext}"
            ) from e


@app.post("/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    min_confidence: float = Form(default=0.3),
    min_frequency: int = Form(default=1),
    max_skills: int = Form(default=100),
):
    """
    Analyze a single file (PDF, MD, TXT, CSV) for skills.

    This is a fast endpoint for testing skill extraction on resumes
    or other documents without needing the full conversation format.
    """
    start_time = time.time()

    try:
        # Read file content
        content = await file.read()
        filename = file.filename or "unknown.txt"

        # Guard against oversized uploads (same 10 MB limit as /analyze-file-path)
        if len(content) > _MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {_MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB",
            )

        logger.info(f"Analyzing file: {filename} ({len(content)} bytes)")

        # Extract text from file
        text = extract_text_from_file(content, filename)

        if not text or len(text.strip()) < 10:
            raise HTTPException(
                status_code=400, detail="File contains no extractable text"
            )

        logger.info(f"Extracted {len(text)} characters from {filename}")

        # Create a single message from the file content
        message = Message(
            id="file-import",
            role="user",
            content=text,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"),
        )

        # Extract skills
        pipeline = get_pipeline()
        skills = await pipeline.extract_skills_only(
            messages=[message],
            min_confidence=min_confidence,
            min_frequency=min_frequency,
            max_skills=max_skills,
        )

        processing_time = (time.time() - start_time) * 1000

        logger.info(f"Found {len(skills)} skills in {processing_time:.0f}ms")

        return {
            "success": True,
            "filename": filename,
            "text_length": len(text),
            "skills": [
                {
                    "name": s.name,
                    "category": s.category.value
                    if hasattr(s.category, "value")
                    else str(s.category),
                    "confidence": s.confidence,
                    "frequency": s.frequency,
                }
                for s in skills
            ],
            "skill_count": len(skills),
            "processing_time_ms": processing_time,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File analysis failed: {e}")
        raise HTTPException(status_code=500, detail="File analysis failed")


class FilePathRequest(BaseModel):
    file_path: str
    min_confidence: float = 0.3
    min_frequency: int = 1
    max_skills: int = 100


# Allowed file extensions for /analyze-file-path endpoint
# .docx excluded: no DOCX parser — raw binary decode would fail with UnicodeDecodeError
_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv"}


def _validate_file_path(file_path: str) -> str:
    """
    Validate and resolve a file path to prevent path traversal attacks.

    - Resolves symlinks and normalizes the path
    - Blocks paths outside the user's home directory and common safe directories
    - Blocks hidden system paths
    - Returns the resolved absolute path if valid

    Raises HTTPException(400) on invalid path.
    """
    try:
        resolved = os.path.realpath(os.path.abspath(file_path))
    except (ValueError, OSError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid file path: {exc}"
        ) from exc

    # Reject paths to system directories
    _BLOCKED_PREFIXES = (
        "/etc/",
        "/proc/",
        "/sys/",
        "/dev/",
        "/run/",
        "/boot/",
        "/root/",
        "/var/",
        "/usr/",
        "/bin/",
        "/sbin/",
        "/lib/",
        "/lib64/",
        "/snap/",
    )
    for prefix in _BLOCKED_PREFIXES:
        if resolved.startswith(prefix):
            raise HTTPException(
                status_code=403,
                detail="Access denied: path is outside allowed directories",
            )

    # Extension check
    _, ext = os.path.splitext(resolved)
    if ext.lower() not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(_ALLOWED_EXTENSIONS)}",
        )

    return resolved


@app.post("/analyze-file-path")
async def analyze_file_path(request: FilePathRequest):
    """
    Analyze a file by path (for Electron IPC integration).

    Reads the file from the filesystem and extracts skills.
    Supports PDF, TXT, MD, CSV files. Path traversal is blocked.
    """
    start_time = time.time()

    try:
        # Validate path — raises HTTPException on traversal attempt
        file_path = _validate_file_path(request.file_path)
        min_confidence = request.min_confidence
        min_frequency = request.min_frequency
        max_skills = request.max_skills

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Guard against oversized files
        file_size = os.path.getsize(file_path)
        if file_size > _MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {_MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB",
            )

        filename = os.path.basename(file_path)
        logger.info(f"Analyzing file by path: {file_path}")

        # Read file content
        with open(file_path, "rb") as f:
            content = f.read()

        # Extract text from file
        text = extract_text_from_file(content, filename)

        if not text or len(text.strip()) < 10:
            raise HTTPException(
                status_code=400, detail="File contains no extractable text"
            )

        logger.info(f"Extracted {len(text)} characters from {filename}")

        # Create a single message from the file content
        message = Message(
            id="file-import",
            role="user",
            content=text,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"),
        )

        # Extract skills
        pipeline = get_pipeline()
        skills = await pipeline.extract_skills_only(
            messages=[message],
            min_confidence=min_confidence,
            min_frequency=min_frequency,
            max_skills=max_skills,
        )

        processing_time = (time.time() - start_time) * 1000

        logger.info(f"Found {len(skills)} skills in {processing_time:.0f}ms")

        return {
            "success": True,
            "filename": filename,
            "text_length": len(text),
            "skills": [
                {
                    "name": s.name,
                    "category": s.category.value
                    if hasattr(s.category, "value")
                    else str(s.category),
                    "confidence": s.confidence,
                    "frequency": s.frequency,
                }
                for s in skills
            ],
            "skill_count": len(skills),
            "processing_time_ms": processing_time,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File path analysis failed: {e}")
        raise HTTPException(status_code=500, detail="File analysis failed")


@app.post("/match-jobs", response_model=JobMatchResponse)
async def match_jobs(request: JobMatchRequest) -> JobMatchResponse:
    """
    Job matching based on extracted skills.

    Compares user skills against job descriptions using
    semantic similarity.
    """
    start_time = time.time()

    try:
        pipeline = get_pipeline()

        logger.info(
            f"Matching {len(request.skills)} skills against {len(request.job_descriptions)} jobs"
        )

        matches = await pipeline.match_jobs(
            skills=request.skills,
            job_descriptions=request.job_descriptions,
            top_k=request.top_k,
        )

        processing_time = (time.time() - start_time) * 1000

        return JobMatchResponse(
            matches=matches,
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Job matching failed: {e}")
        raise HTTPException(status_code=500, detail="Job matching failed")


@app.post("/enhance", response_model=EnhanceResponse)
async def enhance_content(request: EnhanceRequest) -> EnhanceResponse:
    """
    Content enhancement via Claude API.

    Note: Requires ANTHROPIC_API_KEY environment variable.
    Returns placeholder if API key not configured.
    """
    start_time = time.time()

    try:
        if not settings.anthropic_api_key:
            # Return placeholder response if no API key
            logger.warning(
                "Claude API key not configured, returning unenhanced content"
            )
            processing_time = (time.time() - start_time) * 1000
            return EnhanceResponse(
                enhanced_content=request.content,
                suggestions=["Configure ANTHROPIC_API_KEY for AI-powered enhancement"],
                processing_time_ms=processing_time,
            )

        pipeline = get_pipeline()

        enhanced = await pipeline.enhance_content(
            content=request.content,
            context=request.context,
            target_job=request.target_job,
            enhancement_type=request.enhancement_type,
        )

        processing_time = (time.time() - start_time) * 1000

        return EnhanceResponse(
            enhanced_content=enhanced["content"],
            suggestions=enhanced.get("suggestions", []),
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Content enhancement failed: {e}")
        raise HTTPException(status_code=500, detail="Content enhancement failed")


# =============================================================================
# WebSocket Endpoint
# =============================================================================


@app.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time progress updates.

    Clients connect here to receive ProgressEvent messages
    during long-running analysis operations.
    """
    await websocket.accept()
    _ws_connections.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(_ws_connections)}")

    try:
        while True:
            # Keep connection alive, wait for disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _ws_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(_ws_connections)}")


# =============================================================================
# Error Handlers
# =============================================================================


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Any, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with structured response."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            code=str(exc.status_code),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Any, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc),
            code="500",
        ).model_dump(),
    )


# =============================================================================
# Main Entry
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
