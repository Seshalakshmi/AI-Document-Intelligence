# AI Document Intelligence - Frontend

The frontend is a Next.js TypeScript application for document upload, browsing, search, chat, invoice review, comments, authentication, and admin user management.

## Features

- Login and registration.
- Authenticated session handling.
- Dashboard with document counts and activity visualizations.
- Document upload with progress feedback.
- Document browsing and detail views.
- Chunk and invoice data display.
- Document comments.
- Keyword, semantic, and hybrid search.
- Document-level chat and global document chat.
- Admin user management.

## Prerequisites

- Node.js 20+
- npm, yarn, or pnpm
- Backend API running at `http://127.0.0.1:5002` for local development

## Setup

```powershell
cd frontend
npm install
```

Create `frontend/.env.local` when you need to set or override the backend origin:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5002
```

The API client appends `/api` automatically, so do not include `/api` in `NEXT_PUBLIC_API_BASE_URL`.

## Run the Frontend

```powershell
npm run dev
```

Open `http://localhost:3000` in the browser.

## Build for Production

```powershell
npm run build
npm run start
```

## Linting

```powershell
npm run lint
```

## Backend Connection

The frontend API client reads:

```env
NEXT_PUBLIC_API_BASE_URL
```

If the variable is not set, the current code falls back to `http://localhost:8000`. For the standard local backend, set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5002`.

Common local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:5002`
- Backend API docs: `http://127.0.0.1:5002/docs`

## Deployment

The root `netlify.toml` builds this app from the `frontend` directory:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = ".next"
```

For deployment, set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend origin.

## Notes

- The UI is organized into pages for login, registration, dashboard, upload, documents, search, chat, and admin users.
- The frontend expects backend routes under `/api`.
- Document preview, thumbnail, chat, comments, and invoice review depend on matching backend endpoints.
