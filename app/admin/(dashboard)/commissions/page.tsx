import Link from "next/link"
import { commissionService } from "@/modules/admin/commission.service"
import { StatCard } from "../../components/stat-card"
import { clearCommissionsAction } from "./actions"
import { CsvUploadForm } from "./csv-upload"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export default async function AdminCommissionsPage() {
  const data = await commissionService.getDashboard()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Commissions</h1>
          <p className="admin-subtitle">
            Import real payout data from your BigBattery or affiliate network CSV export.
          </p>
        </div>
        {data.totalRecords > 0 ? (
          <form action={clearCommissionsAction}>
            <button type="submit" className="admin-btn admin-btn-secondary">
              Clear all imports
            </button>
          </form>
        ) : null}
      </div>

      <div className="admin-stats">
        <StatCard label="Total imported" value={money(data.totalAmount)} sub={`${data.totalRecords} records`} accent />
        <StatCard label="Paid / approved" value={money(data.paidAmount)} />
        <StatCard label="Pending" value={money(data.pendingAmount)} />
        <StatCard label="Last 30 days" value={money(data.last30Amount)} />
      </div>

      <CsvUploadForm />

      {data.byMonth.length ? (
        <section className="admin-panel admin-section">
          <h2>By month</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              {data.byMonth.map((m) => (
                <tr key={m.month}>
                  <td>{m.month}</td>
                  <td className="admin-money">{money(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="admin-panel admin-section">
        <div className="admin-panel-header">
          <h2>Recent imports</h2>
          <Link href="/admin/earnings" className="admin-link-sm">
            Earnings overview →
          </Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Order date</th>
              <th>Imported</th>
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
                  <td>{r.importedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-empty">
                  No commission data yet. Upload a CSV from your affiliate dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
