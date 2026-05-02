from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.utils.token import _ALGORITHM, _SECRET, create_token, decode_token


def test_create_and_decode_roundtrip():
    token = create_token("u1", "a@a.com", "Alice")
    payload = decode_token(token)
    assert payload["sub"] == "u1"
    assert payload["email"] == "a@a.com"
    assert payload["name"] == "Alice"
    assert "jti" in payload
    assert "exp" in payload


def test_each_token_has_unique_jti():
    t1 = decode_token(create_token("u1", "a@a.com", "Alice"))
    t2 = decode_token(create_token("u1", "a@a.com", "Alice"))
    assert t1["jti"] != t2["jti"]


def test_expired_token_raises():
    payload = {
        "sub": "u1",
        "email": "a@a.com",
        "name": "Alice",
        "jti": "x",
        "iat": datetime.now(UTC) - timedelta(days=8),
        "exp": datetime.now(UTC) - timedelta(days=1),
    }
    expired = jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(expired)


def test_tampered_token_raises():
    token = create_token("u1", "a@a.com", "Alice")
    with pytest.raises(jwt.PyJWTError):
        decode_token(token + "tampered")
