from fastapi import APIRouter

from app.api.v1.auth import (
    router as auth_router,
)
from app.api.v1.weather import (
    router as weather_router,
)

from app.api.v1.database import (
    router as database_router,
)
from app.api.v1.prediction_history import (
    router as prediction_history_router,
)
from app.api.v1.predictions import (
    router as predictions_router,
)


api_v1_router = APIRouter()

api_v1_router.include_router(
    auth_router
)

api_v1_router.include_router(
    predictions_router
)

api_v1_router.include_router(
    prediction_history_router
)

api_v1_router.include_router(
    database_router
)

api_v1_router.include_router(
    weather_router
)