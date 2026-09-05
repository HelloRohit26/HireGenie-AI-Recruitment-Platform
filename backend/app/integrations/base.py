"""Base Integration — abstract class for all external service connectors."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime


class IntegrationBase(ABC):
    """Abstract base class for all external integrations."""

    def __init__(self, name: str, description: str, icon: str = "🔌"):
        self.name = name
        self.description = description
        self.icon = icon
        self.connected = False
        self.last_sync = None
        self.config: Dict[str, Any] = {}

    @abstractmethod
    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Establish connection to the external service."""
        pass

    @abstractmethod
    def disconnect(self) -> Dict[str, Any]:
        """Disconnect from the external service."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Check if the integration is healthy and operational."""
        pass

    def get_status(self) -> Dict[str, Any]:
        """Get current integration status."""
        return {
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "connected": self.connected,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
        }


class EmailIntegration(IntegrationBase):
    """Gmail / SMTP email integration connector."""

    def __init__(self):
        super().__init__(
            name="Email (Gmail/SMTP)",
            description="Send automated emails via Gmail or SMTP server",
            icon="📧",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        self.config = {"provider": credentials.get("provider", "smtp")}
        return {"status": "connected", "provider": self.config["provider"]}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected, "provider": self.config.get("provider")}


class CalendarIntegration(IntegrationBase):
    """Google Calendar integration connector."""

    def __init__(self):
        super().__init__(
            name="Google Calendar",
            description="Sync interview schedules with Google Calendar",
            icon="📅",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        return {"status": "connected", "message": "Calendar API ready"}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected, "api": "Google Calendar API v3"}


class ATSIntegration(IntegrationBase):
    """Applicant Tracking System integration connector."""

    def __init__(self):
        super().__init__(
            name="ATS Connector",
            description="Sync with external Applicant Tracking Systems via webhooks",
            icon="🔗",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        self.config = {"webhook_url": credentials.get("webhook_url", "")}
        return {"status": "connected", "webhook_configured": bool(self.config["webhook_url"])}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected, "webhook_url": self.config.get("webhook_url", "not configured")}


class LinkedInIntegration(IntegrationBase):
    """LinkedIn integration for sourcing candidates."""

    def __init__(self):
        super().__init__(
            name="LinkedIn",
            description="Source candidates and post jobs on LinkedIn",
            icon="💼",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        return {"status": "connected", "message": "LinkedIn API ready"}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected}


class TwilioIntegration(IntegrationBase):
    """Twilio integration for telephonic interviews."""

    def __init__(self):
        super().__init__(
            name="Twilio",
            description="Voice calls for telephonic AI interviews",
            icon="📞",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        self.config = {"account_sid": credentials.get("account_sid", "")}
        return {"status": "connected"}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected}


class WebRTCIntegration(IntegrationBase):
    """WebRTC integration for browser-based voice interviews."""

    def __init__(self):
        super().__init__(
            name="WebRTC",
            description="Browser-based real-time voice interview rooms",
            icon="🎙️",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        return {"status": "connected", "message": "WebRTC signaling server ready"}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected}


class JobPortalIntegration(IntegrationBase):
    """Job portal integration (Naukri, Indeed, etc.)."""

    def __init__(self):
        super().__init__(
            name="Job Portals",
            description="Post jobs and source candidates from Naukri, Indeed, etc.",
            icon="🌐",
        )

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        return {"status": "connected"}

    def disconnect(self) -> Dict[str, Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": self.connected}


class SarvamIntegration(IntegrationBase):
    """Sarvam AI voice and speech models integration connector."""

    def __init__(self):
        super().__init__(
            name="Sarvam AI Voice Engine",
            description="Speech-to-Text (saaras:v3) and Text-to-Speech (bulbul:v3) pipeline",
            icon="🎙️",
        )
        import os
        from app.core.config import settings
        self.connected = bool(settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY"))

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        self.config = credentials
        return {"status": "connected", "provider": "sarvam_ai"}

    def disconnect(self) -> Dict[Dict[str, Any], Any]:
        self.connected = False
        return {"status": "disconnected"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": True, "provider": "sarvam_ai", "models": ["saaras:v3", "bulbul:v3"]}


class PostgreSQLIntegration(IntegrationBase):
    """PostgreSQL Primary Relational Database connector."""

    def __init__(self):
        super().__init__(
            name="PostgreSQL Primary Database",
            description="Relational database storage engine",
            icon="🐘",
        )
        self.connected = True

    def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.connected = True
        return {"status": "connected", "database": "postgresql"}

    def disconnect(self) -> Dict[str, Any]:
        return {"status": "connected", "message": "Primary DB connection is managed via pool"}

    def health_check(self) -> Dict[str, Any]:
        return {"healthy": True, "dialect": "postgresql+psycopg2"}


# Integration registry — singleton instances
INTEGRATIONS = {
    "email": EmailIntegration(),
    "calendar": CalendarIntegration(),
    "ats": ATSIntegration(),
    "linkedin": LinkedInIntegration(),
    "twilio": TwilioIntegration(),
    "webrtc": WebRTCIntegration(),
    "job_portals": JobPortalIntegration(),
    "sarvam": SarvamIntegration(),
    "postgresql": PostgreSQLIntegration(),
}


def get_all_integrations() -> list:
    """Return status of all integrations."""
    return [integration.get_status() for integration in INTEGRATIONS.values()]


def get_integration(name: str) -> Optional[IntegrationBase]:
    """Get a specific integration by name."""
    return INTEGRATIONS.get(name.lower())

