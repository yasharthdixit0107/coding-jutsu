from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class Incident(BaseModel):
    id: Optional[str] = None
    timestamp: datetime
    channel: str
    action_taken: str
    findings: List[dict]
    risk_score: int
    source_ip: str
    original_preview: str
    masked_content: Optional[str] = None

class ScanTextRequest(BaseModel):
    text: str

class ScanTextResponse(BaseModel):
    action: str
    findings: List[dict]
    risk_score: int
    masked_text: str
    processing_time_ms: float

class ScanFileResponse(BaseModel):
    filename: str
    file_size_kb: float
    action: str
    findings: List[dict]
    risk_score: int
    text_preview: str
    masked_content: Optional[str] = None

class ScanEmailRequest(BaseModel):
    subject: str
    body: str
    sender: str
    recipient: str

class PolicyUpdateRequest(BaseModel):
    data_type: str
    action: str
