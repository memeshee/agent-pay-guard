import type { CasperNetwork } from "./types";

export type AppConfig = {
  adminToken?: string;
  merchantPublicKey?: string;
  network: CasperNetwork;
  x402ChainId: string;
  x402AssetPackage?: string;
  x402AssetName?: string;
  x402AssetVersion: string;
  x402AssetDecimals: number;
  x402MaxTimeoutSeconds: number;
  facilitatorUrl?: string;
  facilitatorApiKey?: string;
  csprCloudBaseUrl?: string;
  csprCloudToken?: string;
  csprClickAppId?: string;
};

export function getConfig(): AppConfig {
  const network = process.env.CASPER_NETWORK === "mainnet" ? "mainnet" : "testnet";

  return {
    adminToken: process.env.ADMIN_TOKEN,
    merchantPublicKey: process.env.PAYEE_ADDRESS ?? process.env.MERCHANT_PUBLIC_KEY,
    network,
    x402ChainId: process.env.CASPER_X402_CHAIN_ID ?? (network === "mainnet" ? "casper:casper" : "casper:casper-test"),
    x402AssetPackage: process.env.CASPER_X402_ASSET_PACKAGE,
    x402AssetName: process.env.CASPER_X402_ASSET_NAME ?? "Wrapped CSPR",
    x402AssetVersion: process.env.CASPER_X402_ASSET_VERSION ?? "1",
    x402AssetDecimals: Number(process.env.CASPER_X402_ASSET_DECIMALS ?? "9"),
    x402MaxTimeoutSeconds: Number(process.env.CASPER_X402_MAX_TIMEOUT_SECONDS ?? "900"),
    facilitatorUrl: process.env.CASPER_X402_FACILITATOR_URL,
    facilitatorApiKey: process.env.CASPER_X402_FACILITATOR_API_KEY,
    csprCloudBaseUrl: process.env.CSPR_CLOUD_BASE_URL,
    csprCloudToken: process.env.CSPR_CLOUD_TOKEN,
    csprClickAppId: process.env.CSPR_CLICK_APP_ID,
  };
}

export function getPaymentSetupError(config = getConfig()): string | null {
  if (!config.merchantPublicKey) return "PAYEE_ADDRESS or MERCHANT_PUBLIC_KEY is not configured.";
  if (!/^00[0-9a-fA-F]{64}$/.test(config.merchantPublicKey)) {
    return "PAYEE_ADDRESS/MERCHANT_PUBLIC_KEY must be Casper x402 account-hash format: 00 plus 64 hex chars.";
  }
  if (!config.x402ChainId.startsWith("casper:")) return "CASPER_X402_CHAIN_ID must be a Casper CAIP-2 id.";
  if (!config.x402AssetPackage) return "CASPER_X402_ASSET_PACKAGE is not configured.";
  if (!/^[0-9a-fA-F]{64}$/.test(config.x402AssetPackage.replace(/^hash-/, ""))) {
    return "CASPER_X402_ASSET_PACKAGE must be a 64-char CEP-18 package hash.";
  }
  if (!config.x402AssetName) return "CASPER_X402_ASSET_NAME is not configured.";
  if (!Number.isInteger(config.x402AssetDecimals) || config.x402AssetDecimals < 0 || config.x402AssetDecimals > 18) {
    return "CASPER_X402_ASSET_DECIMALS must be an integer from 0 to 18.";
  }
  if (!config.facilitatorUrl) return "CASPER_X402_FACILITATOR_URL is not configured.";
  if (!config.csprCloudBaseUrl) return "CSPR_CLOUD_BASE_URL is not configured.";
  if (!config.csprCloudToken) return "CSPR_CLOUD_TOKEN is not configured.";
  return null;
}

export function getQuoteSetupError(config = getConfig()): string | null {
  if (!config.merchantPublicKey) return "PAYEE_ADDRESS or MERCHANT_PUBLIC_KEY is not configured.";
  if (!/^00[0-9a-fA-F]{64}$/.test(config.merchantPublicKey)) {
    return "PAYEE_ADDRESS/MERCHANT_PUBLIC_KEY must be Casper x402 account-hash format: 00 plus 64 hex chars.";
  }
  if (!config.x402AssetPackage) return "CASPER_X402_ASSET_PACKAGE is not configured.";
  return null;
}
