import pytest

from app.config import Settings


def test_secret_key_too_short_raises():
    s = Settings(secret_key="short", _env_file=None)
    with pytest.raises(ValueError, match="SECRET_KEY"):
        s.validate_secret_key()


def test_secret_key_long_enough_passes():
    s = Settings(secret_key="a" * 32, _env_file=None)
    s.validate_secret_key()
