import json
import base64
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import (
    InterviewInvitation,
    CandidateApplication,
    ApplicationStatus,
    InterviewSession,
    SessionStatus,
    Resume,
)
from app.core.logger import logger
from app.services.sarvam_agent_service import SarvamAgentSession

router = APIRouter()

def fetch_interview_context(db: Session, token: str) -> Optional[Dict[str, Any]]:
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.invitation_token == token).first()
    if not invitation:
        return None

    job = invitation.job
    candidate = invitation.candidate
    resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first() if candidate else None

    parsed_skills = resume.parsed_skills if (resume and resume.parsed_skills) else []
    exp_years = float(resume.parsed_experience_years) if (resume and resume.parsed_experience_years) else 0.0

    return {
        "invitation_id": invitation.id,
        "application_id": invitation.application_id,
        "candidate_id": invitation.candidate_id,
        "job_id": invitation.job_id,
        "candidate_info": {
            "id": candidate.id if candidate else 0,
            "name": candidate.full_name if candidate else "Candidate",
            "email": candidate.email if candidate else "",
            "skills": parsed_skills,
            "experience_years": exp_years,
        },
        "job_info": {
            "title": job.title if job else "Engineering Role",
            "company": job.company if job else "HireGenie AI",
            "must_have_skills": job.must_have_skills or job.extracted_skills or [],
            "nice_to_have_skills": job.nice_to_have_skills or [],
            "interview_difficulty": getattr(job, "interview_difficulty", "MEDIUM") or "MEDIUM",
        }
    }

@router.websocket("/ws/{token}")
async def voice_interview_websocket(websocket: WebSocket, token: str):
    db: Session = SessionLocal()
    agent_session: Optional[SarvamAgentSession] = None
    session_rec: Optional[InterviewSession] = None
    invitation = None
    is_socket_open = True

    try:
        context = fetch_interview_context(db, token)
        if not context:
            await websocket.accept()
            await websocket.send_text(json.dumps({"type": "error", "message": "Invalid interview token."}))
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

        await websocket.accept()
        logger.info(f"Connected voice WebSocket session for token: {token[:10]}...")

        # Direct Binary Audio Streamer - Zero Base64 / JSON latency
        async def on_agent_audio(chunk: bytes, sample_rate: int = 16000):
            nonlocal is_socket_open
            if not is_socket_open or websocket.client_state != WebSocketState.CONNECTED:
                return

            try:
                # Direct binary frame (10x faster than JSON base64)
                await websocket.send_bytes(chunk)
            except Exception:
                is_socket_open = False

        async def on_user_interrupt():
            nonlocal is_socket_open
            if is_socket_open and websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "barge_in_acknowledged",
                        "status": "LISTENING"
                    }))
                except Exception:
                    is_socket_open = False

        agent_session = SarvamAgentSession(
            candidate_info=context["candidate_info"],
            job_info=context["job_info"],
            on_audio_output=on_agent_audio,
            on_user_interrupt=on_user_interrupt
        )

        agent_task = asyncio.create_task(agent_session.start())

        await websocket.send_text(json.dumps({
            "type": "connected",
            "status": "CONNECTED",
            "session_id": session_rec.id,
            "job_title": context["job_info"]["title"],
            "candidate_name": context["candidate_info"]["name"],
            "company": context["job_info"]["company"],
            "max_duration_seconds": session_rec.max_duration_seconds or 900
        }))

        while True:
            message = await websocket.receive()

            # 1. Handle incoming raw binary candidate audio frame
            if "bytes" in message and message["bytes"]:
                if agent_session and agent_session.is_running:
                    await agent_session.push_audio(message["bytes"])

            # 2. Handle incoming JSON control command
            elif "text" in message and message["text"]:
                try:
                    msg = json.loads(message["text"])
                except Exception:
                    continue

                msg_type = msg.get("type", "")

                if msg_type == "ping":
                    if is_socket_open and websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(json.dumps({"type": "pong"}))

                elif msg_type in ("candidate_audio", "candidate_speech"):
                    audio_payload = msg.get("audio_base64") or msg.get("audio")
                    if audio_payload and agent_session and agent_session.is_running:
                        clean_b64 = audio_payload.split(",", 1)[1] if "," in audio_payload else audio_payload
                        try:
                            pcm_bytes = base64.b64decode(clean_b64)
                            await agent_session.push_audio(pcm_bytes)
                        except Exception:
                            pass

                elif msg_type == "end_interview":
                    logger.info(f"Candidate explicitly ended interview for token {token[:10]}...")
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for token {token[:10]}...")
    except Exception as e:
        logger.error(f"Voice WebSocket Error: {e}")
    finally:
        is_socket_open = False
        if agent_session:
            await agent_session.close()

        if session_rec:
            session_rec.status = SessionStatus.COMPLETED
            session_rec.ended_at = datetime.utcnow()
            if session_rec.started_at:
                session_rec.elapsed_seconds = int((session_rec.ended_at - session_rec.started_at).total_seconds())

            if invitation and invitation.application:
                invitation.application.status = ApplicationStatus.INTERVIEW_COMPLETED

            db.commit()

            try:
                from app.services.evaluation_service import trigger_interview_evaluation_async
                trigger_interview_evaluation_async(invitation.application_id, session_rec.id)
            except Exception as eval_err:
                logger.warning(f"Evaluation trigger notice: {eval_err}")

        db.close()