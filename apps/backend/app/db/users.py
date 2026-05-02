import bcrypt

from app.db import Acquire


async def get_user_by_id(user_id: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, is_admin FROM users WHERE id = $1",
            user_id,
        )
        return dict(row) if row else None


async def get_user_by_email(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email FROM users WHERE email = $1",
            email.lower(),
        )
        return dict(row) if row else None


async def get_user_for_auth(email: str) -> dict | None:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email, password_hash, is_admin FROM users WHERE email = $1",
            email.lower(),
        )
        return dict(row) if row else None


async def create_user(email: str, password_hash: str, name: str) -> str:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO users (email, password_hash, name)
               VALUES ($1, $2, $3) RETURNING id""",
            email.lower(),
            password_hash,
            name,
        )
        return row["id"]


async def update_profile(user_id: str, name: str | None, email: str | None) -> None:
    async with Acquire() as conn:
        if name is not None and email is not None:
            await conn.execute(
                "UPDATE users SET name = $1, email = $2 WHERE id = $3",
                name,
                email.lower(),
                user_id,
            )
        elif name is not None:
            await conn.execute("UPDATE users SET name = $1 WHERE id = $2", name, user_id)
        elif email is not None:
            await conn.execute("UPDATE users SET email = $1 WHERE id = $2", email.lower(), user_id)


async def verify_password(user_id: str, password: str) -> bool:
    async with Acquire() as conn:
        row = await conn.fetchrow("SELECT password_hash FROM users WHERE id = $1", user_id)
    if not row:
        return False
    return bcrypt.checkpw(password.encode(), row["password_hash"].encode())


async def update_password(user_id: str, new_password: str) -> None:
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(12)).decode()
    async with Acquire() as conn:
        await conn.execute(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            hashed,
            user_id,
        )


async def email_exists_for_other_user(email: str, user_id: str) -> bool:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            email.lower(),
            user_id,
        )
    return row is not None


async def anonymize_user(user_id: str) -> None:
    """GDPR-compliant deletion: scrub PII, lock login, drop personal docs.

    Workspaces and shared content are preserved with anonymized authorship
    so co-authors don't lose their work. Solo workspaces (where the user is
    the only member) are deleted along with their docs via FK cascade.
    """
    placeholder_email = f"deleted_{user_id}@example.invalid"
    async with Acquire() as conn, conn.transaction():
        await conn.execute(
            """DELETE FROM workspaces WHERE id IN (
                       SELECT w.id FROM workspaces w
                       LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id != $1
                       WHERE w.created_by = $1 AND m.user_id IS NULL
                   )""",
            user_id,
        )
        await conn.execute("DELETE FROM docs WHERE owner_id = $1 AND workspace_id IS NULL", user_id)
        await conn.execute(
            """UPDATE users
                   SET email = $1,
                       name = 'Deleted user',
                       password_hash = ''
                   WHERE id = $2""",
            placeholder_email,
            user_id,
        )
