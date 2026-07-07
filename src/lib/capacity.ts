/**
 * Parse a free-text capacity string into kWh.
 *
 * Zoho stores capacity as free text ("10 kWh", "1024Wh", "100Ah"). The finder
 * and calculator previously did `parseFloat(capacity)`, which misreads Wh (as
 * thousands of kWh) and Ah (as raw numbers). This normalizes to kWh so
 * price-per-kWh and finder sizing are correct.
 *
 * @param capacity free-text capacity (e.g. "5.12 kWh", "1024Wh", "100Ah")
 * @param voltage  free-text voltage (e.g. "51.2 V") — needed to convert Ah→kWh
 * @returns kWh as a number, or null if unparseable
 */
export function parseCapacityKwh(
  capacity?: string | null,
  voltage?: string | null,
): number | null {
  if (!capacity) return null
  const text = capacity.toLowerCase().replace(/,/g, "")
  const num = Number.parseFloat(text.replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(num) || num <= 0) return null

  // kWh (check before Wh so "kwh" isn't caught by the "wh" branch)
  if (/kwh|kw·h|kw h/.test(text)) return round(num)
  // Wh → kWh
  if (/wh|watt.?hour/.test(text)) return round(num / 1000)
  // Ah → kWh needs voltage: kWh = Ah * V / 1000
  if (/ah|amp.?hour/.test(text)) {
    const v = Number.parseFloat((voltage ?? "").replace(/[^0-9.]/g, ""))
    if (Number.isFinite(v) && v > 0) return round((num * v) / 1000)
    return null
  }
  // Bare number: assume kWh (most home-battery specs are in kWh)
  return round(num)
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
