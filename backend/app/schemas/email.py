from typing import Optional

from pydantic import BaseModel


class MouSendRequest(BaseModel):
    incubator_name: str
    incubator_email: str
    party_b_name: str
    party_b_email: str
    mou_title: str
    mou_text: str
    signature_data: str  # Base64 PNG image
    recipient_email: str


class ContactSendRequest(BaseModel):
    incubator_name: str
    recipient_email: str
    subject: str
    message: str
    meeting_date: Optional[str] = None
    meeting_time: Optional[str] = None
