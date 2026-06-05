export type CasperNetwork = "mainnet" | "testnet";

export type ServiceKind = "cspr_balance" | "cspr_rate" | "market_snapshot";

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: ServiceKind;
  price: number;
  asset: "CSPR" | "CEP18";
  active: boolean;
  createdAt: string;
};

export type AgentPolicy = {
  id: string;
  agentPublicKey: string;
  allowedServiceSlugs: string[];
  perRequestCap: number;
  dailyCap: number;
  expiresAt: string;
  createdAt: string;
};

export type PaymentReceipt = {
  id: string;
  requestId: string;
  serviceSlug: string;
  payerPublicKey: string;
  merchantPublicKey: string;
  amount: number;
  asset: "CSPR" | "CEP18";
  paymentPayloadHash: string;
  responseHash: string;
  facilitatorStatus: "verified" | "settled" | "failed";
  settlementHash?: string;
  createdAt: string;
};

export type RiskEvent = {
  id: string;
  requestId: string;
  type:
    | "setup_error"
    | "policy_violation"
    | "duplicate_payment"
    | "payment_mismatch"
    | "facilitator_failure"
    | "service_failure";
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
};

export type LedgerState = {
  services: Service[];
  policies: AgentPolicy[];
  receipts: PaymentReceipt[];
  riskEvents: RiskEvent[];
};

export type X402PaymentPayload = {
  x402Version: 2;
  scheme: "exact";
  network: string;
  payload: {
    signature: string;
    publicKey: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
};

export type CasperPaymentRequirements = {
  scheme: "exact";
  network: string;
  payTo: string;
  amount: string;
  asset: string;
  extra: {
    name: string;
    version: string;
    decimals: string;
  };
  maxTimeoutSeconds: number;
};

export type PolicyDecision =
  | { ok: true; policy: AgentPolicy }
  | { ok: false; reason: string; severity: RiskEvent["severity"] };
