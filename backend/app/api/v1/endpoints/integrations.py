"""Integrations API — manage external service connections."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.integrations.base import get_all_integrations, get_integration

router = APIRouter()


class ConnectRequest(BaseModel):
    credentials: Dict[str, Any] = {}


@router.get("/all")
def list_integrations():
    """List all integrations with their status."""
    return {"integrations": get_all_integrations()}


@router.post("/{name}/connect")
def connect_integration(name: str, payload: ConnectRequest):
    """Connect an integration by name."""
    integration = get_integration(name)
    if not integration:
        raise HTTPException(status_code=404, detail=f"Integration '{name}' not found")

    result = integration.connect(payload.credentials)
    return {"integration": name, **result}


@router.post("/{name}/disconnect")
def disconnect_integration(name: str):
    """Disconnect an integration."""
    integration = get_integration(name)
    if not integration:
        raise HTTPException(status_code=404, detail=f"Integration '{name}' not found")

    result = integration.disconnect()
    return {"integration": name, **result}


@router.get("/{name}/health")
def health_check_integration(name: str):
    """Check health of a specific integration."""
    integration = get_integration(name)
    if not integration:
        raise HTTPException(status_code=404, detail=f"Integration '{name}' not found")

    result = integration.health_check()
    return {"integration": name, **result}
