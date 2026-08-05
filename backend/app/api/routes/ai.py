from fastapi import APIRouter

from ...schemas.ai import ChatRequest
from ...services import get_ai_models, chat_assistant

router = APIRouter()


@router.get("/api/ai/models")
def api_get_ai_models():
    return get_ai_models()


@router.post("/api/ai/chat")
def api_chat_assistant(req: ChatRequest):
    return chat_assistant(req)
