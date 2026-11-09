# py-peer-frontend

React + Vite + TypeScript web UI for the
[Universal Connectivity](https://github.com/sumanjeet0012/universal-connectivity)
`py-peer` implementation.

The frontend is a standalone project. It talks to the Python peer over the
Tornado REST (`/api/v1/*`) and WebSocket (`/ws/*`) API and contains no Python
runtime code.

## Requirements

- Node.js 18+ and npm
- A running `py-peer` API backend (see below)

## Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Open <http://localhost:3000>. The dev server proxies `/api` and `/ws` to
`http://localhost:8765`, so no environment file is required.

Start the backend from the `py-peer` checkout in a second terminal:

```bash
cd ../universal-connectivity/py-peer
python main.py --api --nick Alice --api-port 8765
```

## Production / remote backend

Set `VITE_API_URL` to the full origin of the backend before building:

```bash
cp .env.example .env.local
# VITE_API_URL=https://your-backend.example.com
npm run build
```

Leave `VITE_API_URL` empty when the built assets are served by the same origin
as the API, or when a reverse proxy forwards `/api` and `/ws`.

## Scripts

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 3000   |
| `npm run build`   | Type-check with `tsc` and build to `dist` |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint over `src`                    |

## Project layout

```text
├── public/              # Static assets
├── src/
│   ├── api/             # REST client and shared types
│   ├── components/      # Chat, peers, connection, and assistant UI
│   ├── context/         # PyPeer application state and WebSocket wiring
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## History

This project was extracted from
`universal-connectivity/py-peer/py-peer-frontend` with its git history
preserved.
