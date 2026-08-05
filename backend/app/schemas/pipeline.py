from typing import Optional

from pydantic import BaseModel


class PipelineRunResponse(BaseModel):
    status: str
    message: str
    details: Optional[dict] = None
