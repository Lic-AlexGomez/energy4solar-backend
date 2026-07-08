/**
 * Human-readable retailer name from an affiliate URL. Energy4Solar links to
 * multiple affiliate partners, so the storefront must show the real destination
 * instead of hard-coding one retailer.
 */
const KNOWN_RETAILERS: Array<{ match: RegExp; name: string }> = [
  { match: /bigbattery\.com/i, name: "BigBattery" },
  { match: /signaturesolar\.com/i, name: "Signature Solar" },
  { match: /eg4electronics\.com/i, name: "EG4 Electronics" },
  { match: /amazon\./i, name: "Amazon" },
  { match: /watts247\.com/i, name: "Watts247" },
  { match: /currentconnected\.com/i, name: "Current Connected" },
]

export function retailerFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  for (const { match, name } of KNOWN_RETAILERS) {
    if (match.test(url)) return name
  }
  // Fallback: title-case the second-level domain (example.com -> "Example").
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    const label = host.split(".")[0]
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : null
  } catch {
    return null
  }
}
