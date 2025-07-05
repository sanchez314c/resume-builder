"""
Text Processing Utilities

Functions for text cleaning, normalization, tokenization,
and other NLP preprocessing tasks.
"""

import re
import unicodedata
from typing import Optional

from loguru import logger


# Lazy-loaded spaCy model
_nlp = None


def _get_spacy():
    """Lazy load spaCy model for lemmatization."""
    global _nlp
    if _nlp is None:
        try:
            import spacy

            _nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
            logger.info("Loaded spaCy model for text processing")
        except OSError:
            logger.warning("spaCy model not found, some functions will be limited")
            return None
    return _nlp


# Common English stopwords (subset for performance)
STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "were",
    "will",
    "with",
    "the",
    "this",
    "but",
    "they",
    "have",
    "had",
    "what",
    "when",
    "where",
    "who",
    "which",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "can",
    "should",
    "now",
    "i",
    "you",
    "we",
    "my",
    "your",
    "our",
    "me",
    "him",
    "her",
    "them",
    "his",
    "their",
    "been",
    "being",
    "do",
    "does",
    "did",
    "doing",
    "would",
    "could",
    "might",
    "must",
    "shall",
}


def preprocess_text(
    text: str,
    lowercase: bool = True,
    remove_urls: bool = True,
    remove_emails: bool = True,
    remove_numbers: bool = False,
    remove_punctuation: bool = False,
    normalize_whitespace: bool = True,
    normalize_unicode: bool = True,
) -> str:
    """
    Preprocess text with various cleaning options.

    Args:
        text: Input text to preprocess.
        lowercase: Convert to lowercase.
        remove_urls: Remove URLs.
        remove_emails: Remove email addresses.
        remove_numbers: Remove numeric characters.
        remove_punctuation: Remove punctuation.
        normalize_whitespace: Collapse multiple spaces.
        normalize_unicode: Normalize unicode characters.

    Returns:
        Preprocessed text string.
    """
    if not text:
        return ""

    result = text

    # Normalize unicode
    if normalize_unicode:
        result = unicodedata.normalize("NFKC", result)

    # Remove URLs
    if remove_urls:
        result = re.sub(
            r"https?://\S+|www\.\S+",
            " ",
            result,
            flags=re.IGNORECASE,
        )

    # Remove emails
    if remove_emails:
        result = re.sub(
            r"\S+@\S+\.\S+",
            " ",
            result,
        )

    # Remove numbers
    if remove_numbers:
        result = re.sub(r"\d+", " ", result)

    # Remove punctuation (keeping apostrophes for contractions)
    if remove_punctuation:
        result = re.sub(r"[^\w\s']", " ", result)

    # Lowercase
    if lowercase:
        result = result.lower()

    # Normalize whitespace
    if normalize_whitespace:
        result = re.sub(r"\s+", " ", result).strip()

    return result


def tokenize(
    text: str,
    lowercase: bool = True,
    min_length: int = 2,
) -> list[str]:
    """
    Tokenize text into words.

    Args:
        text: Input text to tokenize.
        lowercase: Convert tokens to lowercase.
        min_length: Minimum token length.

    Returns:
        List of tokens.
    """
    if not text:
        return []

    # Simple word tokenization
    tokens = re.findall(r"\b\w+\b", text)

    if lowercase:
        tokens = [t.lower() for t in tokens]

    if min_length > 1:
        tokens = [t for t in tokens if len(t) >= min_length]

    return tokens


def lemmatize(
    text: str,
    keep_pos: Optional[set[str]] = None,
) -> list[str]:
    """
    Lemmatize text using spaCy.

    Args:
        text: Input text to lemmatize.
        keep_pos: Optional set of POS tags to keep (e.g., {'NOUN', 'VERB'}).

    Returns:
        List of lemmatized tokens.
    """
    nlp = _get_spacy()

    if nlp is None:
        # Fallback to simple tokenization
        return tokenize(text, lowercase=True)

    doc = nlp(text)
    lemmas = []

    for token in doc:
        # Skip stopwords and punctuation
        if token.is_stop or token.is_punct or token.is_space:
            continue

        # Filter by POS if specified
        if keep_pos and token.pos_ not in keep_pos:
            continue

        lemmas.append(token.lemma_.lower())

    return lemmas


def remove_stopwords(
    tokens: list[str],
    additional_stopwords: Optional[set[str]] = None,
) -> list[str]:
    """
    Remove stopwords from token list.

    Args:
        tokens: List of tokens.
        additional_stopwords: Additional stopwords to remove.

    Returns:
        Filtered token list.
    """
    stopwords = STOPWORDS.copy()

    if additional_stopwords:
        stopwords |= additional_stopwords

    return [t for t in tokens if t.lower() not in stopwords]


def extract_sentences(
    text: str,
    min_length: int = 10,
    max_length: int = 500,
) -> list[str]:
    """
    Extract sentences from text.

    Args:
        text: Input text.
        min_length: Minimum sentence length in characters.
        max_length: Maximum sentence length in characters.

    Returns:
        List of sentences.
    """
    if not text:
        return []

    nlp = _get_spacy()

    if nlp is not None:
        # Use spaCy for sentence segmentation
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents]
    else:
        # Fallback to regex-based splitting
        sentences = re.split(r"(?<=[.!?])\s+", text)

    # Filter by length
    sentences = [
        s.strip() for s in sentences if min_length <= len(s.strip()) <= max_length
    ]

    return sentences


def clean_html(text: str) -> str:
    """
    Remove HTML tags from text.

    Args:
        text: Input text possibly containing HTML.

    Returns:
        Text with HTML tags removed.
    """
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode common HTML entities
    text = text.replace("&nbsp;", " ")
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    return text


def extract_code_blocks(text: str) -> tuple[str, list[str]]:
    """
    Extract and remove code blocks from text.

    Args:
        text: Input text with code blocks.

    Returns:
        Tuple of (text without code, list of code blocks).
    """
    # Match markdown code blocks
    code_pattern = r"```[\s\S]*?```|`[^`\n]+`"
    code_blocks = re.findall(code_pattern, text)

    # Remove code blocks from text
    text_without_code = re.sub(code_pattern, " [CODE] ", text)

    return text_without_code, code_blocks


def normalize_skill_name(skill: str) -> str:
    """
    Normalize a skill name for consistent matching.

    Args:
        skill: Raw skill name.

    Returns:
        Normalized skill name.
    """
    normalized = skill.lower().strip()

    # Common normalizations
    replacements = {
        "nodejs": "node.js",
        "node js": "node.js",
        "reactjs": "react",
        "react.js": "react",
        "vuejs": "vue",
        "vue.js": "vue",
        "angularjs": "angular",
        "nextjs": "next.js",
        "next js": "next.js",
        "tensorflow": "tensorflow",
        "scikit-learn": "sklearn",
        "scikit learn": "sklearn",
        "machine learning": "machine-learning",
        "deep learning": "deep-learning",
        "natural language processing": "nlp",
        "kubernetes": "kubernetes",
        "k8s": "kubernetes",
        "postgresql": "postgresql",
        "postgres": "postgresql",
        "mongodb": "mongodb",
        "mongo": "mongodb",
        "amazon web services": "aws",
        "google cloud platform": "gcp",
        "google cloud": "gcp",
    }

    for old, new in replacements.items():
        if normalized == old:
            normalized = new
            break

    # Replace spaces with hyphens
    normalized = re.sub(r"\s+", "-", normalized)

    return normalized


def count_words(text: str) -> int:
    """
    Count words in text.

    Args:
        text: Input text.

    Returns:
        Word count.
    """
    if not text:
        return 0
    return len(re.findall(r"\b\w+\b", text))


def truncate_text(
    text: str,
    max_length: int,
    suffix: str = "...",
) -> str:
    """
    Truncate text to maximum length.

    Args:
        text: Input text.
        max_length: Maximum length including suffix.
        suffix: Suffix to add if truncated.

    Returns:
        Truncated text.
    """
    if len(text) <= max_length:
        return text

    truncate_at = max_length - len(suffix)

    # Try to break at word boundary
    last_space = text[:truncate_at].rfind(" ")
    if last_space > truncate_at // 2:
        truncate_at = last_space

    return text[:truncate_at].rstrip() + suffix


# =============================================================================
# Module exports
# =============================================================================

__all__ = [
    "preprocess_text",
    "tokenize",
    "lemmatize",
    "remove_stopwords",
    "extract_sentences",
    "clean_html",
    "extract_code_blocks",
    "normalize_skill_name",
    "count_words",
    "truncate_text",
    "STOPWORDS",
]
