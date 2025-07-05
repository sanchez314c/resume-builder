"""
Configuration Module for Resume Builder NLP Sidecar

Handles environment variables, model paths, device detection,
and logging configuration.
"""

import os
import sys
from pathlib import Path
from typing import Literal, Optional

from pydantic_settings import BaseSettings
from loguru import logger


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server Configuration
    host: str = "127.0.0.1"
    port: int = 8765
    debug: bool = False
    log_level: str = "INFO"

    # Model Configuration
    spacy_model: str = "en_core_web_sm"  # Use en_core_web_trf for accuracy
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    sentiment_model: str = "distilbert-base-uncased-finetuned-sst-2-english"

    # Processing Configuration
    batch_size: int = 100
    max_skills: int = 50
    max_achievements: int = 30
    min_skill_confidence: float = 0.5
    min_skill_frequency: int = 2
    min_achievement_length: int = 20
    num_topics: int = 10

    # Claude API (for enhancement)
    anthropic_api_key: Optional[str] = None

    # Paths
    cache_dir: Optional[str] = None
    models_dir: Optional[str] = None

    class Config:
        env_prefix = "RESUME_BUILDER_"
        env_file = ".env"
        extra = "ignore"


# Global settings instance
settings = Settings()


def get_cache_dir() -> Path:
    """Get the cache directory for model storage."""
    if settings.cache_dir:
        cache_path = Path(settings.cache_dir)
    else:
        # Default to user's cache directory
        if sys.platform == "darwin":
            cache_path = Path.home() / "Library" / "Caches" / "resume-builder"
        elif sys.platform == "win32":
            cache_path = (
                Path(os.environ.get("LOCALAPPDATA", Path.home()))
                / "resume-builder"
                / "cache"
            )
        else:
            cache_path = (
                Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
                / "resume-builder"
            )

    cache_path.mkdir(parents=True, exist_ok=True)
    return cache_path


def get_models_dir() -> Path:
    """Get the models directory for pre-downloaded models."""
    if settings.models_dir:
        models_path = Path(settings.models_dir)
    else:
        models_path = get_cache_dir() / "models"

    models_path.mkdir(parents=True, exist_ok=True)
    return models_path


def configure_logging() -> None:
    """Configure loguru for the application."""
    # Remove default handler
    logger.remove()

    # Add console handler with appropriate level
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    logger.add(
        sys.stderr,
        format=log_format,
        level=settings.log_level,
        colorize=True,
    )

    # Add file handler in production
    if not settings.debug:
        log_dir = get_cache_dir() / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        logger.add(
            log_dir / "nlp-sidecar.log",
            format=log_format,
            level="DEBUG",
            rotation="10 MB",
            retention="7 days",
            compression="gz",
        )


# Device type for model loading
DeviceType = Literal["cuda", "mps", "cpu"]


def get_optimal_device() -> DeviceType:
    """
    Detect and return the optimal compute device.

    Returns:
        DeviceType: 'cuda' for NVIDIA GPUs, 'mps' for Apple Silicon, 'cpu' otherwise.

    Note:
        MPS (Metal Performance Shaders) is a SINGLE device. There is no mps:0 or mps:1.
        Only use 'mps' as the device string, never 'mps:0'.
    """
    try:
        import torch

        if torch.cuda.is_available():
            logger.info(f"CUDA device detected: {torch.cuda.get_device_name(0)}")
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            # CRITICAL: MPS is a single device. Never use mps:0 or mps:1
            logger.info("Apple MPS device detected")
            return "mps"
        else:
            logger.info("Using CPU for computation")
            return "cpu"
    except ImportError:
        logger.warning("PyTorch not installed, defaulting to CPU")
        return "cpu"
    except Exception as e:
        logger.warning(f"Error detecting device: {e}, defaulting to CPU")
        return "cpu"


# Export commonly used items
__all__ = [
    "settings",
    "Settings",
    "get_cache_dir",
    "get_models_dir",
    "configure_logging",
    "get_optimal_device",
    "DeviceType",
    "logger",
]
