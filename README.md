# AgentPay Guard

AgentPay Guard is a Casper-native x402 gateway for paid AI-agent tool access. It lets API and data providers require a valid Casper x402 payment before an autonomous agent receives protected data, while keeping spend limits, receipts, and risk events visible to the provider.

This is an MVP for the Casper Agentic Buildathon. The narrow wedge is simple: make machine-to-machine API payments practical enough for agents to use and secure enough for providers to trust.

## PMF Vision

AI agents are moving from chat interfaces into repeated autonomous work: fetching data, calling tools, comparing markets, and executing workflows. That creates a payment and trust problem for API providers.

Today, providers usually choose one of these weak options:

- hand agents long-lived API keys
- rely on prepaid credits and off-chain accounting
- invoice after usage
- block agents entirely because abuse and replay risk are hard to control

AgentPay Guard turns that into a per-call settlement flow. The provider exposes a paid tool, the agent receives a `402 Payment Required` response with Casper x402 payment requirements, the agent signs a payment payload, and the gateway verifies policy plus settlement before returning the protected response.

The long-term product is payment infrastructure for the agent economy:

- **Users:** API providers, data vendors, agent builders, wallet/tooling teams
- **Pain:** agent access is hard to monetize safely without unlimited keys or trusted billing
- **Willingness to pay:** providers already monetize API calls; agents need reliable tool access
- **Retention driver:** receipts, policy controls, spend analytics, and easy integration
- **Expansion path:** more paid tools, hosted gateway, SDKs, analytics, fraud controls, and multi-provider agent marketplaces

No new token is introduced. The app uses Casper x402 and the Casper x402 example Wrapped CSPR testnet asset because the job is payment enforcement, not token design.

## What It Does

- Publishes a catalog of paid Casper/agent services
- Returns Casper x402 `paymentRequirements` for each protected service
- Exposes MCP-style JSON-RPC methods for agent discovery and quote retrieval
- Rejects unpaid calls with `402 Payment Required`
- Enforces spend policies before serving protected data
- Verifies and settles through a Casper x402 facilitator
- Stores receipts and risk events for provider-side auditability
- Shows CSPR.click, facilitator, payee, and service status in a Next.js dashboard

## Why Casper

Casper is a practical fit for agent payments because the product needs deterministic settlement, account-based identity, wallet onboarding, and infrastructure that can support machine-to-machine workflows. This MVP uses:

- **Casper x402:** payment requirement, verification, and settlement flow
- **CSPR.click:** wallet app identity and wallet UX layer
- **CSPR.cloud:** chain data, account balance, and rate data
- **Casper testnet:** low-risk demo environment for buildathon validation

## How It Works

```text
Agent / User
  |
  | GET /api/quotes/:service
  | GET /api/gateway/:service
  | POST /api/mcp
  v
AgentPay Guard API
  |
  | build x402 requirements
  | enforce policy
  | reject replay / expiry / wrong amount
  v
Casper x402 Facilitator
  |
  | verify + settle
  v
Protected tool response + receipt
```

The app fails closed. If payment config, policy, facilitator verification, or settlement is missing, the protected response is not served.

## MVP Scope

In scope:

- Next.js dashboard and API routes
- File-backed MVP ledger
- Casper x402 quote shape
- MCP-style agent interface
- Facilitator integration
- CSPR.cloud account/rate checks
- CSPR.click app key display
- Demo and deployment scripts
- Security notes and deployment docs

Out of scope for this MVP:

- Custody of user funds
- New token issuance
- Production durable database
- Full hosted SaaS billing
- Advanced fraud analytics
- Multi-chain settlement

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm verify-launch-config
pnpm dev --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

Required external services:

- CSPR.cloud token
- CSPR.click app key
- Casper x402 facilitator URL
- Casper payee account hash as `PAYEE_ADDRESS=00<64_hex_account_hash>`

For full environment details, see [Vercel App Deployment](docs/deployment/APP_VERCEL.md) and [Render Facilitator Deployment](docs/deployment/FACILITATOR_RENDER.md).

## Demo

Local app:

```bash
pnpm demo
```

Deployed app:

```bash
pnpm demo https://<your-app-domain>
```

The demo checks launch config, app health, service catalog, x402 quote generation, MCP quote discovery, unpaid `402`, facilitator `/supported`, and payee balance.

## Validation

```bash
pnpm verify-launch-config
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Recommended split:

- **Vercel:** Next.js app and API routes
- **Render/Fly/Railway/VPS:** Casper x402 facilitator
- **GitHub Actions:** keepalive and health check for the Render facilitator

Docs:

- [Vercel App Deployment](docs/deployment/APP_VERCEL.md)
- [Render Facilitator Deployment](docs/deployment/FACILITATOR_RENDER.md)
- [Deployment Checklist](docs/deployment/CHECKLIST.md)

Configure the keepalive workflow with:

```text
RENDER_FACILITATOR_URL=https://<your-render-service>.onrender.com
```

## Security Posture

The gateway treats payment as a security boundary. It does not trust agent-supplied prices, payees, service names, duplicate nonces, expired authorizations, or unsettled payment claims.

Server-side secrets include:

- `ADMIN_TOKEN`
- `CSPR_CLOUD_TOKEN`
- `CASPER_X402_FACILITATOR_API_KEY`

Private wallet/facilitator keys must never be committed or exposed to the frontend. For the full threat model, see [Security Notes](docs/SECURITY.md).

## Documentation Map

- [Architecture](docs/ARCHITECTURE.md): system boundaries, data flow, and storage notes
- [Security Notes](docs/SECURITY.md): trust assumptions, attack surface, and production hardening
- [Vercel App Deployment](docs/deployment/APP_VERCEL.md): hosting the app
- [Render Facilitator Deployment](docs/deployment/FACILITATOR_RENDER.md): hosting x402 facilitator
- [Deployment Checklist](docs/deployment/CHECKLIST.md): launch readiness list

## Source References

- Casper docs: https://docs.casper.network/
- Casper AI/buildathon context: https://www.casper.network/ai
- Casper x402 example: https://github.com/make-software/casper-x402
- CSPR.cloud docs: https://docs.cspr.cloud/
