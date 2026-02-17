# CollabBoard

Real-time collaborative whiteboard with AI-powered board manipulation.

**Live Demo:** _[Deployed URL here]_

## Architecture

```
Browser (React + Konva.js)
    |
    |── Supabase Realtime (WebSocket)
    |       |── Object sync (broadcast)
    |       |── Cursor positions (broadcast)
    |       |── Presence tracking (presence)
    |       └── Persistence (PostgreSQL)
    |
    └── AI Server (FastAPI)
            |── Claude Sonnet 4.5 (agentic tool-calling loop)
            └── Supabase (service role, bypasses RLS)
```

**Frontend:** React 19, react-konva (canvas rendering), Zustand (state), React Router
**Backend:** Supabase (PostgreSQL, Auth, Realtime), FastAPI + Claude API
**Auth:** Google OAuth via Supabase
**Deployment:** Vercel (frontend), Render (AI server)

### Real-Time Sync Strategy

1. **Optimistic UI** — local state updates instantly on user action
2. **Broadcast** — change is broadcast to all connected users via Supabase Realtime
3. **Persist** — change is written to PostgreSQL
4. **Conflict resolution** — last-write-wins based on `updated_at` timestamps
5. **Reconnection** — channel health polling with exponential backoff; full board re-fetch on reconnect

### Database Schema

- **boards** — id, title, created_by, created_at
- **board_objects** — id, board_id, type, x, y, width, height, rotation, color, text, z_index, metadata, timestamps
- **board_members** — board_id, user_id, role (owner/editor/viewer)

RLS policies ensure users can only access boards they're members of.

## Features

### Core Whiteboard
- Infinite canvas with pan (drag) and zoom (scroll wheel, 0.1x–5x)
- 7 object types: sticky notes, rectangles, circles, lines, text, frames, connectors
- Click-to-place workflow: select tool, click canvas to position
- Multi-select (shift-click, drag-to-select), copy/paste, duplicate, delete
- Resize and rotate via transformer handles
- Edge-to-edge connector drawing with auto-routing
- Color picker (15 colors)
- Background dot grid that scales with zoom

### Real-Time Collaboration
- Live multiplayer cursors with user names
- Instant object sync across all connected users
- Presence awareness (who's online)
- Connection status indicator with auto-reconnection
- Board state survives all users leaving and returning

### AI Board Agent
- Natural language commands via chat panel
- 10 tools: create sticky notes/shapes/frames/connectors, move, resize, recolor, update text, delete, get board state
- Template layouts: SWOT analysis, kanban boards, retrospectives, grids
- Multi-step command execution with Claude's agentic loop
- All AI-created objects sync to all users in real-time
- Rate limited (10 commands/min per board) with 60s timeout

### Board Management
- Create, rename, delete boards from homepage
- Share boards via URL (auto-join on visit)
- Inline title editing on the canvas

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project (with Google OAuth configured)
- Anthropic API key

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_SERVER_URL=http://localhost:8000
```

```bash
npm run dev
```

### AI Server

```bash
cd ai-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `ai-server/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
ALLOWED_ORIGINS=["http://localhost:5173"]
```

```bash
uvicorn app.main:app --reload --port 8000
```

### Database

Run the Supabase migrations in order:
```bash
cd supabase
supabase db push
```

Or apply migrations manually from `supabase/migrations/` (001 through 006).

### Google OAuth Setup

1. Create OAuth credentials in Google Cloud Console
2. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Configure the Google provider in Supabase Dashboard > Authentication > Providers

## Performance

- **Viewport culling** — only objects within visible bounds (+200px padding) are rendered
- **React.memo** — all 7 shape components are memoized to skip unnecessary re-renders
- **Throttled sync** — drag moves broadcast at 50ms intervals, cursor at 50ms
- **perfectDrawEnabled={false}** — disables Konva's sub-pixel smoothing for speed
- **Target:** 500+ objects, 5+ concurrent users, 60 FPS

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected objects |
| Cmd+D | Duplicate selected |
| Cmd+C / Cmd+V | Copy / Paste |
| Cmd+A | Select all |
| Escape | Cancel current action |
| Scroll wheel | Zoom in/out |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Canvas | Konva.js + react-konva |
| UI Framework | React 19 |
| State | Zustand |
| Routing | React Router DOM 7 |
| Backend | Supabase (PostgreSQL, Realtime, Auth) |
| AI | Claude Sonnet 4.5 via Anthropic API |
| AI Server | FastAPI + Uvicorn |
| Deployment | Vercel (frontend) + Render (AI server) |
