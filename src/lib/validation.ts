import type { ServiceKind, X402PaymentPayload } from "./types";

const serviceKinds = new Set<ServiceKind>(["cspr_balance", "cspr_rate", "market_snapshot"]);

export function isPublicKey(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]{65,130}$/.test(value);
}

export function isAccountHash(value: unknown): value is string {
  return typeof value === "string" && /^00[0-9a-fA-F]{64}$/.test(value);
}

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{1,48}$/.test(value);
}

export function parsePaymentPayload(raw: string | null): X402PaymentPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<X402PaymentPayload>;
    if (parsed.x402Version !== 2) return null;
    if (parsed.scheme !== "exact") return null;
    if (typeof parsed.network !== "string" || !parsed.network.startsWith("casper:")) return null;
    if (!parsed.payload || typeof parsed.payload !== "object") return null;
    if (typeof parsed.payload.signature !== "string" || !/^[0-9a-fA-F]{130}$/.test(parsed.payload.signature)) return null;
    if (!isPublicKey(parsed.payload.publicKey)) return null;
    const authorization = parsed.payload.authorization;
    if (!authorization || typeof authorization !== "object") return null;
    if (!isAccountHash(authorization.from)) return null;
    if (!isAccountHash(authorization.to)) return null;
    if (typeof authorization.value !== "string" || !/^[1-9][0-9]*$/.test(authorization.value)) return null;
    if (typeof authorization.validAfter !== "string" || !/^[0-9]+$/.test(authorization.validAfter)) return null;
    if (typeof authorization.validBefore !== "string" || !/^[0-9]+$/.test(authorization.validBefore)) return null;
    if (typeof authorization.nonce !== "string" || !/^[0-9a-fA-F]{64}$/.test(authorization.nonce)) return null;
    return parsed as X402PaymentPayload;
  } catch {
    return null;
  }
}

export function parseServiceInput(value: unknown):
  | { ok: true; data: { slug: string; name: string; description: string; kind: ServiceKind; price: number; active: boolean } }
  | { ok: false; error: string } {
  const input = value as Record<string, unknown>;
  if (!isSlug(input.slug)) return { ok: false, error: "Invalid service slug." };
  if (typeof input.name !== "string" || input.name.length < 3 || input.name.length > 80) {
    return { ok: false, error: "Invalid service name." };
  }
  if (typeof input.description !== "string" || input.description.length < 10 || input.description.length > 240) {
    return { ok: false, error: "Invalid service description." };
  }
  if (typeof input.kind !== "string" || !serviceKinds.has(input.kind as ServiceKind)) {
    return { ok: false, error: "Invalid service kind." };
  }
  if (typeof input.price !== "number" || input.price <= 0 || input.price > 1000) {
    return { ok: false, error: "Invalid CSPR price." };
  }

  return {
    ok: true,
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      kind: input.kind as ServiceKind,
      price: input.price,
      active: input.active !== false,
    },
  };
}

export function parsePolicyInput(value: unknown):
  | {
      ok: true;
      data: {
        agentPublicKey: string;
        allowedServiceSlugs: string[];
        perRequestCap: number;
        dailyCap: number;
        expiresAt: string;
      };
    }
  | { ok: false; error: string } {
  const input = value as Record<string, unknown>;
  if (!isAccountHash(input.agentPublicKey)) return { ok: false, error: "Invalid agent account hash." };
  if (!Array.isArray(input.allowedServiceSlugs) || input.allowedServiceSlugs.length === 0) {
    return { ok: false, error: "At least one service must be allowed." };
  }
  const slugs = input.allowedServiceSlugs;
  if (!slugs.every(isSlug)) return { ok: false, error: "Invalid allowed service slug." };
  if (typeof input.perRequestCap !== "number" || input.perRequestCap <= 0 || input.perRequestCap > 1000) {
    return { ok: false, error: "Invalid per-request cap." };
  }
  if (typeof input.dailyCap !== "number" || input.dailyCap <= 0 || input.dailyCap > 10000) {
    return { ok: false, error: "Invalid daily cap." };
  }
  if (typeof input.expiresAt !== "string" || Number.isNaN(Date.parse(input.expiresAt))) {
    return { ok: false, error: "Invalid expiry." };
  }

  return {
    ok: true,
    data: {
      agentPublicKey: input.agentPublicKey,
      allowedServiceSlugs: Array.from(new Set(slugs)),
      perRequestCap: input.perRequestCap,
      dailyCap: input.dailyCap,
      expiresAt: input.expiresAt,
    },
  };
}
