import uuid

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


async def get_workspace_key(workspace_id: uuid.UUID) -> str | None:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc FROM workspace_credentials WHERE workspace_id = $1",
        workspace_id,
    )
    if not row:
        return None
    return decrypt(row["deepseek_key_enc"])


async def set_workspace_key(workspace_id: uuid.UUID, key: str) -> None:
    await pool().execute(
        """INSERT INTO workspace_credentials (workspace_id, deepseek_key_enc, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (workspace_id) DO UPDATE
           SET deepseek_key_enc = EXCLUDED.deepseek_key_enc, updated_at = NOW()""",
        workspace_id,
        encrypt(key),
    )


async def clear_workspace_key(workspace_id: uuid.UUID) -> None:
    await pool().execute(
        "DELETE FROM workspace_credentials WHERE workspace_id = $1",
        workspace_id,
    )


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


async def get_user_serper_key(user_id: str) -> str | None:
    row = await pool().fetchrow(
        "SELECT serper_key_enc FROM user_credentials WHERE user_id = $1 AND serper_key_enc IS NOT NULL",
        user_id,
    )
    return decrypt(row["serper_key_enc"]) if row else None


async def set_user_serper_key(user_id: str, api_key: str) -> None:
    await pool().execute(
        """
        INSERT INTO user_credentials (user_id, serper_key_enc, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE
            SET serper_key_enc = EXCLUDED.serper_key_enc,
                updated_at = NOW()
        """,
        user_id,
        encrypt(api_key),
    )


async def clear_user_serper_key(user_id: str) -> None:
    await pool().execute(
        "UPDATE user_credentials SET serper_key_enc = NULL WHERE user_id = $1",
        user_id,
    )


async def get_workspace_serper_key(workspace_id: uuid.UUID) -> str | None:
    row = await pool().fetchrow(
        "SELECT serper_key_enc FROM workspace_credentials WHERE workspace_id = $1 AND serper_key_enc IS NOT NULL",
        workspace_id,
    )
    return decrypt(row["serper_key_enc"]) if row else None


async def set_workspace_serper_key(workspace_id: uuid.UUID, api_key: str) -> None:
    await pool().execute(
        """INSERT INTO workspace_credentials (workspace_id, serper_key_enc, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (workspace_id) DO UPDATE
           SET serper_key_enc = EXCLUDED.serper_key_enc, updated_at = NOW()""",
        workspace_id,
        encrypt(api_key),
    )


async def clear_workspace_serper_key(workspace_id: uuid.UUID) -> None:
    await pool().execute(
        "UPDATE workspace_credentials SET serper_key_enc = NULL WHERE workspace_id = $1",
        workspace_id,
    )


async def get_user_serper_key_info(user_id: str) -> dict:
    row = await pool().fetchrow(
        "SELECT serper_key_enc, updated_at FROM user_credentials WHERE user_id = $1",
        user_id,
    )
    if not row or not row["serper_key_enc"]:
        return {"configured": False, "last_four": None, "updated_at": None}
    plaintext = decrypt(row["serper_key_enc"])
    return {
        "configured": True,
        "last_four": plaintext[-4:],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


async def get_workspace_serper_key_info(workspace_id: uuid.UUID) -> dict:
    row = await pool().fetchrow(
        "SELECT serper_key_enc, updated_at FROM workspace_credentials WHERE workspace_id = $1",
        workspace_id,
    )
    if not row or not row["serper_key_enc"]:
        return {"configured": False, "last_four": None, "updated_at": None}
    plaintext = decrypt(row["serper_key_enc"])
    return {
        "configured": True,
        "last_four": plaintext[-4:],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


async def get_workspace_key_info(workspace_id: uuid.UUID) -> dict:
    row = await pool().fetchrow(
        "SELECT deepseek_key_enc, updated_at FROM workspace_credentials WHERE workspace_id = $1",
        workspace_id,
    )
    if not row:
        return {"configured": False, "last_four": None, "updated_at": None}
    plaintext = decrypt(row["deepseek_key_enc"])
    return {
        "configured": True,
        "last_four": plaintext[-4:],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }
