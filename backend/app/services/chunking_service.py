def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[dict]:
    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        end = start + chunk_size
        content = text[start:end]

        chunks.append({
            "chunk_index": chunk_index,
            "content": content,
            "start_char": start,
            "end_char": min(end, len(text)),
            "token_count": len(content.split())
        })

        chunk_index += 1
        start = end - overlap

    return chunks