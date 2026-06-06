import { readLedger, upsertService } from "@/lib/ledger";
import { parseServiceInput } from "@/lib/validation";

export async function GET(): Promise<Response> {
  const state = await readLedger();
  return Response.json({ services: state.services });
}

export async function POST(request: Request): Promise<Response> {
  const parsed = parseServiceInput(await request.json());
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const service = await upsertService(parsed.data);
  return Response.json({ service }, { status: 201 });
}
