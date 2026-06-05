import { callDemoService } from "@/lib/cspr-cloud";
import { getConfig, getPaymentSetupError, getQuoteSetupError } from "@/lib/config";
import { settlePayment, verifyPayment } from "@/lib/facilitator";
import { paymentRequired } from "@/lib/http";
import { addReceipt, addRiskEvent, readLedger } from "@/lib/ledger";
import { evaluatePolicy } from "@/lib/policies";
import { sha256Json } from "@/lib/security";
import { parsePaymentPayload } from "@/lib/validation";
import { buildPaymentRequirements, getPayerAddress, getPaymentRequestId } from "@/lib/x402-casper";

type Params = {
  params: Promise<{ serviceSlug: string }>;
};

export async function GET(request: Request, context: Params): Promise<Response> {
  return handleGateway(request, context);
}

export async function POST(request: Request, context: Params): Promise<Response> {
  return handleGateway(request, context);
}

async function handleGateway(request: Request, context: Params): Promise<Response> {
  const { serviceSlug } = await context.params;
  const config = getConfig();
  const state = await readLedger();
  const service = state.services.find((item) => item.slug === serviceSlug && item.active);

  if (!service) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  const quoteSetupError = getQuoteSetupError(config);
  if (quoteSetupError) {
    await addRiskEvent({
      requestId: "setup",
      type: "setup_error",
      severity: "high",
      message: quoteSetupError,
    });
    return Response.json({ error: quoteSetupError }, { status: 503 });
  }

  const quote = {
    serviceSlug: service.slug,
    amount: service.price,
    asset: service.asset,
    merchantPublicKey: config.merchantPublicKey,
    network: config.network,
    x402Network: config.x402ChainId,
    paymentRequirements: buildPaymentRequirements(config, service),
  };
  const payment = parsePaymentPayload(request.headers.get("PAYMENT-SIGNATURE"));
  if (!payment) {
    return paymentRequired({ error: "Payment required.", quote });
  }

  const setupError = getPaymentSetupError(config);
  if (setupError) {
    await addRiskEvent({
      requestId: getPaymentRequestId(payment),
      type: "setup_error",
      severity: "high",
      message: setupError,
    });
    return Response.json({ error: setupError }, { status: 503 });
  }

  const latestState = await readLedger();
  const paymentRequirements = buildPaymentRequirements(config, service);
  const authorization = payment.payload.authorization;
  if (
    payment.network !== paymentRequirements.network ||
    authorization.to !== paymentRequirements.payTo ||
    authorization.value !== paymentRequirements.amount
  ) {
    await addRiskEvent({
      requestId: getPaymentRequestId(payment),
      type: "payment_mismatch",
      severity: "high",
      message: "Payment payload does not match current Casper x402 requirements.",
    });
    return Response.json({ error: "Payment payload does not match current Casper x402 requirements." }, { status: 403 });
  }

  const decision = evaluatePolicy(latestState, service, payment);
  if (!decision.ok) {
    await addRiskEvent({
      requestId: getPaymentRequestId(payment),
      type: decision.reason.includes("Duplicate") ? "duplicate_payment" : "policy_violation",
      severity: decision.severity,
      message: decision.reason,
    });
    return Response.json({ error: decision.reason }, { status: 403 });
  }

  const verified = await verifyPayment(config, payment, paymentRequirements);
  if (!verified.ok) {
    await addRiskEvent({
      requestId: getPaymentRequestId(payment),
      type: "facilitator_failure",
      severity: "high",
      message: verified.error ?? "Facilitator verification failed.",
    });
    return Response.json({ error: verified.error ?? "Payment verification failed." }, { status: 402 });
  }

  const settled = await settlePayment(config, payment, paymentRequirements);
  if (!settled.ok) {
    await addRiskEvent({
      requestId: getPaymentRequestId(payment),
      type: "facilitator_failure",
      severity: "high",
      message: settled.error ?? "Facilitator settlement failed.",
    });
    return Response.json({ error: settled.error ?? "Payment settlement failed." }, { status: 402 });
  }

  try {
    const params = request.method === "POST" ? ((await request.json()) as Record<string, unknown>) : {};
    const data = await callDemoService(config, service, params);
    const receipt = await addReceipt({
      requestId: getPaymentRequestId(payment),
      serviceSlug: service.slug,
      payerPublicKey: getPayerAddress(payment),
      merchantPublicKey: config.merchantPublicKey!,
      amount: Number(payment.payload.authorization.value),
      asset: "CEP18",
      paymentPayloadHash: sha256Json(payment),
      responseHash: sha256Json(data),
      facilitatorStatus: "settled",
      settlementHash: settled.settlementHash,
    });

    return Response.json(
      { data, receipt },
      {
        headers: {
          "PAYMENT-RESPONSE": Buffer.from(JSON.stringify({ receiptId: receipt.id, settlementHash: receipt.settlementHash })).toString(
            "base64url",
          ),
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Service execution failed.";
    await addRiskEvent({ requestId: getPaymentRequestId(payment), type: "service_failure", severity: "medium", message });
    return Response.json({ error: message }, { status: 502 });
  }
}
