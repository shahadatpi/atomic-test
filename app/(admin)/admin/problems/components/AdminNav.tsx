import Link from "next/link";
import { LayoutDashboard, ListTodo, PlusCircle, Upload } from "lucide-react";

type Page = "problems" | "add-problem" | "bulk-import";

interface NavLink {
  id:    Page;
  href:  string;
  label: string;
  icon:  React.ElementType;
}

const LINKS: NavLink[] = [
  { id: "problems",    href: "/admin/problems",    label: "Problems",    icon: ListTodo   },
  { id: "add-problem", href: "/admin/add-problem", label: "Add Problem", icon: PlusCircle },
  { id: "bulk-import", href: "/admin/bulk-import", label: "Bulk Import", icon: Upload      },
];

const pill =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all";
const activePill =
  `${pill} text-violet-400 bg-violet-500/10 border-violet-500/20`;
const inactivePill =
  `${pill} text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700`;

export default function AdminNav({ current }: { current: Page }) {
  return (
    <nav className="flex items-center gap-1 flex-wrap">

      {/* Dashboard */}
      <Link href="/dashboard" className={inactivePill}>
        <LayoutDashboard className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <span className="text-zinc-700 text-xs">/</span>

      {LINKS.map((link, i) => {
        const Icon = link.icon;
        return (
          <span key={link.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-zinc-700 text-xs">/</span>}
            {link.id === current ? (
              <span className={activePill}>
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </span>
            ) : (
              <Link href={link.href} className={inactivePill}>
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
