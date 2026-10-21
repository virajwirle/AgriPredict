from .config import *
from . import config as _config
from .loader import AgriPredictLLM

def load_agri_llm():
    """Load the model, adapter, embedding model, and RAG index once."""
    return AgriPredictLLM(_config).load()

__all__ = ["AgriPredictLLM", "load_agri_llm"]
