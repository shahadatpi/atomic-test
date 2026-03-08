import { Check, Zap, Crown } from "lucide-react"
import { Section } from "../ui/Section"

const PRO_FEATURES = [
    "Access to all 500+ problems",
    "Detailed explanations for every answer",
    "Advanced progress analytics",
    "Priority support",
]

export function SubscriptionTab() {
    return (
        <>
            <Section title="Current Plan" description="You are on the Free plan.">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-white">Free Plan</p>
                        <p className="text-xs text-zinc-500">Access to free problems only</p>
                    </div>
                    <button className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                        Upgrade to Pro ↗
                    </button>
                </div>
            </Section>

            <Section title="Pro Plan" description="Unlock everything with a Pro subscription.">
                <div className="space-y-3">
                    {PRO_FEATURES.map(feature => (
                        <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {feature}
                        </div>
                    ))}
                </div>
                <button className="w-full mt-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4" /> Upgrade Now
                </button>
            </Section>
        </>
    )
}
