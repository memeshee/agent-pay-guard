type WalletRailProps = {
  appKey?: string;
};

export function WalletRail({ appKey }: WalletRailProps) {
  return (
    <div className="walletRail">
      <div>
        <p className="eyebrow">Wallet UX</p>
        <h2>CSPR.click configured</h2>
        <p className="muted">
          App identity is configured for the wallet domain. Agent payment signing stays outside the demo dashboard.
        </p>
      </div>
      <div className="walletMount">
        <span>{appKey ? "App key present" : "App key missing"}</span>
        <code>{appKey ? `appKey ${appKey}` : "CSPR_CLICK_APP_KEY missing"}</code>
      </div>
    </div>
  );
}
