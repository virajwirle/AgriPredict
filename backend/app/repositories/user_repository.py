from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import User


class UserRepositoryError(RuntimeError):
    """Raised when a user database operation fails."""


def get_user_by_email(
    session: Session,
    email: str,
) -> User | None:
    statement = select(User).where(
        User.email == email.lower().strip()
    )

    try:
        return session.scalar(statement)

    except SQLAlchemyError as error:
        raise UserRepositoryError(
            "Failed to retrieve the user."
        ) from error


def get_user_by_id(
    session: Session,
    user_id: str | uuid.UUID,
) -> User | None:
    if isinstance(user_id, uuid.UUID):
        normalized_user_id = user_id
    else:
        try:
            normalized_user_id = uuid.UUID(user_id)

        except (
            TypeError,
            ValueError,
            AttributeError,
        ) as error:
            raise ValueError(
                f"Invalid user ID: {user_id}"
            ) from error

    statement = select(User).where(
        User.id == normalized_user_id
    )

    try:
        return session.scalar(statement)

    except SQLAlchemyError as error:
        raise UserRepositoryError(
            "Failed to retrieve the user."
        ) from error


def create_user(
    session: Session,
    *,
    email: str,
    password_hash: str,
    full_name: str | None = None,
    preferred_language: str = "en",
) -> User:
    user = User(
        email=email.lower().strip(),
        password_hash=password_hash,
        full_name=full_name,
        preferred_language=preferred_language,
    )

    try:
        session.add(user)
        session.commit()
        session.refresh(user)

        return user

    except SQLAlchemyError as error:
        session.rollback()

        raise UserRepositoryError(
            "Failed to create the user."
        ) from error