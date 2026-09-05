"""
Seed script to create exactly 2 real AI Engineer Fresher jobs in India (Sarvam AI & PhonePe)
and clean up legacy jobs so only 2 jobs exist in the Recruiter Portal.
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.models import Job, ScreeningQuestion, CandidateApplication, User, UserRole, InterviewMode
from app.core.skill_normalizer import SkillNormalizer

def seed_two_real_fresher_jobs():
    db = SessionLocal()
    try:
        print("Starting seed process for 2 Real AI Engineer Fresher Jobs in India...")

        # 1. Fetch or create recruiter user
        recruiter = db.query(User).filter(User.email == "hr@hiregenie.ai").first()
        if not recruiter:
            recruiter = User(
                full_name="Recruiter Admin",
                email="hr@hiregenie.ai",
                hashed_password="mockhashedpassword",
                role=UserRole.RECRUITER,
                is_active=True,
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)
            print(f"Created recruiter user: {recruiter.email} (id: {recruiter.id})")
        else:
            print(f"Found recruiter user: {recruiter.email} (id: {recruiter.id})")

        # 2. Clean up existing jobs to ensure ONLY 2 jobs exist
        existing_jobs = db.query(Job).all()
        print(f"Existing jobs in DB: {len(existing_jobs)}")
        for j in existing_jobs:
            print(f"Removing legacy job {j.id}: {j.title}")
            db.query(ScreeningQuestion).filter(ScreeningQuestion.job_id == j.id).delete()
            db.query(CandidateApplication).filter(CandidateApplication.job_id == j.id).delete()
            db.delete(j)
        db.commit()
        print("Cleared old requisitions.")

        # Job 1: Sarvam AI (Bengaluru) - Generative AI & LLMs Fresher
        sarvam_must = ["Python", "PyTorch", "Transformers", "LangChain", "FastAPI", "Vector Databases"]
        sarvam_nice = ["Docker", "vLLM", "Hugging Face", "LoRA", "Redis", "Linux"]
        sarvam_all = list(SkillNormalizer.parse_skill_collection(sarvam_must + sarvam_nice).values())

        job1 = Job(
            title="AI Engineer - Generative AI & LLMs (Fresher)",
            company="Sarvam AI",
            department="GenAI Research & Engineering",
            location="Bengaluru, Karnataka, India (Hybrid)",
            work_mode="HYBRID",
            employment_type="FULL_TIME",
            experience_level="ENTRY_LEVEL",
            min_experience=0.0,
            max_experience=1.0,
            salary_disclosed=True,
            salary_type="ANNUAL",
            currency="INR",
            min_salary=900000.0,
            max_salary=1400000.0,
            salary_range="₹9,00,000 - ₹14,00,000 / Annual",
            company_website="https://www.sarvam.ai",
            company_size="51-200 employees",
            company_description="Sarvam AI is India's premier frontier AI research lab developing foundational large language models, voice intelligence, and multimodal AI tailored specifically for Indian languages and enterprise scale.",
            description="""### About Sarvam AI
Sarvam AI is pioneering full-stack generative AI for India. We build foundational large language models, voice agents, and high-throughput inference engines tailored for India's linguistic diversity and digital infrastructure.

### Role Overview
We are looking for an ambitious, high-curiosity **AI Engineer (Fresher / Entry Level)** to join our Core GenAI team in Bengaluru. In this role, you will work alongside world-class AI researchers and systems architects to train, evaluate, and deploy state-of-the-art LLMs, fine-tuned domain adapters, and Retrieval-Augmented Generation (RAG) pipelines.

### What You Will Work On
- Develop and optimize production RAG systems utilizing vector databases (Chroma, Qdrant) and hybrid semantic search.
- Assist in pre-training, instruction fine-tuning (LoRA, QLoRA), and alignment of large language models for Indian regional languages.
- Build clean, scalable microservices and async REST APIs with FastAPI and Python for model serving.
- Implement comprehensive evaluation frameworks to measure hallucination rates, perplexity, context recall, and latency.
- Collaborate with infrastructure teams to optimize CUDA kernels, vLLM/TensorRT-LLM serving throughput, and token streaming.

### Mentorship & Growth
You will be paired with a Senior AI Scientist from Day 1, participating in weekly AI reading groups, model review teardowns, and fast-tracked engineering sprints.""",
            responsibilities="""- Write modular, test-driven Python code for data ingestion, synthetic data generation, and LLM orchestration.
- Build and evaluate RAG pipelines using LangChain, LlamaIndex, and embedding models.
- Implement automated benchmark evaluations for multilingual accuracy, toxicity, and hallucination detection.
- Deploy and monitor inference microservices using FastAPI, Docker, and Redis caching.
- Conduct error analysis and edge-case curation to systematically improve model response quality.""",
            requirements="""- Strong coding proficiency in Python with clean object-oriented and functional programming skills.
- Solid theoretical understanding of Deep Learning, Transformer architectures (Self-Attention, Positional Embeddings), and LLM fundamentals.
- Hands-on experience with PyTorch, Hugging Face Transformers, and LangChain/LlamaIndex through academic projects, internships, or open-source contributions.
- Familiarity with vector embeddings, similarity search metrics (Cosine, Dot Product), and vector databases (ChromaDB, Pinecone, or FAISS).
- Basic understanding of RESTful API development using FastAPI or Flask.
- Knowledge of Git version control and Linux environments.""",
            required_qualifications="B.Tech / B.E. / M.Tech in Computer Science, Artificial Intelligence, Data Science, or allied engineering disciplines (Batch of 2024, 2025, or 2026 with 0-1 years of relevant experience). Strong fundamentals in Data Structures, Algorithms, Linear Algebra, and Probability.",
            preferred_qualifications="Demonstrated portfolio of AI projects on GitHub or Hugging Face spaces; familiarity with quantization (BitsAndBytes, GGUF), vLLM deployment, or publications at premier student conferences.",
            status="OPEN",
            extracted_skills=sarvam_all,
            must_have_skills=list(SkillNormalizer.parse_skill_collection(sarvam_must).values()),
            nice_to_have_skills=list(SkillNormalizer.parse_skill_collection(sarvam_nice).values()),
            skill_weights={"Python": 10, "PyTorch": 9, "Transformers": 9, "LangChain": 8, "FastAPI": 7, "Vector Databases": 7, "Docker": 6},
            jd_quality_score=94.0,
            screening_enabled=True,
            education_requirements="Bachelor's or Master's degree in Computer Science, AI, or related STEM branch.",
            certifications=["DeepLearning.AI Generative AI with LLMs", "Hugging Face NLP Course Certification"],
            resume_required=True,
            target_shortlist_count=20,
            shortlist_threshold=70.0,
            max_interview_candidates=10,
            auto_shortlist=True,
            interview_mode=InterviewMode.WEBRTC,
            interview_duration_minutes=20,
            technical_topics=["Python Data Structures & Concurrency", "Transformer Attention & Embeddings", "RAG Pipeline Architecture", "Prompt Engineering & Evaluation", "API Design with FastAPI"],
            behavioral_topics=["Engineering Curiosity & Research Mindset", "Ownership & Problem Solving", "Constructive Feedback & Code Reviews"],
            interview_difficulty="MEDIUM",
            interview_rubric={
                "Core Python & Coding": 30.0,
                "Transformers & GenAI Concepts": 30.0,
                "System Design & APIs": 25.0,
                "Communication & Role Alignment": 15.0
            },
            created_by=recruiter.id
        )
        db.add(job1)
        db.commit()
        db.refresh(job1)

        # Questions for Job 1
        q1_1 = ScreeningQuestion(
            job_id=job1.id,
            question_text="Explain the mechanism of Multi-Head Self-Attention in Transformers and why queries, keys, and values are projected into multiple subspaces.",
            category="Technical Architecture",
            weight=1.5,
            is_required=True
        )
        q1_2 = ScreeningQuestion(
            job_id=job1.id,
            question_text="Describe a project or experiment where you implemented a RAG system or fine-tuned an open-weights model like Llama, Mistral, or Gemma.",
            category="Practical Experience",
            weight=1.2,
            is_required=True
        )
        q1_3 = ScreeningQuestion(
            job_id=job1.id,
            question_text="How do you minimize latency and control hallucination when streaming model responses to an end-user client application?",
            category="System Design & Performance",
            weight=1.0,
            is_required=True
        )
        db.add_all([q1_1, q1_2, q1_3])
        db.commit()
        print(f"Created Job 1: {job1.title} at {job1.company} (ID: {job1.id})")

        # Job 2: PhonePe (Bengaluru / Pune) - Graduate Machine Learning Engineer Fresher
        phonepe_must = ["Python", "Machine Learning", "PyTorch", "SQL", "Scikit-Learn", "Feature Engineering"]
        phonepe_nice = ["XGBoost", "Docker", "ONNX", "Spark", "Git", "Computer Vision"]
        phonepe_all = list(SkillNormalizer.parse_skill_collection(phonepe_must + phonepe_nice).values())

        job2 = Job(
            title="Graduate Machine Learning Engineer - Applied AI (Fresher)",
            company="PhonePe",
            department="Merchant & Fraud Intelligence AI",
            location="Bengaluru / Pune, India (Hybrid)",
            work_mode="HYBRID",
            employment_type="FULL_TIME",
            experience_level="ENTRY_LEVEL",
            min_experience=0.0,
            max_experience=1.0,
            salary_disclosed=True,
            salary_type="ANNUAL",
            currency="INR",
            min_salary=1000000.0,
            max_salary=1600000.0,
            salary_range="₹10,00,000 - ₹16,00,000 / Annual",
            company_website="https://www.phonepe.com",
            company_size="5000+ employees",
            company_description="PhonePe is India's leading digital payments and financial technology platform processing over 250 million daily transactions, powered by real-time ML inference and autonomous AI fraud prevention systems.",
            description="""### About PhonePe AI & Data Platform
PhonePe powers the financial lives of over 550 million registered Indians. Our Applied AI and Machine Learning engineering groups design ultra-low latency real-time models that evaluate risk, detect transaction fraud, automate document OCR verification, and personalize merchant experiences at immense national scale.

### Role Overview
We are looking for bright, mathematically rigorous **Graduate Machine Learning Engineers (Fresher - 2024/2025/2026 Batch)** to join our Applied AI and Intelligent Decisioning platform team based in Bengaluru / Pune.

### What You Will Work On
- Build and train production predictive ML and deep learning models for credit underwriting, fraud anomaly detection, and automated KYC vision processing.
- Design real-time feature engineering pipelines using SQL, Python, Spark, and Redis feature stores.
- Convert prototype PyTorch and Scikit-Learn models into optimized ONNX/TensorRT inference runtimes with sub-15ms p99 latency SLAs.
- Run continuous A/B testing and model drift monitoring across massive production transaction streams.
- Collaborate with senior staff ML engineers to research state-of-the-art graph neural networks (GNNs) and multimodal vision models.

### What Makes This Role Unique
You will directly impact transactions valued at trillions of Indian Rupees, deploying code that operates at national scale with rigorous automated monitoring and zero-downtime deployments.""",
            responsibilities="""- Develop, evaluate, and benchmark tabular, NLP, and vision models using PyTorch, XGBoost, and Scikit-Learn.
- Write high-performance data processing scripts and SQL analytical queries for feature extraction.
- Implement automated CI/CD unit and integration tests for ML model pipelines and validation checks.
- Monitor model performance in production, tracking precision-recall curves, PSI (population stability index), and feature drift.
- Participate in design discussions, sprint planning, and architectural reviews with senior ML leads.""",
            requirements="""- Bachelor's or Master's degree in Computer Science, Data Science, Mathematics, Electrical Engineering, or related technical field (Fresh graduates welcome).
- Strong command of Python and scientific computing libraries (NumPy, Pandas, Scikit-Learn, SciPy).
- Good understanding of Machine Learning algorithms (Gradient Boosted Trees, Random Forests, Logistic Regression, CNNs, LSTMs/Transformers).
- Solid mathematical foundations in Linear Algebra, Multivariate Calculus, Probability, and Hypothesis Testing.
- Proficiency in SQL for complex data manipulation, aggregation, and feature extraction.
- Understanding of software engineering principles: clean code, modular design, Git, and automated testing.""",
            required_qualifications="B.Tech / B.E. / M.Tech / M.Sc in CS, AI, Statistics, or Data Science (2024, 2025, or 2026 graduating batch, 0-1 years experience). Minimum 7.5 CGPA or equivalent academic track record with strong analytical problem-solving skills.",
            preferred_qualifications="Competitive programming exposure (LeetCode, Codeforces) or high ranking in Kaggle competitions. Hands-on experience with ONNX, Docker, or distributed computing frameworks like Apache Spark.",
            status="OPEN",
            extracted_skills=phonepe_all,
            must_have_skills=list(SkillNormalizer.parse_skill_collection(phonepe_must).values()),
            nice_to_have_skills=list(SkillNormalizer.parse_skill_collection(phonepe_nice).values()),
            skill_weights={"Python": 10, "Machine Learning": 10, "PyTorch": 9, "SQL": 8, "Scikit-Learn": 8, "Feature Engineering": 7, "Docker": 6},
            jd_quality_score=95.0,
            screening_enabled=True,
            education_requirements="B.Tech/M.Tech in CS/IT/AI/Data Science or allied branches.",
            certifications=["Coursera Machine Learning Specialization (Andrew Ng)", "AWS Certified Machine Learning"],
            resume_required=True,
            target_shortlist_count=25,
            shortlist_threshold=72.0,
            max_interview_candidates=12,
            auto_shortlist=True,
            interview_mode=InterviewMode.WEBRTC,
            interview_duration_minutes=20,
            technical_topics=["Python & Algorithmic Complexity", "Supervised Learning & Loss Functions", "Feature Engineering & Handling Imbalanced Data", "Model Evaluation Metrics (ROC-AUC, F1, Precision/Recall)", "SQL Joins & Aggregations"],
            behavioral_topics=["Analytical Rigor & Data-Driven Mindset", "Handling Deadlines & Ambiguity", "Collaborative Problem Solving"],
            interview_difficulty="MEDIUM",
            interview_rubric={
                "ML Fundamentals & Math": 35.0,
                "Python & Problem Solving": 30.0,
                "SQL & Data Handling": 20.0,
                "Communication & Team Fit": 15.0
            },
            created_by=recruiter.id
        )
        db.add(job2)
        db.commit()
        db.refresh(job2)

        # Questions for Job 2
        q2_1 = ScreeningQuestion(
            job_id=job2.id,
            question_text="How would you handle severe class imbalance (e.g. 99.8% non-fraud vs 0.2% fraud transactions) during model training and evaluation?",
            category="ML Methodology",
            weight=1.5,
            is_required=True
        )
        q2_2 = ScreeningQuestion(
            job_id=job2.id,
            question_text="Explain the mathematical difference between L1 (Lasso) and L2 (Ridge) regularization and how they influence feature coefficients.",
            category="Mathematical Foundations",
            weight=1.2,
            is_required=True
        )
        q2_3 = ScreeningQuestion(
            job_id=job2.id,
            question_text="Describe an ML model or data analysis pipeline you built, explaining how you validated your features and prevented data leakage.",
            category="Practical Experience",
            weight=1.2,
            is_required=True
        )
        db.add_all([q2_1, q2_2, q2_3])
        db.commit()
        print(f"Created Job 2: {job2.title} at {job2.company} (ID: {job2.id})")

        # Verify final count
        final_jobs = db.query(Job).all()
        print(f"\nVerification: Total jobs now in DB: {len(final_jobs)}")
        for idx, j in enumerate(final_jobs, start=1):
            sal = j.salary_range.encode('ascii', 'replace').decode('ascii') if j.salary_range else ''
            print(f"  Job #{idx}: '{j.title}' at {j.company} | Location: {j.location} | Exp: {j.experience_level} ({j.min_experience}-{j.max_experience} yrs) | Salary: {sal} | Status: {j.status}")

        assert len(final_jobs) == 2, f"Expected exactly 2 jobs, found {len(final_jobs)}"
        print("\nSUCCESS: Exactly 2 Real AI Engineer Fresher Jobs configured in India!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_two_real_fresher_jobs()
