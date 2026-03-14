"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const isAdmin = (session?.user as any)?.role === "admin"

  useEffect(() => {
    if (isPending) return
    if (!session) { router.push("/login"); return }
    if (!isAdmin)  { router.push("/dashboard") }
  }, [session, isPending, isAdmin, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" >
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Access Denied</p>
          <p className="text-muted-foreground text-sm">Admin access required.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 px-4 py-2 bg-accent text-foreground rounded-lg text-sm hover:bg-accent/80 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
