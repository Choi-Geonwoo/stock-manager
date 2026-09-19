from fastapi import APIRouter

from database import get_conn
from sql.balance_sql import SELECT_BALANCE

router = APIRouter()


# =========================================================
# 보유 종목 조회
# =========================================================
@router.get("/balance")
def get_balance():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            SELECT_BALANCE
        )

        return cur.fetchall()

    except Exception as e:

        return {
            "result": "error",
            "message": str(e)
        }

    finally:

        cur.close()
        conn.close()