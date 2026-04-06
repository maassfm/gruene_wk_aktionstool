"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: "📋" },
  { href: "/dashboard/aktionen/neu", label: "Neue Aktion", icon: "➕" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-tanne text-white sticky top-0 z-50 border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-xl"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü"
            >
              ☰
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo_white.png" alt="Sonnenblume" width={36} height={36} className="shrink-0" />
              <span className="md:hidden font-headline font-bold text-lg uppercase tracking-wide">
                {process.env.NEXT_PUBLIC_ORG_SHORT_NAME || "B90/GRÜNE Berlin-Mitte"}
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {session && (
              <span className="text-white/70 text-xs">
                {session.user.name} &middot; {isAdmin ? "Admin" : "Expert*in"}
              </span>
            )}
            <Link
              href="/dashboard"
              className={`text-sm transition-colors font-medium ${
                pathname.startsWith("/dashboard") ? "text-sonne" : "text-white/70 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm transition-colors font-medium ${
                  pathname.startsWith("/admin") ? "text-sonne" : "text-white/70 hover:text-white"
                }`}
              >
                Admin Panel
              </Link>
            )}
            <Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">
              Zur Übersicht
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside
          className={`${
            menuOpen ? "block" : "hidden"
          } md:block w-64 shrink-0 bg-white border-r-2 border-black min-h-[calc(100vh-56px)] p-4`}
        >
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-colors border-2 mb-1 ${
                  pathname === item.href
                    ? "bg-tanne text-white border-black shadow-[2px_2px_0_#000]"
                    : "text-black border-transparent hover:border-black hover:shadow-[2px_2px_0_#000]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {/* Mobile-only links */}
            <div className="md:hidden pt-2 border-t-2 border-black mt-2 space-y-1">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_#000] transition-colors text-black"
                >
                  <span>⚙️</span> Admin Panel
                </Link>
              )}
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_#000] transition-colors text-black"
              >
                <span>🌐</span> Zur Übersicht
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_#000] transition-colors text-black w-full text-left"
              >
                <span>🚪</span> Abmelden
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
