import Link from "next/link"
import { LayoutDashboard, Zap, Users, Upload, ChevronRight } from "lucide-react"
import { Section } from "../ui/Section"
import { Row }     from "../ui/Row"

const ADMIN_TOOLS = [
    { href: "/admin/problems",    icon: LayoutDashboard, label: "Manage Problems", desc: "Edit, delete, filter problems" },
    { href: "/admin/add-problem", icon: Zap,             label: "Add New Problem", desc: "Create a new MCQ problem" },
    { href: "/admin/users",       icon: Users,           label: "Manage Users",    desc: "View users, change roles" },
    { href: "/admin/bulk-import",  icon: Upload,          label: "Bulk Import",     desc: "Paste questions, fill details later" },
]

interface AdminTabProps {
    totalUsers:    number
    totalProblems: number
}

export function AdminTab({ totalUsers, totalProblems }: AdminTabProps) {
    return (
        <>
            <Section title="Platform Overview" description="Quick stats about your platform.">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                        <p className="text-2xl font-bold text-white">{totalUsers}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Registered users</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                        <p className="text-2xl font-bold text-white">{totalProblems}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Total problems</p>
                    </div>
                </div>
            </Section>

            <Section title="Admin Tools" description="Quick access to admin features.">
                <div className="space-y-2">
                    {ADMIN_TOOLS.map(({ href, icon: Icon, label, desc }) => (
                        <Link key={href} href={href}
                              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{label}</p>
                                <p className="text-xs text-zinc-500">{desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                    ))}
                </div>
            </Section>

            <Section title="Your Admin Role">
                <Row
                    label="Role"
                    description="You have full admin access to this platform"
                    action={
                        <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2.5 py-1 rounded-full">
                            admin
                        </span>
                    }
                />
                <p className="text-xs text-zinc-600">
                    To change user roles, go to{" "}
                    <Link href="/admin/users" className="text-violet-400 hover:underline">Manage Users</Link>
                    {" "}or run an SQL update in Supabase.
                </p>
            </Section>
        </>
    )
}
