import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.config import settings
from app.agent import run_agent

app = FastAPI(title="CollabBoard AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiting (per-board, in-memory) ──────────────────────────────────────
RATE_LIMIT = 10  # max requests per window
RATE_WINDOW = 60  # seconds

_rate_buckets: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(board_id: str) -> None:
    now = time.time()
    bucket = _rate_buckets[board_id]
    # Prune old entries
    _rate_buckets[board_id] = [t for t in bucket if now - t < RATE_WINDOW]
    if len(_rate_buckets[board_id]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {RATE_LIMIT} AI commands per minute per board. Please wait.",
        )
    _rate_buckets[board_id].append(now)


# ── Routes ────────────────────────────────────────────────────────────────────

class AICommandRequest(BaseModel):
    board_id: str
    message: str


class AICommandResponse(BaseModel):
    response: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/ai/command", response_model=AICommandResponse)
async def ai_command(req: AICommandRequest):
    if not req.board_id or not req.message:
        raise HTTPException(status_code=400, detail="board_id and message are required")

    _check_rate_limit(req.board_id)

    try:
        result = await run_agent(req.board_id, req.message)
        return AICommandResponse(response=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
