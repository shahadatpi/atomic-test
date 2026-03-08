export function Row({ label, description, action }: {
    label: string
    description: string
    action: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
            <div className="shrink-0 ml-4">{action}</div>
        </div>
    )
}
