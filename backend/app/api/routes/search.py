# / search ({message})
# / semantic_search ({message})
# / search_similar_document_id ({message_id})
# / search_duplicated_document ({message_id})
from fastapi import APIRouter

router = APIRouter(prefix="/search", tags=["SEARCH"])

@router.get("/")
def search():
    return {
        "status": "ok",
        "message": "Implemention search"
    }


@router.get("/")
def semantic_search():
    return {
        "status": "ok",
        "message": "semantic search"
    }

@router.get("/{document_id}")
def search_similar_document_id(document_id: int):
    return {
        "status": "ok",
        "message": "search similar documents by document_id"
    }

@router.get("/{document_id}")
def search_duplicated_document(document_id: int):
    return {
        "status": "ok",
        "message": "search duplicated document"
    }