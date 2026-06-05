import { randomBytes } from "node:crypto";

export function id(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
