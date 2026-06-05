import { getConfig, getPaymentSetupError, getQuoteSetupError } from "@/lib/config";
import { readLedger } from "@/lib/ledger";
import { buildPaymentRequirements } from "@/lib/x402-casper";

type Params = {
  params: Promise<{ serviceSlug: string }>;
};

export async function GET(_request: Request, context: Params): Promise<Response> {
  const { serviceSlug } = await context.params;
  const config = getConfig();
  const state = await readLedger();
  const service = state.services.find((item) => item.slug === serviceSlug && item.active);

  if (!service) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  const quoteSetupError = getQuoteSetupError(config);
  if (quoteSetupError) {
    return Response.json({ error: quoteSetupError }, { status: 503 });
  }

  return Response.json({
    quote: {
      serviceSlug: service.slug,
      amount: service.price,
      asset: service.asset,
      merchantPublicKey: config.merchantPublicKey,
      network: config.network,
      x402Network: config.x402ChainId,
      paymentHeader: "PAYMENT-SIGNATURE",
      paymentRequiredHeader: "PAYMENT-REQUIRED",
      paymentRequirements: buildPaymentRequirements(config, service),
      executionReady: getPaymentSetupError(config) === null,
    },
  });
}
