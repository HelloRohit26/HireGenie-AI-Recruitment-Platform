from app.graph.builder import graph

state = {
    "resume_path": "uploads/resumes/resume.pdf",
    "job_description": """
Looking for an AI Engineer with Python,
FastAPI,
LangChain,
Docker,
AWS,
SQL,
2 years experience.
"""
}

result = graph.invoke(state)

print(result["decision"])