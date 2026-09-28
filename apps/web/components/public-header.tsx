"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PUBLIC_MENU } from "../lib/public-menu";
import { asLegacyMenu, loadDynamicMenu } from "../lib/dynamic-menu";
import { EmergencyButton } from "./emergency-button";

export function PublicHeader() {
  const [navigationMenu, setNavigationMenu] = useState(PUBLIC_MENU);
  useEffect(() => { void loadDynamicMenu().then((rows) => setNavigationMenu(asLegacyMenu(rows))); }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-8">
        <Link href="/" className="min-w-0 shrink-0">
          <span className="block text-base font-black tracking-tight text-slate-950 sm:text-lg">Vita Care <span className="text-teal-700">HaH</span></span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[.18em] text-slate-500 sm:block">Hospital-level care at home</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-600 lg:flex" aria-label="Navigasi publik">
          <Link href="/">Beranda</Link>
          <Link href="/direktori#tentang-kami">Tentang Kami</Link>
          <Link href="/direktori#layanan">Layanan</Link>
          <Link href="/direktori#tim-kesehatan">Tim Kesehatan</Link>
          <Link href="/direktori#pasien">Pasien</Link>
          <Link href="/direktori#monitoring-pasien">Monitoring</Link>
          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-lg px-2 py-2 hover:bg-teal-50 hover:text-teal-800">Semua Menu</summary>
            <nav aria-label="Menu lengkap" className="absolute right-0 top-12 w-[min(72rem,calc(100vw-3rem))] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">Direktori Hospital at Home</p>
              <div className="mt-4 grid grid-cols-3 gap-2 xl:grid-cols-4">
                {navigationMenu.map((group) => (
                  <Link key={group.key} href={`/direktori#${group.key}`} className="rounded-xl border border-slate-100 px-3 py-3 text-sm font-extrabold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
                    {group.label}<span className="mt-1 block text-[10px] font-semibold text-slate-400">{group.items.length} menu</span>
                  </Link>
                ))}
              </div>
            </nav>
          </details>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <details className="relative lg:hidden">
            <summary className="grid min-h-11 cursor-pointer list-none place-items-center rounded-xl border px-2.5 text-xs font-extrabold text-slate-700 sm:px-3">Menu</summary>
            <nav className="absolute right-0 mt-2 grid max-h-[70vh] w-72 gap-1 overflow-y-auto rounded-2xl border bg-white p-3 text-sm font-bold text-slate-700 shadow-xl" aria-label="Navigasi publik mobile">
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/">Beranda</Link>
              {navigationMenu.filter((group) => group.key !== "beranda").map((group) => (
                <Link key={group.key} className="rounded-lg p-3 hover:bg-teal-50" href={`/direktori#${group.key}`}>{group.label}</Link>
              ))}
              <Link className="rounded-lg bg-slate-950 p-3 text-white" href="/login">Masuk / Login</Link>
            </nav>
          </details>
          <EmergencyButton compact />
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-2.5 text-xs font-extrabold text-white sm:px-4 sm:text-sm" aria-label="Masuk atau login">Masuk<span className="hidden sm:inline"> / Login</span></Link>
        </div>
      </div>
    </header>
  );
}
