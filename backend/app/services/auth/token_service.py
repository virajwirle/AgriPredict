from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt

from app.core.config import settings


def create_access_token(
    user_id: UUID,
) -> str:
    """
    Create a signed JWT access token for a user.
    """

    now = datetime.now(timezone.utc)

    expires_at = (
        now
        + timedelta(
            minutes=settings.jwt_access_token_expire_minutes
        )
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
) -> UUID:
    """
    Decode and validate a JWT access token.

    Returns the authenticated user's UUID.
    """

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    subject = payload.get("sub")

    if not subject:
        raise ValueError(
            "Access token does not contain a user ID."
        )

    try:
        return UUID(subject)

    except (ValueError, TypeError) as error:
        raise ValueError(
            "Access token contains an invalid user ID."
        ) from error