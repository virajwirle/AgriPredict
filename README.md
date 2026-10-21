# AgriPredict

AgriPredict is a crop disease detection and agricultural advisory application. It combines crop-specific image classifiers, image-quality checks, structured disease knowledge, disease explanations, weather information, and a retrieval-augmented agriculture assistant.

## Current features

- React 19 and Vite frontend.
- FastAPI backend with authentication, prediction history, and Hugging Face model package loading.
- Eight enabled crop models: apple, cotton, grapes, maize, okra, potato, sugarcane, and tea.
- Disease knowledge files for all eight enabled crops. Accepted model predictions can receive a Mistral-generated explanation grounded in the matching crop and class entry.
- A separate dashboard agriculture assistant using a local Qwen QLoRA adapter and FAISS retrieval assets. It is separate from Mistral's post-prediction explanation flow.
- Weather and advisory services using Open-Meteo.

Pear, groundnut, and pumpkin are not currently registered. Add them after their model packages and class labels are ready.

## Model decision behavior

Apple, cotton, maize, and sugarcane use reliability rejection where configured: they can return `ACCEPT` or `UNCERTAIN`. Grapes, okra, potato, and tea are configured as **classification-only** in the backend. When a package returns `UNCERTAIN` but includes a predicted class or ranked classes, the adapter uses its highest-scoring class. This does not remove package files or dependencies: the package must expose the classifier output even if it also contains an OOD artifact. These crops do not screen unfamiliar images, so confirm the crop and visible symptoms before acting on the result.

Model metadata is stored in `backend/models/<crop>/metadata.json`. Model packages are downloaded from the configured Hugging Face repository the first time that crop is used and cached under `backend/model_cache/`.

Each package must include `model.py` and `inference.py` at its configured Hugging Face path. Class-based packages must expose the predictor class named in metadata, accept `model_dir` and `device`, and implement `predict(image_path)`. Return the predicted class and confidence; ranked output can use `top3` with `class` and `confidence` fields. The class order and preprocessing must match training.

## Image-quality checks

The backend rejects unreadable images, images smaller than 224 × 224 pixels, images with average grayscale brightness below 20 or above 240, and images whose blur score is below the configured minimum. The default minimum blur score is **10** (reduced from 50); change it with the `MINIMUM_IMAGE_BLUR_SCORE` environment variable. Lower values allow blurrier images through to the classifier, but do not change any model's OOD or reliability behavior.

## Run locally on Windows

Start the backend from the repository root:

```powershell
cd D:\ml-project\AgriPredict\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the frontend in a second PowerShell window:

```powershell
cd D:\ml-project\AgriPredict\frontend
npm run dev
```

The backend requires `backend/.env` with the required application secrets and service credentials, including `JWT_SECRET_KEY` and `HF_TOKEN` for the private model repository. Never commit that file. Configure Mistral and storage credentials if those services are enabled in your setup.

The dashboard agriculture assistant loads its Qwen QLoRA adapter and RAG files from `backend/llm_data/` and requires a compatible CUDA environment for its current 4-bit loader. The FAISS index and `agriculture_metadata.jsonl` are large local assets and are excluded from Git; place or rebuild them at the documented paths before using the assistant. Disease-specific explanations use the configured Mistral API and structured crop knowledge.

## Repository layout

- `backend/app/` — FastAPI routes, authentication, inference, validators, knowledge, and services.
- `backend/models/` — crop model metadata and package locations.
- `backend/llm_data/` — local Qwen adapter and FAISS/metadata retrieval assets.
- `backend/app/knowledge/crops/` — structured disease and crop-class knowledge used for explanations.
- `frontend/` — React dashboard and farmer-facing pages.
- `notebooks/` — model preparation, training, and evaluation notebooks.

Model weights and large datasets are generally fetched from Hugging Face or maintained outside Git. Keep `.env` files and credentials out of Git; use a local `.env` for development and commit only a sanitized `.env.example` if a template is needed. See [backend/README-AgriPredictLLM.md](backend/README-AgriPredictLLM.md) for assistant package details.
