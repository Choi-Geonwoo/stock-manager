from pydantic import BaseModel


# ==========================
# Bank
# ==========================
class BankCreate(BaseModel):
    bncd: str
    bnnm: str
    useyn: str = "Y"


class BankResponse(BaseModel):
    bninfr_no: str
    bncd: str
    bnnm: str
    useyn: str


# ==========================
# Nation
# ==========================
class NationCreate(BaseModel):
    ntncd: str
    ntnnm: str
    useyn: str


class NationResponse(BaseModel):
    ntninfo_no: str
    ntncd: str
    ntnnm: str
    useyn: str


# ==========================
# Stock
# ==========================
class StockCreate(BaseModel):
    ntncd: str
    stcktea: str
    stcknm: str
    alctn: str
    useyn: str


class StockResponse(BaseModel):
    stckinfo_no: str
    ntncd: str
    stcktea: str
    stcknm: str
    alctn: str
    useyn: str


# ==========================
# Trade
# ==========================
class TradeCreate(BaseModel):
    dlngymd: str
    bncd: str
    stcktea: str
    dlngamt: str
    clsf: str
    byngyn: str
    stckcnt: str
    ntnnm: str


class TradeResponse(BaseModel):
    trade_no: str
    dlngymd: str

    bncd: str
    bnnm: str

    stcktea: str
    stcknm: str

    dlngamt: str
    clsf: str
    byngyn: str
    stckcnt: str
    ntnnm: str


# ==========================
# Dividend
# ==========================
class DividendCreate(BaseModel):
    # alctndlngdsctn_no: str
    bncd: str
    stcktea: str
    dlngymd: str
    dlngamt: str
    dvdnd: str
    filenm: str


class DividendResponse(BaseModel):
    alctndlngdsctn_no: str

    bncd: str
    bnnm: str

    stcktea: str
    stcknm: str

    dlngymd: str
    dlngamt: str
    dvdnd: str

    filenm: str
    bnnm: str
    ntnnm: str

class DividendUpdate(BaseModel):
    alctndlngdsctn_no: str

    bncd: str
    stcktea: str
    dlngymd: str
    dlngamt: str = ""
    dvdnd: str = ""
    filenm: str = ""
    bnnm: str = ""
    ntnnm: str = ""