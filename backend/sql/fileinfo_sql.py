# =========================================================
# fileinfo 테이블 구조 동기화 쿼리
# =========================================================

# 파일 존재 여부 확인
COUNT_FILEINFO = """
SELECT COUNT(*) as count 
FROM fileinfo 
WHERE alctndlngdsctn_no = %s
"""

# 신규 등록 (fileinfo_no, alctndlngdsctn_no, filenm, path) -> 총 4개 인자
INSERT_FILEINFO = """
INSERT INTO fileinfo (fileinfo_no, alctndlngdsctn_no, filenm, path, delyn) 
VALUES (%s, %s, %s, %s, 'N')
"""

# 수정 (파일명과 경로를 동시에 업데이트) -> 총 3개 인자
UPDATE_FILEINFO = """
UPDATE fileinfo 
SET filenm = %s, path = %s, mdfcnday = CURRENT_TIMESTAMP
WHERE alctndlngdsctn_no = %s
"""