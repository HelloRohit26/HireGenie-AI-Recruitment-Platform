import os
import asyncio
from dotenv import load_dotenv
from pydantic import SecretStr
from typing import Optional, Callable
from sarvam_conv_ai_sdk import (
    AsyncSamvaadAgent,
    InteractionConfig,
    InteractionType,
)
from sarvam_conv_ai_sdk.audio_interface import AsyncAudioInterface

load_dotenv()

class ServerBufferAudioInterface(AsyncAudioInterface):
    """Custom in-memory audio interface for web server / WebSocket streaming."""
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.input_callback: Optional[Callable] = None
        self.output_queue: asyncio.Queue = asyncio.Queue()

    async def start(self, input_callback: Optional[Callable] = None) -> None:
        self.input_callback = input_callback

    async def stop(self) -> None:
        self.input_callback = None

    async def input(self, *args, **kwargs) -> bytes:
        return b""

    async def output(self, data: bytes, sample_rate: int = 16000, **kwargs) -> None:
        """Receives synthesized voice audio from Sarvam."""
        await self.output_queue.put(data)

    def interrupt(self, *args, **kwargs) -> None:
        """Clears buffer on user barge-in."""
        while not self.output_queue.empty():
            try:
                self.output_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

async def main():
    api_key = os.getenv("SARVAM_API_KEY")
    org_id = os.getenv("SARVAM_ORG_ID")
    workspace_id = os.getenv("SARVAM_WORKSPACE_ID")
    app_id = os.getenv("SARVAM_APP_ID")

    print(f"Testing Sarvam Agent with App ID: {app_id} | Org: {org_id}")

    config = InteractionConfig(
        org_id=org_id,
        workspace_id=workspace_id,
        app_id=app_id,
        user_identifier="hiregenie_test_user",
        user_identifier_type="phone_number",
        interaction_type=InteractionType.CALL,
        sample_rate=16000,
        agent_variables={
            "candidate_name": "Test Candidate",
            "job_title": "AI Engineer",
            "company_name": "HireGenie AI",
            "candidate_skills": "Python, FastAPI, Machine Learning, LLMs",
        }
    )

    agent = AsyncSamvaadAgent(
        api_key=SecretStr(api_key),
        config=config,
        audio_interface=ServerBufferAudioInterface(sample_rate=16000)
    )

    print("Connecting to Sarvam Conversational Agent API...")
    try:
        await agent.start()
        print(" Sarvam Voice Agent connected and running with zero errors!")
        await asyncio.sleep(2)
    except Exception as e:
        print(f" Connection failed: {e}")
    finally:
        try:
            await agent.disconnect()
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(main())