import { readLedger } from "@/lib/ledger";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params): Promise<Response> {
  const { id } = await context.params;
  const state = await readLedger();
  const receipt = state.receipts.find((item) => item.id === id);
  if (!receipt) return Response.json({ error: "Receipt not found." }, { status: 404 });
  return Response.json({ receipt });
}
