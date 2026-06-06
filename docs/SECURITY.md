# Security Notes

## Security Model

AgentPay Guard treats payment as a security boundary.

The app does not trust:

- Agent-supplied service names
- Agent-supplied prices
- Agent-supplied payee addresses
- Duplicate nonces
- Expired authorizations
- Unverified payment signatures
- Unsettled payment claims

## Secrets

Server-only:

- `ADMIN_TOKEN`
- `CSPR_CLOUD_TOKEN`
- `CASPER_X402_FACILITATOR_API_KEY`

Public:

- `CSPR_CLICK_APP_KEY`
- `PAYEE_ADDRESS`
- `CASPER_X402_ASSET_PACKAGE`

Never store:

- Wallet private keys
- Seed phrases
- PEM private keys
- Agent signing keys

## x402 Controls

Before facilitator verification:

- Payment payload must parse as x402 V2.
- `scheme` must be `exact`.
- `network` must match configured Casper CAIP-2 id.
- `authorization.to` must match configured payee.
- `authorization.value` must match current service quote.
- `authorization.validBefore` must be in the future.
- `authorization.nonce` must be unique.

Before service execution:

- Local policy must allow the service.
- Amount must be within per-request cap.
- Daily spend must remain within daily cap.
- Facilitator `/verify` must pass.
- Facilitator `/settle` must pass.

## SSRF Avoidance

The MVP does not proxy arbitrary provider URLs. Services are built-in handlers:

- CSPR rate
- Account balance
- Market snapshot

This avoids letting an agent turn the gateway into a server-side request tool.

## Data Integrity

Receipts store:

- Request id / nonce
- Service slug
- Payer account hash
- Merchant account hash
- Amount
- Payment payload hash
- Response hash
- Settlement transaction hash

## Known MVP Limits

- File-backed ledger is not safe for multi-instance production.
- Admin auth is static bearer token.
- No rate limiter yet.
- No durable unique index for nonce replay.
- Full paid-call signing is expected from an external x402 client/agent signer.

## Production Hardening

- Move ledger to Postgres or SQLite with unique nonce indexes.
- Add route-level rate limits.
- Add structured logs for verify/settle failures.
- Alert on repeated policy violations.
- Require HTTPS in production.
- Rotate CSPR.cloud and facilitator tokens.
- Add integration tests against a local Casper x402 facilitator.
