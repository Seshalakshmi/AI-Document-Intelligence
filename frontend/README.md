# AI Document Intelligence - Frontend

The frontend application is a Next.js project written in TypeScript. It provides a user-friendly interface for document upload, search, chat, and account management.

## Features

- User authentication and session handling
- Document upload interface
- Document search and browsing
- Interactive AI chat for document questions
- Dashboard with document previews
- Admin user lists and management pages

## Prerequisites

- Node.js 20+
- npm, yarn, or pnpm

## Setup

```powershell
cd frontend
npm install
```

## Run the frontend

```powershell
npm run dev
```

Open `http://localhost:3000` in the browser.

## Build for production

```powershell
npm run build
npm run start
```

## Linting

```powershell
npm run lint
```

## Notes

- The frontend expects the backend API to be available at NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.
- If you need to change the backend address, update your API client configuration inside the frontend application.
- The UI is organized into pages for login, registration, document upload, search, dashboard, and admin management.
