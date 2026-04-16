from app.db import pool
from app.services.crypto import decrypt, encrypt


async def get_user_key(user_id: str) -> str | None:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc FROM user_credentials WHERE user_id = $1",
        user_id,
    )
    return decrypt(row["deepseek_key_enc"]) if row else None


async def set_user_key(user_id: str, api_key: str) -> None:
    await pool().execute(
        """
        INSERT INTO user_credentials (user_id, deepseek_key_enc, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE
            SET deepseek_key_enc = EXCLUDED.deepseek_key_enc,
                updated_at = NOW()
        """,
        user_id,
        encrypt(api_key),
    )


async def delete_user_key(user_id: str) -> None:
    await pool().execute("DELETE FROM user_credentials WHERE user_id = $1", user_id)


async def get_org_key(org_id: str) -> str | None:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc FROM org_credentials WHERE org_id = $1",
        org_id,
    )
    return decrypt(row["deepseek_key_enc"]) if row else None


async def set_org_key(org_id: str, api_key: str) -> None:
    await pool().execute(
        """
        INSERT INTO org_credentials (org_id, deepseek_key_enc, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (org_id) DO UPDATE
            SET deepseek_key_enc = EXCLUDED.deepseek_key_enc,
                updated_at = NOW()
        """,
        org_id,
        encrypt(api_key),
    )


async def delete_org_key(org_id: str) -> None:
    await pool().execute("DELETE FROM org_credentials WHERE org_id = $1", org_id)


async def get_user_key_info(user_id: str) -> dict:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc, updated_at FROM user_credentials WHERE user_id = $1",
        user_id,
    )
    if not row:
        return {"configured": False, "last_four": None, "updated_at": None}
    plaintext = decrypt(row["deepseek_key_enc"])
    return {
        "configured": True,
        "last_four": plaintext[-4:],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


async def get_org_key_info(org_id: str) -> dict:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc, updated_at FROM org_credentials WHERE org_id = $1",
        org_id,
    )
    if not row:
        return {"configured": False, "last_four": None, "updated_at": None}
    plaintext = decrypt(row["deepseek_key_enc"])
    return {
        "configured": True,
        "last_four": plaintext[-4:],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }
