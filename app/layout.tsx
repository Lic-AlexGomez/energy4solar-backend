import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Energy4Solar API",
  description: "Backend API and admin for Energy4Solar affiliate platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0f172a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  )
}
