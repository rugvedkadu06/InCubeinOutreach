from typing import Optional

from pydantic import BaseModel


class HttpError(BaseModel):
    detail: str
