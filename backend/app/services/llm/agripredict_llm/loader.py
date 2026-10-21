import json
import re
import torch
import faiss
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
from sentence_transformers import SentenceTransformer


class AgriPredictLLM:
    def __init__(self, config):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.embedder = None
        self.index = None
        self.metadata_offsets = []

    def load(self):
        """Load models and the existing RAG index once."""
        c = self.config
        required = {
            "QLoRA adapter": c.ADAPTER_PATH,
            "FAISS index": c.FAISS_INDEX_PATH,
            "metadata": c.METADATA_PATH,
        }
        for name, path in required.items():
            if not Path(path).exists():
                raise FileNotFoundError(f"{name} not found: {path}")

        if not torch.cuda.is_available():
            raise RuntimeError(
                "This 4-bit loader requires a compatible CUDA GPU. "
                "Use a GPU runtime or configure a CPU-compatible loader."
            )

        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(c.BASE_MODEL)
        base = AutoModelForCausalLM.from_pretrained(
            c.BASE_MODEL,
            quantization_config=quant_config,
            device_map="auto",
        )
        self.model = PeftModel.from_pretrained(base, str(c.ADAPTER_PATH))
        self.model.eval()
        self.embedder = SentenceTransformer(c.EMBEDDING_MODEL)
        self.index = faiss.read_index(str(c.FAISS_INDEX_PATH))

        # Store byte offsets to avoid holding all metadata records in RAM.
        self.metadata_offsets = []
        with open(c.METADATA_PATH, "rb") as f:
            while True:
                offset = f.tell()
                line = f.readline()
                if not line:
                    break
                if line.strip():
                    self.metadata_offsets.append(offset)

        if self.index.ntotal != len(self.metadata_offsets):
            raise ValueError(
                f"FAISS/metadata mismatch: {self.index.ntotal:,} vectors "
                f"but {len(self.metadata_offsets):,} metadata records."
            )

        print(
            f"AgriPredictLLM loaded: {self.index.ntotal:,} vectors. "
            "Loaded resources will be reused for each question."
        )
        return self

    def retrieve(self, question):
        """Retrieve top-k records from the existing FAISS index."""
        if self.embedder is None or self.index is None:
            raise RuntimeError("Call load() before retrieve().")

        vector = self.embedder.encode(
            [question],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        scores, indices = self.index.search(vector, self.config.TOP_K)
        results = []

        with open(self.config.METADATA_PATH, "rb") as f:
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self.metadata_offsets):
                    continue
                f.seek(self.metadata_offsets[int(idx)])
                record = json.loads(f.readline().decode("utf-8"))
                record["_score"] = float(score)
                results.append(record)
        return results

    @staticmethod
    def _record_text(record):
        question = next(
            (
                record[key]
                for key in ("question", "query", "instruction", "title")
                if isinstance(record.get(key), str)
            ),
            "",
        )
        answer = next(
            (
                record[key]
                for key in ("answer", "response", "output", "text", "content")
                if isinstance(record.get(key), str)
            ),
            "",
        )
        if not answer:
            ignored = {"_score", "question", "query", "instruction", "title"}
            answer = " ".join(
                str(value)
                for key, value in record.items()
                if key not in ignored and isinstance(value, str)
            )
        return question, answer

    @staticmethod
    def _looks_like_bad_trailing_sentence(sentence):
        """Conservative checks for common malformed generated endings."""
        s = sentence.strip()
        if not s:
            return True

        # Obvious dangling connectors or sentence fragments.
        if re.search(
            r"\b(?:and|or|but|because|which|that|such as|including|"
            r"for example|to|with|of|in order to)\s*[.!?]?$",
            s,
            flags=re.IGNORECASE,
        ):
            return True

        # Catch the specific malformed construction seen in test output:
        # "In maintaining soil health is crucial ..."
        if re.match(r"(?i)^in\s+\w+ing\b", s) and re.search(
            r"\b(?:is|are|was|were)\b", s, flags=re.IGNORECASE
        ):
            return True

        # A very short final fragment is often an incomplete generation.
        words = re.findall(r"\b[\w'-]+\b", s)
        if len(words) < 4:
            return True

        return False

    @staticmethod
    def _clean_generated_answer(text, preserve_greeting=False, preserve_short=False):
        """Clean model output while preserving conversational fallback replies."""
        text = text.strip()
        text = re.sub(
            r"^\s*(?:(?:answer|response)\s*:\s*)+",
            "",
            text,
            flags=re.IGNORECASE,
        )
        if not preserve_greeting:
            text = re.sub(
                r"^\s*(?:hello there[!,\.\s]*|hi there[!,\.\s]*|"
                r"hello[!,\.\s]*|hi[!,\.\s]*|certainly[!,\.\s]*|"
                r"of course[!,\.\s]*|sure[!,\.\s]*)",
                "",
                text,
                flags=re.IGNORECASE,
            )

        text = re.sub(r"(?m)^\s*#{1,6}\s*", "", text)
        text = re.sub(r"(?m)^\s*(?:[-*•]|\d+[.)])\s*", "", text)
        text = re.sub(r"\s+\d+[.)]\s+", " ", text)
        text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
        text = re.sub(r"`([^`]*)`", r"\1", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{2,}", "\n", text).strip()

        sentences = re.split(r"(?<=[.!?])\s+", text)
        unique_sentences = []
        seen = set()
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            normalized = re.sub(r"\W+", " ", sentence.lower()).strip()
            if normalized and normalized not in seen:
                seen.add(normalized)
                unique_sentences.append(sentence)

        if (
            unique_sentences
            and not preserve_short
            and AgriPredictLLM._looks_like_bad_trailing_sentence(
                unique_sentences[-1]
            )
        ):
            unique_sentences.pop()

        text = " ".join(unique_sentences).strip()
        if text and text[-1] not in ".!?":
            end = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
            if end > 0:
                text = text[: end + 1].strip()

        text = re.sub(
            r"(?i)\s*(?:answer|response)\s*:\s*",
            " ",
            text,
        )
        return re.sub(r"\s{2,}", " ", text).strip()

    def _generate_response(self, prompt, conversational=False):
        """Generate and clean one Qwen response."""
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1600,
        ).to(self.model.device)

        configured_tokens = int(getattr(self.config, "MAX_NEW_TOKENS", 80))
        # Greetings need only a short completion; keep normal answers bounded
        # so generation does not spend time producing unnecessary commentary.
        max_new_tokens = min(
            96,
            max(40, configured_tokens),
        )
        if conversational:
            max_new_tokens = min(max_new_tokens, 48)

        with torch.inference_mode():
            output = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                use_cache=True,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        generated_tokens = output[0][inputs["input_ids"].shape[1] :]
        raw_answer = self.tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True,
        )
        return self._clean_generated_answer(
            raw_answer,
            preserve_greeting=conversational,
            preserve_short=conversational,
        )

    @staticmethod
    def _is_social_turn(question):
        """Route standalone greetings and gratitude to conversational fallback."""
        normalized = re.sub(r"[^\w\s']", "", question.lower()).strip()
        social_patterns = (
            r"(?:hi|hello|hey|good morning|good afternoon|good evening)",
            r"(?:thanks|thank\s*you|thankyou)(?:\s+(?:a lot|so much))?",
            r"(?:thanks|thank\s*you|thankyou)\s+for\s+(?:your|you)\s+help",
            r"(?:bye|goodbye|see you)",
        )
        return any(re.fullmatch(pattern, normalized) for pattern in social_patterns)

    def chat(self, question, history=None):
        """Use RAG for relevant agriculture questions and Qwen fallback otherwise."""
        if self.model is None:
            raise RuntimeError("Call load() before chat().")

        question = question.strip()
        if not question:
            return "Please enter a question."

        recent_history = [
            item for item in (history or [])
            if isinstance(item, dict)
            and item.get("role") in {"user", "assistant"}
            and isinstance(item.get("content"), str)
        ][-4:]
        history_text = "\n".join(
            f"{item['role']}: {item['content']}"
            for item in recent_history
        )

        fallback_prompt = f"""You are AgriPredictLLM, an agriculture assistant.
Use recent conversation only to understand short follow-up messages.
Write only the message addressed to the user. Never describe the conversation, infer what the user may want, mention that the user thanked you, or explain what your next step should be.
If the user is only greeting you, thanking you, or saying goodbye, respond warmly in one brief sentence. For thanks, a simple "You're welcome!" is enough.
If the user's request is clearly not about agriculture, output exactly this message and nothing else:
I'm sorry, but that question is outside my area of expertise. 🌱 I'm designed to assist with agriculture-related topics, including crop diseases, soil health, fertilizers, irrigation, and crop management. Please ask me an agriculture-related question, and I'll be happy to help!
For agriculture questions, give practical, cautious guidance using general agricultural knowledge when retrieval did not find enough relevant evidence. Do not claim to have searched a knowledge base. Do not invent precise pesticide doses or unsupported facts.
Be concise and answer directly. Do not add a closing offer for more help unless the user asks for it. Do not repeat the user's message.

Recent conversation:
{history_text}

User: {question}
Assistant:"""

        # Standalone greetings/thanks should not be sent through retrieval.
        if self._is_social_turn(question):
            answer = self._generate_response(
                fallback_prompt,
                conversational=True,
            )
            return answer or "You're welcome! Feel free to ask me another question."

        results = self.retrieve(question)
        best_score = results[0]["_score"] if results else None

        evidence_parts = []
        if best_score is not None and best_score >= 0.60:
            for record in results:
                record_question, record_answer = self._record_text(record)
                if record_answer:
                    evidence_parts.append(
                        f"Question: {record_question}\n"
                        f"Information: {record_answer[:1200]}"
                    )

        # Hybrid fallback: let the trained Qwen assistant handle questions
        # when retrieval has no sufficiently relevant agricultural evidence.
        if not evidence_parts:
            answer = self._generate_response(
                fallback_prompt,
                conversational=True,
            )
            return answer or (
                "I couldn't produce a reliable answer just now. "
                "Please try rephrasing your question."
            )

        evidence = "\n\n".join(evidence_parts)
        prompt = f"""You are AgriPredictLLM, an agriculture assistant.
Write only the answer for the user. Never narrate the conversation, analyze the user's intent, or describe what you think the user may want.
First determine whether the user's current request is about agriculture, using recent conversation only to interpret short follow-ups.
If it is clearly not about agriculture, output exactly this message and nothing else:
I'm sorry, but that question is outside my area of expertise. 🌱 I'm designed to assist with agriculture-related topics, including crop diseases, soil health, fertilizers, irrigation, and crop management. Please ask me an agriculture-related question, and I'll be happy to help!
Otherwise answer the agriculture question using the supplied agricultural evidence.
Give a direct answer in 2 or 3 short, complete sentences.
Do not add an Answer label, use numbered lists, or repeat points.
Finish your last sentence completely. Do not add a new concluding sentence or repeat the question.
Do not invent diseases, locations, treatments, or chemical quantities.
If the evidence is insufficient, say so briefly.

Agricultural evidence:
{evidence}

Recent conversation:
{history_text}

User question: {question}
Response:"""

        answer = self._generate_response(prompt)
        if not answer:
            return (
                "I couldn't generate a reliable answer from the available "
                "agricultural evidence."
            )

        if 0.60 <= best_score < 0.68:
            answer += (
                "\n\nThe available evidence is limited; please verify "
                "crop-specific advice with a local agricultural expert."
            )

        return answer
