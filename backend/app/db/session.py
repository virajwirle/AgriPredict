import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker


load_dotenv()


class DatabaseConfigurationError(RuntimeError):
    """Raised when required database configuration is missing."""


def require_environment_variable(name: str) -> str:
    value = os.getenv(name)

    if value is None or not value.strip():
        raise DatabaseConfigurationError(
            f"Required environment variable is missing: {name}"
        )

    return value.strip()


def build_database_url() -> URL:
    port_value = os.getenv("DB_PORT", "5432")

    try:
        port = int(port_value)
    except ValueError as error:
        raise DatabaseConfigurationError(
            "DB_PORT must be a valid integer."
        ) from error

    return URL.create(
        drivername="postgresql+psycopg",
        username=require_environment_variable("DB_USER"),
        password=require_environment_variable("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost").strip(),
        port=port,
        database=require_environment_variable("DB_NAME"),
    )


DATABASE_URL = build_database_url()


engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)


def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()


def verify_database_connection() -> dict[str, str]:
    with engine.connect() as connection:
        row = connection.execute(
            text(
                """
                SELECT
                    current_database() AS database_name,
                    current_user AS database_user
                """
            )
        ).mappings().one()

    return {
        "database_name": row["database_name"],
        "database_user": row["database_user"],
        "status": "connected",
    }