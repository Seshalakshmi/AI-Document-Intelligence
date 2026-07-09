from app.api.router import api_router
from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=True,
)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to AI Intelligent Platform"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=5002, reload=True)

# run python -m app.main
