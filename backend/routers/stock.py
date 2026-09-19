from fastapi import APIRouter
from database import get_conn
from schemas import StockCreate
from datetime import datetime
from utils.utils import clean_filter

from sql.stock_sql import *

router = APIRouter()


@router.get("/stock")
def get_stocks(
    page: int = 1,
    size: int = 10,
    ntncd: str = "",
    stcktea: str = "",
    alctn: str = "",
    stcknm: str = ""
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        ntncd = clean_filter(ntncd)
        stcktea = clean_filter(stcktea)
        alctn = clean_filter(alctn)
        stcknm = clean_filter(stcknm)

        params = (
            ntncd,
            ntncd,
            stcktea,
            stcktea,
            alctn,
            alctn,
            stcknm,
            stcknm,
        )

        cur.execute(
            COUNT_TOTAL_STOCKS,
            params
        )

        total_row = cur.fetchone()

        total_count = (
            total_row["count"]
            if total_row
            else 0
        )

        offset = (
            page - 1
        ) * size

        cur.execute(
            SELECT_STOCKS,
            (
                *params,
                size,
                offset,
            )
        )

        stocks = cur.fetchall()

        return {
            "data": stocks,
            "total": total_count,
            "page": page,
            "size": size,
        }

    except Exception as e:

        print(f"주식 조회 오류 : {e}")

        return {
            "data": [],
            "total": 0,
            "page": page,
            "size": size,
        }

    finally:

        cur.close()
        conn.close()


@router.post("/stock")
def create_stock(
    data: StockCreate
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        custom_key = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        cur.execute(
            INSERT_STOCK,
            (
                custom_key,
                data.ntncd,
                data.stcktea.upper(),
                data.stcknm,
                data.alctn,
                data.useyn,
            ),
        )

        conn.commit()

        return {
            "result": "success",
            "message": "등록완료",
        }

    except Exception as e:

        conn.rollback()

        return {
            "result": "error",
            "message": str(e),
        }

    finally:

        cur.close()
        conn.close()


@router.delete("/stock/{id}")
def delete_stock(id: str):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            DELETE_STOCK,
            (id,),
        )

        conn.commit()

        return {
            "result": "success",
            "message": "삭제완료",
        }

    except Exception as e:

        conn.rollback()

        return {
            "result": "error",
            "message": str(e),
        }

    finally:

        cur.close()
        conn.close()


@router.delete("/stock/reset")
def reset_stock():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            RESET_STOCK
        )

        conn.commit()

        return {
            "result": "success",
            "message": "초기화완료",
        }

    except Exception as e:

        conn.rollback()

        return {
            "result": "error",
            "message": str(e),
        }

    finally:

        cur.close()
        conn.close()