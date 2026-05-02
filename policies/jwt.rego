package jwt

default allow = false

allow if {
    input.jti
    not revoked
}

revoked if {
    entry_expiry := data.revoked_tokens[input.jti]
    time.now_ns() / 1000000000 < entry_expiry
}
