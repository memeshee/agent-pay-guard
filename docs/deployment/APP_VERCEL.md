# Deploy The Next.js App To Vercel

## What Vercel Hosts

Vercel should host this Next.js app:

- Dashboard
- Service catalog
- Quote route
- Gateway route
- MCP route
- Receipt route

Vercel should **not** host the Casper x402 facilitator. The facilitator is a long-running Go service that verifies signatures, submits Casper deploys, and waits for settlement. Use Render, Fly.io, Railway, or a VPS for that.

## Steps

1. Push this repo to GitHub.
2. Create a new Vercel project.
3. Import the repo.
4. Framework preset: `Next.js`.
5. Install command:

```bash
pnpm install
```

6. Build command:

```bash
pnpm build
```

7. Add environment variables.

## Vercel Environment Variables

Set these in Vercel Project Settings:

```bash
PAYEE_ADDRESS=00<64_hex_account_hash>
CASPER_NETWORK=testnet
CASPER_X402_CHAIN_ID=casper:casper-test
CASPER_X402_FACILITATOR_URL=<render_or_hosted_facilitator_url>
CASPER_X402_ASSET_PACKAGE=3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e
CASPER_X402_ASSET_NAME=Wrapped CSPR
CASPER_X402_ASSET_VERSION=1
CASPER_X402_ASSET_DECIMALS=9
CSPR_CLOUD_BASE_URL=https://api.testnet.cspr.cloud
CSPR_CLOUD_TOKEN=<cspr_cloud_access_token>
CSPR_CLICK_APP_KEY=<32_char_cspr_click_app_key>
```

Admin routes are intentionally open for the buildathon demo. Add auth before production use.

Optional:

```bash
CASPER_X402_FACILITATOR_API_KEY=<if_facilitator_requires_auth>
CASPER_X402_MAX_TIMEOUT_SECONDS=900
```

## CSPR.click Domains

Add your Vercel domain to CSPR.click console:

```text
<your-vercel-domain>.vercel.app
```

Also keep local dev:

```text
localhost
127.0.0.1
```

## Verify Deployment

After deploy:

```bash
pnpm demo https://your-vercel-domain.vercel.app
```

Expected:

- App health OK
- Services OK
- x402 quote OK
- MCP quote OK
- unpaid gateway `402` OK
- payee balance OK

Facilitator support is OK only when `CASPER_X402_FACILITATOR_URL` points to a reachable facilitator.
