import React from 'react'
import Link from "next/link";

export default function MenuCard({ href, title, desc }: { href: string; title: string; desc: string }) {
    return (
        <Link
            href={href}
            className="group rounded-xl border p-3 transition hover:bg-accent"
        >
            <div className="font-medium leading-none">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            <div className="mt-3 text-sm text-primary opacity-0 transition group-hover:opacity-100">
                Explore →
            </div>
        </Link>
    )
}
