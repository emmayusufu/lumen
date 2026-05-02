import pytest
from cryptography.fernet import InvalidToken

from app.services.crypto import decrypt, encrypt


def test_encrypt_roundtrip():
    ciphertext = encrypt("sk-abc123")
    assert ciphertext != "sk-abc123"
    assert decrypt(ciphertext) == "sk-abc123"


def test_encrypt_different_outputs_for_same_input():
    a = encrypt("same")
    b = encrypt("same")
    assert a != b
    assert decrypt(a) == decrypt(b) == "same"


def test_decrypt_raises_on_tampered_ciphertext():
    ciphertext = encrypt("value")
    tampered = ciphertext[:-5] + "XXXXX"
    with pytest.raises(InvalidToken):
        decrypt(tampered)
