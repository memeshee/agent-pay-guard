import type { AppConfig } from "./config";
import type { CasperPaymentRequirements, X402PaymentPayload } from "./types";

type FacilitatorResponse = {
  ok: boolean;
  status?: string;
  settlementHash?: string;
  error?: string;
};

export async function verifyPayment(
  config: AppConfig,
  paymentPayload: X402PaymentPayload,
  paymentRequirements: CasperPaymentRequirements,
): Promise<FacilitatorResponse> {
  if (!config.facilitatorUrl) return { ok: false, error: "Facilitator URL missing." };

  const response = await fetch(`${config.facilitatorUrl.replace(/\/$/, "")}/verify`, {
    method: "POST",
    headers: getFacilitatorHeaders(config),
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });

  if (!response.ok) {
    return { ok: false, error: `Facilitator verify failed with HTTP ${response.status}.` };
  }

  const body = (await response.json()) as {
    isValid?: boolean;
    payer?: string;
    invalidReason?: string;
    invalidMessage?: string;
  };
  return body.isValid
    ? { ok: true, status: "verified" }
    : { ok: false, error: body.invalidMessage ?? body.invalidReason ?? "Payment invalid." };
}

export async function settlePayment(
  config: AppConfig,
  paymentPayload: X402PaymentPayload,
  paymentRequirements: CasperPaymentRequirements,
): Promise<FacilitatorResponse> {
  if (!config.facilitatorUrl) return { ok: false, error: "Facilitator URL missing." };

  const response = await fetch(`${config.facilitatorUrl.replace(/\/$/, "")}/settle`, {
    method: "POST",
    headers: getFacilitatorHeaders(config),
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });

  if (!response.ok) {
    return { ok: false, error: `Facilitator settle failed with HTTP ${response.status}.` };
  }

  const body = (await response.json()) as {
    success?: boolean;
    transaction?: string;
    errorReason?: string;
    errorMessage?: string;
  };
  return body.success
    ? { ok: true, status: "settled", settlementHash: body.transaction }
    : { ok: false, error: body.errorMessage ?? body.errorReason ?? "Payment settlement failed." };
}

export async function getFacilitatorSupported(config: AppConfig): Promise<unknown> {
  if (!config.facilitatorUrl) return { error: "Facilitator URL missing." };

  const response = await fetch(`${config.facilitatorUrl.replace(/\/$/, "")}/supported`, {
    headers: getFacilitatorHeaders(config),
  });

  if (!response.ok) {
    return { error: `Facilitator supported check failed with HTTP ${response.status}.` };
  }

  return response.json();
}

function getFacilitatorHeaders(config: AppConfig): HeadersInit {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.facilitatorApiKey) headers.Authorization = config.facilitatorApiKey;
  return headers;
}
