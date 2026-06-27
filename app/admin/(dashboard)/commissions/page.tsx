import { commissionService } from "@/modules/admin/commission.service"
import { StatCard } from "../../components/stat-card"
import { clearCommissionsAction } from "./actions"
import { CsvUploadForm } from "./csv-upload"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export default async function AdminCommissionsPage() {
  const data = await commissionService.getDashboard()
  const maxMonth = Math.max(...data.byMonth.map((m) => m.total), 1)

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">My commissions</h1>
          <p className="admin-subtitle">
            Your real affiliate payouts from BigBattery. Import a CSV export from your affiliate portal to track
            earnings here.
          </p>
        </div>
        {data.totalRecords > 0 ? (
          <form action={clearCommissionsAction}>
            <button type="submit" className="admin-btn admin-btn-secondary">
              Clear all
            </button>
          </form>
        ) : null}
      </header>

      <div className="admin-stats">
        <StatCard label="Total earned" value={money(data.totalAmount)} sub={`${data.totalRecords} orders`} accent />
        <StatCard label="Paid" value={money(data.paidAmount)} />
        <StatCard label="Pending" value={money(data.pendingAmount)} />
        <StatCard label="Last 30 days" value={money(data.last30Amount)} />
      </div>

      <CsvUploadForm />

      <div className="admin-grid-2">
        {data.byMonth.length ? (
          <section className="admin-panel">
            <h2>By month</h2>
            <div className="admin-chart" style={{ marginTop: "1rem" }}>
              {[...data.byMonth].reverse().map((m) => (
                <div key={m.month} className="admin-chart-row">
                  <span className="admin-chart-label">{m.month}</span>
                  <div className="admin-chart-bar-wrap">
                    <div
                      className="admin-chart-bar"
                      style={{ width: `${Math.round((m.total / maxMonth) * 100)}%` }}
                    />
                  </div>
                  <span className="admin-chart-value admin-money">{money(m.total)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.topProducts.length ? (
          <section className="admin-panel">
            <h2>Top products</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Orders</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.orders}</td>
                    <td className="admin-money">{money(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>

      <section className="admin-panel admin-section">
        <h2>All commission records</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Order date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.length ? (
              data.recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.productName}</td>
                  <td className="admin-money">{money(r.amount)}</td>
                  <td>{r.status}</td>
                  <td>{r.orderDate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="admin-empty">
                  No commissions yet. Upload a CSV from your BigBattery affiliate dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
