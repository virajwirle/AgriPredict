import logging
from threading import Lock
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import get_current_user
from app.db.models import User
from app.services.llm.agripredict_llm import load_agri_llm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["Assistant"])

_model = None
_model_lock = Lock()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)


class ChatResponse(BaseModel):
    answer: str


def _get_answer(question: str, history: list[dict]) -> str:
    global _model

    # Load once, on the first chat request.
    with _model_lock:
        if _model is None:
            _model = load_agri_llm()

    return _model.chat(question, history=history)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    history = [
        message.model_dump()
        for message in request.history
    ]

    try:
        answer = await run_in_threadpool(
            _get_answer,
            request.question.strip(),
            history,
        )
        return ChatResponse(answer=answer)
    except Exception as error:
        logger.exception("Agriculture assistant request failed")
        raise HTTPException(
            status_code=503,
            detail="The agriculture assistant is temporarily unavailable.",
        ) from error