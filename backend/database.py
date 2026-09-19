import os
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor


def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key and not os.getenv(key):
                os.environ[key] = value


load_env_file()


def log(message):
    now = datetime.now()
    timestamp = (
        f"({now.strftime('%Y%m%d_%H%M%S')}"
        f"_{str(now.microsecond)[:3]}"
        f")"
    )
    print(f"[{timestamp}] {message}")


class LoggingCursor(RealDictCursor):

    def execute(self, query, vars=None):
        clean_sql = " ".join(str(query).split())

        log(f"[SQL] {clean_sql}")

        if vars:
            log(f"[PARAM] {vars}")

        return super().execute(query, vars)

    def fetchone(self):
        result = super().fetchone()
        log(f"[RESULT] {result}")
        return result

    def fetchall(self):
        result = super().fetchall()
        log(f"[RESULT] {result}")
        return result

def get_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "devdb"),
        user=os.getenv("DB_USER", "dev"),
        password=os.getenv("DB_PASSWORD", "dev1234"),
        cursor_factory=LoggingCursor
    )