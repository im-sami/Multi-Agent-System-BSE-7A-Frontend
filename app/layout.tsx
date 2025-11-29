import AuthGuard from "@/components/auth-guard"
import ClientShell from "@/components/client-shell"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Education & Learning Agents",
  description: "Multi-agent system for educational assistance and learning support",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <AuthGuard>
            <ClientShell>{children}</ClientShell>
          </AuthGuard>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
