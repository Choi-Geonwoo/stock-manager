INSERT_TRADE = """
INSERT INTO stckdlngdsctn
(
    stckdlngdsctn_no,
    dlngymd,
    bncd,
    stcktea,
    dlngamt,
    clsf,
    byngyn,
    stckcnt,
    delyn
)
VALUES
(
    %s, %s, %s, %s, %s, %s, %s, %s, 'N'
)
"""


SELECT_TRADES = """
SELECT /*SELECT_TRADES*/
    t.stckdlngdsctn_no AS trade_no,
    t.dlngymd,
    b.bnnm,
    s.stcknm,
    t.dlngamt,
    t.clsf,
    t.byngyn,
    t.stckcnt,
    n.ntnnm

FROM stckdlngdsctn t

LEFT JOIN bninfr b
    ON t.bncd = b.bncd
   AND b.delyn = 'N'

LEFT JOIN stckinfo s
    ON t.stcktea = s.stcktea
   AND s.delyn = 'N'
left JOIN ntninfo n
    ON s.ntncd = n.ntncd
        AND n.USEYN = 'Y'

WHERE t.delyn = 'N'

"""

SELECT_SEARCH="""

        SELECT /*SELECT_SEARCH*/
            t.stckdlngdsctn_no AS trade_no,
            t.dlngymd,
            b.bnnm,
            s.stcknm,
            t.dlngamt,
            t.clsf,
            t.byngyn,
            t.stckcnt
        FROM stckdlngdsctn t
        LEFT JOIN bninfr b
            ON t.bncd = b.bncd
           AND b.delyn = 'N'
        LEFT JOIN stckinfo s
            ON t.stcktea = s.stcktea
           AND s.delyn = 'N'
        WHERE t.delyn = 'N'
"""

# 🛠️ [추가] 페이징 네이션 버튼 계산을 위한 조건에 맞는 전체 데이터 개수 조회 쿼리
COUNT_TOTAL_TRADES = """
SELECT COUNT(*) 
FROM stckdlngdsctn 
WHERE delyn='N'
"""

DELETE_TRADE = """
UPDATE stckdlngdsctn
SET delyn='Y'
WHERE stckdlngdsctn_no=%s
"""


RESET_TRADE = """
DELETE FROM stckdlngdsctn
"""


COUNT_TRADE = """
SELECT COUNT(*)
FROM stckdlngdsctn
WHERE stckdlngdsctn_no=%s
"""