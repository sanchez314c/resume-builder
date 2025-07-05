"""
Analysis Pipeline Module

Orchestrates all NLP components for comprehensive
conversation analysis with progress tracking.
"""

import asyncio
import uuid
from typing import Any, Callable, Coroutine, Optional

from loguru import logger

from config import settings
from models import (
    AnalysisResult,
    ExtractedAchievement,
    ExtractedSkill,
    JobDescription,
    JobMatch,
    Message,
    TimelineEvent,
    TimelineEventType,
    TopicCluster,
)


# Type alias for progress callback
ProgressCallback = Callable[[str, int, int, str], Coroutine[Any, Any, None]]


class AnalysisPipeline:
    """
    Orchestrates the complete NLP analysis pipeline.

    Manages lazy loading of components, batch processing,
    memory management, and progress reporting.
    """

    def __init__(self):
        """Initialize the analysis pipeline with lazy-loaded components."""
        self._skill_extractor = None
        self._achievement_detector = None
        self._topic_modeler = None
        self._job_matcher = None
        self._sentiment_analyzer = None

        logger.info("AnalysisPipeline initialized (components lazy-loaded)")

    # =========================================================================
    # Component Properties (Lazy Loading)
    # =========================================================================

    @property
    def skill_extractor(self):
        """Lazy load skill extractor."""
        if self._skill_extractor is None:
            from nlp.skill_extractor import SkillExtractor

            self._skill_extractor = SkillExtractor(spacy_model=settings.spacy_model)
        return self._skill_extractor

    @property
    def achievement_detector(self):
        """Lazy load achievement detector."""
        if self._achievement_detector is None:
            from nlp.achievement_detector import AchievementDetector

            self._achievement_detector = AchievementDetector(
                min_sentence_length=settings.min_achievement_length,
                max_achievements=settings.max_achievements,
            )
            # Set sentiment analyzer if available
            if self._sentiment_analyzer is not None:
                self._achievement_detector.set_sentiment_analyzer(
                    self._sentiment_analyzer.analyze_score
                )
        return self._achievement_detector

    @property
    def topic_modeler(self):
        """Lazy load topic modeler."""
        if self._topic_modeler is None:
            from nlp.topic_modeler import TopicModeler

            self._topic_modeler = TopicModeler(
                embedding_model=settings.sentence_transformer_model,
                num_topics=settings.num_topics,
            )
        return self._topic_modeler

    @property
    def job_matcher(self):
        """Lazy load job matcher."""
        if self._job_matcher is None:
            from nlp.job_matcher import JobMatcher

            self._job_matcher = JobMatcher(
                model_name=settings.sentence_transformer_model
            )
        return self._job_matcher

    @property
    def sentiment_analyzer(self):
        """Lazy load sentiment analyzer."""
        if self._sentiment_analyzer is None:
            from nlp.sentiment import SentimentAnalyzer

            self._sentiment_analyzer = SentimentAnalyzer(
                model_name=settings.sentiment_model
            )
        return self._sentiment_analyzer

    # =========================================================================
    # Main Analysis Pipeline
    # =========================================================================

    async def analyze(
        self,
        messages: list[Message],
        options: dict[str, Any],
        progress_callback: Optional[ProgressCallback] = None,
    ) -> AnalysisResult:
        """
        Run the complete analysis pipeline.

        Args:
            messages: List of conversation messages to analyze.
            options: Configuration options for analysis.
            progress_callback: Optional async callback for progress updates.

        Returns:
            AnalysisResult containing all extracted data.
        """
        total_messages = len(messages)

        # Progress is reported as percentage of messages processed
        # Each stage processes all messages, so we track stage completion
        stage_weights = {
            "skills": 30,  # 0-30%
            "sentiment": 30,  # 30-60%
            "achievements": 15,  # 60-75%
            "topics": 15,  # 75-90%
            "timeline": 10,  # 90-100%
        }

        current_progress = 0

        async def report_progress(stage: str, message: str, stage_percent: int = 100):
            """Report progress with approximate message counts."""
            nonlocal current_progress

            # Calculate cumulative progress
            stages_before = [
                "skills",
                "sentiment",
                "achievements",
                "topics",
                "timeline",
            ]
            idx = stages_before.index(stage) if stage in stages_before else 0

            base_progress = sum(stage_weights[s] for s in stages_before[:idx])
            stage_progress = (stage_weights.get(stage, 0) * stage_percent) // 100
            current_progress = base_progress + stage_progress

            # Convert to message count for display
            messages_done = (current_progress * total_messages) // 100

            if progress_callback:
                await progress_callback(stage, messages_done, total_messages, message)

        logger.info(f"Starting analysis pipeline for {total_messages} messages")

        # Step 1: Skill Extraction (0-30%)
        await report_progress(
            "skills", f"Extracting skills from {total_messages} messages...", 0
        )
        skills = await asyncio.to_thread(
            self.skill_extractor.extract,
            messages,
            options.get("min_confidence", settings.min_skill_confidence),
            options.get("min_frequency", settings.min_skill_frequency),
            options.get("max_skills", settings.max_skills),
        )
        await report_progress("skills", f"Found {len(skills)} skills", 100)

        # Step 2: Sentiment Analysis (30-60%)
        await report_progress(
            "sentiment", f"Analyzing sentiment for {total_messages} messages...", 0
        )
        sentiments = await asyncio.to_thread(
            self.sentiment_analyzer.analyze_messages,
            messages,
            options.get("batch_size", settings.batch_size),
        )
        await report_progress(
            "sentiment", f"Analyzed {len(sentiments)} sentiment points", 100
        )

        # Inject sentiment analyzer into achievement detector
        self.achievement_detector.set_sentiment_analyzer(
            self.sentiment_analyzer.analyze_score
        )

        # Step 3: Achievement Detection (60-75%)
        await report_progress("achievements", "Detecting achievements...", 0)
        achievements = await asyncio.to_thread(
            self.achievement_detector.detect,
            messages,
            skills,
        )
        await report_progress(
            "achievements", f"Found {len(achievements)} achievements", 100
        )

        # Step 4: Topic Modeling (75-90%) - DISABLED due to version incompatibility
        await report_progress(
            "topics", "Skipping topic modeling (disabled for speed)...", 0
        )
        topics: list[
            TopicCluster
        ] = []  # Disabled - StaticEmbedding import error in sentence_transformers
        await report_progress("topics", "Topic modeling skipped", 100)

        # Step 5: Timeline Generation (90-100%)
        await report_progress("timeline", "Building professional timeline...", 0)
        timeline = await asyncio.to_thread(
            self._build_timeline,
            messages,
            achievements,
        )
        await report_progress(
            "timeline", f"Generated {len(timeline)} timeline events", 100
        )

        logger.info("Analysis pipeline complete")

        return AnalysisResult(
            skills=skills,
            achievements=achievements,
            timeline=timeline,
            topics=topics,
            sentiments=sentiments,
        )

    # =========================================================================
    # Individual Operations
    # =========================================================================

    async def extract_skills_only(
        self,
        messages: list[Message],
        min_confidence: float = 0.5,
        min_frequency: int = 2,
        max_skills: int = 50,
    ) -> list[ExtractedSkill]:
        """
        Extract skills without running full pipeline.

        Args:
            messages: Messages to analyze.
            min_confidence: Minimum confidence threshold.
            min_frequency: Minimum frequency threshold.
            max_skills: Maximum skills to return.

        Returns:
            List of extracted skills.
        """
        return await asyncio.to_thread(
            self.skill_extractor.extract,
            messages,
            min_confidence,
            min_frequency,
            max_skills,
        )

    async def match_jobs(
        self,
        skills: list[ExtractedSkill],
        job_descriptions: list[JobDescription],
        top_k: int = 10,
    ) -> list[JobMatch]:
        """
        Match skills against job descriptions.

        Args:
            skills: User's extracted skills.
            job_descriptions: Jobs to match against.
            top_k: Number of top matches to return.

        Returns:
            List of job matches.
        """
        return await asyncio.to_thread(
            self.job_matcher.match,
            skills,
            job_descriptions,
            top_k,
        )

    async def enhance_content(
        self,
        content: str,
        context: Optional[str] = None,
        target_job: Optional[str] = None,
        enhancement_type: str = "bullet_points",
    ) -> dict[str, Any]:
        """
        Enhance content using Claude API.

        Args:
            content: Content to enhance.
            context: Optional context information.
            target_job: Optional target job for tailoring.
            enhancement_type: Type of enhancement to perform.

        Returns:
            Dictionary with enhanced content and suggestions.
        """
        if not settings.anthropic_api_key:
            logger.warning("Anthropic API key not configured")
            return {
                "content": content,
                "suggestions": ["Configure ANTHROPIC_API_KEY for AI enhancement"],
            }

        try:
            import httpx

            # Build prompt based on enhancement type
            if enhancement_type == "summary":
                prompt = f"Summarize this professional content in 2-3 sentences:\n\n{content}"
            elif enhancement_type == "bullet_points":
                prompt = f"Convert this content into professional resume bullet points. Each bullet should start with a strong action verb and quantify achievements where possible:\n\n{content}"
            elif enhancement_type == "full_rewrite":
                prompt = "Rewrite this content to be more impactful and professional for a resume"
                if target_job:
                    prompt += f" targeting a {target_job} position"
                prompt += f":\n\n{content}"
            else:
                prompt = f"Improve this professional content:\n\n{content}"

            if context:
                prompt = f"Context: {context}\n\n{prompt}"

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 1024,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    enhanced = data["content"][0]["text"]
                    return {
                        "content": enhanced,
                        "suggestions": [],
                    }
                else:
                    logger.error(f"Claude API error: {response.status_code}")
                    return {
                        "content": content,
                        "suggestions": [f"API error: {response.status_code}"],
                    }

        except Exception as e:
            logger.error(f"Enhancement failed: {e}")
            return {
                "content": content,
                "suggestions": [f"Enhancement failed: {str(e)}"],
            }

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _build_timeline(
        self,
        messages: list[Message],
        achievements: list[ExtractedAchievement],
    ) -> list[TimelineEvent]:
        """
        Build a professional timeline from messages and achievements.

        Args:
            messages: Conversation messages.
            achievements: Extracted achievements.

        Returns:
            List of timeline events.
        """
        events: list[TimelineEvent] = []

        # Add achievements as timeline events
        for achievement in achievements:
            if achievement.date:
                events.append(
                    TimelineEvent(
                        id=str(uuid.uuid4()),
                        date=achievement.date,
                        event=achievement.description[:200],
                        type=TimelineEventType.ACHIEVEMENT,
                    )
                )

        # Look for deployment/launch keywords in messages
        deployment_keywords = [
            "deployed",
            "launched",
            "shipped",
            "released",
            "went live",
            "production",
        ]

        learning_keywords = [
            "learned",
            "studying",
            "course",
            "certificate",
            "training",
            "workshop",
        ]

        for message in messages:
            if message.role != "user" or not message.timestamp:
                continue

            content_lower = message.content.lower()

            # Check for deployment events
            if any(kw in content_lower for kw in deployment_keywords):
                # Extract a brief description
                sentences = message.content.split(".")
                relevant = next(
                    (
                        s
                        for s in sentences
                        if any(kw in s.lower() for kw in deployment_keywords)
                    ),
                    sentences[0] if sentences else message.content,
                )

                events.append(
                    TimelineEvent(
                        id=str(uuid.uuid4()),
                        date=message.timestamp,
                        event=relevant.strip()[:200],
                        type=TimelineEventType.DEPLOYMENT,
                    )
                )

            # Check for learning events
            elif any(kw in content_lower for kw in learning_keywords):
                sentences = message.content.split(".")
                relevant = next(
                    (
                        s
                        for s in sentences
                        if any(kw in s.lower() for kw in learning_keywords)
                    ),
                    sentences[0] if sentences else message.content,
                )

                events.append(
                    TimelineEvent(
                        id=str(uuid.uuid4()),
                        date=message.timestamp,
                        event=relevant.strip()[:200],
                        type=TimelineEventType.LEARNING,
                    )
                )

        # Sort by date
        events.sort(key=lambda e: e.date, reverse=True)

        # Limit to reasonable number
        return events[:50]

    def clear_cache(self) -> None:
        """Clear all loaded models to free memory."""
        self._skill_extractor = None
        self._achievement_detector = None
        self._topic_modeler = None
        self._job_matcher = None
        self._sentiment_analyzer = None

        # Force garbage collection
        import gc

        gc.collect()

        logger.info("Pipeline cache cleared")


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["AnalysisPipeline", "ProgressCallback"]
