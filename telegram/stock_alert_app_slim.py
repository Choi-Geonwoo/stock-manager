# -*- coding: utf-8 -*-
"""
stock_alert_app_sqlite_redesign.py

주가/환율 조회 및 텔레그램 전송 기능을 가진 tkinter GUI 데스크톱 앱
- 파스텔 톤의 카드형 UI
- SQLite 종목 목록 저장
- SQLite 텔레그램 발송 이력 저장
- 발송 이력 조회/삭제s
"""

from __future__ import annotations

import os
import queue
import sqlite3
import threading
import json
import tkinter as tk
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from tkinter import messagebox, ttk
from typing import List, Optional, Tuple

import FinanceDataReader as fdr
import pandas as pd
import requests
import yfinance as yf
from dotenv import find_dotenv, load_dotenv, set_key


# =========================================================
# 0. 환경설정
# =========================================================
ENV_PATH = find_dotenv(usecwd=True) or os.path.join(os.getcwd(), ".env")
if not os.path.exists(ENV_PATH):
    open(ENV_PATH, "a", encoding="utf-8").close()
load_dotenv(ENV_PATH)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "stocks.db")
EXPORT_DIR = os.path.join(BASE_DIR, "reports")

KST = timezone(timedelta(hours=9))
REQUEST_TIMEOUT = 10


# =========================================================
# 1. 데이터 모델
# =========================================================
class Market(str, Enum):
    KR = "kr"
    US = "us"


@dataclass
class Stock:
    code: str
    name: str
    market: Market

    @property
    def currency(self) -> str:
        return "원" if self.market is Market.KR else "$"

    def format_price(self, price: float) -> str:
        return f"{price:,.0f}" if self.market is Market.KR else f"{price:,.2f}"


# =========================================================
# 2. SQLite
# =========================================================
def init_db() -> None:
    """SQLite DB와 필요한 테이블을 생성합니다."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS stocks (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                market TEXT NOT NULL CHECK (market IN ('kr', 'us'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS send_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sent_at TEXT NOT NULL,
                send_type TEXT NOT NULL,
                success INTEGER NOT NULL DEFAULT 0,
                message TEXT NOT NULL,
                report TEXT,
                exchange_rate REAL,
                stock_count INTEGER NOT NULL DEFAULT 0,
                detail_json TEXT
            )
            """
        )
        conn.commit()


def load_stock_list() -> List[Stock]:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT code, name, market FROM stocks ORDER BY rowid"
        ).fetchall()

    if not rows:
        default_stocks = [
            Stock("AAPL", "애플", Market.US),
            Stock("005930", "삼성전자", Market.KR),
            Stock("498400", "KODEX 200타겟위클리커버드콜", Market.KR),
        ]
        save_stock_list(default_stocks)
        return default_stocks

    return [Stock(code, name, Market(market)) for code, name, market in rows]


def save_stock_list(stocks: List[Stock]) -> None:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM stocks")
        conn.executemany(
            "INSERT INTO stocks (code, name, market) VALUES (?, ?, ?)",
            [(s.code, s.name, s.market.value) for s in stocks],
        )
        conn.commit()


def save_send_history(
    send_type: str,
    success: bool,
    message: str,
    report: str,
    exchange_rate: float = 0.0,
    details: Optional[list] = None,
) -> int:
    """텔레그램 발송 결과와 당시 조회된 종목별 상세 내역을 저장하고,
    저장된 이력의 id를 반환합니다(자동 엑셀 내보내기에 사용)."""
    init_db()

    detail_json = json.dumps(
        details or [],
        ensure_ascii=False,
    )

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            """
            INSERT INTO send_history
                (
                    sent_at,
                    send_type,
                    success,
                    message,
                    report,
                    exchange_rate,
                    stock_count,
                    detail_json
                )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S"),
                send_type,
                1 if success else 0,
                message,
                report,
                exchange_rate,
                len(details or []),
                detail_json,
            ),
        )
        conn.commit()
        return cursor.lastrowid


def load_send_history(limit: int = 200):
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            """
            SELECT
                id,
                sent_at,
                send_type,
                success,
                message,
                exchange_rate,
                stock_count,
                detail_json,
                report
            FROM send_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()


def load_send_history_detail(history_id: int):
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            """
            SELECT
                id,
                sent_at,
                send_type,
                success,
                message,
                exchange_rate,
                stock_count,
                detail_json,
                report
            FROM send_history
            WHERE id = ?
            """,
            (history_id,),
        ).fetchone()


def export_send_history_to_excel(history_id: int, output_dir: str = EXPORT_DIR) -> str:
    """
    발송 이력 전체 목록과, 이번에 발송된 건의 종목별 상세 내역을 엑셀(xlsx)로 저장합니다.

    - 시트1 "발송이력": 전체 발송 이력 요약
    - 시트2 "상세내역": history_id에 해당하는 발송 건의 종목별 상세 내역

    반환값은 생성된 엑셀 파일의 경로입니다.
    엑셀 저장에는 openpyxl 패키지가 필요합니다(pip install openpyxl).
    """
    os.makedirs(output_dir, exist_ok=True)

    rows = load_send_history(limit=1000)
    summary_df = pd.DataFrame(
        rows,
        columns=[
            "번호",
            "발송시각",
            "구분",
            "성공여부",
            "메시지",
            "환율",
            "종목수",
            "상세JSON",
            "리포트원문",
        ],
    )
    if not summary_df.empty:
        summary_df["성공여부"] = summary_df["성공여부"].map({1: "성공", 0: "실패"})
    summary_df = summary_df.drop(columns=["상세JSON", "리포트원문"], errors="ignore")

    detail_row = load_send_history_detail(history_id)
    detail_records = []
    if detail_row:
        try:
            detail_records = json.loads(detail_row[7] or "[]")
        except Exception:
            detail_records = []
    detail_df = pd.DataFrame(detail_records)

    now_str = datetime.now(KST).strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(output_dir, f"send_history_{now_str}.xlsx")

    with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="발송이력", index=False)
        if not detail_df.empty:
            detail_df.to_excel(writer, sheet_name="상세내역", index=False)

    return filepath


def load_app_setting(key: str, default):
    """app_settings 테이블에서 JSON으로 저장된 설정값을 불러옵니다."""
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT value FROM app_settings WHERE key = ?", (key,)
        ).fetchone()

    if not row:
        return default

    try:
        return json.loads(row[0])
    except Exception:
        return default


def save_app_setting(key: str, value) -> None:
    """설정값을 JSON으로 직렬화해 app_settings 테이블에 저장(upsert)합니다."""
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO app_settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, json.dumps(value, ensure_ascii=False)),
        )
        conn.commit()


# =========================================================
# 2.5 크론 스타일 스케줄 유틸리티
# =========================================================
# 종목 현재가 조회와 배당 조회는 서로 다른 주기로 동작해야 하므로,
# 각 작업마다 "초/분/시/일/요일"을 독립적으로 지정할 수 있는
# 경량 크론 파서를 제공합니다.
#
# 지원 문법 (필드 하나 기준):
#   *          모든 값
#   */N        N 간격 (예: 분 필드에 */10 -> 0,10,20,30,40,50)
#   a-b        범위 (예: 시 필드에 9-18)
#   a-b/N      범위 + 간격
#   a,b,c      콤마로 여러 조건 조합 가능 (위 표현들을 섞어서 사용 가능)
#
# 요일 필드는 0~7 범위이며 0과 7은 모두 일요일을 의미합니다
# (1=월, 2=화, 3=수, 4=목, 5=금, 6=토).

# 국내(KR) 장과 미국(US) 장은 운영 시간대가 다르므로(예: 한국 09~15:30,
# 미국은 한국시간 기준 야간) 발송 스케줄을 시장별로 따로 둡니다.
DEFAULT_PRICE_SCHEDULE_KR = {
    "enabled": False,
    "sec": "0",
    "minute": "*/10",
    "hour": "9-15",
    "day": "*",
    "weekday": "1-5",
}

DEFAULT_PRICE_SCHEDULE_US = {
    "enabled": False,
    "sec": "0",
    "minute": "*/10",
    "hour": "23,0-6",
    "day": "*",
    "weekday": "1-6",
}

DEFAULT_DIVIDEND_SCHEDULE_KR = {
    "enabled": False,
    "sec": "0",
    "minute": "0",
    "hour": "9",
    "day": "*",
    "weekday": "1-5",
}

DEFAULT_DIVIDEND_SCHEDULE_US = {
    "enabled": False,
    "sec": "0",
    "minute": "0",
    "hour": "22",
    "day": "*",
    "weekday": "1-5",
}


def parse_cron_field(expr: str, min_v: int, max_v: int) -> set:
    """cron 스타일 필드 문자열을 파싱해 허용되는 정수 집합을 반환합니다."""
    expr = (expr or "*").strip()
    if not expr:
        expr = "*"

    values: set = set()

    for part in expr.split(","):
        part = part.strip()
        if not part:
            continue

        step = 1
        if "/" in part:
            part, step_str = part.split("/", 1)
            part = part.strip()
            try:
                step = int(step_str)
            except ValueError:
                raise ValueError(f"잘못된 간격 값입니다: {step_str}")
            if step <= 0:
                raise ValueError("간격 값은 1 이상이어야 합니다.")

        if part == "*":
            start, end = min_v, max_v
        elif "-" in part:
            a, b = part.split("-", 1)
            try:
                start, end = int(a), int(b)
            except ValueError:
                raise ValueError(f"잘못된 범위입니다: {part}")
        else:
            try:
                start = end = int(part)
            except ValueError:
                raise ValueError(f"잘못된 값입니다: {part}")

        if start > end:
            raise ValueError(f"잘못된 범위입니다: {part}")
        if start < min_v or end > max_v:
            raise ValueError(
                f"값은 {min_v}~{max_v} 범위 안에 있어야 합니다: {part}"
            )

        values.update(range(start, end + 1, step))

    if not values:
        raise ValueError("최소 하나 이상의 값이 필요합니다.")

    return values


def cron_matches(dt: datetime, schedule: dict) -> bool:
    """주어진 시각이 스케줄(초/분/시/일/요일) 조건에 맞는지 확인합니다."""
    try:
        sec_set = parse_cron_field(schedule.get("sec", "*"), 0, 59)
        min_set = parse_cron_field(schedule.get("minute", "*"), 0, 59)
        hour_set = parse_cron_field(schedule.get("hour", "*"), 0, 23)
        day_set = parse_cron_field(schedule.get("day", "*"), 1, 31)
        weekday_set = {
            v % 7
            for v in parse_cron_field(schedule.get("weekday", "*"), 0, 7)
        }
    except ValueError:
        return False

    cron_weekday = dt.isoweekday() % 7  # 월=1 ... 토=6, 일=0

    return (
        dt.second in sec_set
        and dt.minute in min_set
        and dt.hour in hour_set
        and dt.day in day_set
        and cron_weekday in weekday_set
    )


# =========================================================
# 3. 네트워크/API
# =========================================================
def get_exchange_rate() -> float:
    try:
        start = datetime.today() - timedelta(days=7)
        df = fdr.DataReader("USD/KRW", start)
        if df is not None and not df.empty:
            return float(df["Close"].iloc[-1])
    except Exception:
        pass
    return 0.0


def is_domestic_etf(stock: Stock) -> bool:
    """국내 ETF는 배당 알림 대상에서 제외합니다."""
    if stock.market is not Market.KR:
        return False

    name = (stock.name or "").upper().strip()
    etf_keywords = (
        "KODEX", "TIGER", "ACE", "RISE", "KBSTAR", "SOL", "HANARO",
        "ARIRANG", "KOSEF", "TIMEFOLIO", "PLUS", "KIWOOM", "WON",
        "1Q", "WOORI", "HK", "파워", "마이티", "히어로즈",
    )
    return any(name.startswith(keyword) for keyword in etf_keywords)


def get_today_dividend(stock: Stock) -> Optional[dict]:
    """
    오늘이 실제 배당 지급일(pay date)인 경우에만 배당 정보를 반환합니다.

    Finnhub Dividend Calendar을 사용하며, 국내 ETF는 명시적으로 제외합니다.
    FINNHUB_API_KEY가 없거나 해당 종목의 지급일 데이터가 없으면 None을 반환합니다.
    """
    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key or is_domestic_etf(stock):
        return None

    today = datetime.now(KST).date()
    candidates = [stock.code]

    if stock.market is Market.KR:
        candidates.extend([f"{stock.code}.KS", f"{stock.code}.KQ"])

    for symbol in candidates:
        try:
            response = requests.get(
                "https://finnhub.io/api/v1/stock/dividend",
                params={
                    "symbol": symbol,
                    "from": today.isoformat(),
                    "to": today.isoformat(),
                    "token": api_key,
                },
                timeout=REQUEST_TIMEOUT,
            )
            if response.status_code != 200:
                continue

            data = response.json()
            if not isinstance(data, list):
                continue

            for item in data:
                pay_date = (
                    item.get("payDate")
                    or item.get("paymentDate")
                    or item.get("payment_date")
                )
                if not pay_date:
                    continue

                if str(pay_date)[:10] != today.isoformat():
                    continue

                amount = item.get("amount")
                if amount is None:
                    amount = item.get("adjustedAmount")

                if amount is None:
                    continue

                try:
                    amount = float(amount)
                except (TypeError, ValueError):
                    continue

                currency = "원" if stock.market is Market.KR else "$"
                return {
                    "amount": amount,
                    "currency": currency,
                    "payment_date": today.isoformat(),
                    "symbol": symbol,
                }
        except Exception:
            continue

    return None


def fetch_stock_prices(
    stock: Stock,
) -> Tuple[Optional[float], Optional[float]]:
    try:
        start = datetime.today() - timedelta(days=10)

        if stock.market is Market.KR:
            df = fdr.DataReader(stock.code, start)
            series = (
                df["Close"]
                if df is not None and not df.empty and "Close" in df.columns
                else None
            )
        else:
            df = yf.download(stock.code, start=start, progress=False)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            series = (
                df["Close"]
                if df is not None and not df.empty and "Close" in df.columns
                else None
            )

        if series is None or series.empty:
            return None, None

        latest = float(series.iloc[-1])
        prev = float(series.iloc[-2]) if len(series) >= 2 else None
        return latest, prev
    except Exception:
        return None, None


def send_telegram_message(
    token: str,
    chat_id: str,
    text: str,
) -> Tuple[bool, str]:
    if not token or not chat_id:
        return False, "봇 토큰 또는 챗 ID가 설정되지 않았습니다."

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    chunk_size = 3800

    try:
        for i in range(0, len(text), chunk_size):
            chunk = text[i : i + chunk_size]
            resp = requests.post(
                url,
                json={"chat_id": chat_id, "text": chunk},
                timeout=REQUEST_TIMEOUT,
            )
            if resp.status_code != 200:
                return (
                    False,
                    f"전송 실패 (HTTP {resp.status_code}): {resp.text[:200]}",
                )
        return True, "전송 완료"
    except Exception as e:
        return False, f"전송 오류: {e}"


# =========================================================
# 4. 텔레그램 설정
# =========================================================
class SettingsDialog(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("텔레그램 설정")
        self.geometry("520x285")
        self.resizable(False, False)
        self.configure(bg="#FFFDF8")
        self.transient(parent)
        self.grab_set()

        self.token_var = tk.StringVar(
            value=os.getenv("TELEGRAM_BOT_TOKEN", "")
        )
        self.chat_id_var = tk.StringVar(
            value=os.getenv("TELEGRAM_CHAT_ID", "")
        )
        self.finnhub_key_var = tk.StringVar(
            value=os.getenv("FINNHUB_API_KEY", "")
        )
        self.saved = False

        frame = tk.Frame(self, bg="#FFFDF8", padx=24, pady=20)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame,
            text="텔레그램 설정",
            font=("Malgun Gothic", 16, "bold"),
            bg="#FFFDF8",
            fg="#263238",
        ).pack(anchor="w")

        tk.Label(
            frame,
            text="봇 토큰과 챗 ID를 입력하면 발송할 수 있습니다.",
            font=("Malgun Gothic", 9),
            bg="#FFFDF8",
            fg="#78909C",
        ).pack(anchor="w", pady=(3, 14))

        self._field(frame, "봇 토큰", self.token_var, show="*")
        self._field(frame, "챗 ID", self.chat_id_var)
        self._field(frame, "Finnhub API", self.finnhub_key_var, show="*")

        buttons = tk.Frame(frame, bg="#FFFDF8")
        buttons.pack(fill="x", pady=(14, 0))

        ttk.Button(
            buttons, text="취소", command=self.destroy, style="Soft.TButton"
        ).pack(side="right")
        ttk.Button(
            buttons, text="저장", command=self.on_save, style="Primary.TButton"
        ).pack(side="right", padx=(0, 7))

    def _field(self, parent, label, variable, show=None):
        row = tk.Frame(parent, bg="#FFFDF8")
        row.pack(fill="x", pady=4)

        tk.Label(
            row,
            text=label,
            width=9,
            anchor="w",
            font=("Malgun Gothic", 9, "bold"),
            bg="#FFFDF8",
            fg="#455A64",
        ).pack(side="left")

        entry = ttk.Entry(row, textvariable=variable, show=show or "")
        entry.pack(side="left", fill="x", expand=True)

    def on_save(self):
        self.saved = True
        self.destroy()


class ScheduleDialog(tk.Toplevel):
    """
    종목 현재가 조회 / 배당 조회를 국내(KR)·미국(US) 시장별로 각각
    독립적인 초·분·시·일·요일 스케줄로 예약합니다.

    국내 장과 미국 장은 운영 시간대가 다르기 때문에(예: 국내 09~15:30,
    미국은 한국시간 기준 야간) 발송 시각을 시장별로 따로 지정할 수 있습니다.
    """

    FIELD_INFO = [
        ("sec", "초", "0-59"),
        ("minute", "분", "0-59"),
        ("hour", "시", "0-23"),
        ("day", "일", "1-31"),
        ("weekday", "요일", "0-7(0,7=일)"),
    ]

    BOUNDS = {
        "sec": (0, 59),
        "minute": (0, 59),
        "hour": (0, 23),
        "day": (1, 31),
        "weekday": (0, 7),
    }

    def __init__(
        self,
        parent,
        price_schedule_kr: dict,
        price_schedule_us: dict,
        dividend_schedule_kr: dict,
        dividend_schedule_us: dict,
    ):
        super().__init__(parent)
        self.title("스케줄 설정")
        self.geometry("620x560")
        self.resizable(False, False)
        self.configure(bg="#FFFDF8")
        self.transient(parent)
        self.grab_set()

        self.saved = False

        # 결과로 반환될 4개 스케줄(입력값)
        self.price_schedule_kr = dict(price_schedule_kr)
        self.price_schedule_us = dict(price_schedule_us)
        self.dividend_schedule_kr = dict(dividend_schedule_kr)
        self.dividend_schedule_us = dict(dividend_schedule_us)

        (
            self.price_kr_enabled_var,
            self.price_kr_vars,
        ) = self._make_vars(self.price_schedule_kr)
        (
            self.price_us_enabled_var,
            self.price_us_vars,
        ) = self._make_vars(self.price_schedule_us)
        (
            self.dividend_kr_enabled_var,
            self.dividend_kr_vars,
        ) = self._make_vars(self.dividend_schedule_kr)
        (
            self.dividend_us_enabled_var,
            self.dividend_us_vars,
        ) = self._make_vars(self.dividend_schedule_us)

        frame = tk.Frame(self, bg="#FFFDF8", padx=22, pady=18)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame,
            text="스케줄 설정",
            font=("Malgun Gothic", 15, "bold"),
            bg="#FFFDF8",
            fg="#263238",
        ).pack(anchor="w")

        tk.Label(
            frame,
            text=(
                "국내·미국 시장을 각각 다른 시각에 발송할 수 있습니다. "
                "cron 형식 예) 분: */10 (10분마다), 시: 9-15 (9시~15시), "
                "요일: 1-5 (평일)"
            ),
            font=("Malgun Gothic", 8),
            bg="#FFFDF8",
            fg="#78909C",
            justify="left",
            wraplength=560,
        ).pack(anchor="w", pady=(3, 12))

        notebook = ttk.Notebook(frame)
        notebook.pack(fill="both", expand=True)

        price_tab = tk.Frame(notebook, bg="#FFFDF8")
        dividend_tab = tk.Frame(notebook, bg="#FFFDF8")
        notebook.add(price_tab, text="  종목 현재가 조회  ")
        notebook.add(dividend_tab, text="  오늘 배당 조회  ")

        self._build_schedule_section(
            price_tab, "국내(KR)", self.price_kr_enabled_var, self.price_kr_vars
        )
        self._build_schedule_section(
            price_tab, "미국(US)", self.price_us_enabled_var, self.price_us_vars
        )
        self._build_schedule_section(
            dividend_tab,
            "국내(KR)",
            self.dividend_kr_enabled_var,
            self.dividend_kr_vars,
        )
        self._build_schedule_section(
            dividend_tab,
            "미국(US)",
            self.dividend_us_enabled_var,
            self.dividend_us_vars,
        )

        buttons = tk.Frame(frame, bg="#FFFDF8")
        buttons.pack(fill="x", pady=(14, 0))

        ttk.Button(
            buttons, text="취소", command=self.destroy, style="Soft.TButton"
        ).pack(side="right")
        ttk.Button(
            buttons, text="저장", command=self.on_save, style="Primary.TButton"
        ).pack(side="right", padx=(0, 7))

    def _make_vars(self, schedule: dict):
        enabled_var = tk.BooleanVar(value=schedule.get("enabled", False))
        field_vars = {
            key: tk.StringVar(value=str(schedule.get(key, "*")))
            for key, _label, _hint in self.FIELD_INFO
        }
        return enabled_var, field_vars

    def _build_schedule_section(self, parent, title, enabled_var, field_vars):
        section = tk.Frame(
            parent,
            bg="#FFFFFF",
            highlightbackground="#E3E9EF",
            highlightthickness=1,
        )
        section.pack(fill="x", padx=4, pady=(10, 4))

        top = tk.Frame(section, bg="#FFFFFF")
        top.pack(fill="x", padx=14, pady=(10, 4))

        tk.Label(
            top,
            text=title,
            font=("Malgun Gothic", 10, "bold"),
            bg="#FFFFFF",
            fg="#263238",
        ).pack(side="left")

        ttk.Checkbutton(top, text="사용", variable=enabled_var).pack(side="right")

        row = tk.Frame(section, bg="#FFFFFF")
        row.pack(fill="x", padx=14, pady=(0, 12))

        for key, label, hint in self.FIELD_INFO:
            col = tk.Frame(row, bg="#FFFFFF")
            col.pack(side="left", padx=(0, 10))

            tk.Label(
                col,
                text=label,
                font=("Malgun Gothic", 8, "bold"),
                bg="#FFFFFF",
                fg="#546E7A",
            ).pack(anchor="w")

            ttk.Entry(
                col, textvariable=field_vars[key], width=9
            ).pack(anchor="w")

            tk.Label(
                col,
                text=hint,
                font=("Malgun Gothic", 7),
                bg="#FFFFFF",
                fg="#B0BEC5",
            ).pack(anchor="w")

    def on_save(self):
        try:
            price_kr = self._collect(self.price_kr_vars, self.price_kr_enabled_var)
            price_us = self._collect(self.price_us_vars, self.price_us_enabled_var)
            dividend_kr = self._collect(
                self.dividend_kr_vars, self.dividend_kr_enabled_var
            )
            dividend_us = self._collect(
                self.dividend_us_vars, self.dividend_us_enabled_var
            )
        except ValueError as e:
            messagebox.showerror("입력 오류", str(e))
            return

        self.price_schedule_kr = price_kr
        self.price_schedule_us = price_us
        self.dividend_schedule_kr = dividend_kr
        self.dividend_schedule_us = dividend_us
        self.saved = True
        self.destroy()

    def _collect(self, field_vars, enabled_var) -> dict:
        result = {"enabled": enabled_var.get()}
        for key, var in field_vars.items():
            expr = var.get().strip() or "*"
            min_v, max_v = self.BOUNDS[key]
            # 저장 전 유효성 검증 - 문제가 있으면 ValueError가 발생해 위로 전달됩니다.
            parse_cron_field(expr, min_v, max_v)
            result[key] = expr
        return result


# =========================================================
# 5. 메인 GUI
# =========================================================
class StockApp(tk.Tk):
    COLUMNS = ("code", "name", "market", "price", "change", "pct", "updated")

    BG = "#F5F7FB"
    CARD = "#FFFFFF"
    TEXT = "#263238"
    SUBTEXT = "#78909C"
    PRIMARY = "#8FAFD1"
    PRIMARY_DARK = "#668FB9"
    BORDER = "#E3E9EF"
    SUCCESS = "#6FAF8F"
    DANGER = "#D98282"

    def __init__(self):
        super().__init__()

        init_db()

        self.title("주가 · 배당 알리미")
        self.geometry("1080x700")
        self.minsize(920, 620)
        self.configure(bg=self.BG)

        self.stocks: List[Stock] = load_stock_list()
        self.result_queue: queue.Queue = queue.Queue()
        self.exchange_rate = 0.0
        self.last_report_text = ""
        self.busy = False

        # 종목 현재가 조회 / 배당 조회는 국내(KR)·미국(US) 시장별로
        # 서로 다른 크론 스케줄로 동작합니다.
        self.price_schedule_kr: dict = load_app_setting(
            "price_schedule_kr", dict(DEFAULT_PRICE_SCHEDULE_KR)
        )
        self.price_schedule_us: dict = load_app_setting(
            "price_schedule_us", dict(DEFAULT_PRICE_SCHEDULE_US)
        )
        self.dividend_schedule_kr: dict = load_app_setting(
            "dividend_schedule_kr", dict(DEFAULT_DIVIDEND_SCHEDULE_KR)
        )
        self.dividend_schedule_us: dict = load_app_setting(
            "dividend_schedule_us", dict(DEFAULT_DIVIDEND_SCHEDULE_US)
        )
        self._price_kr_last_fired: Optional[str] = None
        self._price_us_last_fired: Optional[str] = None
        self._dividend_kr_last_fired: Optional[str] = None
        self._dividend_us_last_fired: Optional[str] = None
        self.scheduler_job: Optional[str] = None

        self._setup_style()
        self._build_widgets()
        self._reload_stock_table()

        self.after(200, self._poll_queue)
        self.scheduler_job = self.after(1000, self._tick_scheduler)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # -----------------------------------------------------
    # Style
    # -----------------------------------------------------
    def _setup_style(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        style.configure(
            ".",
            font=("Malgun Gothic", 9),
            background=self.BG,
            foreground=self.TEXT,
        )
        style.configure(
            "TButton",
            padding=(12, 7),
            relief="flat",
            borderwidth=0,
        )
        style.configure(
            "Primary.TButton",
            background=self.PRIMARY,
            foreground="#FFFFFF",
            font=("Malgun Gothic", 9, "bold"),
        )
        style.map(
            "Primary.TButton",
            background=[("active", self.PRIMARY_DARK)],
        )
        style.configure(
            "Soft.TButton",
            background="#EDF2F7",
            foreground="#455A64",
        )
        style.map(
            "Soft.TButton",
            background=[("active", "#E2EAF2")],
        )
        style.configure(
            "Danger.TButton",
            background="#F7E6E6",
            foreground="#9B4D4D",
        )
        style.configure(
            "Treeview",
            background="#FFFFFF",
            fieldbackground="#FFFFFF",
            foreground=self.TEXT,
            rowheight=34,
            borderwidth=0,
            font=("Malgun Gothic", 9),
        )
        style.configure(
            "Treeview.Heading",
            background="#EEF3F8",
            foreground="#546E7A",
            relief="flat",
            padding=8,
            font=("Malgun Gothic", 9, "bold"),
        )
        style.map(
            "Treeview",
            background=[("selected", "#DDEAF6")],
            foreground=[("selected", self.TEXT)],
        )
        style.configure(
            "TNotebook",
            background=self.BG,
            borderwidth=0,
        )
        style.configure(
            "TNotebook.Tab",
            padding=(18, 9),
            background="#EAF0F6",
            foreground="#607D8B",
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", "#FFFFFF")],
            foreground=[("selected", self.TEXT)],
        )

    # -----------------------------------------------------
    # Widget construction
    # -----------------------------------------------------
    def _build_widgets(self):
        # Header
        header = tk.Frame(self, bg=self.BG, padx=28, pady=22)
        header.pack(fill="x")

        title_box = tk.Frame(header, bg=self.BG)
        title_box.pack(side="left")

        tk.Label(
            title_box,
            text="주가 · 배당 알리미",
            font=("Malgun Gothic", 21, "bold"),
            bg=self.BG,
            fg=self.TEXT,
        ).pack(anchor="w")

        tk.Label(
            title_box,
            text="주가 조회부터 텔레그램 발송 이력까지 한 곳에서 관리합니다.",
            font=("Malgun Gothic", 9),
            bg=self.BG,
            fg=self.SUBTEXT,
        ).pack(anchor="w", pady=(4, 0))

        self.status_var = tk.StringVar(value="대기 중")
        tk.Label(
            header,
            textvariable=self.status_var,
            font=("Malgun Gothic", 9, "bold"),
            bg="#EAF3EE",
            fg="#54866B",
            padx=12,
            pady=7,
        ).pack(side="right", anchor="n")

        # Control card
        control_card = self._card(self)
        control_card.pack(fill="x", padx=28, pady=(0, 12))

        add = tk.Frame(control_card, bg=self.CARD)
        add.pack(fill="x", padx=18, pady=15)

        tk.Label(
            add,
            text="종목 관리",
            font=("Malgun Gothic", 11, "bold"),
            bg=self.CARD,
            fg=self.TEXT,
        ).pack(side="left", padx=(0, 18))

        self.new_code_var = tk.StringVar()
        self.new_name_var = tk.StringVar()
        self.new_market_var = tk.StringVar(value="kr")

        ttk.Entry(
            add, textvariable=self.new_code_var, width=13
        ).pack(side="left", padx=(0, 7))
        ttk.Entry(
            add, textvariable=self.new_name_var, width=20
        ).pack(side="left", padx=(0, 7))

        market = ttk.Combobox(
            add,
            textvariable=self.new_market_var,
            values=["kr", "us"],
            width=6,
            state="readonly",
        )
        market.pack(side="left", padx=(0, 7))

        ttk.Button(
            add,
            text="+ 종목 추가",
            command=self.on_add_stock,
            style="Primary.TButton",
        ).pack(side="left")

        ttk.Button(
            add,
            text="텔레그램 설정",
            command=self.on_open_settings,
            style="Soft.TButton",
        ).pack(side="right")

        ttk.Separator(control_card).pack(fill="x", padx=18)

        actions = tk.Frame(control_card, bg=self.CARD)
        actions.pack(fill="x", padx=18, pady=13)

        ttk.Button(
            actions,
            text="수동 조회 및 발송",
            command=self.on_manual_send,
            style="Primary.TButton",
        ).pack(side="left", padx=(0, 8))

        ttk.Button(
            actions,
            text="📅 오늘 배당 조회",
            command=self.on_dividend_send,
            style="Soft.TButton",
        ).pack(side="left", padx=(0, 8))

        ttk.Button(
            actions,
            text="⏱ 스케줄 설정",
            command=self.on_open_schedule,
            style="Soft.TButton",
        ).pack(side="left", padx=(4, 10))

        self.schedule_status_var = tk.StringVar(value=self._schedule_summary_text())
        tk.Label(
            actions,
            textvariable=self.schedule_status_var,
            font=("Malgun Gothic", 8),
            bg=self.CARD,
            fg=self.SUBTEXT,
            justify="left",
        ).pack(side="left", fill="x", expand=True)

        # 종목 / 현재가 카드 (발송 이력 조회 UI는 제거하고, 발송 이력은
        # 텔레그램 발송 직후 자동으로 엑셀로 저장됩니다)
        stocks_area = tk.Frame(self, bg=self.BG)
        stocks_area.pack(fill="both", expand=True, padx=28, pady=(0, 24))

        self._build_stocks_tab(stocks_area)

    def _card(self, parent):
        return tk.Frame(
            parent,
            bg=self.CARD,
            highlightbackground=self.BORDER,
            highlightthickness=1,
        )

    def _build_stocks_tab(self, parent):
        card = self._card(parent)
        card.pack(fill="both", expand=True, padx=2, pady=2)

        top = tk.Frame(card, bg=self.CARD)
        top.pack(fill="x", padx=16, pady=(14, 8))

        tk.Label(
            top,
            text="등록 종목",
            font=("Malgun Gothic", 11, "bold"),
            bg=self.CARD,
            fg=self.TEXT,
        ).pack(side="left")

        ttk.Button(
            top,
            text="선택 종목 삭제",
            command=self.on_delete_stock,
            style="Danger.TButton",
        ).pack(side="right")

        table_frame = tk.Frame(card, bg=self.CARD)
        table_frame.pack(fill="both", expand=True, padx=16, pady=(0, 16))

        self.tree = ttk.Treeview(
            table_frame,
            columns=self.COLUMNS,
            show="headings",
            selectmode="browse",
        )

        headers = {
            "code": "코드",
            "name": "종목명",
            "market": "시장",
            "price": "현재가",
            "change": "전일대비",
            "pct": "등락률",
            "updated": "갱신",
        }
        widths = {
            "code": 90,
            "name": 220,
            "market": 65,
            "price": 130,
            "change": 110,
            "pct": 90,
            "updated": 80,
        }

        for col in self.COLUMNS:
            self.tree.heading(col, text=headers[col])
            self.tree.column(
                col,
                width=widths[col],
                anchor="center",
                stretch=(col == "name"),
            )

        scroll = ttk.Scrollbar(
            table_frame,
            orient="vertical",
            command=self.tree.yview,
        )
        self.tree.configure(yscrollcommand=scroll.set)

        self.tree.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        self.tree.bind("<Delete>", lambda _e: self.on_delete_stock())

    # -----------------------------------------------------
    # Stock handling
    # -----------------------------------------------------
    def _reload_stock_table(self):
        self.tree.delete(*self.tree.get_children())

        for stock in self.stocks:
            self.tree.insert(
                "",
                "end",
                iid=stock.code,
                values=(
                    stock.code,
                    stock.name,
                    "한국" if stock.market is Market.KR else "미국",
                    "-",
                    "-",
                    "-",
                    "-",
                ),
            )

    def on_add_stock(self):
        code = self.new_code_var.get().strip()
        name = self.new_name_var.get().strip()
        market = self.new_market_var.get().strip()

        if not code or not name:
            messagebox.showwarning(
                "입력 오류",
                "종목 코드와 종목명을 모두 입력해 주세요.",
            )
            return

        if any(s.code.upper() == code.upper() for s in self.stocks):
            messagebox.showwarning(
                "중복",
                "이미 등록된 종목 코드입니다.",
            )
            return

        code = code.upper() if market == "us" else code
        self.stocks.append(Stock(code, name, Market(market)))
        save_stock_list(self.stocks)
        self._reload_stock_table()

        self.new_code_var.set("")
        self.new_name_var.set("")
        self.status_var.set(f"{name} 종목이 등록되었습니다.")

    def on_delete_stock(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo(
                "안내",
                "삭제할 종목을 선택해 주세요.",
            )
            return

        code = sel[0]
        stock = next((s for s in self.stocks if s.code == code), None)
        if stock is None:
            return

        if not messagebox.askyesno(
            "종목 삭제",
            f"{stock.name} ({stock.code}) 종목을 삭제하시겠습니까?",
        ):
            return

        self.stocks = [s for s in self.stocks if s.code != code]
        save_stock_list(self.stocks)
        self._reload_stock_table()
        self.status_var.set(f"{stock.name} 종목이 삭제되었습니다.")

    # -----------------------------------------------------
    # Settings
    # -----------------------------------------------------
    def on_open_settings(self):
        dialog = SettingsDialog(self)
        self.wait_window(dialog)

        if not dialog.saved:
            return

        new_token = dialog.token_var.get().strip()
        new_chat_id = dialog.chat_id_var.get().strip()
        new_finnhub_key = dialog.finnhub_key_var.get().strip()

        os.environ["TELEGRAM_BOT_TOKEN"] = new_token
        os.environ["TELEGRAM_CHAT_ID"] = new_chat_id
        os.environ["FINNHUB_API_KEY"] = new_finnhub_key

        try:
            set_key(ENV_PATH, "TELEGRAM_BOT_TOKEN", new_token)
            set_key(ENV_PATH, "TELEGRAM_CHAT_ID", new_chat_id)
            set_key(ENV_PATH, "FINNHUB_API_KEY", new_finnhub_key)
            self.status_var.set("텔레그램 설정이 저장되었습니다.")
        except Exception as e:
            messagebox.showerror(
                "오류",
                f"설정 저장에 실패했습니다.\n{e}",
            )

    # -----------------------------------------------------
    # Fetch / report
    # -----------------------------------------------------
    def on_manual_send(self):
        if self.busy:
            messagebox.showinfo(
                "진행 중",
                "현재 조회 또는 발송 작업이 진행 중입니다.",
            )
            return

        self.busy = True
        self.status_var.set("주가 조회 및 텔레그램 발송 중...")
        threading.Thread(
            target=self._fetch_worker,
            args=("수동",),
            daemon=True,
        ).start()

    def _fetch_worker(self, send_type: str, market: Optional[Market] = None):
        try:
            exchange_rate = get_exchange_rate()
            results = []

            # 작업 시작 시점의 종목 목록을 복사해 사용 (market이 지정되면 해당 시장만)
            stocks_snapshot = [
                s for s in self.stocks if market is None or s.market is market
            ]

            for stock in stocks_snapshot:
                price, prev = fetch_stock_prices(stock)
                dividend = get_today_dividend(stock)
                results.append((stock, price, prev, dividend))

            self.result_queue.put(
                ("fetch_done", send_type, exchange_rate, results)
            )
        except Exception as e:
            self.result_queue.put(("fetch_error", send_type, str(e)))

    def _apply_refresh_results(
        self,
        exchange_rate: float,
        results: List[Tuple[Stock, Optional[float], Optional[float], Optional[dict]]],
    ):
        self.exchange_rate = exchange_rate
        now = datetime.now(KST)
        now_str = now.strftime("%H:%M:%S")

        lines = [
            f"🔔 주가 알림 ({now.strftime('%Y-%m-%d %H:%M')})"
        ]

        if exchange_rate > 0:
            lines.append(
                f"💰 원/달러 환율: {exchange_rate:,.2f}원\n"
            )

        for stock, price, prev, dividend in results:
            change_str = "-"
            pct_str = "-"
            price_str = "-"

            lines.append(
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"■ {stock.name} ({stock.code})"
            )

            if price is not None:
                price_str = f"{stock.format_price(price)}{stock.currency}"

                if stock.market is Market.US and exchange_rate > 0:
                    price_str += f" ({price * exchange_rate:,.0f}원)"

                line = f"- 현재 종가: {price_str}"

                if prev is not None and prev != 0:
                    diff = price - prev
                    pct = (diff / prev) * 100
                    arrow = (
                        "📈" if diff > 0
                        else ("📉" if diff < 0 else "➖")
                    )
                    change_str = f"{diff:+,.2f}"
                    pct_str = f"{pct:+.2f}%"
                    line += (
                        f" ({arrow} {diff:+,.2f} / {pct:+.2f}%)"
                    )

                lines.append(line)
            else:
                lines.append("- 현재 종가: 조회 실패")

            if dividend:
                amount = dividend["amount"]
                currency = dividend["currency"]
                amount_text = (
                    f"{amount:,.0f}{currency}"
                    if stock.market is Market.KR
                    else f"{amount:,.4f}{currency}"
                )
                lines.append(f"🎁 오늘 배당 지급: {amount_text}/주")

            if self.tree.exists(stock.code):
                self.tree.item(
                    stock.code,
                    values=(
                        stock.code,
                        stock.name,
                        "한국" if stock.market is Market.KR else "미국",
                        price_str,
                        change_str,
                        pct_str,
                        now_str,
                    ),
                )

        self.last_report_text = "\n".join(lines)
        self.status_var.set(f"조회 완료 · {now_str}")

        details = []
        for stock, price, prev, dividend in results:
            price_value = (
                f"{stock.format_price(price)}{stock.currency}"
                if price is not None
                else "조회 실패"
            )

            if (
                stock.market is Market.US
                and price is not None
                and exchange_rate > 0
            ):
                price_value += f" ({price * exchange_rate:,.0f}원)"

            change_value = "-"
            pct_value = "-"

            if price is not None and prev is not None and prev != 0:
                diff = price - prev
                pct = (diff / prev) * 100
                change_value = f"{diff:+,.2f}"
                pct_value = f"{pct:+.2f}%"

            dividend_value = "-"
            dividend_date = "-"
            if dividend:
                amount = dividend["amount"]
                currency = dividend["currency"]
                dividend_value = (
                    f"{amount:,.0f}{currency}/주"
                    if stock.market is Market.KR
                    else f"{amount:,.4f}{currency}/주"
                )
                dividend_date = dividend["payment_date"]

            details.append(
                {
                    "code": stock.code,
                    "name": stock.name,
                    "market": "한국" if stock.market is Market.KR else "미국",
                    "price": price_value,
                    "change": change_value,
                    "pct": pct_value,
                    "dividend": dividend_value,
                    "dividend_payment_date": dividend_date,
                }
            )

        return details

    # -----------------------------------------------------
    # Send / history
    # -----------------------------------------------------
    def _send_report(self, send_type: str, details: Optional[list] = None):
        token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        chat_id = os.getenv("TELEGRAM_CHAT_ID", "")

        ok, msg = send_telegram_message(
            token,
            chat_id,
            self.last_report_text,
        )

        history_id = save_send_history(
            send_type=send_type,
            success=ok,
            message=msg,
            report=self.last_report_text,
            exchange_rate=self.exchange_rate,
            details=details,
        )
        excel_path, excel_error = self._export_history_to_excel(history_id)

        self.result_queue.put(("send_done", send_type, ok, msg, excel_path, excel_error))

    def on_dividend_send(self):
        if self.busy:
            messagebox.showinfo(
                "진행 중",
                "현재 조회 또는 발송 작업이 진행 중입니다.",
            )
            return

        self.busy = True
        self.status_var.set("오늘 배당 조회 중...")
        threading.Thread(
            target=self._dividend_worker,
            args=("배당",),
            daemon=True,
        ).start()

    def _dividend_worker(self, send_type: str, market: Optional[Market] = None):
        """등록된 종목(market이 None이면 한국/미국 전체, 지정되면 해당 시장만)을
        대상으로 오늘 배당 지급 여부를 조회합니다."""
        try:
            results = []
            stocks_snapshot = [
                s for s in self.stocks if market is None or s.market is market
            ]

            for stock in stocks_snapshot:
                dividend = get_today_dividend(stock)
                if dividend:
                    results.append((stock, dividend))

            self.result_queue.put(("dividend_done", send_type, results))
        except Exception as e:
            self.result_queue.put(("fetch_error", send_type, str(e)))

    def _apply_dividend_results(self, send_type: str, results: list):
        now = datetime.now(KST)
        lines = [f"📅 오늘 배당 지급 조회 ({now.strftime('%Y-%m-%d')})"]

        if not results:
            lines.append("오늘 배당이 지급되는 등록 종목이 없습니다.")
        else:
            for stock, dividend in results:
                amount = dividend["amount"]
                currency = dividend["currency"]
                market_label = "한국" if stock.market is Market.KR else "미국"
                amount_text = (
                    f"{amount:,.0f}{currency}"
                    if stock.market is Market.KR
                    else f"{amount:,.4f}{currency}"
                )
                lines.append(
                    f"■ [{market_label}] {stock.name} ({stock.code}) - {amount_text}/주"
                )

        self.last_report_text = "\n".join(lines)
        self.exchange_rate = 0.0
        self.status_var.set(f"오늘 배당 조회 완료 · {len(results)}건")

        details = [
            {
                "code": stock.code,
                "name": stock.name,
                "market": "한국" if stock.market is Market.KR else "미국",
                "price": "-",
                "change": "-",
                "pct": "-",
                "dividend": (
                    f"{dividend['amount']:,.0f}{dividend['currency']}/주"
                    if stock.market is Market.KR
                    else f"{dividend['amount']:,.4f}{dividend['currency']}/주"
                ),
                "dividend_payment_date": dividend["payment_date"],
            }
            for stock, dividend in results
        ]

        threading.Thread(
            target=self._send_custom_report,
            args=(send_type, self.last_report_text, details, 0.0),
            daemon=True,
        ).start()

    def _send_custom_report(
        self,
        send_type: str,
        report: str,
        details: Optional[list],
        exchange_rate: float,
    ):
        token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        chat_id = os.getenv("TELEGRAM_CHAT_ID", "")

        ok, msg = send_telegram_message(token, chat_id, report)

        history_id = save_send_history(
            send_type=send_type,
            success=ok,
            message=msg,
            report=report,
            exchange_rate=exchange_rate,
            details=details,
        )
        excel_path, excel_error = self._export_history_to_excel(history_id)

        self.result_queue.put(("send_done", send_type, ok, msg, excel_path, excel_error))

    def _export_history_to_excel(
        self, history_id: int
    ) -> Tuple[Optional[str], Optional[str]]:
        """텔레그램 발송 직후 워커 스레드에서 호출되어, 방금 저장된 발송 이력을
        자동으로 엑셀로 내보냅니다. (경로, 에러메시지) 튜플을 반환합니다."""
        if history_id is None:
            return None, None
        try:
            filepath = export_send_history_to_excel(history_id, EXPORT_DIR)
            return filepath, None
        except ImportError:
            return None, "엑셀 저장에는 openpyxl 패키지가 필요합니다 (pip install openpyxl)."
        except Exception as e:
            return None, f"엑셀 저장 오류: {e}"

    # -----------------------------------------------------
    # Queue / auto
    # -----------------------------------------------------
    def _poll_queue(self):
        try:
            while True:
                item = self.result_queue.get_nowait()

                if item[0] == "fetch_done":
                    _, send_type, exchange_rate, results = item

                    details = self._apply_refresh_results(
                        exchange_rate,
                        results,
                    )

                    # 조회 결과와 당시 종목별 상세 내역을 함께 저장한 뒤 발송
                    threading.Thread(
                        target=self._send_report,
                        args=(send_type, details),
                        daemon=True,
                    ).start()

                elif item[0] == "dividend_done":
                    _, send_type, results = item
                    self._apply_dividend_results(send_type, results)

                elif item[0] == "fetch_error":
                    _, _send_type, error = item
                    self.busy = False
                    self.status_var.set("조회 실패")
                    messagebox.showerror(
                        "조회 오류",
                        error,
                    )

                elif item[0] == "send_done":
                    _, send_type, ok, msg, excel_path, excel_error = item
                    self.busy = False

                    if ok:
                        status = (
                            f"{send_type} 발송 완료 · "
                            f"{datetime.now(KST).strftime('%H:%M:%S')}"
                        )
                    else:
                        status = f"{send_type} 발송 실패"

                    if excel_path:
                        status += f" · 엑셀 저장됨: {os.path.basename(excel_path)}"
                    elif excel_error:
                        status += f" · {excel_error}"

                    self.status_var.set(status)

        except queue.Empty:
            pass

        self.after(200, self._poll_queue)

    def _schedule_summary_text(self) -> str:
        def fmt(sched: dict) -> str:
            state = "사용" if sched.get("enabled") else "중지"
            return (
                f"{state} · 초:{sched.get('sec', '*')} 분:{sched.get('minute', '*')} "
                f"시:{sched.get('hour', '*')} 일:{sched.get('day', '*')} "
                f"요일:{sched.get('weekday', '*')}"
            )

        return (
            f"현재가[국내 {fmt(self.price_schedule_kr)} / "
            f"미국 {fmt(self.price_schedule_us)}]   |   "
            f"배당[국내 {fmt(self.dividend_schedule_kr)} / "
            f"미국 {fmt(self.dividend_schedule_us)}]"
        )

    def on_open_schedule(self):
        dialog = ScheduleDialog(
            self,
            self.price_schedule_kr,
            self.price_schedule_us,
            self.dividend_schedule_kr,
            self.dividend_schedule_us,
        )
        self.wait_window(dialog)

        if not dialog.saved:
            return

        self.price_schedule_kr = dialog.price_schedule_kr
        self.price_schedule_us = dialog.price_schedule_us
        self.dividend_schedule_kr = dialog.dividend_schedule_kr
        self.dividend_schedule_us = dialog.dividend_schedule_us

        save_app_setting("price_schedule_kr", self.price_schedule_kr)
        save_app_setting("price_schedule_us", self.price_schedule_us)
        save_app_setting("dividend_schedule_kr", self.dividend_schedule_kr)
        save_app_setting("dividend_schedule_us", self.dividend_schedule_us)

        # 스케줄이 바뀌었으므로 마지막 실행 기록을 초기화합니다.
        self._price_kr_last_fired = None
        self._price_us_last_fired = None
        self._dividend_kr_last_fired = None
        self._dividend_us_last_fired = None

        self.schedule_status_var.set(self._schedule_summary_text())
        self.status_var.set("스케줄이 저장되었습니다.")

    def _try_fire(
        self,
        schedule: dict,
        last_fired_attr: str,
        now: datetime,
        now_key: str,
        worker,
        send_type: str,
        market: Optional[Market],
        busy_label: str,
    ) -> None:
        """스케줄 조건이 맞으면(그리고 아직 이번 초에 실행하지 않았다면) 워커를 실행합니다."""
        if not schedule.get("enabled") or not cron_matches(now, schedule):
            return

        if getattr(self, last_fired_attr) == now_key:
            return
        setattr(self, last_fired_attr, now_key)

        if self.busy:
            self.status_var.set(
                f"[스케줄] 다른 작업이 진행 중이라 {busy_label}를(을) 건너뛰었습니다."
            )
            return

        self.busy = True
        self.status_var.set(f"[스케줄] {busy_label} 중 · {now.strftime('%H:%M:%S')}")
        threading.Thread(
            target=worker,
            args=(send_type, market),
            daemon=True,
        ).start()

    def _tick_scheduler(self):
        """매초 호출되어 국내/미국 × 현재가/배당 4개 스케줄을 각각 확인합니다."""
        now = datetime.now(KST)
        now_key = now.strftime("%Y-%m-%d %H:%M:%S")

        self._try_fire(
            self.price_schedule_kr,
            "_price_kr_last_fired",
            now,
            now_key,
            self._fetch_worker,
            "자동(국내)",
            Market.KR,
            "국내 현재가 조회",
        )
        self._try_fire(
            self.price_schedule_us,
            "_price_us_last_fired",
            now,
            now_key,
            self._fetch_worker,
            "자동(미국)",
            Market.US,
            "미국 현재가 조회",
        )
        self._try_fire(
            self.dividend_schedule_kr,
            "_dividend_kr_last_fired",
            now,
            now_key,
            self._dividend_worker,
            "배당 자동(국내)",
            Market.KR,
            "국내 배당 조회",
        )
        self._try_fire(
            self.dividend_schedule_us,
            "_dividend_us_last_fired",
            now,
            now_key,
            self._dividend_worker,
            "배당 자동(미국)",
            Market.US,
            "미국 배당 조회",
        )

        self.scheduler_job = self.after(1000, self._tick_scheduler)

    def _on_close(self):
        if self.scheduler_job is not None:
            self.after_cancel(self.scheduler_job)
            self.scheduler_job = None
        self.destroy()


def main():
    init_db()
    app = StockApp()
    app.mainloop()


if __name__ == "__main__":
    main()
