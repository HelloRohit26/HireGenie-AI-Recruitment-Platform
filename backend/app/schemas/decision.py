from pydantic import BaseModel


class HiringDecision(BaseModel):

    status: str

    confidence: float

    reason: str

    next_action: str