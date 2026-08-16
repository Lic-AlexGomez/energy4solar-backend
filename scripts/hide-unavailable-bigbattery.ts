/**
 * Hide storefront products whose BigBattery product pages 404.
 * Source list: energy4solar-j0/scripts/check-bigbattery-links.mjs (2026-08-16).
 *
 *   npx tsx scripts/hide-unavailable-bigbattery.ts
 */
import { loadEnvFile } from "./load-env"

loadEnvFile(".env", true)

const SKUS = [
  "FEWMT-48143-G1",
  "INV020",
  "INV038",
  "INV039",
  "INV044",
  "INV045",
  "K0106",
  "K0107",
  "K0108",
  "K0109",
  "K0110",
  "K0111",
  "K0112",
  "K0113",
  "K0120",
  "K0121",
  "K0122",
  "K0123",
  "K0124",
  "K0125",
  "K0126",
  "K0127",
  "K0131",
  "K0132",
  "K0133",
  "K0140",
  "K0141",
  "K0164",
  "K0169",
  "K0170",
  "K0171",
  "K0172",
  "K0173",
  "K0174",
  "K0175",
  "K0176",
  "K0177",
  "K0178",
  "K0264",
  "K0265",
  "K0266",
  "K0267",
  "K0753",
  "K0754",
  "K0755",
  "K0764",
  "K0952",
  "K0954",
  "K0955",
  "K0956",
  "K0957",
  "K0959",
  "K0960",
  "K0961",
  "K0962",
  "K0964",
  "K0966",
  "K0967",
  "K0968",
  "MHOME-INV010",
  "MHOME-K001",
  "MHOME-K002",
  "MHOME-K003",
  "OMNI-250-G1-UL",
  "OMNI-255M-G1",
  "OMNI-255M-G1-CE",
  "OMNI-260-G1-CE",
  "APEX-260-G1-CE",
  "RF-FEWPP-48143-G1-A",
  "RF-FEWPP-48143-G1-B",
  "RF-INV024-A",
  "RF-INV024-B",
  "RF-INV024-C",
  "RF-INV027-A",
  "RF-INV027-B",
  "RF-INV028-A",
  "RF-INV031-A",
  "F-NXUS2-48161-G1",
  "FSOL-ARK-HV-40",
  "FSOL-ARK-HV-60",
  "FSOL-ARK-HVR-60",
  "INV036-EU",
  "INV037-EU",
  "INV040",
  "INV042",
  "INV043",
]

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  const result = await prisma.product.updateMany({
    where: {
      isVisible: true,
      OR: [
        { sku: { in: SKUS, mode: "insensitive" } },
        { name: { in: SKUS, mode: "insensitive" } },
        { slug: { in: SKUS.map((s) => s.toLowerCase()) } },
      ],
    },
    data: { isVisible: false },
  })
  console.log(`Hid ${result.count} visible products that 404 on BigBattery`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
