import casper from "casper-js-sdk";

const publicKey = process.argv[2]?.trim();

if (!publicKey) {
  console.error("Usage: pnpm derive-payee <casper-public-key-hex>");
  process.exit(1);
}

if (!/^(01[0-9a-fA-F]{64}|02[0-9a-fA-F]{66})$/.test(publicKey)) {
  console.error("Invalid Casper public key. Expected Ed25519 01+64 hex or Secp256k1 02+66 hex.");
  process.exit(1);
}

const accountHash = Buffer.from(casper.PublicKey.fromHex(publicKey).accountHash().hashBytes).toString("hex");
console.log(`PAYEE_ADDRESS=00${accountHash}`);
console.log(`account-hash-${accountHash}`);
