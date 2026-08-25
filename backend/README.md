# AI Document Intelligence - Backend

The backend is a FastAPI service for document processing, search, chat, comments, authentication, and admin user management. All API routers are mounted under `/api`.

## What Is Included

- FastAPI application with modular routers.
- SQLAlchemy models and database access.
- Alembic migrations.
- JWT-based authentication.
- User registration, current-user lookup, and admin user management.
- Document upload, metadata storage, text extraction, chunking, and vectorization.
- Keyword, semantic, hybrid, invoice, similar-document, and duplicate search.
- Document-level chat and global chat across vectorized documents.
- Invoice extraction and review endpoints.
- Document comments.
- Health, readiness, and database status endpoints.

## Requirements

- Python 3.11+
- `pip`
- A supported database engine via `DATABASE_URL`
- Optional: Tesseract OCR for OCR fallback
- Optional: OpenAI API credentials for LLM-backed features

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
copy .env.example .env
```

For macOS or Linux activation, use:

```bash
source .venv/bin/activate
```

## Environment Variables

Required:

```env
DATABASE_URL=sqlite:///./database.db
SECRET_KEY=replace-with-a-generated-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
```

Optional:

```env
OPENAI_API_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
TESSERACT_CMD=
```

Generate a local secret with:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

## Database

Run migrations before starting a fresh database:

```powershell
alembic upgrade head
```

For local development, SQLite is supported:

```env
DATABASE_URL=sqlite:///./database.db
```

## Run the Backend

```powershell
python -m app.main
```

The backend runs by default at `http://127.0.0.1:5002`.

## Documentation

Once running, OpenAPI documentation is available at:

- `http://127.0.0.1:5002/docs`
- `http://127.0.0.1:5002/redoc`

## API Highlights

- `GET /` - root welcome message.
- `POST /api/auth/login` - authenticate a user.
- `POST /api/users/register` - register a new user.
- `GET /api/users/me` - retrieve the current user profile.
- `GET /api/users/` - list users, admin only.
- `PUT /api/users/{user_id}` - update a user.
- `DELETE /api/users/{user_id}` - delete a user, admin only.
- `GET /api/documents/` - list uploaded documents.
- `POST /api/documents/upload/{user_id}` - upload and process a document.
- `GET /api/documents/{document_id}` - retrieve document metadata.
- `GET /api/documents/{document_id}/chunks` - retrieve document chunks.
- `POST /api/documents/{document_id}/chunks/rebuild` - rebuild chunks.
- `POST /api/documents/{document_id}/vectorize` - vectorize a document.
- `GET /api/documents/{document_id}/invoice-data` - retrieve extracted invoice data.
- `PUT /api/documents/{document_id}/invoice-data/review/{user_id}` - review invoice data.
- `GET /api/documents/{document_id}/download` - download the stored document.
- `GET /api/documents/{document_id}/preview` - preview supported file types.
- `GET /api/documents/{document_id}/thumbnail` - retrieve a document thumbnail when available.
- `GET /api/documents/{document_id}/comments` - list comments.
- `POST /api/documents/{document_id}/comments` - post a comment.
- `POST /api/documents/{document_id}/chat` - ask a question about one document.
- `POST /api/chat` - ask a question across all vectorized documents.
- `GET /api/search/keyword` - keyword search.
- `GET /api/search/semantic` - semantic search.
- `GET /api/search/hybrid` - hybrid search.
- `GET /api/search/invoices` - invoice field search.
- `GET /api/search/documents/{document_id}/similar` - similar document search.
- `GET /api/search/documents/{document_id}/duplicates` - duplicate detection.
- `GET /api/health/ready` - readiness probe.
- `GET /api/health/db` - database health check.

## Notes

- CORS currently allows `http://localhost:3000` for local frontend development.
- Uploaded files are stored locally under `uploads` by default.
- Invoice extraction is optional during upload and runs only when `OPENAI_API_KEY` is configured.
- Vectorization uses the configured sentence-transformers model.
- For production, configure durable file storage, production CORS, secret management, logging, and deployment migrations.
