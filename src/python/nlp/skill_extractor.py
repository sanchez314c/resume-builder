"""
Skill Extractor Module

Extracts technical and soft skills from conversation text using:
- Comprehensive regex pattern matching for 200+ skills
- spaCy NER for additional skill detection
- Frequency counting and confidence scoring

Updated for 2026 AI job market with GenAI, LLMs, and emerging technologies.
"""

import json
import re
import sys
import uuid
from collections import Counter
from typing import Optional

from loguru import logger

from models import ExtractedSkill, Message, SkillCategory


class SkillExtractor:
    """
    Extracts skills from conversation messages.

    Uses a combination of regex patterns and NLP techniques
    to identify, categorize, and score technical skills.
    Comprehensive coverage of 2026 AI job market skills.
    """

    # ==========================================================================
    # Comprehensive Skill Patterns - 2026 AI Job Market
    # ==========================================================================

    SKILL_PATTERNS: dict[str, list[str]] = {
        # Programming Languages
        "programming": [
            r"python",
            r"javascript",
            r"typescript",
            r"java(?!script)",
            r"c\+\+",
            r"c#",
            r"\bgo\b",
            r"golang",
            r"rust",
            r"php",
            r"ruby",
            r"swift",
            r"kotlin",
            r"scala",
            r"perl",
            r"\br\b",
            r"matlab",
            r"julia",
            r"haskell",
            r"elixir",
            r"clojure",
            r"lua",
            r"dart",
            r"zig",
            r"mojo",
            r"cuda",
            r"opencl",
            r"assembly",
            r"fortran",
            r"cobol",
            r"erlang",
            r"f#",
            r"ocaml",
            r"nim",
            r"crystal",
            r"v\s*lang",
            r"solidity",
            r"vyper",
            r"move",
        ],
        # AI/ML Core
        "ai-ml": [
            r"machine\s*learning",
            r"deep\s*learning",
            r"artificial\s*intelligence",
            r"\bai\b",
            r"\bml\b",
            r"neural\s*network",
            r"supervised\s*learning",
            r"unsupervised\s*learning",
            r"reinforcement\s*learning",
            r"transfer\s*learning",
            r"federated\s*learning",
            r"online\s*learning",
            r"active\s*learning",
            r"meta\s*learning",
            r"few\s*-?\s*shot\s*learning",
            r"zero\s*-?\s*shot",
            r"self\s*-?\s*supervised",
            r"contrastive\s*learning",
            r"representation\s*learning",
            r"feature\s*engineering",
            r"feature\s*extraction",
            r"model\s*training",
            r"model\s*evaluation",
            r"model\s*optimization",
            r"hyperparameter\s*tuning",
            r"cross\s*-?\s*validation",
            r"ensemble\s*methods",
            r"gradient\s*descent",
            r"backpropagation",
            r"attention\s*mechanism",
            r"transformer",
            r"autoencoder",
            r"variational",
            r"\bvae\b",
            r"\bgan\b",
            r"generative\s*adversarial",
            r"diffusion\s*model",
            r"\bcnn\b",
            r"convolutional",
            r"\brnn\b",
            r"recurrent",
            r"\blstm\b",
            r"\bgru\b",
            r"graph\s*neural",
            r"\bgnn\b",
            r"neuro\s*-?\s*symbolic",
        ],
        # GenAI & LLMs (2024-2026 emerging)
        "genai-llm": [
            r"large\s*language\s*model",
            r"\bllm\b",
            r"generative\s*ai",
            r"gen\s*-?\s*ai",
            r"\bgpt\b",
            r"gpt\s*-?\s*[0-9]",
            r"chatgpt",
            r"claude",
            r"anthropic",
            r"openai",
            r"gemini",
            r"llama",
            r"mistral",
            r"mixtral",
            r"falcon",
            r"palm",
            r"bert",
            r"roberta",
            r"t5",
            r"bart",
            r"electra",
            r"xlnet",
            r"albert",
            r"distilbert",
            r"deberta",
            r"prompt\s*engineering",
            r"prompt\s*design",
            r"chain\s*-?\s*of\s*-?\s*thought",
            r"\bcot\b",
            r"retrieval\s*augmented",
            r"\brag\b",
            r"fine\s*-?\s*tuning",
            r"\blora\b",
            r"\bqlora\b",
            r"peft",
            r"rlhf",
            r"instruction\s*tuning",
            r"alignment",
            r"constitutional\s*ai",
            r"tokenization",
            r"embedding",
            r"vector\s*database",
            r"vector\s*store",
            r"semantic\s*search",
            r"langchain",
            r"llamaindex",
            r"haystack",
            r"autogen",
            r"crewai",
            r"ai\s*agent",
            r"multi\s*-?\s*agent",
            r"agentic",
            r"function\s*calling",
            r"tool\s*use",
            r"mcp",
            r"model\s*context\s*protocol",
        ],
        # NLP
        "nlp": [
            r"\bnlp\b",
            r"natural\s*language\s*processing",
            r"natural\s*language\s*understanding",
            r"\bnlu\b",
            r"natural\s*language\s*generation",
            r"\bnlg\b",
            r"text\s*mining",
            r"text\s*classification",
            r"sentiment\s*analysis",
            r"named\s*entity\s*recognition",
            r"\bner\b",
            r"part\s*-?\s*of\s*-?\s*speech",
            r"\bpos\b\s*tag",
            r"dependency\s*parsing",
            r"constituency\s*parsing",
            r"syntactic\s*analysis",
            r"semantic\s*analysis",
            r"coreference",
            r"relation\s*extraction",
            r"question\s*answering",
            r"\bqa\b",
            r"machine\s*translation",
            r"summarization",
            r"text\s*generation",
            r"dialogue\s*system",
            r"chatbot",
            r"conversational\s*ai",
            r"speech\s*recognition",
            r"\basr\b",
            r"speech\s*synthesis",
            r"\btts\b",
            r"text\s*-?\s*to\s*-?\s*speech",
            r"speech\s*-?\s*to\s*-?\s*text",
            r"spacy",
            r"nltk",
            r"hugging\s*face",
            r"transformers",
            r"stanza",
            r"flair",
            r"gensim",
            r"word2vec",
            r"glove",
            r"fasttext",
            r"sentence\s*transformer",
        ],
        # Computer Vision
        "computer-vision": [
            r"computer\s*vision",
            r"\bcv\b",
            r"image\s*processing",
            r"image\s*classification",
            r"object\s*detection",
            r"image\s*segmentation",
            r"semantic\s*segmentation",
            r"instance\s*segmentation",
            r"panoptic",
            r"pose\s*estimation",
            r"facial\s*recognition",
            r"face\s*detection",
            r"ocr",
            r"optical\s*character",
            r"video\s*analysis",
            r"action\s*recognition",
            r"tracking",
            r"depth\s*estimation",
            r"3d\s*reconstruction",
            r"point\s*cloud",
            r"lidar",
            r"slam",
            r"autonomous\s*driving",
            r"self\s*-?\s*driving",
            r"adas",
            r"opencv",
            r"yolo",
            r"detectron",
            r"mmdetection",
            r"torchvision",
            r"pillow",
            r"imageio",
            r"albumentations",
            r"stable\s*diffusion",
            r"midjourney",
            r"dall\s*-?\s*e",
            r"imagen",
            r"text\s*-?\s*to\s*-?\s*image",
            r"image\s*-?\s*to\s*-?\s*image",
            r"inpainting",
            r"outpainting",
            r"controlnet",
            r"lora",
        ],
        # Data Science & Analytics
        "data-science": [
            r"data\s*science",
            r"data\s*scientist",
            r"data\s*analysis",
            r"data\s*analytics",
            r"data\s*mining",
            r"data\s*visualization",
            r"data\s*engineering",
            r"data\s*pipeline",
            r"etl",
            r"elt",
            r"data\s*warehouse",
            r"data\s*lake",
            r"data\s*lakehouse",
            r"data\s*mesh",
            r"data\s*modeling",
            r"data\s*governance",
            r"data\s*quality",
            r"data\s*cleaning",
            r"data\s*wrangling",
            r"data\s*preprocessing",
            r"exploratory\s*data\s*analysis",
            r"\beda\b",
            r"statistical\s*analysis",
            r"statistics",
            r"probability",
            r"hypothesis\s*testing",
            r"regression",
            r"classification",
            r"clustering",
            r"dimensionality\s*reduction",
            r"\bpca\b",
            r"t\s*-?\s*sne",
            r"umap",
            r"time\s*series",
            r"forecasting",
            r"anomaly\s*detection",
            r"predictive\s*modeling",
            r"predictive\s*analytics",
            r"prescriptive\s*analytics",
            r"a\s*/\s*b\s*testing",
            r"experimentation",
            r"causal\s*inference",
            r"bayesian",
        ],
        # ML Frameworks & Tools
        "ml-frameworks": [
            r"tensorflow",
            r"pytorch",
            r"keras",
            r"jax",
            r"flax",
            r"mxnet",
            r"caffe",
            r"theano",
            r"scikit\s*-?\s*learn",
            r"sklearn",
            r"xgboost",
            r"lightgbm",
            r"catboost",
            r"optuna",
            r"ray",
            r"dask",
            r"vaex",
            r"polars",
            r"pandas",
            r"numpy",
            r"scipy",
            r"matplotlib",
            r"seaborn",
            r"plotly",
            r"bokeh",
            r"altair",
            r"streamlit",
            r"gradio",
            r"jupyter",
            r"notebook",
            r"colab",
            r"mlflow",
            r"wandb",
            r"weights\s*&?\s*biases",
            r"neptune",
            r"comet",
            r"tensorboard",
            r"onnx",
            r"triton",
            r"trt",
            r"tensorrt",
            r"vllm",
            r"tgi",
            r"ollama",
            r"llamacpp",
        ],
        # MLOps & Infrastructure
        "mlops": [
            r"mlops",
            r"aiops",
            r"dataops",
            r"model\s*deployment",
            r"model\s*serving",
            r"model\s*monitoring",
            r"model\s*registry",
            r"feature\s*store",
            r"experiment\s*tracking",
            r"pipeline\s*orchestration",
            r"kubeflow",
            r"airflow",
            r"prefect",
            r"dagster",
            r"metaflow",
            r"kedro",
            r"dvc",
            r"bentoml",
            r"seldon",
            r"kserve",
            r"sagemaker",
            r"vertex\s*ai",
            r"azure\s*ml",
            r"databricks",
            r"snowflake",
            r"dbt",
            r"great\s*expectations",
            r"evidently",
            r"whylogs",
            r"feast",
            r"tecton",
        ],
        # Web & Mobile Development
        "web-mobile": [
            r"\breact\b",
            r"react\s*native",
            r"\bvue\b",
            r"vuejs",
            r"angular",
            r"svelte",
            r"solid\s*js",
            r"qwik",
            r"astro",
            r"node\.?js",
            r"deno",
            r"bun",
            r"next\.?js",
            r"nuxt",
            r"remix",
            r"gatsby",
            r"express",
            r"fastify",
            r"nest\.?js",
            r"django",
            r"flask",
            r"fastapi",
            r"spring",
            r"spring\s*boot",
            r"rails",
            r"laravel",
            r"phoenix",
            r"\bgin\b",
            r"fiber",
            r"echo",
            r"actix",
            r"axum",
            r"frontend",
            r"backend",
            r"full\s*-?\s*stack",
            r"\bhtml\b",
            r"\bcss\b",
            r"sass",
            r"scss",
            r"tailwind",
            r"bootstrap",
            r"material\s*ui",
            r"chakra",
            r"shadcn",
            r"radix",
            r"\bapi\b",
            r"\brest\b",
            r"restful",
            r"graphql",
            r"grpc",
            r"websocket",
            r"trpc",
            r"mobile",
            r"\bios\b",
            r"android",
            r"flutter",
            r"expo",
            r"capacitor",
            r"tauri",
            r"electron",
            r"pwa",
        ],
        # Cloud & DevOps
        "devops-cloud": [
            r"\baws\b",
            r"amazon\s*web\s*services",
            r"azure",
            r"\bgcp\b",
            r"google\s*cloud",
            r"oracle\s*cloud",
            r"ibm\s*cloud",
            r"digital\s*ocean",
            r"linode",
            r"vultr",
            r"hetzner",
            r"cloudflare",
            r"vercel",
            r"netlify",
            r"railway",
            r"render",
            r"fly\.io",
            r"docker",
            r"podman",
            r"containerd",
            r"kubernetes",
            r"\bk8s\b",
            r"helm",
            r"kustomize",
            r"istio",
            r"linkerd",
            r"envoy",
            r"ci\s*[/-]?\s*cd",
            r"continuous\s*integration",
            r"continuous\s*deployment",
            r"continuous\s*delivery",
            r"\bgit\b",
            r"github",
            r"gitlab",
            r"bitbucket",
            r"github\s*actions",
            r"jenkins",
            r"circleci",
            r"travis",
            r"argo\s*cd",
            r"flux",
            r"tekton",
            r"devops",
            r"devsecops",
            r"gitops",
            r"infrastructure\s*as\s*code",
            r"\biac\b",
            r"terraform",
            r"pulumi",
            r"crossplane",
            r"ansible",
            r"chef",
            r"puppet",
            r"saltstack",
            r"linux",
            r"unix",
            r"\bbash\b",
            r"shell",
            r"powershell",
            r"nginx",
            r"apache",
            r"caddy",
            r"traefik",
            r"haproxy",
        ],
        # Databases & Storage
        "database": [
            r"\bsql\b",
            r"mysql",
            r"postgresql",
            r"postgres",
            r"mariadb",
            r"oracle\s*db",
            r"sql\s*server",
            r"mssql",
            r"sqlite",
            r"mongodb",
            r"nosql",
            r"cassandra",
            r"scylladb",
            r"couchdb",
            r"couchbase",
            r"dynamodb",
            r"cosmosdb",
            r"firestore",
            r"firebase",
            r"supabase",
            r"planetscale",
            r"neon",
            r"cockroachdb",
            r"tidb",
            r"vitess",
            r"clickhouse",
            r"druid",
            r"pinot",
            r"timescaledb",
            r"influxdb",
            r"questdb",
            r"neo4j",
            r"dgraph",
            r"arangodb",
            r"janusgraph",
            r"\bredis\b",
            r"memcached",
            r"valkey",
            r"elasticsearch",
            r"opensearch",
            r"solr",
            r"meilisearch",
            r"typesense",
            r"pinecone",
            r"weaviate",
            r"milvus",
            r"qdrant",
            r"chroma",
            r"faiss",
            r"\bs3\b",
            r"minio",
            r"prisma",
            r"drizzle",
            r"sequelize",
            r"typeorm",
            r"sqlalchemy",
            r"diesel",
        ],
        # Security & Compliance
        "security": [
            r"cyber\s*security",
            r"information\s*security",
            r"infosec",
            r"application\s*security",
            r"appsec",
            r"network\s*security",
            r"cloud\s*security",
            r"devsecops",
            r"secure\s*coding",
            r"penetration\s*testing",
            r"pen\s*test",
            r"vulnerability",
            r"owasp",
            r"sast",
            r"dast",
            r"sca",
            r"encryption",
            r"cryptography",
            r"tls",
            r"ssl",
            r"oauth",
            r"oidc",
            r"jwt",
            r"saml",
            r"identity\s*management",
            r"iam",
            r"rbac",
            r"abac",
            r"zero\s*trust",
            r"soc\s*2",
            r"gdpr",
            r"hipaa",
            r"pci\s*dss",
            r"iso\s*27001",
            r"compliance",
            r"audit",
            r"ai\s*safety",
            r"ai\s*security",
            r"adversarial\s*ml",
            r"model\s*security",
            r"data\s*privacy",
            r"differential\s*privacy",
            r"federated",
        ],
        # Big Data & Streaming
        "big-data": [
            r"big\s*data",
            r"\bspark\b",
            r"pyspark",
            r"hadoop",
            r"hdfs",
            r"hive",
            r"presto",
            r"trino",
            r"athena",
            r"redshift",
            r"bigquery",
            r"synapse",
            r"kafka",
            r"confluent",
            r"pulsar",
            r"kinesis",
            r"flink",
            r"beam",
            r"storm",
            r"samza",
            r"nifi",
            r"airbyte",
            r"fivetran",
            r"stitch",
            r"debezium",
            r"cdc",
            r"stream\s*processing",
            r"batch\s*processing",
            r"real\s*-?\s*time",
            r"event\s*-?\s*driven",
            r"pub\s*/?\s*sub",
            r"message\s*queue",
            r"rabbitmq",
            r"activemq",
            r"zeromq",
            r"nats",
        ],
        # Blockchain & Web3
        "blockchain": [
            r"blockchain",
            r"web3",
            r"cryptocurrency",
            r"crypto",
            r"bitcoin",
            r"ethereum",
            r"solana",
            r"polygon",
            r"avalanche",
            r"cosmos",
            r"polkadot",
            r"cardano",
            r"smart\s*contract",
            r"solidity",
            r"vyper",
            r"move",
            r"rust.*blockchain",
            r"defi",
            r"nft",
            r"dao",
            r"dapp",
            r"ipfs",
            r"layer\s*2",
            r"rollup",
            r"zk\s*-?\s*proof",
            r"zero\s*knowledge",
        ],
        # Soft Skills & Management
        "soft-skills": [
            r"leadership",
            r"team\s*lead",
            r"tech\s*lead",
            r"engineering\s*manager",
            r"management",
            r"people\s*management",
            r"project\s*management",
            r"product\s*management",
            r"program\s*management",
            r"agile",
            r"scrum",
            r"kanban",
            r"lean",
            r"safe",
            r"waterfall",
            r"sprint",
            r"jira",
            r"confluence",
            r"notion",
            r"asana",
            r"monday",
            r"trello",
            r"communication",
            r"presentation",
            r"public\s*speaking",
            r"technical\s*writing",
            r"documentation",
            r"problem\s*solving",
            r"critical\s*thinking",
            r"analytical",
            r"teamwork",
            r"collaboration",
            r"mentoring",
            r"coaching",
            r"stakeholder\s*management",
            r"cross\s*-?\s*functional",
            r"strategic\s*planning",
            r"roadmap",
            r"okr",
            r"kpi",
            r"budget",
            r"vendor\s*management",
            r"negotiation",
            r"conflict\s*resolution",
            r"decision\s*making",
            r"prioritization",
            r"time\s*management",
            r"remote\s*work",
            r"distributed\s*team",
        ],
        # Emerging & Specialized
        "emerging": [
            r"quantum\s*computing",
            r"quantum\s*machine\s*learning",
            r"qiskit",
            r"cirq",
            r"pennylane",
            r"edge\s*computing",
            r"edge\s*ai",
            r"iot",
            r"internet\s*of\s*things",
            r"embedded",
            r"raspberry\s*pi",
            r"arduino",
            r"fpga",
            r"asic",
            r"robotics",
            r"ros",
            r"robot\s*operating\s*system",
            r"simulation",
            r"digital\s*twin",
            r"ar",
            r"vr",
            r"xr",
            r"augmented\s*reality",
            r"virtual\s*reality",
            r"mixed\s*reality",
            r"metaverse",
            r"unity",
            r"unreal",
            r"game\s*development",
            r"biotech",
            r"bioinformatics",
            r"genomics",
            r"proteomics",
            r"drug\s*discovery",
            r"climate\s*tech",
            r"sustainability",
            r"green\s*ai",
            r"energy\s*efficiency",
        ],
    }

    # ==========================================================================
    # AI Job Titles for Matching
    # ==========================================================================

    JOB_TITLES: list[str] = [
        # Core AI/ML Roles
        "AI Engineer",
        "ML Engineer",
        "Machine Learning Engineer",
        "Deep Learning Engineer",
        "AI/ML Engineer",
        "AI Research Scientist",
        "ML Research Scientist",
        "Research Engineer",
        "Applied Scientist",
        # Specialized AI Roles
        "NLP Engineer",
        "Natural Language Processing Engineer",
        "Computer Vision Engineer",
        "Speech Recognition Engineer",
        "Conversational AI Engineer",
        "Robotics Engineer",
        "Autonomous Systems Engineer",
        # GenAI & LLM Roles (2024-2026)
        "GenAI Engineer",
        "LLM Engineer",
        "Prompt Engineer",
        "AI Solutions Architect",
        "AI Platform Engineer",
        "AI Infrastructure Engineer",
        "Foundation Model Engineer",
        "AI Agent Developer",
        # Data Roles
        "Data Scientist",
        "Senior Data Scientist",
        "Staff Data Scientist",
        "Principal Data Scientist",
        "Data Engineer",
        "Analytics Engineer",
        "Data Analyst",
        "Business Intelligence Developer",
        "ML Data Engineer",
        # MLOps & Infrastructure
        "MLOps Engineer",
        "ML Platform Engineer",
        "AI DevOps Engineer",
        "ML Infrastructure Engineer",
        "Model Operations Engineer",
        # Leadership & Management
        "AI Product Manager",
        "ML Product Manager",
        "AI Program Manager",
        "Director of AI",
        "VP of AI/ML",
        "Chief AI Officer",
        "Head of Data Science",
        "AI Team Lead",
        "ML Tech Lead",
        "Engineering Manager - AI/ML",
        # Governance & Ethics
        "AI Ethics Officer",
        "AI Safety Engineer",
        "AI Governance Specialist",
        "Responsible AI Lead",
        "AI Policy Analyst",
        # Domain-Specific AI Roles
        "Healthcare AI Engineer",
        "Fintech ML Engineer",
        "Climate Tech AI Specialist",
        "Biotech AI Researcher",
        "Government AI Specialist",
        "Autonomous Vehicle Engineer",
        "AI Security Engineer",
        # Full-Stack & General
        "Full-Stack Developer",
        "Software Engineer",
        "Senior Software Engineer",
        "Staff Engineer",
        "Principal Engineer",
        "Backend Engineer",
        "Frontend Engineer",
        "DevOps Engineer",
        "SRE",
        "Platform Engineer",
        "Cloud Engineer",
        "Solutions Architect",
    ]

    # Compiled patterns for performance
    _compiled_patterns: dict[str, re.Pattern] = {}

    def __init__(self, spacy_model: Optional[str] = None):
        """
        Initialize the skill extractor.

        Args:
            spacy_model: Optional spaCy model name for NER enhancement.
                        Defaults to en_core_web_sm.
        """
        self._nlp = None
        self._spacy_model = spacy_model or "en_core_web_sm"
        self._compile_patterns()
        logger.info(
            f"SkillExtractor initialized with {self._count_skills()} skill patterns"
        )

    def _count_skills(self) -> int:
        """Count total number of skill patterns."""
        return sum(len(patterns) for patterns in self.SKILL_PATTERNS.values())

    def _compile_patterns(self) -> None:
        """Compile regex patterns for efficient matching."""
        for category, patterns in self.SKILL_PATTERNS.items():
            combined = "|".join(f"({p})" for p in patterns)
            self._compiled_patterns[category] = re.compile(
                rf"\b({combined})\b",
                re.IGNORECASE,
            )

    def _load_spacy(self) -> None:
        """Lazy load spaCy model with GPU support if available."""
        if self._nlp is not None:
            return

        try:
            import spacy

            # Try to enable GPU for spaCy (requires cupy)
            try:
                spacy.prefer_gpu()
                logger.info("spaCy GPU acceleration enabled")
            except Exception as e:
                logger.info(f"spaCy GPU not available, using CPU: {e}")

            self._nlp = spacy.load(self._spacy_model)
            logger.info(f"Loaded spaCy model: {self._spacy_model}")
        except OSError:
            logger.warning(
                f"spaCy model {self._spacy_model} not found, using regex only"
            )
            self._nlp = None
        except Exception as e:
            logger.error(f"Failed to load spaCy: {e}")
            self._nlp = None

    def _normalize_skill_name(self, skill: str) -> str:
        """Normalize skill name for consistent counting."""
        normalized = skill.lower().strip()

        # Normalize common variations
        normalizations = {
            "nodejs": "node.js",
            "nextjs": "next.js",
            "nuxtjs": "nuxt.js",
            "react.js": "react",
            "reactjs": "react",
            "vue.js": "vue",
            "vuejs": "vue",
            "javascript": "javascript",
            "typescript": "typescript",
            "scikit-learn": "scikit-learn",
            "sklearn": "scikit-learn",
            "k8s": "kubernetes",
            "postgres": "postgresql",
            "mongo": "mongodb",
            "fullstack": "full-stack",
            "full stack": "full-stack",
            "machine learning": "machine-learning",
            "deep learning": "deep-learning",
            "data science": "data-science",
            "natural language processing": "nlp",
            "computer vision": "computer-vision",
            "ci/cd": "ci-cd",
            "ci cd": "ci-cd",
            "ai/ml": "ai-ml",
            "ai ml": "ai-ml",
            "gen ai": "genai",
            "gen-ai": "genai",
            "llm": "llm",
            "large language model": "llm",
            "gpt": "gpt",
            "chatgpt": "chatgpt",
        }

        # Apply normalizations
        for variation, canonical in normalizations.items():
            if variation in normalized:
                normalized = canonical
                break

        return normalized.replace(" ", "-")

    def _categorize_skill(self, skill: str) -> SkillCategory:
        """Determine the category of a skill."""
        skill_lower = skill.lower()

        # Map internal categories to SkillCategory enum
        category_map = {
            "programming": SkillCategory.PROGRAMMING,
            "ai-ml": SkillCategory.DATA_SCIENCE,
            "genai-llm": SkillCategory.DATA_SCIENCE,
            "nlp": SkillCategory.DATA_SCIENCE,
            "computer-vision": SkillCategory.DATA_SCIENCE,
            "data-science": SkillCategory.DATA_SCIENCE,
            "ml-frameworks": SkillCategory.DATA_SCIENCE,
            "mlops": SkillCategory.DEVOPS_CLOUD,
            "web-mobile": SkillCategory.WEB_MOBILE,
            "devops-cloud": SkillCategory.DEVOPS_CLOUD,
            "database": SkillCategory.DATABASE,
            "security": SkillCategory.OTHER,
            "big-data": SkillCategory.DATA_SCIENCE,
            "blockchain": SkillCategory.OTHER,
            "soft-skills": SkillCategory.SOFT_SKILLS,
            "emerging": SkillCategory.OTHER,
        }

        for category, pattern in self._compiled_patterns.items():
            if pattern.search(skill_lower):
                return category_map.get(category, SkillCategory.OTHER)

        return SkillCategory.OTHER

    def extract(
        self,
        messages: list[Message],
        min_confidence: float = 0.3,
        min_frequency: int = 1,
        max_skills: int = 100,
    ) -> list[ExtractedSkill]:
        """
        Extract skills from a list of messages using batch NLP processing.

        Args:
            messages: List of conversation messages to analyze.
            min_confidence: Minimum confidence threshold (0-1). Default 0.3.
            min_frequency: Minimum number of mentions required. Default 1.
            max_skills: Maximum number of skills to return. Default 100.

        Returns:
            List of extracted skills sorted by frequency and confidence.
        """
        logger.info(f"Extracting skills from {len(messages)} messages")

        # Filter out system messages
        user_messages = [m for m in messages if m.role != "system"]
        logger.info(f"Processing {len(user_messages)} non-system messages")

        # Track skill occurrences and sources
        skill_counts: Counter = Counter()
        skill_sources: dict[str, set[str]] = {}

        # Process messages - use spaCy if available for NER enhancement
        self._load_spacy()

        if self._nlp is not None and len(user_messages) > 0:
            # Use nlp.pipe() for efficient batch processing
            logger.info("Running spaCy NER batch processing...")
            texts = [m.content for m in user_messages]

            # Batch size for GPU efficiency - larger batches are faster
            batch_size = min(500, len(texts))
            processed = 0
            total = len(user_messages)

            for doc in self._nlp.pipe(texts, batch_size=batch_size):
                message = user_messages[processed]
                found_skills = self._extract_from_text_with_ner(message.content, doc)

                for skill in found_skills:
                    normalized = self._normalize_skill_name(skill)
                    skill_counts[normalized] += 1

                    if normalized not in skill_sources:
                        skill_sources[normalized] = set()
                    skill_sources[normalized].add(message.id)

                processed += 1

                # Log and print progress every 500 messages
                if processed % 500 == 0:
                    pct = (processed / total) * 30  # Skills is 0-30% of total
                    logger.info(f"Skills: {processed}/{total} messages ({pct:.0f}%)")
                    progress_json = json.dumps(
                        {
                            "stage": "skills",
                            "current": processed,
                            "total": total,
                            "message": f"Extracting skills: {processed}/{total}",
                            "percentage": pct,
                        }
                    )
                    print(f"PROGRESS:{progress_json}", flush=True)
                    sys.stdout.flush()

            logger.info(f"Completed processing {processed} messages")
        else:
            # Fallback to regex-only
            logger.info("Using regex-only extraction (spaCy not available)")
            for idx, message in enumerate(user_messages):
                found_skills = self._extract_from_text(message.content)

                for skill in found_skills:
                    normalized = self._normalize_skill_name(skill)
                    skill_counts[normalized] += 1

                    if normalized not in skill_sources:
                        skill_sources[normalized] = set()
                    skill_sources[normalized].add(message.id)

                if (idx + 1) % 2000 == 0:
                    logger.info(f"Processed {idx + 1}/{len(user_messages)} messages")

        # Calculate confidence based on frequency distribution
        max_freq = max(skill_counts.values()) if skill_counts else 1

        # Build skill objects
        extracted_skills: list[ExtractedSkill] = []

        for skill_name, frequency in skill_counts.most_common():
            if frequency < min_frequency:
                continue

            # Confidence is based on relative frequency
            confidence = min(1.0, (frequency / max_freq) * 0.7 + 0.3)

            if confidence < min_confidence:
                continue

            category = self._categorize_skill(skill_name)

            extracted_skills.append(
                ExtractedSkill(
                    id=str(uuid.uuid4()),
                    name=skill_name,
                    category=category,
                    frequency=frequency,
                    confidence=round(confidence, 3),
                    sources=list(skill_sources.get(skill_name, []))[
                        :10
                    ],  # Limit sources
                )
            )

            if len(extracted_skills) >= max_skills:
                break

        logger.info(
            f"Extracted {len(extracted_skills)} skills from {len(skill_counts)} unique matches"
        )
        return extracted_skills

    def _extract_from_text(self, text: str) -> list[str]:
        """Extract skill mentions from a single text string using regex."""
        found_skills: list[str] = []

        for category, pattern in self._compiled_patterns.items():
            matches = pattern.findall(text)
            for match in matches:
                # findall returns tuples with groups, get the first non-empty
                if isinstance(match, tuple):
                    skill = next((m for m in match if m), None)
                else:
                    skill = match

                if skill:
                    found_skills.append(skill)

        return found_skills

    def _extract_from_text_with_ner(self, text: str, doc) -> list[str]:
        """Extract skills from text using regex + spaCy NER."""
        found_skills = self._extract_from_text(text)

        # Enhance with spaCy NER entities
        for ent in doc.ents:
            if ent.label_ in ("ORG", "PRODUCT", "WORK_OF_ART", "GPE"):
                if self._is_likely_tech(ent.text):
                    found_skills.append(ent.text)

        return found_skills

    def _is_likely_tech(self, text: str) -> bool:
        """Heuristic to check if a named entity is likely a technology."""
        text_lower = text.lower()

        # Check against known patterns
        for pattern in self._compiled_patterns.values():
            if pattern.search(text_lower):
                return True

        # Additional tech indicators
        tech_indicators = [
            "framework",
            "library",
            "sdk",
            "api",
            "platform",
            "tool",
            "engine",
            "runtime",
            "database",
            "cloud",
            "ai",
            "ml",
            "lang",
            "js",
            "py",
            "dev",
            "ops",
            "data",
        ]

        return any(indicator in text_lower for indicator in tech_indicators)

    def get_job_titles(self) -> list[str]:
        """Return the list of AI job titles for matching."""
        return self.JOB_TITLES.copy()


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["SkillExtractor"]
