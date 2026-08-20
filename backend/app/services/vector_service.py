import os
from typing import List, Dict, Any
import chromadb
from google import genai
from app.core.config import settings


class VectorService:
    """
    Service for managing ChromaDB vector database operations
    and generating Gemini embeddings for RAG-based candidate retrieval.
    """

    def __init__(self, db_dir: str = "chroma_db"):
        os.makedirs(db_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=db_dir)
        self.collection = self.client.get_or_create_collection(
            name="candidate_resumes",
            metadata={"hnsw:space": "cosine"}
        )
        self.genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates vector embeddings using Google Gemini Embedding model.
        """
        if not text or not text.strip():
            text = "Empty document"

        response = self.genai_client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
        )
        return response.embeddings[0].values

    def index_resume(
        self,
        resume_id: int,
        candidate_name: str,
        skills: List[str],
        full_text: str
    ) -> None:
        """
        Embeds and stores candidate resume vectors and metadata into ChromaDB.
        """
        vector = self.generate_embedding(full_text)
        metadata = {
            "resume_id": resume_id,
            "candidate_name": candidate_name,
            "skills": ", ".join(skills) if skills else "",
        }
        
        self.collection.upsert(
            ids=[str(resume_id)],
            embeddings=[vector],
            metadatas=[metadata],
            documents=[full_text[:1000]]
        )

    def search_candidates(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search against candidate database using job requirements.
        """
        query_vector = self.generate_embedding(query_text)
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k
        )

        matches = []
        if results and results.get("ids") and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                distance = results["distances"][0][i] if "distances" in results else 0.0
                similarity_score = round(1.0 - distance, 4)
                
                matches.append({
                    "resume_id": int(results["ids"][0][i]),
                    "similarity_score": similarity_score,
                    "metadata": results["metadatas"][0][i],
                    "snippet": results["documents"][0][i] if "documents" in results else ""
                })
        return matches