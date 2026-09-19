INSERT_BANK = """
INSERT INTO bninfr
(bninfr_no, bncd, bnnm, useyn, delyn)
VALUES (%s, %s, %s, %s, 'N')
"""

SELECT_BANKS = """
SELECT 
  bninfr_no
, bncd
, bnnm
, useyn
, delyn
FROM bninfr
WHERE delyn='N'
"""

DELETE_BANK = """
UPDATE bninfr
SET delyn='Y'
WHERE bninfr_no=%s
"""

RESET_BANK = """
DELETE FROM bninfr
"""

COUNT_BANK =  """
SELECT COUNT(*)
FROM bninfr
WHERE bncd=%s
"""

SEARCH_BANK = """
SELECT
    bninfr_no,
    bncd,
    bnnm,
    useyn,
    delyn
FROM bninfr
WHERE
    delyn='N'
"""