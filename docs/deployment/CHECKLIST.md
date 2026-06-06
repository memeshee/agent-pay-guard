# Deployment Checklist

## Local

```bash
pnpm verify-launch-config
pnpm typecheck
pnpm test
pnpm build
pnpm dev --hostname 127.0.0.1 --port 3000
pnpm demo
```

## Vercel App

- [ ] Repo pushed to GitHub
- [ ] Vercel project created
- [ ] Env vars configured
- [ ] CSPR.click domains include Vercel domain
- [ ] `https://<domain>/api/quotes/market-snapshot` returns quote
- [ ] `pnpm demo https://<domain>` passes app routes

## x402 Facilitator

Choose one:

- [ ] Hosted Casper/buildathon facilitator URL received
- [ ] Self-hosted Render/Fly/Railway facilitator deployed

Verify:

```bash
curl -s "$CASPER_X402_FACILITATOR_URL/supported" | jq
```

## GitHub Actions Keepalive

- [ ] Add `RENDER_FACILITATOR_URL` as a GitHub repository variable or secret
- [ ] Add `RENDER_FACILITATOR_API_KEY` as a secret if your facilitator requires auth
- [ ] Run `Render facilitator keepalive` manually from the Actions tab
- [ ] Confirm the workflow sees `casper:casper-test` in `/supported`

This workflow keeps a free Render service warm on a best-effort schedule and acts as a simple external health check. It is not a substitute for production uptime monitoring.
