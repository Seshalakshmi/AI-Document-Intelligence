from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["HEALTH"])

@router.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Invoice Dcoument Intelligence"
    }
