from pathlib import Path

# config.py is under backend/app/services/llm/agripredict_llm/
PROJECT_DIR = Path(__file__).resolve().parents[4]

BASE_MODEL = "Qwen/Qwen3-0.6B"
ADAPTER_PATH = (
    PROJECT_DIR / "llm_data/models/qwen3-0.6b-english-qlora"
)

FAISS_INDEX_PATH = (
    PROJECT_DIR / "llm_data/rag/expanded/agriculture_faiss.index"
)
METADATA_PATH = (
    PROJECT_DIR / "llm_data/rag/expanded/agriculture_metadata.jsonl"
)

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

TOP_K = 5
MAX_NEW_TOKENS = 80