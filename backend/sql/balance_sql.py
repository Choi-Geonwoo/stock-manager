SELECT_BALANCE = """
SELECT
    D.ntnnm,
    C.stcknm,

    COALESCE(SUM(CASE WHEN A.byngyn = 'Y' THEN A.stckcnt END), 0) AS buy_cnt,
    COALESCE(SUM(CASE WHEN A.byngyn = 'N' THEN A.stckcnt END), 0) AS sell_cnt,

    COALESCE(SUM(CASE WHEN A.byngyn = 'Y' THEN A.stckcnt END), 0) -
    COALESCE(SUM(CASE WHEN A.byngyn = 'N' THEN A.stckcnt END), 0) AS balance,
    
    -- 평균 배당금 소수점 둘째 자리 반올림
    coalesce(ROUND(e.avg_dlngamt, 2), 0) AS avg_dlngamt,
	coalesce(ROUND(e.sum_dlngamt, 2), 0) as sum_dlngamt
FROM stckdlngdsctn A

LEFT JOIN bninfr B
    ON A.bncd = B.bncd
LEFT JOIN stckinfo C
    ON A.stcktea = C.stcktea
LEFT JOIN ntninfo D
    ON C.ntncd = D.ntncd
LEFT JOIN (
    SELECT 
        stcktea,
        AVG(dlngamt) AS avg_dlngamt,
        SUM(dlngamt) AS sum_dlngamt
    FROM alctndlngdsctn
    WHERE delyn = 'N'
    GROUP BY stcktea
) e ON A.stcktea = e.stcktea

WHERE
    A.delyn = 'N'
    AND C.delyn = 'N'
GROUP BY
    D.ntnnm,
    C.stcknm,
    e.avg_dlngamt,
    e.sum_dlngamt
HAVING
    COALESCE(SUM(CASE WHEN A.byngyn = 'Y' THEN A.stckcnt END), 0) -
    COALESCE(SUM(CASE WHEN A.byngyn = 'N' THEN A.stckcnt END), 0) > 1

ORDER BY
    case when D.ntnnm = '미국' then 1 end,
    D.ntnnm,
    C.stcknm
"""