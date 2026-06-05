import { describe, expect, it } from "vitest";
import { parsePaymentPayload, parsePolicyInput, parseServiceInput } from "@/lib/validation";

describe("validation", () => {
  it("parses a valid base64url payment payload", () => {
    const raw = Buffer.from(
      JSON.stringify({
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
      }),
    ).toString("base64url");

    expect(parsePaymentPayload(raw)?.payload.authorization.value).toBe("750000000");
  });

  it("rejects arbitrary service kinds", () => {
    const result = parseServiceInput({
      slug: "unsafe-proxy",
      name: "Unsafe Proxy",
      description: "Attempts to add an arbitrary outbound proxy.",
      kind: "url_proxy",
      price: 1,
    });

    expect(result.ok).toBe(false);
  });

  it("requires non-empty policy allowlists", () => {
    const result = parsePolicyInput({
      agentPublicKey: `00${"1".repeat(64)}`,
      allowedServiceSlugs: [],
      perRequestCap: 1,
      dailyCap: 5,
      expiresAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);
  });
});
