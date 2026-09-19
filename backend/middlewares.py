import time
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        now = datetime.now()
        # (YYYYMMDD_HHMMSS_SSS) 형식 적용
        timestamp = f"({now.strftime('%Y%m%d_%H%M%S')}_{str(now.microsecond)[:3]})"
        start_time = time.time()
        print("□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■")
        # 1. 요청(REQ) 로그
        print(f"[{timestamp}] [REQ] {request.method} {request.url.path}")
        
        # 2. 실제 비즈니스 로직(라우터) 실행
        response = await call_next(request)
        
        # 3. 응답(RES) 로그
        process_time = (time.time() - start_time) * 1000
        print(f"[{timestamp}] [RES] {request.method} {request.url.path} - Status: {response.status_code} ({process_time:.2f}ms)")
        print("□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■")
        return response