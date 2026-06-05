import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function assertAdmin(request: Request, adminToken?: string): Response | null {
  if (!adminToken) {
    return Response.json({ error: "ADMIN_TOKEN is not configured." }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, adminToken)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
