from fastapi import APIRouter
from typing import Optional

from database import get_conn
from schemas import TradeCreate
from utils.date_util import DateTimeUtil
from utils.utils import clean_filter

from sql.trade_sql import *

router = APIRouter()


@router.get("/trade")
def get_trades(
    page: int = 1,
    size: int = 10
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(COUNT_TOTAL_TRADES)
        total_row = cur.fetchone()
        
        # 기본 커서 타입에 따라 딕셔너리 형태나 튜플 형태 모두 대응 가능하도록 처리
        if total_row:
            total_count = total_row["count"] if isinstance(total_row, dict) else total_row[0]
        else:
            total_count = 0

        offset = (page - 1) * size

        query = (
            SELECT_TRADES
            + """
            ORDER BY t.dlngymd DESC
            LIMIT %s
            OFFSET %s
            """
        )

        cur.execute(query, (size, offset))
        trades_list = cur.fetchall()

        return {
            "data": trades_list,
            "total": total_count,
            "page": page,
            "size": size
        }

    except Exception as e:
        print(f"거래 목록 조회 중 오류 발생: {e}")
        return {
            "data": [],
            "total": 0,
            "page": page,
            "size": size
        }
    finally:
        cur.close()
        conn.close()


@router.post("/trade")
def create_trade(data: TradeCreate):
    conn = get_conn()
    cur = conn.cursor()

    try:
        custom_key = DateTimeUtil.generate_custom_key()

        cur.execute(
            INSERT_TRADE,
            (
                custom_key,
                data.dlngymd.replace("-", ""),  # ⚠️ replaceall -> replace로 수정
                clean_filter(data.bncd),
                clean_filter(data.stcktea),
                data.dlngamt,
                clean_filter(data.clsf),
                clean_filter(data.byngyn),
                data.stckcnt
            )
        )
        conn.commit()

        return {
            "result": "success",
            "message": "등록완료"
        }

    except Exception as e:
        conn.rollback()
        return {
            "result": "error",
            "message": str(e)
        }
    finally:
        cur.close()
        conn.close()


@router.delete("/trade/{id}")
def delete_trade(id: str):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(DELETE_TRADE, (id,))
        conn.commit()

        return {
            "result": "삭제완료"
        }

    except Exception as e:
        conn.rollback()
        return {
            "result": "error",
            "message": str(e)
        }
    finally:
        cur.close()
        conn.close()


@router.delete("/trade/reset")
def reset_trade():
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(RESET_TRADE)
        conn.commit()

        return {
            "result": "초기화완료"
        }

    except Exception as e:
        conn.rollback()
        return {
            "result": "error",
            "message": str(e)
        }
    finally:
        cur.close()
        conn.close()


# ==========================================================================
# 🔍 기간 및 다중 콤보박스 조건 검색
# ==========================================================================
@router.get("/trade/search")
def search_trades(
    page: int = 1,
    size: int = 10,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    bncd: Optional[str] = None,
    stcktea: Optional[str] = None,
    clsf: Optional[str] = None,
    byngyn: Optional[str] = None
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        base_query = SELECT_SEARCH
        params = []

        if clean_filter(startDate):
            base_query += "\nAND t.dlngymd >= %s"
            # ⚠️ replaceall -> replace로 수정
            params.append(startDate.replace("-", ""))

        if clean_filter(endDate):
            base_query += "\nAND t.dlngymd <= %s"
            # ⚠️ startDate와 일관성을 맞추기 위해 포맷팅 추가 ('-' 제거)
            params.append(endDate.replace("-", ""))

        if clean_filter(bncd):
            base_query += "\nAND t.bncd = %s"
            params.append(bncd)

        if clean_filter(stcktea):
            base_query += "\nAND t.stcktea = %s"
            params.append(stcktea)

        if clean_filter(clsf):
            base_query += "\nAND t.clsf = %s"
            params.append(clsf)

        if clean_filter(byngyn):
            base_query += "\nAND t.byngyn = %s"
            params.append(byngyn)

        # 서브쿼리로 감싸 전체 개수를 구함
        count_sql = f"""
        SELECT COUNT(*) AS total
        FROM (
            {base_query}
        ) t
        """

        cur.execute(count_sql, tuple(params))
        total_row = cur.fetchone()
        
        if total_row:
            total_count = total_row["total"] if isinstance(total_row, dict) else total_row[0]
        else:
            total_count = 0

        offset = (page - 1) * size

        search_sql = (
            base_query
            + """
            ORDER BY t.dlngymd DESC
            LIMIT %s
            OFFSET %s
            """
        )

        query_params = params.copy()
        query_params.extend([size, offset])

        cur.execute(search_sql, tuple(query_params))
        trades = cur.fetchall()

        return {
            "data": trades,
            "total": total_count,
            "page": page,
            "size": size
        }

    except Exception as e:
        print(f"거래 검색 오류 : {e}")
        return {
            "data": [],
            "total": 0,
            "page": page,
            "size": size,
            "message": str(e)
        }
    finally:
        cur.close()
        conn.close()