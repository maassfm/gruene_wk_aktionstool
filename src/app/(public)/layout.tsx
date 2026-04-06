import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { districtConfig } from "@/lib/district-config";
import NavAuthSection from "./NavAuthSection";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-tanne text-white sticky top-0 z-50 border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_white.png" alt="Sonnenblume" width={36} height={36} className="shrink-0" />
            <div>
              <span className="font-headline font-bold text-lg uppercase tracking-wide">
                {districtConfig.orgShortName}
              </span>
              <span className="hidden sm:inline text-sm text-white/70 ml-2">
                Wahlkampfaktionen
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavAuthSection session={session} />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-tanne text-white/70 text-sm border-t-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-bold uppercase tracking-wide">{districtConfig.orgFullName}</p>
          <div className="flex gap-4">
            {!session && (
              <Link href="/login" className="hover:text-white transition-colors uppercase tracking-wide font-bold">
                Login
              </Link>
            )}
            <Link href="/datenschutz" className="hover:text-white transition-colors uppercase tracking-wide font-bold">
              Datenschutz
            </Link>
            <Link href={districtConfig.impressumUrl} className="hover:text-white transition-colors uppercase tracking-wide font-bold">
              Impressum
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
