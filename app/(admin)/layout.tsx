"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const isAdmin = (session?.user as any)?.role === "admin"

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login")
      return
    }
    if (!isPending && session && !isAdmin) {
      router.push("/dashboard")
    }
  }, [session, isPending, isAdmin, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Access Denied</p>
          <p className="text-zinc-500 text-sm">Admin access required.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
