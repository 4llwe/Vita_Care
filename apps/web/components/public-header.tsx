"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fallbackDynamicMenu,
  loadDynamicMenu,
  type DynamicMenuGroup,
} from "../lib/dynamic-menu";
import { publicItemHref } from "../lib/public-menu";
import { EmergencyButton } from "./emergency-button";

export function PublicHeader() {
  const [navigationMenu, setNavigationMenu] =
    useState<DynamicMenuGroup[]>(fallbackDynamicMenu);

  useEffect(() => {
    void loadDynamicMenu().then(setNavigationMenu);
  }, []);

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
            <nav aria-label="Menu lengkap" className="absolute right-0 top-12 max-h-[75vh] w-[min(76rem,calc(100vw-3rem))] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">Direktori Hospital at Home</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Seluruh halaman publik dan akses layanan dalam satu navigasi.</p>
                </div>
                <Link href="/direktori" className="shrink-0 text-xs font-black text-teal-700 hover:text-teal-900">Buka direktori →</Link>
              </div>
              <div className="mt-5 grid grid-cols-3 items-start gap-3 xl:grid-cols-4">
                {navigationMenu.map((group) => (
                  <section key={group.key} className="rounded-2xl border border-slate-100 p-3">
                    <Link href={`/direktori#${group.key}`} className="text-sm font-black text-slate-900 hover:text-teal-800">
                      {group.label}
                    </Link>
                    <ul className="mt-2 space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={publicItemHref(group.key, item)}
                            className="block rounded-lg px-2 py-1.5 text-xs font-semibold leading-5 text-slate-500 hover:bg-teal-50 hover:text-teal-800"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>
          </details>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <details className="relative lg:hidden">
            <summary className="grid min-h-11 cursor-pointer list-none place-items-center rounded-xl border px-2.5 text-xs font-extrabold text-slate-700 sm:px-3">Menu</summary>
            <nav className="absolute right-0 mt-2 grid max-h-[72vh] w-[min(22rem,calc(100vw-1.5rem))] gap-1 overflow-y-auto rounded-2xl border bg-white p-3 text-sm font-bold text-slate-700 shadow-xl" aria-label="Navigasi publik mobile">
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/">Beranda</Link>
              {navigationMenu.map((group) => (
                <details key={group.key} className="rounded-xl border border-slate-100">
                  <summary
                    aria-label={`Buka menu ${group.label}`}
                    className="cursor-pointer list-none rounded-xl p-3 hover:bg-teal-50"
                  >
                    <span className="flex items-center justify-between gap-3">
                      {group.label}
                      <span aria-hidden="true" className="text-teal-700">+</span>
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 p-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                        href={publicItemHref(group.key, item)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link className="mt-1 block rounded-lg px-3 py-2 text-xs font-black text-teal-700" href={`/direktori#${group.key}`}>
                      Lihat bagian {group.label} →
                    </Link>
                  </div>
                </details>
              ))}
              <Link className="rounded-lg p-3 text-teal-800 hover:bg-teal-50" href="/direktori">Semua halaman</Link>
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
