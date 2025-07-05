"""
Job Matcher Module

Matches user skills against job descriptions using semantic
similarity with sentence embeddings.
"""

import numpy as np
from loguru import logger

from models import ExtractedSkill, JobDescription, JobMatch
from utils.device import DeviceManager


class JobMatcher:
    """
    Matches user skills to job descriptions.

    Uses sentence transformers to compute semantic similarity
    between skill profiles and job requirements.
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
    ):
        """
        Initialize the job matcher.

        Args:
            model_name: Sentence transformer model for embeddings.
        """
        self._model_name = model_name
        self._model = None
        self._device = DeviceManager.get_device()

        logger.info(f"JobMatcher initialized (device: {self._device})")

    def _load_model(self) -> None:
        """Lazy load sentence transformer model."""
        if self._model is not None:
            return

        try:
            from sentence_transformers import SentenceTransformer

            # CRITICAL: For MPS, use "mps" not "mps:0"
            self._model = SentenceTransformer(
                self._model_name,
                device=self._device,
            )

            logger.info(f"Loaded sentence transformer: {self._model_name}")

        except Exception as e:
            logger.error(f"Failed to load sentence transformer: {e}")
            raise

    def match(
        self,
        skills: list[ExtractedSkill],
        job_descriptions: list[JobDescription],
        top_k: int = 10,
    ) -> list[JobMatch]:
        """
        Match user skills against job descriptions.

        Args:
            skills: List of user's extracted skills.
            job_descriptions: List of job descriptions to match against.
            top_k: Number of top matches to return.

        Returns:
            List of job matches sorted by match score.
        """
        if not skills or not job_descriptions:
            return []

        logger.info(
            f"Matching {len(skills)} skills against "
            f"{len(job_descriptions)} job descriptions"
        )

        self._load_model()
        assert self._model is not None  # guaranteed by _load_model

        # Build skill profile text
        skill_text = self._build_skill_profile(skills)

        # Encode skill profile
        skill_embedding = self._model.encode(
            skill_text,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        matches: list[JobMatch] = []

        for job in job_descriptions:
            # Build job description text
            job_text = self._build_job_text(job)

            # Encode job description
            job_embedding = self._model.encode(
                job_text,
                convert_to_numpy=True,
                show_progress_bar=False,
            )

            # Calculate cosine similarity
            similarity = self._cosine_similarity(skill_embedding, job_embedding)

            # Convert to percentage (0-100)
            match_score = float(similarity * 100)

            # Determine matched and missing skills
            user_skill_names = {s.name.lower() for s in skills}
            required = {s.lower() for s in job.required_skills}
            preferred = {s.lower() for s in job.preferred_skills}
            all_job_skills = required | preferred

            matched = list(user_skill_names & all_job_skills)
            missing = list(required - user_skill_names)

            # Boost score based on direct skill matches
            skill_match_boost = len(matched) / max(len(all_job_skills), 1) * 20
            match_score = min(100, match_score + skill_match_boost)

            matches.append(
                JobMatch(
                    id=job.id,
                    title=job.title,
                    description=job.description[:500],  # Truncate for response
                    matchScore=round(match_score, 1),
                    matchedSkills=matched,
                    missingSkills=missing,
                )
            )

        # Sort by match score descending
        matches.sort(key=lambda m: m.match_score, reverse=True)

        logger.info(f"Generated {len(matches[:top_k])} job matches")
        return matches[:top_k]

    def _build_skill_profile(self, skills: list[ExtractedSkill]) -> str:
        """Build a text representation of the skill profile."""
        # Weight skills by frequency and confidence
        weighted_skills = []

        for skill in sorted(
            skills, key=lambda s: s.frequency * s.confidence, reverse=True
        ):
            # Repeat skill name based on importance
            weight = max(1, int(skill.frequency * skill.confidence))
            weighted_skills.extend([skill.name] * min(weight, 3))

        # Create descriptive text
        skill_list = ", ".join(weighted_skills[:50])
        return f"Professional with expertise in: {skill_list}"

    def _build_job_text(self, job: JobDescription) -> str:
        """Build a text representation of the job description."""
        parts = [
            f"Job Title: {job.title}",
            f"Description: {job.description}",
        ]

        if job.required_skills:
            parts.append(f"Required Skills: {', '.join(job.required_skills)}")

        if job.preferred_skills:
            parts.append(f"Preferred Skills: {', '.join(job.preferred_skills)}")

        return " ".join(parts)

    def _cosine_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
    ) -> float:
        """Calculate cosine similarity between two embeddings."""
        # Normalize vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(np.dot(embedding1, embedding2) / (norm1 * norm2))

    def calculate_gap_analysis(
        self,
        skills: list[ExtractedSkill],
        job: JobDescription,
    ) -> dict:
        """
        Perform detailed gap analysis for a specific job.

        Returns:
            Dictionary with matched, missing, and recommended skills.
        """
        user_skill_names = {s.name.lower() for s in skills}

        required = {s.lower() for s in job.required_skills}
        preferred = {s.lower() for s in job.preferred_skills}

        matched_required = required & user_skill_names
        matched_preferred = preferred & user_skill_names
        missing_required = required - user_skill_names
        missing_preferred = preferred - user_skill_names

        # Calculate readiness score
        required_coverage = len(matched_required) / max(len(required), 1)
        preferred_coverage = len(matched_preferred) / max(len(preferred), 1)
        readiness = (required_coverage * 0.7 + preferred_coverage * 0.3) * 100

        return {
            "job_id": job.id,
            "job_title": job.title,
            "readiness_score": round(readiness, 1),
            "matched_required": list(matched_required),
            "matched_preferred": list(matched_preferred),
            "missing_required": list(missing_required),
            "missing_preferred": list(missing_preferred),
            "priority_skills_to_learn": list(missing_required)[:5],
            "nice_to_have_skills": list(missing_preferred)[:5],
        }


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["JobMatcher"]
