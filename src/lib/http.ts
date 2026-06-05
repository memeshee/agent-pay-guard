export function paymentRequired(body: Record<string, unknown>): Response {
  return Response.json(body, {
    status: 402,
    headers: {
      "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(body)).toString("base64url"),
    },
  });
}
