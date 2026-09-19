import pandas as pd

from datetime import datetime
from fastapi import APIRouter, UploadFile, File

from database import get_conn
from schemas import BankCreate
from sql.bank_sql import *
from utils.utils import clean_filter

router = APIRouter()


# =========================================================
# 공통 저장 함수
# =========================================================
def insert_bank(cur, data: BankCreate, suffix: str = ""):

    custom_key = datetime.now().strftime(
        "%Y%m%d_%H%M%S_%f"
    )

    if suffix:
        custom_key = f"{custom_key}_{suffix}"

    cur.execute(
        COUNT_BANK,
        (data.bncd,)
    )

    if cur.fetchone()["count"] > 0:
        return {
            "result": "fail",
            "message": f"{data.bncd} 이미 존재"
        }

    cur.execute(
        INSERT_BANK,
        (
            custom_key,
            clean_filter(data.bncd),
            clean_filter(data.bnnm),
            clean_filter(data.useyn)
        )
    )

    return {
        "result": "success"
    }


# =========================================================
# 등록
# =========================================================
@router.post("/bank")
def create_bank(data: BankCreate):

    conn = get_conn()
    cur = conn.cursor()

    try:

        result = insert_bank(
            cur,
            data
        )

        if result["result"] != "success":
            conn.rollback()
            return result

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


# =========================================================
# 전체조회
# =========================================================
@router.get("/bank")
def get_banks():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            SELECT_BANKS
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


# =========================================================
# 검색
# =========================================================
@router.get("/bank/search")
def search_bank(
    field: str = "",
    keyword: str = ""
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        sql = SEARCH_BANK
        params = []

        if keyword:

            if field == "bncd":

                sql += """
                    AND bncd ILIKE %s
                """

                params.append(
                    f"%{keyword}%"
                )

            elif field == "bnnm":

                sql += """
                    AND bnnm ILIKE %s
                """

                params.append(
                    f"%{keyword}%"
                )

            else:

                sql += """
                    AND (
                        bncd ILIKE %s
                        OR bnnm ILIKE %s
                    )
                """

                params.extend([
                    f"%{keyword}%",
                    f"%{keyword}%"
                ])

        cur.execute(
            sql,
            params
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


# =========================================================
# 삭제
# =========================================================
@router.delete("/bank/{bank_id}")
def delete_bank(bank_id: str):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            DELETE_BANK,
            (bank_id,)
        )

        conn.commit()

        return {
            "result": "success",
            "message": "삭제완료"
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


# =========================================================
# 초기화
# =========================================================
@router.delete("/bank/reset")
def reset_bank():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            RESET_BANK
        )

        conn.commit()

        return {
            "result": "success",
            "message": "초기화완료"
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


# =========================================================
# 엑셀 업로드
# =========================================================
@router.post("/bank/excel/upload")
async def upload_bank_excel(
    file: UploadFile = File(...)
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        df = pd.read_excel(
            file.file
        )

        required_columns = [
            "bninfr_no",
            "bncd",
            "bnnm",
            "useyn"
        ]

        for col in required_columns:

            if col not in df.columns:
                raise Exception(
                    f"{col} 컬럼이 없습니다."
                )

        rows = df.to_dict(
            orient="records"
        )

        success_count = 0
        fail_count = 0
        errors = []

        for idx, row in enumerate(rows):

            try:

                bank = BankCreate(
                    bninfr_no=str(
                        row["bninfr_no"]
                    ).strip(),
                    bncd=str(
                        row["bncd"]
                    ).strip(),
                    bnnm=str(
                        row["bnnm"]
                    ).strip(),
                    useyn=str(
                        row["useyn"]
                    ).strip()
                )

                result = insert_bank(
                    cur,
                    bank,
                    suffix=str(idx)
                )

                if result["result"] == "success":

                    success_count += 1

                else:

                    fail_count += 1

                    errors.append(
                        f"{idx + 2}행 : {result['message']}"
                    )

            except Exception as row_error:

                fail_count += 1

                errors.append(
                    f"{idx + 2}행 오류 : {str(row_error)}"
                )

        conn.commit()

        return {
            "result": "success",
            "message":
                f"업로드 완료 (성공:{success_count}, 실패:{fail_count})",
            "errors": errors
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