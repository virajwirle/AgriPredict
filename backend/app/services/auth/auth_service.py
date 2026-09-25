from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
)
from app.repositories.user_repository import (
    UserRepositoryError,
    create_user,
    get_user_by_email,
)
from app.services.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth.token_service import (
    create_access_token,
)


class AuthServiceError(RuntimeError):
    """Raised when an authentication operation fails."""


def register_user(
    session: Session,
    request: RegisterRequest,
) -> UserResponse:
    """
    Register a new user.
    """

    existing_user = get_user_by_email(
        session,
        request.email,
    )

    if existing_user is not None:
        raise AuthServiceError(
            "An account with this email already exists."
        )

    password_hash = hash_password(
        request.password
    )

    try:
        user = create_user(
            session,
            email=request.email,
            password_hash=password_hash,
            full_name=request.full_name,
            preferred_language=(
                request.preferred_language
            ),
        )

    except UserRepositoryError as error:
        raise AuthServiceError(
            "Unable to create the user account."
        ) from error

    return UserResponse.model_validate(user)


def login_user(
    session: Session,
    request: LoginRequest,
) -> TokenResponse:
    """
    Authenticate a user and return an access token.
    """

    user = get_user_by_email(
        session,
        request.email,
    )

    if user is None:
        raise AuthServiceError(
            "Invalid email or password."
        )

    if not user.is_active:
        raise AuthServiceError(
            "This account is inactive."
        )

    if not verify_password(
        request.password,
        user.password_hash,
    ):
        raise AuthServiceError(
            "Invalid email or password."
        )

    access_token = create_access_token(
        user.id
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )