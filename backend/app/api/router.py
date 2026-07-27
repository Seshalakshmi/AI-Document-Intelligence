from fastapi import APIRouter
from app.api.routes import user, documents, search, health, auth

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(documents.router)
api_router.include_router(search.router)
api_router.include_router(health.router)