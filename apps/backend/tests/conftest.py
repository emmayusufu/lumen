from unittest.mock import AsyncMock, patch

import pytest

from app.middleware import ratelimit


@pytest.fixture(autouse=True)
def mock_infrastructure(request):
    if request.node.get_closest_marker("integration"):
        yield
        return
    ratelimit._fallback.clear()
    with (
        patch("app.db.init_pool", new_callable=AsyncMock),
        patch("app.db.close_pool", new_callable=AsyncMock),
        patch(
            "app.middleware.auth.users_db.get_user_by_id",
            new_callable=AsyncMock,
            return_value={"id": "stub", "is_admin": False},
        ),
        patch("app.middleware.ratelimit._client", return_value=None),
    ):
        yield
