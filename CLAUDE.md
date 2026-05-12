# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

The open-source core of [Anjo](https://anjo.love) — a FastAPI backend + React Native mobile client for a companion AI with persistent, emotionally-aware memory. The commercial build (billing, voice) is not included here; this repo contains the engine.

---

## Commands

```bash
# Install (editable)
pip install -e ".[test]"

# Run the server (dev mode — auto-reload, localhost only)
ANJO_ENV=dev anjo-dashboard
# or directly:
ANJO_ENV=dev uvicorn anjo.dashboard.app:app --reload --port 8000

# CLI chat REPL
anjo chat --user my_user_id

# Run all tests
pytest

# Run a single test file
pytest tests/test_auth.py -v
```

**Required env vars** (copy `.env.example` → `.env`):
- `ANTHROPIC_API_KEY` — Claude API
- `ANJO_SECRET` — HMAC signing secret for session tokens (min 32 random bytes in prod)
- `ANJO_ADMIN_SECRET` — Admin panel key
- `ANJO_BASE_URL` — e.g. `https://yourhost.com`
- `RESEND_API_KEY` — optional; if absent, email verification is skipped and users auto-verify
- `ANJO_ENV=dev` — skips HTTPS enforcement, allows localhost CORS

**Test isolation**: `conftest.py` redirects all DB and file I/O to `tmp_path`, clears in-memory state, and removes real API keys so no external calls are made.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | FastAPI 0.115+ / Uvicorn |
| Conversation orchestration | LangGraph (StateGraph, compiled singleton) |
| LLM | Anthropic Claude Sonnet (responses) + Haiku (background classification/facts) |
| Long-term memory | ChromaDB (local, on disk) |
| Short-term memory | In-process session dict (`session_store.py`) |
| Self-Core state | Per-user JSON files in `data/users/{user_id}/self_core/` |
| Database | SQLite in WAL mode (`data/anjo.db`) — per-thread connections |
| Mobile client | React Native / Expo ~54 (`mobile/` directory) |
| Email | Resend API |

---

## Architecture

### Request Flow

```
nginx → Uvicorn
  → SecurityHeadersMiddleware (CSP, HSTS, Referrer-Policy, etc.)
  → CORSMiddleware
  → RateLimitMiddleware (sliding window, in-memory)
  → AuthMiddleware (HMAC token verification + skip-list)
  → FastAPI routing → route handler
```

Middleware execution order is **reverse** of `add_middleware()` call order.

### Conversation Graph

**Live path** (`chat_routes.py` — streaming SSE):
```
perceive → gate_node ──► [retrieve?] → appraise → respond (streaming)
                     └──► silent (yields done event, no LLM call)
```

**Test/CLI path** (`conversation_graph.py` — compiled LangGraph singleton):
```
perceive → classify ──► retrieve → appraise → respond (non-streaming)
                    └──► appraise → respond
```

- **gate_node**: Single Haiku call. Classifies intent, decides whether to pull long-term memory, decides whether Anjo should respond at all. Defaults to respond on error.
- **retrieve**: Fetches semantic + emotional memory chunks from ChromaDB (~20% of turns).
- **appraise**: OCC emotion appraisal + PAD mood update using classified intent.
- **respond**: Builds system prompt from SelfCore + memories, streams Claude Sonnet response via SSE.

Per-conversation state lives in `session_store._sessions` (in-memory dict, lost on restart).

### Self-Core

`SelfCore` (`anjo/core/self_core.py`) is a Pydantic model representing Anjo's live personality state:
- Loaded from `data/users/{user_id}/self_core/current.json` at session start
- Injected into every system prompt via `prompt_builder.py`
- Updated by the **Reflection Engine** post-conversation

The implementation is split into:
- `AnjoIdentity` — global frozen baseline (shared across all users)
- `RelationalState` — per-user relationship state, persisted to `relational_state.json`
- `SelfCore` — composite facade used throughout the codebase

### Reflection Engine

Full reflection triggers two ways:
1. **Explicit**: `POST /chat/{session_id}/end` — frontend calls this on session close
2. **Automatic**: `_inactivity_watcher()` background task (60s poll) auto-reflects after 10min idle

Mid-session mini-reflection runs every 20 messages in a background thread (`_maybe_mid_reflect()`).

Reflection flow:
1. `run_reflection()` receives the transcript and current `SelfCore`
2. Haiku analyzes the conversation and mutates SelfCore: OCEAN traits, attachment, desires, relationship stage
3. Saves updated SelfCore to disk; clears the session from memory

### Memory: Dual Embeddings

Per session, two embeddings are stored in ChromaDB:
- **Semantic vector**: What happened (content summary)
- **Emotional vector**: How it felt (emotional metadata)

Both are scoped by `user_id`. Retrieval uses cosine similarity with emotion-weighted re-ranking.

### Session Store

`session_store.py` holds an in-memory `_sessions: dict[str, dict]` — one entry per active user. Contains the live SelfCore, conversation history, and token accumulators. Lost on restart. Cleaned up after reflection.

---

## Auth & Security Model

### Two-Role System

**Users** — HMAC-SHA256 signed tokens (`user_id.iat.exp.sig`), 7-day TTL, delivered as `anjo_auth` HttpOnly cookie (web) or `Authorization: Bearer` header (mobile).

**Admin** — Static `ANJO_ADMIN_SECRET` env var, passed as `X-Admin-Key` header to all `/api/admin/*` endpoints.

### Token Verification (`auth.py:verify_token`)

Checks in order:
1. Expiry (`exp > now`)
2. HMAC signature
3. In-memory revocation set (`_revoked_tokens`) — populated on logout
4. `password_changed_at` DB lookup — rejects tokens issued before last password change

### Auth Bypass List

`AuthMiddleware` skips token checking for: `/`, `/login`, `/register`, `/logout`, `/forgot`, `/reset`, `/verify`, static files, `/admin`, all `/api/admin/*`. Admin routes enforce their own `X-Admin-Key` check per-handler.

### Rate Limiting (`app.py:RateLimitMiddleware`)

Sliding window, in-memory, reset on restart:
- `/login`, `/forgot`, `/reset` — 10 req/min per IP
- `/api/auth/*` — 10 req/min per IP
- `/api/chat/*` — 30 req/min per user
- `/api/*` (catch-all) — 120 req/min per user/IP

### Admin Panel

`GET /admin` requires `?key=ANJO_ADMIN_SECRET`. Rotate `ANJO_ADMIN_SECRET` and restart to invalidate.

### Known Structural Limitations

- **Token revocation is in-memory** — clears on restart. `password_changed_at` DB check survives restarts.
- **Admin key has no expiry** — rotate via env var restart.
- **Mobile `AsyncStorage`** stores tokens unencrypted.
- **ChromaDB on disk is unencrypted**.

---

## Database Schema (`anjo/core/db.py`)

SQLite with WAL mode, per-thread connections via `threading.local()`. Schema initializes once per process. Additive migrations run via `_migrate_schema()` on first connection.

Key tables: `users`, `messages`, `facts`, `letter_cache`.

`users` security columns: `hashed_password` (bcrypt factor 12), `reset_token` (UUID4, 1hr TTL), `verification_token`, `password_changed_at`.

---

## Route Organization

All routes are in `anjo/dashboard/routes/`:

| File | Prefix | Responsibility |
|---|---|---|
| `auth_routes.py` | (none) | `/login`, `/register`, `/logout`, `/forgot`, `/reset` — web form flows |
| `mobile_auth_routes.py` | `/api/auth` | JSON login/register for React Native |
| `forget_routes.py` | `/api` | Account settings: email, username, password, deletion |
| `reset_routes.py` | `/api` | `POST /api/reset` — factory reset (requires password) |
| `chat_routes.py` | `/api` | SSE chat stream, session management |
| `admin_routes.py` | (mixed) | `GET /admin` page + `/api/admin/*` API (X-Admin-Key protected) |
| `self_core_routes.py` | `/api` | SelfCore read/update |
| `memory_routes.py` | `/api` | Memory retrieval endpoints |
| `story_routes.py` | `/api` | Story / memory narrative endpoints |

### Input Validation

- **Username**: `^[a-zA-Z0-9_-]+$`, 2–32 chars, enforced at registration and update.
- **Password**: minimum 8 characters, enforced at all auth endpoints.
- **Admin user IDs**: `^[a-zA-Z0-9_-]+$` validated before any DB operation.

---

## Privacy Constraints

- Raw conversation logs are never stored permanently — only embeddings + emotional metadata in ChromaDB
- No human can access user conversations through admin endpoints (metadata/tier only, not content)
- Social Mode (Anjo-to-Anjo) is always opt-in — default OFF, explicit user consent required
