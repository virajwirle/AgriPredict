from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import verify_database_connection


router = APIRouter(
    prefix="/database",
    tags=["Database"],
)


class DatabaseHealthResponse(BaseModel):
    status: Literal["connected"]
    database_name: str
    database_user: str


@router.get(
    "/health",
    response_model=DatabaseHealthResponse,
)
def database_health() -> DatabaseHealthResponse:
    try:
        result = verify_database_connection()

        return DatabaseHealthResponse(
            status="connected",
            database_name=result["database_name"],
            database_user=result["database_user"],
        )

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "The database is currently unavailable.",
            },
        ) from error