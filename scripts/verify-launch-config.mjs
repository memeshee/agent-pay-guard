import fs from "node:fs";

const env = readEnv(".env");
const checks = [
  ["CSPR_CLICK_APP_ID", /^[0-9a-f]{32}$/.test(env.CSPR_CLICK_APP_ID ?? ""), "32-char lowercase hex CSPR.click app id"],
  ["CSPR_CLOUD_BASE_URL", /^https:\/\/api(\.testnet)?\.cspr\.cloud$/.test(env.CSPR_CLOUD_BASE_URL ?? ""), "CSPR.cloud REST base URL"],
  ["CSPR_CLOUD_TOKEN", Boolean(env.CSPR_CLOUD_TOKEN), "CSPR.cloud token"],
  ["CASPER_X402_FACILITATOR_URL", Boolean(env.CASPER_X402_FACILITATOR_URL), "Casper x402 facilitator URL"],
  [
    "PAYEE_ADDRESS or MERCHANT_PUBLIC_KEY",
    /^00[0-9a-fA-F]{64}$/.test(env.PAYEE_ADDRESS ?? env.MERCHANT_PUBLIC_KEY ?? ""),
    "Casper account hash format: 00 plus 64 hex chars",
  ],
  ["CASPER_X402_ASSET_PACKAGE", /^[0-9a-fA-F]{64}$/.test((env.CASPER_X402_ASSET_PACKAGE ?? "").replace(/^hash-/, "")), "CEP-18 package hash"],
  ["CASPER_X402_ASSET_NAME", Boolean(env.CASPER_X402_ASSET_NAME), "CEP-18 token name"],
  ["CASPER_X402_CHAIN_ID", /^casper:/.test(env.CASPER_X402_CHAIN_ID ?? "casper:casper-test"), "Casper CAIP-2 chain id"],
];

let ok = true;
for (const [name, passed, detail] of checks) {
  console.log(`${passed ? "OK " : "MISS"} ${name} - ${detail}`);
  ok &&= Boolean(passed);
}

if (!ok) {
  console.log("\nNext step: derive PAYEE_ADDRESS from your wallet public key:");
  console.log("pnpm derive-payee <public_key_hex>");
  process.exit(1);
}

console.log("\nLaunch config shape is valid. Real settlement still requires funded testnet accounts and a live facilitator.");

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
