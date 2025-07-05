"""
Achievement Detector Module

Detects professional achievements and accomplishments from
conversation text using:
- Pattern matching for action verbs
- Sentiment analysis for positive framing
- Context extraction for surrounding information
"""

import re
import uuid
from typing import Callable, Optional

from loguru import logger

from models import ExtractedAchievement, ExtractedSkill, Message


class AchievementDetector:
    """
    Detects and extracts professional achievements from messages.

    Uses action verb patterns and sentiment analysis to identify
    statements that describe accomplishments, deliverables, and
    professional achievements.
    """

    # Achievement action verb patterns (matching constants.ts)
    ACHIEVEMENT_PATTERNS: list[str] = [
        r"accomplish(?:ed|ing|ment)?",
        r"achiev(?:ed|ing|ement)?",
        r"implement(?:ed|ing|ation)?",
        r"develop(?:ed|ing|ment)?",
        r"creat(?:ed|ing|ion)?",
        r"build(?:ing|t)?",
        r"design(?:ed|ing)?",
        r"lead(?:ing)?|led",
        r"manag(?:ed|ing|ement)?",
        r"optimi(?:zed|zing|zation)?",
        r"improv(?:ed|ing|ement)?",
        r"reduc(?:ed|ing|tion)?",
        r"increas(?:ed|ing)?",
        r"launch(?:ed|ing)?",
        r"deploy(?:ed|ing|ment)?",
        r"automat(?:ed|ing|ion)?",
        r"integrat(?:ed|ing|ion)?",
        r"migrat(?:ed|ing|ion)?",
        r"refactor(?:ed|ing)?",
        r"scal(?:ed|ing)?",
        r"deliver(?:ed|ing)?",
        r"establish(?:ed|ing)?",
        r"pioneer(?:ed|ing)?",
        r"transform(?:ed|ing|ation)?",
        r"streamlin(?:ed|ing)?",
    ]

    # Impact indicators for higher confidence
    IMPACT_PATTERNS: list[str] = [
        r"\d+%",  # Percentages
        r"\$[\d,]+",  # Dollar amounts
        r"\d+x",  # Multipliers
        r"\d+\s*(users?|customers?|clients?)",  # User counts
        r"(first|only|leading|best)",  # Superlatives
        r"(award|recognition|promoted)",  # External validation
        r"(team of \d+|cross-functional)",  # Team scope
    ]

    def __init__(
        self,
        sentiment_analyzer: Optional[Callable[[str], float]] = None,
        min_sentence_length: int = 20,
        max_achievements: int = 30,
    ):
        """
        Initialize the achievement detector.

        Args:
            sentiment_analyzer: Optional callable that returns sentiment score (-1 to 1).
            min_sentence_length: Minimum character length for achievement sentences.
            max_achievements: Maximum number of achievements to extract.
        """
        self._sentiment_analyzer = sentiment_analyzer
        self._min_sentence_length = min_sentence_length
        self._max_achievements = max_achievements

        # Compile patterns
        self._achievement_pattern = re.compile(
            rf"\b({'|'.join(self.ACHIEVEMENT_PATTERNS)})\b",
            re.IGNORECASE,
        )
        self._impact_pattern = re.compile(
            rf"({'|'.join(self.IMPACT_PATTERNS)})",
            re.IGNORECASE,
        )

        logger.info("AchievementDetector initialized")

    def set_sentiment_analyzer(self, analyzer: Callable[[str], float]) -> None:
        """Set the sentiment analyzer function."""
        self._sentiment_analyzer = analyzer

    def detect(
        self,
        messages: list[Message],
        skills: Optional[list[ExtractedSkill]] = None,
    ) -> list[ExtractedAchievement]:
        """
        Detect achievements from conversation messages.

        Args:
            messages: List of messages to analyze.
            skills: Optional list of extracted skills for association.

        Returns:
            List of extracted achievements sorted by score.
        """
        logger.info(f"Detecting achievements from {len(messages)} messages")

        achievements: list[ExtractedAchievement] = []
        skill_names = {s.name.lower() for s in (skills or [])}

        for message in messages:
            # Only analyze user messages (where they describe their work)
            if message.role != "user":
                continue

            # Split into sentences
            sentences = self._split_sentences(message.content)

            for sentence in sentences:
                if len(sentence) < self._min_sentence_length:
                    continue

                # Check for achievement patterns
                if not self._achievement_pattern.search(sentence):
                    continue

                # Calculate confidence/score
                score = self._calculate_score(sentence)

                if score < 0.3:  # Minimum threshold
                    continue

                # Get sentiment
                sentiment = self._get_sentiment(sentence)

                # Skip if sentiment is strongly negative
                if sentiment < -0.3:
                    continue

                # Extract context (surrounding text)
                context = self._get_context(message.content, sentence)

                # Find associated skills
                associated_skills = self._find_associated_skills(
                    sentence + " " + context,
                    skill_names,
                )

                achievements.append(
                    ExtractedAchievement(
                        id=str(uuid.uuid4()),
                        description=sentence.strip(),
                        context=context,
                        sentimentScore=round(sentiment, 3),
                        date=message.timestamp,
                        skills=associated_skills,
                    )
                )

        # Sort by sentiment score (higher = better) and limit
        achievements.sort(key=lambda a: a.sentiment_score, reverse=True)
        achievements = achievements[: self._max_achievements]

        logger.info(f"Detected {len(achievements)} achievements")
        return achievements

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences."""
        # Simple sentence splitting (could use spaCy for better results)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _calculate_score(self, sentence: str) -> float:
        """Calculate achievement confidence score."""
        score = 0.0

        # Base score for having achievement pattern
        achievement_matches = len(self._achievement_pattern.findall(sentence))
        score += min(0.3, achievement_matches * 0.1)

        # Impact indicators boost score
        impact_matches = len(self._impact_pattern.findall(sentence))
        score += min(0.4, impact_matches * 0.15)

        # Length bonus (more detailed descriptions)
        if len(sentence) > 100:
            score += 0.1
        if len(sentence) > 200:
            score += 0.1

        # First person indicators ("I", "we", "my", "our")
        first_person = re.search(r"\b(I|we|my|our)\b", sentence, re.IGNORECASE)
        if first_person:
            score += 0.1

        return min(1.0, score)

    def _get_sentiment(self, text: str) -> float:
        """Get sentiment score for text."""
        if self._sentiment_analyzer:
            try:
                return self._sentiment_analyzer(text)
            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {e}")

        # Fallback: simple positive word counting
        positive_words = [
            "success",
            "achieved",
            "improved",
            "increased",
            "delivered",
            "excellent",
            "great",
            "significant",
            "major",
            "key",
        ]
        negative_words = [
            "failed",
            "issue",
            "problem",
            "bug",
            "error",
            "difficult",
            "challenging",
        ]

        text_lower = text.lower()
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)

        if pos_count + neg_count == 0:
            return 0.0

        return (pos_count - neg_count) / (pos_count + neg_count)

    def _get_context(
        self, full_text: str, sentence: str, context_chars: int = 200
    ) -> str:
        """Extract surrounding context for a sentence."""
        try:
            idx = full_text.find(sentence)
            if idx == -1:
                return ""

            start = max(0, idx - context_chars)
            end = min(len(full_text), idx + len(sentence) + context_chars)

            context = full_text[start:end]

            # Clean up partial sentences at boundaries
            if start > 0:
                first_space = context.find(" ")
                if first_space > 0:
                    context = context[first_space + 1 :]

            if end < len(full_text):
                last_period = context.rfind(".")
                if last_period > len(context) // 2:
                    context = context[: last_period + 1]

            return context.strip()

        except Exception:
            return ""

    def _find_associated_skills(
        self,
        text: str,
        skill_names: set[str],
    ) -> list[str]:
        """Find skills mentioned in or near the achievement."""
        text_lower = text.lower()
        found = []

        for skill in skill_names:
            # Handle multi-word skills
            skill_pattern = skill.replace("-", r"[\s-]?")
            if re.search(rf"\b{skill_pattern}\b", text_lower, re.IGNORECASE):
                found.append(skill)

        return found


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["AchievementDetector"]
