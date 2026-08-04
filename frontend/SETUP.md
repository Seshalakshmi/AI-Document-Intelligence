# Wiring up the fresh Next.js scaffold

Your `create-next-app` run used the "recommended defaults" flow, which created:
- `app/` at the **project root** (no `src/` folder)
- Path alias `@/*` → `./*` (root-relative, already set up in `tsconfig.json`)
- **Tailwind v4** (CSS-first config, no `tailwind.config.js`)

Every file below has been adapted to that exact structure — using `@/...`
imports instead of fragile `../../../` relative paths.

## 1. Copy these files into `frontend/`

```
types/index.ts
lib/api.ts
hooks/useAuth.tsx
components/ui/AppShell.tsx
components/ui/Navbar.tsx
components/ui/Sidebar.tsx
components/ui/StatusBadge.tsx
components/ui/DocumentCard.tsx
components/ui/ChunkList.tsx
components/ui/ConfidenceBadge.tsx
components/ui/SearchResultCard.tsx
components/ui/FileDropzone.tsx
components/ui/ChatPanel.tsx
app/layout.tsx              -- REPLACES the default one create-next-app made
app/page.tsx                -- REPLACES the default landing page
app/login/page.tsx
app/register/page.tsx
app/dashboard/page.tsx
app/upload/page.tsx
app/search/page.tsx
app/documents/[id]/page.tsx
app/admin/users/page.tsx
```

Since `mkdir` doesn't create the `documents\[id]` folder cleanly in
PowerShell (brackets are special characters there), use:

```powershell
New-Item -ItemType Directory -Path "app\documents\[id]" -Force
```

## 2. Update `app/globals.css`

Open the `globals.css` that `create-next-app` already generated (it starts
with `@import "tailwindcss";`). **Don't replace it** — just paste the
contents of `globals.css.additions.txt` in at the top, above the existing
content. This defines the `accent` color and `.container` utility our
components use, since Tailwind v4 doesn't ship these as defaults.

## 3. Set your backend URL (optional but recommended)

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Adjust the port if your backend actually runs elsewhere (see the port
discussion from earlier — check whether you launch it with
`uvicorn app.main:app --reload` [defaults to 8000] or `python -m app.main`
[runs on 5002 per the `__main__` block]).

## 4. Restart the dev server

```powershell
npm run dev
```

Visit `http://localhost:3000` — you should be redirected to `/login`.

## 5. Before you can log in: start your backend + fix CORS

Your backend's CORS in `main.py` needs to allow `http://localhost:3000`
(it likely already does, since that's the default). Start it, then try
registering a new account through the UI.

## What's intentionally still a stub

- **Chat** (`lib/api.ts` → `askDocumentQuestion`) is mocked. Your
  `backend/app/api/routes/chat.py` has no routes yet — swap the mock
  implementation for a real fetch call once you build that endpoint. No
  other file needs to change when you do.
- **AI Summary** panel on the document detail page is a placeholder — no
  backend endpoint exists for it yet.
- **Semantic/hybrid search** will return empty results until documents are
  vectorized, which itself requires `OPENAI_API_KEY` set server-side.

## If something breaks

Send me the exact terminal error (or browser console error) and which file
you were adding when it happened — with everything now wired through the
`@/` alias, the error should point straight at the actual file, no more
relative-path guessing.
