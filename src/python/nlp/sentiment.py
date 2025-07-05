"""
Sentiment Analysis Module

Provides sentiment analysis using:
- Transformers (DistilBERT) for accurate analysis
- Simple lexicon-based fallback
"""

import json
import sys
from datetime import datetime, timezone

from loguru import logger

from models import Message, SentimentData, SentimentLabel
from utils.device import DeviceManager


class SentimentAnalyzer:
    """
    Analyzes sentiment of text content.

    Uses a transformer-based model for accurate sentiment
    classification with confidence scores.
    """

    def __init__(
        self,
        model_name: str = "distilbert-base-uncased-finetuned-sst-2-english",
    ):
        """
        Initialize the sentiment analyzer.

        Args:
            model_name: HuggingFace model for sentiment analysis.
        """
        self._model_name = model_name
        self._pipeline = None
        self._device = DeviceManager.get_device()

        logger.info(f"SentimentAnalyzer initialized (device: {self._device})")

    def _load_model(self) -> None:
        """Lazy load the sentiment analysis pipeline."""
        if self._pipeline is not None:
            return

        try:
            from transformers import pipeline

            # Get device index for transformers
            # CRITICAL: MPS uses device=0, not "mps:0"
            device: int | str
            if self._device == "cuda":
                device = 0
            elif self._device == "mps":
                device = "mps"
            else:
                device = -1  # CPU

            self._pipeline = pipeline(
                "sentiment-analysis",
                model=self._model_name,
                device=device,
                truncation=True,
                max_length=512,
            )

            logger.info(f"Loaded sentiment model: {self._model_name}")

        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            # Don't raise - will fall back to lexicon-based

    def analyze(self, text: str) -> tuple[SentimentLabel, float]:
        """
        Analyze sentiment of a single text.

        Args:
            text: Text to analyze.

        Returns:
            Tuple of (label, confidence score).
        """
        if not text or len(text.strip()) < 3:
            return SentimentLabel.NEUTRAL, 0.5

        self._load_model()

        if self._pipeline is not None:
            try:
                # Truncate very long text
                text = text[:2000]

                result = self._pipeline(text)[0]
                label = result["label"].upper()
                score = result["score"]

                # Map to our labels
                if label == "POSITIVE":
                    return SentimentLabel.POSITIVE, score
                elif label == "NEGATIVE":
                    return SentimentLabel.NEGATIVE, score
                else:
                    return SentimentLabel.NEUTRAL, score

            except Exception as e:
                logger.warning(f"Transformer sentiment failed: {e}")

        # Fallback to lexicon-based analysis
        return self._lexicon_sentiment(text)

    def analyze_score(self, text: str) -> float:
        """
        Get a single sentiment score from -1 (negative) to 1 (positive).

        Args:
            text: Text to analyze.

        Returns:
            Sentiment score from -1 to 1.
        """
        label, confidence = self.analyze(text)

        if label == SentimentLabel.POSITIVE:
            return confidence
        elif label == SentimentLabel.NEGATIVE:
            return -confidence
        else:
            return 0.0

    def analyze_messages(
        self,
        messages: list[Message],
        batch_size: int = 100,
        sample_rate: int = 10,
    ) -> list[SentimentData]:
        """
        Analyze sentiment of multiple messages using batch processing.

        Args:
            messages: List of messages to analyze.
            batch_size: Batch size for processing.
            sample_rate: Analyze 1 in N messages for speed (default 10).

        Returns:
            List of sentiment data points.
        """
        logger.info(
            f"Analyzing sentiment for {len(messages)} messages (batch_size={batch_size}, sample_rate=1/{sample_rate})"
        )

        # Filter and prepare messages for batch processing
        valid_messages = []
        for idx, msg in enumerate(messages):
            if msg.role == "system":
                continue
            if not msg.content or len(msg.content.strip()) < 10:
                continue
            # Sample every Nth message for speed (large datasets)
            if len(messages) > 1000 and idx % sample_rate != 0:
                continue
            valid_messages.append(msg)

        if not valid_messages:
            return []

        logger.info(f"Processing {len(valid_messages)} valid messages for sentiment")

        # Load model once
        self._load_model()

        results: list[SentimentData] = []

        # If transformer pipeline is available, use batch processing
        if self._pipeline is not None:
            # Process in batches
            for i in range(0, len(valid_messages), batch_size):
                batch_msgs = valid_messages[i : i + batch_size]
                batch_texts = [msg.content[:2000] for msg in batch_msgs]  # Truncate

                try:
                    # Batch inference - MUCH faster than one at a time
                    batch_results = self._pipeline(batch_texts)

                    for msg, result in zip(batch_msgs, batch_results):
                        label_str = result["label"].upper()
                        score = result["score"]

                        if label_str == "POSITIVE":
                            label = SentimentLabel.POSITIVE
                        elif label_str == "NEGATIVE":
                            label = SentimentLabel.NEGATIVE
                        else:
                            label = SentimentLabel.NEUTRAL

                        results.append(
                            SentimentData(
                                timestamp=msg.timestamp,
                                messageType=msg.role
                                if msg.role in ("user", "assistant")
                                else "user",
                                label=label,
                                score=score,
                            )
                        )

                    # Log and print progress every 5 batches
                    if (i // batch_size) % 5 == 0:
                        done = i + len(batch_msgs)
                        pct = (
                            30 + (done / len(valid_messages)) * 30
                        )  # Sentiment is 30-60% of total
                        logger.info(
                            f"Sentiment progress: {done}/{len(valid_messages)} ({pct:.0f}%)"
                        )
                        progress_json = json.dumps(
                            {
                                "stage": "sentiment",
                                "current": done,
                                "total": len(valid_messages),
                                "message": f"Analyzing sentiment: {done}/{len(valid_messages)}",
                                "percentage": pct,
                            }
                        )
                        print(f"PROGRESS:{progress_json}", flush=True)
                        sys.stdout.flush()

                except Exception as e:
                    logger.warning(
                        f"Batch sentiment failed at {i}: {e}, using fallback"
                    )
                    # Fallback for this batch
                    for msg in batch_msgs:
                        label, score = self._lexicon_sentiment(msg.content)
                        results.append(
                            SentimentData(
                                timestamp=msg.timestamp,
                                messageType=msg.role
                                if msg.role in ("user", "assistant")
                                else "user",
                                label=label,
                                score=score,
                            )
                        )
        else:
            # No transformer available, use lexicon fallback
            logger.warning("No transformer model, using lexicon-based sentiment")
            for msg in valid_messages:
                label, score = self._lexicon_sentiment(msg.content)
                results.append(
                    SentimentData(
                        timestamp=msg.timestamp,
                        messageType=msg.role
                        if msg.role in ("user", "assistant")
                        else "user",
                        label=label,
                        score=score,
                    )
                )

        logger.info(f"Generated {len(results)} sentiment data points")
        return results

    def _lexicon_sentiment(self, text: str) -> tuple[SentimentLabel, float]:
        """
        Simple lexicon-based sentiment analysis fallback.

        Args:
            text: Text to analyze.

        Returns:
            Tuple of (label, confidence score).
        """
        positive_words = {
            "good",
            "great",
            "excellent",
            "amazing",
            "wonderful",
            "fantastic",
            "awesome",
            "love",
            "loved",
            "happy",
            "success",
            "successful",
            "achieved",
            "improved",
            "better",
            "best",
            "perfect",
            "solved",
            "completed",
            "delivered",
            "launched",
            "created",
            "built",
            "innovative",
            "efficient",
            "effective",
            "helpful",
            "useful",
            "exciting",
            "inspired",
            "proud",
            "accomplished",
            "productive",
        }

        negative_words = {
            "bad",
            "terrible",
            "awful",
            "horrible",
            "hate",
            "hated",
            "failed",
            "failure",
            "problem",
            "issue",
            "bug",
            "error",
            "broken",
            "wrong",
            "mistake",
            "difficult",
            "hard",
            "struggle",
            "frustrated",
            "annoyed",
            "angry",
            "disappointed",
            "worried",
            "stressed",
            "confused",
            "stuck",
            "blocked",
            "delayed",
            "slow",
            "missing",
            "incomplete",
            "unclear",
            "complex",
        }

        words = set(text.lower().split())

        pos_count = len(words & positive_words)
        neg_count = len(words & negative_words)

        total = pos_count + neg_count

        if total == 0:
            return SentimentLabel.NEUTRAL, 0.5

        if pos_count > neg_count:
            confidence = 0.5 + (pos_count / (total * 2))
            return SentimentLabel.POSITIVE, min(confidence, 0.95)
        elif neg_count > pos_count:
            confidence = 0.5 + (neg_count / (total * 2))
            return SentimentLabel.NEGATIVE, min(confidence, 0.95)
        else:
            return SentimentLabel.NEUTRAL, 0.5

    def get_sentiment_timeline(
        self,
        sentiment_data: list[SentimentData],
        window_size: int = 10,
    ) -> list[dict]:
        """
        Calculate rolling sentiment averages for timeline visualization.

        Args:
            sentiment_data: List of sentiment data points.
            window_size: Number of messages per rolling window.

        Returns:
            List of timeline points with averaged sentiment.
        """
        if len(sentiment_data) < window_size:
            return []

        # Sort by timestamp — use epoch-zero datetime as sentinel for missing values
        _EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)
        sorted_data = sorted(
            sentiment_data,
            key=lambda x: x.timestamp if x.timestamp else _EPOCH,
        )

        timeline = []

        for i in range(0, len(sorted_data) - window_size + 1, window_size // 2):
            window = sorted_data[i : i + window_size]

            # Calculate average score
            scores = []
            for d in window:
                if d.label == SentimentLabel.POSITIVE:
                    scores.append(d.score)
                elif d.label == SentimentLabel.NEGATIVE:
                    scores.append(-d.score)
                else:
                    scores.append(0)

            avg_score = sum(scores) / len(scores)

            timeline.append(
                {
                    "start_index": i,
                    "end_index": i + window_size,
                    "average_score": round(avg_score, 3),
                    "positive_ratio": sum(
                        1 for d in window if d.label == SentimentLabel.POSITIVE
                    )
                    / len(window),
                    "negative_ratio": sum(
                        1 for d in window if d.label == SentimentLabel.NEGATIVE
                    )
                    / len(window),
                }
            )

        return timeline


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["SentimentAnalyzer"]
