"use client";

import { useEffect, useState } from "react";

type WalletRailProps = {
  appId?: string;
};

export function WalletRail({ appId }: WalletRailProps) {
  const [status, setStatus] = useState("Loading SDK");

  useEffect(() => {
    let mounted = true;
    import("@make-software/csprclick-ui")
      .then(() => {
        if (!mounted) return;
        setStatus("CSPR.click SDK loaded");
      })
      .catch(() => {
        if (mounted) setStatus("CSPR.click SDK unavailable");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="walletRail">
      <div>
        <p className="eyebrow">Wallet UX</p>
        <h2>CSPR.click ready</h2>
        <p className="muted">Use the wallet layer for funded agent accounts and merchant settlement setup.</p>
      </div>
      <div className="walletMount">
        <span>{status}</span>
        <code>{appId ? `appId ${appId}` : "CSPR_CLICK_APP_ID missing"}</code>
      </div>
    </div>
  );
}
