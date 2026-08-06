from pydantic import BaseModel


class DailyCount(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class DocumentStatsResponse(BaseModel):
    total: int
    vectorized: int
    processing: int  # anything not vectorized/failed -- still mid-pipeline
    failed: int
    daily_counts: list[DailyCount]
