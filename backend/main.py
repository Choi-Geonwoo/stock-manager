import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from middlewares import LoggingMiddleware
from routers.balance import router as balance_router
from routers.bank import router as bank_router
from routers.calendar import router as calendar_router
from routers.dividend import router as dividend_router
from routers.nation import router as nation_router
from routers.stock import router as stock_router
from routers.trade import router as trade_router

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

app = FastAPI()

app.add_middleware(LoggingMiddleware)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## 파일 미리보기
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.include_router(bank_router)
app.include_router(nation_router)
app.include_router(stock_router)
app.include_router(trade_router)
app.include_router(dividend_router)
app.include_router(calendar_router)
app.include_router(balance_router)