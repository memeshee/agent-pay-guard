"use client";

import { useMemo, useState } from "react";
import type { Service } from "@/lib/types";

type OpsConsoleProps = {
  services: Service[];
};

type ResultState = {
  title: string;
  body: unknown;
};

const defaultAgentKey = "agent_public_key_12345678901234567890123456789012";
const defaultAccountHash = "00" + "0".repeat(64);

export function OpsConsole({ services }: OpsConsoleProps) {
  const [agentPublicKey, setAgentPublicKey] = useState(defaultAgentKey);
  const [agentAccountHash, setAgentAccountHash] = useState(defaultAccountHash);
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "");
  const [result, setResult] = useState<ResultState | null>(null);
  const selected = services.find((service) => service.slug === serviceSlug) ?? services[0];

  const paymentPayload = useMemo(() => {
    if (!selected) return null;
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 15 * 60;
    return {
      x402Version: 2,
      scheme: "exact",
      network: "casper:casper-test",
      payload: {
        signature: "replace-with-130-hex-eip712-signature",
        publicKey: agentPublicKey,
        authorization: {
          from: agentAccountHash,
          to: "replace-with-payTo-from-quote",
          value: "replace-with-amount-from-quote",
          validAfter: String(validAfter),
          validBefore: String(validBefore),
          nonce: "replace-with-64-hex-nonce",
        },
      },
    };
  }, [agentAccountHash, agentPublicKey, selected]);

  const encodedPayment = paymentPayload ? base64Url(JSON.stringify(paymentPayload)) : "";
  const curlCommand = selected
    ? `curl -i -X POST http://127.0.0.1:3000/api/gateway/${selected.slug} \\\n  -H 'PAYMENT-SIGNATURE: ${encodedPayment}' \\\n  -H 'content-type: application/json' \\\n  -d '{}'`
    : "";

  async function createPolicy() {
    if (!selected) return;
    const response = await fetch("/api/admin/policies", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        agentAccountHash,
        allowedServiceSlugs: [selected.slug],
        perRequestCap: Math.round(selected.price * 1_000_000_000),
        dailyCap: Math.round(selected.price * 1_000_000_000 * 5),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    setResult({ title: `Policy response (${response.status})`, body: await response.json() });
  }

  async function fetchQuote() {
    const response = await fetch(`/api/quotes/${serviceSlug}`);
    setResult({ title: `Quote response (${response.status})`, body: await response.json() });
  }

  async function fetchMcpQuote() {
    const response = await fetch("/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "quote-1", method: "quote_service", params: { serviceSlug } }),
    });
    setResult({ title: `MCP quote (${response.status})`, body: await response.json() });
  }

  async function inspectGateway() {
    const response = await fetch(`/api/gateway/${serviceSlug}`);
    const paymentRequired = response.headers.get("PAYMENT-REQUIRED");
    const body = await response.json();
    setResult({ title: `Gateway unpaid call (${response.status})`, body: { paymentRequired, body } });
  }

  return (
    <div className="opsConsole">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Judge-ready agent flow</h2>
        </div>
        <code>/api/mcp</code>
      </div>

      <div className="opsGrid">
        <label>
          <span>Agent public key</span>
          <input value={agentPublicKey} onChange={(event) => setAgentPublicKey(event.target.value)} />
        </label>
        <label>
          <span>Agent account hash</span>
          <input
            value={agentAccountHash}
            onChange={(event) => setAgentAccountHash(event.target.value)}
            placeholder="00... or account-hash-..."
          />
        </label>
        <label>
          <span>Service</span>
          <select value={serviceSlug} onChange={(event) => setServiceSlug(event.target.value)}>
            {services.map((service) => (
              <option key={service.id} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="buttonRow">
        <button type="button" onClick={createPolicy}>
          Create policy
        </button>
        <button type="button" onClick={fetchQuote}>
          Fetch quote
        </button>
        <button type="button" onClick={fetchMcpQuote}>
          MCP quote
        </button>
        <button type="button" onClick={inspectGateway}>
          Inspect 402
        </button>
      </div>

      <div className="payloadGrid">
        <div>
          <h3>Unsigned payment payload</h3>
          <pre>{JSON.stringify(paymentPayload, null, 2)}</pre>
        </div>
        <div>
          <h3>Gateway call</h3>
          <pre>{curlCommand}</pre>
        </div>
      </div>

      {result ? (
        <div className="resultPanel">
          <h3>{result.title}</h3>
          <pre>{JSON.stringify(result.body, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
