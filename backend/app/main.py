from contextlib import asynccontextmanager
from app.api.v1.router import (
    api_v1_router
)

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware
)

from app.core.config import settings

from app.inference.model_registry import (
    model_registry
)


@asynccontextmanager
async def lifespan(
    app: FastAPI
):

    settings.model_cache_path.mkdir(
        parents=True,
        exist_ok=True
    )

    model_registry.discover_models()

    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for scalable multi-crop "
        "plant disease detection."
    ),
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        settings.cors_origin_list
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(
    api_v1_router,
    prefix=settings.api_v1_prefix
)


@app.get("/")
def root():

    return {
        "service":
            settings.app_name,

        "version":
            settings.app_version,

        "environment":
            settings.app_env,

        "status":
            "running"
    }


@app.get(
    f"{settings.api_v1_prefix}/health"
)
def health_check():

    return {
        "status":
            "healthy",

        "version":
            settings.app_version,

        "registered_model_count":
            len(
                model_registry
                .get_all_models()
            ),

        "registry_error_count":
            len(
                model_registry
                .get_errors()
            )
    }


@app.get(
    f"{settings.api_v1_prefix}/models"
)
def list_models():

    all_models = {
        crop: metadata.model_dump(
            mode="json"
        )

        for crop, metadata
        in model_registry
        .get_all_models()
        .items()
    }

    enabled_models = {
        crop: metadata.model_dump(
            mode="json"
        )

        for crop, metadata
        in model_registry
        .get_enabled_models()
        .items()
    }

    return {
        "models_directory":
            str(
                model_registry
                .models_directory
            ),

        "registered_models":
            all_models,

        "enabled_models":
            enabled_models,

        "registry_errors":
            model_registry
            .get_errors()
    }