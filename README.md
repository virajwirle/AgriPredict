# AgriPredict

AgriPredict is a reliability-aware crop disease detection and advisory project. It combines crop-specific image models with image-quality checks, an explicit uncertain outcome, structured disease knowledge, and weather services. The goal is to support a farmer's next decision, not to force a label for every image.

## Project question

**How can a crop-specific disease system recognize when an image is not reliable enough to diagnose, and provide useful context when it is?**

This makes reliability and safe abstention a central part of the project. An uncertain result is an intended system outcome: the app should request a better or supported image rather than present an unreliable disease label as fact.

## Current system

- React + Vite frontend
- FastAPI backend with authentication, prediction history, and crop-specific model adapters
- Image validation for corrupt, blurry, poorly lit, overexposed, and low-resolution images
- Apple and maize models registered as enabled; their deployment weights are fetched from the configured Hugging Face repository
- Apple model: ResNet50 + self-attention, 8 classes, reported internal test accuracy 96.22%, macro-F1 0.9676, and OOD AUROC 0.9631
- Reliability-aware inference with an `ACCEPT` or `UNCERTAIN` decision
- Crop disease knowledge files, LLM-assisted explanations, and Open-Meteo weather/advisory services
- User-facing prediction results now communicate whether reliability checks passed or the diagnosis was withheld

Model metrics above are reported from the Apple model's existing evaluation artifacts; they are not a guarantee of field performance. Maize model metrics and deployment class alignment still need to be documented from its evaluation artifacts.

## Planned final-year contribution

The distinctive contribution is a measurable **reliability-aware advisory pipeline**:

```text
Image quality → Crop-specific classifier → Reliability decision
     → Structured disease guidance + weather context → Next action
```

The project should be evaluated on both classification and abstention behavior: supported-image accuracy, image-quality rejection, out-of-distribution rejection, coverage versus accepted-prediction error, and inference time. Future additions should be driven by available data and locally appropriate agricultural sources. Soil suitability and fertilizer calculation are candidates for a later phase; they are not currently implemented and should not be presented as deployed features.

## Repository

- `backend/` — FastAPI application, inference adapters, validators, services, and model metadata
- `frontend/` — React application
- `notebooks/` — model preparation, training, and evaluation notebooks

Large datasets and deployment weights are excluded from Git. Model packages are configured in `backend/models/*/metadata.json`.
