import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.db import close_pool, init_pool
from app.db import sessions as db_sessions
from app.graph import build_graph
from app.middleware.auth import attach_user, current_user
from app.models.user import User
from app.routers.auth import router as auth_router
from app.routers.docs import router as docs_router
from app.routers.sessions import router as sessions_router
from app.routers.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Research Assistant", lifespan=lifespan)

app.middleware("http")(attach_user)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(docs_router)
app.include_router(users_router)


def _initial_state(query: str) -> dict:
    return {
        "query": query,
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "messages": [HumanMessage(content=query)],
        "next_agent": "",
        "completed_agents": [],
        "needs_code": False,
        "research_sufficient": False,
    }


class ResearchRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest, user: User = Depends(current_user)):
    try:
        result = await graph.ainvoke(_initial_state(request.query))
        return {
            "output": result.get("output", ""),
            "research_results": result.get("research_results", []),
            "code_results": result.get("code_results", []),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


def _serialize_message(msg):
    if hasattr(msg, "content"):
        return {"content": msg.content, "name": getattr(msg, "name", "")}
    return {}


@app.post("/api/research/stream")
async def research_stream(request: ResearchRequest, user: User = Depends(current_user)):
    async def event_generator():
        session_id = None
        try:
            session_id = await db_sessions.create_session(user.id, request.query[:80])
            await db_sessions.save_message(session_id, "user", request.query)
        except Exception:
            pass

        output = ""
        async for event in graph.astream(_initial_state(request.query), stream_mode="updates"):
            for node_name, node_output in event.items():
                serializable = {}
                for k, v in node_output.items():
                    if k == "messages":
                        serializable[k] = [_serialize_message(m) for m in v]
                    else:
                        serializable[k] = v
                if node_output.get("output"):
                    output = node_output["output"]
                yield f"data: {json.dumps({'agent': node_name, 'data': serializable})}\n\n"

        if session_id and output:
            try:
                await db_sessions.save_message(session_id, "assistant", output)
                await db_sessions.bump_updated_at(session_id)
            except Exception:
                pass

        done: dict = {"type": "done"}
        if session_id:
            done["session_id"] = str(session_id)
        yield f"data: {json.dumps(done)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
