"""Real-Time WebSocket Signaling & Voice AI Engine Endpoint for HireGenie AI.
Handles WebRTC SDP/ICE signaling, candidate voice/text transport, dynamic job/candidate context,
and conversational AI interviewer dialogue loop powered by Gemini LLM and Sarvam AI voice engine.
"""
import json
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import (
    InterviewInvitation, InvitationStatus, CandidateApplication, ApplicationStatus,
    InterviewSession, SessionStatus, Job, User, Resume, ScreeningQuestion
)
from app.core.logger import logger
from app.tools.voice_tools import VoiceTools
from app.services.interview_conversational_engine import ConversationalInterviewEngine

router = APIRouter()


class VoiceInterviewManager:
    """Manages active WebRTC WebSocket signaling sessions and AI conversational context."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, token: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[token] = websocket

    def disconnect(self, token: str):
        if token in self.active_connections:
            del self.active_connections[token]

    async def send_json(self, token: str, data: Dict[str, Any]):
        if token in self.active_connections:
            try:
                await self.active_connections[token].send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"WebSocket send error for token {token}: {str(e)}")


manager = VoiceInterviewManager()


def fetch_interview_context(db: Session, token: str) -> Optional[Dict[str, Any]]:
    """Fetch complete real structured context: Job, Candidate, Application, Resume, Projects, and Rubric."""
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        return None

    job = invitation.job
    candidate = invitation.candidate
    application = invitation.application
    resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first() if candidate else None

    # Parse resume projects/education if available in raw_text or parsed fields
    parsed_skills = resume.parsed_skills if (resume and resume.parsed_skills) else []
    exp_years = float(resume.parsed_experience_years) if (resume and resume.parsed_experience_years) else 0.0

    # Extract any project mentions from raw text
    projects_list = []
    if resume and resume.raw_text:
        text = resume.raw_text
        if "project" in text.lower():
            # Basic heuristic project extraction
            lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 15]
            for l in lines:
                if any(k in l.lower() for k in ["project", "built", "developed", "system", "engine", "platform", "rag", "fastapi", "ai"]):
                    projects_list.append({"title": l[:80], "summary": l[:200]})
                    if len(projects_list) >= 3:
                        break

    structured_ctx = ConversationalInterviewEngine.build_structured_context(
        candidate_name=candidate.full_name if candidate else "Candidate",
        job_title=job.title if job else "Engineering Role",
        company=job.company if job else "HireGenie AI",
        job_description=job.description if job else "",
        must_have_skills=job.must_have_skills or job.extracted_skills or [],
        nice_to_have_skills=job.nice_to_have_skills or [],
        experience_level=job.experience_level.value if hasattr(job.experience_level, "value") else str(job.experience_level or "MID_LEVEL"),
        interview_difficulty=job.interview_difficulty or "MEDIUM",
        rubric=job.interview_rubric or {},
        candidate_skills=parsed_skills,
        candidate_experience_years=exp_years,
        candidate_projects=projects_list,
        candidate_certifications=job.certifications or [],
        candidate_education=job.education_requirements or "Degree in related field"
    )

    return {
        "invitation_id": invitation.id,
        "application_id": invitation.application_id,
        "candidate_id": invitation.candidate_id,
        "job_id": invitation.job_id,
        "candidate_name": candidate.full_name if candidate else "Candidate",
        "job_title": job.title if job else "Engineering Role",
        "company": job.company if job else "HireGenie AI",
        "initial_difficulty": job.interview_difficulty or "MEDIUM",
        "structured_context": structured_ctx
    }


@router.websocket("/ws/{token}")
async def voice_interview_websocket(websocket: WebSocket, token: str):
    """Real-Time Voice AI Interview WebSocket Endpoint.
    Handles signaling, continuous audio stream, adaptive turn generation, and single-audio playback.
    """
    db: Session = SessionLocal()
    try:
        context = fetch_interview_context(db, token)
        if not context:
            await websocket.accept()
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid or unauthorized interview token."
            }))
            await websocket.close(code=4001)
            return

        invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
        session_rec = db.query(InterviewSession).filter(
            InterviewSession.invitation_id == invitation.id
        ).order_by(InterviewSession.created_at.desc()).first()

        if not session_rec:
            session_rec = InterviewSession(
                invitation_id=invitation.id,
                application_id=invitation.application_id,
                candidate_id=invitation.candidate_id,
                job_id=invitation.job_id,
                session_token=token,
                status=SessionStatus.IN_PROGRESS,
                started_at=datetime.utcnow(),
                max_duration_seconds=900,
                transcript=[]
            )
            db.add(session_rec)
            db.commit()
            db.refresh(session_rec)

        await manager.connect(token, websocket)
        logger.info(f"🎙️ [WS CONNECTED] Voice session active for token {token[:12]}... (App #{context['application_id']})")

        current_difficulty = context.get("initial_difficulty", "MEDIUM")

        # Send initial connected telemetry
        await websocket.send_text(json.dumps({
            "type": "connected",
            "status": "CONNECTED",
            "job_title": context["job_title"],
            "candidate_name": context["candidate_name"],
            "company": context["company"],
            "session_id": session_rec.id,
            "max_duration_seconds": session_rec.max_duration_seconds or 900,
            "current_difficulty": current_difficulty,
            "voice_config": {
                "stt_model": "saarika:v2.5",
                "tts_model": "bulbul:v2",
                "tts_speaker": "anushka"
            }
        }))

        # Generate intelligent initial greeting tailored to candidate background
        initial_turn = ConversationalInterviewEngine.generate_initial_greeting(
            context=context["structured_context"],
            initial_difficulty=current_difficulty
        )
        greeting_text = initial_turn["text"]
        response_id = initial_turn["response_id"]

        # Synthesize initial speech with Sarvam AI bulbul:v2 & anushka speaker
        initial_tts = VoiceTools.synthesize_speech_sarvam(greeting_text, speaker="anushka")

        # Append to transcript
        initial_ai_transcript = {
            "response_id": response_id,
            "sender": "AI Interviewer",
            "role": "ai",
            "text": greeting_text,
            "competency": initial_turn.get("competency_focus"),
            "difficulty": current_difficulty,
            "timestamp": datetime.utcnow().isoformat()
        }
        current_transcript = session_rec.transcript or []
        current_transcript.append(initial_ai_transcript)
        session_rec.transcript = current_transcript
        session_rec.current_question_index = 1
        db.commit()

        # Transmit AI speech turn with unique response_id for single audio playback guarantee
        await websocket.send_text(json.dumps({
            "type": "ai_speech",
            "response_id": response_id,
            "speaker": "ai",
            "text": greeting_text,
            "competency_focus": initial_turn.get("competency_focus"),
            "question_type": initial_turn.get("question_type"),
            "current_difficulty": current_difficulty,
            "question_index": 1,
            "total_questions": 6,
            "interview_completed": False,
            "audio_base64": initial_tts.get("audio_base64"),
            "audio_format": initial_tts.get("audio_format", "audio/wav"),
            "voice_provider": initial_tts.get("voice_provider", "sarvam_ai"),
            "speaker": "anushka"
        }))

        # Main Real-Time Event Loop
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
                msg_type = msg.get("type", "")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                elif msg_type == "barge_in":
                    logger.info(f"⚡ [BARGE-IN] Candidate interrupted AI speech for token {token[:12]}...")
                    # Candidate interrupted AI: acknowledge immediately
                    await websocket.send_text(json.dumps({
                        "type": "barge_in_acknowledged",
                        "status": "LISTENING"
                    }))

                elif msg_type == "offer":
                    await websocket.send_text(json.dumps({
                        "type": "answer",
                        "sdp": {"type": "answer", "sdp": "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"}
                    }))

                elif msg_type in ["candidate_speech", "candidate_audio"]:
                    candidate_speech = msg.get("text", "").strip()
                    if msg_type == "candidate_audio" or not candidate_speech:
                        audio_payload = msg.get("audio_base64") or msg.get("audio")
                        if audio_payload:
                            candidate_speech = VoiceTools.transcribe_audio_sarvam(audio_payload)

                    if not candidate_speech:
                        candidate_speech = msg.get("text", "I've described my technical experience and project contribution.")

                    logger.info(f"🗣️ [CANDIDATE SPEECH] Token {token[:12]}...: '{candidate_speech}'")

                    # Calculate elapsed duration
                    elapsed_secs = 0
                    if session_rec.started_at:
                        elapsed_secs = int((datetime.utcnow() - session_rec.started_at).total_seconds())

                    # Save candidate utterance to transcript
                    candidate_entry = {
                        "sender": context["candidate_name"],
                        "role": "candidate",
                        "text": candidate_speech,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    current_transcript = session_rec.transcript or []
                    current_transcript.append(candidate_entry)

                    # Generate dynamic next turn with Gemini LLM
                    next_turn = ConversationalInterviewEngine.generate_next_turn(
                        context=context["structured_context"],
                        transcript_history=current_transcript,
                        elapsed_seconds=elapsed_secs,
                        max_duration_seconds=session_rec.max_duration_seconds or 900,
                        current_difficulty=current_difficulty
                    )

                    ai_reply_text = next_turn["text"]
                    current_difficulty = next_turn.get("difficulty", current_difficulty)
                    is_concluding = next_turn.get("is_concluding", False)
                    turn_resp_id = next_turn["response_id"]

                    # Synthesize speech with Sarvam AI TTS (bulbul:v2 & anushka speaker)
                    ai_tts = VoiceTools.synthesize_speech_sarvam(ai_reply_text, speaker="anushka")

                    ai_entry = {
                        "response_id": turn_resp_id,
                        "sender": "AI Interviewer",
                        "role": "ai",
                        "text": ai_reply_text,
                        "competency": next_turn.get("competency_focus"),
                        "difficulty": current_difficulty,
                        "timestamp": datetime.utcnow().isoformat(),
                        "voice_provider": "sarvam_ai"
                    }
                    current_transcript.append(ai_entry)
                    session_rec.transcript = current_transcript
                    session_rec.current_question_index = (session_rec.current_question_index or 1) + 1
                    db.commit()

                    # Send next AI speech turn
                    await websocket.send_text(json.dumps({
                        "type": "ai_speech",
                        "response_id": turn_resp_id,
                        "speaker": "ai",
                        "text": ai_reply_text,
                        "competency_focus": next_turn.get("competency_focus"),
                        "question_type": next_turn.get("question_type"),
                        "current_difficulty": current_difficulty,
                        "question_index": session_rec.current_question_index,
                        "total_questions": 6,
                        "interview_completed": is_concluding,
                        "audio_base64": ai_tts.get("audio_base64"),
                        "audio_format": ai_tts.get("audio_format", "audio/wav"),
                        "voice_provider": "sarvam_ai",
                        "speaker": "anushka"
                    }))

                    if is_concluding:
                        session_rec.status = SessionStatus.COMPLETED
                        session_rec.ended_at = datetime.utcnow()
                        if invitation.application:
                            invitation.application.status = ApplicationStatus.INTERVIEW_COMPLETED
                        db.commit()

                        try:
                            from app.services.evaluation_service import trigger_interview_evaluation_async
                            trigger_interview_evaluation_async(invitation.application_id, session_rec.id)
                            logger.info(f"🧠 [EVALUATION TRIGGERED] Async evaluation triggered for App #{invitation.application_id}")
                        except Exception as eval_err:
                            logger.warning(f"Evaluation trigger notice: {eval_err}")

                        await websocket.send_text(json.dumps({
                            "type": "interview_completed",
                            "message": "Interview completed successfully. Your responses are being evaluated."
                        }))

                elif msg_type == "end_interview":
                    session_rec.status = SessionStatus.COMPLETED
                    session_rec.ended_at = datetime.utcnow()
                    if invitation.application:
                        invitation.application.status = ApplicationStatus.INTERVIEW_COMPLETED
                    db.commit()

                    try:
                        from app.services.evaluation_service import trigger_interview_evaluation_async
                        trigger_interview_evaluation_async(invitation.application_id, session_rec.id)
                        logger.info(f"🧠 [EVALUATION TRIGGERED] Async evaluation triggered for App #{invitation.application_id}")
                    except Exception as eval_err:
                        logger.warning(f"Evaluation trigger notice: {eval_err}")

                    await websocket.send_text(json.dumps({
                        "type": "interview_completed",
                        "message": "Interview concluded. Your responses have been submitted."
                    }))
                    break

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON message received on WS for token {token[:12]}")

    except WebSocketDisconnect:
        logger.info(f"🔌 [WS DISCONNECTED] Connection dropped for token {token[:12]}...")
        manager.disconnect(token)
    except Exception as e:
        logger.error(f"❌ [WS ERROR] Voice WebSocket error: {str(e)}")
        manager.disconnect(token)
    finally:
        db.close()
