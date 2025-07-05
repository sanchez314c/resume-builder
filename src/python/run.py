#!/usr/bin/env python3
"""
Startup Script for Resume Builder NLP Sidecar

Provides command-line interface for running the FastAPI server
with configurable options.
"""

import argparse
import os
import sys
from pathlib import Path

# Add src/python to path for imports
sys.path.insert(0, str(Path(__file__).parent))


def main():
    """Main entry point for the NLP sidecar server."""
    parser = argparse.ArgumentParser(
        description="Resume Builder NLP Sidecar Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py                    # Start with defaults (localhost:57964)
  python run.py --port 9000        # Custom port
  python run.py --host 0.0.0.0     # Allow external connections
  python run.py --debug            # Enable debug mode with auto-reload
  python run.py --preload          # Preload models on startup
        """,
    )

    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=57964,
        help="Port to bind to (default: 57964)",
    )

    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with auto-reload",
    )

    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)",
    )

    parser.add_argument(
        "--preload",
        action="store_true",
        help="Preload NLP models on startup",
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of worker processes (default: 1)",
    )

    args = parser.parse_args()

    # Set environment variables for config
    os.environ["RESUME_BUILDER_HOST"] = args.host
    os.environ["RESUME_BUILDER_PORT"] = str(args.port)
    os.environ["RESUME_BUILDER_DEBUG"] = str(args.debug).lower()
    os.environ["RESUME_BUILDER_LOG_LEVEL"] = args.log_level

    # Import after setting env vars
    from config import configure_logging, get_optimal_device
    from loguru import logger

    # Configure logging
    configure_logging()

    # Log startup info
    logger.info("=" * 60)
    logger.info("Resume Builder NLP Sidecar")
    logger.info("=" * 60)
    logger.info(f"Host: {args.host}")
    logger.info(f"Port: {args.port}")
    logger.info(f"Debug: {args.debug}")
    logger.info(f"Log Level: {args.log_level}")
    logger.info(f"Workers: {args.workers}")

    # Detect device
    device = get_optimal_device()
    logger.info(f"Compute Device: {device}")

    # Preload models if requested
    if args.preload:
        logger.info("Preloading NLP models...")
        preload_models()
        logger.info("Models preloaded successfully")

    # Run server
    import uvicorn

    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.debug,
        log_level=args.log_level.lower(),
        workers=args.workers if not args.debug else 1,
        access_log=args.debug,
    )


def preload_models():
    """Preload NLP models to reduce first-request latency."""
    from loguru import logger

    try:
        # Import and initialize pipeline
        from nlp.pipeline import AnalysisPipeline

        pipeline = AnalysisPipeline()

        # Touch each component to trigger loading
        logger.info("Loading skill extractor...")
        _ = pipeline.skill_extractor

        logger.info("Loading sentiment analyzer...")
        _ = pipeline.sentiment_analyzer

        logger.info("Loading achievement detector...")
        _ = pipeline.achievement_detector

        logger.info("Loading topic modeler...")
        _ = pipeline.topic_modeler

        logger.info("Loading job matcher...")
        _ = pipeline.job_matcher

    except Exception as e:
        logger.error(f"Error preloading models: {e}")
        logger.warning("Some models may not be available")


def check_dependencies():
    """Check if required dependencies are installed."""
    missing = []

    required = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "loguru",
        "torch",
        "transformers",
        "sentence_transformers",
    ]

    optional = [
        "spacy",
        "bertopic",
        "nltk",
    ]

    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)

    if missing:
        print("ERROR: Missing required packages:")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\nInstall with: pip install -r requirements.txt")
        sys.exit(1)

    # Check optional packages
    for package in optional:
        try:
            __import__(package)
        except ImportError:
            print(f"WARNING: Optional package '{package}' not installed")


if __name__ == "__main__":
    check_dependencies()
    main()
