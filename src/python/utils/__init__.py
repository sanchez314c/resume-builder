"""
Utilities Package for Resume Builder NLP Sidecar

Contains helper modules for:
- Text processing and normalization
- Device detection and management
"""

from utils.text_processing import (
    preprocess_text,
    tokenize,
    lemmatize,
    remove_stopwords,
    extract_sentences,
)
from utils.device import DeviceManager

__all__ = [
    "preprocess_text",
    "tokenize",
    "lemmatize",
    "remove_stopwords",
    "extract_sentences",
    "DeviceManager",
]
