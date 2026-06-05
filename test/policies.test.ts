import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "@/lib/policies";
import type { LedgerState, Service, X402PaymentPayload } from "@/lib/types";

const service: Service = {
  id: "svc_1",
  slug: "market-snapshot",
  name: "Market Snapshot",
  description: "Market data",
  kind: "market_snapshot",
  price: 0.75,
  asset: "CEP18",
  active: true,
  createdAt: "2026-06-04T00:00:00.000Z",
};

const payment: X402PaymentPayload = {
  x402Version: 2,
  scheme: "exact",
  network: "casper:casper-test",
  payload: {
    signature: "a".repeat(130),
    publicKey: "b".repeat(68),
    authorization: {
      from: `00${"1".repeat(64)}`,
      to: `00${"2".repeat(64)}`,
      value: "750000000",
      validAfter: "1780600000",
      validBefore: "1781200000",
      nonce: "c".repeat(64),
    },
  },
};

function state(overrides: Partial<LedgerState> = {}): LedgerState {
  return {
    services: [service],
    policies: [
      {
        id: "pol_1",
        agentPublicKey: payment.payload.authorization.from,
        allowedServiceSlugs: ["market-snapshot"],
        perRequestCap: 1_000_000_000,
        dailyCap: 2_000_000_000,
        expiresAt: "2026-07-01T00:00:00.000Z",
        createdAt: "2026-06-04T00:00:00.000Z",
      },
    ],
    receipts: [],
    riskEvents: [],
    ...overrides,
  };
}

describe("evaluatePolicy", () => {
  it("allows an exact quoted payment under active caps", () => {
    const decision = evaluatePolicy(state(), service, payment, new Date("2026-06-04T12:00:00.000Z"));
    expect(decision.ok).toBe(true);
  });

  it("rejects payments over the per-request cap", () => {
    const decision = evaluatePolicy(
      state(),
      service,
      {
        ...payment,
        payload: {
          ...payment.payload,
          authorization: { ...payment.payload.authorization, value: "1000000001" },
        },
      },
      new Date("2026-06-04T12:00:00.000Z"),
    );
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toContain("per-request cap");
  });

  it("rejects duplicate request ids", () => {
    const decision = evaluatePolicy(
      state({
        receipts: [
          {
            id: "rcpt_1",
            requestId: payment.payload.authorization.nonce,
            serviceSlug: service.slug,
            payerPublicKey: payment.payload.authorization.from,
            merchantPublicKey: "merchant",
            amount: Number(payment.payload.authorization.value),
            asset: "CEP18",
            paymentPayloadHash: "hash",
            responseHash: "hash",
            facilitatorStatus: "settled",
            createdAt: "2026-06-04T12:00:00.000Z",
          },
        ],
      }),
      service,
      payment,
      new Date("2026-06-04T12:00:00.000Z"),
    );
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toContain("Duplicate");
  });

  it("rejects payments over the daily cap", () => {
    const decision = evaluatePolicy(
      state({
        receipts: [
          {
            id: "rcpt_1",
            requestId: "req_old",
            serviceSlug: service.slug,
            payerPublicKey: payment.payload.authorization.from,
            merchantPublicKey: "merchant",
            amount: 1_500_000_000,
            asset: "CEP18",
            paymentPayloadHash: "hash",
            responseHash: "hash",
            facilitatorStatus: "settled",
            createdAt: "2026-06-04T08:00:00.000Z",
          },
        ],
      }),
      service,
      payment,
      new Date("2026-06-04T12:00:00.000Z"),
    );
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toContain("daily cap");
  });
});
