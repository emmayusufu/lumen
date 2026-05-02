package jwt_test

import data.jwt

test_unknown_jti_allowed if {
    jwt.allow with input as {"jti": "unknown-jti"}
        with data.revoked_tokens as {}
}

test_revoked_active_jti_denied if {
    not jwt.allow with input as {"jti": "bad-jti"}
        with data.revoked_tokens as {"bad-jti": 9999999999}
}

test_expired_entry_allowed if {
    jwt.allow with input as {"jti": "old-jti"}
        with data.revoked_tokens as {"old-jti": 1}
}
