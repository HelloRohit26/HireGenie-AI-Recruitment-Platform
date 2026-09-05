import os
import io
import base64
import tempfile
from typing import Any, Optional
import requests
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.core.logger import logger


class VoiceTools:
    """
    Tools for handling LiveKit WebRTC authentication,
    Sarvam AI Speech-to-Text (STT) 'saaras:v3', and Text-to-Speech (TTS) 'bulbul:v3'.
    """

    @staticmethod
    def generate_livekit_token(room_name: str, participant_identity: str) -> str:
        """
        Generates a signed JWT token for LiveKit WebRTC voice streaming sessions.
        """
        api_key = settings.LIVEKIT_API_KEY or os.getenv("LIVEKIT_API_KEY", "")
        api_secret = settings.LIVEKIT_API_SECRET or os.getenv("LIVEKIT_API_SECRET", "")

        if not api_key or not api_secret:
            logger.warning("LiveKit API credentials missing — generating local session token.")
            api_key = api_key or "hiregenie_dev_key"
            api_secret = api_secret or "hiregenie_dev_secret"

        now = datetime.now(timezone.utc)
        payload = {
            "iss": api_key,
            "sub": participant_identity,
            "nbf": int(now.timestamp()),
            "exp": int((now + timedelta(hours=2)).timestamp()),
            "video": {
                "room": room_name,
                "roomJoin": True,
                "canPublish": True,
                "canSubscribe": True,
            },
            "name": participant_identity,
        }

        token = jwt.encode(payload, api_secret, algorithm="HS256")
        return token

    @staticmethod
    def transcribe_audio_sarvam(audio_data: Any, language_code: str = "en-IN") -> str:
        """
        Converts audio responses into text transcriptions using Sarvam AI STT (saaras:v3).
        Supports audio file path (str), raw bytes (bytes), or base64 encoded audio string.
        """
        sarvam_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY", "")
        if not sarvam_key:
            logger.warning("SARVAM_API_KEY not configured. Cannot perform Sarvam STT transcription.")
            return ""

        url = "https://api.sarvam.ai/speech-to-text"
        headers = {"api-subscription-key": sarvam_key}

        temp_path = None
        try:
            if isinstance(audio_data, str) and os.path.exists(audio_data):
                file_path = audio_data
            elif isinstance(audio_data, (bytes, bytearray)):
                temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
                temp_file.write(audio_data)
                temp_file.close()
                temp_path = temp_file.name
                file_path = temp_path
            elif isinstance(audio_data, str) and len(audio_data) > 50:
                # Assume base64 audio (strip data URI prefix if present)
                clean_b64 = audio_data.split(",", 1)[1] if "," in audio_data else audio_data
                raw_bytes = base64.b64decode(clean_b64)
                temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
                temp_file.write(raw_bytes)
                temp_file.close()
                temp_path = temp_file.name
                file_path = temp_path
            else:
                logger.error(f"Invalid audio data provided for Sarvam STT: {type(audio_data)}")
                return ""

            with open(file_path, "rb") as audio_file:
                files = {"file": (os.path.basename(file_path), audio_file, "audio/wav")}
                data = {"model": "saaras:v3", "language_code": language_code}

                response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                if response.status_code == 200:
                    transcript = response.json().get("transcript", "")
                    logger.info(f"🎙️ [Sarvam STT] Successfully transcribed audio: '{transcript}'")
                    return transcript
                else:
                    logger.error(f"Sarvam STT API error ({response.status_code}): {response.text}")
                    return ""
        except Exception as e:
            logger.error(f"Sarvam STT transcription exception: {str(e)}")
            return ""
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    @staticmethod
    def synthesize_speech_sarvam(text: str, target_language: str = "en-IN", speaker: str = None) -> dict:
        """
        Converts textual questions into voice audio response using Sarvam AI TTS (bulbul:v3).
        """
        sarvam_key = settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY", "")
        if not sarvam_key:
            logger.warning("SARVAM_API_KEY not configured. Cannot perform Sarvam TTS synthesis.")
            return {
                "status": "NOT_CONFIGURED",
                "message": "SARVAM_API_KEY not configured in backend/.env",
                "audios": []
            }

        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": sarvam_key,
            "Content-Type": "application/json"
        }
        chosen_speaker = speaker or getattr(settings, "SARVAM_TTS_SPEAKER", "anushka") or "anushka"
        if chosen_speaker == "meera":
            chosen_speaker = "anushka"
            
        payload = {
            "inputs": [text[:500]],  # Sarvam TTS limit
            "target_language_code": target_language,
            "speaker": chosen_speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": "bulbul:v3"
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                res_json = response.json()
                audios = res_json.get("audios", [])
                audio_b64 = audios[0] if audios else None
                logger.info(f"🔊 [Sarvam TTS] Successfully synthesized audio for '{text[:40]}...' ({len(audio_b64) if audio_b64 else 0} b64 chars)")
                return {
                    "status": "SUCCESS",
                    "audios": audios,
                    "audio_base64": audio_b64,
                    "audio_format": "audio/wav",
                    "voice_provider": "sarvam_ai",
                    "model": "bulbul:v3",
                    "speaker": chosen_speaker
                }
            else:
                logger.error(f"Sarvam TTS API error ({response.status_code}): {response.text}")
                return {
                    "status": "API_ERROR",
                    "error": response.text,
                    "audios": []
                }
        except Exception as e:
            logger.error(f"Sarvam TTS synthesis exception: {str(e)}")
            return {
                "status": "EXCEPTION",
                "error": str(e),
                "audios": []
            }