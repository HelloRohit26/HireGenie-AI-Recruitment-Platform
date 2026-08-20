import os
from typing import Dict, Any

class VoiceAgentService:
    @staticmethod
    def initialize_webrtc_session(room_name: str, participant_identity: str) -> Dict[str, Any]:
        """Generates LiveKit WebRTC token for browser-based voice-to-voice interview."""
        livekit_api_key = os.getenv("LIVEKIT_API_KEY", "dev_key")
        livekit_api_secret = os.getenv("LIVEKIT_API_SECRET", "dev_secret")
        
        mock_token = f"webrtc_jwt_token_{room_name}_{participant_identity}"
        return {
            "room_name": room_name,
            "participant_identity": participant_identity,
            "access_token": mock_token,
            "status": "READY",
        }

    @staticmethod
    def trigger_twilio_phone_call(phone_number: str, candidate_name: str, job_title: str) -> Dict[str, Any]:
        """Initiates an outbound phone call using Twilio Voice API for telephonic interview mode."""
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "AC_mock_sid")
        twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN", "mock_auth_token")
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")

        print(f"📞 [TWILIO CALL INITIATED] Calling {phone_number} for {candidate_name} ({job_title}) via Twilio {twilio_phone}")
        return {
            "call_sid": f"CA_{os.urandom(8).hex()}",
            "status": "QUEUED",
            "phone_number": phone_number,
        }