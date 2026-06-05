import type { AppConfig } from "./config";
import type { CasperPaymentRequirements, Service, X402PaymentPayload } from "./types";

export function getServiceAmountBaseUnits(service: Service, decimals: number): string {
  const multiplier = 10 ** decimals;
  return String(Math.round(service.price * multiplier));
}

export function buildPaymentRequirements(config: AppConfig, service: Service): CasperPaymentRequirements {
  return {
    scheme: "exact",
    network: config.x402ChainId,
    payTo: config.merchantPublicKey!,
    amount: getServiceAmountBaseUnits(service, config.x402AssetDecimals),
    asset: config.x402AssetPackage!.replace(/^hash-/, ""),
    extra: {
      name: config.x402AssetName!,
      version: config.x402AssetVersion,
      decimals: String(config.x402AssetDecimals),
    },
    maxTimeoutSeconds: config.x402MaxTimeoutSeconds,
  };
}

export function getPaymentRequestId(payment: X402PaymentPayload): string {
  return payment.payload.authorization.nonce;
}

export function getPayerAddress(payment: X402PaymentPayload): string {
  return payment.payload.authorization.from;
}

export function getPaymentValidBefore(payment: X402PaymentPayload): Date {
  return new Date(Number(payment.payload.authorization.validBefore) * 1000);
}
