from typing import Optional # ✅ typing에서 가져와야 합니다.
from fastapi import APIRouter, UploadFile, File, Form
from database import get_conn
from schemas import DividendCreate, DividendUpdate
from sql.dividend_sql import *
from sql.fileinfo_sql import COUNT_FILEINFO, UPDATE_FILEINFO, INSERT_FILEINFO # 👈 새로 만든 파일 SQL 임포트

from datetime import datetime
from utils.utils import clean_filter
import os
import uuid  # 💡 UUID 생성을 위해 상단에 추가

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


def _normalize_date(value: Optional[str]) -> str:
    if value is None:
        return ""
    return str(value).replace("-", "").replace("/", "")


# =========================================================
# 파일 업로드
# =========================================================
@router.post("/dividend/upload")
async def upload_file(
    dlngymd: str = Form(...),
    alctndlngdsctn_no: str = Form(...),
    file: Optional[UploadFile] = File(None),
    filenm: Optional[str] = Form(None), 
):
    # 💡 1. 파일이 존재하는 경우에만 물리 파일 저장
    file_path = None
    filename_to_save = None

    normalized_date = _normalize_date(dlngymd)

    if file and file.filename:
        folder = os.path.join(
            UPLOAD_DIR,
            normalized_date[:4],
            normalized_date[4:6],
        )
        os.makedirs(folder, exist_ok=True)
        safe_filename = os.path.basename(file.filename)
        file_path = os.path.join(folder, safe_filename)
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        filename_to_save = safe_filename

    if not filename_to_save and filenm:
        filename_to_save = os.path.basename(filenm)

    # 💡 2. 데이터베이스 로직
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        # 파일이 새로 업로드되지 않았다면 기존 DB 내용 유지 혹은 filenm 전달값 사용
        if not filename_to_save:
            return {"result": "success", "message": "파일 없음, 정보만 유지"}

        cur.execute(COUNT_FILEINFO, (alctndlngdsctn_no,))
        row = cur.fetchone()
        exists = (row.get("count", 0) > 0 if isinstance(row, dict) else row[0] > 0) if row else False

        if exists:
            cur.execute(UPDATE_FILEINFO, (filename_to_save, file_path, alctndlngdsctn_no))
        else:
            new_uuid = str(uuid.uuid4())
            cur.execute(INSERT_FILEINFO, (new_uuid, alctndlngdsctn_no, filename_to_save, file_path))
            
        conn.commit()
        return {"result": "success", "filename": filename_to_save, "path": file_path}
        
    except Exception as e:
        conn.rollback()
        return {"result": "error", "message": f"DB 처리 실패: {str(e)}"}
    finally:
        cur.close()
        conn.close()


# =========================================================
# 전체 조회
# =========================================================
@router.get("/dividend")
def get_dividends(
    page: int = 1,
    size: int = 10,
    year: str = "",
    month: str = "",
    bank: str = "",
    stock: str = ""
):

    conn = get_conn()
    cur = conn.cursor()

    try:
        print(f"DEBUG: year={year}, month={month}, bank={bank}, stock={stock}")
        params = (
            clean_filter(year),
            clean_filter(year),
            clean_filter(month),
            clean_filter(month),
            clean_filter(bank),
            clean_filter(bank),
            clean_filter(stock),
            clean_filter(stock),
        )
        print(f"DEBUG: params={params}")
        # 전체 건수
        cur.execute(
            COUNT_TOTAL_DIVIDENDS,
            params
        )

        total = cur.fetchone()["count"]

        offset = (page - 1) * size

        # 목록 조회
        cur.execute(
            SELECT_DIVIDENDS,
            (
                *params,
                size,
                offset
            )
        )

        rows = cur.fetchall()

        return {
            "data": rows,
            "total": total,
            "page": page,
            "size": size
        }

    except Exception as e:

        print("배당 조회 오류 :", e)

        return {
            "data": [],
            "total": 0,
            "page": page,
            "size": size
        }

    finally:

        cur.close()
        conn.close()


# # =========================================================
# # 검색
# # =========================================================
# @router.get("/dividend/search")
# def search_dividend(
#     year: str = "",
#     month: str = "",
#     bank: str = "",
#     stock: str = ""
# ):

#     conn = get_conn()
#     cur = conn.cursor()

#     try:

#         sql = SELECT_DIVIDENDS
#         params = []

#         if year:
#             sql += """
#             AND substring(
#                 alctndlngdsctn.dlngymd,
#                 1,
#                 4
#             ) = %s
#             """
#             params.append(year)

#         if month:
#             sql += """
#             AND substring(
#                 alctndlngdsctn.dlngymd,
#                 6,
#                 2
#             ) = %s
#             """
#             params.append(
#                 month.zfill(2)
#             )

#         if bank:
#             sql += """
#             AND bninfr.bnnm = %s
#             """
#             params.append(bank)

#         if stock:
#             sql += """
#             AND stckinfo.stcknm = %s
#             """
#             params.append(stock)

#         sql += """
#         ORDER BY alctndlngdsctn.dlngymd DESC
#         """

#         cur.execute(
#             sql,
#             tuple(params)
#         )

#         return cur.fetchall()

#     finally:

#         cur.close()
#         conn.close()


# =========================================================
# 등록
# =========================================================
@router.post("/dividend")
def create_dividend(
    data: DividendCreate
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        custom_key = (
            datetime.now()
            .strftime(
                "%Y%m%d_%H%M%S_%f"
            )
        )

        cur.execute(
            COUNT_DIVIDEND,
            (custom_key,)
        )

        if cur.fetchone()["count"] > 0:

            return {
                "result": "fail",
                "message": "이미 존재"
            }

        cur.execute(
            INSERT_DIVIDEND,
            (
                custom_key,
                data.bncd,
                data.stcktea,
                _normalize_date(data.dlngymd),
                data.dlngamt,
                data.dvdnd,
                data.filenm or ""
            )
        )

        conn.commit()

        return {
            "result": "success",
            "message": "등록완료",
            "alctndlngdsctn_no": custom_key
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
# 수정
# =========================================================
@router.put("/dividend/update")
def update_dividend(
    data: DividendUpdate
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            UPDATE_DIVIDEND,
            (
                data.bncd,
                data.stcktea,
                _normalize_date(data.dlngymd),
                data.dlngamt,
                data.dvdnd,
                data.filenm or "",
                data.alctndlngdsctn_no
            )
        )

        conn.commit()

        return {
            "result": "success",
            "message": "수정완료"
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
# 삭제
# =========================================================
@router.delete("/dividend/{id}")
def delete_dividend(
    id: str
):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            DELETE_DIVIDEND,
            (id,)
        )

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


# =========================================================
# 초기화
# =========================================================
@router.delete("/dividend/reset")
def reset_dividend():

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute(
            RESET_DIVIDEND
        )

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




# =========================================================
# 월별 차트 조회
# =========================================================
@router.get("/dividend/monthly")
def get_dividend_monthly(
    year: str = "",
    month: str = "",
    bank: str = "",
    stock: str = ""
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        params = (
            clean_filter(year),
            clean_filter(year),
            clean_filter(month),
            clean_filter(month),
            clean_filter(bank),
            clean_filter(bank),
            clean_filter(stock),
            clean_filter(stock),
        )

        cur.execute(
            SELECT_MONTHLY,
            params
        )

        rows = cur.fetchall()

        return {
            "data": rows
        }

    except Exception as e:
        print("월별 차트 조회 오류 :", e)

        return {
            "data": []
        }

    finally:
        cur.close()
        conn.close()