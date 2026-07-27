import os
import time
from datetime import datetime, timezone
 
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
 
from app.db.database import get_db
from app.core.config import settings
 
router = APIRouter(prefix="/health", tags=["HEALTH"])
 
_start_time = time.monotonic()
 
 
@router.get("/")
def liveness():
    """Liveness check -- confirms the process is up and responsive.
    Deliberately checks nothing external (DB, disk), so it stays fast and
    won't false-positive-fail just because a dependency is briefly down.
    Point your container orchestrator's liveness probe at this."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "uptime_seconds": round(time.monotonic() - _start_time, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
 
 
@router.get("/ready")
def readiness(db: Session = Depends(get_db)):
    """Readiness check -- confirms the app can actually serve traffic
    (its database dependency is reachable). Point your orchestrator's
    readiness probe / load balancer health check at this -- a 503 here
    should pull the instance out of rotation."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable", "detail": f"Database unreachable: {e}"},
        )
 
    return {"status": "ready"}
 
 
@router.get("/db")
def database_health(db: Session = Depends(get_db)):
    """Database-specific health: connectivity + whether the pgvector
    extension (required for embeddings and semantic search) is actually
    installed in this database."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable", "connected": False, "detail": str(e)},
        )
 
    try:
        result = db.execute(
            text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ).first()
        pgvector_installed = result is not None
        pgvector_version = result[0] if result else None
    except SQLAlchemyError:
        pgvector_installed = False
        pgvector_version = None
 
    return {
        "status": "ok" if pgvector_installed else "degraded",
        "connected": True,
        "pgvector_installed": pgvector_installed,
        "pgvector_version": pgvector_version,
    }
 
 
@router.get("/detailed")
def detailed_health(db: Session = Depends(get_db)):
    """Aggregated diagnostic snapshot: DB connectivity, pgvector extension,
    uploads directory writability, and basic row counts. This does more
    work than liveness/readiness, so don't poll it frequently -- it's for
    a status dashboard or manual debugging, not a load balancer probe."""
    checks: dict = {}
 
    # database connectivity
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok"}
    except SQLAlchemyError as e:
        checks["database"] = {"status": "error", "detail": str(e)}
 
    # pgvector extension
    try:
        result = db.execute(
            text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
        ).first()
        checks["pgvector"] = (
            {"status": "ok", "version": result[0]}
            if result
            else {"status": "missing", "detail": "Run: CREATE EXTENSION vector;"}
        )
    except SQLAlchemyError as e:
        checks["pgvector"] = {"status": "error", "detail": str(e)}
 
    # uploads directory
    upload_dir = settings.upload_dir
    if os.path.isdir(upload_dir) and os.access(upload_dir, os.W_OK):
        checks["upload_dir"] = {"status": "ok", "path": os.path.abspath(upload_dir)}
    else:
        checks["upload_dir"] = {
            "status": "error",
            "path": os.path.abspath(upload_dir),
            "detail": "Directory missing or not writable",
        }
 
    # row counts (best-effort -- skip gracefully if tables aren't migrated yet)
    try:
        from app.models.document import Document
        from app.models.user import Users
 
        checks["counts"] = {
            "status": "ok",
            "documents": db.query(Document).count(),
            "users": db.query(Users).count(),
        }
    except SQLAlchemyError as e:
        checks["counts"] = {"status": "error", "detail": str(e)}
 
    overall_ok = all(
        c.get("status") == "ok"
        for c in checks.values()
        if isinstance(c, dict) and "status" in c
    )
 
    return {
        "status": "ok" if overall_ok else "degraded",
        "app": settings.app_name,
        "environment": settings.app_env,
        "checks": checks,
    }
 