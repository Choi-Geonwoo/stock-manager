INSERT_NATION = """
INSERT INTO ntninfo
(ntninfo_no, ntncd, ntnnm, useyn, delyn)
VALUES (%s, %s, %s, %s, 'N')
"""

SELECT_NATIONS = """
SELECT
    ntninfo_no,
    ntncd,
    ntnnm,
    useyn
FROM ntninfo
WHERE delyn='N'
    AND (%s = '' OR ntncd ILIKE '%%' || %s || '%%')
    AND (%s = '' OR ntnnm ILIKE '%%' || %s || '%%')
    AND (%s = '' OR useyn = %s)
"""

DELETE_NATION = """
UPDATE ntninfo
SET delyn='Y'
WHERE ntninfo_no=%s
"""

RESET_NATION = """
DELETE FROM ntninfo
"""

COUNT_NATION = """
SELECT COUNT(*)
FROM ntninfo
WHERE ntncd=%s
"""