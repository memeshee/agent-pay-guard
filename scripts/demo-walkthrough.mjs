import fs from "node:fs";

const baseUrl = (process.argv[2] ?? process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const serviceSlug = process.argv[3] ?? "market-snapshot";
const env = readEnv(".env");
const csprClickAppKey = env.CSPR_CLICK_APP_KEY ?? env.CSPR_CLICK_APP_ID;

const steps = [
  ["Launch config", verifyConfig],
  ["App health", checkHome],
  ["List paid services", listServices],
  ["Fetch x402 quote", fetchQuote],
  ["MCP quote", mcpQuote],
  ["Unpaid gateway 402", unpaidGateway],
  ["Facilitator support", facilitatorSupported],
  ["Payee balance", payeeBalance],
];

console.log(`AgentPay Guard demo against ${baseUrl}`);
console.log(`Service: ${serviceSlug}\n`);

await warnIfBaseUrlLooksLikeFacilitator();

for (const [name, fn] of steps) {
  try {
    const result = await fn();
    console.log(`OK  ${name}`);
    if (result) console.log(indent(format(result)));
  } catch (error) {
    console.log(`WARN ${name}`);
    console.log(indent(error instanceof Error ? error.message : String(error)));
  }
  console.log("");
}

console.log("Demo script complete. A real paid call still requires a valid Casper x402 PAYMENT-SIGNATURE from an agent wallet.");

async function verifyConfig() {
  const required = {
    CSPR_CLICK_APP_KEY: /^[0-9a-f]{32}$/.test(csprClickAppKey ?? ""),
    CSPR_CLOUD_BASE_URL: Boolean(env.CSPR_CLOUD_BASE_URL),
    CSPR_CLOUD_TOKEN: Boolean(env.CSPR_CLOUD_TOKEN),
    CASPER_X402_FACILITATOR_URL: Boolean(env.CASPER_X402_FACILITATOR_URL),
    PAYEE_ADDRESS: /^00[0-9a-fA-F]{64}$/.test(env.PAYEE_ADDRESS ?? env.MERCHANT_PUBLIC_KEY ?? ""),
    CASPER_X402_ASSET_PACKAGE: /^[0-9a-fA-F]{64}$/.test((env.CASPER_X402_ASSET_PACKAGE ?? "").replace(/^hash-/, "")),
  };
  const missing = Object.entries(required)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);
  if (missing.length) throw new Error(`Missing/invalid: ${missing.join(", ")}`);
  return {
    network: env.CASPER_X402_CHAIN_ID ?? "casper:casper-test",
    payeeAddress: maskMiddle(env.PAYEE_ADDRESS ?? env.MERCHANT_PUBLIC_KEY ?? ""),
    csprClickAppKey,
  };
}

async function checkHome() {
  const response = await fetch(baseUrl);
  if (!response.ok) {
    throw new Error(
      `Expected homepage 200, got ${response.status}. If this URL is the x402 facilitator, run demo against the Next.js app URL instead.`,
    );
  }
  return `homepage ${response.status}`;
}

async function listServices() {
  const body = await getJson(`${baseUrl}/api/services`);
  return body.services?.map((service) => `${service.slug}: ${service.price} ${service.asset}`) ?? body;
}

async function fetchQuote() {
  const body = await getJson(`${baseUrl}/api/quotes/${serviceSlug}`);
  const quote = body.quote;
  if (!quote?.paymentRequirements) throw new Error("Quote did not include paymentRequirements.");
  return {
    executionReady: quote.executionReady,
    payTo: maskMiddle(quote.paymentRequirements.payTo),
    amount: quote.paymentRequirements.amount,
    asset: quote.paymentRequirements.asset,
    network: quote.paymentRequirements.network,
  };
}

async function mcpQuote() {
  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "demo-quote", method: "quote_service", params: { serviceSlug } }),
  });
  const body = await readJsonResponse(response, `${baseUrl}/api/mcp`);
  if (!response.ok) throw new Error(JSON.stringify(body));
  return {
    method: "quote_service",
    amount: body.result?.paymentRequirements?.amount,
    network: body.result?.paymentRequirements?.network,
  };
}

async function unpaidGateway() {
  const response = await fetch(`${baseUrl}/api/gateway/${serviceSlug}`);
  const body = await readJsonResponse(response, `${baseUrl}/api/gateway/${serviceSlug}`);
  if (response.status !== 402) throw new Error(`Expected 402, got ${response.status}: ${JSON.stringify(body)}`);
  return {
    status: response.status,
    paymentRequiredHeaderPresent: Boolean(response.headers.get("PAYMENT-REQUIRED")),
    serviceSlug: body.quote?.serviceSlug,
  };
}

async function facilitatorSupported() {
  const url = env.CASPER_X402_FACILITATOR_URL;
  if (!url) throw new Error("CASPER_X402_FACILITATOR_URL missing.");
  const response = await fetch(`${url.replace(/\/$/, "")}/supported`, {
    headers: env.CASPER_X402_FACILITATOR_API_KEY ? { Authorization: env.CASPER_X402_FACILITATOR_API_KEY } : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Facilitator /supported returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function payeeBalance() {
  const base = env.CSPR_CLOUD_BASE_URL?.replace(/\/$/, "");
  const token = env.CSPR_CLOUD_TOKEN;
  const payee = (env.PAYEE_ADDRESS ?? env.MERCHANT_PUBLIC_KEY ?? "").replace(/^00/, "");
  if (!base || !token || !payee) throw new Error("CSPR.cloud config or payee missing.");
  const response = await fetch(`${base}/accounts/${payee}`, { headers: { Authorization: token } });
  const body = await response.json();
  if (!response.ok) throw new Error(`CSPR.cloud returned ${response.status}: ${JSON.stringify(body)}`);
  return {
    accountHash: body.data?.account_hash,
    publicKey: body.data?.public_key,
    balanceCSPR: Number(body.data?.balance ?? 0) / 1_000_000_000,
  };
}

async function getJson(url) {
  const response = await fetch(url);
  const body = await readJsonResponse(response, url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readJsonResponse(response, url) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `${url} returned ${response.status} ${contentType || "unknown content-type"}: ${text.slice(0, 120)}`,
    );
  }
  return response.json();
}

async function warnIfBaseUrlLooksLikeFacilitator() {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/supported`);
    if (!response.ok) return;
    const body = await response.json().catch(() => null);
    if (Array.isArray(body?.kinds)) {
      console.log("WARN Base URL looks like a Casper x402 facilitator, not the AgentPay Guard app.");
      console.log(indent("Use this URL for CASPER_X402_FACILITATOR_URL, then run demo against your Vercel/Next.js app URL.\n"));
    }
  } catch {
    // Best-effort hint only.
  }
}

function readEnv(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function format(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function indent(value) {
  return value
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function maskMiddle(value) {
  if (!value || value.length < 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}
