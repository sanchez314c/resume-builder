"""
Topic Modeler Module

Performs topic modeling on conversation messages using BERTopic
to identify thematic clusters and generate keywords.
"""

from typing import Optional

from loguru import logger

from models import Message, TopicCluster
from utils.device import DeviceManager


class TopicModeler:
    """
    Performs topic modeling using BERTopic.

    Extracts thematic clusters from conversation messages,
    generating topic names and representative keywords.
    """

    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        num_topics: int = 10,
        min_topic_size: int = 5,
    ):
        """
        Initialize the topic modeler.

        Args:
            embedding_model: Sentence transformer model for embeddings.
            num_topics: Target number of topics to extract.
            min_topic_size: Minimum documents per topic.
        """
        self._embedding_model = embedding_model
        self._num_topics = num_topics
        self._min_topic_size = min_topic_size
        self._model = None
        self._device = DeviceManager.get_device()

        logger.info(f"TopicModeler initialized (device: {self._device})")

    def _load_model(self) -> None:
        """Lazy load BERTopic model."""
        if self._model is not None:
            return

        try:
            from bertopic import BERTopic
            from sentence_transformers import SentenceTransformer

            # Load embedding model with correct device
            # CRITICAL: For MPS, just use "mps" not "mps:0"
            device = self._device
            embedding_model = SentenceTransformer(
                self._embedding_model,
                device=device,
            )

            # Configure BERTopic
            self._model = BERTopic(
                embedding_model=embedding_model,
                nr_topics=self._num_topics,
                min_topic_size=self._min_topic_size,
                verbose=False,
                calculate_probabilities=False,  # Faster
            )

            logger.info("BERTopic model loaded successfully")

        except ImportError as e:
            logger.error(f"BERTopic not installed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to load BERTopic: {e}")
            raise

    def model(
        self,
        messages: list[Message],
        min_docs: int = 20,
    ) -> list[TopicCluster]:
        """
        Perform topic modeling on messages.

        Args:
            messages: List of messages to analyze.
            min_docs: Minimum documents required for modeling.

        Returns:
            List of topic clusters with keywords.
        """
        # Filter to user messages with substantial content
        docs = [m.content for m in messages if m.role == "user" and len(m.content) > 50]

        if len(docs) < min_docs:
            logger.warning(
                f"Not enough documents for topic modeling "
                f"({len(docs)} < {min_docs}). Returning empty."
            )
            return []

        logger.info(f"Topic modeling {len(docs)} documents")

        try:
            self._load_model()

            # Fit the model
            assert self._model is not None  # guaranteed by _load_model
            topics, _ = self._model.fit_transform(docs)

            # Get topic info
            topic_info = self._model.get_topic_info()

            clusters: list[TopicCluster] = []

            for _, row in topic_info.iterrows():
                topic_id = row["Topic"]

                # Skip outlier topic (-1)
                if topic_id == -1:
                    continue

                # Get keywords for this topic
                assert self._model is not None
                topic_words = self._model.get_topic(topic_id)
                if not topic_words:
                    continue

                keywords = [word for word, _ in topic_words[:10]]
                name = self._generate_topic_name(keywords)
                count = row["Count"]

                clusters.append(
                    TopicCluster(
                        id=topic_id,
                        name=name,
                        keywords=keywords,
                        count=count,
                    )
                )

            # Sort by count descending
            clusters.sort(key=lambda c: c.count, reverse=True)

            logger.info(f"Extracted {len(clusters)} topic clusters")
            return clusters

        except Exception as e:
            logger.error(f"Topic modeling failed: {e}")
            return []

    def _generate_topic_name(self, keywords: list[str]) -> str:
        """Generate a human-readable topic name from keywords."""
        if not keywords:
            return "Unknown Topic"

        # Take top 2-3 keywords and combine
        top_keywords = keywords[:3]

        # Capitalize and join
        name = " & ".join(word.title() for word in top_keywords)

        # Limit length
        if len(name) > 40:
            name = " & ".join(word.title() for word in top_keywords[:2])

        return name

    def get_topic_for_document(self, document: str) -> Optional[int]:
        """Get the topic ID for a single document."""
        if self._model is None:
            return None

        try:
            topics, _ = self._model.transform([document])
            return topics[0] if topics else None
        except Exception as e:
            logger.warning(f"Failed to get topic for document: {e}")
            return None

    def reduce_topics(self, target_topics: int) -> None:
        """Reduce the number of topics to target."""
        if self._model is None:
            return

        try:
            self._model.reduce_topics(
                docs=None,  # Use already fitted docs
                nr_topics=target_topics,
            )
            logger.info(f"Reduced topics to {target_topics}")
        except Exception as e:
            logger.error(f"Failed to reduce topics: {e}")


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["TopicModeler"]
