export function Section({ title, description, children }: {
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    )
}
