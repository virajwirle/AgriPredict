from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.services.auth.auth_service import (
    AuthServiceError,
    login_user,
    register_user,
)
from app.services.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    session: Session = Depends(
        get_db_session
    ),
) -> UserResponse:

    try:
        return register_user(
            session,
            request,
        )

    except AuthServiceError as error:
        message = str(error)

        if (
            message
            == "An account with this email already exists."
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "reason_code": "EMAIL_ALREADY_EXISTS",
                    "message": message,
                },
            ) from error

        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": "REGISTRATION_FAILED",
                "message": (
                    "The account could not be created."
                ),
            },
        ) from error


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    session: Session = Depends(
        get_db_session
    ),
) -> TokenResponse:

    try:
        return login_user(
            session,
            request,
        )

    except AuthServiceError as error:
        message = str(error)

        if message in {
            "Invalid email or password.",
            "This account is inactive.",
        }:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "reason_code": "AUTHENTICATION_FAILED",
                    "message": message,
                },
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            ) from error

        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": "LOGIN_FAILED",
                "message": (
                    "The login request could not "
                    "be completed."
                ),
            },
        ) from error