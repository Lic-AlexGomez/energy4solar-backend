/**
 * Heuristic taxonomy for synced products.
 *
 * Zoho Books does not carry use-case / compatibility / pros-cons data, so we
 * derive them from the inferred category, name and specs. Without this the
 * battery finder (which filters on `compatibility.has(application)`) returns
 * nothing and the product page "Best for" section is empty.
 *
 * Category slugs match the output of `inferCategorySlug` in product.mapper.ts:
 * home-batteries | portable-power | solar-panels | inverters | ev-chargers.
 * Applications mirror the frontend `Application` union.
 */

export type Application = "home" | "rv" | "cabin" | "marine" | "commercial"

const COMPATIBILITY_MAP: Record<string, Application[]> = {
  "home-batteries": ["home", "cabin", "commercial"],
  "portable-power": ["rv", "cabin", "marine"],
  "solar-panels": ["home", "rv", "cabin", "marine", "commercial"],
  inverters: ["home", "commercial"],
  "ev-chargers": ["home", "commercial"],
}

const IDEAL_USE_CASES: Record<Application, string> = {
  home: "Whole-home backup",
  rv: "RV & van life",
  cabin: "Off-grid cabin",
  marine: "Marine & dockside",
  commercial: "Peak shaving & demand charges",
}

/** Derive which applications a product suits from its category (+ name hints). */
export function deriveCompatibility(categorySlug: string, name = ""): Application[] {
  const base = COMPATIBILITY_MAP[categorySlug] ?? ["home"]
  const hay = name.toLowerCase()
  const extra = new Set<Application>(base)
  // Name hints override/extend the category default.
  if (/\brv\b|van|camper|trailer/.test(hay)) extra.add("rv")
  if (/marine|boat|dock|nautical/.test(hay)) extra.add("marine")
  if (/cabin|off[-\s]?grid/.test(hay)) extra.add("cabin")
  if (/commercial|industrial|rack|server/.test(hay)) extra.add("commercial")
  if (/home|house|residential|wall/.test(hay)) extra.add("home")
  return [...extra]
}

/** Human-readable ideal use cases from a compatibility list. */
export function deriveIdealUseCases(compatibility: Application[]): string[] {
  return compatibility.map((a) => IDEAL_USE_CASES[a]).filter(Boolean)
}

/** Simple, defensible pros/cons from category + specs. */
export function deriveProsCons(input: {
  categorySlug: string
  chemistry?: string | null
  cycleLife?: number | null
  warranty?: string | null
}): { pros: string[]; cons: string[] } {
  const { categorySlug, chemistry, cycleLife, warranty } = input
  const pros: string[] = []
  const cons: string[] = []

  if (chemistry && /lifepo4|lfp/i.test(chemistry)) {
    pros.push("Safe, long-life LiFePO4 chemistry")
  } else if (chemistry) {
    pros.push(`${chemistry} cells with integrated BMS`)
  } else {
    pros.push("Integrated battery management system (BMS)")
  }

  if (cycleLife && cycleLife >= 4000) {
    pros.push(`Long cycle life (~${cycleLife.toLocaleString()} cycles)`)
  }
  if (warranty && /25/.test(warranty)) {
    pros.push("Industry-leading 25-year warranty")
  } else if (warranty && /10/.test(warranty)) {
    pros.push("10-year warranty coverage")
  }

  switch (categorySlug) {
    case "portable-power":
      pros.push("Plug-and-play, no electrician required")
      cons.push("Limited continuous output for whole-home loads")
      break
    case "solar-panels":
      pros.push("High-efficiency monocrystalline output")
      cons.push("Requires compatible inverter and mounting")
      break
    case "inverters":
      pros.push("Fast grid/battery switchover")
      cons.push("Professional installation recommended")
      break
    case "ev-chargers":
      pros.push("Smart scheduling and solar prioritization")
      cons.push("Charging pauses during outages without backup")
      break
    default: // home-batteries
      pros.push("Expandable, stackable architecture")
      cons.push("Premium price vs entry-level AGM")
      cons.push("Professional install recommended for full backup")
  }

  return { pros, cons }
}

/** One-shot helper returning all derived taxonomy fields for a product. */
export function deriveProductTaxonomy(input: {
  categorySlug: string
  name?: string
  chemistry?: string | null
  cycleLife?: number | null
  warranty?: string | null
}) {
  const compatibility = deriveCompatibility(input.categorySlug, input.name)
  return {
    compatibility,
    idealUseCases: deriveIdealUseCases(compatibility),
    ...deriveProsCons(input),
  }
}
