// components/problems/ProblemGate.tsx
'use client'
import { useSession } from '@/lib/auth-client'

export default function ProblemGate({
                                        isFree,
                                        children,
                                    }: {
    isFree: boolean
    children: React.ReactNode
}) {
    const { data: session } = useSession()
    const isPaid = session?.user // TODO: check actual plan from DB

    if (isFree || isPaid) return <>{children}</>

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-emerald-400 text-xl">🔒</span>
            </div>
            <h3 className="text-white font-semibold">Pro Problem</h3>
            <p className="text-zinc-500 text-sm">Upgrade to access all problems, solutions and AI hints.</p>
            <button className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
                Upgrade to Pro →
            </button>
        </div>
    )
}