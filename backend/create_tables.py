from database import get_conn

# 1. 안전하게 Connection을 열고 닫기 위해 with 문 사용
with get_conn() as conn:
    cur = conn.cursor()

    # [중요] SQLite 성능 최적화 및 락(Lock) 방지 프래그마 설정
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA busy_timeout=5000;")
    cur.execute("PRAGMA foreign_keys=ON;")  # 외래키 제약조건 활성화

    # ==========================================================================
    # 1. 은행정보
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS bninfr (
        bninfr_no TEXT PRIMARY KEY,
        bncd TEXT UNIQUE,               -- 거래 테이블에서 참조하기 위해 UNIQUE 설정
        bnnm TEXT NOT NULL,
        useyn TEXT DEFAULT 'Y',
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ==========================================================================
    # 2. 국가정보
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS ntninfo (
        ntninfo_no TEXT PRIMARY KEY,
        ntncd TEXT UNIQUE,              -- 주식정보에서 참조하기 위해 UNIQUE 설정
        ntnnm TEXT NOT NULL,
        useyn TEXT DEFAULT 'Y',
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ==========================================================================
    # 3. 주식정보 (티커/종목코드)
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS stckinfo (
        stckinfo_no TEXT PRIMARY KEY,
        ntncd TEXT,
        stcktea TEXT UNIQUE,            -- 거래 테이블에서 참조할 주식 단축코드(티커) UNIQUE
        stcknm TEXT NOT NULL,
        alctn TEXT,
        useyn TEXT DEFAULT 'Y',
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ntncd) REFERENCES ntninfo(ntncd) -- 국가정보 외래키 연결
    )
    """)

    # ==========================================================================
    # 4. 주식거래 내역
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS stckdlngdsctn (
        stckdlngdsctn_no TEXT PRIMARY KEY,
        dlngymd TEXT,
        bncd TEXT,
        stcktea TEXT,
        dlngamt INTEGER,                -- TEXT에서 INTEGER(금액)로 변경
        clsf TEXT,
        byngyn TEXT,
        stckcnt INTEGER,                -- TEXT에서 INTEGER(수량)로 변경
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bncd) REFERENCES bninfr(bncd),      -- 은행 외래키
        FOREIGN KEY (stcktea) REFERENCES stckinfo(stcktea) -- 주식 외래키
    )
    """)

    # ==========================================================================
    # 5. 배당거래 내역
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS alctndlngdsctn (
        alctndlngdsctn_no TEXT PRIMARY KEY,
        bncd TEXT,
        stcktea TEXT,
        dlngymd TEXT,
        dlngamt INTEGER,                -- TEXT에서 INTEGER로 변경
        dvdnd REAL,                     -- 배당률/배당금 계산을 위해 REAL(실수) 혹은 INTEGER로 변경
        filenm TEXT,
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bncd) REFERENCES bninfr(bncd),
        FOREIGN KEY (stcktea) REFERENCES stckinfo(stcktea)
    )
    """)

    # ==========================================================================
    # 6. 파일정보
    # ==========================================================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS fileinfo (
        fileinfo_no TEXT PRIMARY KEY,
        alctndlngdsctn_no TEXT,
        filenm TEXT,
        path TEXT,
        delyn TEXT DEFAULT 'N',
        regday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mdfcnday TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alctndlngdsctn_no) REFERENCES alctndlngdsctn(alctndlngdsctn_no) -- 배당내역 외래키
    )
    """)

    # with 문 종료 시 자동으로 conn.commit()이 수행됩니다.
    # 단, close()는 별도로 안 해줘도 되지만 안전하게 블록 밖에서 처리되거나 스크립트 종료 시 반환됩니다.

print("SQLite 테이블 생성 및 성능 최적화 옵션 적용 완료")