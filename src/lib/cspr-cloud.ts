import type { AppConfig } from "./config";
import type { Service } from "./types";

export async function callDemoService(
  config: AppConfig,
  service: Service,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!config.csprCloudBaseUrl || !config.csprCloudToken) {
    throw new Error("CSPR.cloud is not configured.");
  }

  if (service.kind === "cspr_balance") {
    const publicKey = typeof params.publicKey === "string" ? params.publicKey : "";
    const accountHash = typeof params.accountHash === "string" ? params.accountHash.replace(/^account-hash-/, "") : "";
    const accountIdentifier = publicKey || accountHash;
    if (!accountIdentifier) throw new Error("publicKey or accountHash is required.");
    return csprFetch(config, `/accounts/${encodeURIComponent(accountIdentifier)}`);
  }

  if (service.kind === "cspr_rate") {
    return csprFetch(config, "/rates/1/amount");
  }

  return {
    network: config.network,
    signal: "agent_market_snapshot",
    constraints: ["exact-price-required", "policy-checked", "receipt-hashed"],
    createdAt: new Date().toISOString(),
  };
}

async function csprFetch(config: AppConfig, path: string): Promise<Record<string, unknown>> {
  if (!config.csprCloudToken) {
    throw new Error("CSPR.cloud token is not configured.");
  }

  const response = await fetch(`${config.csprCloudBaseUrl!.replace(/\/$/, "")}${path}`, {
    headers: {
      authorization: config.csprCloudToken,
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CSPR.cloud request failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as Record<string, unknown>;
}
