# mindstory.app

Mindstory is a simple goal-tracking web app built with React, Vite and Supabase.

## Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- A Supabase project with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured in a `.env` file

## Installation

```bash
npm install
```

## Usage

### Development server

```bash
npm run dev
```

Open <http://localhost:5173> in your browser.

### Production build

```bash
npm run build
npm run preview
```

## Local development

1. Create a `.env` file with your Supabase credentials.
2. Run `npm run dev` to start the Vite development server.
3. Edit files under `src/` and the browser will automatically refresh.

