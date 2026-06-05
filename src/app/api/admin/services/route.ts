import { getConfig } from "@/lib/config";
import { readLedger, upsertService } from "@/lib/ledger";
import { assertAdmin } from "@/lib/security";
import { parseServiceInput } from "@/lib/validation";

export async function GET(request: Request): Promise<Response> {
  const auth = assertAdmin(request, getConfig().adminToken);
  if (auth) return auth;

  const state = await readLedger();
  return Response.json({ services: state.services });
}

export async function POST(request: Request): Promise<Response> {
  const auth = assertAdmin(request, getConfig().adminToken);
  if (auth) return auth;

  const parsed = parseServiceInput(await request.json());
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const service = await upsertService(parsed.data);
  return Response.json({ service }, { status: 201 });
}
