from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
