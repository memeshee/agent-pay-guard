import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentPay Guard",
  description: "Casper x402 spend controls and receipts for autonomous agents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
