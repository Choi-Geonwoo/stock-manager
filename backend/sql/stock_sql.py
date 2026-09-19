INSERT_STOCK = """
INSERT INTO stckinfo
(stckinfo_no, ntncd, stcktea, stcknm, alctn, useyn, delyn)
VALUES (%s, %s, %s, %s, %s, %s, 'N')
"""

SELECT_STOCKS = """
SELECT
    stckinfo_no,
    ntncd,
    stcktea,
    stcknm,
    alctn,
    useyn
FROM stckinfo
WHERE delyn='N'
    AND (%s='' OR ntncd = %s)
    AND (%s='' OR UPPER(stcktea) = UPPER(%s))
    AND (%s='' OR alctn = %s)
    AND (%s='' OR stcknm ILIKE '%%' || %s || '%%')
ORDER BY stcktea
LIMIT %s
OFFSET %s
"""

# 🛠️ [추가] 페이징 네이션 버튼 계산을 위한 조건에 맞는 전체 데이터 개수 조회 쿼리
COUNT_TOTAL_STOCKS = """
SELECT COUNT(*) 
FROM stckinfo 
WHERE delyn='N'
    AND (%s='' OR ntncd = %s)
    AND (%s='' OR UPPER(stcktea) = UPPER(%s))
    AND (%s='' OR alctn = %s)
    AND (%s='' OR stcknm ILIKE '%%' || %s || '%%')
"""

DELETE_STOCK = """
UPDATE stckinfo
SET delyn='Y'
WHERE stckinfo_no=%s
"""

RESET_STOCK = """
DELETE FROM stckinfo
"""

COUNT_STOCK = """
SELECT COUNT(*)
FROM stckinfo
WHERE stckinfo_no=%s
"""