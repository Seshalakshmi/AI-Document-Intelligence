from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.core.config import embedding_model_name


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    """
    Loads the embedding model only once.

    Without caching, the model would reload every time we call the function,
    which would be very slow.
    """
    return SentenceTransformer(embedding_model_name)


def create_embedding(text: str) -> list[float]:
    """
    Converts one text into one embedding vector.
    """
    model = get_embedding_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()


def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Converts many texts into embedding vectors.
    """
    model = get_embedding_model()

    embeddings = model.encode(
        texts,
        normalize_embeddings=True
    )

    return embeddings.tolist()