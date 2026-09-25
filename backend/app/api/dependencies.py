from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db_session
from app.repositories.user_repository import get_user_by_id
from app.services.auth.token_service import decode_access_token


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    session: Session = Depends(
        get_db_session
    ),
) -> User:
    token = credentials.credentials

    try:
        user_id = decode_access_token(token)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "reason_code": "INVALID_ACCESS_TOKEN",
                "message": "The access token is invalid or expired.",
            },
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from error

    try:
        user = get_user_by_id(
            session,
            user_id,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "reason_code": "USER_LOOKUP_FAILED",
                "message": "The current user could not be verified.",
            },
        ) from error

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "reason_code": "USER_NOT_FOUND",
                "message": "The authenticated user no longer exists.",
            },
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "reason_code": "USER_INACTIVE",
                "message": "This account is inactive.",
            },
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return user