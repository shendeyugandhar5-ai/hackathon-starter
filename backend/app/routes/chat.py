"""POST /api/chat - the shared contract everyone builds against.

Accepts a typed question, an image of a question (data URL), or both.
Voice input is handled entirely in the browser via the Web Speech API and
arrives here as ordinary text, so it needs no special handling.
"""
import uuid

from fastapi import APIRouter, HTTPException

from app.agents.coordinator import coordinate
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse, summary="Send a student message to the Coordinator")
def post_chat(payload: ChatRequest) -> ChatResponse:
    if not payload.message.strip() and not payload.image:
        raise HTTPException(status_code=422, detail="Provide a message, an image, or both.")

    conversation_id = payload.conversation_id or str(uuid.uuid4())
    result = coordinate(
        payload.message,
        payload.student_id,
        conversation_id,
        image_data_url=payload.image,
    )
    return ChatResponse(conversation_id=conversation_id, **result)
