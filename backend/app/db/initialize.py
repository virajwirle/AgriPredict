from app.db.base import Base
from app.db.models import (
    PredictionRecord,
    RecommendationRecord,
    User,
    UserFeedback,
    WeatherSnapshot,
)
from app.db.session import engine


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    initialize_database()
    print("Database tables created successfully.")