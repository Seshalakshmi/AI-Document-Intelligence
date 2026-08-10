from pydantic import BaseModel


class DailyCount(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class DocumentStatsResponse(BaseModel):
    total: int
    vectorized: int
    processing: int
    failed: int
    average_confidence: float | None = None
    daily_counts: list[DailyCount]
    average_confidence: float | None = None
