import os
import asyncio
from dotenv import load_dotenv
from pydantic import SecretStr
from sarvam_conv_ai_sdk import (
    AsyncSamvaadAgent,
    AsyncDefaultAudioInterface,
    InteractionConfig,
    InteractionType,
)

load_dotenv()

async def main():
    config = InteractionConfig(
        org_id="019e90d2-5a2a-7d28-9d8c-cc1af5fa4cd2",
        workspace_id="019e90d2-5a54-7c98-ac08-87dfc654bfbe",
        app_id="AI-Recruite-9479a495-758f",
        user_identifier="hiregenie_test",
        user_identifier_type="phone_number",
        interaction_type=InteractionType.CALL,
        sample_rate=16000,
        agent_variables={
            "candidate_name": "Rohit Test Candidate",
            "job_title": "AI Engineer",
            "company_name": "HireGenie AI",
            "experience_level": "MID_LEVEL",
            "candidate_experience": "4 years of experience in AI and backend engineering",
            "candidate_education": "B.Tech in Information Technology",
            "candidate_skills": "Python, FastAPI, Machine Learning, LLMs, RAG, PostgreSQL",
            "candidate_projects": "AI recruitment platform using FastAPI, React, PostgreSQL and LLMs",
            "candidate_certifications": "AWS certification",
            "job_description": "Build production AI and backend systems",
            "required_skills": "Python, FastAPI, PostgreSQL, Machine Learning, LLMs, RAG",
            "preferred_skills": "AWS, Docker, WebRTC",
            "interview_difficulty": "MEDIUM",
        },
    )

    agent = AsyncSamvaadAgent(
        api_key=SecretStr(os.environ["SARVAM_API_KEY"]),
        config=config,
        audio_interface=AsyncDefaultAudioInterface(
            input_sample_rate=16000
        ),
    )

    print("Starting Sarvam agent...")
    await agent.start()
    print("Sarvam agent connected successfully.")
    await agent.wait_for_disconnect()


if __name__ == "__main__":
    asyncio.run(main())