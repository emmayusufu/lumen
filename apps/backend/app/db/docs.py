import json
import uuid

from app.db import Acquire


async def create_doc(
    owner_id: str,
    workspace_id: uuid.UUID,
    title: str,
    parent_id: uuid.UUID | None = None,
) -> uuid.UUID:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO docs (owner_id, workspace_id, title, content, parent_id)
               VALUES ($1, $2, $3, '', $4) RETURNING id""",
            owner_id,
            workspace_id,
            title,
            parent_id,
        )
        return row["id"]


async def is_descendant(root_id: uuid.UUID, candidate: uuid.UUID) -> bool:
    """True if candidate is in the subtree rooted at root_id (incl. root_id itself)."""
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """
            WITH RECURSIVE subtree AS (
                SELECT id FROM docs WHERE id = $1
                UNION ALL
                SELECT d.id FROM docs d JOIN subtree s ON d.parent_id = s.id
            )
            SELECT 1 FROM subtree WHERE id = $2 LIMIT 1
            """,
            root_id,
            candidate,
        )
        return row is not None


async def move_doc(doc_id: uuid.UUID, new_parent_id: uuid.UUID | None) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE docs SET parent_id = $1, updated_at = NOW() WHERE id = $2",
            new_parent_id,
            doc_id,
        )


async def get_role(doc_id: uuid.UUID, user_id: str) -> str | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                CASE
                    WHEN d.owner_id = $2 THEN 'owner'
                    WHEN dc.role IS NOT NULL THEN dc.role
                    WHEN d.visibility = 'workspace' AND wm.role = 'viewer' THEN 'viewer'
                    WHEN d.visibility = 'workspace' AND wm.role IN ('admin','editor') THEN 'editor'
                    ELSE NULL
                END AS role
            FROM docs d
            LEFT JOIN doc_collaborators dc ON dc.doc_id = d.id AND dc.user_id = $2
            LEFT JOIN workspace_members wm ON wm.workspace_id = d.workspace_id AND wm.user_id = $2
            WHERE d.id = $1
            """,
            doc_id,
            user_id,
        )
        return row["role"] if row else None


async def get_doc(doc_id: uuid.UUID) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """SELECT d.id, d.owner_id, d.workspace_id, d.title, d.content,
                      d.visibility, d.parent_id, d.created_at, d.updated_at,
                      w.slug AS workspace_slug
               FROM docs d
               JOIN workspaces w ON w.id = d.workspace_id
               WHERE d.id = $1""",
            doc_id,
        )
        return dict(row) if row else None


async def list_docs(user_id: str, workspace_id: uuid.UUID | None = None) -> list[dict]:
    """List docs the user can access. If workspace_id given, scope to that workspace."""
    async with Acquire() as conn:
        if workspace_id is None:
            rows = await conn.fetch(
                """SELECT d.id, d.title, d.updated_at, d.owner_id, d.workspace_id,
                          d.parent_id,
                          w.slug AS workspace_slug,
                          CASE
                              WHEN d.owner_id = $1 THEN 'owner'
                              WHEN dc.role IS NOT NULL THEN dc.role
                              ELSE 'editor'
                          END AS role
                   FROM docs d
                   JOIN workspaces w ON w.id = d.workspace_id
                   LEFT JOIN doc_collaborators dc ON dc.doc_id = d.id AND dc.user_id = $1
                   LEFT JOIN workspace_members wm ON wm.workspace_id = d.workspace_id AND wm.user_id = $1
                   WHERE d.owner_id = $1
                      OR dc.user_id = $1
                      OR (d.visibility = 'workspace' AND wm.user_id = $1)
                   ORDER BY d.updated_at DESC""",
                user_id,
            )
        else:
            rows = await conn.fetch(
                """SELECT d.id, d.title, d.updated_at, d.owner_id, d.workspace_id,
                          d.parent_id,
                          w.slug AS workspace_slug,
                          CASE
                              WHEN d.owner_id = $1 THEN 'owner'
                              WHEN dc.role IS NOT NULL THEN dc.role
                              ELSE 'editor'
                          END AS role
                   FROM docs d
                   JOIN workspaces w ON w.id = d.workspace_id
                   LEFT JOIN doc_collaborators dc ON dc.doc_id = d.id AND dc.user_id = $1
                   LEFT JOIN workspace_members wm ON wm.workspace_id = d.workspace_id AND wm.user_id = $1
                   WHERE d.workspace_id = $2
                     AND (
                          d.owner_id = $1
                          OR dc.user_id = $1
                          OR (d.visibility = 'workspace' AND wm.user_id = $1)
                     )
                   ORDER BY d.updated_at DESC""",
                user_id,
                workspace_id,
            )
        return [dict(r) for r in rows]


async def update_visibility(doc_id: uuid.UUID, visibility: str) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE docs SET visibility = $1, updated_at = NOW() WHERE id = $2",
            visibility,
            doc_id,
        )


async def update_doc(doc_id: uuid.UUID, title: str | None, content: str | None) -> None:
    if title is None and content is None:
        return
    async with Acquire() as conn:
        if title is not None and content is not None:
            await conn.execute(
                "UPDATE docs SET title = $1, content = $2, updated_at = NOW() WHERE id = $3",
                title,
                content,
                doc_id,
            )
        elif title is not None:
            await conn.execute(
                "UPDATE docs SET title = $1, updated_at = NOW() WHERE id = $2",
                title,
                doc_id,
            )
        elif content is not None:
            await conn.execute(
                "UPDATE docs SET content = $1, updated_at = NOW() WHERE id = $2",
                content,
                doc_id,
            )


async def delete_doc(doc_id: uuid.UUID) -> bool:
    async with Acquire() as conn:
        result = await conn.execute("DELETE FROM docs WHERE id = $1", doc_id)
        return result == "DELETE 1"


async def add_collaborator(doc_id: uuid.UUID, user_id: str, role: str) -> None:
    async with Acquire() as conn:
        await conn.execute(
            """
            INSERT INTO doc_collaborators (doc_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (doc_id, user_id) DO UPDATE SET role = EXCLUDED.role
            """,
            doc_id,
            user_id,
            role,
        )


async def remove_collaborator(doc_id: uuid.UUID, user_id: str) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "DELETE FROM doc_collaborators WHERE doc_id = $1 AND user_id = $2",
            doc_id,
            user_id,
        )


async def list_collaborators(doc_id: uuid.UUID) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT dc.user_id, dc.role, u.name AS display_name, u.email
            FROM doc_collaborators dc
            JOIN users u ON u.id = dc.user_id
            WHERE dc.doc_id = $1
            """,
            doc_id,
        )
        return [dict(r) for r in rows]


async def list_collaborators_for_owner(owner_id: str) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                u.id AS user_id,
                u.email,
                u.name AS display_name,
                COUNT(dc.doc_id) AS doc_count,
                ARRAY_AGG(dc.role) AS roles,
                ARRAY_AGG(jsonb_build_object(
                    'doc_id', d.id::text,
                    'doc_title', d.title,
                    'role', dc.role
                )) AS docs
            FROM doc_collaborators dc
            JOIN docs d ON d.id = dc.doc_id
            JOIN users u ON u.id = dc.user_id
            WHERE d.owner_id = $1
            GROUP BY u.id, u.email, u.name
            ORDER BY u.name NULLS LAST, u.email
            """,
            owner_id,
        )
        result = []
        for r in rows:
            row = dict(r)
            if row.get("docs"):
                row["docs"] = [
                    json.loads(d) if isinstance(d, str) else dict(d) for d in row["docs"]
                ]
            result.append(row)
        return result


async def bulk_remove_collaborator(owner_id: str, user_id: str) -> int:
    async with Acquire() as conn:
        result = await conn.execute(
            """
            DELETE FROM doc_collaborators
            WHERE user_id = $1
              AND doc_id IN (SELECT id FROM docs WHERE owner_id = $2)
            """,
            user_id,
            owner_id,
        )
    return int(result.split()[-1])
