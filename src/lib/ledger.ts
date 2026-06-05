import { promises as fs } from "node:fs";
import path from "node:path";
import { id, nowIso } from "./ids";
import type { AgentPolicy, LedgerState, PaymentReceipt, RiskEvent, Service } from "./types";

const ledgerPath = path.join(process.cwd(), "data", "ledger.json");

const seedServices: Service[] = [
  {
    id: "svc_rate",
    slug: "cspr-rate",
    name: "CSPR Rate Snapshot",
    description: "Returns a current CSPR market snapshot for agents that need priced decisions.",
    kind: "cspr_rate",
    price: 0.25,
    asset: "CEP18",
    active: true,
    createdAt: nowIso(),
  },
  {
    id: "svc_balance",
    slug: "account-balance",
    name: "Casper Account Balance",
    description: "Fetches a Casper account balance by public key from CSPR.cloud.",
    kind: "cspr_balance",
    price: 0.5,
    asset: "CEP18",
    active: true,
    createdAt: nowIso(),
  },
  {
    id: "svc_market",
    slug: "market-snapshot",
    name: "Agent Market Snapshot",
    description: "Returns a compact market state for autonomous payment and risk checks.",
    kind: "market_snapshot",
    price: 0.75,
    asset: "CEP18",
    active: true,
    createdAt: nowIso(),
  },
];

const emptyState = (): LedgerState => ({
  services: seedServices,
  policies: [],
  receipts: [],
  riskEvents: [],
});

async function ensureLedger(): Promise<void> {
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  try {
    await fs.access(ledgerPath);
  } catch {
    await fs.writeFile(ledgerPath, JSON.stringify(emptyState(), null, 2));
  }
}

export async function readLedger(): Promise<LedgerState> {
  await ensureLedger();
  const raw = await fs.readFile(ledgerPath, "utf8");
  return JSON.parse(raw) as LedgerState;
}

export async function writeLedger(state: LedgerState): Promise<void> {
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.writeFile(ledgerPath, JSON.stringify(state, null, 2));
}

export async function upsertService(input: Omit<Service, "id" | "asset" | "createdAt">): Promise<Service> {
  const state = await readLedger();
  const existing = state.services.find((service) => service.slug === input.slug);
  const service: Service = {
    id: existing?.id ?? id("svc"),
    slug: input.slug,
    name: input.name,
    description: input.description,
    kind: input.kind,
    price: input.price,
    asset: "CEP18",
    active: input.active,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  state.services = existing
    ? state.services.map((item) => (item.slug === service.slug ? service : item))
    : [...state.services, service];
  await writeLedger(state);
  return service;
}

export async function addPolicy(input: Omit<AgentPolicy, "id" | "createdAt">): Promise<AgentPolicy> {
  const state = await readLedger();
  const policy: AgentPolicy = { id: id("pol"), createdAt: nowIso(), ...input };
  state.policies = [...state.policies, policy];
  await writeLedger(state);
  return policy;
}

export async function addReceipt(input: Omit<PaymentReceipt, "id" | "createdAt">): Promise<PaymentReceipt> {
  const state = await readLedger();
  const receipt: PaymentReceipt = { id: id("rcpt"), createdAt: nowIso(), ...input };
  state.receipts = [...state.receipts, receipt];
  await writeLedger(state);
  return receipt;
}

export async function addRiskEvent(input: Omit<RiskEvent, "id" | "createdAt">): Promise<RiskEvent> {
  const state = await readLedger();
  const riskEvent: RiskEvent = { id: id("risk"), createdAt: nowIso(), ...input };
  state.riskEvents = [riskEvent, ...state.riskEvents].slice(0, 200);
  await writeLedger(state);
  return riskEvent;
}
