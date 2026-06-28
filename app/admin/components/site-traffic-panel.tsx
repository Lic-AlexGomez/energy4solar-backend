import Link from "next/link"
import type { SiteTrafficStats } from "@/modules/admin/site-analytics.service"

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

export function SiteTrafficPanel({ stats }: { stats: SiteTrafficStats }) {
  if (!stats.configured) {
    return (
      <section className="admin-panel">
        <h2>Site visits</h2>
        <p className="admin-empty">
          Run <code>npm run db:push</code> on the backend to enable visit tracking.
        </p>
      </section>
    )
  }

  return (
    <>
      <div className="admin-stats admin-stats-traffic">
        <div className="admin-stat-card admin-stat-accent">
          <div className="admin-stat-label">Visitors (7 days)</div>
          <div className="admin-stat-value">{fmt(stats.visitors7d)}</div>
          <div className="admin-stat-sub">{fmt(stats.visitors30d)} last 30 days</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Pageviews (7 days)</div>
          <div className="admin-stat-value">{fmt(stats.pageviews7d)}</div>
          <div className="admin-stat-sub">{fmt(stats.pageviews30d)} last 30 days</div>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Daily visits (30 days)</h2>
          </div>
          {stats.daily.length ? (
            <ul className="admin-activity-list">
              {stats.daily.map((d) => (
                <li key={d.day}>
                  <span>{d.day}</span>
                  <span className="admin-activity-meta">
                    {fmt(d.visitors)} visitors · {fmt(d.pageviews)} views
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">
              No visits recorded yet. Traffic appears here as people browse{" "}
              <a href={process.env.SITE_URL ?? "https://www.energy4solar.com"} target="_blank" rel="noreferrer">
                your site
              </a>
              .
            </p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Top pages (30 days)</h2>
          </div>
          {stats.topPages.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {stats.topPages.map((p) => (
                  <tr key={p.path}>
                    <td>
                      <code className="admin-path-code">{p.path}</code>
                    </td>
                    <td>{fmt(p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Top pages will appear after the first visits.</p>
          )}
        </section>
      </div>

      <p className="admin-traffic-note">
        Tracked on your site alongside{" "}
        <Link href="https://vercel.com/docs/analytics" target="_blank" rel="noreferrer">
          Vercel Analytics
        </Link>
        . Affiliate clicks are listed below.
      </p>
    </>
  )
}
