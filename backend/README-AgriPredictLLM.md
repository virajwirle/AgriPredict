# AgriPredict agriculture assistant

The agriculture assistant is integrated into the AgriPredict dashboard as a separate, retrieval-augmented chat experience. It uses a local Qwen 3 0.6B base model with a QLoRA adapter and a FAISS agriculture index. It is separate from disease prediction and from Mistral-generated explanations after an accepted disease prediction.

## Required assets

The loader expects these files relative to `backend/`:

```text
llm_data/
  models/qwen3-0.6b-english-qlora/   # PEFT adapter and tokenizer files
  rag/expanded/agriculture_faiss.index
  rag/expanded/agriculture_metadata.jsonl
```

The Qwen base model (`Qwen/Qwen3-0.6B`) and embedding model (`sentence-transformers/all-MiniLM-L6-v2`) are fetched from Hugging Face and cached by their libraries. The adapter and RAG assets are stored locally in `backend/llm_data/`. The large FAISS index and JSONL metadata are intentionally excluded from Git; provide them locally at the paths above before starting the assistant. Do not commit `.env` files or credentials.

## Runtime requirements

Install `backend/requirements-llm.txt` in the backend environment in addition to the normal backend requirements. The current 4-bit model loader requires a compatible CUDA GPU. It loads the assistant on the first chat request and then reuses it for later requests. FAISS vector count must match the number of non-empty JSONL metadata records.

## API

The authenticated dashboard sends chat requests to `POST /api/v1/assistant/chat` with a question and optional conversation history. The assistant uses retrieval for agricultural questions and a Qwen response when relevant retrieved context is unavailable.

The disease detector remains a separate flow: accepted predictions use structured crop knowledge to ground their Mistral explanation. `backend/app/knowledge/crops/` contains those disease knowledge entries.
