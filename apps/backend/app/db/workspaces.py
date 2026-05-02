import secrets
import uuid
from datetime import UTC, datetime, timedelta

from asyncpg import UniqueViolationError

from app.db import Acquire


def _slugify(name: str) -> str:
    import re

    base = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    suffix = secrets.token_hex(2)
    return f"{base}-{suffix}" if base else f"workspace-{suffix}"


async def create_workspace_and_admin(
    workspace_name: str,
    user_email: str,
    password_hash: str,
    user_name: str,
) -> tuple[uuid.UUID, str, str]:
    async with Acquire() as conn, conn.transaction():
        user_row = await conn.fetchrow(
            """INSERT INTO users (email, password_hash, name, is_admin)
               VALUES ($1, $2, $3, true) RETURNING id""",
            user_email.lower(),
            password_hash,
            user_name,
        )
        user_id = user_row["id"]

        last_err: UniqueViolationError | None = None
        ws_row = None
        for _ in range(5):
            slug = _slugify(workspace_name)
            try:
                async with conn.transaction():
                    ws_row = await conn.fetchrow(
                        """INSERT INTO workspaces (name, slug, created_by)
                           VALUES ($1, $2, $3) RETURNING id""",
                        workspace_name,
                        slug,
                        user_id,
                    )
                break
            except UniqueViolationError as e:
                last_err = e
        else:
            raise RuntimeError("Could not generate unique workspace slug") from last_err

        workspace_id = ws_row["id"]
        await conn.execute(
            """INSERT INTO workspace_members (workspace_id, user_id, role)
               VALUES ($1, $2, 'admin')""",
            workspace_id,
            user_id,
        )
        return workspace_id, slug, user_id


async def get_by_slug(slug: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, slug, created_by, created_at FROM workspaces WHERE slug = $1",
            slug,
        )
        return dict(row) if row else None


async def get_member_role(workspace_id: uuid.UUID, user_id: str) -> str | None:
    async with Acquire() as conn:
        return await conn.fetchval(
            "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
            workspace_id,
            user_id,
        )


async def list_workspaces_for_user(user_id: str) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """SELECT w.id, w.name, w.slug, wm.role
               FROM workspaces w
               JOIN workspace_members wm ON wm.workspace_id = w.id
               WHERE wm.user_id = $1
               ORDER BY wm.joined_at""",
            user_id,
        )
        return [dict(r) for r in rows]


async def list_members(workspace_id: uuid.UUID) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """SELECT u.id AS user_id, u.name, u.email, wm.role, wm.joined_at
               FROM workspace_members wm
               JOIN users u ON u.id = wm.user_id
               WHERE wm.workspace_id = $1
               ORDER BY wm.joined_at""",
            workspace_id,
        )
        return [dict(r) for r in rows]


async def count_admins(workspace_id: uuid.UUID) -> int:
    async with Acquire() as conn:
        return await conn.fetchval(
            "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = 'admin'",
            workspace_id,
        )


async def update_member_role(workspace_id: uuid.UUID, user_id: str, role: str) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            "UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3",
            role,
            workspace_id,
            user_id,
        )
        return result.endswith(" 1")


async def remove_member(workspace_id: uuid.UUID, user_id: str) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
            workspace_id,
            user_id,
        )
        return result.endswith(" 1")


async def rename_workspace(workspace_id: uuid.UUID, name: str) -> None:
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE workspaces SET name = $1 WHERE id = $2",
            name,
            workspace_id,
        )


async def create_invite(
    workspace_id: uuid.UUID,
    role: str,
    created_by: str,
) -> dict:
    token = secrets.token_urlsafe(18)
    expires_at = datetime.now(UTC) + timedelta(days=14)
    async with Acquire() as conn:
        await conn.execute(
            """INSERT INTO workspace_invites (token, workspace_id, role, created_by, expires_at)
               VALUES ($1, $2, $3, $4, $5)""",
            token,
            workspace_id,
            role,
            created_by,
            expires_at,
        )
    return {"token": token, "role": role, "expires_at": expires_at}


async def get_invite(token: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """SELECT wi.token, wi.workspace_id, wi.role, wi.expires_at, wi.accepted_at,
                      w.name AS workspace_name, w.slug AS workspace_slug,
                      u.name AS inviter_name
               FROM workspace_invites wi
               JOIN workspaces w ON w.id = wi.workspace_id
               LEFT JOIN users u ON u.id = wi.created_by
               WHERE wi.token = $1""",
            token,
        )
        return dict(row) if row else None


async def list_invites(workspace_id: uuid.UUID) -> list[dict]:
    async with Acquire() as conn:
        rows = await conn.fetch(
            """SELECT token, role, created_by, expires_at, accepted_at
               FROM workspace_invites
               WHERE workspace_id = $1 AND accepted_at IS NULL AND expires_at > NOW()
               ORDER BY expires_at""",
            workspace_id,
        )
        return [dict(r) for r in rows]


async def accept_invite(token: str, user_id: str) -> dict | None:
    async with Acquire() as conn, conn.transaction():
        invite = await conn.fetchrow(
            """SELECT workspace_id, role, expires_at, accepted_at
               FROM workspace_invites WHERE token = $1 FOR UPDATE""",
            token,
        )
        if not invite:
            return None
        if invite["accepted_at"] is not None:
            return None
        if invite["expires_at"] < datetime.now(UTC):
            return None
        await conn.execute(
            """INSERT INTO workspace_members (workspace_id, user_id, role)
               VALUES ($1, $2, $3)
               ON CONFLICT (workspace_id, user_id) DO NOTHING""",
            invite["workspace_id"],
            user_id,
            invite["role"],
        )
        await conn.execute(
            """UPDATE workspace_invites
               SET accepted_at = NOW(), accepted_by = $2
               WHERE token = $1""",
            token,
            user_id,
        )
        ws = await conn.fetchrow(
            "SELECT id, slug, name FROM workspaces WHERE id = $1",
            invite["workspace_id"],
        )
        return dict(ws)


async def revoke_invite(workspace_id: uuid.UUID, token: str) -> bool:
    async with Acquire() as conn:
        result = await conn.execute(
            """UPDATE workspace_invites
               SET expires_at = NOW()
               WHERE token = $1 AND workspace_id = $2""",
            token,
            workspace_id,
        )
        return result.endswith(" 1")
