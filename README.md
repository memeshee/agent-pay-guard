# AgentPay Guard

AgentPay Guard is a Casper Agentic Buildathon MVP for paid AI-agent tool access. It gives API/tool providers a narrow gateway where autonomous agents must present a valid Casper x402 payment before receiving protected data, while the provider gets spend policies, settlement receipts, and risk events.

## Product Thesis

AI agents will call APIs repeatedly and autonomously. API providers need a way to charge per call without handing agents unlimited API keys, trusting off-chain invoices, or accepting replayable payment claims.

AgentPay Guard is the wedge:

- Agent requests a paid Casper data service.
- Gateway returns `402 Payment Required` plus Casper x402 `paymentRequirements`.
- Agent signs an x402 `exact` Casper payment payload.
- Gateway checks local policy, verifies with the facilitator, settles, then serves the tool response.
- Gateway stores a receipt with payload/response hashes and settlement transaction hash.

No token is introduced. The payment asset is the Casper x402 example's CEP-18 Wrapped CSPR testnet package.

## Current Status

Working:

- Next.js dashboard and operations console
- CSPR.click app id display
- CSPR.cloud REST integration using raw-token authorization
- Casper x402 quote generation using `PaymentRequirements`
- MCP-style JSON-RPC endpoint for agents
- Fail-closed gateway route
- Spend policy checks
- Receipt and risk-event ledger
- Payee derivation from Casper public key
- Launch config verifier
- Demo walkthrough script

Requires for real settlement:

- A live Casper x402 facilitator at `CASPER_X402_FACILITATOR_URL`
- Agent-side signing of the Casper x402 `PaymentPayload`
- CEP-18 token balance/approval conditions expected by the facilitator example

## Stack

- `pnpm`
- Next.js App Router
- TypeScript
- React 18
- `casper-js-sdk`
- `@make-software/csprclick-ui`
- File-backed MVP ledger at `data/ledger.json`

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

## Environment

Required `.env`:

```bash
ADMIN_TOKEN=change-me-long-random-token
PAYEE_ADDRESS=00<64_hex_account_hash>
CASPER_NETWORK=testnet
CASPER_X402_CHAIN_ID=casper:casper-test
CASPER_X402_FACILITATOR_URL=http://localhost:4022
CASPER_X402_ASSET_PACKAGE=3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e
CASPER_X402_ASSET_NAME=Wrapped CSPR
CASPER_X402_ASSET_VERSION=1
CASPER_X402_ASSET_DECIMALS=9
CSPR_CLOUD_BASE_URL=https://api.testnet.cspr.cloud
CSPR_CLOUD_TOKEN=<cspr_cloud_access_token>
CSPR_CLICK_APP_ID=<cspr_click_app_id>
```

Optional:

```bash
CASPER_X402_FACILITATOR_API_KEY=<facilitator_api_key_if_required>
CASPER_X402_MAX_TIMEOUT_SECONDS=900
```

Security note: `CSPR_CLOUD_TOKEN`, `ADMIN_TOKEN`, and any facilitator API key are server-side secrets. Do not expose them in frontend code.

## Payee Setup

Casper x402 expects `payTo` as:

```text
00<64_hex_account_hash>
```

Derive it from a Casper public key:

```bash
pnpm derive-payee <public_key_hex>
```

Example output:

```bash
PAYEE_ADDRESS=004d8e3eab6850cf2a8cf2aa7b963d737ed5761ce2bbe35c48ac82db67e8d2ef2d
account-hash-4d8e3eab6850cf2a8cf2aa7b963d737ed5761ce2bbe35c48ac82db67e8d2ef2d
```

Verify config:

```bash
pnpm verify-launch-config
```

## Demo

Start the app:

```bash
pnpm dev --hostname 127.0.0.1 --port 3000
```

In another terminal:

```bash
pnpm demo
```

The demo script checks:

- Launch config shape
- Homepage availability
- Service list
- x402 quote
- MCP quote
- Unpaid gateway `402`
- Facilitator `/supported`
- Payee balance via CSPR.cloud

Full walkthrough: [docs/DEMO.md](docs/DEMO.md).

## API Surface

Public:

- `GET /api/services`
- `GET /api/quotes/:serviceSlug`
- `GET|POST /api/gateway/:serviceSlug`
- `POST /api/mcp`
- `GET /api/receipts/:id`

Admin:

- `GET /api/admin/services`
- `POST /api/admin/services`
- `GET /api/admin/policies`
- `POST /api/admin/policies`

Admin routes require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

## x402 Shape

The gateway follows the Casper x402 example repo's V2 shape.

Unpaid request:

```bash
curl -i http://127.0.0.1:3000/api/gateway/market-snapshot
```

Expected:

```text
402 Payment Required
PAYMENT-REQUIRED: <base64url quote>
```

Quote body includes:

```json
{
  "paymentRequirements": {
    "scheme": "exact",
    "network": "casper:casper-test",
    "payTo": "00<64 hex>",
    "amount": "750000000",
    "asset": "<64 hex CEP-18 package hash>",
    "extra": {
      "name": "Wrapped CSPR",
      "version": "1",
      "decimals": "9"
    },
    "maxTimeoutSeconds": 900
  }
}
```

Paid request must include `PAYMENT-SIGNATURE` as base64url JSON:

```json
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "casper:casper-test",
  "payload": {
    "signature": "<130 hex chars>",
    "publicKey": "<65 or 68 hex chars>",
    "authorization": {
      "from": "00<64 hex>",
      "to": "00<64 hex>",
      "value": "750000000",
      "validAfter": "<unix seconds>",
      "validBefore": "<unix seconds>",
      "nonce": "<64 hex>"
    }
  }
}
```

## Validation

```bash
pnpm verify-launch-config
pnpm typecheck
pnpm test
pnpm build
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Demo Walkthrough](docs/DEMO.md)
- [2-3 Minute Video Script](docs/VIDEO_SCRIPT.md)
- [Security Notes](docs/SECURITY.md)
- [Submission Notes](docs/SUBMISSION.md)
- [Vercel App Deployment](docs/deployment/APP_VERCEL.md)
- [Render Facilitator Deployment](docs/deployment/FACILITATOR_RENDER.md)
- [Deployment Checklist](docs/deployment/CHECKLIST.md)

## Source References

- Casper account/public-key docs: https://docs.casper.network/concepts/accounts-and-keys
- Casper AI/buildathon context: https://www.casper.network/ai
- Casper x402 example: https://github.com/make-software/casper-x402
- CSPR.cloud authorization: https://docs.cspr.cloud/documentation/overview/authorization
- CSPR.cloud account REST API: https://docs.cspr.cloud/rest-api/account
- CSPR.cloud rate REST API: https://docs.cspr.cloud/rest-api/cspr-rate/get-current-currency-rate
