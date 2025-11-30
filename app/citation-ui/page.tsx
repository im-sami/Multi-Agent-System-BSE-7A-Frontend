"use client"

import Link from "next/link"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"

export default function CitationUIPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Citation Manager</h1>
          <Link href="/agents">
            <Button variant="outline">Back to Directory</Button>
          </Link>
        </div>
        <div className="flex-1 p-4">
          <div className="w-full h-full border rounded-md overflow-hidden">
            <iframe
              src="/citation-manager-ui/build/index.html"
              title="Citation Manager UI"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
