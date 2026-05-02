import logging
import re
from pathlib import Path

from app.db import Acquire

log = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"
VERSION_RE = re.compile(r"^\d{3,}")


async def run_pending() -> None:
    if not MIGRATIONS_DIR.exists():
        log.warning("migrations dir not found: %s", MIGRATIONS_DIR)
        return

    async with Acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version    TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        rows = await conn.fetch("SELECT version FROM schema_migrations")
        applied = {r["version"] for r in rows}

        files = sorted(p for p in MIGRATIONS_DIR.glob("*.sql") if VERSION_RE.match(p.stem))
        for path in files:
            version = path.stem
            if version in applied:
                continue
            sql = _strip_meta_commands(path.read_text())
            if not sql.strip():
                continue
            log.info("applying migration %s", version)
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (version) VALUES ($1)",
                    version,
                )


def _strip_meta_commands(sql: str) -> str:
    """Skip `psql`-specific meta commands (e.g. `\\c app`) that docker-entrypoint
    uses but asyncpg can't parse."""
    return "\n".join(line for line in sql.splitlines() if not line.lstrip().startswith("\\"))
