"""
Pydantic Models for Resume Builder NLP Sidecar

Request/Response models matching TypeScript api-types.ts for
seamless interoperability with the Electron frontend.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Generic, Literal, Optional, TypeVar

from pydantic import BaseModel, Field


# =============================================================================
# Enums
# =============================================================================


class ConversationSource(str, Enum):
    """Supported conversation export sources."""

    CHATGPT = "chatgpt"
    CLAUDE = "claude"
    GENERIC = "generic"


class SkillCategory(str, Enum):
    """Categories for skill classification."""

    PROGRAMMING = "programming"
    DATA_SCIENCE = "data-science"
    WEB_MOBILE = "web-mobile"
    DEVOPS_CLOUD = "devops-cloud"
    SOFT_SKILLS = "soft-skills"
    DATABASE = "database"
    OTHER = "other"


class SentimentLabel(str, Enum):
    """Sentiment classification labels."""

    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"


class TimelineEventType(str, Enum):
    """Types of timeline events."""

    DEVELOPMENT = "development"
    DEPLOYMENT = "deployment"
    ACHIEVEMENT = "achievement"
    LEARNING = "learning"


# =============================================================================
# Message & Conversation Models
# =============================================================================


class Message(BaseModel):
    """Individual message within a conversation."""

    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None


class Conversation(BaseModel):
    """A conversation containing multiple messages."""

    id: str
    title: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    source: ConversationSource
    messages: list[Message]

    class Config:
        populate_by_name = True


# =============================================================================
# Skill Models
# =============================================================================


class ExtractedSkill(BaseModel):
    """Skill extracted from conversation analysis."""

    id: str
    name: str
    category: SkillCategory
    frequency: int
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


class SkillExtractionRequest(BaseModel):
    """Request for skill extraction."""

    messages: list[Message]
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    min_frequency: int = Field(default=2, ge=1)
    max_skills: int = Field(default=50, ge=1, le=200)


class SkillExtractionResponse(BaseModel):
    """Response from skill extraction."""

    skills: list[ExtractedSkill]
    total_messages_processed: int
    processing_time_ms: float


# =============================================================================
# Achievement Models
# =============================================================================


class ExtractedAchievement(BaseModel):
    """Achievement or accomplishment extracted from conversations."""

    id: str
    description: str
    context: str
    sentiment_score: float = Field(alias="sentimentScore", ge=-1.0, le=1.0)
    date: Optional[datetime] = None
    skills: list[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# =============================================================================
# Timeline Models
# =============================================================================


class TimelineEvent(BaseModel):
    """Event in the user's professional timeline."""

    id: str
    date: datetime
    event: str
    type: TimelineEventType


# =============================================================================
# Topic Models
# =============================================================================


class TopicCluster(BaseModel):
    """Topic cluster from topic modeling."""

    id: int
    name: str
    keywords: list[str]
    count: int


# =============================================================================
# Sentiment Models
# =============================================================================


class SentimentData(BaseModel):
    """Sentiment analysis data point."""

    timestamp: datetime
    message_type: Literal["user", "assistant"] = Field(alias="messageType")
    label: SentimentLabel
    score: float = Field(ge=0.0, le=1.0)

    class Config:
        populate_by_name = True


# =============================================================================
# Job Matching Models
# =============================================================================


class JobMatch(BaseModel):
    """Job position match based on skill analysis."""

    id: str
    title: str
    description: str
    match_score: float = Field(alias="matchScore", ge=0.0, le=100.0)
    matched_skills: list[str] = Field(alias="matchedSkills")
    missing_skills: list[str] = Field(alias="missingSkills")

    class Config:
        populate_by_name = True


class JobDescription(BaseModel):
    """Job description for matching."""

    id: str
    title: str
    description: str
    required_skills: list[str] = Field(alias="requiredSkills", default_factory=list)
    preferred_skills: list[str] = Field(alias="preferredSkills", default_factory=list)

    class Config:
        populate_by_name = True


class JobMatchRequest(BaseModel):
    """Request for job matching."""

    skills: list[ExtractedSkill]
    job_descriptions: list[JobDescription] = Field(alias="jobDescriptions")
    top_k: int = Field(default=10, ge=1, le=50)

    class Config:
        populate_by_name = True


class JobMatchResponse(BaseModel):
    """Response from job matching."""

    matches: list[JobMatch]
    processing_time_ms: float


# =============================================================================
# Analysis Models
# =============================================================================


class AnalysisResult(BaseModel):
    """Complete result from NLP analysis pipeline."""

    skills: list[ExtractedSkill]
    achievements: list[ExtractedAchievement]
    timeline: list[TimelineEvent]
    topics: list[TopicCluster]
    sentiments: list[SentimentData]


class AnalyzeRequest(BaseModel):
    """Request for full NLP analysis."""

    conversations: list[Conversation]
    options: Optional[dict[str, Any]] = None


class AnalyzeResponse(BaseModel):
    """Response from full NLP analysis."""

    result: AnalysisResult
    total_messages: int
    total_conversations: int
    processing_time_ms: float


# =============================================================================
# Enhancement Models
# =============================================================================


class EnhanceRequest(BaseModel):
    """Request for content enhancement via Claude API."""

    content: str
    context: Optional[str] = None
    target_job: Optional[str] = Field(alias="targetJob", default=None)
    enhancement_type: Literal["summary", "bullet_points", "full_rewrite"] = Field(
        alias="enhancementType", default="bullet_points"
    )

    class Config:
        populate_by_name = True


class EnhanceResponse(BaseModel):
    """Response from content enhancement."""

    enhanced_content: str = Field(alias="enhancedContent")
    suggestions: list[str] = Field(default_factory=list)
    processing_time_ms: float

    class Config:
        populate_by_name = True


# =============================================================================
# Progress Models
# =============================================================================


class ProgressEvent(BaseModel):
    """Progress tracking for long-running operations."""

    stage: str
    current: int
    total: int
    message: str
    percentage: float = Field(ge=0.0, le=100.0)


# =============================================================================
# Health & Status Models
# =============================================================================


class HealthStatus(BaseModel):
    """Health check response."""

    status: Literal["healthy", "degraded", "unhealthy"]
    version: str
    device: str
    models_loaded: dict[str, bool]
    uptime_seconds: float


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# =============================================================================
# Generic Result Wrapper
# =============================================================================

T = TypeVar("T")


class Result(BaseModel, Generic[T]):
    """Result wrapper for operations that may fail."""

    success: bool
    data: Optional[T] = None
    error: Optional[str] = None


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Enums
    "ConversationSource",
    "SkillCategory",
    "SentimentLabel",
    "TimelineEventType",
    # Core Models
    "Message",
    "Conversation",
    "ExtractedSkill",
    "ExtractedAchievement",
    "TimelineEvent",
    "TopicCluster",
    "SentimentData",
    "JobMatch",
    "JobDescription",
    "AnalysisResult",
    # Request/Response
    "SkillExtractionRequest",
    "SkillExtractionResponse",
    "JobMatchRequest",
    "JobMatchResponse",
    "AnalyzeRequest",
    "AnalyzeResponse",
    "EnhanceRequest",
    "EnhanceResponse",
    "ProgressEvent",
    "HealthStatus",
    "ErrorResponse",
    "Result",
]
