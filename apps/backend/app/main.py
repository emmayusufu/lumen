import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import close_pool, init_pool
from app.db.migrations import run_pending as run_migrations
from app.middleware.auth import attach_user
from app.middleware.opa import close_opa_client
from app.observability import setup_logging, setup_tracing
from app.routers.ai import router as ai_router
from app.routers.auth import router as auth_router
from app.routers.comments import router as comments_router
from app.routers.comments import thread_router as comment_thread_router
from app.routers.docs import collab_router
from app.routers.docs import router as docs_router
from app.routers.factcheck import router as factcheck_router
from app.routers.invites import router as invites_router
from app.routers.settings import router as settings_router
from app.routers.uploads import router as uploads_router
from app.routers.workspaces import router as workspace_router
from app.routers.workspaces import workspaces_router

log = logging.getLogger("lumen")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    await run_migrations()
    yield
    await close_opa_client()
    await close_pool()


setup_logging()
app = FastAPI(title="Lumen", lifespan=lifespan)
setup_tracing(app)

app.middleware("http")(attach_user)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(docs_router)
app.include_router(collab_router)
app.include_router(ai_router)
app.include_router(factcheck_router)
app.include_router(settings_router)
app.include_router(uploads_router)
app.include_router(comments_router)
app.include_router(comment_thread_router)
app.include_router(workspace_router)
app.include_router(workspaces_router)
app.include_router(invites_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
