from pydantic import BaseModel


class ScheduleMeetingRequest(BaseModel):
    lead_id: str
    date: str
    time: str
