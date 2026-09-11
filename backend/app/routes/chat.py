"""POST /api/chat - the shared contract everyone builds against (idea.md section 7.2)."""
import uuid

from fastapi import APIRouter

from app.agents.coordinator import coordinate
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse, summary="Send a student message to the Coordinator")
def post_chat(payload: ChatRequest) -> ChatResponse:
    conversation_id = payload.conversation_id or str(uuid.uuid4())
    result = coordinate(payload.message, payload.student_id, conversation_id)
    return ChatResponse(conversation_id=conversation_id, **result)
