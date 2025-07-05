"""
NLP Package for Resume Builder

Contains modules for:
- Skill extraction from conversation text
- Achievement detection and scoring
- Topic modeling with BERTopic
- Job matching with sentence embeddings
- Sentiment analysis
- Orchestration pipeline
"""

from nlp.skill_extractor import SkillExtractor
from nlp.achievement_detector import AchievementDetector
from nlp.topic_modeler import TopicModeler
from nlp.job_matcher import JobMatcher
from nlp.sentiment import SentimentAnalyzer
from nlp.pipeline import AnalysisPipeline

__all__ = [
    "SkillExtractor",
    "AchievementDetector",
    "TopicModeler",
    "JobMatcher",
    "SentimentAnalyzer",
    "AnalysisPipeline",
]
