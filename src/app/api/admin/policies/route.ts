import { getConfig } from "@/lib/config";
import { addPolicy, readLedger } from "@/lib/ledger";
import { assertAdmin } from "@/lib/security";
import { parsePolicyInput } from "@/lib/validation";

export async function GET(request: Request): Promise<Response> {
  const auth = assertAdmin(request, getConfig().adminToken);
  if (auth) return auth;

  const state = await readLedger();
  return Response.json({ policies: state.policies });
}

export async function POST(request: Request): Promise<Response> {
  const auth = assertAdmin(request, getConfig().adminToken);
  if (auth) return auth;

  const parsed = parsePolicyInput(await request.json());
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const policy = await addPolicy(parsed.data);
  return Response.json({ policy }, { status: 201 });
}
