import { getConfig } from "@/lib/config";
import { readLedger } from "@/lib/ledger";
import { buildPaymentRequirements } from "@/lib/x402-casper";

type RpcRequest = {
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
};

export async function POST(request: Request): Promise<Response> {
  const rpc = (await request.json()) as RpcRequest;
  const state = await readLedger();
  const config = getConfig();

  if (rpc.method === "list_services") {
    return rpcResult(rpc.id, state.services.filter((service) => service.active));
  }

  if (rpc.method === "quote_service") {
    const slug = typeof rpc.params?.serviceSlug === "string" ? rpc.params.serviceSlug : "";
    const service = state.services.find((item) => item.slug === slug && item.active);
    if (!service) return rpcError(rpc.id, "Service not found.");
    return rpcResult(rpc.id, {
      serviceSlug: service.slug,
      amount: service.price,
      asset: service.asset,
      merchantPublicKey: config.merchantPublicKey,
      network: config.network,
      x402Network: config.x402ChainId,
      paymentRequirements: buildPaymentRequirements(config, service),
      paymentHeader: "PAYMENT-SIGNATURE",
    });
  }

  if (rpc.method === "get_spend_status") {
    const publicKey = typeof rpc.params?.agentPublicKey === "string" ? rpc.params.agentPublicKey : "";
    const receipts = state.receipts.filter((receipt) => receipt.payerPublicKey === publicKey);
    return rpcResult(rpc.id, {
      receipts: receipts.length,
      totalSpend: receipts.reduce((sum, receipt) => sum + receipt.amount, 0),
      policies: state.policies.filter((policy) => policy.agentPublicKey === publicKey),
    });
  }

  if (rpc.method === "get_receipt") {
    const id = typeof rpc.params?.receiptId === "string" ? rpc.params.receiptId : "";
    const receipt = state.receipts.find((item) => item.id === id);
    if (!receipt) return rpcError(rpc.id, "Receipt not found.");
    return rpcResult(rpc.id, receipt);
  }

  if (rpc.method === "call_service") {
    const slug = typeof rpc.params?.serviceSlug === "string" ? rpc.params.serviceSlug : "";
    return rpcResult(rpc.id, {
      url: `/api/gateway/${slug}`,
      requiredHeader: "PAYMENT-SIGNATURE",
      note: "Call this URL directly with an x402 payment payload after quote_service.",
    });
  }

  return rpcError(rpc.id, "Unsupported MCP method.");
}

function rpcResult(id: RpcRequest["id"], result: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: RpcRequest["id"], message: string): Response {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code: -32601, message } }, { status: 400 });
}
