from app.db import Acquire


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
            "SELECT id, name, email, org_id, password_hash FROM users WHERE email = $1",
            email.lower(),
        )
        return dict(row) if row else None


async def create_org(name: str) -> str:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO orgs (name) VALUES ($1) RETURNING id",
            name,
        )
        return row["id"]


async def create_user(email: str, password_hash: str, name: str, org_id: str) -> str:
    async with Acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO users (email, password_hash, name, org_id) VALUES ($1, $2, $3, $4) RETURNING id",
            email.lower(),
            password_hash,
            name,
            org_id,
        )
        return row["id"]


async def create_org_and_user(org_name: str, email: str, password_hash: str, name: str) -> tuple[str, str]:
    async with Acquire() as conn:
        async with conn.transaction():
            org_row = await conn.fetchrow(
                "INSERT INTO orgs (name) VALUES ($1) RETURNING id",
                org_name,
            )
            org_id = org_row["id"]
            user_row = await conn.fetchrow(
                "INSERT INTO users (email, password_hash, name, org_id) VALUES ($1, $2, $3, $4) RETURNING id",
                email.lower(),
                password_hash,
                name,
                org_id,
            )
            return org_id, user_row["id"]
