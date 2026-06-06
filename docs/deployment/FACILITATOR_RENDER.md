# Deploy Casper x402 Facilitator To Render

## Short Answer

Can Vercel host the x402 facilitator?

Not recommended. Vercel is serverless-first and functions have execution duration limits. The Casper x402 facilitator is a long-running Go HTTP service that may wait for on-chain settlement. Use Render/Fly/Railway/VPS instead.

Can Render host it?

Yes. Render can run a Docker web service and provide environment variables/secrets.

## Source Repo

Use:

```text
https://github.com/make-software/casper-x402
```

The facilitator listens on port `4022` in the example repo.

## Render Web Service

Create a new Render Web Service:

- Source: fork or clone `make-software/casper-x402`
- Runtime: Docker
- Dockerfile path:

```text
infra/docker/build-facilitator.Dockerfile
```

- Port:

```text
4022
```

Render normally provides `PORT`, but the example facilitator uses its own config. If the service does not bind to Render's expected port, set the app port/env according to the facilitator repo's config or wrap the command to bind to `0.0.0.0:$PORT`.

## Required Facilitator Env

For testnet:

```bash
LOG_LEVEL=debug
GIN_MODE=release
CASPER_NETWORKS=casper:casper-test
SECRET_KEY_ALGO_CASPER_CASPER_TEST=secp256k1
RPCURL_CASPER_CASPER_TEST=https://node.testnet.casper.network/rpc
SECRET_KEY_PEM_CASPER_CASPER_TEST=<facilitator_private_key_pem>
```

If using CSPR.cloud node RPC:

```bash
RPCURL_CASPER_CASPER_TEST=https://node.testnet.cspr.cloud/rpc
```

The CSPR.cloud token may need to be passed by the facilitator code if it supports custom RPC headers. The current example's env docs show `RPCURL_*` but not a token header variable, so plain public Casper node RPC may be simpler for the facilitator.

## Security

The facilitator private key is sensitive.

Do not:

- Put it in frontend env
- Commit it
- Reuse your personal wallet key

Do:

- Create a dedicated facilitator account
- Fund it with testnet CSPR for gas
- Store PEM as a Render secret/env var
- Rotate it if exposed

## Verify Facilitator

After deploy, call:

```bash
curl -s https://your-facilitator.onrender.com/supported | jq
```

Expected:

```json
{
  "kinds": [
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "casper:casper-test"
    }
  ]
}
```

Then set app env:

```bash
CASPER_X402_FACILITATOR_URL=https://your-facilitator.onrender.com
```

Rerun:

```bash
pnpm demo https://your-vercel-domain.vercel.app
```

## Faster Alternative

Ask the Casper/buildathon team:

```text
Do you provide a hosted Casper x402 testnet facilitator URL for the buildathon?
I need the base URL that serves /supported, /verify, and /settle.
```

If they provide one, use that URL in `CASPER_X402_FACILITATOR_URL` and skip self-hosting.

## Keepalive

Render free services can sleep when idle. This repo includes a GitHub Actions workflow that pings:

```text
<facilitator_url>/supported
```

Configure one repository variable or secret:

```text
RENDER_FACILITATOR_URL=https://<your-render-service>.onrender.com
```

If your facilitator is protected, add:

```text
RENDER_FACILITATOR_API_KEY=<optional_api_key>
```

Then open GitHub Actions and run `Render facilitator keepalive` once manually. The scheduled run is best-effort because GitHub cron timing is not guaranteed.
