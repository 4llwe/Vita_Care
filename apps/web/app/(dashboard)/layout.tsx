import Link from "next/link";
import { Sidebar } from "../../components/sidebar";
import { RequireAuth } from "../../components/require-auth";
import { EmergencyButton } from "../../components/emergency-button";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { MobileNav } from "../../components/mobile-nav";
import { LogoutButton } from "../../components/logout-button";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 lg:px-6">
            <Link href="/dashboard">
              <span className="font-black tracking-tight text-slate-950">
                Vita Care <span className="text-teal-700">Hospital At Home</span>
              </span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 sm:block">
                Mataram · Lombok · Clinical operations
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/notifications"
                className="hidden rounded-xl border px-3 py-2 text-sm font-bold text-slate-600 sm:block"
              >
                Notifikasi klinis
              </Link>
              <EmergencyButton />
              <LogoutButton />
            </div>
          </div>
        </header>
        <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-5 lg:px-6">
          <Sidebar />
          <main className="min-w-0 flex-1 pb-24 md:pb-8">
            <Breadcrumbs />
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </RequireAuth>
  );
}
