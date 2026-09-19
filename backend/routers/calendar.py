from fastapi import APIRouter, HTTPException

from database import get_conn
from sql.calendar_sql import SELECT_CALENDAR

router = APIRouter()


@router.get("/calendar/{yyyymm}")
def get_calendar(
    yyyymm: str
):
    """
    yyyymm 예)
    202601
    202607
    """

    conn = get_conn()

    try:
        with conn.cursor() as cur:

            cur.execute(
                SELECT_CALENDAR,
                (f"{yyyymm}%",)
            )

            rows = cur.fetchall()

            return {
                "data": rows,
                "total": len(rows)
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        conn.close()