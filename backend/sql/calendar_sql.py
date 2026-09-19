SELECT_CALENDAR = """
SELECT
     b.bnnm,
     c.ntnnm,
     s.ntncd,
     a.stcktea,
     s.stcknm,
     a.dlngymd,
     a.dlngamt,
     a.dvdnd
FROM alctndlngdsctn a
JOIN stckinfo s
    ON s.stcktea = a.stcktea
JOIN bninfr b
    ON b.bncd = a.bncd
JOIN ntninfo c
    ON c.ntncd = s.ntncd
   AND c.useyn = 'Y'
WHERE a.delyn = 'N'
  AND a.dlngymd LIKE %s
ORDER BY a.dlngymd DESC
"""