import Link from "next/link";

const FOOTER_LINKS = ["Terms", "Privacy", "Contact", "Docs"];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-6 md:px-12 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
            <span className="text-zinc-950 text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight">AtomicTest</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {l}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-xs text-zinc-700 font-mono">
          © {new Date().getFullYear()} AtomicTest. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
