import json
import uuid

from app.db import Acquire


async def list_threads_for_doc(doc_id: uuid.UUID) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                t.id, t.doc_id, t.resolved, t.created_by, t.created_at,
                u.name AS creator_name, u.email AS creator_email,
                COALESCE(
                    (
                        SELECT jsonb_agg(jsonb_build_object(
                            'id', m.id::text,
                            'thread_id', m.thread_id::text,
                            'author_id', m.author_id,
                            'author_name', au.name,
                            'author_email', au.email,
                            'body', m.body,
                            'created_at', m.created_at
                        ) ORDER BY m.created_at)
                        FROM comment_messages m
                        JOIN users au ON au.id = m.author_id
                        WHERE m.thread_id = t.id
                    ),
                    '[]'::jsonb
                ) AS messages
            FROM comment_threads t
            JOIN users u ON u.id = t.created_by
            WHERE t.doc_id = $1
            ORDER BY t.created_at
            """,
            doc_id,
        )
        result = []
        for r in rows:
            row = dict(r)
            raw = row.get("messages")
            if isinstance(raw, str):
                row["messages"] = json.loads(raw)
            result.append(row)
        return result


async def create_thread(thread_id: uuid.UUID, doc_id: uuid.UUID, author_id: str, body: str) -> dict:
    async with Acquire() as conn, conn.transaction():
        await conn.execute(
            "INSERT INTO comment_threads (id, doc_id, created_by) VALUES ($1, $2, $3)",
            thread_id,
            doc_id,
            author_id,
        )
        msg = await conn.fetchrow(
            "INSERT INTO comment_messages (thread_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, created_at",
            thread_id,
            author_id,
            body,
        )
    return {"id": msg["id"], "created_at": msg["created_at"]}


async def add_message(thread_id: uuid.UUID, author_id: str, body: str) -> dict | None:
    async with Acquire() as conn:
        exists = await conn.fetchval("SELECT 1 FROM comment_threads WHERE id = $1", thread_id)
        if not exists:
            return None
        row = await conn.fetchrow(
            "INSERT INTO comment_messages (thread_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, created_at",
            thread_id,
            author_id,
            body,
        )
        return {"id": row["id"], "created_at": row["created_at"]}


async def set_resolved(thread_id: uuid.UUID, resolved: bool) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            "UPDATE comment_threads SET resolved = $1 WHERE id = $2",
            resolved,
            thread_id,
        )
        return result == "UPDATE 1"


async def delete_thread(thread_id: uuid.UUID, user_id: str) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            "DELETE FROM comment_threads WHERE id = $1 AND created_by = $2",
            thread_id,
            user_id,
        )
        return result == "DELETE 1"


async def get_doc_id(thread_id: uuid.UUID) -> uuid.UUID | None:
    async with Acquire() as conn:
        return await conn.fetchval("SELECT doc_id FROM comment_threads WHERE id = $1", thread_id)
