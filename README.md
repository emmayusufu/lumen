# Research Assistant

Multi-agent research assistant that searches the web, reads documentation, finds code examples, and synthesizes findings into structured answers.

Built with LangGraph for agent orchestration, DeepSeek as the LLM, FastAPI for the backend API, and Next.js with Material UI for the frontend.

## Architecture

Uses a supervisor pattern where a central orchestrator routes queries to specialized agents:

- **Planner** — breaks queries into focused sub-tasks
- **Researcher** — searches the web and reads documentation
- **Coder** — finds code examples on GitHub
- **Writer** — synthesizes findings into chat responses or structured reports

## Quick Start

### Prerequisites

- Docker and Docker Compose
- DeepSeek API key ([get one here](https://platform.deepseek.com))

### Run with Docker Compose

```bash
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

### Run Locally (Development)

**Both (via Turborepo):**
```bash
npm install
npx turbo dev
```

**Backend only:**
```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend only:**
```bash
cd apps/web
npm install
npm run dev
```

### Run Tests

```bash
cd apps/backend
source .venv/bin/activate
pytest tests/ -v
```

## Project Structure

```
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agents/      # LangGraph agent nodes
│   │   │   ├── tools/       # Search, scraping, GitHub tools
│   │   │   ├── config.py    # Environment config
│   │   │   ├── graph.py     # LangGraph workflow
│   │   │   ├── main.py      # FastAPI server
│   │   │   └── state.py     # Shared state definition
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── web/
│       ├── src/
│       │   ├── app/         # Next.js pages and layout
│       │   ├── components/  # UI components by domain
│       │   ├── hooks/       # React hooks
│       │   └── lib/         # Types and API client
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── tsconfig/            # Shared TypeScript config
├── turbo.json
├── docker-compose.yml
└── package.json
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | (required) |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | Model name | `deepseek-chat` |
| `GITHUB_TOKEN` | GitHub token (optional, increases rate limits) | |

## Tech Stack

- **LLM**: DeepSeek (via OpenAI-compatible API)
- **Agent Orchestration**: LangGraph
- **Backend**: Python, FastAPI, WebSocket
- **Frontend**: Next.js 16, Material UI, TypeScript
- **Search**: DuckDuckGo (free, no API key)
- **Containerization**: Docker, Docker Compose

## License

MIT
