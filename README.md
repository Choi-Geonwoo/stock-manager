# Stock Manager

주식 자산 관리 프로젝트입니다.

## 구성

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL

## 실행

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 환경 설정

루트 디렉터리에 `.env` 파일을 만들고 `.env.example`을 참고해 DB와 실행 환경을 설정합니다. `.env`와 `기본설정.md`는 로컬 전용 파일로 GitHub에 업로드하지 않습니다.