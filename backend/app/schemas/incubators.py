from typing import Optional

from pydantic import BaseModel


class ContactUpdateRequest(BaseModel):
    id: str
    email: str
    website: str


class FinderRequest(BaseModel):
    startup_name: str
    sector: str
    hq_city: str
    stage: str
    state: Optional[str] = None
