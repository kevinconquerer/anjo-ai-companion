"""fastembed wrapper for dual embeddings (semantic + emotional)."""
from __future__ import annotations

from functools import lru_cache

from fastembed import TextEmbedding

_SEMANTIC_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Emotional phrasing prefix nudges the model toward affective dimensions
_EMOTIONAL_PREFIX = "This is how this conversation felt emotionally: "


@lru_cache(maxsize=1)
def _get_model() -> TextEmbedding:
    try:
        return TextEmbedding(_SEMANTIC_MODEL)
    except Exception as exc:
        raise RuntimeError(f"Failed to load embedding model '{_SEMANTIC_MODEL}': {exc}") from exc


def embed_semantic(text: str) -> list[float]:
    """Embed text for semantic/topical similarity."""
    if not isinstance(text, str):
        raise TypeError(f"text must be str, got {type(text).__name__}")
    return next(_get_model().embed([text])).tolist()


def embed_emotional(text: str) -> list[float]:
    """Embed text with an emotional framing prefix."""
    if not isinstance(text, str):
        raise TypeError(f"text must be str, got {type(text).__name__}")
    return next(_get_model().embed([_EMOTIONAL_PREFIX + text])).tolist()
