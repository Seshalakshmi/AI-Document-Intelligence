# AI Document Intelligence

AI Document Intelligence is a full-stack monorepo for building intelligent document workflows with a FastAPI backend and Next.js frontend. The project supports document upload, AI-powered search, invoice extraction, document chat, user authentication, and admin management.

## Repository Structure

- `backend/` - Python FastAPI service with document models, search and embedding pipelines, authentication, and admin APIs.
- `frontend/` - Next.js TypeScript app with authentication, upload, dashboard, document browsing, search, and admin UI.
- `requirements.txt` - Python dependency manifest for the backend.
- `frontend/package.json` - Node dependency manifest and frontend scripts.
- `project-gap-analysis.md` - Project analysis notes and feature status.

## Key Features

- Document upload and extraction
- Document chunking, vectorization, and duplicate detection
- Keyword, semantic, and hybrid search
- AI-powered chat on documents
- Invoice extraction and review workflows
- JWT authentication and user management
- OpenAPI documentation available from the backend
- Modern responsive frontend built with Next.js, React, and TypeScript

## Backend Overview

The backend is implemented with FastAPI and is exposed under `http://localhost:5002`. It includes:

- Authentication and user registration
- Document upload, metadata extraction, and chunk indexing
- Search APIs for keyword, semantic, hybrid and invoice queries
- Chat endpoint for interactive document conversation
- Health, readiness, and database status checks

### Start the Backend

1. Create a Python virtual environment in the `backend/` directory:

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

3. Copy the sample environment file and configure values:

```powershell
copy .env.example .env
```

4. Open `backend/.env` and set:

- `DATABASE_URL`
- `EMBEDDING_MODEL_NAME`
- `EMBEDDING_DIMENSION`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

5. Run the API server:

```powershell
python -m app.main
```

The backend API will be available at `http://127.0.0.1:5002` and documentation can be viewed at `http://127.0.0.1:5002/docs`.

## Frontend Overview

The frontend is built with Next.js and provides a user-facing interface for signing in, uploading documents, browsing documents, searching, and viewing chat responses.

### Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to access the application.

## Full Project Setup

1. Start the backend.
2. Start the frontend.
3. Open the frontend in the browser.
4. Register or log in and begin uploading documents, searching content, and using the document chat.

## Additional Notes

- Backend configuration is managed in `backend/.env`.
- The frontend connects to the backend service at `http://localhost:5002` by default.
- The backend exposes OpenAPI docs and a Swagger UI at `/docs`.

## Helpful Links

- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- Backend API docs: `http://127.0.0.1:5002/docs`
