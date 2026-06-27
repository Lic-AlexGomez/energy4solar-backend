import Link from "next/link"
import { StatCard } from "../../components/stat-card"
import { earningsService } from "@/modules/admin/earnings.service"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export default async function AdminEarningsPage() {
  const data = await earningsService.getDashboard()
  const maxDaily = Math.max(...data.daily.map((d) => d.clicks), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Earnings</h1>
          <p className="admin-subtitle">
            Click-based estimates plus real commissions imported from CSV. Rate: {data.commissionPct}% via{" "}
            <code>AFFILIATE_COMMISSION_PCT</code>.
          </p>
        </div>
        <Link href="/admin/commissions" className="admin-btn">
          Import CSV
        </Link>
      </div>

      <div className="admin-stats">
        <StatCard
          label="Actual commissions"
          value={money(data.actual.total)}
          sub={`${data.actual.records} imported rows`}
          accent
        />
        <StatCard label="Paid / approved" value={money(data.actual.paid)} />
        <StatCard label="Pending" value={money(data.actual.pending)} />
        <StatCard label="Actual (30d)" value={money(data.actual.last30)} />
        <StatCard label="Est. (30d)" value={money(data.estCommission30d)} sub="From clicks" />
        <StatCard label="Clicks (30d)" value={data.clicks30d} />
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <h2>Top earners (30 days)</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Clicks</th>
                <th>Est. commission</th>
              </tr>
            </thead>
            <tbody>
              {data.topEarners30d.length ? (
                data.topEarners30d.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <Link href={`/admin/products?q=${encodeURIComponent(row.name)}`}>{row.name}</Link>
                    </td>
                    <td>{row.clicks}</td>
                    <td className="admin-money">{money(row.estCommission)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    No clicks in the last 30 days yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="admin-panel">
          <h2>Click activity (14 days)</h2>
          <div className="admin-chart">
            {data.daily.map((d) => (
              <div key={d.day} className="admin-chart-row">
                <span className="admin-chart-label">{d.day.slice(5)}</span>
                <div className="admin-chart-bar-wrap">
                  <div
                    className="admin-chart-bar"
                    style={{ width: `${Math.round((d.clicks / maxDaily) * 100)}%` }}
                  />
                </div>
                <span className="admin-chart-value">{d.clicks}</span>
              </div>
            ))}
            {!data.daily.length ? <p className="admin-empty">No click data yet.</p> : null}
          </div>
        </section>
      </div>

      <section className="admin-panel admin-section">
        <h2>All-time top products</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Clicks</th>
              <th>Est. lifetime commission</th>
            </tr>
          </thead>
          <tbody>
            {data.topAllTime.map((row) => (
              <tr key={row.slug}>
                <td>{row.name}</td>
                <td>{money(row.price)}</td>
                <td>{row.clicks}</td>
                <td className="admin-money">{money(row.estCommission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="admin-disclaimer">
        Figures are estimates for planning only. Actual BigBattery commissions may differ. Import real payout data
        from your affiliate portal when available.
      </p>
    </div>
  )
}
