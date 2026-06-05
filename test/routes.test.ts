import { afterEach, describe, expect, it } from "vitest";
import { GET as gatewayGet } from "@/app/api/gateway/[serviceSlug]/route";
import { GET as quoteGet } from "@/app/api/quotes/[serviceSlug]/route";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("payment routes", () => {
  it("returns quote readiness without allowing execution when settlement env is incomplete", async () => {
    process.env.PAYEE_ADDRESS = `00${"1".repeat(64)}`;
    process.env.CASPER_X402_ASSET_PACKAGE = "2".repeat(64);
    delete process.env.CASPER_X402_FACILITATOR_URL;
    delete process.env.CSPR_CLOUD_BASE_URL;
    delete process.env.CSPR_CLOUD_TOKEN;

    const response = await quoteGet(new Request("http://test.local/api/quotes/market-snapshot"), {
      params: Promise.resolve({ serviceSlug: "market-snapshot" }),
    });
    const body = (await response.json()) as { quote: { executionReady: boolean; merchantPublicKey: string } };

    expect(response.status).toBe(200);
    expect(body.quote.executionReady).toBe(false);
    expect(body.quote.merchantPublicKey).toBe(process.env.PAYEE_ADDRESS);
  });

  it("returns a 402 quote for unpaid gateway calls when merchant identity is configured", async () => {
    process.env.PAYEE_ADDRESS = `00${"1".repeat(64)}`;
    process.env.CASPER_X402_ASSET_PACKAGE = "2".repeat(64);

    const response = await gatewayGet(new Request("http://test.local/api/gateway/market-snapshot"), {
      params: Promise.resolve({ serviceSlug: "market-snapshot" }),
    });
    const body = (await response.json()) as {
      error: string;
      quote: { serviceSlug: string; amount: number; paymentRequirements: { amount: string; asset: string } };
    };

    expect(response.status).toBe(402);
    expect(response.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    expect(body.error).toBe("Payment required.");
    expect(body.quote.serviceSlug).toBe("market-snapshot");
    expect(body.quote.amount).toBe(0.75);
    expect(body.quote.paymentRequirements.amount).toBe("750000000");
  });

  it("fails closed before quoting when merchant identity is missing", async () => {
    delete process.env.MERCHANT_PUBLIC_KEY;

    const response = await gatewayGet(new Request("http://test.local/api/gateway/market-snapshot"), {
      params: Promise.resolve({ serviceSlug: "market-snapshot" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toContain("PAYEE_ADDRESS");
  });
});
