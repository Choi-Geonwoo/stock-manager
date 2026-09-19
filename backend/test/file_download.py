import os
import oracledb

# 1. 오라클 데이터베이스 연결 정보 설정
db_config = {
    "user": "user001",
    "password": "user001",
    "dsn": "192.168.219.105:1521/orclpdb"  # 확인한 실제 IP 입력
}

# 기본 다운로드 루트 디렉토리
BASE_DOWNLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "uploads")
)


def download_blob_files():
    connection = None
    cursor = None
    
    try:
        # 2. DB 연결
        connection = oracledb.connect(**db_config)
        cursor = connection.cursor()
        
        # 3. 파일 정보 조회를 위한 SQL 쿼리 (제공해주신 쿼리 반영)
        query = """
            SELECT
                fileInfo.FILENM,
                fileInfo.FILEINFO,
                regexp_replace(alctnDlngDsctn.DLNGYMD, '[[:punct:]]', '') AS DLNGYMD 
            FROM
                fileInfo ,
                alctnDlngDsctn
            WHERE
                fileInfo.ALCTNDLNGDSCTN_NO = alctnDlngDsctn.ALCTNDLNGDSCTN_NO(+)
                AND fileInfo.DELYN = 'N'
                AND fileInfo.FILEINFO IS NOT NULL
        """
        
        cursor.execute(query)
        
        print("파일 다운로드를 시작합니다...")
        download_count = 0
        
        # [수정 포인트] SELECT 순서에 맞춰 변수 순서를 매칭했습니다.
        # 1번째: file_name (FILENM)
        # 2번째: file_blob (FILEINFO)
        # 3번째: dlng_ymd  (DLNGYMD)
        for file_name, file_blob, dlng_ymd in cursor:
            
            # 1. 거래일자(DLNGYMD) 폴더 경로 지정
            # 만약 DB 값이 비어있거나 NULL이면 'no_date' 폴더로 분류
            date_folder_name = dlng_ymd if dlng_ymd else "no_date"
            target_dir = os.path.join(BASE_DOWNLOAD_DIR, date_folder_name)
            
            # 2. 해당 날짜 폴더가 없으면 자동으로 생성
            if not os.path.exists(target_dir):
                os.makedirs(target_dir, exist_ok=True)
                print(f"[폴더 생성] {target_dir}")
            
            # 3. 파일명 기본값 처리 및 전체 파일 경로 구성
            if not file_name:
                file_name = f"unknown_file_{download_count}"
            file_path = os.path.join(target_dir, file_name)
            
            # 4. 파일 저장
            with open(file_path, 'wb') as f:
                if hasattr(file_blob, 'read'):
                    f.write(file_blob.read())
                else:
                    f.write(file_blob)
                    
            print(f" └ [저장 완료] {file_path}")
            download_count += 1
            
        print(f"\n총 {download_count}개의 파일이 날짜별 폴더에 분류되어 저장되었습니다.")
        
    except oracledb.DatabaseError as e:
        error, = e.args
        print(f"데이터베이스 오류 발생: {error.message}")
    except Exception as e:
        print(f"일반 오류 발생: {e}")
        
    finally:
        # 5. 리소스 해제
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    download_blob_files()



    ### python3 "backend\test\file_download.py"
    ### python3 "\\wsl$\Ubuntu\home\cwahg\project\stock-manager\backend\test\file_download.py"