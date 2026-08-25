# Project Gap Analysis

Date: 2026-08-25

## Executive Summary

AI Document Intelligence has a solid full-stack foundation: a FastAPI backend, a Next.js frontend, authentication, document upload, extraction, chunking, search, chat, invoice review, comments, and admin screens are all represented in the repository.

The main gaps are around production readiness, test coverage, environment consistency, deployment completeness, and operational safeguards. The project looks feature-rich for a local development build, but it needs stronger verification, configuration cleanup, and deployment hardening before it should be treated as production-ready.

## Current Project Strengths

- Clear monorepo structure with `backend/` and `frontend/`.
- Backend uses modular FastAPI routers for auth, users, documents, comments, search, chat, and health checks.
- Database migrations are present through Alembic.
- Frontend includes core user workflows: login, registration, dashboard, upload, document detail, search, chat, and admin users.
- Document intelligence pipeline is decomposed into dedicated services for extraction, chunking, embedding, vectorization, search, invoice extraction, descriptions, comments, and chat.
- Authentication uses JWT-style token handling and password hashing.
- Netlify configuration exists for frontend deployment.

## Key Gaps

### 1. Configuration Consistency

The documented backend URL and the frontend default API URL do not currently align.

- Root README says the backend runs at `http://localhost:5002`.
- Backend README says the backend runs at `http://127.0.0.1:5002`.
- Frontend API client defaults to `http://localhost:8000/api`.
- Frontend README references `NEXT_PUBLIC_API_URL`, while the code uses `NEXT_PUBLIC_API_BASE_URL`.

Impact: a fresh setup may fail even when both apps are running because the frontend can call the wrong backend address or use the wrong environment variable.

Recommended fix:

- Standardize on one frontend env var name, preferably `NEXT_PUBLIC_API_BASE_URL`.
- Update README files to match the actual code.
- Add `frontend/.env.example`.
- Consider changing the frontend default API base to `http://localhost:5002`.

### 2. Test Coverage

No obvious test files or test scripts are present for the backend or frontend.

Impact: core flows such as upload, extraction, search, chat, invoice parsing, and authentication can regress silently.

Recommended fix:

- Add backend tests with `pytest` and FastAPI `TestClient`.
- Add frontend tests for critical components and auth state.
- Add integration smoke tests for the upload-to-search path.
- Add CI checks for lint, type checking, backend tests, and frontend build.

Priority test areas:

- User registration and login.
- Protected route behavior.
- Document upload and metadata persistence.
- Text extraction fallback behavior.
- Chunk generation and vectorization.
- Keyword, semantic, and hybrid search.
- Invoice extraction schema handling.
- Chat response behavior when documents are missing, unvectorized, or empty.

### 3. Deployment Readiness

The frontend has a Netlify config, but backend deployment is not described or configured in the root project.

Impact: the app is not yet deployable as a complete system from repository instructions alone.

Recommended fix:

- Document a backend deployment target and required environment variables.
- Add production CORS configuration.
- Add deployment notes for database provisioning and migrations.
- Add a production startup command for the backend.
- Document how the frontend should point to the deployed backend.

### 4. Environment and Secrets Hygiene

The backend has `.env.example`, but the frontend does not appear to have a matching example environment file. The backend also depends on several sensitive or deployment-specific values.

Impact: developers may misconfigure local setup or accidentally depend on hidden local state.

Recommended fix:

- Add `frontend/.env.example`.
- Ensure `.env` files are ignored.
- Document required vs optional variables.
- Validate startup configuration with clear error messages.
- Avoid permissive or hardcoded production defaults for secrets and CORS.

### 5. Data Storage and File Lifecycle

Uploaded PDF files are present under `backend/uploads/`.

Impact: local uploads may be committed or deployed unintentionally, and there may be no documented lifecycle for file retention, cleanup, or external storage.

Recommended fix:

- Confirm `backend/uploads/` is ignored in Git.
- Document local upload storage behavior.
- Add a cleanup or retention strategy.
- For production, move uploaded documents to durable object storage.
- Add access controls around document download or retrieval.

### 6. AI and Embedding Operational Controls

The project includes embedding and chat services, but the operational behavior is not fully documented.

Impact: production use may face cost, latency, reliability, or model-configuration surprises.

Recommended fix:

- Document which model providers are required.
- Add timeout and retry policies around external AI calls.
- Add structured error handling for missing API keys, provider failures, and rate limits.
- Add cost-aware logging or request metrics.
- Add fallback behavior when embedding or chat services are unavailable.

### 7. Observability

Health and readiness endpoints exist, but broader logging and monitoring are not documented.

Impact: debugging production incidents may be difficult.

Recommended fix:

- Add structured backend logs for request IDs, document processing status, extraction errors, and AI calls.
- Add metrics for upload counts, extraction failures, vectorization latency, search latency, and chat latency.
- Track background processing state if document indexing becomes asynchronous.

### 8. Security and Access Control

Authentication exists, but production security posture needs further review.

Impact: document intelligence apps handle sensitive files, so weak access control or accidental cross-user data exposure would be high risk.

Recommended fix:

- Confirm every document, comment, search, chat, and admin endpoint enforces user permissions.
- Add role-based authorization tests.
- Add upload validation for file type, size, and malformed PDFs.
- Add rate limiting for auth, upload, search, and chat endpoints.
- Review CORS, token expiration, secret management, and error-message leakage.

### 9. Database and Migration Workflow

Alembic is present, but the setup docs do not clearly define the migration workflow.

Impact: new environments may start with missing tables or inconsistent schema.

Recommended fix:

- Add setup steps for running `alembic upgrade head`.
- Document whether tables are created by migrations, startup code, or a manual script.
- Add migration checks to CI.
- Keep generated migration history aligned with SQLAlchemy models.

### 10. Documentation Gaps

The root README references `project-gap-analysis.md`, but this file was requested as `project-gap-anaylsis.md`.

Impact: readers following the README link may not find the analysis unless the filename is corrected or the README is updated.

Recommended fix:

- Rename this file to `project-gap-analysis.md`, or update the README link to match this filename.
- Add a short architecture diagram or request-flow overview.
- Document common troubleshooting cases.
- Add API usage examples for upload, search, and chat.

## Priority Roadmap

### Priority 0: Fix Setup Breakages

- Align frontend API env var naming and default backend URL.
- Add `frontend/.env.example`.
- Update README setup instructions.
- Confirm upload directories and local secrets are ignored.

### Priority 1: Add Safety Nets

- Add backend tests for auth, documents, search, comments, and chat.
- Add frontend type/build checks to CI.
- Add at least one end-to-end smoke test for login, upload, and search.
- Document migration commands.

### Priority 2: Production Hardening

- Configure production CORS through environment variables.
- Add file upload limits and validation.
- Add rate limiting.
- Add structured logging and request tracing.
- Add AI provider timeout, retry, and failure handling.

### Priority 3: Product Maturity

- Add document processing status UI.
- Add clearer failure states for extraction, vectorization, and chat.
- Add admin analytics for documents, users, and processing health.
- Add export or review workflows for extracted invoice data.

## Suggested Definition of Done

The project can be considered ready for a production beta when:

- A new developer can run the full app from the README without guessing env var names or ports.
- CI runs backend tests, frontend linting, type checks, and frontend build.
- Core workflows have automated coverage.
- Document access is permission-checked across backend routes.
- Upload storage, retention, and deployment strategy are documented.
- Production environment variables, CORS, and secrets are configured without hardcoded local assumptions.
- AI and embedding failures produce clear user-facing and operator-facing errors.

