import asyncio
import json
from typing import Literal

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.graph import build_graph

app = FastAPI(title="LangGraph Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


class ResearchRequest(BaseModel):
    query: str
    output_mode: Literal["chat", "report"] = "chat"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest):
    try:
        result = await asyncio.to_thread(
            graph.invoke,
            {
                "query": request.query,
                "sub_tasks": [],
                "research_results": [],
                "code_results": [],
                "synthesis": "",
                "output": "",
                "output_mode": request.output_mode,
                "messages": [HumanMessage(content=request.query)],
                "next_agent": "",
            },
        )
        return {
            "output": result.get("output", ""),
            "research_results": result.get("research_results", []),
            "code_results": result.get("code_results", []),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.websocket("/ws/research")
async def websocket_research(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)

            initial_state = {
                "query": request["query"],
                "sub_tasks": [],
                "research_results": [],
                "code_results": [],
                "synthesis": "",
                "output": "",
                "output_mode": request.get("output_mode", "chat"),
                "messages": [HumanMessage(content=request["query"])],
                "next_agent": "",
            }

            for event in graph.stream(initial_state, stream_mode="updates"):
                for node_name, node_output in event.items():
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "agent_update",
                                "agent": node_name,
                                "data": _serialize_output(node_output),
                            }
                        )
                    )

            await websocket.send_text(json.dumps({"type": "done"}))

    except WebSocketDisconnect:
        pass


def _serialize_output(output: dict) -> dict:
    serializable = {}
    for key, value in output.items():
        if key == "messages":
            serializable[key] = [
                {"content": m.content, "name": getattr(m, "name", "")}
                for m in value
                if hasattr(m, "content")
            ]
        else:
            serializable[key] = value
    return serializable
