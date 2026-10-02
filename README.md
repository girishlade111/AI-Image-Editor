# LadeStack AI Image Editor

A free, browser-based AI-powered image editor built with Next.js: canvas editing with layers, filters and brushes (fabric.js), plus one-click AI tools — background removal, object cleanup and upscaling.

## Features

- **Canvas editor** (`/editor`) powered by fabric.js: layers, shapes, text, brushes, image filters
- **AI background removal** — via remove.bg API (`app/api/remove-bg`)
- **AI cleanup** — remove objects/distractions via ClipDrop cleanup API (`app/api/cleanup`)
- **AI upscale** — image upscaling via ClipDrop (`app/api/upscale`)
- State management with zustand; Radix UI + Tailwind CSS components; framer-motion transitions
- TypeScript, Next.js 14 App Router

## Tech stack

- Next.js 14.2, React 18, TypeScript 5
- fabric.js 5 (canvas engine), zustand (state), Radix UI, Tailwind CSS 3
- Server API routes proxying remove.bg and ClipDrop

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev
```

Open http://localhost:3000 (home) or http://localhost:3000/editor (the editor).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `REMOVE_BG_API_KEY` | API key for remove.bg (background removal) |
| `CLIPDROP_API_KEY` | API key for ClipDrop (cleanup + upscale) |

The canvas editor works fully client-side without keys; the three AI tools return 4xx/5xx until these keys are configured.

## Project structure

```
app/
├── page.tsx            # landing page
├── editor/page.tsx     # editor shell
└── api/
    ├── remove-bg/route.ts
    ├── cleanup/route.ts
    └── upscale/route.ts
components/editor/      # editor UI (toolbar, layers panel, canvas)
lib/                    # fabric helpers, utilities
store/                  # zustand stores
```

## Deploy notes

Needs a Node-capable host (Netlify / Vercel / VPS) because of the server API routes, and the two API keys above. Static export is not possible (route handlers).

---

Built by [Girish Lade](https://ladestack.in)
