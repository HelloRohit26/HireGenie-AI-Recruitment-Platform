"""HireGenie AI — Canonical Skill Normalization & Requirement Extraction Engine.
Guarantees consistent, deduplicated canonical skill matching with strict disjoint invariants (matched ∩ missing == ∅).
"""
import re
from typing import List, Set, Dict, Tuple, Any

# Canonical Skill Taxonomy mapping variations & aliases to (canonical_id, display_name)
TAXONOMY_MAP: Dict[str, Tuple[str, str]] = {
    # Languages
    "python": ("python", "Python"),
    "python3": ("python", "Python"),
    "python 3": ("python", "Python"),
    "sql": ("sql", "SQL"),
    "structured query language": ("sql", "SQL"),
    "javascript": ("javascript", "JavaScript"),
    "js": ("javascript", "JavaScript"),
    "typescript": ("typescript", "TypeScript"),
    "ts": ("typescript", "TypeScript"),
    "java": ("java", "Java"),
    "c++": ("cpp", "C++"),
    "cpp": ("cpp", "C++"),
    "c#": ("csharp", "C#"),
    "csharp": ("csharp", "C#"),
    "golang": ("golang", "Go"),
    "go": ("golang", "Go"),
    "rust": ("rust", "Rust"),
    "scala": ("scala", "Scala"),
    "r": ("r", "R"),
    "bash": ("bash", "Bash"),
    "shell": ("bash", "Bash"),

    # Backend / APIs
    "fastapi": ("fastapi", "FastAPI"),
    "fast api": ("fastapi", "FastAPI"),
    "fast-api": ("fastapi", "FastAPI"),
    "flask": ("flask", "Flask"),
    "django": ("django", "Django"),
    "rest api": ("rest_api", "REST APIs"),
    "rest apis": ("rest_api", "REST APIs"),
    "restful api": ("rest_api", "REST APIs"),
    "restful apis": ("rest_api", "REST APIs"),
    "graphql": ("graphql", "GraphQL"),
    "node.js": ("nodejs", "Node.js"),
    "nodejs": ("nodejs", "Node.js"),
    "express": ("express", "Express.js"),
    "express.js": ("express", "Express.js"),
    "spring boot": ("springboot", "Spring Boot"),
    "spring": ("springboot", "Spring Boot"),

    # AI / ML / GenAI
    "machine learning": ("machine_learning", "Machine Learning"),
    "ml": ("machine_learning", "Machine Learning"),
    "deep learning": ("deep_learning", "Deep Learning"),
    "dl": ("deep_learning", "Deep Learning"),
    "large language models": ("llm", "LLMs"),
    "large language model": ("llm", "LLMs"),
    "llm": ("llm", "LLMs"),
    "llms": ("llm", "LLMs"),
    "genai": ("llm", "LLMs"),
    "gen ai": ("llm", "LLMs"),
    "generative ai": ("llm", "LLMs"),
    "rag": ("rag", "RAG"),
    "rag pipelines": ("rag", "RAG"),
    "rag pipeline": ("rag", "RAG"),
    "retrieval augmented generation": ("rag", "RAG"),
    "retrieval-augmented generation": ("rag", "RAG"),
    "langchain": ("langchain", "LangChain"),
    "llamaindex": ("llamaindex", "LlamaIndex"),
    "llama index": ("llamaindex", "LlamaIndex"),
    "pytorch": ("pytorch", "PyTorch"),
    "torch": ("pytorch", "PyTorch"),
    "tensorflow": ("tensorflow", "TensorFlow"),
    "tf": ("tensorflow", "TensorFlow"),
    "keras": ("keras", "Keras"),
    "scikit-learn": ("scikit_learn", "scikit-learn"),
    "sklearn": ("scikit_learn", "scikit-learn"),
    "vector search": ("vector_search", "Vector Search"),
    "vector embeddings": ("vector_search", "Vector Search"),
    "embeddings": ("vector_search", "Vector Search"),
    "prompt engineering": ("prompt_engineering", "Prompt Engineering"),
    "nlp": ("nlp", "NLP"),
    "natural language processing": ("nlp", "NLP"),
    "hugging face": ("huggingface", "Hugging Face"),
    "huggingface": ("huggingface", "Hugging Face"),
    "transformers": ("transformers", "Transformers"),

    # Vector Databases
    "chromadb": ("chromadb", "ChromaDB"),
    "chroma db": ("chromadb", "ChromaDB"),
    "chroma": ("chromadb", "ChromaDB"),
    "pinecone": ("pinecone", "Pinecone"),
    "milvus": ("milvus", "Milvus"),
    "qdrant": ("qdrant", "Qdrant"),
    "weaviate": ("weaviate", "Weaviate"),
    "faiss": ("faiss", "FAISS"),

    # Databases & Big Data
    "postgresql": ("postgresql", "PostgreSQL"),
    "postgres": ("postgresql", "PostgreSQL"),
    "psql": ("postgresql", "PostgreSQL"),
    "mysql": ("mysql", "MySQL"),
    "mongodb": ("mongodb", "MongoDB"),
    "mongo": ("mongodb", "MongoDB"),
    "redis": ("redis", "Redis"),
    "sqlite": ("sqlite", "SQLite"),
    "snowflake": ("snowflake", "Snowflake"),
    "kafka": ("kafka", "Kafka"),
    "apache kafka": ("kafka", "Kafka"),
    "airflow": ("airflow", "Airflow"),
    "apache airflow": ("airflow", "Airflow"),
    "elasticsearch": ("elasticsearch", "Elasticsearch"),

    # Cloud, DevOps & MLOps
    "aws": ("aws", "AWS"),
    "amazon web services": ("aws", "AWS"),
    "azure": ("azure", "Azure"),
    "gcp": ("gcp", "GCP"),
    "google cloud": ("gcp", "GCP"),
    "docker": ("docker", "Docker"),
    "dockerized": ("docker", "Docker"),
    "kubernetes": ("kubernetes", "Kubernetes"),
    "k8s": ("kubernetes", "Kubernetes"),
    "git": ("git", "Git"),
    "github": ("git", "Git"),
    "github actions": ("ci_cd", "CI/CD"),
    "ci/cd": ("ci_cd", "CI/CD"),
    "cicd": ("ci_cd", "CI/CD"),
    "mlflow": ("mlflow", "MLflow"),
    "linux": ("linux", "Linux"),

    # Frontend / UI
    "react": ("react", "React"),
    "react.js": ("react", "React"),
    "reactjs": ("react", "React"),
    "next.js": ("nextjs", "Next.js"),
    "nextjs": ("nextjs", "Next.js"),
    "streamlit": ("streamlit", "Streamlit"),
    "html": ("html", "HTML"),
    "css": ("css", "CSS"),
    "tailwind": ("tailwind", "Tailwind CSS"),
    "tailwind css": ("tailwind", "Tailwind CSS"),

    # Real-Time Voice & WebRTC
    "webrtc": ("webrtc", "WebRTC"),
    "livekit": ("livekit", "LiveKit"),
    "websockets": ("websocket", "WebSocket"),
    "websocket": ("websocket", "WebSocket"),
    "socket.io": ("websocket", "WebSocket"),
}

# Regex patterns for high-priority multi-word or standalone tokens
SKILL_PATTERNS: List[Tuple[str, str, str]] = [
    (r'\bfast[\s\-]?api\b', "fastapi", "FastAPI"),
    (r'\bpostgre(?:sql)?\b|\bpsql\b', "postgresql", "PostgreSQL"),
    (r'\brag(?:\s+pipelines?)?\b|\bretrieval[\s\-]augmented\s+generation\b', "rag", "RAG"),
    (r'\blarge\s+language\s+models?\b|\bllms?\b|\bgen[\s\-]?ai\b|\bgenerative\s+ai\b', "llm", "LLMs"),
    (r'\bmachine\s+learning\b|\bml\b', "machine_learning", "Machine Learning"),
    (r'\bdeep\s+learning\b|\bdl\b', "deep_learning", "Deep Learning"),
    (r'\blangchain\b', "langchain", "LangChain"),
    (r'\bvector\s+(?:search|embeddings?)\b|\bembeddings?\b', "vector_search", "Vector Search"),
    (r'\bchroma(?:db)?\b', "chromadb", "ChromaDB"),
    (r'\bpinecone\b', "pinecone", "Pinecone"),
    (r'\bpytorch\b|\btorch\b', "pytorch", "PyTorch"),
    (r'\btensorflow\b', "tensorflow", "TensorFlow"),
    (r'\b(apache\s+)?kafka\b', "kafka", "Kafka"),
    (r'\b(apache\s+)?airflow\b', "airflow", "Airflow"),
    (r'\bsnowflake\b', "snowflake", "Snowflake"),
    (r'\bmlflow\b', "mlflow", "MLflow"),
    (r'\bstreamlit\b', "streamlit", "Streamlit"),
    (r'\bdocker(?:ized)?\b', "docker", "Docker"),
    (r'\bkubernetes\b|\bk8s\b', "kubernetes", "Kubernetes"),
    (r'\bgithub\s+actions\b|\bci[\s\-/]?cd\b', "ci_cd", "CI/CD"),
    (r'\bgit\b', "git", "Git"),
    (r'\baws\b|\bamazon\s+web\s+services\b', "aws", "AWS"),
    (r'\bpython(?:\s*3)?\b', "python", "Python"),
    (r'\bsql\b', "sql", "SQL"),
    (r'\breact(?:\.js|js)?\b', "react", "React"),
    (r'\bwebrtc\b', "webrtc", "WebRTC"),
    (r'\blivekit\b', "livekit", "LiveKit"),
    (r'\bwebsockets?\b', "websocket", "WebSocket"),
    (r'\bnode(?:\.js|js)?\b', "nodejs", "Node.js"),
    (r'\btypescript\b|\bts\b', "typescript", "TypeScript"),
    (r'\bjavascript\b|\bjs\b', "javascript", "JavaScript"),
    (r'\bmongodb\b|\bmongo\b', "mongodb", "MongoDB"),
    (r'\bredis\b', "redis", "Redis"),
    (r'\bprompt\s+engineering\b', "prompt_engineering", "Prompt Engineering"),
    (r'\bscikit[\s\-]learn\b|\bsklearn\b', "scikit_learn", "scikit-learn"),
    (r'\bhugging\s*face\b', "huggingface", "Hugging Face"),
    (r'\btransformers\b', "transformers", "Transformers"),
    (r'\bflask\b', "flask", "Flask"),
    (r'\bdjango\b', "django", "Django"),
    (r'\bgraphql\b', "graphql", "GraphQL"),
    (r'\brest(?:ful)?\s+apis?\b|\brest\b', "rest_api", "REST APIs"),
]


class SkillNormalizer:
    """Canonical skill normalizer and requirement extractor."""

    @staticmethod
    def normalize_token(token: str) -> Tuple[str, str]:
        """Maps a raw token string to (canonical_id, display_name)."""
        cleaned = re.sub(r'[^a-zA-Z0-9\+\#\.\-\s]', '', token).strip().lower()
        if not cleaned:
            return ("", "")

        if cleaned in TAXONOMY_MAP:
            return TAXONOMY_MAP[cleaned]

        # Check regex patterns
        for pattern, canon_id, display in SKILL_PATTERNS:
            if re.fullmatch(pattern, cleaned, re.IGNORECASE) or re.search(r'^' + pattern + r'$', cleaned, re.IGNORECASE):
                return (canon_id, display)

        # Fallback: cleaned token formatted as Title
        canon_id = re.sub(r'[\s\-]+', '_', cleaned)
        display = token.strip()
        if len(display) <= 4:
            display = display.upper()
        else:
            display = display.title()
        return (canon_id, display)

    @staticmethod
    def extract_skills_from_text(text: str) -> Dict[str, str]:
        """Extracts all recognized skills from arbitrary text, returning {canonical_id: display_name}."""
        if not text:
            return {}

        found: Dict[str, str] = {}
        lowered = text.lower()

        # 1. Match taxonomy regex patterns against the full text
        for pattern, canon_id, display in SKILL_PATTERNS:
            if re.search(pattern, lowered, re.IGNORECASE):
                found[canon_id] = display

        # 2. Check explicitly comma/bullet-separated skill lists
        lines = re.split(r'[\n\r,;•|·/]', text)
        for chunk in lines:
            chunk = chunk.strip()
            if chunk and len(chunk) < 40:
                cid, disp = SkillNormalizer.normalize_token(chunk)
                if cid and cid in TAXONOMY_MAP.values():
                    found[cid] = disp

        return found

    @staticmethod
    def parse_skill_collection(skills: Any) -> Dict[str, str]:
        """Parses a skill collection (list, set, comma-separated string, JSON) into {canonical_id: display_name}."""
        if not skills:
            return {}

        items: List[str] = []
        if isinstance(skills, str):
            # Split comma, semicolon, newline, pipe, bullet
            items = re.split(r'[,;\n\r•|·]', skills)
        elif isinstance(skills, (list, set, tuple)):
            for el in skills:
                if isinstance(el, str):
                    # Elements might themselves be comma-separated like "Python, FastAPI, SQL"
                    sub_items = re.split(r'[,;\n\r•|·]', el)
                    items.extend(sub_items)
                elif isinstance(el, dict) and "name" in el:
                    items.append(str(el["name"]))
                else:
                    items.append(str(el))
        else:
            items = [str(skills)]

        result: Dict[str, str] = {}
        for item in items:
            cleaned = item.strip()
            if not cleaned:
                continue

            # First extract known skills from this chunk (handles multi-skill strings)
            extracted = SkillNormalizer.extract_skills_from_text(cleaned)
            if extracted:
                result.update(extracted)
            else:
                cid, disp = SkillNormalizer.normalize_token(cleaned)
                if cid:
                    result[cid] = disp

        return result

    @classmethod
    def match_skills(
        cls,
        required_input: Any,
        candidate_input: Any,
        candidate_raw_text: str = ""
    ) -> Dict[str, Any]:
        """Performs robust, disjoint canonical skill matching.
        Guarantees: matched ∩ missing == ∅.
        """
        # Parse required skills map: {canonical_id: display_name}
        required_map = cls.parse_skill_collection(required_input)
        
        # Parse candidate skills from parsed skills + raw resume text
        candidate_map = cls.parse_skill_collection(candidate_input)
        if candidate_raw_text:
            text_extracted = cls.extract_skills_from_text(candidate_raw_text)
            candidate_map.update(text_extracted)

        req_ids: Set[str] = set(required_map.keys())
        cand_ids: Set[str] = set(candidate_map.keys())

        # Exact canonical intersection
        matched_ids: Set[str] = req_ids.intersection(cand_ids)
        # Strict set difference
        missing_ids: Set[str] = req_ids - matched_ids

        # RIGID INVARIANT CHECK
        assert len(matched_ids.intersection(missing_ids)) == 0, (
            f"INVARIANT VIOLATION: Matched and Missing sets overlap! Overlap: {matched_ids & missing_ids}"
        )

        matched_skills: List[str] = sorted([required_map[cid] for cid in matched_ids])
        missing_skills: List[str] = sorted([required_map[cid] for cid in missing_ids])

        # Partial / Semantic matches (candidate skills not strictly in required list, but relevant)
        partial_matches: List[str] = sorted([
            candidate_map[cid] for cid in cand_ids
            if cid not in req_ids and cid not in matched_ids
        ])

        # Ratio and score
        match_ratio = len(matched_ids) / max(1, len(req_ids))
        skill_score = round(min(100.0, max(0.0, match_ratio * 100.0)), 1)

        return {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "partial_matches": partial_matches[:10],
            "matched_count": len(matched_skills),
            "missing_count": len(missing_skills),
            "total_required": len(req_ids),
            "skill_score": skill_score,
            "matched_ids": list(matched_ids),
            "missing_ids": list(missing_ids)
        }
