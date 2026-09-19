import pandas as pd
from fastapi import APIRouter, UploadFile, File
from fastapi import HTTPException, status

from database import get_conn
from schemas import NationCreate
from utils.date_util import DateTimeUtil
from utils.utils import clean_filter
from sql.nation_sql import (
    INSERT_NATION,
    SELECT_NATIONS,
    DELETE_NATION,
    RESET_NATION,
    COUNT_NATION
)

router = APIRouter()


# =========================================================
# 공통 저장 함수 (접미사(suffix) 파라미터 추가)
# =========================================================
def insert_nation(
    cur,
    data: NationCreate,
    suffix: str = ""
):
    custom_key = (
        DateTimeUtil
        .generate_custom_key()
    )

    if suffix:
        custom_key = (
            f"{custom_key}_{suffix}"
        )

    cur.execute(
        COUNT_NATION,
        (data.ntncd,)
    )

    if cur.fetchone()["count"] > 0:
        return {
            "result": "fail",
            "message": f"{data.ntncd} 이미 존재"
        }

    cur.execute(
        INSERT_NATION,
        (
            custom_key,
            clean_filter(data.ntncd),
            clean_filter(data.ntnnm),
            clean_filter(data.useyn)
        )
    )

    return {
        "result": "success"
    }


# =========================================================
# 국가 목록 조회
# =========================================================
@router.get("/nation")
def get_nations(
    ntncd: str = "",
    ntnnm: str = "",
    useyn: str = ""
):

    conn = get_conn()
    cur = conn.cursor()

    try:
        params = (
            clean_filter(ntncd),
            clean_filter(ntncd),
            clean_filter(ntnnm),
            clean_filter(ntnnm),
            clean_filter(useyn),
            clean_filter(useyn),
        )

        cur.execute(
            SELECT_NATIONS,
            params
        )

        return cur.fetchall()

    finally:

        cur.close()
        conn.close()


# =========================================================
# 국가 등록 (단건 등록)
# =========================================================
@router.post("/nation")
def create_nation(
    data: NationCreate
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        result = insert_nation(
            cur,
            data
        )

        if (
            result["result"]
            != "success"
        ):
            conn.rollback()

            raise HTTPException(
                status_code=
                    status
                    .HTTP_400_BAD_REQUEST,
                detail=
                    result["message"]
            )

        conn.commit()

        return {
            "result": "success",
            "message": "등록완료"
        }

    except HTTPException as he:
        raise he

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        cur.close()
        conn.close()


# =========================================================
# 국가 삭제
# =========================================================
@router.delete("/nation/{id}")
def delete_nation(
    id: str
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            DELETE_NATION,
            (id,)
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
# 국가 초기화
# =========================================================
@router.delete("/nation/reset")
def reset_nation():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            RESET_NATION
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
# 엑셀 업로드 (대량 등록 시 중복 방지 처리)
# =========================================================
@router.post(
    "/nation/excel/upload"
)
async def upload_nation_excel(
    file: UploadFile = File(...)
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        df = pd.read_excel(
            file.file
        )

        required_columns = [
            "ntninfono",
            "ntncd",
            "ntnnm",
            "useyn"
        ]

        for col in required_columns:

            if (
                col
                not in df.columns
            ):
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

                nation = (
                    NationCreate(
                        ntninfono=str(
                            row["ntninfono"]
                        ).strip(),
                        ntncd=str(
                            row["ntncd"]
                        ).strip(),
                        ntnnm=str(
                            row["ntnnm"]
                        ).strip(),
                        useyn=str(
                            row["useyn"]
                        ).strip()
                    )
                )

                result = (
                    insert_nation(
                        cur,
                        nation,
                        suffix=str(idx)
                    )
                )

                if (
                    result["result"]
                    == "success"
                ):
                    success_count += 1

                else:
                    fail_count += 1

                    errors.append(
                        f"{idx + 2}행: "
                        f"{result['message']}"
                    )

            except Exception as row_error:

                fail_count += 1

                errors.append(
                    f"{idx + 2}행 오류: "
                    f"{str(row_error)}"
                )

        conn.commit()

        return {
            "result": "success",
            "message":
                f"업로드 완료 "
                f"(성공: {success_count}, "
                f"실패: {fail_count})",
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