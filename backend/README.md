# AI Document Intelligence - Backend

The backend service is built with FastAPI and provides document processing, search, chat, authentication, and admin APIs.

## What is included

- FastAPI application with modular routers
- SQLAlchemy database integration
- JWT-based authentication support
- Document upload and indexing
- Keyword, semantic, and hybrid search
- Invoice data extraction and review endpoints
- Health and readiness endpoints

## Requirements

- Python 3.11+
- `pip`
- A supported database engine via `DATABASE_URL` (SQLite, PostgreSQL, etc.)

## Setup

1. Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
# On Windows
.\.venv\Scripts\Activate.ps1
# On macOS or Linux
source .venv/bin/activate
```

2. Install dependencies:

```powershell
pip install -r ..\requirements.txt
```

3. Create your `.env` file from the example:

```powershell
copy .env.example .env
```

4. Populate `backend/.env` with your configuration.

## Environment Variables

- `DATABASE_URL` - database connection string
- `EMBEDDING_MODEL_NAME` - embedding model name for vectorization
- `EMBEDDING_DIMENSION` - embedding dimensions
- `SECRET_KEY` - secret key for JWT signing
- `ALGORITHM` - token signing algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - token expiration in minutes

## Run the backend

```powershell
python -m app.main
```

The backend runs by default on `http://127.0.0.1:5002`.

## API Highlights

- `GET /` - root welcome message
- `POST /api/auth/login` - authenticate a user
- `POST /api/user/register` - register a new user
- `GET /api/user/me` - retrieve current user profile
- `GET /api/documents/` - list uploaded documents
- `POST /api/documents/upload/{user_id}` - upload a document for a user
- `GET /api/search/keyword` - keyword-based search
- `GET /api/search/semantic` - semantic search
- `GET /api/search/hybrid` - combined keyword + semantic search
- `POST /api/chat/{document_id}/chat` - AI-driven document chat interaction
- `GET /api/health/ready` - readiness probe
- `GET /api/health/db` - database health check

## Documentation

Once running, OpenAPI documentation is available at:

- `http://127.0.0.1:5002/docs`
- `http://127.0.0.1:5002/redoc`

## Notes

- The backend enables cross-origin requests from `http://localhost:3000`.
- Use a local SQLite database for development like:

```powershell
DATABASE_URL=sqlite:///./database.db
```
