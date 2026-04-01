import asyncio
import json
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.db import close_pool, init_pool
from app.graph import build_graph
from app.middleware.auth import attach_user, current_user
from app.models.user import User


@asynccontextmanager
async def lifespan(app: FastAPI) -> None:
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


def _initial_state(query: str, output_mode: str) -> dict:
    return {
        "query": query,
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "output_mode": output_mode,
        "messages": [HumanMessage(content=query)],
        "next_agent": "",
        "completed_agents": [],
        "needs_code": False,
        "research_sufficient": False,
    }


class ResearchRequest(BaseModel):
    query: str
    output_mode: Literal["chat", "report"] = "chat"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest, user: User = Depends(current_user)):
    try:
        result = await asyncio.to_thread(
            graph.invoke,
            _initial_state(request.query, request.output_mode),
        )
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
        state = _initial_state(request.query, request.output_mode)

        def run_stream():
            events = []
            for event in graph.stream(state, stream_mode="updates"):
                for node_name, node_output in event.items():
                    serializable = {}
                    for k, v in node_output.items():
                        if k == "messages":
                            serializable[k] = [_serialize_message(m) for m in v]
                        else:
                            serializable[k] = v
                    events.append({"agent": node_name, "data": serializable})
            return events

        events = await asyncio.to_thread(run_stream)

        for event in events:
            yield f"data: {json.dumps(event)}\n\n"

        yield 'data: {"type": "done"}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
