# Readme-Gen

Generate polished `README.md` files from a GitHub repository URL, then refine them with AI-assisted edits.

## Stack

- React 19 + TypeScript
- Vite
- Gemini API (`@google/genai`)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env.local
```

3. Add your Gemini and Supabase keys in `.env.local`:

```env
VITE_GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Start dev server:

```bash
npm run dev
```

If PowerShell blocks `npm` scripts on your machine, run:

```powershell
npm.cmd run dev
```

## Authentication

- Supported providers: GitHub OAuth and email/password (Supabase Auth)
- Google OAuth is not enabled in this project

## Storage Setup

Run the SQL in `supabase/readme_files.sql` inside your Supabase SQL Editor to create:
- `public.readme_files` table
- row-level security policies
- update timestamp trigger

## Scripts

- `npm run dev` - start Vite dev server (port `3000`)
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run typecheck` - TypeScript check
- `npm run clean` - remove `dist/`

## Project Structure

```text
src/
  App.tsx
  main.tsx
  index.css
  services/
    gemini.ts
    github.ts
  types.ts
```
