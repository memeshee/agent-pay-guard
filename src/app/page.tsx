import { getConfig, getPaymentSetupError } from "@/lib/config";
import { readLedger } from "@/lib/ledger";
import { OpsConsole } from "@/components/ops-console";
import { WalletRail } from "@/components/wallet-rail";

export default async function Home() {
  const [state, config] = await Promise.all([readLedger(), Promise.resolve(getConfig())]);
  const setupError = getPaymentSetupError(config);
  const totalSettled = state.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const latestRisks = state.riskEvents.slice(0, 5);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Casper Agentic Buildathon MVP</p>
          <h1>AgentPay Guard</h1>
          <p className="lead">
            A real x402 payment gateway for AI agents with Casper spend policies, settlement receipts, and attack-surface
            monitoring.
          </p>
        </div>
        <div className="statusPanel">
          <span className={setupError ? "status danger" : "status ok"}>{setupError ? "Setup blocked" : "Payment stack ready"}</span>
          <dl>
            <div>
              <dt>Network</dt>
              <dd>{config.network}</dd>
            </div>
            <div>
              <dt>Settled volume</dt>
              <dd>{totalSettled.toFixed(2)} CSPR</dd>
            </div>
            <div>
              <dt>Receipts</dt>
              <dd>{state.receipts.length}</dd>
            </div>
          </dl>
          {setupError ? <p className="setupError">{setupError}</p> : null}
        </div>
      </section>

      <section className="grid">
        <div className="panel wide">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Paid tools</p>
              <h2>Agent-callable Casper services</h2>
            </div>
            <code>POST /api/gateway/:slug</code>
          </div>
          <div className="serviceList">
            {state.services.map((service) => (
              <article className="service" key={service.id}>
                <div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="price">
                  <strong>{service.price}</strong>
                  <span>CSPR</span>
                </div>
                <code>{service.slug}</code>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">MCP methods</p>
          <h2>Agent interface</h2>
          <ul className="methodList">
            <li>list_services</li>
            <li>quote_service</li>
            <li>call_service</li>
            <li>get_spend_status</li>
            <li>get_receipt</li>
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">Policies</p>
          <h2>Spend controls</h2>
          <p className="muted">
            {state.policies.length
              ? `${state.policies.length} active or historical policy records are stored.`
              : "Create policies through the admin API before agents can settle paid calls."}
          </p>
        </div>

        <div className="panel">
          <WalletRail appId={config.csprClickAppId} />
        </div>

        <div className="panel wide">
          <OpsConsole services={state.services.filter((service) => service.active)} />
        </div>

        <div className="panel wide">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Risk monitor</p>
              <h2>Latest security events</h2>
            </div>
            <code>{state.riskEvents.length} events</code>
          </div>
          {latestRisks.length ? (
            <div className="riskList">
              {latestRisks.map((event) => (
                <article className="risk" key={event.id}>
                  <strong>{event.type}</strong>
                  <span>{event.severity}</span>
                  <p>{event.message}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No policy, replay, facilitator, or service failures logged yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
