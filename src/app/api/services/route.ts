import { readLedger } from "@/lib/ledger";

export async function GET(): Promise<Response> {
  const state = await readLedger();
  return Response.json({ services: state.services.filter((service) => service.active) });
}
