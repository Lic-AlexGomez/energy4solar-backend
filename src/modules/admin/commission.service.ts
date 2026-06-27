import { prisma } from "@/lib/prisma"

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v?.trim()) return v.trim()
  }
  return ""
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[$,]/g, ""))
  return Number.isFinite(n) ? n : null
}

function parseDate(raw: string): Date | null {
  if (!raw.trim()) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export type CsvImportResult = {
  imported: number
  skipped: number
  errors: string[]
}

export const commissionService = {
  async importCsv(text: string): Promise<CsvImportResult> {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      return { imported: 0, skipped: 0, errors: ["CSV must include a header row and at least one data row."] }
    }

    const headers = parseCsvLine(lines[0]!).map(normalizeHeader)
    const errors: string[] = []
    let imported = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]!)
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = cells[idx] ?? ""
      })

      const amountRaw = pick(
        row,
        "commission",
        "commission_amount",
        "amount",
        "payout",
        "earnings",
        "total_commission",
        "net_commission",
      )
      const amount = parseAmount(amountRaw)
      if (amount == null || amount <= 0) {
        skipped += 1
        continue
      }

      const orderDate = parseDate(
        pick(row, "order_date", "date", "transaction_date", "sale_date", "created_at", "order_created"),
      )

      try {
        await prisma.commissionRecord.create({
          data: {
            externalId: pick(row, "order_id", "order_number", "transaction_id", "id") || null,
            sku: pick(row, "sku", "product_sku", "item_sku") || null,
            productName: pick(row, "product", "product_name", "item_name", "name", "description") || null,
            amount,
            status: pick(row, "status", "commission_status", "state") || "paid",
            orderDate,
            raw: row,
          },
        })
        imported += 1
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : String(err)}`)
        skipped += 1
      }
    }

    return { imported, skipped, errors }
  },

  async getDashboard() {
    const [total, paid, pending, last30, byMonth, recent] = await Promise.all([
      prisma.commissionRecord.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.commissionRecord.aggregate({
        where: { status: { in: ["paid", "approved", "completed"] } },
        _sum: { amount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: { status: { in: ["pending", "processing", "open"] } },
        _sum: { amount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: { orderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<{ month: Date; total: unknown }[]>`
        SELECT date_trunc('month', COALESCE("orderDate", "importedAt")) AS month,
               SUM(amount) AS total
        FROM energy4solar."CommissionRecord"
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 12
      `,
      prisma.commissionRecord.findMany({
        orderBy: { importedAt: "desc" },
        take: 20,
      }),
    ])

    return {
      totalRecords: total._count,
      totalAmount: Number(total._sum.amount ?? 0),
      paidAmount: Number(paid._sum.amount ?? 0),
      pendingAmount: Number(pending._sum.amount ?? 0),
      last30Amount: Number(last30._sum.amount ?? 0),
      byMonth: byMonth.map((m) => ({
        month: new Date(m.month).toISOString().slice(0, 7),
        total: Number(m.total),
      })),
      recent: recent.map((r) => ({
        id: r.id,
        productName: r.productName ?? r.sku ?? "—",
        amount: Number(r.amount),
        status: r.status,
        orderDate: r.orderDate?.toISOString().slice(0, 10) ?? "—",
        importedAt: r.importedAt.toISOString().slice(0, 10),
      })),
    }
  },
}
