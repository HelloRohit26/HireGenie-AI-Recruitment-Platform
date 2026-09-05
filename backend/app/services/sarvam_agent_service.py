import os
import base64
import asyncio
from typing import Dict, Any, Optional, Callable
from pydantic import SecretStr
try:
    from sarvam_conv_ai_sdk import (
        AsyncSamvaadAgent,
        InteractionConfig,
        InteractionType,
    )
    from sarvam_conv_ai_sdk.audio_interface import AsyncAudioInterface
except ImportError:
    AsyncSamvaadAgent = None
    InteractionConfig = None
    InteractionType = None
    class AsyncAudioInterface:
        pass

from app.core.config import settings
from app.core.logger import logger

class WebSocketBufferAudioInterface(AsyncAudioInterface):
    """Audio interface bridging browser WebSocket frames with Sarvam Conversational SDK."""
    def __init__(self, on_agent_audio_chunk: Callable[[bytes], Any], on_barge_in: Optional[Callable[[], Any]] = None):
        self.input_callback: Optional[Callable] = None
        self.on_agent_audio_chunk = on_agent_audio_chunk
        self.on_barge_in = on_barge_in

    async def start(self, input_callback: Optional[Callable] = None) -> None:
        self.input_callback = input_callback
        self.input_frame_count = 0

    async def stop(self) -> None:
        self.input_callback = None

    async def input(self, *args, **kwargs) -> bytes:
        return b""

    async def output(self, data: bytes, sample_rate: int = 16000, **kwargs) -> None:
        """Called by Sarvam SDK whenever the AI agent speaks a chunk of audio."""
        if self.on_agent_audio_chunk and data:
            await self.on_agent_audio_chunk(data, sample_rate)

    def interrupt(self, *args, **kwargs) -> None:
        """Triggered when Sarvam detects user speech/interruption."""
        if self.on_barge_in:
            res = self.on_barge_in()
            if asyncio.iscoroutine(res):
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(res)
                except RuntimeError:
                    asyncio.create_task(res)

    async def feed_candidate_audio(self, pcm_chunk: bytes) -> None:
        """Pushes raw PCM audio from candidate WebSocket into Sarvam agent."""
        if self.input_callback and pcm_chunk:
            try:
                self.input_frame_count += 1
                # Sarvam SDK input_callback expects (audio_bytes, frame_count)
                await self.input_callback(pcm_chunk, self.input_frame_count)
            except TypeError:
                try:
                    await self.input_callback(pcm_chunk)
                except Exception as e:
                    logger.error(f"Error feeding audio chunk to Sarvam SDK: {e}")
            except Exception as e:
                logger.error(f"Error feeding audio chunk to Sarvam SDK: {e}")

class SarvamAgentSession:
    """Manages an active Sarvam Dashboard Voice Agent session for an interview."""
    def __init__(
        self,
        candidate_info: Dict[str, Any],
        job_info: Dict[str, Any],
        on_audio_output: Callable[[bytes, int], Any],
        on_user_interrupt: Optional[Callable[[], Any]] = None
    ):
        self.api_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY", "")
        self.org_id = settings.SARVAM_ORG_ID or os.getenv("SARVAM_ORG_ID", "")
        self.workspace_id = settings.SARVAM_WORKSPACE_ID or os.getenv("SARVAM_WORKSPACE_ID", "")
        self.app_id = settings.SARVAM_APP_ID or os.getenv("SARVAM_APP_ID", "")

        self.audio_interface = WebSocketBufferAudioInterface(
            on_agent_audio_chunk=on_audio_output,
            on_barge_in=on_user_interrupt
        )

        agent_variables = {
            "candidate_name": candidate_info.get("name", "Candidate"),
            "job_title": job_info.get("title", "Software Engineer"),
            "company_name": job_info.get("company", "HireGenie AI"),
            "candidate_skills": ", ".join(candidate_info.get("skills", [])),
            "candidate_experience": f"{candidate_info.get('experience_years', 0)} years",
            "required_skills": ", ".join(job_info.get("must_have_skills", [])),
            "preferred_skills": ", ".join(job_info.get("nice_to_have_skills", [])),
            "interview_difficulty": job_info.get("interview_difficulty", "MEDIUM"),
        }

        self.config = InteractionConfig(
            org_id=self.org_id,
            workspace_id=self.workspace_id,
            app_id=self.app_id,
            user_identifier=f"candidate_{candidate_info.get('id', 'guest')}",
            user_identifier_type="phone_number",
            interaction_type=InteractionType.CALL,
            sample_rate=16000,
            agent_variables=agent_variables
        )

        self.agent = AsyncSamvaadAgent(
            api_key=SecretStr(self.api_key),
            config=self.config,
            audio_interface=self.audio_interface
        )
        self.is_running = False

    async def start(self):
        """Starts the Sarvam Conversational Agent background connection."""
        self.is_running = True
        await self.agent.start()
        logger.info(f"Sarvam Voice Agent active for app {self.app_id}")

    async def push_audio(self, audio_bytes: bytes):
        """Streams candidate audio to Sarvam."""
        if self.is_running:
            await self.audio_interface.feed_candidate_audio(audio_bytes)

    async def close(self):
        """Safely disconnects the agent session."""
        self.is_running = False
        try:
            await self.agent.disconnect()
        except Exception:
            pass