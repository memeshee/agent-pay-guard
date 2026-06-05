import type { LedgerState, PolicyDecision, Service, X402PaymentPayload } from "./types";
import { getPayerAddress, getPaymentRequestId, getPaymentValidBefore } from "./x402-casper";

export function evaluatePolicy(
  state: LedgerState,
  service: Service,
  payment: X402PaymentPayload,
  now = new Date(),
): PolicyDecision {
  const payerAddress = getPayerAddress(payment);
  const requestId = getPaymentRequestId(payment);
  const validBefore = getPaymentValidBefore(payment);
  const amount = Number(payment.payload.authorization.value);

  if (validBefore <= now) {
    return { ok: false, reason: "Payment payload has expired.", severity: "medium" };
  }

  if (state.receipts.some((receipt) => receipt.requestId === requestId)) {
    return { ok: false, reason: "Duplicate payment request id.", severity: "high" };
  }

  const activePolicies = state.policies.filter(
    (policy) => policy.agentPublicKey === payerAddress && new Date(policy.expiresAt) > now,
  );
  const policy = activePolicies.find((item) => item.allowedServiceSlugs.includes(service.slug));
  if (!policy) {
    return { ok: false, reason: "No active spend policy allows this service.", severity: "medium" };
  }

  if (amount > policy.perRequestCap) {
    return { ok: false, reason: "Payment exceeds per-request cap.", severity: "high" };
  }

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dailySpend = state.receipts
    .filter((receipt) => receipt.payerPublicKey === payerAddress && new Date(receipt.createdAt) >= dayStart)
    .reduce((sum, receipt) => sum + receipt.amount, 0);

  if (dailySpend + amount > policy.dailyCap) {
    return { ok: false, reason: "Payment exceeds daily cap.", severity: "high" };
  }

  return { ok: true, policy };
}
