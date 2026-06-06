import { addPolicy, readLedger } from "@/lib/ledger";
import { parsePolicyInput } from "@/lib/validation";

export async function GET(): Promise<Response> {
  const state = await readLedger();
  return Response.json({ policies: state.policies });
}

export async function POST(request: Request): Promise<Response> {
  const parsed = parsePolicyInput(await request.json());
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const policy = await addPolicy(parsed.data);
  return Response.json({ policy }, { status: 201 });
}
