# Architecture

## Overview

AgentPay Guard is a single Next.js application with server-side API routes. It keeps the MVP small while preserving the boundaries needed for a later production service.

```text
Agent / Browser
  |
  | GET /api/quotes/:service
  | GET /api/gateway/:service
  | POST /api/mcp
  v
Next.js API Routes
  |
  | policy checks, x402 requirements, receipt hashing
  v
Local Ledger
  |
  | verify / settle
  v
Casper x402 Facilitator
  |
  | protected data fetches
  v
CSPR.cloud
```

## Subsystems

### Dashboard

`src/app/page.tsx` renders:

- Product status
- Service catalog
- MCP method list
- Spend policy summary
- CSPR.click app key status
- Operations console
- Risk events

### Operations Console

`src/components/ops-console.tsx` provides a judge-facing workflow:

- Create an agent policy
- Fetch an x402 quote
- Fetch an MCP quote
- Inspect unpaid gateway `402`
- Generate an unsigned example payload shape

It does not sign payments. Signing belongs to the agent/wallet.

### Config

`src/lib/config.ts` reads env and validates:

- Payee address format
- Casper CAIP-2 chain id
- CEP-18 package hash
- Facilitator URL
- CSPR.cloud server token
- CSPR.click app key

### x402

`src/lib/x402-casper.ts` builds Casper x402 `PaymentRequirements`.

`src/lib/facilitator.ts` calls:

- `GET /supported`
- `POST /verify`
- `POST /settle`

The request body matches the Casper x402 example:

```json
{
  "paymentPayload": {},
  "paymentRequirements": {}
}
```

### Policy Engine

`src/lib/policies.ts` checks:

- Active policy exists
- Service allowlist
- Valid-before expiry
- Duplicate nonce/request id
- Per-request cap
- Daily cap

Policy amounts are in CEP-18 base units.

### Ledger

`src/lib/ledger.ts` stores:

- `services`
- `policies`
- `receipts`
- `riskEvents`

The MVP uses `data/ledger.json`, ignored by git. This can be moved to SQLite/Postgres without changing the API shape.

## Data Flow

1. Agent requests `/api/gateway/market-snapshot`.
2. Gateway returns `402` and `PAYMENT-REQUIRED`.
3. Agent signs the `paymentRequirements`.
4. Agent retries with `PAYMENT-SIGNATURE`.
5. Gateway validates local policy.
6. Gateway calls facilitator `/verify`.
7. Gateway calls facilitator `/settle`.
8. Gateway calls the protected service.
9. Gateway stores receipt and returns `PAYMENT-RESPONSE`.

## Production Upgrade Path

- Replace file ledger with SQLite/Postgres.
- Add user/admin auth instead of static bearer admin token.
- Add rate limits on gateway and admin routes.
- Add structured logs and deploy-hash monitoring.
- Add a real agent signer package or MCP client example.
- Add settlement replay protection backed by durable unique indexes.
