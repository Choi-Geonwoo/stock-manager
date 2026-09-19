INSERT_DIVIDEND = """
INSERT INTO alctndlngdsctn
(alctndlngdsctn_no, bncd, stcktea,
 dlngymd, dlngamt, dvdnd, filenm, delyn)
VALUES (%s, %s, %s, %s, %s, %s, %s, 'N')
"""

SELECT_DIVIDENDS = """
SELECT
    a.alctndlngdsctn_no,
    a.bncd,
    b.bnnm,
	c.ntnnm ,
    a.stcktea,
    s.stcknm,
    a.dlngymd,
    a.dlngamt,
    a.dvdnd,
    (
        SELECT filenm
        FROM fileinfo f
        WHERE f.alctndlngdsctn_no = a.alctndlngdsctn_no
    ) AS filenm
FROM alctndlngdsctn a
JOIN stckinfo s
    ON s.stcktea = a.stcktea
JOIN bninfr b
    ON b.bncd = a.bncd
JOIN ntnInfo c
    ON c.ntncd = s.ntncd and c.USEYN = 'Y'
WHERE a.delyn='N'
  AND (%s = '' OR substring(a.dlngymd,1,4) = %s)
  AND (%s = '' OR substring(a.dlngymd,5,2) = %s)
  AND (%s = '' OR b.bncd = %s)
  AND (%s = '' OR s.stcktea = %s)
ORDER BY a.dlngymd DESC
LIMIT %s OFFSET %s
"""

DELETE_DIVIDEND = """
UPDATE alctndlngdsctn
SET delyn='Y'
WHERE alctndlngdsctn_no=%s
"""

RESET_DIVIDEND = """
DELETE FROM alctndlngdsctn
"""

COUNT_DIVIDEND = """
SELECT COUNT(*)
FROM alctndlngdsctn
WHERE alctndlngdsctn_no=%s
"""
COUNT_TOTAL_DIVIDENDS = """
SELECT COUNT(*) AS count
FROM
(
    SELECT
        a.alctndlngdsctn_no
    FROM alctndlngdsctn a
    JOIN stckinfo s
        ON s.stcktea = a.stcktea
    JOIN bninfr b
        ON b.bncd = a.bncd
    WHERE a.delyn='N'
      AND (%s = '' OR substring(a.dlngymd,1,4) = %s)
      AND (%s = '' OR substring(a.dlngymd,5,2) = %s)
      AND (%s = '' OR b.bncd = %s)
      AND (%s = '' OR s.stcknm = %s)
) T
"""

UPDATE_DIVIDEND = """
UPDATE alctndlngdsctn
SET
    bncd=%s,
    stcktea=%s,
    dlngymd=%s,
    dlngamt=%s,
    dvdnd=%s,
    filenm=%s
WHERE
    alctndlngdsctn_no=%s
"""

SELECT_MONTHLY="""
SELECT
    --B.STCKNM AS 주식티커,
    EXTRACT(YEAR FROM DLNGYMD::DATE) AS DLNGYMD,
    format_currency(B.NTNCD) as currency,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 1), 0) AS jan,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 2), 0) AS feb,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 3), 0) AS mar,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 4), 0) AS apr,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 5), 0) AS may,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 6), 0) AS jun,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 7), 0) AS jul,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 8), 0) AS aug,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 9), 0) AS sep,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 10), 0) AS oct,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 11), 0) AS nov,
    COALESCE(SUM(A.DLNGAMT) FILTER (WHERE EXTRACT(MONTH FROM A.DLNGYMD::DATE) = 12), 0) AS dec
FROM
    ALCTNDLNGDSCTN A
    LEFT JOIN STCKINFO B
    ON A.STCKTEA = B.STCKTEA
WHERE
    A.DELYN='N'
    AND (%s = '' OR EXTRACT(YEAR FROM A.DLNGYMD::DATE)::TEXT = %s)
    AND (%s = '' OR TO_CHAR(A.DLNGYMD::DATE, 'MM')::TEXT = %s)
    AND (%s = '' OR A.BNCD = %s)
    AND (%s = '' OR A.STCKTEA = %s)
GROUP BY EXTRACT(YEAR FROM A.DLNGYMD::DATE)
	,format_currency(B.NTNCD)
ORDER BY
    DLNGYMD DESC
"""