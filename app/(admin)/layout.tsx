import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminLayout({
                                            children,
                                          }: {
  children: React.ReactNode
}) {
  // Full session check (hits database)
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Not logged in → go to login
  if (!session) {
    redirect("/login?callbackUrl=/admin")
  }

  // Logged in but not admin → go to dashboard
  // session.user.role comes from the role column we added
  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
      <div className="min-h-screen bg-zinc-950">
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
            ADMIN
          </span>
            <span className="text-sm text-zinc-400">AtomicTest Console</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/problems"    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Problems</a>
            <a href="/admin/add-problem" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Add Problem</a>
            <a href="/dashboard"         className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← Back to App</a>
            <span className="text-xs text-zinc-600">{session.user.email}</span>
          </div>
        </div>
        {children}
      </div>
  )
}
