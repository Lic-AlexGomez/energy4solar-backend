/**
 * Seed editorial blog posts sourced from BigBattery product lines and public site messaging.
 * Run: npm run seed-blog
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i < 0) continue
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

type SeedPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  readTime: string
  featured?: boolean
  imageUrl: string
  seoTitle?: string
  metaDescription?: string
  keywords: string[]
  content: string
}

const posts: SeedPost[] = [
  {
    slug: "home-solar-lifepo4-backup-guide-2026",
    title: "Home Solar & Backup: LiFePO4 Storage in 2026",
    excerpt:
      "How grid-tied LiFePO4 batteries like BigBattery NEXUS and APEX systems deliver backup power, lower bills, and 12-year warranty peace of mind.",
    category: "Buying Guide",
    author: "Energy4Solar Team",
    readTime: "11 min read",
    featured: true,
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/04/Nexus-Apex-6.5K-Default-scaled-1.webp",
    seoTitle: "Home Solar Battery Backup Guide 2026 | LiFePO4 ESS",
    metaDescription:
      "Size grid-tied home solar storage with UL-listed LiFePO4. Compare NEXUS + APEX ESS kits, warranties, and backup runtime.",
    keywords: ["home solar battery", "grid-tied ESS", "LiFePO4", "BigBattery NEXUS"],
    content: `Homeowners are moving from noisy gas generators to clean, silent battery backup. BigBattery positions its **Home Solar & Backup** line as grid-tied, UL-certified energy storage engineered in Texas for reliability and long cycle life.

## Why LiFePO4 for home backup

Lithium iron phosphate (LiFePO4) chemistry is the default for modern home ESS because it offers:

- **4,000+ cycle life** on premium packs (vs. hundreds for lead-acid)
- Stable thermal behavior compared to older lithium chemistries
- Higher usable capacity (often 90%+ depth of discharge)
- Faster charging when paired with solar or grid power

BigBattery advertises a **12-year battery warranty** on many residential products — one of the longest in the consumer battery space.

## NEXUS + APEX: a complete ESS approach

A popular entry point is the **48V NEXUS 15 kWh battery paired with an APEX inverter** (6.5 kW or 10 kW variants). These kits bundle:

- Pre-engineered battery + inverter communication
- Off-grid and grid-tied backup modes (check local code and utility rules)
- Expansion paths as your loads grow

For shoppers comparing dollar-per-kWh, BigBattery markets itself as **best $/kWh in the USA** by selling direct and designing open-communication BMS systems without proprietary lockouts.

## What to size first

Before buying kWh, list your **critical loads** during an outage: refrigerator, router, lights, well pump, or a single HVAC circuit. A 10–15 kWh pack often covers essentials overnight; whole-home backup may need 20 kWh+ or load shedding.

Use Energy4Solar's battery calculator and product finder to match capacity to your daily kWh and desired backup days.

## Certifications that matter

Look for **UL listing**, **CEC listed systems** (California), and inverter compatibility with your existing or planned solar array. BigBattery highlights ISO 9001 certification and US-based support from Commerce, Texas.

## Bottom line

Grid-tied LiFePO4 is no longer a niche upgrade. If you want backup without fuel, prioritize warranty length, inverter integration, and honest kWh sizing — then compare kits like NEXUS + APEX against your utility's net metering and backup rules.`,
  },
  {
    slug: "off-grid-cabin-ranch-lithium-guide",
    title: "Off-Grid Power for Cabins, Ranches & Homesteads",
    excerpt:
      "True energy independence with 48V LiFePO4: sizing solar, choosing inverters, and why off-grid buyers trust BigBattery ETHOS and NEXUS systems.",
    category: "Buying Guide",
    author: "Energy4Solar Team",
    readTime: "9 min read",
    featured: true,
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/04/Nexus-Apex-10K-scaled-1.webp",
    keywords: ["off-grid solar", "cabin battery", "48V lithium", "homestead power"],
    content: `Off-grid living demands batteries that survive daily deep cycles, temperature swings, and years without grid fallback. BigBattery's **Off-Grid Power** category targets cabins, ranches, and remote homes that need dependable storage—not weekend-only camping packs.

## Off-grid vs. grid-tied backup

Grid-tied backup systems assume the utility exists most of the time. **Off-grid** systems must:

- Cover night loads entirely from stored energy
- Recover from consecutive cloudy days
- Support surge loads (pumps, compressors, shop tools)

That usually means **more kWh**, a solar array sized to recharge daily use, and a inverter/charger with enough continuous and surge watts.

## Popular BigBattery off-grid building blocks

**NEXUS 15 kWh modules** stack for higher capacity. Pair with **APEX 10K** or **EG4 12000XP** inverters for whole-structure power.

**ETHOS modules** with **FlexBOSS** hybrid inverters appeal to DIY installers who want modular, plug-and-play expansion. Customer reviews often cite straightforward installation and stable communication between modules.

## Voltage: why 48V dominates home off-grid

12V stacks are fine for RVs; **48V** reduces cable size and losses for stationary homes above ~5 kWh. BigBattery sells 12V, 24V, 36V, and 48V lines—match voltage to your inverter bank.

## Sizing rule of thumb

1. Measure or estimate **daily kWh** (kill-a-watt meters, utility bills if hybrid, or load worksheets).
2. Multiply by **days of autonomy** you want (2–3 is common off-grid).
3. Divide by usable DoD (~0.9 for LiFePO4).
4. Add **20% headroom** for inverter efficiency and battery aging.

## Support when you're remote

BigBattery offers US phone support (818-280-3091, Mon–Fri) and documents specs online—important when the nearest electrician is 60 miles away.

Off-grid is unforgiving of undersizing. Invest in measurable loads, quality BMS communication, and a warranty measured in years—not months.`,
  },
  {
    slug: "rv-van-lithium-battery-guide",
    title: "RV & Van Life: Lightweight Lithium That Actually Lasts",
    excerpt:
      "BigBattery HUSKY2 RV systems with LINKS2 control: faster charging, no watering, and real amp-hours for full-time van and RV travelers.",
    category: "Buying Guide",
    author: "Mia Rodriguez",
    readTime: "8 min read",
    imageUrl: "https://bigbattery.com/wp-content/uploads/2026/04/k0226.webp",
    keywords: ["RV lithium battery", "van life power", "HUSKY2", "12V LiFePO4"],
    content: `Full-time RV and van life push batteries harder than weekend campers. BigBattery's **RV, Van & Camper** line focuses on **lightweight LiFePO4**, fast charging, and integrated monitoring—not repurposed golf cart blocks without BMS visibility.

## Why switch from lead-acid

Lead-acid AGM batteries work until they don't: voltage sag under microwave or A/C startup, **50% usable capacity**, and weight that eats payload. LiFePO4 typically delivers:

- **Half the weight** per usable kWh
- Stable voltage under load
- 3,000–4,000+ cycles when properly charged
- No watering or corrosion maintenance

## HUSKY2 + LINKS2 control systems

BigBattery bundles **12V HUSKY2** packs (400Ah and 800Ah configurations appear in the catalog) with **Victron LINKS2** embedded screens for state-of-charge, solar input, and inverter status in one dashboard.

For DIY van builds, integrated control reduces wiring errors and gives guests a single UI instead of three apps.

## Charging sources on the road

Plan for **multi-source charging**:

- Solar (MPPT sizing to battery capacity)
- Alternator (DC-DC charger when driving)
- Shore power (converter/charger compatible with LiFePO4 profiles)

BigBattery sells **lithium-specific chargers**—using old lead-acid charge profiles can shorten LiFePO4 life.

## Space and weight budgeting

Before ordering the largest Ah pack, measure your battery box. A 12V 800Ah bank is serious energy—but only if it fits and stays within axle ratings.

## Our take

For van life and Class B/C rigs, prioritize **monitoring, charge profile compatibility, and US support**. HUSKY2-style kits trade a premium upfront price for years of maintenance-free miles.`,
  },
  {
    slug: "golf-cart-48v-lithium-upgrade",
    title: "48V Golf Cart Lithium Upgrade: EAGLE 2 Kits Explained",
    excerpt:
      "Club Car, E-Z-GO, Yamaha compatibility, heater options, and why 48V LiFePO4 EAGLE 2 kits are BigBattery best sellers.",
    category: "Reviews",
    author: "James Okonkwo",
    readTime: "7 min read",
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/04/Eagle-36V-Main-Banner-scaled-1.webp",
    keywords: ["golf cart lithium", "48V EAGLE 2", "Club Car battery", "LiFePO4 golf cart"],
    content: `Golf cart owners are among the fastest adopters of lithium—daily cycles, hill climbs, and fleet downtime make lead-acid painful. BigBattery's **EAGLE 2** line is a consistent best seller for **36V and 48V** conversions.

## What EAGLE 2 includes

Depending on SKU, kits may bundle:

- **LiFePO4 cells** with integrated BMS
- **CAN bus** communication for compatible controllers
- Optional **heaters** for cold-weather performance
- 2x or 4x configurations for extended range

The **48V 2X EAGLE 2 KIT** (64Ah, ~3.26 kWh) is marketed as a drop-in performance upgrade with financing options on BigBattery.com.

## Compatibility

BigBattery targets major cart brands: **Club Car, E-Z-GO, Yamaha**, and utility vehicles. Always verify:

- Tray dimensions and weight limits
- Controller communication (some SKUs are "No Comm")
- Charger voltage (lithium-specific 48V profile)

## Real-world benefits owners report

Customer reviews highlight **longer run time**, **faster charging**, and eliminating **water maintenance**. For commercial fleets, reduced downtime often pays back lithium in 1–2 seasons.

## Installation tips

- Torque terminal hardware to spec; loose connections are the #1 failure mode.
- Retire old lead-acid chargers—lithium needs correct CV/CC profile.
- If you operate below freezing, consider heated battery variants.

## Verdict

If your cart still runs flooded lead-acid, a quality 48V LiFePO4 kit is one of the highest ROI upgrades in recreational lithium. Compare Ah and kWh, not just upfront price.`,
  },
  {
    slug: "marine-lithium-trolling-motor-batteries",
    title: "Marine Lithium for Trolling Motors & Onboard Electronics",
    excerpt:
      "Deep-cycle LiFePO4 on the water: weight savings, 48V HUSKY 2 marine packs, and how to spec batteries for long fishing days.",
    category: "Technology",
    author: "Alex Kim",
    readTime: "6 min read",
    imageUrl: "https://bigbattery.com/wp-content/uploads/2026/04/Final.webp",
    keywords: ["marine lithium battery", "trolling motor", "48V HUSKY", "boat battery"],
    content: `Marine environments punish batteries: vibration, humidity, and all-day trolling demand deep, consistent power. BigBattery's **Marine & Boats** category emphasizes **high energy density** and **deep-cycle LiFePO4** for trolling motors and house loads.

## Why lithium on boats

- **Less weight** at the stern improves ride and fuel economy
- Holds voltage under trolling load—more thrust per amp
- No acid spills or terminal corrosion from watering

## 48V HUSKY 2 marine variants

Catalog listings include **48V HUSKY 2 INV** packs (~5.12 kWh, 100Ah) with inverter communication—suitable for RV, off-grid, and **marine** applications when properly mounted and fused.

## Installation safety

- Use **ABYC-compliant** fusing within 7 inches of battery positive where required
- Enclose batteries in ventilated compartments; LiFePO4 is safer than lead-acid but not immune to abuse
- Salt spray demands sealed connectors and periodic inspection

## Sizing trolling days

Estimate amp draw at your typical trolling speed, multiply by hours on water, add 25% reserve. Undersized banks mean slow trolling home on a dying pack.

Marine lithium is mature technology—spec the right voltage, protect the install, and enjoy full days without mid-lake voltage collapse.`,
  },
  {
    slug: "lifepo4-vs-lead-acid-cost-comparison",
    title: "LiFePO4 vs Lead-Acid: True Cost Over 10 Years",
    excerpt:
      "Purchase price is only the start. Cycle life, efficiency, weight, and maintenance flip the economics toward lithium for most daily-use applications.",
    category: "Savings",
    author: "Energy4Solar Team",
    readTime: "8 min read",
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/04/314Ah-All-Weather-6000XP-1-scaled-1.webp",
    keywords: ["LiFePO4 vs lead acid", "battery cost", "total cost of ownership"],
    content: `Lead-acid still wins on sticker price. **LiFePO4 wins on ownership cost** when you cycle batteries daily—solar homes, RVs, golf carts, and forklifts.

## Cycle life comparison

| Chemistry | Typical cycles (80% DoD) | Maintenance |
|-----------|--------------------------|-------------|
| Flooded lead-acid | 500–1,000 | Water, corrosion |
| AGM | 800–1,500 | Terminal care |
| LiFePO4 (quality) | 3,000–4,000+ | Minimal |

BigBattery warranties up to **12 years** on select lines—lead-acid rarely exceeds 2–3 year pro-rated coverage.

## Efficiency and usable kWh

Lead-acid is often limited to **50% depth of discharge**. LiFePO4 routinely allows **90%+ usable** capacity. A "100Ah" lithium bank often replaces 200Ah+ lead-acid in real workloads.

Charge efficiency is higher too—less solar wasted as heat during absorption.

## Weight and labor

Moving a 48V lead-acid set is a two-person job; lithium cuts weight dramatically. Labor and structural costs matter in RVs, boats, and mezzanine installs.

## When lead-acid still makes sense

- Rarely cycled backup (few outages per year)
- Extreme budget constraints with short ownership horizon
- Cold environments without heated lithium

For everyone else cycling daily, calculate **$/kWh delivered over warranty life**—LiFePO4 usually wins.`,
  },
  {
    slug: "battery-voltage-guide-12v-24v-48v",
    title: "12V vs 24V vs 48V: Choosing the Right Battery Voltage",
    excerpt:
      "BigBattery sells 12V through 72V lines. Here's how to match voltage to RV, home ESS, golf cart, and industrial applications.",
    category: "Technology",
    author: "Jordan Blake",
    readTime: "7 min read",
    imageUrl: "https://bigbattery.com/wp-content/uploads/2026/04/2-scaled-6.webp",
    keywords: ["48V battery", "12V vs 48V", "system voltage", "lithium sizing"],
    content: `Voltage is the foundation of every battery purchase. BigBattery organizes its catalog by application and voltage: **12V, 24V, 36V, 48V, 72V**.

## 12V — RV, marine, small solar

- Universal compatibility with automotive-style gear
- Higher current for the same watts (thicker cables)
- Best below ~3 kWh or when replacing single 12V banks

## 24V / 36V — mid-size and legacy equipment

- Common in some industrial and golf applications
- 36V EAGLE 2 kits serve specific cart platforms

## 48V — home ESS and performance carts

- Sweet spot for **home energy storage** and large inverters
- Lower current = thinner wire runs between battery and inverter
- BigBattery NEXUS, WallMount 314Ah, and many ESS kits are 48V-native

## 72V+ — industrial

Forklifts, sweepers, and commercial fleets often need higher nominal voltage for efficiency.

## Rule: match the inverter/charger

Never mix chemistries or voltages on one bus. Your battery nominal voltage must align with charger, inverter, and solar MPPT input specs.

When in doubt, BigBattery's sizing quiz and phone support can validate architecture before you buy cells.`,
  },
  {
    slug: "ethos-flexboss-home-ess-review",
    title: "ETHOS + FlexBOSS: Modular Home ESS for DIY Installers",
    excerpt:
      "Hands-on look at BigBattery's modular ETHOS cells paired with EG4 FlexBOSS hybrid inverters for expandable home storage.",
    category: "Reviews",
    author: "Sarah Chen",
    readTime: "10 min read",
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/04/314Ah-All-Weather-Flexboss18-scaled-1.webp",
    keywords: ["ETHOS battery", "FlexBOSS18", "EG4 inverter", "modular ESS"],
    content: `Modular home storage is having a moment. BigBattery's **ETHOS** battery modules combined with **EG4 FlexBOSS** hybrid inverters target homeowners and installers who want **plug-and-play expansion** without forklift-delivered monoliths.

## What's in the stack

Typical configurations pair:

- **ETHOS LiFePO4 modules** with standardized communications
- **FlexBOSS18 or FlexBOSS21** hybrid inverter/chargers
- **WallMount 314Ah** indoor or all-weather enclosures on some SKUs

Product photos show pre-wired ESS layouts aimed at reducing on-site labor.

## Why modularity matters

- Start with capacity for critical loads, add modules later
- Replace a single block instead of an entire cabinet if needed
- Easier shipping and doorway clearance vs. single 300 lb packs

## Installer feedback

BigBattery customers report **smooth commissioning** when following factory pairing steps. Communication between modules and inverter is critical—skipping firmware updates or mixing incompatible revisions causes headaches.

## All-weather vs indoor

All-weather enclosures suit garages and exterior walls in mild climates; indoor-rated packs belong in conditioned spaces. Check IP ratings and local code.

## Who should consider ETHOS + FlexBOSS

- DIY-savvy homeowners with electrician support for final connections
- Small installers standardizing on EG4 ecosystem
- Off-grid sites planning phased solar build-out

Compare total $/kWh installed—not just module MSRP—when bidding against NEXUS or competitor AC-coupled systems.`,
  },
  {
    slug: "how-to-size-home-battery-storage",
    title: "How to Size Home Battery Storage (Step-by-Step)",
    excerpt:
      "A practical worksheet: daily kWh, backup days, depth of discharge, and inverter limits—using the same math BigBattery's sizing tools employ.",
    category: "Installation",
    author: "Energy4Solar Team",
    readTime: "9 min read",
    imageUrl:
      "https://bigbattery.com/wp-content/uploads/2026/01/3x-EG4-314Ah-Indoor-12000XP-.webp",
    keywords: ["battery sizing", "kWh calculator", "home backup", "solar storage"],
    content: `Oversized batteries waste money; undersized batteries fail during the first real outage. Use this worksheet before buying any home ESS—including BigBattery NEXUS, WallMount, or ETHOS systems.

## Step 1: Daily energy use

Pull 12 months of utility kWh or use smart meter data. Divide by 30 for average daily use. Solar homeowners should use **net load** (consumption minus solar production).

## Step 2: Define backup goal

- **Critical loads only** (fridge, lights, internet): often 5–10 kWh/day
- **Whole home, selective circuits**: 15–30 kWh/day
- **Whole home, no shedding**: may exceed 30 kWh—verify inverter kW limits

## Step 3: Backup duration

Multiply daily critical kWh by **days of autonomy** (1–3). Grid outages in your region inform this number.

## Step 4: Apply depth of discharge

Divide by usable DoD (0.9 for quality LiFePO4):

**Required nameplate kWh ≈ (daily kWh × days) / DoD**

## Step 5: Check inverter power

Batteries don't run microwaves—inverters do. Ensure continuous and surge watts cover startup loads (pumps, compressors).

## Step 6: Future expansion

Modular systems (ETHOS, stacked NEXUS) reward planning extra rack space even if you buy fewer modules today.

Run your numbers in the Energy4Solar calculator, then compare recommended kWh to BigBattery kits on our shop.`,
  },
  {
    slug: "bigbattery-warranty-support-what-to-know",
    title: "BigBattery 12-Year Warranty & US Support: What Buyers Should Know",
    excerpt:
      "ISO 9001, CEC listed systems, Texas-based support, and how warranty claims actually work—based on BigBattery's public policies and customer stories.",
    category: "Buying Guide",
    author: "Energy4Solar Team",
    readTime: "6 min read",
    imageUrl: "https://bigbattery.com/wp-content/uploads/2026/05/OMNI-260-scaled.webp",
    keywords: ["BigBattery warranty", "12 year battery", "US battery support"],
    content: `A battery is a decade-long relationship. BigBattery markets a **12-year battery warranty**, **ISO 9001** certification, **CEC listed** systems, and **US-based support** from Commerce, Texas.

## What the warranty signals

Long warranties only matter if the company honors them. Public reviews describe warranty replacements coordinated by phone—important for heavy inverters and ESS gear that's expensive to ship.

Always register your product and retain proof of purchase.

## Support channels

- **Phone:** (818) 280-3091 (sales & support, Mon–Fri business hours PT)
- **Email:** support@bigbattery.com
- **Live chat** on bigbattery.com (typically fast response)

## Engineering claims

BigBattery emphasizes **American engineering**, **open-communication BMS**, and **universal compatibility** with major inverter brands—reducing vendor lock-in compared to closed ecosystems.

## Industrial scale

Products like the **OMNI-260 C&I** (~261 kWh / 125 kW) show BigBattery isn't only consumer golf carts—the same LiFePO4 expertise scales to commercial backup.

## Before you buy through Energy4Solar

We link to BigBattery as an affiliate partner. Our editorial sizing and comparison tools are independent—we recommend documenting your load list and verifying SKU specs on BigBattery.com before checkout.`,
  },
]

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  const now = new Date()

  let created = 0
  let updated = 0

  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } })
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      imageUrl: post.imageUrl,
      category: post.category,
      author: post.author,
      readTime: post.readTime,
      featured: post.featured ?? false,
      published: true,
      publishedAt: existing?.publishedAt ?? now,
      seoTitle: post.seoTitle ?? null,
      metaDescription: post.metaDescription ?? null,
      keywords: post.keywords,
    }

    if (existing) {
      await prisma.blogPost.update({ where: { slug: post.slug }, data })
      updated += 1
    } else {
      await prisma.blogPost.create({ data: { slug: post.slug, ...data } })
      created += 1
    }
  }

  const total = await prisma.blogPost.count({ where: { published: true } })
  console.log(`[seed-blog] Created: ${created}, updated: ${updated}. Published total: ${total}`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
