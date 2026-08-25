# AI Document Intelligence

AI Document Intelligence is a full-stack document workflow app with a FastAPI backend and a Next.js frontend. It supports document upload, text extraction, chunking, vectorization, search, document chat, invoice extraction, comments, authentication, and admin user management.

## Repository Structure

- `backend/` - FastAPI service with document models, extraction, embeddings, search, chat, authentication, comments, and admin APIs.
- `frontend/` - Next.js TypeScript app for login, registration, dashboard, upload, document review, search, chat, and admin screens.
- `requirements.txt` - Python dependency manifest for the backend.
- `frontend/package.json` - Node dependency manifest and frontend scripts.
- `project-gap-anaylsis.md` - Project gap analysis and recommended next steps.
- `netlify.toml` - Netlify build configuration for the frontend.

## Key Features

- Document upload for PDF, TXT, DOCX, PNG, JPG, and JPEG files.
- Text extraction, chunking, vectorization, and duplicate detection.
- Keyword, semantic, hybrid, invoice, similar-document, and duplicate search endpoints.
- AI-powered chat for one document or the full document library.
- Invoice extraction and review workflows.
- Human comments on document detail pages.
- JWT authentication, registration, current-user lookup, and admin user management.
- OpenAPI documentation from the backend.
- Responsive frontend built with Next.js, React, TypeScript, and Tailwind CSS.

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- A database supported by SQLAlchemy through `DATABASE_URL`
- Optional: Tesseract OCR for scanned images or image-heavy PDFs
- Optional: `OPENAI_API_KEY` for LLM-backed invoice extraction and chat behavior

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set at least:

```env
DATABASE_URL=sqlite:///./database.db
SECRET_KEY=replace-with-a-generated-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
```

Optional backend variables:

```env
OPENAI_API_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
TESSERACT_CMD=
```

Run database migrations:

```powershell
alembic upgrade head
```

Start the backend:

```powershell
python -m app.main
```

The backend runs at `http://127.0.0.1:5002`, and API docs are available at `http://127.0.0.1:5002/docs`.

## Frontend Setup

```powershell
cd frontend
npm install
```

Create `frontend/.env.local` if you need to override the backend URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5002
```

Start the frontend:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Full Local Workflow

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open `http://localhost:3000`.
4. Register or log in.
5. Upload documents.
6. Search, review extracted invoice data, add comments, or ask questions in chat.

## Useful API Paths

- `GET /` - root welcome message.
- `POST /api/auth/login` - log in with OAuth2 password form data.
- `POST /api/users/register` - register a user.
- `GET /api/users/me` - retrieve the current user.
- `GET /api/users/` - list users, admin only.
- `GET /api/documents/` - list uploaded documents.
- `POST /api/documents/upload/{user_id}` - upload a document.
- `GET /api/documents/{document_id}` - retrieve document metadata.
- `GET /api/documents/{document_id}/chunks` - list document chunks.
- `GET /api/documents/{document_id}/invoice-data` - retrieve extracted invoice data.
- `PUT /api/documents/{document_id}/invoice-data/review/{user_id}` - review invoice data.
- `GET /api/documents/{document_id}/comments` - list document comments.
- `POST /api/documents/{document_id}/comments` - post a document comment.
- `POST /api/documents/{document_id}/chat` - ask a question about one document.
- `POST /api/chat` - ask a question across all vectorized documents.
- `GET /api/search/keyword` - keyword search.
- `GET /api/search/semantic` - semantic search.
- `GET /api/search/hybrid` - hybrid search.
- `GET /api/search/invoices` - invoice field search.
- `GET /api/search/documents/{document_id}/similar` - similar document search.
- `GET /api/search/documents/{document_id}/duplicates` - duplicate detection.
- `GET /api/health/ready` - readiness check.
- `GET /api/health/db` - database health check.

## Deployment Notes

- The frontend is configured for Netlify through `netlify.toml`.
- Set `NEXT_PUBLIC_API_BASE_URL` in the frontend deployment environment to the deployed backend origin.
- Deploy the backend separately on a Python-capable host.
- Run Alembic migrations during backend deployment.
- Configure production CORS before exposing the backend outside local development.
- Store uploaded documents in durable object storage for production use.

## Project Status

See `project-gap-anaylsis.md` for the current gap analysis, including configuration, testing, deployment, security, and observability recommendations.

## More Documentation

- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- Backend API docs: `http://127.0.0.1:5002/docs`
